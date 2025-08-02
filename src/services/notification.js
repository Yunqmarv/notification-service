const Notification = require('../models/Notification');
const { v4: uuidv4 } = require('uuid');
const Logger = require('../utils/logger');
const CacheService = require('./cache');
const SettingsService = require('./settings');
const WebSocketNotifier = require('./websocketNotifier');
const PushNotificationService = require('./pushNotification');
const EmailDeliveryService = require('./emailDelivery');
const MetricsCollector = require('./metrics');

class NotificationService {
    constructor() {
        this.defaultTTL = 2592000; // 30 days
        this.maxNotificationsPerUser = 1000;
    }

    /**
     * Create a new notification
     */
    async createNotification(notificationData) {
        try {
            const startTime = Date.now();
            
            // Generate unique notification ID
            const notificationId = uuidv4();
            
            // Get settings
            const defaultTTL = SettingsService.get('notifications.defaultTTL', this.defaultTTL);
            const maxPerUser = SettingsService.get('notifications.maxPerUser', this.maxNotificationsPerUser);
            
            // Set expiration date
            const expiresAt = notificationData.expiresAt || 
                new Date(Date.now() + (defaultTTL * 1000));

            // Determine if inApp is enabled - handle both boolean and object formats
            const inAppEnabled = typeof notificationData.channels?.inApp === 'boolean' 
                ? notificationData.channels.inApp
                : notificationData.channels?.inApp?.enabled ?? SettingsService.get('notifications.enableInApp', true);
            
            // Create notification object for channels configuration
            const channelsConfig = {
                push: {
                    enabled: typeof notificationData.channels?.push === 'boolean'
                        ? notificationData.channels.push
                        : notificationData.channels?.push?.enabled ?? SettingsService.get('notifications.enablePush', true)
                },
                email: {
                    enabled: typeof notificationData.channels?.email === 'boolean'
                        ? notificationData.channels.email
                        : notificationData.channels?.email?.enabled ?? SettingsService.get('notifications.enableEmail', false)
                },
                sms: {
                    enabled: typeof notificationData.channels?.sms === 'boolean'
                        ? notificationData.channels.sms
                        : notificationData.channels?.sms?.enabled ?? SettingsService.get('notifications.enableSMS', false)
                },
                websocket: {
                    enabled: typeof notificationData.channels?.websocket === 'boolean'
                        ? notificationData.channels.websocket
                        : notificationData.channels?.websocket?.enabled ?? SettingsService.get('notifications.enableWebSocket', true)
                },
                inApp: {
                    enabled: inAppEnabled
                }
            };

            let savedNotification = null;

            // Only save to database if inApp is enabled
            if (inAppEnabled) {
                // Create notification object
                const notification = new Notification({
                    notificationId,
                    userId: notificationData.userId,
                    title: notificationData.title,
                    message: notificationData.message,
                    type: notificationData.type,
                    priority: notificationData.priority || 'normal',
                    metadata: notificationData.metadata || {},
                    channels: {
                        ...channelsConfig,
                        inApp: {
                            enabled: true,
                            sent: true,
                            sentAt: new Date()
                        }
                    },
                    scheduling: notificationData.scheduling || {},
                    grouping: notificationData.grouping || {},
                    expiresAt
                });

                // Check user notification limit
                await this.enforceUserNotificationLimit(notificationData.userId, maxPerUser);

                // Save to database
                savedNotification = await notification.save();
                
                // Invalidate cache
                await this.invalidateUserCache(notificationData.userId);
            }

            // Create a notification object for delivery (even if not saved to DB)
            const deliveryNotification = {
                notificationId,
                userId: notificationData.userId,
                title: notificationData.title,
                message: notificationData.message,
                type: notificationData.type,
                priority: notificationData.priority || 'normal',
                metadata: notificationData.metadata || {},
                channels: channelsConfig,
                createdAt: new Date()
            };
            
            // Send through enabled channels (excluding inApp if not saved to DB)
            await this.deliverNotification(deliveryNotification);
            
            // Collect metrics
            const duration = Date.now() - startTime;
            await MetricsCollector.recordNotificationCreated(
                notificationData.type, 
                notificationData.priority, 
                duration
            );
            
            Logger.logNotificationEvent('notification_created', notificationId, notificationData.userId, {
                type: notificationData.type,
                priority: notificationData.priority,
                duration: `${duration}ms`,
                savedToDatabase: inAppEnabled
            });

            // Return the saved notification if exists, otherwise return the delivery notification data
            return savedNotification ? savedNotification.toJSON() : {
                notificationId,
                ...deliveryNotification,
                _id: null, // Indicate it wasn't saved to DB
                savedToDatabase: false
            };
        } catch (error) {
            Logger.error('Error creating notification:', error);
            await MetricsCollector.recordNotificationError('creation_failed');
            throw error;
        }
    }

