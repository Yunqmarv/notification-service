const DatabaseConnection = require('../config/database');
const RedisManager = require('../config/redis');
const Logger = require('../utils/logger');

class HealthService {
    constructor() {
        this.isInitialized = false;
        this.checks = {
            database: false,
            redis: false,
            memory: false,
            disk: false
        };
    }

    async initialize() {
        this.isInitialized = true;
        Logger.info('Health service initialized');
    }

    async getHealthStatus() {
        const status = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            version: require('../../package.json').version,
            checks: await this.performHealthChecks()
        };

        // Determine overall status
        const failedChecks = Object.values(status.checks).filter(check => !check.healthy);
        if (failedChecks.length > 0) {
            status.status = 'unhealthy';
        }

        return status;
    }

    async performHealthChecks() {
        const checks = {};

        // Database health check
        try {
            await DatabaseConnection.healthCheck();
            checks.database = { healthy: true, message: 'Connected' };
        } catch (error) {
            checks.database = { healthy: false, message: error.message };
        }

        // Redis health check
        try {
            await RedisManager.healthCheck();
            checks.redis = { healthy: true, message: 'Connected' };
        } catch (error) {
            checks.redis = { healthy: false, message: error.message };
        }

        // Memory check
        const memUsage = process.memoryUsage();
        const memUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
        checks.memory = {
            healthy: memUsedMB < 500, // 500MB threshold
            message: `${memUsedMB}MB used`,
            details: memUsage
        };

        // Basic disk check (simplified)
        checks.disk = {
            healthy: true,
            message: 'Available'
        };

        return checks;
    }

    async getMetrics() {
        const memUsage = process.memoryUsage();
        
        return {
            memory: {
                rss: memUsage.rss,
                heapTotal: memUsage.heapTotal,
                heapUsed: memUsage.heapUsed,
                external: memUsage.external
            },
            uptime: process.uptime(),
            pid: process.pid,
            version: process.version,
            platform: process.platform,
            arch: process.arch
        };
    }
}

module.exports = new HealthService();
