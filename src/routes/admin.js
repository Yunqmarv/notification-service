const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const NotificationService = require('../services/notification');
const AnalyticsService = require('../services/analytics');
const SettingsService = require('../services/settings');
const CacheService = require('../services/cache');
const ValidationMiddleware = require('../middleware/validation');
const Logger = require('../utils/logger');

/**
 * @swagger
 * /api/admin/stats:
 *   get:
 *     summary: Get comprehensive system statistics (Admin only)
 *     tags: [Admin]
 *     security:
 *       - apiKey: []
 *     responses:
 *       200:
 *         description: System statistics retrieved successfully
 *       403:
 *         description: Admin access required
 */
router.get('/stats', ValidationMiddleware.authenticateAdminApiKey, async (req, res) => {
    try {
        const stats = await AnalyticsService.getSystemStats();

        res.json({
            success: true,
            message: 'System statistics retrieved successfully',
            data: stats
        });
    } catch (error) {
        Logger.error('Error retrieving system stats:', error, { userId: req.userId });
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve system statistics',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @swagger
 * /api/admin/notifications/mass-send:
 *   post:
 *     summary: Send mass notifications (Admin only)
 *     tags: [Admin]
 *     security:
 *       - apiKey: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - message
 *               - type
 *               - targetUsers
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 200
 *               message:
 *                 type: string
 *                 maxLength: 1000
 *               type:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [low, normal, high, urgent]
 *               targetUsers:
 *                 type: object
 *                 properties:
 *                   userIds:
 *                     type: array
 *                     items:
 *                       type: string
 *                   criteria:
 *                     type: object
 *                     description: User selection criteria
 *               scheduling:
 *                 type: object
 *                 properties:
 *                   sendAt:
 *                     type: string
 *                     format: date-time
 *               metadata:
 *                 type: object
 *     responses:
 *       201:
 *         description: Mass notification initiated successfully
 */
router.post('/notifications/mass-send', [
    ValidationMiddleware.authenticateAdminApiKey,
    body('title').notEmpty().isString().isLength({ max: 200 }),
    body('message').notEmpty().isString().isLength({ max: 1000 }),
    body('type').notEmpty().isString(),
    body('priority').optional().isString().isIn(['low', 'normal', 'high', 'urgent']),
    body('targetUsers').isObject(),
    body('scheduling').optional().isObject(),
    body('metadata').optional().isObject(),
    ValidationMiddleware.handleValidation
], async (req, res) => {
    try {
        const massNotificationData = {
            ...req.body,
            createdBy: req.userId,
            createdAt: new Date()
        };

        const result = await NotificationService.sendMassNotification(massNotificationData);

        Logger.info('Mass notification initiated', { 
            userId: req.userId, 
            type: req.body.type,
            targetCount: result.targetCount 
        });

        res.status(201).json({
            success: true,
            message: 'Mass notification initiated successfully',
            data: result
        });
    } catch (error) {
        Logger.error('Error sending mass notification:', error, { userId: req.userId });
        res.status(400).json({
            success: false,
            message: 'Failed to send mass notification',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @swagger
 * /api/admin/users/{userId}/notifications:
 *   get:
 *     summary: Get notifications for specific user (Admin only)
 *     tags: [Admin]
 *     security:
 *       - apiKey: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: Target user ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *     responses:
 *       200:
 *         description: User notifications retrieved successfully
 */
router.get('/users/:userId/notifications', [
    ValidationMiddleware.authenticateAdminApiKey,
    param('userId').isString().isLength({ min: 1, max: 100 }),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('offset').optional().isInt({ min: 0 }).toInt(),
    ValidationMiddleware.handleValidation
], async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 50, offset = 0 } = req.query;

        const notifications = await NotificationService.getUserNotifications(userId, {
            limit,
            offset,
            sort: 'createdAt',
            order: 'desc'
        });

        res.json({
            success: true,
            message: 'User notifications retrieved successfully',
            data: notifications
        });
    } catch (error) {
        Logger.error('Error retrieving user notifications:', error, { 
            userId: req.userId,
            targetUserId: req.params.userId 
        });
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve user notifications',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @swagger
 * /api/admin/notifications/{notificationId}/force-send:
 *   post:
 *     summary: Force resend a failed notification (Admin only)
 *     tags: [Admin]
 *     security:
 *       - apiKey: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification resent successfully
 */
router.post('/notifications/:notificationId/force-send', [
    ValidationMiddleware.authenticateAdminApiKey,
    param('notificationId').isString().isLength({ min: 1, max: 100 }),
    ValidationMiddleware.handleValidation
], async (req, res) => {
    try {
        const { notificationId } = req.params;
        const result = await NotificationService.forceSendNotification(notificationId);

        if (!result) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        Logger.info('Notification force-sent', { 
            userId: req.userId, 
            notificationId 
        });

        res.json({
            success: true,
            message: 'Notification resent successfully',
            data: result
        });
    } catch (error) {
        Logger.error('Error force-sending notification:', error, { 
            userId: req.userId,
            notificationId: req.params.notificationId 
        });
        res.status(500).json({
            success: false,
            message: 'Failed to resend notification',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @swagger
 * /api/admin/cache/clear:
 *   post:
 *     summary: Clear cache (Admin only)
 *     tags: [Admin]
 *     security:
 *       - apiKey: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               pattern:
 *                 type: string
 *                 description: Cache key pattern to clear (optional)
 *               clearAll:
 *                 type: boolean
 *                 description: Clear entire cache
 *     responses:
 *       200:
 *         description: Cache cleared successfully
 */
router.post('/cache/clear', [
    ValidationMiddleware.authenticateAdminApiKey,
    body('pattern').optional().isString(),
    body('clearAll').optional().isBoolean(),
    ValidationMiddleware.handleValidation
], async (req, res) => {
    try {
        const { pattern, clearAll } = req.body;

        let result;
        if (clearAll) {
            result = await CacheService.flushAll();
        } else if (pattern) {
            result = await CacheService.clearPattern(pattern);
        } else {
            return res.status(400).json({
                success: false,
                message: 'Either pattern or clearAll must be specified'
            });
        }

        Logger.info('Cache cleared by admin', { 
            userId: req.userId, 
            pattern, 
            clearAll 
        });

        res.json({
            success: true,
            message: 'Cache cleared successfully',
            data: { clearedKeys: result }
        });
    } catch (error) {
        Logger.error('Error clearing cache:', error, { userId: req.userId });
        res.status(500).json({
            success: false,
            message: 'Failed to clear cache',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @swagger
 * /api/admin/health:
 *   get:
 *     summary: Get system health status (Admin only)
 *     tags: [Admin]
 *     security:
 *       - apiKey: []
 *     responses:
 *       200:
 *         description: System health retrieved successfully
 */
router.get('/health', ValidationMiddleware.authenticateAdminApiKey, async (req, res) => {
    try {
        const health = await AnalyticsService.getSystemHealth();

        res.json({
            success: true,
            message: 'System health retrieved successfully',
            data: health
        });
    } catch (error) {
        Logger.error('Error retrieving system health:', error, { userId: req.userId });
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve system health',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @swagger
 * /api/admin/users/active:
 *   get:
 *     summary: Get active users statistics (Admin only)
 *     tags: [Admin]
 *     security:
 *       - apiKey: []
 *     parameters:
 *       - in: query
 *         name: timeRange
 *         schema:
 *           type: string
 *           enum: [1h, 24h, 7d, 30d]
 *           default: 24h
 *         description: Time range for active users
 *     responses:
 *       200:
 *         description: Active users retrieved successfully
 */
router.get('/users/active', [
    ValidationMiddleware.authenticateAdminApiKey,
    query('timeRange').optional().isString().isIn(['1h', '24h', '7d', '30d']),
    ValidationMiddleware.handleValidation
], async (req, res) => {
    try {
        const { timeRange = '24h' } = req.query;
        const activeUsers = await AnalyticsService.getActiveUsers(timeRange);

        res.json({
            success: true,
            message: 'Active users retrieved successfully',
            data: activeUsers
        });
    } catch (error) {
        Logger.error('Error retrieving active users:', error, { userId: req.userId });
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve active users',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @swagger
 * /api/admin/notifications/cleanup:
 *   post:
 *     summary: Cleanup old notifications (Admin only)
 *     tags: [Admin]
 *     security:
 *       - apiKey: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               olderThanDays:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 365
 *                 default: 90
 *               keepRead:
 *                 type: boolean
 *                 default: false
 *               dryRun:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       200:
 *         description: Cleanup completed successfully
 */
router.post('/notifications/cleanup', [
    ValidationMiddleware.authenticateAdminApiKey,
    body('olderThanDays').optional().isInt({ min: 1, max: 365 }),
    body('keepRead').optional().isBoolean(),
    body('dryRun').optional().isBoolean(),
    ValidationMiddleware.handleValidation
], async (req, res) => {
    try {
        const { olderThanDays = 90, keepRead = false, dryRun = true } = req.body;

        const result = await NotificationService.cleanupNotifications({
            olderThanDays,
            keepRead,
            dryRun
        });

        Logger.info('Notification cleanup performed', { 
            userId: req.userId, 
            olderThanDays, 
            keepRead, 
            dryRun,
            deletedCount: result.deletedCount 
        });

        res.json({
            success: true,
            message: `Cleanup ${dryRun ? 'simulated' : 'completed'} successfully`,
            data: result
        });
    } catch (error) {
        Logger.error('Error performing cleanup:', error, { userId: req.userId });
        res.status(500).json({
            success: false,
            message: 'Failed to perform cleanup',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @swagger
 * /api/admin/settings/reset:
 *   post:
 *     summary: Reset settings to defaults (Admin only)
 *     tags: [Admin]
 *     security:
 *       - apiKey: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               category:
 *                 type: string
 *                 description: Reset only specific category
 *               confirmReset:
 *                 type: boolean
 *                 description: Confirmation flag
 *     responses:
 *       200:
 *         description: Settings reset successfully
 */
router.post('/settings/reset', [
    ValidationMiddleware.authenticateAdminApiKey,
    body('category').optional().isString(),
    body('confirmReset').isBoolean(),
    ValidationMiddleware.handleValidation
], async (req, res) => {
    try {
        const { category, confirmReset } = req.body;

        if (!confirmReset) {
            return res.status(400).json({
                success: false,
                message: 'Reset confirmation required'
            });
        }

        const result = await SettingsService.resetToDefaults(category);

        Logger.warn('Settings reset by admin', { 
            userId: req.userId, 
            category,
            resetCount: result.resetCount 
        });

        res.json({
            success: true,
            message: 'Settings reset successfully',
            data: result
        });
    } catch (error) {
        Logger.error('Error resetting settings:', error, { userId: req.userId });
        res.status(500).json({
            success: false,
            message: 'Failed to reset settings',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @swagger
 * /api/admin/logs:
 *   get:
 *     summary: Get system logs (Admin only)
 *     tags: [Admin]
 *     security:
 *       - apiKey: []
 *     parameters:
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *           enum: [error, warn, info, debug]
 *         description: Log level filter
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 1000
 *           default: 100
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *     responses:
 *       200:
 *         description: Logs retrieved successfully
 */
router.get('/logs', [
    ValidationMiddleware.authenticateAdminApiKey,
    query('level').optional().isString().isIn(['error', 'warn', 'info', 'debug']),
    query('limit').optional().isInt({ min: 1, max: 1000 }).toInt(),
    query('offset').optional().isInt({ min: 0 }).toInt(),
    ValidationMiddleware.handleValidation
], async (req, res) => {
    try {
        const { level, limit = 100, offset = 0 } = req.query;
        const logs = await Logger.getLogs({ level, limit, offset });

        res.json({
            success: true,
            message: 'Logs retrieved successfully',
            data: logs
        });
    } catch (error) {
        Logger.error('Error retrieving logs:', error, { userId: req.userId });
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve logs',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// ==================== SETTINGS ROUTES (MOVED FROM SETTINGS.JS) ====================

/**
 * @swagger
 * /api/admin/settings:
 *   get:
 *     summary: Get all settings (Admin only)
 *     tags: [Admin]
 *     security:
 *       - apiKey: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           maxLength: 50
 *         description: Filter by category
 *       - in: query
 *         name: publicOnly
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Return only public settings
 *     responses:
 *       200:
 *         description: Settings retrieved successfully
 */
router.get('/settings', [
    ValidationMiddleware.authenticateAdminApiKey,
    query('category').optional().isString().isLength({ max: 50 }),
    query('publicOnly').optional().isBoolean(),
    ValidationMiddleware.handleValidation
], async (req, res) => {
    try {
        const { category, publicOnly = false } = req.query;

        const settings = await SettingsService.getAllSettings({
            category,
            publicOnly
        });

        Logger.info('Settings retrieved', { 
            category, 
            count: Object.keys(settings).length,
            authenticated: true
        });

        res.json({
            success: true,
            message: 'Settings retrieved successfully',
            data: settings
        });
    } catch (error) {
        Logger.error('Error retrieving settings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve settings',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @swagger
 * /api/admin/settings/categories:
 *   get:
 *     summary: Get all setting categories (Admin only)
 *     tags: [Admin]
 *     security:
 *       - apiKey: []
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 */
router.get('/settings/categories', ValidationMiddleware.authenticateAdminApiKey, async (req, res) => {
    try {
        const categories = await SettingsService.getCategories();

        res.json({
            success: true,
            message: 'Categories retrieved successfully',
            data: categories
        });
    } catch (error) {
        Logger.error('Error retrieving categories:', error, { userId: req.userId });
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve categories',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @swagger
 * /api/admin/settings/bulk:
 *   post:
 *     summary: Bulk update settings (Admin only)
 *     tags: [Admin]
 *     security:
 *       - apiKey: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - settings
 *             properties:
 *               settings:
 *                 type: object
 *                 description: Key-value pairs of settings to update
 *               category:
 *                 type: string
 *                 description: Category for all settings
 *     responses:
 *       200:
 *         description: Settings updated successfully
 */
router.post('/settings/bulk', [
    ValidationMiddleware.authenticateAdminApiKey,
    body('settings').isObject(),
    body('category').optional().isString().isLength({ max: 50 }),
    ValidationMiddleware.handleValidation
], async (req, res) => {
    try {
        const { settings, category } = req.body;
        const results = [];
        
        // Process each setting individually
        for (const [key, value] of Object.entries(settings)) {
            try {
                const result = await SettingsService.set(key, value, req.userId);
                results.push({ key, value, success: true, result });
            } catch (error) {
                results.push({ key, value, success: false, error: error.message });
            }
        }

        Logger.info('Bulk settings update', { 
            count: Object.keys(settings).length,
            category,
            userId: req.userId
        });

        res.json({
            success: true,
            message: 'Settings updated successfully',
            data: {
                updated: results.length,
                settings: results
            }
        });
    } catch (error) {
        Logger.error('Error bulk updating settings:', error);
        res.status(400).json({
            success: false,
            message: 'Failed to update settings',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @swagger
 * /api/admin/settings/{key}:
 *   get:
 *     summary: Get a specific setting (Admin only)
 *     tags: [Admin]
 *     security:
 *       - apiKey: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: Setting key
 *     responses:
 *       200:
 *         description: Setting retrieved successfully
 *       404:
 *         description: Setting not found
 */
router.get('/settings/:key', [
    ValidationMiddleware.authenticateAdminApiKey,
    param('key').isString().isLength({ min: 1, max: 100 }),
    ValidationMiddleware.handleValidation
], async (req, res) => {
    try {
        const { key } = req.params;

        const setting = await SettingsService.getSetting(key, false); // Admin can see all settings

        if (setting === null) {
            return res.status(404).json({
                success: false,
                message: 'Setting not found'
            });
        }

        res.json({
            success: true,
            message: 'Setting retrieved successfully',
            data: { [key]: setting }
        });
    } catch (error) {
        Logger.error('Error retrieving setting:', error, { 
            key: req.params.key 
        });
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve setting',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @swagger
 * /api/admin/settings:
 *   post:
 *     summary: Create or update a setting (Admin only)
 *     tags: [Admin]
 *     security:
 *       - apiKey: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - key
 *               - value
 *             properties:
 *               key:
 *                 type: string
 *                 maxLength: 100
 *               value:
 *                 type: object
 *               description:
 *                 type: string
 *                 maxLength: 500
 *               category:
 *                 type: string
 *                 maxLength: 50
 *               isPublic:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       200:
 *         description: Setting created/updated successfully
 */
router.post('/settings', [
    ValidationMiddleware.authenticateAdminApiKey,
    body('key').notEmpty().isString().isLength({ min: 1, max: 100 }),
    body('value').exists(),
    body('description').optional().isString().isLength({ max: 500 }),
    body('category').optional().isString().isLength({ max: 50 }),
    body('isPublic').optional().isBoolean(),
    ValidationMiddleware.handleValidation
], async (req, res) => {
    try {
        const { key, value, description, category, isPublic } = req.body;
        
        // Try to find existing setting first
        const existingSetting = await SettingsService.getSetting(key, false);
        
        let setting;
        if (existingSetting) {
            // Update existing setting
            setting = await SettingsService.set(key, value, 'admin');
        } else {
            // Create new setting
            setting = await SettingsService.createSetting({
                key,
                value,
                description: description || `Setting: ${key}`,
                category: category || 'custom',
                isPublic: isPublic !== undefined ? isPublic : false,
                type: typeof value,
                isEditable: true,
                validation: { required: false } // Don't include enum restriction for custom settings
            }, 'admin');
        }

        Logger.info('Setting created/updated', { 
            key, 
            category,
            userId: 'admin',
            isNew: !existingSetting
        });

        res.json({
            success: true,
            message: existingSetting ? 'Setting updated successfully' : 'Setting created successfully',
            data: setting
        });
    } catch (error) {
        Logger.error('Error creating/updating setting:', error, { 
            key: req.body.key 
        });
        res.status(400).json({
            success: false,
            message: 'Failed to create/update setting',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @swagger
 * /api/admin/settings/{key}:
 *   put:
 *     summary: Update a specific setting (Admin only)
 *     tags: [Admin]
 *     security:
 *       - apiKey: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: Setting key
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - value
 *             properties:
 *               value:
 *                 type: object
 *               description:
 *                 type: string
 *                 maxLength: 500
 *               category:
 *                 type: string
 *                 maxLength: 50
 *               isPublic:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Setting updated successfully
 *       404:
 *         description: Setting not found
 */
router.put('/settings/:key', [
    ValidationMiddleware.authenticateAdminApiKey,
    param('key').isString().isLength({ min: 1, max: 100 }),
    body('value').exists(),
    body('description').optional().isString().isLength({ max: 500 }),
    body('category').optional().isString().isLength({ max: 50 }),
    body('isPublic').optional().isBoolean(),
    ValidationMiddleware.handleValidation
], async (req, res) => {
    try {
        const { key } = req.params;
        const { value, description, category, isPublic } = req.body;

        const setting = await SettingsService.set(key, value, 'admin');

        if (!setting) {
            return res.status(404).json({
                success: false,
                message: 'Setting not found'
            });
        }

        Logger.info('Setting updated', { 
            key, 
            category,
            userId: 'admin'
        });

        res.json({
            success: true,
            message: 'Setting updated successfully',
            data: setting
        });
    } catch (error) {
        Logger.error('Error updating setting:', error, { 
            key: req.params.key 
        });
        res.status(400).json({
            success: false,
            message: 'Failed to update setting',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @swagger
 * /api/admin/settings/{key}:
 *   delete:
 *     summary: Delete a setting (Admin only)
 *     tags: [Admin]
 *     security:
 *       - apiKey: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: Setting key
 *     responses:
 *       200:
 *         description: Setting deleted successfully
 *       404:
 *         description: Setting not found
 */
router.delete('/settings/:key', [
    ValidationMiddleware.authenticateAdminApiKey,
    param('key').isString().isLength({ min: 1, max: 100 }),
    ValidationMiddleware.handleValidation
], async (req, res) => {
    try {
        const { key } = req.params;
        const result = await SettingsService.deleteSetting(key);

        if (!result) {
            return res.status(404).json({
                success: false,
                message: 'Setting not found'
            });
        }

        Logger.info('Setting deleted', { 
            key,
            userId: req.userId
        });

        res.json({
            success: true,
            message: 'Setting deleted successfully'
        });
    } catch (error) {
        Logger.error('Error deleting setting:', error, { 
            key: req.params.key 
        });
        res.status(500).json({
            success: false,
            message: 'Failed to delete setting',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;