    /**
     * Get notifications for a user
     */
    async getUserNotifications(userId, options = {}) {
        try {
            const startTime = Date.now();
            
            const {
                type,
                read,
                status,
                priority,
                limit = 20,
                offset = 0,
                sort = 'createdAt',
                order = 'desc',
                startDate,
                endDate
            } = options;

            // Use static method for optimized query
            const notifications = await Notification.getUserNotifications(userId, {
                type,
                read,
                status,
                priority,
                limit: Math.min(limit, 100), // Cap at 100
                offset,
                sort: order === 'desc' ? `-${sort}` : sort,
                startDate,
                endDate
            });

            // Get total count for pagination
            const countQuery = { userId };
            if (type) countQuery.type = type;
            if (read !== undefined) countQuery.readStatus = read;
            if (status) countQuery.status = status;
            if (priority) countQuery.priority = priority;
            if (startDate || endDate) {
                countQuery.createdAt = {};
                if (startDate) countQuery.createdAt.$gte = new Date(startDate);
                if (endDate) countQuery.createdAt.$lte = new Date(endDate);
            }

            const total = await Notification.countDocuments(countQuery);

            const result = {
                notifications,
                pagination: {
                    total,
                    limit,
                    offset,
                    hasMore: offset + limit < total
                }
            };

            const duration = Date.now() - startTime;
            Logger.logPerformanceMetric('get_user_notifications', duration, {
                userId,
                count: notifications.length,
                total
            });

            return result;
        } catch (error) {
            Logger.error('Error retrieving user notifications:', error, { userId });
            throw error;
        }
    }

    /**
     * Get a specific notification by ID
     */
    async getNotificationById(notificationId, userId) {
        try {
            const notification = await Notification.findOne({
                notificationId,
                userId
            }).lean();

            if (notification) {
                // Update analytics - impression
                await Notification.findOneAndUpdate(
                    { notificationId, userId },
                    {
                        $inc: { 'analytics.impressions': 1 },
                        $push: {
                            'analytics.interactions': {
                                type: 'impression',
                                timestamp: new Date()
                            }
                        }
                    }
                );
            }

            return notification;
        } catch (error) {
            Logger.error('Error retrieving notification by ID:', error, { notificationId, userId });
            throw error;
        }
    }

    /**
     * Mark notification as read/unread
     */
    async markNotificationAsRead(notificationId, userId, read = true) {
        try {
            Logger.debug('Attempting to mark notification as read:', { notificationId, userId, read });
            
            // First, check if the notification exists
            const existingNotification = await Notification.findOne({ notificationId, userId });
            Logger.debug('Found notification:', existingNotification ? 'Yes' : 'No');
            
            if (!existingNotification) {
                Logger.warn('Notification not found for marking as read:', { notificationId, userId });
                return null;
            }
            
            Logger.debug('Attempting to update notification...');
            
            // Try a simple update first
            const simpleUpdate = await Notification.findOneAndUpdate(
                { notificationId, userId },
                {
                    $set: {
                        readStatus: read,
                        readAt: read ? new Date() : null,
                        status: read ? 'read' : 'delivered'
                    }
                },
                { new: true }
            );
            
            Logger.debug('Simple update result:', simpleUpdate ? 'Success' : 'Failed');
            
            // If simple update works, try analytics update separately
            if (simpleUpdate) {
                try {
                    await Notification.findOneAndUpdate(
                        { notificationId, userId },
                        {
                            $inc: { 'analytics.impressions': 1 },
                            $push: {
                                'analytics.interactions': {
                                    type: read ? 'read' : 'unread',
                                    timestamp: new Date()
                                }
                            }
                        }
                    );
                    Logger.debug('Analytics update successful');
                } catch (analyticsError) {
                    Logger.warn('Analytics update failed:', analyticsError.message);
                    // Don't fail the whole operation for analytics
                }
            }
            
            const notification = simpleUpdate;
            
            Logger.debug('Update result:', notification ? 'Success' : 'Failed');

            if (notification) {
                Logger.debug('Notification updated successfully, clearing cache and recording metrics');
                try {
                    // Invalidate cache
                    await this.invalidateUserCache(userId);
                    Logger.debug('Cache invalidated successfully');
                } catch (cacheError) {
                    Logger.error('Cache invalidation failed:', cacheError);
                }
                
                try {
                    // Record metric
                    await MetricsCollector.recordNotificationRead(notification.type);
                    Logger.debug('Metrics recorded successfully');
                } catch (metricsError) {
                    Logger.error('Metrics recording failed:', metricsError);
                }
            } else {
                Logger.warn('Notification update returned null');
            }

            return notification;
        } catch (error) {
            Logger.error('Error marking notification as read - DETAILED:', {
                message: error.message,
                name: error.name,
                code: error.code,
                stack: error.stack,
                notificationId,
                userId
            });
            throw error;
        }
    }

