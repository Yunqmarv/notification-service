const rateLimit = require('express-rate-limit');
const RedisManager = require('../config/redis');
const Logger = require('../utils/logger');
const SettingsService = require('../services/settings');
const MetricsCollector = require('../services/metrics');

class RateLimitService {
    constructor() {
        this.limiters = new Map();
        this.defaultConfig = {
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 1000, // Limit each IP to 1000 requests per windowMs
            standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
            legacyHeaders: false, // Disable the `X-RateLimit-*` headers
        };
    }

    /**
     * Create Redis store for rate limiting
     */
    createRedisStore() {
        return {
            incr: async (key) => {
                try {
                    const client = RedisManager.client;
                    const current = await client.incr(`rate_limit:${key}`);
                    
                    if (current === 1) {
                        // Set expiration on first increment
                        await client.expire(`rate_limit:${key}`, Math.ceil(this.defaultConfig.windowMs / 1000));
                    }
                    
                    return {
                        totalHits: current,
                        resetTime: new Date(Date.now() + this.defaultConfig.windowMs)
                    };
                } catch (error) {
                    Logger.error('Redis rate limit error:', error);
                    // Fallback to allowing the request
                    return { totalHits: 0, resetTime: new Date() };
                }
            },
            decrement: async (key) => {
                try {
                    await RedisManager.client.decr(`rate_limit:${key}`);
                } catch (error) {
                    Logger.error('Redis rate limit decrement error:', error);
                }
            },
            resetKey: async (key) => {
                try {
                    await RedisManager.client.del(`rate_limit:${key}`);
                } catch (error) {
                    Logger.error('Redis rate limit reset error:', error);
                }
            }
        };
    }

    /**
     * Create a general rate limiter
     */
    createLimiter(options = {}) {
        const config = {
            ...this.defaultConfig,
            windowMs: SettingsService.get('rateLimit.windowMs', this.defaultConfig.windowMs),
            max: SettingsService.get('rateLimit.max', this.defaultConfig.max),
            ...options
        };

        // Use Redis store if available
        if (RedisManager.isConnected) {
            config.store = this.createRedisStore();
        }

        // Custom key generator to include user ID
        config.keyGenerator = (req) => {
            return req.userId ? `user:${req.userId}` : `ip:${req.ip}`;
        };

        // Custom skip function
        config.skip = (req) => {
            // Skip rate limiting for health checks
            if (req.path === '/health' || req.path === '/metrics') {
                return true;
            }
            
            // Skip for admin users
            if (req.userRole && ['admin', 'super_admin'].includes(req.userRole)) {
                return true;
            }
            
            return false;
        };

        // Custom handler for rate limit exceeded
        config.handler = (req, res) => {
            Logger.logSecurityEvent('rate_limit_exceeded', req.userId, req.ip, {
                path: req.path,
                method: req.method,
                limit: config.max,
                window: config.windowMs
            });

            MetricsCollector.recordRateLimitExceeded(req.path, req.userId);

            res.status(429).json({
                success: false,
                message: 'Too many requests, please try again later',
                code: 'RATE_LIMIT_EXCEEDED',
                retryAfter: Math.ceil(config.windowMs / 1000),
                limit: config.max,
                window: config.windowMs,
                timestamp: new Date().toISOString()
            });
        };

        // Use handler instead of deprecated onLimitReached
        config.handler = (req, res) => {
            Logger.warn('Rate limit reached', {
                userId: req.userId,
                ip: req.ip,
                path: req.path,
                limit: config.max,
                window: config.windowMs
            });
            
            // Call default handler
            res.status(429).json(config.message);
        };

        return rateLimit(config);
    }

    /**
     * Create API-specific rate limiters
     */
    createApiLimiters() {
        // Notification creation limiter (stricter)
        this.limiters.set('notification_create', this.createLimiter({
            windowMs: 5 * 60 * 1000, // 5 minutes
            max: 100, // 100 notifications per 5 minutes
            message: 'Too many notifications created, please slow down'
        }));

        // Notification reading limiter (more lenient)
        this.limiters.set('notification_read', this.createLimiter({
            windowMs: 1 * 60 * 1000, // 1 minute
            max: 200, // 200 reads per minute
            message: 'Too many read requests, please slow down'
        }));

        // Settings update limiter (very strict)
        this.limiters.set('settings_update', this.createLimiter({
            windowMs: 10 * 60 * 1000, // 10 minutes
            max: 20, // 20 updates per 10 minutes
            message: 'Too many settings updates, please wait'
        }));

        // Authentication limiter (very strict)
        this.limiters.set('auth', this.createLimiter({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 10, // 10 attempts per 15 minutes
            message: 'Too many authentication attempts, please wait'
        }));

        // Analytics limiter
        this.limiters.set('analytics', this.createLimiter({
            windowMs: 1 * 60 * 1000, // 1 minute
            max: 30, // 30 analytics requests per minute
            message: 'Too many analytics requests, please slow down'
        }));

        // Admin operations limiter
        this.limiters.set('admin', this.createLimiter({
            windowMs: 5 * 60 * 1000, // 5 minutes
            max: 50, // 50 admin operations per 5 minutes
            message: 'Too many admin operations, please slow down'
        }));

        // Bulk operations limiter
        this.limiters.set('bulk', this.createLimiter({
            windowMs: 10 * 60 * 1000, // 10 minutes
            max: 10, // 10 bulk operations per 10 minutes
            message: 'Too many bulk operations, please wait'
        }));
    }

