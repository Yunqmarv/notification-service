const RedisManager = require('../config/redis');
const Logger = require('../utils/logger');

class CacheService {
    constructor() {
        this.defaultTTL = 3600; // 1 hour
        this.prefix = 'notification_service:';
    }

    /**
     * Generate cache key with prefix
     */
    key(suffix) {
        return `${this.prefix}${suffix}`;
    }

    /**
     * Set cache value
     */
    async set(key, value, ttl = this.defaultTTL) {
        try {
            const cacheKey = this.key(key);
            await RedisManager.set(cacheKey, value, ttl);
            Logger.logCacheOperation('SET', cacheKey);
            return true;
        } catch (error) {
            Logger.error('Cache SET error:', error, { key });
            return false;
        }
    }

    /**
     * Get cache value
     */
    async get(key) {
        try {
            const cacheKey = this.key(key);
            const value = await RedisManager.get(cacheKey);
            Logger.logCacheOperation('GET', cacheKey, value !== null);
            return value;
        } catch (error) {
            Logger.error('Cache GET error:', error, { key });
            return null;
        }
    }

    /**
     * Delete cache value
     */
    async del(key) {
        try {
            const cacheKey = this.key(key);
            const result = await RedisManager.del(cacheKey);
            Logger.logCacheOperation('DEL', cacheKey);
            return result;
        } catch (error) {
            Logger.error('Cache DEL error:', error, { key });
            return 0;
        }
    }

    /**
     * Check if key exists
     */
    async exists(key) {
        try {
            const cacheKey = this.key(key);
            return await RedisManager.exists(cacheKey);
        } catch (error) {
            Logger.error('Cache EXISTS error:', error, { key });
            return false;
        }
    }

    /**
     * Set expiration time
     */
    async expire(key, ttl) {
        try {
            const cacheKey = this.key(key);
            return await RedisManager.expire(cacheKey, ttl);
        } catch (error) {
            Logger.error('Cache EXPIRE error:', error, { key });
            return false;
        }
    }

    /**
     * Get TTL
     */
    async ttl(key) {
        try {
            const cacheKey = this.key(key);
            return await RedisManager.ttl(cacheKey);
        } catch (error) {
            Logger.error('Cache TTL error:', error, { key });
            return -1;
        }
    }

    /**
     * Clear cache pattern
     */
    async clearPattern(pattern) {
        try {
            const cachePattern = this.key(pattern);
            const result = await RedisManager.flushPattern(cachePattern);
            Logger.logCacheOperation('FLUSH_PATTERN', cachePattern);
            return result;
        } catch (error) {
            Logger.error('Cache clear pattern error:', error, { pattern });
            return 0;
        }
    }

    /**
     * Hash operations
     */
    async hset(key, field, value) {
        try {
            const cacheKey = this.key(key);
            return await RedisManager.hset(cacheKey, field, value);
        } catch (error) {
            Logger.error('Cache HSET error:', error, { key, field });
            return false;
        }
    }

    async hget(key, field) {
        try {
            const cacheKey = this.key(key);
            return await RedisManager.hget(cacheKey, field);
        } catch (error) {
            Logger.error('Cache HGET error:', error, { key, field });
            return null;
        }
    }

    async hgetall(key) {
        try {
            const cacheKey = this.key(key);
            return await RedisManager.hgetall(cacheKey);
        } catch (error) {
            Logger.error('Cache HGETALL error:', error, { key });
            return {};
        }
    }

    async hdel(key, field) {
        try {
            const cacheKey = this.key(key);
            return await RedisManager.hdel(cacheKey, field);
        } catch (error) {
            Logger.error('Cache HDEL error:', error, { key, field });
            return 0;
        }
    }

    /**
     * List operations
     */
    async lpush(key, ...values) {
        try {
            const cacheKey = this.key(key);
            return await RedisManager.lpush(cacheKey, ...values);
        } catch (error) {
            Logger.error('Cache LPUSH error:', error, { key });
            return 0;
        }
    }

    async rpop(key) {
        try {
            const cacheKey = this.key(key);
            return await RedisManager.rpop(cacheKey);
        } catch (error) {
            Logger.error('Cache RPOP error:', error, { key });
            return null;
        }
    }

