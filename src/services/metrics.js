const client = require('prom-client');
const Logger = require('../utils/logger');

class MetricsCollector {
    constructor() {
        this.register = new client.Registry();
        this.metrics = {};
        this.initialized = false;
    }

    async initialize() {
        try {
            // Set up default metrics collection
            client.collectDefaultMetrics({ 
                register: this.register,
                timeout: 10000,
                gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
                eventLoopMonitoringPrecision: 10
            });

            // Custom metrics
            this.setupCustomMetrics();
            
            this.initialized = true;
            Logger.info('✅ Metrics collector initialized');
        } catch (error) {
            Logger.error('❌ Failed to initialize metrics collector:', error);
            throw error;
        }
    }

    setupCustomMetrics() {
        // HTTP Request metrics
        this.metrics.httpRequests = new client.Counter({
            name: 'http_requests_total',
            help: 'Total number of HTTP requests',
            labelNames: ['method', 'route', 'status_code'],
            registers: [this.register]
        });

        this.metrics.httpRequestDuration = new client.Histogram({
            name: 'http_request_duration_seconds',
            help: 'Duration of HTTP requests in seconds',
            labelNames: ['method', 'route', 'status_code'],
            buckets: [0.1, 0.5, 1, 2, 5, 10],
            registers: [this.register]
        });

        // Notification metrics
        this.metrics.notificationsCreated = new client.Counter({
            name: 'notifications_created_total',
            help: 'Total number of notifications created',
            labelNames: ['type', 'priority'],
            registers: [this.register]
        });

        this.metrics.notificationsDelivered = new client.Counter({
            name: 'notifications_delivered_total',
            help: 'Total number of notifications delivered',
            labelNames: ['channel', 'status'],
            registers: [this.register]
        });

        this.metrics.notificationsRead = new client.Counter({
            name: 'notifications_read_total',
            help: 'Total number of notifications read',
            labelNames: ['type'],
            registers: [this.register]
        });

        this.metrics.notificationCreationDuration = new client.Histogram({
            name: 'notification_creation_duration_seconds',
            help: 'Time taken to create notifications',
            labelNames: ['type', 'priority'],
            buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
            registers: [this.register]
        });

        this.metrics.notificationDeliveryDuration = new client.Histogram({
            name: 'notification_delivery_duration_seconds',
            help: 'Time taken to deliver notifications',
            labelNames: ['channel'],
            buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
            registers: [this.register]
        });

        // Database metrics
        this.metrics.databaseOperations = new client.Counter({
            name: 'database_operations_total',
            help: 'Total number of database operations',
            labelNames: ['operation', 'collection', 'status'],
            registers: [this.register]
        });

        this.metrics.databaseOperationDuration = new client.Histogram({
            name: 'database_operation_duration_seconds',
            help: 'Duration of database operations',
            labelNames: ['operation', 'collection'],
            buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5],
            registers: [this.register]
        });

        // Cache metrics
        this.metrics.cacheOperations = new client.Counter({
            name: 'cache_operations_total',
            help: 'Total number of cache operations',
            labelNames: ['operation', 'result'],
            registers: [this.register]
        });

        this.metrics.cacheHitRate = new client.Gauge({
            name: 'cache_hit_rate',
            help: 'Cache hit rate percentage',
            registers: [this.register]
        });

        // WebSocket metrics
        this.metrics.websocketConnections = new client.Gauge({
            name: 'websocket_connections_current',
            help: 'Current number of WebSocket connections',
            registers: [this.register]
        });

        this.metrics.websocketMessages = new client.Counter({
            name: 'websocket_messages_total',
            help: 'Total number of WebSocket messages sent',
            labelNames: ['type', 'status'],
            registers: [this.register]
        });

        // Error metrics
        this.metrics.errors = new client.Counter({
            name: 'errors_total',
            help: 'Total number of errors',
            labelNames: ['type', 'service'],
            registers: [this.register]
        });

        // Business metrics
        this.metrics.activeUsers = new client.Gauge({
            name: 'active_users_current',
            help: 'Current number of active users',
            registers: [this.register]
        });