    /**
     * Mark all notifications as read for a user
     */
    async markAllNotificationsAsRead(userId, type = null) {
        try {
            const query = { userId, readStatus: false };
            if (type) query.type = type;

            const result = await Notification.updateMany(query, {
                $set: {
                    readStatus: true,
                    readAt: new Date(),
                    status: 'read'
                }
            });

            // Invalidate cache
            await this.invalidateUserCache(userId);

            // Record metric
            await MetricsCollector.recordBulkNotificationRead(result.modifiedCount);

            return result;
        } catch (error) {
            Logger.error('Error marking all notifications as read:', error, { userId, type });
            throw error;
        }
    }

    /**
     * Delete a notification
     */
    async deleteNotification(notificationId, userId) {
        try {
            const result = await Notification.deleteOne({
                notificationId,
                userId
            });

            if (result.deletedCount > 0) {
                // Invalidate cache
                await this.invalidateUserCache(userId);
                
                // Record metric
                await MetricsCollector.recordNotificationDeleted();
            }

            return result.deletedCount > 0;
        } catch (error) {
            Logger.error('Error deleting notification:', error, { notificationId, userId });
            throw error;
        }
    }

    /**
     * Get unread notifications count
     */
    async getUnreadCount(userId, type = null) {
        try {
            const count = await Notification.getUnreadCount(userId, type);
            return count;
        } catch (error) {
            Logger.error('Error getting unread count:', error, { userId, type });
            throw error;
        }
    }

    /**
     * Get notifications grouped by type with only the most recent notification per type
     */
    async getGroupedNotifications(userId, options = {}) {
        try {
            const { includeRead = false, limit = 10 } = options;
            
            // Build the match stage for the aggregation pipeline
            const matchStage = { userId };
            if (!includeRead) {
                matchStage.readStatus = false;
            }

            // Aggregation pipeline to group by type and get the most recent notification
            const pipeline = [
                { $match: matchStage },
                { $sort: { createdAt: -1 } }, // Sort by newest first
                {
                    $group: {
                        _id: '$type', // Group by notification type
                        count: { $sum: 1 }, // Count total notifications of this type
                        unreadCount: {
                            $sum: {
                                $cond: [{ $eq: ['$readStatus', false] }, 1, 0]
                            }
                        },
                        type: { $first: '$type' },
                        // Get the most recent notification (first in sorted order)
                        notification: { $first: '$$ROOT' },
                        hasUnread: {
                            $max: {
                                $cond: [{ $eq: ['$readStatus', false] }, true, false]
                            }
                        }
                    }
                },
                { $sort: { 'notification.createdAt': -1 } }, // Sort groups by most recent notification
                { $limit: limit } // Limit number of groups returned
            ];

            const groups = await Notification.aggregate(pipeline);

            return { groups };
        } catch (error) {
            Logger.error('Error getting grouped notifications:', error, { userId });
            throw error;
        }
    }

    /**
     * Get notifications by type
     */
    async getNotificationsByType(userId, type, options = {}) {
        try {
            const {
                read,
                limit = 50,
                offset = 0,
                sort = 'createdAt',
                order = 'desc'
            } = options;

            const query = { userId, type };
            if (read !== undefined) query.readStatus = read;

            const notifications = await Notification.find(query)
                .sort({ [sort]: order === 'desc' ? -1 : 1 })
                .limit(Math.min(limit, 100))
                .skip(offset)
                .lean();

            const total = await Notification.countDocuments(query);

            return {
                notifications,
                pagination: {
                    total,
                    limit,
                    offset,
                    hasMore: offset + limit < total
                }
            };
        } catch (error) {
            Logger.error('Error getting notifications by type:', error, { userId, type });
            throw error;
        }
    }

