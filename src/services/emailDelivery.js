const EmailClient = require('../clients/emailClient');
const UserClient = require('../clients/userClient');
const Logger = require('../utils/logger');
const SettingsService = require('./settings');

class EmailDeliveryService {
    constructor() {
        this.emailClient = null;
        this.userClient = null;
        this.initialized = false;
        this.enabled = false;
    }

    async initialize() {
        try {
            // Get email service configuration from settings
            const emailConfig = {
                baseURL: SettingsService.get('email.serviceUrl'),
                apiKey: SettingsService.get('email.apiKey'),
                timeout: SettingsService.get('email.timeout'),
                retries: SettingsService.get('email.retries'),
                retryDelay: SettingsService.get('email.retryDelay')
            };

            this.emailClient = new EmailClient(emailConfig);
            this.enabled = SettingsService.get('notifications.enableEmail');

            // Initialize user client for fetching user data
            const userConfig = {
                baseURL: SettingsService.get('services.userService.url'),
                timeout: SettingsService.get('services.userService.timeout'),
                retries: SettingsService.get('services.userService.retries'),
                retryDelay: SettingsService.get('services.userService.retryDelay')
            };
            this.userClient = new UserClient(userConfig);

            if (this.enabled) {
                // Test email service connection
                const healthCheck = await this.emailClient.checkHealth();
                if (healthCheck.healthy) {
                    Logger.info('Email delivery service initialized successfully');
                    this.initialized = true;
                } else {
                    Logger.warn('Email service is not healthy, email delivery disabled', {
                        error: healthCheck.error
                    });
                    this.enabled = false;
                }
            } else {
                Logger.info('Email delivery service disabled in configuration');
            }

        } catch (error) {
            Logger.error('Failed to initialize email delivery service', {
                error: error.message
            });
            this.enabled = false;
        }
    }

