const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const Logger = require('../utils/logger');
const SettingsService = require('../services/settings');
const MetricsCollector = require('../services/metrics');

class ValidationMiddleware {
    /**
     * Handle express-validator validation results
     */
    static handleValidation(req, res, next) {
        const errors = validationResult(req);
        
        if (!errors.isEmpty()) {
            const errorDetails = errors.array().map(error => ({
                field: error.param,
                message: error.msg,
                value: error.value
            }));

            Logger.warn('Validation failed', {
                userId: req.userId,
                path: req.path,
                method: req.method,
                errors: errorDetails
            });

            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errorDetails
            });
        }

        next();
    }

    /**
     * Authenticate JWT token
     */
    static async authenticate(req, res, next) {
        try {
            const authHeader = req.headers.authorization;
            
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                Logger.logSecurityEvent('missing_auth_token', null, req.ip, {
                    path: req.path,
                    userAgent: req.get('User-Agent')
                });

                return res.status(401).json({
                    success: false,
                    message: 'Authentication required',
                    code: 'MISSING_TOKEN'
                });
            }

            const token = authHeader.substring(7); // Remove 'Bearer ' prefix
            
            if (!token) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication token required',
                    code: 'EMPTY_TOKEN'
                });
            }

            // Get JWT secret from settings with fallback
            const jwtSecret = SettingsService.get('security.jwtSecret') || process.env.JWT_SECRET || 'fallback-secret-for-testing';
            
            if (!jwtSecret) {
                Logger.error('JWT secret not configured');
                return res.status(500).json({
                    success: false,
                    message: 'Authentication configuration error'
                });
            }

            // Verify token with timeout
            let decoded;
            try {
                decoded = jwt.verify(token, jwtSecret);
            } catch (jwtError) {
                Logger.logSecurityEvent('invalid_token', null, req.ip, {
                    path: req.path,
                    error: jwtError.message
                });

                return res.status(401).json({
                    success: false,
                    message: 'Invalid authentication token',
                    code: 'INVALID_TOKEN'
                });
            }
            
            if (!decoded.userId) {
                Logger.logSecurityEvent('invalid_token_payload', null, req.ip, {
                    path: req.path,
                    tokenPayload: decoded
                });

                return res.status(401).json({
                    success: false,
                    message: 'Invalid token payload',
                    code: 'INVALID_PAYLOAD'
                });
            }

            // Add user info to request
            req.userId = decoded.userId;
            req.userRole = decoded.role || 'user';
            req.tokenExp = decoded.exp;
            req.tokenIat = decoded.iat;

            // Check token expiration
            const now = Math.floor(Date.now() / 1000);
            if (decoded.exp && decoded.exp < now) {
                Logger.logSecurityEvent('expired_token', decoded.userId, req.ip, {
                    path: req.path,
                    expiredAt: decoded.exp,
                    currentTime: now
                });

                return res.status(401).json({
                    success: false,
                    message: 'Token has expired',
                    code: 'TOKEN_EXPIRED'
                });
            }

            Logger.debug('User authenticated', {
                userId: decoded.userId,
                role: decoded.role,
                path: req.path
            });

            next();
        } catch (error) {
            if (error.name === 'JsonWebTokenError') {
                Logger.logSecurityEvent('invalid_token', null, req.ip, {
                    path: req.path,
                    error: error.message
                });

                return res.status(401).json({
                    success: false,
                    message: 'Invalid authentication token',
                    code: 'INVALID_TOKEN'
                });
            }

            if (error.name === 'TokenExpiredError') {
                Logger.logSecurityEvent('expired_token', null, req.ip, {
                    path: req.path,
                    expiredAt: error.expiredAt
                });

                return res.status(401).json({
                    success: false,
                    message: 'Authentication token has expired',
                    code: 'TOKEN_EXPIRED'
                });
            }

            Logger.error('Authentication error:', error, {
                path: req.path,
                ip: req.ip
            });

            return res.status(500).json({
                success: false,
                message: 'Authentication processing error'
            });
        }
    }

    /**
     * Require admin role
     */
    static requireAdmin(req, res, next) {
        if (!req.userId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        if (!req.userRole || !['admin', 'super_admin'].includes(req.userRole)) {
            Logger.logSecurityEvent('admin_access_denied', req.userId, req.ip, {
                path: req.path,
                userRole: req.userRole
            });

            return res.status(403).json({
                success: false,
                message: 'Admin access required',
                code: 'INSUFFICIENT_PERMISSIONS'
            });
        }

        next();
    }

    /**
     * Require specific role
     */
    static requireRole(roles) {
        return (req, res, next) => {
            if (!req.userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }

            const userRole = req.userRole || 'user';
            const allowedRoles = Array.isArray(roles) ? roles : [roles];

            if (!allowedRoles.includes(userRole)) {
                Logger.logSecurityEvent('role_access_denied', req.userId, req.ip, {
                    path: req.path,
                    userRole,
                    requiredRoles: allowedRoles
                });

                return res.status(403).json({
                    success: false,
                    message: `Access denied. Required roles: ${allowedRoles.join(', ')}`,
                    code: 'INSUFFICIENT_PERMISSIONS'
                });
            }

            next();
        };
    }

    /**
     * Optional authentication (doesn't fail if no token)
     */
    static optionalAuth(req, res, next) {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next(); // Continue without authentication
        }

        // Use the authenticate middleware but don't fail on error
        ValidationMiddleware.authenticate(req, res, (error) => {
            if (error) {
                // Log the error but continue
                Logger.debug('Optional authentication failed:', error);
            }
            next();
        });
    }

    /**
     * Validate user ownership (user can only access their own resources)
     */
    static validateOwnership(userIdField = 'userId') {
        return (req, res, next) => {
            const requestedUserId = req.params[userIdField] || req.body[userIdField] || req.query[userIdField];
            const authenticatedUserId = req.userId;

            if (!authenticatedUserId) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }

            // Admin users can access any resource
            if (['admin', 'super_admin'].includes(req.userRole)) {
                return next();
            }

            // Regular users can only access their own resources
            if (requestedUserId && requestedUserId !== authenticatedUserId) {
                Logger.logSecurityEvent('ownership_violation', authenticatedUserId, req.ip, {
                    path: req.path,
                    requestedUserId,
                    authenticatedUserId
                });

                return res.status(403).json({
                    success: false,
                    message: 'Access denied. You can only access your own resources.',
                    code: 'OWNERSHIP_VIOLATION'
                });
            }

            next();
        };
    }

    /**
     * Sanitize input data
     */
    static sanitizeInput(req, res, next) {
        try {
            // Helper function to recursively sanitize object
            const sanitize = (obj) => {
                if (typeof obj === 'string') {
                    // Basic XSS prevention
                    return obj
                        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
                        .replace(/javascript:/gi, '')
                        .replace(/on\w+\s*=/gi, '');
                }
                
                if (typeof obj === 'object' && obj !== null) {
                    const sanitized = {};
                    for (const [key, value] of Object.entries(obj)) {
                        sanitized[key] = sanitize(value);
                    }
                    return sanitized;
                }
                
                return obj;
            };

            // Sanitize request body
            if (req.body) {
                req.body = sanitize(req.body);
            }

            // Sanitize query parameters
            if (req.query) {
                req.query = sanitize(req.query);
            }

            next();
        } catch (error) {
            Logger.error('Input sanitization error:', error);
            return res.status(400).json({
                success: false,
                message: 'Input processing error'
            });
        }
    }

    /**
     * Check rate limiting compliance
     */
    static checkRateLimit(req, res, next) {
        // This would typically be handled by rate limiting middleware
        // But we can add additional checks here if needed
        next();
    }

    /**
     * Log request details for audit
     */
    static auditLog(req, res, next) {
        const auditData = {
            userId: req.userId,
            method: req.method,
            path: req.originalUrl,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            timestamp: new Date().toISOString(),
            requestId: req.requestId
        };

        // Log sensitive operations
        if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
            Logger.info('API Request Audit', auditData);
        } else {
            Logger.debug('API Request Audit', auditData);
        }

        next();
    }

    /**
     * Validate API version compatibility
     */
    static validateApiVersion(req, res, next) {
        const apiVersion = req.headers['api-version'] || req.query.version || '1.0';
        const supportedVersions = ['1.0', '1.1'];

        if (!supportedVersions.includes(apiVersion)) {
            return res.status(400).json({
                success: false,
                message: `Unsupported API version: ${apiVersion}`,
                supportedVersions,
                code: 'UNSUPPORTED_VERSION'
            });
        }

        req.apiVersion = apiVersion;
        next();
    }

    /**
     * Security headers middleware
     */
    static securityHeaders(req, res, next) {
        // Add security headers
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        
        // Remove sensitive headers
        res.removeHeader('X-Powered-By');
        res.removeHeader('Server');

        next();
    }

    /**
     * Request size validation
     */
    static validateRequestSize(maxSize = '10mb') {
        return (req, res, next) => {
            const contentLength = req.headers['content-length'];
            
            if (contentLength) {
                const sizeInBytes = parseInt(contentLength);
                const maxSizeInBytes = this.parseSize(maxSize);
                
                if (sizeInBytes > maxSizeInBytes) {
                    Logger.logSecurityEvent('request_too_large', req.userId, req.ip, {
                        path: req.path,
                        size: sizeInBytes,
                        maxSize: maxSizeInBytes
                    });

                    return res.status(413).json({
                        success: false,
                        message: 'Request entity too large',
                        maxSize: maxSize,
                        code: 'REQUEST_TOO_LARGE'
                    });
                }
            }

            next();
        };
    }

    /**
     * Parse size string to bytes
     */
    static parseSize(sizeStr) {
        const units = {
            'b': 1,
            'kb': 1024,
            'mb': 1024 * 1024,
            'gb': 1024 * 1024 * 1024
        };

        const match = sizeStr.toLowerCase().match(/^(\d+(?:\.\d+)?)(b|kb|mb|gb)?$/);
        if (!match) return 0;

        const value = parseFloat(match[1]);
        const unit = match[2] || 'b';

        return Math.floor(value * units[unit]);
    }

    /**
     * Authenticate admin API key
     */
    static authenticateAdminApiKey(req, res, next) {
        try {
            const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
            const expectedApiKey = SettingsService.get('server.secret.socket')
            
            if (!expectedApiKey) {
                Logger.error('Admin API key not configured');
                return res.status(500).json({
                    success: false,
                    message: 'Server configuration error',
                    code: 'MISSING_API_KEY_CONFIG'
                });
            }
            
            if (!apiKey || apiKey !== expectedApiKey) {
                Logger.logSecurityEvent('invalid_admin_api_key', null, req.ip, {
                    path: req.path,
                    providedKey: apiKey ? '***' : 'none'
                });

                return res.status(401).json({
                    success: false,
                    message: 'Invalid or missing admin API key',
                    code: 'INVALID_API_KEY'
                });
            }
            
            // Set admin context
            req.isAdmin = true;
            req.apiKeyAuthenticated = true;
            req.userId = 'admin-api-key';
            req.userRole = 'admin';
            
            Logger.debug('Admin API key authenticated', {
                path: req.path,
                ip: req.ip
            });
            
            next();
        } catch (error) {
            Logger.error('Admin API key authentication error:', error, {
                path: req.path,
                ip: req.ip
            });

            return res.status(500).json({
                success: false,
                message: 'Authentication processing error'
            });
        }
    }

    /**
     * Authenticate system API key for internal service communication
     */
    static authenticateSystemApiKey(req, res, next) {
        try {
            const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
            const expectedApiKey = SettingsService.get('server.secret.socket');
            
            if (!expectedApiKey) {
                Logger.error('System API key not configured');
                return res.status(500).json({
                    success: false,
                    message: 'Server configuration error',
                    code: 'MISSING_SYSTEM_API_KEY_CONFIG'
                });
            }
            
            if (!apiKey || apiKey !== expectedApiKey) {
                Logger.logSecurityEvent('invalid_system_api_key', null, req.ip, {
                    path: req.path,
                    providedKey: apiKey ? '***' : 'none'
                });

                return res.status(401).json({
                    success: false,
                    message: 'Invalid or missing system API key',
                    code: 'INVALID_SYSTEM_API_KEY'
                });
            }
            
            // Set system context
            req.isSystem = true;
            req.apiKeyAuthenticated = true;
            req.userId = 'system-api-key';
            req.userRole = 'system';
            
            Logger.debug('System API key authenticated', {
                path: req.path,
                ip: req.ip
            });
            
            next();
        } catch (error) {
            Logger.error('System API key authentication error:', error, {
                path: req.path,
                ip: req.ip
            });

            return res.status(500).json({
                success: false,
                message: 'Authentication processing error'
            });
        }
    }
}

module.exports = ValidationMiddleware;