    /**
     * Send bulk notifications
     */
    async sendBulkNotifications(notificationsData) {
        try {
            const batchId = uuidv4();
            const batchSize = SettingsService.get('notifications.batchSize', 100);
            const results = [];

            // Process in batches
            for (let i = 0; i < notificationsData.length; i += batchSize) {
                const batch = notificationsData.slice(i, i + batchSize);
                
                const batchNotifications = batch.map(data => ({
                    ...data,
                    grouping: {
                        ...data.grouping,
                        batchId
                    }
                }));

                const batchResults = await Promise.allSettled(
                    batchNotifications.map(data => this.createNotification(data))
                );

                results.push(...batchResults);
            }

            const successful = results.filter(r => r.status === 'fulfilled').length;
            const failed = results.filter(r => r.status === 'rejected').length;

            // Record metrics
            await MetricsCollector.recordBulkNotificationSent(successful, failed);

            return {
                batchId,
                total: notificationsData.length,
                successful,
                failed,
                results: results.map(r => r.status === 'fulfilled' ? r.value : r.reason)
            };
        } catch (error) {
            Logger.error('Error sending bulk notifications:', error);
            await MetricsCollector.recordNotificationError('bulk_send_failed');
            throw error;
        }
    }

    /**
     * Get notification analytics
     */
    async getNotificationAnalytics(userId, options = {}) {
        try {
            const analytics = await Notification.getAnalytics(userId, options);
            return analytics;
        } catch (error) {
            Logger.error('Error getting notification analytics:', error, { userId });
            throw error;
        }
    }

    /**
     * Cleanup expired notifications
     */
    async cleanupExpiredNotifications() {
        try {
            const result = await Notification.cleanupExpired();
            
            if (result.deletedCount > 0) {
                Logger.info(`Cleaned up ${result.deletedCount} expired notifications`);
                await MetricsCollector.recordNotificationCleanup(result.deletedCount);
            }

            return result;
        } catch (error) {
            Logger.error('Error cleaning up expired notifications:', error);
            throw error;
        }
    }

    /**
     * Deliver notification through enabled channels
     */
    async deliverNotification(notification) {
        try {
            const promises = [];

            // WebSocket delivery
            if (notification.channels.websocket.enabled) {
                promises.push(this.deliverViaWebSocket(notification));
            }

            // Push notification delivery
            if (notification.channels.push.enabled) {
                promises.push(this.deliverViaPush(notification));
            }

            // Email delivery
            if (notification.channels.email.enabled) {
                promises.push(this.deliverViaEmail(notification));
            }

            // SMS delivery
            if (notification.channels.sms.enabled) {
                promises.push(this.deliverViaSMS(notification));
            }

            // Execute all deliveries
            const results = await Promise.allSettled(promises);
            
            // Update delivery status
            await this.updateDeliveryStatus(notification.notificationId, results);

        } catch (error) {
            Logger.error('Error delivering notification:', error, {
                notificationId: notification.notificationId
            });
        }
    }

    /**
     * Deliver via WebSocket
     */
    async deliverViaWebSocket(notification) {
        try {
            await WebSocketNotifier.sendNotification(notification.userId, {
                id: notification.notificationId,
                title: notification.title,
                message: notification.message,
                type: notification.type,
                priority: notification.priority,
                metadata: notification.metadata,
                createdAt: notification.createdAt
            });

            await Notification.findOneAndUpdate(
                { notificationId: notification.notificationId },
                {
                    'channels.websocket.sent': true,
                    'channels.websocket.sentAt': new Date()
                }
            );

            await MetricsCollector.recordNotificationDelivered('websocket');
        } catch (error) {
            await Notification.findOneAndUpdate(
                { notificationId: notification.notificationId },
                {
                    'channels.websocket.error': error.message
                }
            );
            throw error;
        }
    }