    /**
     * Get rate limiter by name
     */
    getLimiter(name) {
        return this.limiters.get(name) || this.createLimiter();
    }

    /**
     * Middleware factory for specific endpoints
     */
    forEndpoint(endpointName, customOptions = {}) {
        return (req, res, next) => {
            const limiter = this.limiters.get(endpointName) || this.createLimiter(customOptions);
            return limiter(req, res, next);
        };
    }

    /**
     * Create user-specific rate limiter
     */
    createUserLimiter(userId, options = {}) {
        const config = {
            ...this.defaultConfig,
            ...options,
            keyGenerator: () => `user:${userId}`,
            skip: () => false // Don't skip for specific user limiters
        };

        return rateLimit(config);
    }

    /**
     * Create IP-specific rate limiter
     */
    createIpLimiter(options = {}) {
        const config = {
            ...this.defaultConfig,
            ...options,
            keyGenerator: (req) => `ip:${req.ip}`,
            skip: (req) => req.userId && ['admin', 'super_admin'].includes(req.userRole)
        };

        return rateLimit(config);
    }

    /**
     * Progressive rate limiting based on user behavior
     */
    createProgressiveLimiter(options = {}) {
        return async (req, res, next) => {
            const userId = req.userId;
            const ip = req.ip;
            const key = userId ? `user:${userId}` : `ip:${ip}`;

            try {
                // Check violation history
                const violationKey = `violations:${key}`;
                const violations = await RedisManager.get(violationKey) || 0;

                // Adjust limits based on violation history
                let maxRequests = options.max || 1000;
                let windowMs = options.windowMs || 15 * 60 * 1000;

                if (violations > 0) {
                    maxRequests = Math.max(maxRequests - (violations * 100), 10);
                    windowMs = Math.min(windowMs + (violations * 5 * 60 * 1000), 60 * 60 * 1000);
                }

                const limiter = this.createLimiter({
                    max: maxRequests,
                    windowMs: windowMs,
                    handler: async (req, res) => {
                        // Increment violation count
                        await RedisManager.set(violationKey, violations + 1, 24 * 60 * 60); // 24 hours
                        
                        Logger.warn('Progressive rate limit reached', {
                            key,
                            violations: violations + 1,
                            newLimit: maxRequests,
                            newWindow: windowMs
                        });
                        
                        // Send response
                        res.status(429).json({
                            success: false,
                            message: 'Rate limit exceeded - progressive enforcement',
                            retryAfter: Math.ceil(windowMs / 1000),
                            violations: violations + 1
                        });
                    }
                });

                return limiter(req, res, next);
            } catch (error) {
                Logger.error('Progressive rate limiter error:', error);
                // Fallback to basic limiter
                const fallbackLimiter = this.createLimiter(options);
                return fallbackLimiter(req, res, next);
            }
        };
    }

    /**
     * Clear rate limit for a key
     */
    async clearRateLimit(key) {
        try {
            await RedisManager.del(`rate_limit:${key}`);
            return true;
        } catch (error) {
            Logger.error('Error clearing rate limit:', error);
            return false;
        }
    }

    /**
     * Get rate limit status for a key
     */
    async getRateLimitStatus(key) {
        try {
            const value = await RedisManager.get(`rate_limit:${key}`);
            const ttl = await RedisManager.ttl(`rate_limit:${key}`);
            
            return {
                hits: value || 0,
                resetTime: ttl > 0 ? new Date(Date.now() + (ttl * 1000)) : null,
                remaining: Math.max(this.defaultConfig.max - (value || 0), 0)
            };
        } catch (error) {
            Logger.error('Error getting rate limit status:', error);
            return null;
        }
    }

    /**
     * Initialize rate limiters
     */
    initialize() {
        this.createApiLimiters();
        Logger.info('✅ Rate limit service initialized');
    }

    /**
     * Health check
     */
    async healthCheck() {
        try {
            // Test Redis connection for rate limiting
            if (RedisManager.isConnected) {
                const testKey = 'health_check_rate_limit';
                await RedisManager.set(testKey, '1', 60);
                await RedisManager.del(testKey);
            }

            return {
                status: 'healthy',
                message: 'Rate limit service is healthy',
                limitersCount: this.limiters.size,
                redisConnected: RedisManager.isConnected
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                message: 'Rate limit service health check failed',
                error: error.message
            };
        }
    }

    /**
     * Get rate limiting statistics
     */
    async getStats() {
        try {
            const stats = {
                limitersConfigured: this.limiters.size,
                redisConnected: RedisManager.isConnected,
                defaultConfig: this.defaultConfig
            };

            if (RedisManager.isConnected) {
                // Get Redis memory usage for rate limiting keys
                const keys = await RedisManager.client.keys('rate_limit:*');
                stats.activeKeys = keys.length;
            }

            return stats;
        } catch (error) {
            Logger.error('Error getting rate limit stats:', error);
            return null;
        }
    }
}

module.exports = new RateLimitService();
