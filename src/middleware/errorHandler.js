const Logger = require('../utils/logger');
const MetricsCollector = require('../services/metrics');

class ErrorHandler {
    /**
     * Global error handler middleware
     */
    static handler(error, req, res, next) {
        // Log the error
        Logger.error('Unhandled error:', error, {
            userId: req.userId,
            path: req.originalUrl,
            method: req.method,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            requestId: req.requestId
        });

        // Record error metric
        MetricsCollector.recordNotificationError('unhandled_error');

        // Determine error type and response
        let statusCode = 500;
        let message = 'Internal server error';
        let code = 'INTERNAL_ERROR';
        let details = null;

        // Handle specific error types
        if (error.name === 'ValidationError') {
            statusCode = 400;
            message = 'Validation error';
            code = 'VALIDATION_ERROR';
            details = this.handleValidationError(error);
        } else if (error.name === 'CastError') {
            statusCode = 400;
            message = 'Invalid data format';
            code = 'CAST_ERROR';
            details = { field: error.path, value: error.value };
        } else if (error.name === 'MongoError' || error.name === 'MongoServerError') {
            statusCode = 500;
            message = 'Database error';
            code = 'DATABASE_ERROR';
            details = this.handleDatabaseError(error);
        } else if (error.name === 'JsonWebTokenError') {
            statusCode = 401;
            message = 'Authentication error';
            code = 'AUTH_ERROR';
        } else if (error.name === 'TokenExpiredError') {
            statusCode = 401;
            message = 'Token expired';
            code = 'TOKEN_EXPIRED';
        } else if (error.name === 'MulterError') {
            statusCode = 400;
            message = 'File upload error';
            code = 'UPLOAD_ERROR';
            details = { type: error.code };
        } else if (error.name === 'SyntaxError' && error.status === 400 && 'body' in error) {
            statusCode = 400;
            message = 'Invalid JSON format';
            code = 'JSON_SYNTAX_ERROR';
        } else if (error.status || error.statusCode) {
            statusCode = error.status || error.statusCode;
            message = error.message || message;
            code = error.code || code;
        }

        // Don't expose sensitive error details in production
        const isDevelopment = process.env.NODE_ENV === 'development';
        
        const errorResponse = {
            success: false,
            message,
            code,
            requestId: req.requestId,
            timestamp: new Date().toISOString()
        };

        // Add details in development mode or for client errors
        if (isDevelopment || statusCode < 500) {
            if (details) {
                errorResponse.details = details;
            }
            
            if (isDevelopment && error.stack) {
                errorResponse.stack = error.stack;
            }
        }

        // Add correlation ID for tracking
        if (req.headers['x-correlation-id']) {
            errorResponse.correlationId = req.headers['x-correlation-id'];
        }

        res.status(statusCode).json(errorResponse);
    }

    /**
     * Handle Mongoose validation errors
     */
    static handleValidationError(error) {
        const errors = {};
        
        Object.keys(error.errors).forEach(key => {
            const err = error.errors[key];
            errors[key] = {
                message: err.message,
                kind: err.kind,
                value: err.value
            };
        });

        return { validationErrors: errors };
    }

    /**
     * Handle database errors
     */
    static handleDatabaseError(error) {
        const details = { type: 'database_error' };

        // Handle duplicate key error
        if (error.code === 11000) {
            details.type = 'duplicate_key';
            details.field = Object.keys(error.keyPattern || {})[0];
            details.value = error.keyValue;
        }

        // Handle connection errors
        if (error.name === 'MongoNetworkError') {
            details.type = 'connection_error';
        }

        // Handle timeout errors
        if (error.name === 'MongoTimeoutError') {
            details.type = 'timeout_error';
        }

        return details;
    }

    /**
     * 404 Not Found handler
     */
    static notFoundHandler(req, res) {
        Logger.warn('Route not found', {
            path: req.originalUrl,
            method: req.method,
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });

        res.status(404).json({
            success: false,
            message: 'Route not found',
            code: 'NOT_FOUND',
            path: req.originalUrl,
            method: req.method,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Async error wrapper for route handlers
     */
    static asyncHandler(fn) {
        return (req, res, next) => {
            Promise.resolve(fn(req, res, next)).catch(next);
        };
    }

    /**
     * Rate limit error handler
     */
    static rateLimitHandler(req, res) {
        Logger.logSecurityEvent('rate_limit_exceeded', req.userId, req.ip, {
            path: req.originalUrl,
            method: req.method
        });

        MetricsCollector.recordRateLimitExceeded(req.originalUrl, req.userId);

        res.status(429).json({
            success: false,
            message: 'Rate limit exceeded',
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter: Math.ceil((req.rateLimit?.resetTime - Date.now()) / 1000) || 60,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Create custom error
     */
    static createError(message, statusCode = 500, code = null, details = null) {
        const error = new Error(message);
        error.statusCode = statusCode;
        error.code = code;
        error.details = details;
        return error;
    }

    /**
     * Handle promise rejections
     */
    static handleUnhandledRejection(reason, promise) {
        Logger.fatal('Unhandled Promise Rejection:', reason);
        MetricsCollector.recordNotificationError('unhandled_rejection');
        
        // Don't exit in production, but log for monitoring
        if (process.env.NODE_ENV !== 'production') {
            process.exit(1);
        }
    }

    /**
     * Handle uncaught exceptions
     */
    static handleUncaughtException(error) {
        Logger.fatal('Uncaught Exception:', error);
        MetricsCollector.recordNotificationError('uncaught_exception');
        
        // Gracefully close server and exit
        process.exit(1);
    }

    /**
     * Setup global error handlers
     */
    static setupGlobalHandlers() {
        process.on('unhandledRejection', this.handleUnhandledRejection);
        process.on('uncaughtException', this.handleUncaughtException);
    }

    /**
     * Validation error helper
     */
    static validationError(message, field = null, value = null) {
        const error = new Error(message);
        error.statusCode = 400;
        error.code = 'VALIDATION_ERROR';
        error.details = { field, value };
        return error;
    }

    /**
     * Authentication error helper
     */
    static authError(message = 'Authentication required') {
        const error = new Error(message);
        error.statusCode = 401;
        error.code = 'AUTH_ERROR';
        return error;
    }

    /**
     * Authorization error helper
     */
    static authorizationError(message = 'Insufficient permissions') {
        const error = new Error(message);
        error.statusCode = 403;
        error.code = 'AUTHORIZATION_ERROR';
        return error;
    }

    /**
     * Not found error helper
     */
    static notFoundError(message = 'Resource not found', resource = null) {
        const error = new Error(message);
        error.statusCode = 404;
        error.code = 'NOT_FOUND';
        error.details = { resource };
        return error;
    }

    /**
     * Conflict error helper
     */
    static conflictError(message = 'Resource conflict', resource = null) {
        const error = new Error(message);
        error.statusCode = 409;
        error.code = 'CONFLICT';
        error.details = { resource };
        return error;
    }

    /**
     * Rate limit error helper
     */
    static rateLimitError(message = 'Rate limit exceeded') {
        const error = new Error(message);
        error.statusCode = 429;
        error.code = 'RATE_LIMIT';
        return error;
    }

    /**
     * Service unavailable error helper
     */
    static serviceUnavailableError(message = 'Service temporarily unavailable') {
        const error = new Error(message);
        error.statusCode = 503;
        error.code = 'SERVICE_UNAVAILABLE';
        return error;
    }
}

// Setup global error handlers
ErrorHandler.setupGlobalHandlers();

module.exports = ErrorHandler;