    /**
     * Deliver via Push Notification
     */
    async deliverViaPush(notification) {
        try {
            const messageId = await PushNotificationService.sendPushNotification(
                notification.userId,
                {
                    title: notification.title,
                    body: notification.message,
                    data: {
                        notificationId: notification.notificationId,
                        type: notification.type,
                        metadata: notification.metadata
                    }
                }
            );

            await Notification.findOneAndUpdate(
                { notificationId: notification.notificationId },
                {
                    'channels.push.sent': true,
                    'channels.push.sentAt': new Date(),
                    'channels.push.messageId': messageId
                }
            );

            await MetricsCollector.recordNotificationDelivered('push');
        } catch (error) {
            await Notification.findOneAndUpdate(
                { notificationId: notification.notificationId },
                {
                    'channels.push.error': error.message
                }
            );
            Logger.warn('Push notification delivery failed:', error);
        }
    }

    /**
     * Deliver via Email
     */
    async deliverViaEmail(notification) {
        try {
            if (!EmailDeliveryService.isAvailable()) {
                Logger.debug('Email delivery service not available');
                return { success: false, error: 'Email service not available' };
            }

            Logger.debug('Attempting email delivery', {
                notificationId: notification.notificationId,
                userId: notification.userId,
                type: notification.type
            });

            const result = await EmailDeliveryService.sendNotificationEmail(notification);
            
            Logger.info('Email notification delivered successfully', {
                notificationId: notification.notificationId,
                userId: notification.userId,
                messageId: result.messageId,
                provider: result.provider
            });

            return { 
                success: true, 
                messageId: result.messageId,
                provider: result.provider,
                channel: 'email'
            };

        } catch (error) {
            Logger.warn('Email delivery failed:', {
                notificationId: notification.notificationId,
                userId: notification.userId,
                error: error.message
            });
            
            return { 
                success: false, 
                error: error.message,
                channel: 'email'
            };
        }
    }

    /**
     * Deliver via SMS (placeholder)
     */
    async deliverViaSMS(notification) {
        try {
            // TODO: Implement SMS delivery
            Logger.debug('SMS delivery not implemented yet');
        } catch (error) {
            Logger.warn('SMS delivery failed:', error);
        }
    }

    /**
     * Update delivery status
     */
    async updateDeliveryStatus(notificationId, deliveryResults) {
        try {
            const hasSuccessfulDelivery = deliveryResults.some(r => r.status === 'fulfilled');
            
            await Notification.findOneAndUpdate(
                { notificationId },
                {
                    $set: {
                        status: hasSuccessfulDelivery ? 'sent' : 'failed',
                        'analytics.lastDeliveryAttempt': new Date()
                    },
                    $inc: {
                        'analytics.deliveryAttempts': 1
                    }
                }
            );
        } catch (error) {
            Logger.error('Error updating delivery status:', error, { notificationId });
        }
    }

    /**
     * Enforce user notification limit
     */
    async enforceUserNotificationLimit(userId, maxNotifications) {
        try {
            const count = await Notification.countDocuments({ userId });
            
            if (count >= maxNotifications) {
                // Delete oldest notifications to make room
                const excess = count - maxNotifications + 1;
                const oldestNotifications = await Notification.find({ userId })
                    .sort({ createdAt: 1 })
                    .limit(excess)
                    .select('notificationId');

                const idsToDelete = oldestNotifications.map(n => n.notificationId);
                
                await Notification.deleteMany({
                    notificationId: { $in: idsToDelete }
                });

                Logger.info(`Deleted ${excess} old notifications for user ${userId}`);
            }
        } catch (error) {
            Logger.error('Error enforcing notification limit:', error, { userId });
        }
    }

    /**
     * Invalidate user cache
     */
    async invalidateUserCache(userId) {
        try {
            await CacheService.clearPattern(`notifications:${userId}:*`);
            await CacheService.clearPattern(`unread_count:${userId}:*`);
            await CacheService.clearPattern(`grouped_notifications:${userId}:*`);
        } catch (error) {
            Logger.error('Error invalidating user cache:', error, { userId });
        }
    }

    /**
     * Health check
     */
    async healthCheck() {
        try {
            // Test database connection
            await Notification.findOne().limit(1);
            
            // Get basic stats
            const stats = await Notification.aggregate([
                {
                    $group: {
                        _id: null,
                        total: { $sum: 1 },
                        unread: {
                            $sum: { $cond: [{ $eq: ['$readStatus', false] }, 1, 0] }
                        },
                        pending: {
                            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
                        }
                    }
                }
            ]);

            return {
                status: 'healthy',
                message: 'Notification service is healthy',
                stats: stats[0] || { total: 0, unread: 0, pending: 0 }
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                message: 'Notification service health check failed',
                error: error.message
            };
        }
    }
}

module.exports = new NotificationService();
