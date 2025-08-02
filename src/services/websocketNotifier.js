const axios = require('axios');
const Logger = require('../utils/logger');
const SettingsService = require('./settings');
const MetricsCollector = require('./metrics');

class WebSocketNotifier {
    constructor() {
        this.wsConfig = null;
        this.isInitialized = false;
        this.connectionAttempts = 0;
        this.maxRetries = 3;
        this.retryDelay = 2000;
    }

    async initialize() {
        try {
            Logger.info('🔌 Initializing WebSocket Notifier...');
            
            // Load WebSocket configuration from settings
            this.wsConfig = {
                host: SettingsService.get('websocket.host', 'localhost'),
                port: SettingsService.get('websocket.port', 3002),
                notifyEndpoint: SettingsService.get('websocket.notifyEndpoint', '/notify'),
                enabled: SettingsService.get('notifications.enableWebSocket', true),
                secret: SettingsService.get('server.secret.socket', '')
            };

            if (!this.wsConfig.enabled) {
                Logger.info('WebSocket notifications disabled in settings');
                return;
            }

            this.isInitialized = true;
            Logger.info('✅ WebSocket Notifier initialized', { config: this.wsConfig });
        } catch (error) {
            Logger.error('❌ Failed to initialize WebSocket Notifier:', error);
            throw error;
        }
    }

    /**
     * Send notification to user via WebSocket service
     */
    async sendNotification(userId, notificationData) {
        if (!this.isInitialized || !this.wsConfig.enabled) {
            Logger.debug('WebSocket notifier not initialized or disabled');
            return false;
        }

        const startTime = Date.now();
        let attempt = 0;

        while (attempt < this.maxRetries) {
            try {
                attempt++;
                
                const wsUrl = `${this.wsConfig.host}${this.wsConfig.notifyEndpoint}`;
                
                const payload = {
                    userId,
                    notification: {
                        id: notificationData.id,
                        title: notificationData.title,
                        message: notificationData.message,
                        type: notificationData.type,
                        priority: notificationData.priority,
                        metadata: notificationData.metadata,
                        timestamp: notificationData.createdAt || new Date().toISOString()
                    },
                    event: 'notification',
                    channel: `user:${userId}`
                };

                Logger.debug('Sending WebSocket notification', {
                    userId,
                    wsUrl,
                    attempt
                });

                const response = await axios.post(wsUrl, payload, {
                    timeout: 5000,
                    headers: {
                        'Content-Type': 'application/json',
                        'User-Agent': 'Notification-Microservice/1.0',
                        'Authorization': `Bearer ${this.wsConfig.secret}`
                    }
                });

                const duration = Date.now() - startTime;

                if (response.status === 200) {
                    Logger.logWebSocketEvent('notification_sent', userId, {
                        notificationId: notificationData.id,
                        type: notificationData.type,
                        duration: `${duration}ms`,
                        attempt
                    });

                    // Record successful delivery metric
                    await MetricsCollector.recordWebSocketMessage('notification', 'success');
                    
                    return true;
                } else {
                    throw new Error(`WebSocket service returned status: ${response.status}`);
                }

            } catch (error) {
                Logger.warn(`WebSocket notification attempt ${attempt} failed:`, error.message, {
                    userId,
                    notificationId: notificationData.id,
                    error: error.response?.data || error.message
                });

                // Record failed delivery metric
                await MetricsCollector.recordWebSocketMessage('notification', 'failed');

                if (attempt >= this.maxRetries) {
                    Logger.error('WebSocket notification failed after all retries', error, {
                        userId,
                        notificationId: notificationData.id,
                        attempts: attempt
                    });
                    return false;
                }

                // Wait before retry
                await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
            }
        }

        return false;
    }

    /**
     * Send bulk notifications
     */
    async sendBulkNotifications(notifications) {
        if (!this.isInitialized || !this.wsConfig.enabled) {
            Logger.debug('WebSocket notifier not initialized or disabled');
            return { successful: 0, failed: notifications.length };
        }

        const results = await Promise.allSettled(
            notifications.map(({ userId, notification }) => 
                this.sendNotification(userId, notification)
            )
        );

        const successful = results.filter(r => r.status === 'fulfilled' && r.value).length;
        const failed = results.length - successful;

        Logger.info('Bulk WebSocket notifications completed', {
            total: notifications.length,
            successful,
            failed
        });

        return { successful, failed };
    }

