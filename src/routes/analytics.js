const express = require('express');
const router = express.Router();
const { query, param } = require('express-validator');
const AnalyticsService = require('../services/analytics');
const ValidationMiddleware = require('../middleware/validation');
const Logger = require('../utils/logger');

/**
 * @swagger
 * /api/analytics/overview:
 *   get:
 *     summary: Get notification analytics overview
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [1h, 24h, 7d, 30d, 90d, 365d]
 *           default: 24h
 *         description: Time range for analytics
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter by specific user (admin only)
 *     responses:
 *       200:
 *         description: Analytics overview retrieved successfully
 */
router.get('/overview', [
    query('timeRange').optional().isString().isIn(['1h', '24h', '7d', '30d', '90d', '365d']),
    query('userId').optional().isString(),
    ValidationMiddleware.handleValidation
], async (req, res) => {
    try {
        const { timeRange = '24h', userId } = req.query;
        const isAdmin = req.isAdmin;

        // Non-admin users can only see their own analytics
        const targetUserId = isAdmin ? userId : req.userId;

        const analytics = await AnalyticsService.getOverview(timeRange, targetUserId);

        Logger.info('Analytics overview retrieved', { 
            userId: req.userId, 
            timeRange,
            targetUserId 
        });

        res.json({
            success: true,
            message: 'Analytics overview retrieved successfully',
            data: analytics
        });
    } catch (error) {
        Logger.error('Error retrieving analytics overview:', error, { 
            userId: req.userId 
        });
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve analytics overview',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @swagger
 * /api/analytics/notifications/trends:
 *   get:
 *     summary: Get notification trends and patterns
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [1h, 24h, 7d, 30d, 90d, 365d]
 *           default: 7d
 *         description: Time range for trends
 *       - in: query
 *         name: groupBy
 *         schema:
 *           type: string
 *           enum: [hour, day, week, month]
 *           default: day
 *         description: Group data by time period
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter by notification type
 *     responses:
 *       200:
 *         description: Notification trends retrieved successfully
 */
router.get('/notifications/trends', [
    query('timeRange').optional().isString().isIn(['1h', '24h', '7d', '30d', '90d', '365d']),
    query('groupBy').optional().isString().isIn(['hour', 'day', 'week', 'month']),
    query('type').optional().isString(),
    ValidationMiddleware.handleValidation
], async (req, res) => {
    try {
        const { timeRange = '7d', groupBy = 'day', type } = req.query;
        const isAdmin = req.isAdmin;
        const userId = isAdmin ? null : req.userId;

        const trends = await AnalyticsService.getNotificationTrends({
            timeRange,
            groupBy,
            type,
            userId
        });

        res.json({
            success: true,
            message: 'Notification trends retrieved successfully',
            data: trends
        });
    } catch (error) {
        Logger.error('Error retrieving notification trends:', error, { 
            userId: req.userId 
        });
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve notification trends',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @swagger
 * /api/analytics/delivery/stats:
 *   get:
 *     summary: Get delivery statistics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [1h, 24h, 7d, 30d, 90d, 365d]
 *           default: 24h
 *         description: Time range for delivery stats
 *       - in: query
 *         name: channel
 *         schema:
 *           type: string
 *           enum: [push, email, sms, websocket]
 *         description: Filter by delivery channel
 *     responses:
 *       200:
 *         description: Delivery statistics retrieved successfully
 */
router.get('/delivery/stats', [
    query('timeRange').optional().isString().isIn(['1h', '24h', '7d', '30d', '90d', '365d']),
    query('channel').optional().isString().isIn(['push', 'email', 'sms', 'websocket']),
    ValidationMiddleware.handleValidation
], async (req, res) => {
    try {
        const { timeRange = '24h', channel } = req.query;
        const isAdmin = req.isAdmin;

        if (!isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Admin access required for delivery statistics'
            });
        }

        const stats = await AnalyticsService.getDeliveryStats({
            timeRange,
            channel
        });

        res.json({
            success: true,
            message: 'Delivery statistics retrieved successfully',
            data: stats
        });
    } catch (error) {
        Logger.error('Error retrieving delivery stats:', error, { 
            userId: req.userId 
        });
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve delivery statistics',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @swagger
 * /api/analytics/user/engagement:
 *   get:
 *     summary: Get user engagement metrics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [1h, 24h, 7d, 30d, 90d, 365d]
 *           default: 7d
 *         description: Time range for engagement metrics
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Specific user ID (admin only)
 *     responses:
 *       200:
 *         description: User engagement metrics retrieved successfully
 */
router.get('/user/engagement', [
    query('timeRange').optional().isString().isIn(['1h', '24h', '7d', '30d', '90d', '365d']),
    query('userId').optional().isString(),
    ValidationMiddleware.handleValidation
], async (req, res) => {
    try {
        const { timeRange = '7d', userId } = req.query;
        const isAdmin = req.isAdmin;

        // Non-admin users can only see their own engagement
        const targetUserId = isAdmin ? userId : req.userId;

        const engagement = await AnalyticsService.getUserEngagement({
            timeRange,
            userId: targetUserId
        });

        res.json({
            success: true,
            message: 'User engagement metrics retrieved successfully',
            data: engagement
        });
    } catch (error) {
        Logger.error('Error retrieving user engagement:', error, { 
            userId: req.userId 
        });
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve user engagement metrics',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @swagger
 * /api/analytics/performance:
 *   get:
 *     summary: Get system performance metrics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [1h, 24h, 7d, 30d]
 *           default: 1h
 *         description: Time range for performance metrics
 *     responses:
 *       200:
 *         description: Performance metrics retrieved successfully
 */
router.get('/performance', [
    query('timeRange').optional().isString().isIn(['1h', '24h', '7d', '30d']),
    ValidationMiddleware.handleValidation
], async (req, res) => {
    try {
        const { timeRange = '1h' } = req.query;
        const isAdmin = req.isAdmin;

        if (!isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Admin access required for performance metrics'
            });
        }

        const performance = await AnalyticsService.getPerformanceMetrics(timeRange);

        res.json({
            success: true,
            message: 'Performance metrics retrieved successfully',
            data: performance
        });
    } catch (error) {
        Logger.error('Error retrieving performance metrics:', error, { 
            userId: req.userId 
        });
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve performance metrics',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @swagger
 * /api/analytics/reports/daily:
 *   get:
 *     summary: Get daily notification report
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Specific date (YYYY-MM-DD), defaults to today
 *     responses:
 *       200:
 *         description: Daily report retrieved successfully
 */
router.get('/reports/daily', [
    query('date').optional().isDate(),
    ValidationMiddleware.handleValidation
], async (req, res) => {
    try {
        const { date } = req.query;
        const isAdmin = req.isAdmin;

        if (!isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Admin access required for daily reports'
            });
        }

        const report = await AnalyticsService.getDailyReport(date);

        res.json({
            success: true,
            message: 'Daily report retrieved successfully',
            data: report
        });
    } catch (error) {
        Logger.error('Error retrieving daily report:', error, { 
            userId: req.userId 
        });
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve daily report',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @swagger
 * /api/analytics/types/distribution:
 *   get:
 *     summary: Get notification type distribution
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [1h, 24h, 7d, 30d, 90d, 365d]
 *           default: 7d
 *         description: Time range for distribution analysis
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter by specific user (admin only)
 *     responses:
 *       200:
 *         description: Type distribution retrieved successfully
 */
router.get('/types/distribution', [
    query('timeRange').optional().isString().isIn(['1h', '24h', '7d', '30d', '90d', '365d']),
    query('userId').optional().isString(),
    ValidationMiddleware.handleValidation
], async (req, res) => {
    try {
        const { timeRange = '7d', userId } = req.query;
        const isAdmin = req.isAdmin;

        // Non-admin users can only see their own distribution
        const targetUserId = isAdmin ? userId : req.userId;

        const distribution = await AnalyticsService.getTypeDistribution({
            timeRange,
            userId: targetUserId
        });

        res.json({
            success: true,
            message: 'Type distribution retrieved successfully',
            data: distribution
        });
    } catch (error) {
        Logger.error('Error retrieving type distribution:', error, { 
            userId: req.userId 
        });
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve type distribution',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @swagger
 * /api/analytics/cache/stats:
 *   get:
 *     summary: Get cache performance statistics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cache statistics retrieved successfully
 */
router.get('/cache/stats', async (req, res) => {
    try {
        const isAdmin = req.isAdmin;

        if (!isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Admin access required for cache statistics'
            });
        }

        const cacheStats = await AnalyticsService.getCacheStats();

        res.json({
            success: true,
            message: 'Cache statistics retrieved successfully',
            data: cacheStats
        });
    } catch (error) {
        Logger.error('Error retrieving cache stats:', error, { 
            userId: req.userId 
        });
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve cache statistics',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @swagger
 * /api/analytics/export:
 *   get:
 *     summary: Export analytics data (Admin only)
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [csv, json, xlsx]
 *           default: json
 *         description: Export format
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [1h, 24h, 7d, 30d, 90d, 365d]
 *           default: 7d
 *         description: Time range for export
 *       - in: query
 *         name: includeUserData
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include user-specific data
 *     responses:
 *       200:
 *         description: Analytics data exported successfully
 */
router.get('/export', [
    query('format').optional().isString().isIn(['csv', 'json', 'xlsx']),
    query('timeRange').optional().isString().isIn(['1h', '24h', '7d', '30d', '90d', '365d']),
    query('includeUserData').optional().isBoolean(),
    ValidationMiddleware.handleValidation
], async (req, res) => {
    try {
        const isAdmin = req.isAdmin;

        if (!isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Admin access required for data export'
            });
        }

        const { format = 'json', timeRange = '7d', includeUserData = false } = req.query;

        const exportData = await AnalyticsService.exportData({
            format,
            timeRange,
            includeUserData
        });

        // Set appropriate headers for download
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `notifications_analytics_${timestamp}.${format}`;

        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        
        if (format === 'csv') {
            res.setHeader('Content-Type', 'text/csv');
        } else if (format === 'xlsx') {
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        } else {
            res.setHeader('Content-Type', 'application/json');
        }

        Logger.info('Analytics data exported', { 
            userId: req.userId, 
            format, 
            timeRange,
            includeUserData 
        });

        res.send(exportData);
    } catch (error) {
        Logger.error('Error exporting analytics data:', error, { 
            userId: req.userId 
        });
        res.status(500).json({
            success: false,
            message: 'Failed to export analytics data',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;
