const express = require('express');
const router = express.Router();
const { body, query, param, validationResult } = require('express-validator');
const NotificationService = require('../services/notification');
const ValidationMiddleware = require('../middleware/validation');
const CacheService = require('../services/cache');
const Logger = require('../utils/logger');

/**
 * @swagger
 * components:
 *   schemas:
 *     Notification:
 *       type: object
 *       required:
 *         - title
 *         - message
 *         - type
 *       properties:
 *         id:
 *           type: string
 *           description: Unique notification ID
 *         userId:
 *           type: string
 *           description: User ID who will receive the notification
 *         title:
 *           type: string
 *           maxLength: 200
 *           description: Notification title
 *         message:
 *           type: string
 *           maxLength: 1000
 *           description: Notification message
 *         type:
 *           type: string
 *           enum: [message, match, like, superlike, rizz, connection, system, promotional, reminder, update, alert, warning, error, success, info, achievement, event, social, payment, security, maintenance, date_request, date_accepted, date_declined, date_canceled, date_reminder]
 *           description: Notification type
 *         priority:
 *           type: string
 *           enum: [low, normal, high, urgent]
 *           default: normal
 *           description: Notification priority
 *         status:
 *           type: string
 *           enum: [pending, sent, delivered, read, failed]
 *           description: Notification status
 *         read:
 *           type: boolean
 *           description: Read status
 *         metadata:
 *           type: object
 *           description: Additional notification metadata
 *         channels:
 *           type: object
 *           description: Delivery channels configuration
 *         scheduling:
 *           type: object
 *           description: Scheduling configuration
 *         analytics:
 *           type: object
 *           description: Analytics data
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get user notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter by notification type
 *       - in: query
 *         name: read
 *         schema:
 *           type: boolean
 *         description: Filter by read status
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *         description: Filter by priority
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of notifications to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of notifications to skip
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, priority, type]
 *           default: createdAt
 *         description: Sort field
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Successfully retrieved notifications
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     notifications:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Notification'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         offset:
 *                           type: integer
 *                         hasMore:
 *                           type: boolean
 */