    /**
     * Send system broadcast to all connected users
     */
    async sendSystemBroadcast(notificationData) {
        if (!this.isInitialized || !this.wsConfig.enabled) {
            Logger.debug('WebSocket notifier not initialized or disabled');
            return false;
        }

        try {
            const wsUrl = `${this.wsConfig.host}${this.wsConfig.notifyEndpoint}`;
            
            const payload = {
                broadcast: true,
                notification: {
                    id: notificationData.id,
                    title: notificationData.title,
                    message: notificationData.message,
                    type: notificationData.type || 'system',
                    priority: notificationData.priority || 'normal',
                    metadata: notificationData.metadata,
                    timestamp: new Date().toISOString()
                },
                event: 'system_notification',
                channel: 'system'
            };

            const response = await axios.post(wsUrl, payload, {
                timeout: 10000,
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'Notification-Microservice/1.0',
                    'Authorization': `Bearer ${this.wsConfig.secret}`
                }
            });

            if (response.status === 200) {
                Logger.info('System broadcast sent successfully', {
                    notificationId: notificationData.id,
                    type: notificationData.type
                });

                await MetricsCollector.recordWebSocketMessage('system_broadcast', 'success');
                return true;
            }

            return false;
        } catch (error) {
            Logger.error('Failed to send system broadcast:', error);
            await MetricsCollector.recordWebSocketMessage('system_broadcast', 'failed');
            return false;
        }
    }

    /**
     * Send user status update (online/offline)
     */
    async sendUserStatusUpdate(userId, status, metadata = {}) {
        if (!this.isInitialized || !this.wsConfig.enabled) {
            return false;
        }

        try {
            const wsUrl = `${this.wsConfig.host}${this.wsConfig.notifyEndpoint}`;
            
            const payload = {
                userId,
                event: 'user_status_update',
                data: {
                    status, // 'online', 'offline', 'away', etc.
                    timestamp: new Date().toISOString(),
                    metadata
                },
                channel: `user:${userId}`
            };

            const response = await axios.post(wsUrl, payload, {
                timeout: 3000,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.wsConfig.secret}`
                }
            });

            if (response.status === 200) {
                Logger.logWebSocketEvent('user_status_update', userId, { status });
                await MetricsCollector.recordWebSocketMessage('status_update', 'success');
                return true;
            }

            return false;
        } catch (error) {
            Logger.warn('Failed to send user status update:', error.message, { userId, status });
            await MetricsCollector.recordWebSocketMessage('status_update', 'failed');
            return false;
        }
    }

    /**
     * Send typing indicator
     */
    async sendTypingIndicator(userId, isTyping, metadata = {}) {
        if (!this.isInitialized || !this.wsConfig.enabled) {
            return false;
        }

        try {
            const wsUrl = `${this.wsConfig.host}${this.wsConfig.notifyEndpoint}`;
            
            const payload = {
                userId,
                event: 'typing_indicator',
                data: {
                    isTyping,
                    timestamp: new Date().toISOString(),
                    metadata
                },
                channel: `user:${userId}`
            };

            await axios.post(wsUrl, payload, {
                timeout: 1000,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.wsConfig.secret}`
                }
            });

            return true;
        } catch (error) {
            // Don't log typing indicator failures as errors since they're not critical
            Logger.debug('Typing indicator failed:', error.message, { userId, isTyping });
            return false;
        }
    }

    /**
     * Check WebSocket service health
     */
    async checkWebSocketServiceHealth() {
        if (!this.isInitialized || !this.wsConfig.enabled) {
            return {
                status: 'disabled',
                message: 'WebSocket service is disabled'
            };
        }

        try {
            const healthUrl = `${this.wsConfig.host}/health`;
            
            const response = await axios.get(healthUrl, {
                timeout: 3000,
                headers: {
                    'Authorization': `Bearer ${this.wsConfig.secret}`
                }
            });

            if (response.status === 200) {
                return {
                    status: 'healthy',
                    message: 'WebSocket service is healthy',
                    serviceData: response.data
                };
            } else {
                return {
                    status: 'unhealthy',
                    message: `WebSocket service returned status: ${response.status}`
                };
            }
        } catch (error) {
            return {
                status: 'unhealthy',
                message: 'WebSocket service health check failed',
                error: error.message
            };
        }
    }

    /**
     * Get WebSocket service statistics
     */
    async getWebSocketServiceStats() {
        if (!this.isInitialized || !this.wsConfig.enabled) {
            return null;
        }

        try {
            const statsUrl = `${this.wsConfig.host}/stats`;
            
            const response = await axios.get(statsUrl, {
                timeout: 3000,
                headers: {
                    'Authorization': `Bearer ${this.wsConfig.secret}`
                }
            });

            return response.data;
        } catch (error) {
            Logger.warn('Failed to get WebSocket service stats:', error.message);
            return null;
        }
    }

    /**
     * Update configuration
     */
    async updateConfiguration() {
        try {
            this.wsConfig = {
                host: SettingsService.get('websocket.host', 'localhost'),
                port: SettingsService.get('websocket.port', 3002),
                notifyEndpoint: SettingsService.get('websocket.notifyEndpoint', '/notify'),
                enabled: SettingsService.get('notifications.enableWebSocket', true),
                secret: SettingsService.get('server.secret.socket', '')
            };

            Logger.info('WebSocket configuration updated', { config: this.wsConfig });
        } catch (error) {
            Logger.error('Failed to update WebSocket configuration:', error);
        }
    }

    /**
     * Test WebSocket connection
     */
    async testConnection() {
        if (!this.isInitialized || !this.wsConfig.enabled) {
            return false;
        }

        try {
            const testPayload = {
                test: true,
                event: 'connection_test',
                timestamp: new Date().toISOString()
            };

            const wsUrl = `${this.wsConfig.host}${this.wsConfig.notifyEndpoint}`;

            const response = await axios.post(wsUrl, testPayload, {
                timeout: 5000,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.wsConfig.secret}`
                }
            });

            return response.status === 200;
        } catch (error) {
            Logger.error('WebSocket connection test failed:', error);
            return false;
        }
    }

    /**
     * Health check
     */
    async healthCheck() {
        const serviceHealth = await this.checkWebSocketServiceHealth();
        
        return {
            status: this.isInitialized ? 'healthy' : 'unhealthy',
            message: this.isInitialized ? 'WebSocket notifier is healthy' : 'WebSocket notifier not initialized',
            config: this.wsConfig,
            serviceHealth
        };
    }

    /**
     * Get connection info
     */
    getConnectionInfo() {
        return {
            initialized: this.isInitialized,
            config: this.wsConfig,
            connectionAttempts: this.connectionAttempts,
            maxRetries: this.maxRetries
        };
    }
}

module.exports = new WebSocketNotifier();