    async llen(key) {
        try {
            const cacheKey = this.key(key);
            return await RedisManager.llen(cacheKey);
        } catch (error) {
            Logger.error('Cache LLEN error:', error, { key });
            return 0;
        }
    }

    /**
     * Set operations
     */
    async sadd(key, ...members) {
        try {
            const cacheKey = this.key(key);
            return await RedisManager.sadd(cacheKey, ...members);
        } catch (error) {
            Logger.error('Cache SADD error:', error, { key });
            return 0;
        }
    }

    async sismember(key, member) {
        try {
            const cacheKey = this.key(key);
            return await RedisManager.sismember(cacheKey, member);
        } catch (error) {
            Logger.error('Cache SISMEMBER error:', error, { key });
            return false;
        }
    }

    async smembers(key) {
        try {
            const cacheKey = this.key(key);
            return await RedisManager.smembers(cacheKey);
        } catch (error) {
            Logger.error('Cache SMEMBERS error:', error, { key });
            return [];
        }
    }

    /**
     * Increment operations
     */
    async incr(key) {
        try {
            const cacheKey = this.key(key);
            return await RedisManager.client.incr(cacheKey);
        } catch (error) {
            Logger.error('Cache INCR error:', error, { key });
            return 0;
        }
    }

    async incrby(key, increment) {
        try {
            const cacheKey = this.key(key);
            return await RedisManager.client.incrby(cacheKey, increment);
        } catch (error) {
            Logger.error('Cache INCRBY error:', error, { key });
            return 0;
        }
    }

    /**
     * Multi-level cache operations
     */
    async mget(keys) {
        try {
            const cacheKeys = keys.map(key => this.key(key));
            const values = await RedisManager.client.mget(cacheKeys);
            
            const result = {};
            keys.forEach((key, index) => {
                const value = values[index];
                if (value !== null) {
                    try {
                        result[key] = JSON.parse(value);
                    } catch {
                        result[key] = value;
                    }
                }
            });
            
            return result;
        } catch (error) {
            Logger.error('Cache MGET error:', error, { keys });
            return {};
        }
    }

    async mset(keyValuePairs, ttl = this.defaultTTL) {
        try {
            const pipeline = RedisManager.client.pipeline();
            
            Object.entries(keyValuePairs).forEach(([key, value]) => {
                const cacheKey = this.key(key);
                const serializedValue = typeof value === 'object' ? JSON.stringify(value) : value;
                
                if (ttl) {
                    pipeline.setex(cacheKey, ttl, serializedValue);
                } else {
                    pipeline.set(cacheKey, serializedValue);
                }
            });
            
            const results = await pipeline.exec();
            return results.every(([error]) => !error);
        } catch (error) {
            Logger.error('Cache MSET error:', error);
            return false;
        }
    }

    /**
     * Cache warming utilities
     */
    async warmCache(userId) {
        try {
            // This could be used to pre-populate cache for active users
            Logger.debug(`Cache warming requested for user: ${userId}`);
            // Implementation would depend on specific warming strategies
        } catch (error) {
            Logger.error('Cache warming error:', error, { userId });
        }
    }

    /**
     * Cache statistics
     */
    async getStats() {
        try {
            const info = await RedisManager.getMemoryUsage();
            const connectionState = RedisManager.getConnectionState();
            
            return {
                connection: connectionState,
                memory: info,
                prefix: this.prefix,
                defaultTTL: this.defaultTTL
            };
        } catch (error) {
            Logger.error('Error getting cache stats:', error);
            return null;
        }
    }

    /**
     * Health check
     */
    async healthCheck() {
        try {
            const testKey = 'health_check_test';
            const testValue = { timestamp: Date.now() };
            
            // Test basic operations
            await this.set(testKey, testValue, 60);
            const retrieved = await this.get(testKey);
            await this.del(testKey);
            
            const isHealthy = retrieved && retrieved.timestamp === testValue.timestamp;
            
            return {
                status: isHealthy ? 'healthy' : 'unhealthy',
                message: isHealthy ? 'Cache service is healthy' : 'Cache service test failed',
                connection: RedisManager.getConnectionState()
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                message: 'Cache service health check failed',
                error: error.message
            };
        }
    }
}

module.exports = new CacheService();