router.get('/', [
    query('type').optional().isString().isLength({ max: 50 }),
    query('read').optional().isBoolean(),
    query('status').optional().isString().isIn(['pending', 'sent', 'delivered', 'read', 'failed']),
    query('priority').optional().isString().isIn(['low', 'normal', 'high', 'urgent']),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('offset').optional().isInt({ min: 0 }).toInt(),
    query('sort').optional().isString().isIn(['createdAt', 'updatedAt', 'priority', 'type']),
    query('order').optional().isString().isIn(['asc', 'desc']),
    ValidationMiddleware.handleValidation
], async (req, res) => {
    try {
        const userId = req.userId;
        const filters = {
            type: req.query.type,
            read: req.query.read,
            status: req.query.status,
            priority: req.query.priority,
            limit: req.query.limit || 20,
            offset: req.query.offset || 0,
            sort: req.query.sort || 'createdAt',
            order: req.query.order || 'desc'
        };

        // Remove undefined values
        Object.keys(filters).forEach(key => {
            if (filters[key] === undefined) delete filters[key];
        });

        // Try cache first
        const cacheKey = `notifications:${userId}:${JSON.stringify(filters)}`;
        const cached = await CacheService.get(cacheKey);
        
        if (cached) {
            Logger.logCacheOperation('GET', cacheKey, true);
            return res.json({
                success: true,
                message: 'Notifications retrieved successfully',
                data: cached,
                cached: true
            });
        }

        const result = await NotificationService.getUserNotifications(userId, filters);
        
        // Cache the result
        await CacheService.set(cacheKey, result, 300); // 5 minutes
        Logger.logCacheOperation('SET', cacheKey);

        Logger.logNotificationEvent('notifications_retrieved', null, userId, { 
            count: result.notifications.length,
            filters 
        });

        res.json({
            success: true,
            message: 'Notifications retrieved successfully',
            data: result
        });
    } catch (error) {
        Logger.error('Error retrieving notifications:', error, { userId: req.userId });
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve notifications',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @swagger
 * /api/notifications/unread-count:
 *   get:
 *     summary: Get unread notifications count
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Optional notification type filter
 *     responses:
 *       200:
 *         description: Unread count retrieved successfully
 */
router.get('/unread-count', [
    query('type').optional().isString().isLength({ max: 50 }),
    ValidationMiddleware.handleValidation
], async (req, res) => {
    try {
        const userId = req.userId;
        const { type } = req.query;

        // Try cache first
        const cacheKey = `unread_count:${userId}:${type || 'all'}`;
        const cached = await CacheService.get(cacheKey);
        
        if (cached !== null) {
            Logger.logCacheOperation('GET', cacheKey, true);
            return res.json({
                success: true,
                message: 'Unread count retrieved successfully',
                data: { count: cached },
                cached: true
            });
        }

        const count = await NotificationService.getUnreadCount(userId, type);
        
        // Cache for 1 minute
        await CacheService.set(cacheKey, count, 60);
        Logger.logCacheOperation('SET', cacheKey);

        res.json({
            success: true,
            message: 'Unread count retrieved successfully',
            data: { count }
        });
    } catch (error) {
        Logger.error('Error retrieving unread count:', error, { userId: req.userId });
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve unread count',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @swagger
 * /api/notifications/grouped:
 *   get:
 *     summary: Get notifications grouped by type
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: includeRead
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include read notifications in groups
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Number of notification types to return
 *     responses:
 *       200:
 *         description: Grouped notifications retrieved successfully
 */
router.get('/grouped', [
    query('includeRead').optional().isBoolean(),
    query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
    ValidationMiddleware.handleValidation
], async (req, res) => {
    try {
        const userId = req.userId;
        const options = {
            includeRead: req.query.includeRead || false,
            limit: req.query.limit || 10
        };

        // Try cache first
        const cacheKey = `grouped_notifications:${userId}:${JSON.stringify(options)}`;
        const cached = await CacheService.get(cacheKey);
        
        if (cached) {
            Logger.logCacheOperation('GET', cacheKey, true);
            return res.json({
                success: true,
                message: 'Grouped notifications retrieved successfully',
                data: cached,
                cached: true
            });
        }

        const result = await NotificationService.getGroupedNotifications(userId, options);
        
        // Cache for 5 minutes
        await CacheService.set(cacheKey, result, 300);
        Logger.logCacheOperation('SET', cacheKey);

        res.json({
            success: true,
            message: 'Grouped notifications retrieved successfully',
            data: result
        });
    } catch (error) {
        Logger.error('Error retrieving grouped notifications:', error, { userId: req.userId });
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve grouped notifications',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @swagger
 * /api/notifications/{id}:
 *   get:
 *     summary: Get a specific notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Successfully retrieved notification
 *       404:
 *         description: Notification not found
 */
router.get('/:id', [
    param('id').isString().isLength({ min: 1, max: 100 }),
    ValidationMiddleware.handleValidation
], async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;

        const notification = await NotificationService.getNotificationById(id, userId);
        
        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        Logger.logNotificationEvent('notification_viewed', id, userId);

        res.json({
            success: true,
            message: 'Notification retrieved successfully',
            data: notification
        });
    } catch (error) {
        Logger.error('Error retrieving notification:', error, { 
            userId: req.userId, 
            notificationId: req.params.id 
        });
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve notification',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @swagger
 * /api/system/notifications:
 *   post:
 *     summary: Create a new notification (System endpoint - API key authentication required)
 *     tags: [System Notifications]
 *     description: This endpoint is for internal system use to create notifications using API key authentication
 *     security:
 *       - apiKeyAuth: []
 *     parameters:
 *       - in: header
 *         name: x-api-key
 *         required: true
 *         schema:
 *           type: string
 *         description: System API key for authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - title
 *               - message
 *               - type
 *             properties:
 *               userId:
 *                 type: string
 *                 description: Target user ID (required for system notifications)
 *                 example: "user123"
 *               title:
 *                 type: string
 *                 maxLength: 200
 *                 example: "New Match!"
 *               message:
 *                 type: string
 *                 maxLength: 1000
 *                 example: "You have a new match with Sarah"
 *               type:
 *                 type: string
 *                 enum: [message, match, like, superlike, rizz, connection, system, promotional, reminder, update, alert, warning, error, success, info, achievement, event, social, payment, security, maintenance, date_request, date_accepted, date_declined, date_canceled, date_reminder]
 *                 example: "match"
 *               priority:
 *                 type: string
 *                 enum: [low, normal, high, urgent]
 *                 default: normal
 *                 example: "high"
 *               metadata:
 *                 type: object
 *                 description: Additional notification metadata
 *                 example: { "matchId": "match123", "profilePicture": "url" }
 *               channels:
 *                 type: object
 *                 description: Delivery channels configuration
 *                 example: { "push": true, "email": true, "websocket": true }
 *               scheduling:
 *                 type: object
 *                 description: Scheduling configuration
 *                 example: { "immediate": true }
 *     responses:
 *       201:
 *         description: Notification created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Notification created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Notification'
 *       400:
 *         description: Invalid input data or missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "userId is required in payload for system notifications"
 *       401:
 *         description: Invalid or missing system API key
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Invalid or missing system API key"
 *                 code:
 *                   type: string
 *                   example: "INVALID_SYSTEM_API_KEY"
 */

/**
 * @swagger
 * /api/notifications:
 *   post:
 *     summary: Create a new notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
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
 *             properties:
 *               userId:
 *                 type: string
 *                 description: Target user ID (optional, defaults to current user)
 *               title:
 *                 type: string
 *                 maxLength: 200
 *               message:
 *                 type: string
 *                 maxLength: 1000
 *               type:
 *                 type: string
 *                 enum: [message, match, like, superlike, rizz, connection, system, promotional, reminder, update, alert, warning, error, success, info, achievement, event, social, payment, security, maintenance, date_request, date_accepted, date_declined, date_canceled, date_reminder]
 *               priority:
 *                 type: string
 *                 enum: [low, normal, high, urgent]
 *                 default: normal
 *               metadata:
 *                 type: object
 *               channels:
 *                 type: object
 *               scheduling:
 *                 type: object
 *     responses:
 *       201:
 *         description: Notification created successfully
 *       400:
 *         description: Invalid input data
 */
router.post('/', [
    body('userId').notEmpty().isString().isLength({ min: 1, max: 100 }),
    body('title').notEmpty().isString().isLength({ max: 200 }),
    body('message').notEmpty().isString().isLength({ max: 1000 }),
    body('type').notEmpty().isString().isIn([
        'message', 'match', 'like', 'superlike', 'rizz', 'connection',
        'system', 'promotional', 'reminder', 'update', 'alert',
        'warning', 'error', 'success', 'info', 'achievement',
        'event', 'social', 'payment', 'security', 'maintenance',
        'date_request', 'date_accepted', 'date_declined', 'date_canceled', 'date_reminder'
    ]),
    body('priority').optional().isString().isIn(['low', 'normal', 'high', 'urgent']),
    body('metadata').optional().isObject(),
    body('channels').optional().isObject(),
    body('scheduling').optional().isObject(),
    ValidationMiddleware.handleValidation
], async (req, res) => {
    try {
        // Check if this is a system request (API key auth) or user request (JWT auth)
        const isSystemRequest = req.baseUrl === '/api/system/notifications' || req.isSystem;
        
        const notificationData = {
            ...req.body,
            userId: req.body.userId, // For system requests, userId must be in payload
            createdBy: isSystemRequest ? 'system' : (req.userId || 'unknown')
        };

        // Validate that userId is provided for system requests
        if (isSystemRequest && !req.body.userId) {
            return res.status(400).json({
                success: false,
                message: 'userId is required in payload for system notifications'
            });
        }

        // For user requests, default to current user if no userId specified
        if (!isSystemRequest && !req.body.userId) {
            notificationData.userId = req.userId;
        }

        const notification = await NotificationService.createNotification(notificationData);

        Logger.logNotificationEvent('notification_created', notification.id, notification.userId, {
            type: notification.type,
            priority: notification.priority,
            createdBy: notificationData.createdBy,
            isSystemRequest
        });

        res.status(201).json({
            success: true,
            message: 'Notification created successfully',
            data: notification
        });
    } catch (error) {
        Logger.error('Error creating notification:', error, { 
            userId: req.userId || 'system',
            isSystemRequest: req.baseUrl === '/api/system/notifications' || req.isSystem
        });
        res.status(400).json({
            success: false,
            message: 'Failed to create notification',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   patch:
 *     summary: Mark notification as read/unread
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - read
 *             properties:
 *               read:
 *                 type: boolean
 *                 description: Read status
 *     responses:
 *       200:
 *         description: Notification status updated successfully
 *       404:
 *         description: Notification not found
 */
router.patch('/:id/read', [
    param('id').isString().isLength({ min: 1, max: 100 }),
    body('read').isBoolean(),
    ValidationMiddleware.handleValidation
], async (req, res) => {
    try {
        const { id } = req.params;
        const { read } = req.body;
        const userId = req.userId;

        const notification = await NotificationService.markNotificationAsRead(id, userId, read);
        
        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        // Clear cache
        await CacheService.clearPattern(`notifications:${userId}:*`);

        Logger.logNotificationEvent('notification_read_status_changed', id, userId, { read });

        res.json({
            success: true,
            message: `Notification marked as ${read ? 'read' : 'unread'}`,
            data: notification
        });
    } catch (error) {
        Logger.error('Error updating notification read status:', error, { 
            userId: req.userId, 
            notificationId: req.params.id 
        });
        res.status(500).json({
            success: false,
            message: 'Failed to update notification status',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @swagger
 * /api/notifications/mark-all-read:
 *   patch:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 description: Optional notification type filter
 *     responses:
 *       200:
 *         description: All notifications marked as read
 */
router.patch('/mark-all-read', [
    body('type').optional().isString().isLength({ max: 50 }),
    ValidationMiddleware.handleValidation
], async (req, res) => {
    try {
        const userId = req.userId;
        const { type } = req.body;

        const result = await NotificationService.markAllNotificationsAsRead(userId, type);

        // Clear cache
        await CacheService.clearPattern(`notifications:${userId}:*`);

        Logger.logNotificationEvent('all_notifications_marked_read', null, userId, { 
            type, 
            count: result.modifiedCount 
        });

        res.json({
            success: true,
            message: 'All notifications marked as read',
            data: {
                modifiedCount: result.modifiedCount
            }
        });
    } catch (error) {
        Logger.error('Error marking all notifications as read:', error, { userId: req.userId });
        res.status(500).json({
            success: false,
            message: 'Failed to mark notifications as read',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @swagger
 * /api/notifications/{id}:
 *   delete:
 *     summary: Delete a notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification deleted successfully
 *       404:
 *         description: Notification not found
 */
router.delete('/:id', [
    param('id').isString().isLength({ min: 1, max: 100 }),
    ValidationMiddleware.handleValidation
], async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;

        const result = await NotificationService.deleteNotification(id, userId);
        
        if (!result) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        // Clear cache
        await CacheService.clearPattern(`notifications:${userId}:*`);

        Logger.logNotificationEvent('notification_deleted', id, userId);

        res.json({
            success: true,
            message: 'Notification deleted successfully'
        });
    } catch (error) {
        Logger.error('Error deleting notification:', error, { 
            userId: req.userId, 
            notificationId: req.params.id 
        });
        res.status(500).json({
            success: false,
            message: 'Failed to delete notification',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});



/**
 * @swagger
 * /api/notifications/types/{type}:
 *   get:
 *     summary: Get notifications of a specific type
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification type
 *       - in: query
 *         name: read
 *         schema:
 *           type: boolean
 *         description: Filter by read status
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Number of notifications to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of notifications to skip
 *     responses:
 *       200:
 *         description: Notifications of specified type retrieved successfully
 */
router.get('/types/:type', [
    param('type').isString().isLength({ min: 1, max: 50 }),
    query('read').optional().isBoolean(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('offset').optional().isInt({ min: 0 }).toInt(),
    ValidationMiddleware.handleValidation
], async (req, res) => {
    try {
        const userId = req.userId;
        const { type } = req.params;
        const options = {
            read: req.query.read,
            limit: req.query.limit || 50,
            offset: req.query.offset || 0
        };

        // Remove undefined values
        Object.keys(options).forEach(key => {
            if (options[key] === undefined) delete options[key];
        });

        const result = await NotificationService.getNotificationsByType(userId, type, options);

        res.json({
            success: true,
            message: 'Notifications retrieved successfully',
            data: result
        });
    } catch (error) {
        Logger.error('Error retrieving notifications by type:', error, { 
            userId: req.userId, 
            type: req.params.type 
        });
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve notifications',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;