        this.metrics.unreadNotifications = new client.Gauge({
            name: 'unread_notifications_total',
            help: 'Total number of unread notifications',
            registers: [this.register]
        });

        // Rate limiting metrics
        this.metrics.rateLimitExceeded = new client.Counter({
            name: 'rate_limit_exceeded_total',
            help: 'Total number of rate limit violations',
            labelNames: ['endpoint', 'user'],
            registers: [this.register]
        });

        // System metrics
        this.metrics.memoryUsage = new client.Gauge({
            name: 'memory_usage_bytes',
            help: 'Memory usage in bytes',
            labelNames: ['type'],
            registers: [this.register]
        });

        this.metrics.redisMemoryUsage = new client.Gauge({
            name: 'redis_memory_usage_bytes',
            help: 'Redis memory usage in bytes',
            registers: [this.register]
        });

        // gRPC metrics
        this.metrics.grpcRequests = new client.Counter({
            name: 'grpc_requests_total',
            help: 'Total number of gRPC requests',
            labelNames: ['method', 'status'],
            registers: [this.register]
        });

        this.metrics.grpcRequestDuration = new client.Histogram({
            name: 'grpc_request_duration_seconds',
            help: 'Duration of gRPC requests in seconds',
            labelNames: ['method', 'status'],
            buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
            registers: [this.register]
        });
    }

    // HTTP Metrics
    recordHttpRequest(method, route, statusCode, duration) {
        if (!this.initialized) return;
        
        this.metrics.httpRequests.inc({ method, route, status_code: statusCode });
        this.metrics.httpRequestDuration.observe(
            { method, route, status_code: statusCode },
            duration / 1000
        );
    }

    // Notification Metrics
    async recordNotificationCreated(type, priority, duration) {
        if (!this.initialized) return;
        
        this.metrics.notificationsCreated.inc({ type, priority });
        this.metrics.notificationCreationDuration.observe(
            { type, priority },
            duration / 1000
        );
    }

    async recordNotificationDelivered(channel, status = 'success') {
        if (!this.initialized) return;
        
        this.metrics.notificationsDelivered.inc({ channel, status });
    }

    async recordNotificationRead(type) {
        if (!this.initialized) return;
        
        this.metrics.notificationsRead.inc({ type });
    }

    async recordBulkNotificationSent(successful, failed) {
        if (!this.initialized) return;
        
        this.metrics.notificationsDelivered.inc({ channel: 'bulk', status: 'success' }, successful);
        if (failed > 0) {
            this.metrics.notificationsDelivered.inc({ channel: 'bulk', status: 'failed' }, failed);
        }
    }

    async recordBulkNotificationRead(count) {
        if (!this.initialized) return;
        
        this.metrics.notificationsRead.inc({ type: 'bulk' }, count);
    }

    async recordNotificationDeleted() {
        if (!this.initialized) return;
        
        this.metrics.notificationsDelivered.inc({ channel: 'delete', status: 'success' });
    }

    async recordNotificationCleanup(count) {
        if (!this.initialized) return;
        
        this.metrics.notificationsDelivered.inc({ channel: 'cleanup', status: 'success' }, count);
    }

    async recordNotificationError(type) {
        if (!this.initialized) return;
        
        this.metrics.errors.inc({ type, service: 'notification' });
    }

    // Database Metrics
    recordDatabaseOperation(operation, collection, status, duration) {
        if (!this.initialized) return;
        
        this.metrics.databaseOperations.inc({ operation, collection, status });
        this.metrics.databaseOperationDuration.observe(
            { operation, collection },
            duration / 1000
        );
    }

    // Cache Metrics
    recordCacheOperation(operation, hit = null) {
        if (!this.initialized) return;
        
        const result = hit !== null ? (hit ? 'hit' : 'miss') : 'operation';
        this.metrics.cacheOperations.inc({ operation, result });
    }

    updateCacheHitRate(rate) {
        if (!this.initialized) return;
        
        this.metrics.cacheHitRate.set(rate);
    }

    // WebSocket Metrics
    updateWebSocketConnections(count) {
        if (!this.initialized) return;
        
        this.metrics.websocketConnections.set(count);
    }

    recordWebSocketMessage(type, status = 'success') {
        if (!this.initialized) return;
        
        this.metrics.websocketMessages.inc({ type, status });
    }

    // gRPC Metrics
    async recordGrpcRequest(method, status = 'success', duration) {
        if (!this.initialized) return;
        
        this.metrics.grpcRequests.inc({ method, status });
        if (duration !== undefined) {
            this.metrics.grpcRequestDuration.observe(
                { method, status },
                duration / 1000
            );
        }
    }

    // Business Metrics
    updateActiveUsers(count) {
        if (!this.initialized) return;
        
        this.metrics.activeUsers.set(count);
    }

    updateUnreadNotifications(count) {
        if (!this.initialized) return;
        
        this.metrics.unreadNotifications.set(count);
    }

    // Rate Limiting Metrics
    recordRateLimitExceeded(endpoint, userId) {
        if (!this.initialized) return;
        
        this.metrics.rateLimitExceeded.inc({ endpoint, user: userId });
    }

    // System Metrics
    updateMemoryUsage() {
        if (!this.initialized) return;
        
        const usage = process.memoryUsage();
        this.metrics.memoryUsage.set({ type: 'rss' }, usage.rss);
        this.metrics.memoryUsage.set({ type: 'heapUsed' }, usage.heapUsed);
        this.metrics.memoryUsage.set({ type: 'heapTotal' }, usage.heapTotal);
        this.metrics.memoryUsage.set({ type: 'external' }, usage.external);
    }

    updateRedisMemoryUsage(bytes) {
        if (!this.initialized) return;
        
        this.metrics.redisMemoryUsage.set(bytes);
    }

    // Middleware for automatic HTTP metrics collection
    middleware() {
        return (req, res, next) => {
            if (!this.initialized) return next();
            
            const start = Date.now();
            
            res.on('finish', () => {
                const duration = Date.now() - start;
                const route = req.route ? req.route.path : req.path;
                this.recordHttpRequest(req.method, route, res.statusCode, duration);
            });
            
            next();
        };
    }

    // Get metrics for Prometheus
    async getMetrics() {
        try {
            // Update system metrics before export
            this.updateMemoryUsage();
            
            return await this.register.metrics();
        } catch (error) {
            Logger.error('Error getting metrics:', error);
            return '';
        }
    }

    // Get specific metric value
    async getMetricValue(metricName) {
        try {
            const metrics = await this.register.getMetricsAsJSON();
            const metric = metrics.find(m => m.name === metricName);
            return metric ? metric.values : null;
        } catch (error) {
            Logger.error('Error getting metric value:', error);
            return null;
        }
    }

    // Clear all metrics
    clearMetrics() {
        if (!this.initialized) return;
        
        this.register.clear();
        this.setupCustomMetrics();
    }

    // Health check
    healthCheck() {
        return {
            status: this.initialized ? 'healthy' : 'unhealthy',
            message: this.initialized ? 'Metrics collector is healthy' : 'Metrics collector not initialized',
            metricsCount: this.register._metrics.size || 0
        };
    }

    // Get summary stats
    async getSummaryStats() {
        try {
            const metrics = await this.register.getMetricsAsJSON();
            
            const stats = {
                totalMetrics: metrics.length,
                httpRequests: 0,
                notifications: 0,
                errors: 0,
                cacheOperations: 0
            };

            metrics.forEach(metric => {
                const total = metric.values.reduce((sum, val) => sum + (val.value || 0), 0);
                
                if (metric.name.startsWith('http_requests_total')) {
                    stats.httpRequests += total;
                } else if (metric.name.startsWith('notifications_')) {
                    stats.notifications += total;
                } else if (metric.name.startsWith('errors_total')) {
                    stats.errors += total;
                } else if (metric.name.startsWith('cache_operations_total')) {
                    stats.cacheOperations += total;
                }
            });

            return stats;
        } catch (error) {
            Logger.error('Error getting summary stats:', error);
            return null;
        }
    }
}

module.exports = new MetricsCollector();
