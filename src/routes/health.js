const express = require('express');
const router = express.Router();
const HealthService = require('../services/health');
const DatabaseConnection = require('../config/database');
const RedisManager = require('../config/redis');
const Logger = require('../utils/logger');

/**
 * @swagger
 * /health:
 *   get:
 *     tags:
 *       - Health
 *     summary: Get service health status
 *     description: Returns the current health status of the notification service and its dependencies
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [healthy, degraded, unhealthy]
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                 version:
 *                   type: string
 *                 dependencies:
 *                   type: object
 *                   properties:
 *                     database:
 *                       type: object
 *                     redis:
 *                       type: object
 *                     memory:
 *                       type: object
 *       503:
 *         description: Service is unhealthy
 */
router.get('/', async (req, res) => {
    try {
        const health = await HealthService.getHealthStatus();
        const statusCode = health.status === 'healthy' ? 200 : 
                          health.status === 'degraded' ? 200 : 503;
        
        res.status(statusCode).json(health);
    } catch (error) {
        Logger.error('Health check failed:', error);
        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: 'Health check failed',
            details: error.message
        });
    }
});

/**
 * @swagger
 * /health/live:
 *   get:
 *     tags:
 *       - Health
 *     summary: Liveness probe
 *     description: Simple liveness check for Kubernetes/Docker health checks
 *     responses:
 *       200:
 *         description: Service is alive
 *       503:
 *         description: Service is not alive
 */
router.get('/live', (req, res) => {
    // Simple liveness check - if we can respond, we're alive
    res.status(200).json({
        status: 'alive',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

/**
 * @swagger
 * /health/ready:
 *   get:
 *     tags:
 *       - Health
 *     summary: Readiness probe
 *     description: Checks if the service is ready to serve traffic
 *     responses:
 *       200:
 *         description: Service is ready
 *       503:
 *         description: Service is not ready
 */
router.get('/ready', async (req, res) => {
    try {
        // Check critical dependencies
        const checks = await Promise.allSettled([
            DatabaseConnection.isConnected(),
            RedisManager.isConnected()
        ]);

        const dbHealthy = checks[0].status === 'fulfilled' && checks[0].value;
        const redisHealthy = checks[1].status === 'fulfilled' && checks[1].value;

        if (dbHealthy && redisHealthy) {
            res.status(200).json({
                status: 'ready',
                timestamp: new Date().toISOString(),
                dependencies: {
                    database: 'connected',
                    redis: 'connected'
                }
            });
        } else {
            res.status(503).json({
                status: 'not_ready',
                timestamp: new Date().toISOString(),
                dependencies: {
                    database: dbHealthy ? 'connected' : 'disconnected',
                    redis: redisHealthy ? 'connected' : 'disconnected'
                }
            });
        }
    } catch (error) {
        Logger.error('Readiness check failed:', error);
        res.status(503).json({
            status: 'not_ready',
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
});

/**
 * @swagger
 * /health/detailed:
 *   get:
 *     tags:
 *       - Health
 *     summary: Detailed health information
 *     description: Returns comprehensive health and performance metrics
 *     responses:
 *       200:
 *         description: Detailed health information
 */
router.get('/detailed', async (req, res) => {
    try {
        const startTime = Date.now();
        
        const [
            healthStatus,
            memoryUsage,
            cpuUsage
        ] = await Promise.all([
            HealthService.getHealthStatus(),
            Promise.resolve(process.memoryUsage()),
            Promise.resolve(process.cpuUsage())
        ]);

        const responseTime = Date.now() - startTime;

        res.json({
            ...healthStatus,
            performance: {
                responseTime: `${responseTime}ms`,
                memory: {
                    used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
                    total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
                    external: Math.round(memoryUsage.external / 1024 / 1024),
                    rss: Math.round(memoryUsage.rss / 1024 / 1024)
                },
                cpu: {
                    user: cpuUsage.user,
                    system: cpuUsage.system
                }
            },
            environment: {
                nodeVersion: process.version,
                platform: process.platform,
                arch: process.arch,
                pid: process.pid
            }
        });
    } catch (error) {
        Logger.error('Detailed health check failed:', error);
        res.status(500).json({
            status: 'error',
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
});

module.exports = router;