    /**
     * Send notification via email
     * @param {Object} notification - Notification object
     * @param {Object} user - User object (optional)
     * @returns {Promise<Object>} - Delivery result
     */
    async sendNotificationEmail(notification, user = null) {
        if (!this.enabled || !this.initialized) {
            throw new Error('Email delivery service is not available');
        }

        try {
            const emailData = await this.buildEmailFromNotification(notification, user);
            const result = await this.emailClient.sendEmail(emailData);

            // Update notification with email delivery status
            await this.updateNotificationEmailStatus(notification.id, {
                sent: true,
                messageId: result.messageId,
                provider: result.provider,
                sentAt: new Date().toISOString()
            });

            Logger.info('Email notification sent successfully', {
                notificationId: notification.id,
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
            // Update notification with email delivery failure
            await this.updateNotificationEmailStatus(notification.id, {
                sent: false,
                error: error.message,
                failedAt: new Date().toISOString()
            });

            Logger.error('Failed to send email notification', {
                notificationId: notification.id,
                userId: notification.userId,
                error: error.message
            });

            throw error;
        }
    }

    /**
     * Build email data from notification
     * @param {Object} notification - Notification object
     * @param {Object} user - User object
     * @returns {Object} - Email data
     */
    async buildEmailFromNotification(notification, user) {
        const userEmail = await this.getUserEmail(notification.userId, user);
        
        if (!userEmail) {
            throw new Error('User email not found or invalid');
        }

        // Get email template configuration
        const emailTemplate = await this.getEmailTemplate(notification.type);
        
        const emailData = {
            to: userEmail,
            subject: await this.buildEmailSubject(notification, emailTemplate),
            message: notification.message,
            html: await this.buildEmailHtml(notification, emailTemplate, user),
            priority: this.mapNotificationPriorityToEmail(notification.priority),
            metadata: {
                notificationId: notification.id,
                userId: notification.userId,
                type: notification.type,
                source: 'notification-service'
            }
        };

        // Add template data for better HTML formatting
        if (emailTemplate) {
            emailData.templateData = {
                title: notification.title,
                userName: user?.name || user?.firstName || 'there',
                appName: SettingsService.get('app.name', 'Your Dating App'),
                ctaText: emailTemplate.ctaText,
                ctaUrl: emailTemplate.ctaUrl ? this.buildCtaUrl(emailTemplate.ctaUrl, notification) : null
            };
        }

        return emailData;
    }

    /**
     * Get user email address
     * @param {string} userId - User ID
     * @param {Object} user - User object (optional)
     * @returns {string|null} - User email
     */
    async getUserEmail(userId, user = null) {
        if (user && user.email) {
            return user.email;
        }

        // Try to get user email from user service
        try {
            if (this.userClient) {
                Logger.debug('Fetching user email from user service', { userId });
                const userEmail = await this.userClient.getUserEmail(userId);
                
                if (userEmail) {
                    Logger.debug('Successfully retrieved user email from user service', { 
                        userId, 
                        email: userEmail 
                    });
                    return userEmail;
                }
            }

            // Fallback: return null if we can't get the email
            Logger.warn('Could not retrieve user email', { userId });
            return null;

        } catch (error) {
            Logger.error('Error fetching user email', {
                userId,
                error: error.message
            });
            return null;
        }
    }

    /**
     * Get email template for notification type
     * @param {string} notificationType - Type of notification
     * @returns {Object|null} - Email template configuration
     */
    async getEmailTemplate(notificationType) {
        const templates = {
            match: {
                subjectPrefix: '💕 New Match',
                ctaText: 'View Match',
                ctaUrl: '/matches/{matchId}',
                category: 'engagement'
            },
            like: {
                subjectPrefix: '❤️ Someone Likes You',
                ctaText: 'See Who Liked You',
                ctaUrl: '/likes',
                category: 'engagement'
            },
            message: {
                subjectPrefix: '💬 New Message',
                ctaText: 'Read Message',
                ctaUrl: '/conversations/{conversationId}',
                category: 'messaging'
            },
            system: {
                subjectPrefix: '📢 System Notification',
                ctaText: 'Learn More',
                ctaUrl: '/notifications',
                category: 'system'
            },
            payment: {
                subjectPrefix: '💳 Payment Update',
                ctaText: 'View Payment Details',
                ctaUrl: '/payment/history',
                category: 'billing'
            },
            security: {
                subjectPrefix: '🔒 Security Alert',
                ctaText: 'Review Security',
                ctaUrl: '/security',
                category: 'security'
            }
        };

        return templates[notificationType] || templates.system;
    }

    /**
     * Build email subject line
     * @param {Object} notification - Notification object
     * @param {Object} template - Email template
     * @returns {string} - Email subject
     */
    async buildEmailSubject(notification, template) {
        const appName = SettingsService.get('app.name', 'Your App');
        const prefix = template?.subjectPrefix || '📢 Notification';
        
        // For high priority notifications, add urgent indicator
        const urgentIndicator = notification.priority === 'urgent' || notification.priority === 'high' ? ' [URGENT]' : '';
        
        return `${prefix} - ${appName}${urgentIndicator}`;
    }

    /**
     * Build HTML email content
     * @param {Object} notification - Notification object
     * @param {Object} template - Email template
     * @param {Object} user - User object
     * @returns {string} - HTML content
     */
    async buildEmailHtml(notification, template, user) {
        const appName = SettingsService.get('app.name', 'Your Dating App');
        const appUrl = SettingsService.get('app.url', 'https://yourapp.com');
        const userName = user?.name || user?.firstName || 'there';
        
        const ctaButton = template?.ctaText && template?.ctaUrl ? 
            `<a href="${this.buildCtaUrl(template.ctaUrl, notification)}" class="cta-button">${template.ctaText}</a>` : '';

        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${notification.title}</title>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: #f8f9fa;
                }
                .email-container {
                    background: white;
                    border-radius: 12px;
                    padding: 32px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }
                .header {
                    text-align: center;
                    margin-bottom: 32px;
                    padding-bottom: 20px;
                    border-bottom: 2px solid #f1f3f4;
                }
                .app-name {
                    color: #007bff;
                    font-size: 24px;
                    font-weight: 700;
                    margin: 0;
                }
                .notification-title {
                    color: #495057;
                    font-size: 20px;
                    font-weight: 600;
                    margin: 24px 0 16px 0;
                }
                .greeting {
                    color: #6c757d;
                    font-size: 16px;
                    margin-bottom: 20px;
                }
                .notification-message {
                    color: #495057;
                    font-size: 16px;
                    line-height: 1.6;
                    margin-bottom: 24px;
                    padding: 20px;
                    background: #f8f9fa;
                    border-radius: 8px;
                    border-left: 4px solid #007bff;
                }
                .cta-button {
                    display: inline-block;
                    background: linear-gradient(135deg, #007bff, #0056b3);
                    color: white !important;
                    padding: 14px 28px;
                    text-decoration: none;
                    border-radius: 8px;
                    font-weight: 600;
                    font-size: 16px;
                    margin: 20px 0;
                    text-align: center;
                    transition: background 0.3s ease;
                }
                .cta-button:hover {
                    background: linear-gradient(135deg, #0056b3, #004085);
                }
                .footer {
                    color: #6c757d;
                    font-size: 14px;
                    border-top: 1px solid #dee2e6;
                    padding-top: 20px;
                    margin-top: 32px;
                    text-align: center;
                }
                .unsubscribe {
                    color: #868e96;
                    font-size: 12px;
                    margin-top: 16px;
                }
                .unsubscribe a {
                    color: #868e96;
                }
                .priority-${notification.priority} {
                    border-left-color: ${this.getPriorityColor(notification.priority)};
                }
            </style>
        </head>
        <body>
            <div class="email-container">
                <div class="header">
                    <h1 class="app-name">${appName}</h1>
                </div>
                
                <div class="greeting">
                    Hi ${userName},
                </div>
                
                <h2 class="notification-title">${notification.title}</h2>
                
                <div class="notification-message priority-${notification.priority}">
                    ${notification.message.replace(/\n/g, '<br>')}
                </div>
                
                ${ctaButton}
                
                <div class="footer">
                    <p>Best regards,<br>The ${appName} Team</p>
                    <div class="unsubscribe">
                        <p>This is an automated notification from ${appName}.</p>
                        <p>If you no longer wish to receive these emails, you can <a href="${appUrl}/unsubscribe?token={unsubscribe_token}">unsubscribe here</a>.</p>
                    </div>
                </div>
            </div>
        </body>
        </html>`;
    }

    /**
     * Build CTA URL with dynamic parameters
     * @param {string} urlTemplate - URL template with placeholders
     * @param {Object} notification - Notification object
     * @returns {string} - Complete URL
     */
    buildCtaUrl(urlTemplate, notification) {
        const appUrl = SettingsService.get('app.url', 'https://yourapp.com');
        let url = urlTemplate;

        // Replace placeholders with actual values from metadata
        if (notification.metadata) {
            Object.keys(notification.metadata).forEach(key => {
                url = url.replace(`{${key}}`, notification.metadata[key]);
            });
        }

        // Ensure URL is absolute
        if (url.startsWith('/')) {
            url = appUrl + url;
        }

        return url;
    }

    /**
     * Get priority color for styling
     * @param {string} priority - Notification priority
     * @returns {string} - CSS color
     */
    getPriorityColor(priority) {
        const colors = {
            urgent: '#dc3545',
            high: '#fd7e14',
            normal: '#007bff',
            low: '#28a745'
        };
        return colors[priority] || colors.normal;
    }

    /**
     * Map notification priority to email priority
     * @param {string} notificationPriority - Notification priority
     * @returns {string} - Email priority
     */
    mapNotificationPriorityToEmail(notificationPriority) {
        const mapping = {
            urgent: 'high',
            high: 'high',
            normal: 'normal',
            low: 'low'
        };
        return mapping[notificationPriority] || 'normal';
    }

    /**
     * Update notification email delivery status
     * @param {string} notificationId - Notification ID
     * @param {Object} emailStatus - Email status data
     */
    async updateNotificationEmailStatus(notificationId, emailStatus) {
        try {
            // This would update the notification record in the database
            // Implementation depends on your notification model structure
            const Notification = require('../models/Notification');
            
            await Notification.findByIdAndUpdate(notificationId, {
                $set: {
                    'channels.email': emailStatus
                }
            });

        } catch (error) {
            Logger.error('Failed to update notification email status', {
                notificationId,
                error: error.message
            });
        }
    }

    /**
     * Check if email delivery is available
     * @returns {boolean} - True if available
     */
    isAvailable() {
        return this.enabled && this.initialized;
    }

    /**
     * Get email service health status
     * @returns {Promise<Object>} - Health status
     */
    async getHealthStatus() {
        const health = {
            email: { healthy: false },
            user: { healthy: false },
            overall: false
        };

        // Check email client health
        if (this.emailClient) {
            try {
                health.email = await this.emailClient.checkHealth();
            } catch (error) {
                health.email = { healthy: false, error: error.message };
            }
        } else {
            health.email = { healthy: false, error: 'Email client not initialized' };
        }

        // Check user client health
        if (this.userClient) {
            try {
                health.user = await this.userClient.checkHealth();
            } catch (error) {
                health.user = { healthy: false, error: error.message };
            }
        } else {
            health.user = { healthy: false, error: 'User client not initialized' };
        }

        // Overall health is true if email service is healthy (user service is optional for email delivery)
        health.overall = health.email.healthy;

        return health;
    }
}

module.exports = new EmailDeliveryService();
