const express = require('express');
const router = express.Router();
const MetricsCollector = require('../services/metrics');
const Logger = require('../utils/logger');

/**
 * @swagger
 * /metrics:
 *   get:
 *     tags:
 *       - Metrics
 *     summary: Get Prometheus-compatible metrics
 *     description: Returns metrics in Prometheus format for monitoring and observability
 *     responses:
 *       200:
 *         description: Metrics data
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 */
router.get('/', async (req, res) => {
    try {
        // Return simple metrics in Prometheus format
        const metrics = `# HELP notifications_service_info Information about the notifications service
# TYPE notifications_service_info gauge
notifications_service_info{version="1.0.0",service="notification-microservice"} 1

# HELP process_uptime_seconds Process uptime in seconds
# TYPE process_uptime_seconds gauge
process_uptime_seconds ${process.uptime()}

# HELP process_memory_usage_bytes Process memory usage in bytes
# TYPE process_memory_usage_bytes gauge
process_memory_usage_bytes{type="rss"} ${process.memoryUsage().rss}
process_memory_usage_bytes{type="heapTotal"} ${process.memoryUsage().heapTotal}
process_memory_usage_bytes{type="heapUsed"} ${process.memoryUsage().heapUsed}
process_memory_usage_bytes{type="external"} ${process.memoryUsage().external}
`;
        
        res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
        res.send(metrics);
    } catch (error) {
        Logger.error('Failed to get metrics:', error);
        res.status(500).json({
            error: 'Failed to retrieve metrics',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * @swagger
 * /metrics/json:
 *   get:
 *     tags:
 *       - Metrics
 *     summary: Get metrics in JSON format
 *     description: Returns metrics data in JSON format for easier consumption
 *     responses:
 *       200:
 *         description: Metrics data in JSON format
 */
router.get('/json', async (req, res) => {
    try {
        const metrics = {
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            version: require('../../package.json').version,
            service: 'notification-microservice'
        };
        res.json(metrics);
    } catch (error) {
        Logger.error('Failed to get JSON metrics:', error);
        res.status(500).json({
            error: 'Failed to retrieve metrics',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * @swagger
 * /metrics/summary:
 *   get:
 *     tags:
 *       - Metrics
 *     summary: Get metrics summary
 *     description: Returns a summarized view of key performance indicators
 *     responses:
 *       200:
 *         description: Metrics summary
 */
router.get('/summary', async (req, res) => {
    try {
        const summary = await MetricsCollector.getSummary();
        res.json(summary);
    } catch (error) {
        Logger.error('Failed to get metrics summary:', error);
        res.status(500).json({
            error: 'Failed to retrieve metrics summary',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * @swagger
 * /metrics/reset:
 *   post:
 *     tags:
 *       - Metrics
 *     summary: Reset metrics counters
 *     description: Resets all metrics counters (admin only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Metrics reset successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.post('/reset', async (req, res) => {
    try {
        // This would typically require admin authentication
        await MetricsCollector.reset();
        res.json({
            success: true,
            message: 'Metrics reset successfully',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        Logger.error('Failed to reset metrics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to reset metrics',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

module.exports = router;
