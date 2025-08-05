const axios = require('axios');

class NotificationClient {
    constructor(config = {}) {
        this.baseURL = config.baseURL || process.env.NOTIFICATION_SERVICE_URL || 'https://notifications-v845.onrender.com';
        this.apiKey = config.apiKey || process.env.SYSTEM_API_KEY || '319f4d26e31c1a4c0b44e2a8dff8b2e8c83136557af36f9260c75ea3ca9164e8';
        this.timeout = config.timeout || 30000;
        this.retries = config.retries || 3;
        this.retryDelay = config.retryDelay || 1000;
        this.serviceName = config.serviceName || 'unknown-service';
        
        this.client = axios.create({
            baseURL: this.baseURL,
            timeout: this.timeout,
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey,
                'User-Agent': `${this.serviceName}/NotificationClient/1.0`
            }
        });

        // Add request interceptor for logging
        this.client.interceptors.request.use((config) => {
            if (this.debug) {
                console.log(`[NotificationClient] ${config.method?.toUpperCase()} ${config.url}`);
            }
            return config;
        });

        // Add response interceptor for error handling
        this.client.interceptors.response.use(
            (response) => {
                if (this.debug) {
                    console.log(`[NotificationClient] Response: ${response.status} - ${response.data?.message}`);
                }
                return response;
            },
            (error) => {
                console.error(`[NotificationClient] Error: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
                return Promise.reject(error);
            }
        );

        this.debug = config.debug || false;
    }

    /**
     * Create a notification for a user
     * @param {Object} notificationData - Notification data
     * @returns {Promise<Object>} - Created notification
     */
    async createNotification(notificationData) {
        try {
            const payload = this.formatNotificationPayload(notificationData);
            
            if (this.debug) {
                console.log('[NotificationClient] Creating notification:', {
                    userId: payload.userId,
                    type: payload.type,
                    title: payload.title
                });
            }

            const response = await this.retryRequest(() => 
                this.client.post('/api/system/notifications', payload)
            );

            if (this.debug) {
                console.log('[NotificationClient] Notification created:', {
                    id: response.data.data.id,
                    status: response.data.data.status
                });
            }

            return {
                success: true,
                notification: response.data.data,
                id: response.data.data.id
            };

        } catch (error) {
            console.error('[NotificationClient] Failed to create notification:', {
                error: error.message,
                userId: notificationData.userId,
                type: notificationData.type,
                statusCode: error.response?.status
            });

            throw new Error(`Notification creation failed: ${error.response?.data?.message || error.message}`);
        }
    }

    /**
     * Create multiple notifications in batch
     * @param {Array} notificationsData - Array of notification data
     * @returns {Promise<Object>} - Batch creation result
     */
    async createBulkNotifications(notificationsData) {
        if (!Array.isArray(notificationsData) || notificationsData.length === 0) {
            throw new Error('notificationsData must be a non-empty array');
        }

        const results = {
            successful: [],
            failed: [],
            total: notificationsData.length
        };

        if (this.debug) {
            console.log(`[NotificationClient] Creating ${notificationsData.length} notifications in batch`);
        }

        // Process in chunks to avoid overwhelming the server
        const chunkSize = 10;
        for (let i = 0; i < notificationsData.length; i += chunkSize) {
            const chunk = notificationsData.slice(i, i + chunkSize);
            
            const chunkPromises = chunk.map(async (notificationData, index) => {
                try {
                    const result = await this.createNotification(notificationData);
                    results.successful.push({
                        index: i + index,
                        notification: result.notification,
                        originalData: notificationData
                    });
                } catch (error) {
                    results.failed.push({
                        index: i + index,
                        error: error.message,
                        originalData: notificationData
                    });
                }
            });

            await Promise.all(chunkPromises);
        }

        if (this.debug) {
            console.log('[NotificationClient] Batch creation completed:', {
                total: results.total,
                successful: results.successful.length,
                failed: results.failed.length,
                successRate: `${((results.successful.length / results.total) * 100).toFixed(2)}%`
            });
        }

        return results;
    }

    /**
     * Send a match notification
     * @param {string} userId - User ID
     * @param {Object} matchData - Match information
     * @returns {Promise<Object>} - Notification result
     */
    async sendMatchNotification(userId, matchData) {
        const notification = {
            userId,
            title: 'New Match! 💕',
            message: `You have a new match with ${matchData.name || 'someone special'}!`,
            type: 'match',
            priority: 'high',
            metadata: {
                matchId: matchData.matchId,
                partnerId: matchData.partnerId,
                partnerName: matchData.name,
                profilePicture: matchData.profilePicture,
                category: 'matching'
            },
            channels: {
                push: true,
                email: matchData.emailNotifications !== false,
                websocket: true,
                inApp: true
            }
        };

        return this.createNotification(notification);
    }

    /**
     * Send a like notification
     * @param {string} userId - User ID
     * @param {Object} likeData - Like information
     * @returns {Promise<Object>} - Notification result
     */
    async sendLikeNotification(userId, likeData) {
        const notification = {
            userId,
            title: 'Someone likes you! ❤️',
            message: `${likeData.name || 'Someone'} liked your profile. Check them out!`,
            type: 'like',
            priority: 'normal',
            metadata: {
                likeId: likeData.likeId,
                likerId: likeData.likerId,
                likerName: likeData.name,
                profilePicture: likeData.profilePicture,
                category: 'engagement'
            },
            channels: {
                push: true,
                email: likeData.emailNotifications !== false,
                websocket: true,
                inApp: true
            }
        };

        return this.createNotification(notification);
    }

    /**
     * Send a message notification
     * @param {string} userId - User ID
     * @param {Object} messageData - Message information
     * @returns {Promise<Object>} - Notification result
     */
    async sendMessageNotification(userId, messageData) {
        const notification = {
            userId,
            title: 'New Message 💬',
            message: `${messageData.senderName || 'Someone'} sent you a message`,
            type: 'message',
            priority: 'high',
            metadata: {
                messageId: messageData.messageId,
                senderId: messageData.senderId,
                senderName: messageData.senderName,
                conversationId: messageData.conversationId,
                preview: messageData.preview,
                category: 'messaging'
            },
            channels: {
                push: true,
                email: messageData.emailNotifications !== false,
                websocket: true,
                inApp: true
            }
        };

        return this.createNotification(notification);
    }

    /**
     * Send a system notification
     * @param {string} userId - User ID
     * @param {Object} systemData - System notification data
     * @returns {Promise<Object>} - Notification result
     */
    async sendSystemNotification(userId, systemData) {
        const notification = {
            userId,
            title: systemData.title || 'System Notification',
            message: systemData.message,
            type: 'system',
            priority: systemData.priority || 'normal',
            metadata: {
                category: systemData.category || 'system',
                action: systemData.action,
                data: systemData.data
            },
            channels: {
                push: systemData.push !== false,
                email: systemData.email === true,
                websocket: true,
                inApp: true
            }
        };

        return this.createNotification(notification);
    }

    /**
     * Send a payment notification
     * @param {string} userId - User ID
     * @param {Object} paymentData - Payment information
     * @returns {Promise<Object>} - Notification result
     */
    async sendPaymentNotification(userId, paymentData) {
        const notification = {
            userId,
            title: paymentData.success ? 'Payment Successful ✅' : 'Payment Failed ❌',
            message: paymentData.message || (paymentData.success ? 
                'Your payment has been processed successfully.' : 
                'Your payment could not be processed. Please try again.'),
            type: 'payment',
            priority: 'high',
            metadata: {
                paymentId: paymentData.paymentId,
                amount: paymentData.amount,
                currency: paymentData.currency,
                success: paymentData.success,
                category: 'payment'
            },
            channels: {
                push: true,
                email: true,
                websocket: true,
                inApp: true
            }
        };

        return this.createNotification(notification);
    }

    /**
     * Send a security notification
     * @param {string} userId - User ID
     * @param {Object} securityData - Security event data
     * @returns {Promise<Object>} - Notification result
     */
    async sendSecurityNotification(userId, securityData) {
        const notification = {
            userId,
            title: securityData.title || 'Security Alert 🔒',
            message: securityData.message,
            type: 'security',
            priority: 'urgent',
            metadata: {
                eventType: securityData.eventType,
                ipAddress: securityData.ipAddress,
                location: securityData.location,
                timestamp: securityData.timestamp,
                category: 'security'
            },
            channels: {
                push: true,
                email: true,
                websocket: true,
                inApp: true
            }
        };

        return this.createNotification(notification);
    }

    /**
     * Check notification service health
     * @returns {Promise<Object>} - Health status
     */
    async checkHealth() {
        try {
            const response = await this.client.get('/health');
            return {
                healthy: true,
                status: response.data.status,
                version: response.data.version,
                uptime: response.data.uptime
            };
        } catch (error) {
            console.warn('[NotificationClient] Health check failed:', error.message);
            return {
                healthy: false,
                error: error.message,
                statusCode: error.response?.status
            };
        }
    }

    /**
     * Format notification payload
     * @param {Object} data - Raw notification data
     * @returns {Object} - Formatted payload
     */
    formatNotificationPayload(data) {
        const {
            userId,
            title,
            message,
            type,
            priority = 'normal',
            metadata = {},
            channels = {},
            scheduling = {}
        } = data;

        if (!userId || !title || !message || !type) {
            throw new Error('Notification requires userId, title, message, and type');
        }

        return {
            userId: userId.toString(),
            title: title.trim(),
            message: message.trim(),
            type,
            priority,
            metadata: {
                ...metadata,
                source: this.serviceName,
                createdBy: 'system',
                timestamp: new Date().toISOString()
            },
            channels: {
                push: true,
                email: false,
                websocket: true,
                inApp: true,
                ...channels
            },
            scheduling: {
                immediate: true,
                ...scheduling
            }
        };
    }

    /**
     * Retry mechanism for API requests
     * @param {Function} requestFn - Function that makes the API request
     * @returns {Promise} - Request result
     */
    async retryRequest(requestFn) {
        let lastError;
        
        for (let attempt = 1; attempt <= this.retries; attempt++) {
            try {
                return await requestFn();
            } catch (error) {
                lastError = error;
                
                // Don't retry on client errors (4xx) except 429 (rate limit)
                if (error.response?.status >= 400 && error.response?.status < 500 && error.response?.status !== 429) {
                    throw error;
                }
                
                if (attempt < this.retries) {
                    const delay = this.retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
                    
                    if (this.debug) {
                        console.log(`[NotificationClient] Request failed, retrying in ${delay}ms (attempt ${attempt}/${this.retries})`);
                    }
                    
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
        
        throw lastError;
    }

    /**
     * Enable or disable debug logging
     * @param {boolean} enable - Whether to enable debug logging
     */
    setDebug(enable) {
        this.debug = enable;
    }
}

module.exports = NotificationClient;
