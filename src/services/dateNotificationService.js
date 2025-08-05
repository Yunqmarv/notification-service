const EmailDeliveryService = require('./emailDelivery');
const Logger = require('../utils/logger');
const SettingsService = require('./settings');

class DateNotificationService {
    constructor() {
        this.emailService = EmailDeliveryService;
    }

    /**
     * Build date request email notification
     * @param {Object} dateData - Date information
     * @param {Object} requesterInfo - Requester user info
     * @param {Object} recipientInfo - Recipient user info
     * @returns {Object} - Notification data
     */
    buildDateRequestNotification(dateData, requesterInfo, recipientInfo) {
        const formatDate = (date) => {
            return new Date(date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
        };

        const title = `New Date Invitation from ${requesterInfo.first_name}`;
        const message = `${requesterInfo.first_name} ${requesterInfo.last_name} has invited you on a date!

📅 When: ${formatDate(dateData.planned_date)}
📍 Where: ${dateData.location_name || 'Location to be determined'}
${dateData.details ? `💭 Message: ${dateData.details}` : ''}

You can accept or decline this invitation in the app.`;

        return {
            userId: recipientInfo.user_id,
            title,
            message,
            type: 'date_request',
            priority: 'normal',
            metadata: {
                dateId: dateData.date_id,
                requesterId: requesterInfo.user_id,
                recipientId: recipientInfo.user_id,
                plannedDate: dateData.planned_date,
                locationName: dateData.location_name,
                requesterName: `${requesterInfo.first_name} ${requesterInfo.last_name}`,
                requesterProfilePicture: requesterInfo.profile_picture
            },
            channels: {
                email: true,
                websocket: true,
                inApp: true,
                push: true
            }
        };
    }

    /**
     * Build date accepted email notification
     * @param {Object} dateData - Date information
     * @param {Object} requesterInfo - Requester user info
     * @param {Object} recipientInfo - Recipient user info
     * @returns {Object} - Notification data
     */
    buildDateAcceptedNotification(dateData, requesterInfo, recipientInfo) {
        const formatDate = (date) => {
            return new Date(date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
        };

        const title = `${recipientInfo.first_name} Accepted Your Date!`;
        const message = `Great news! ${recipientInfo.first_name} ${recipientInfo.last_name} has accepted your date invitation.

📅 When: ${formatDate(dateData.planned_date)}
📍 Where: ${dateData.location_name || 'Location to be determined'}

Get ready for your date! We'll send you reminders as the date approaches.`;

        return {
            userId: requesterInfo.user_id,
            title,
            message,
            type: 'date_accepted',
            priority: 'normal',
            metadata: {
                dateId: dateData.date_id,
                requesterId: requesterInfo.user_id,
                recipientId: recipientInfo.user_id,
                plannedDate: dateData.planned_date,
                locationName: dateData.location_name,
                recipientName: `${recipientInfo.first_name} ${recipientInfo.last_name}`,
                recipientProfilePicture: recipientInfo.profile_picture
            },
            channels: {
                email: true,
                websocket: true,
                inApp: true,
                push: true
            }
        };
    }

    /**
     * Build date declined email notification
     * @param {Object} dateData - Date information
     * @param {Object} requesterInfo - Requester user info
     * @param {Object} recipientInfo - Recipient user info
     * @param {string} reason - Decline reason (optional)
     * @returns {Object} - Notification data
     */
    buildDateDeclinedNotification(dateData, requesterInfo, recipientInfo, reason = '') {
        const title = `Date Invitation Update`;
        let message = `${recipientInfo.first_name} ${recipientInfo.last_name} has declined your date invitation.`;
        
        if (reason) {
            message += `\n\nReason: ${reason}`;
        }
        
        message += `\n\nDon't worry! There are plenty of other amazing people waiting to meet you. Keep exploring and you'll find your perfect match!`;

        return {
            userId: requesterInfo.user_id,
            title,
            message,
            type: 'date_declined',
            priority: 'normal',
            metadata: {
                dateId: dateData.date_id,
                requesterId: requesterInfo.user_id,
                recipientId: recipientInfo.user_id,
                recipientName: `${recipientInfo.first_name} ${recipientInfo.last_name}`,
                declineReason: reason
            },
            channels: {
                email: true,
                websocket: true,
                inApp: true,
                push: true
            }
        };
    }

    /**
     * Build date canceled email notification
     * @param {Object} dateData - Date information
     * @param {Object} requesterInfo - Requester user info
     * @param {Object} recipientInfo - Recipient user info
     * @param {string} reason - Cancellation reason (optional)
     * @returns {Object} - Notification data
     */
    buildDateCanceledNotification(dateData, requesterInfo, recipientInfo, reason = '') {
        const formatDate = (date) => {
            return new Date(date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
        };

        const title = `Date Canceled`;
        let message = `Unfortunately, ${requesterInfo.first_name} ${requesterInfo.last_name} has canceled your date scheduled for ${formatDate(dateData.planned_date)}.`;
        
        if (reason) {
            message += `\n\nReason: ${reason}`;
        }
        
        message += `\n\nWe're sorry for any inconvenience. Feel free to browse other matches and plan new dates!`;

        return {
            userId: recipientInfo.user_id,
            title,
            message,
            type: 'date_canceled',
            priority: 'normal',
            metadata: {
                dateId: dateData.date_id,
                requesterId: requesterInfo.user_id,
                recipientId: recipientInfo.user_id,
                plannedDate: dateData.planned_date,
                locationName: dateData.location_name,
                requesterName: `${requesterInfo.first_name} ${requesterInfo.last_name}`,
                cancellationReason: reason
            },
            channels: {
                email: true,
                websocket: true,
                inApp: true,
                push: true
            }
        };
    }

    /**
     * Build date reminder email notification
     * @param {Object} dateData - Date information
     * @param {Object} userInfo - User info (can be requester or recipient)
     * @param {string} reminderType - Type of reminder (24_hours, 1_hour, etc.)
     * @returns {Object} - Notification data
     */
    buildDateReminderNotification(dateData, userInfo, reminderType) {
        const formatDate = (date) => {
            return new Date(date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
        };

        const reminderTexts = {
            '24_hours': 'in 24 hours',
            '4_hours': 'in 4 hours',
            '1_hour': 'in 1 hour',
            '30_minutes': 'in 30 minutes'
        };

        const reminderText = reminderTexts[reminderType] || 'soon';
        const title = `Date Reminder - Your date is ${reminderText}`;
        const message = `Hi ${userInfo.first_name}! This is a friendly reminder that you have a date ${reminderText}.

📅 When: ${formatDate(dateData.planned_date)}
📍 Where: ${dateData.location_name || 'Location to be determined'}

Make sure you're ready and on time. Have a wonderful time!`;

        return {
            userId: userInfo.user_id,
            title,
            message,
            type: 'date_reminder',
            priority: 'normal',
            metadata: {
                dateId: dateData.date_id,
                plannedDate: dateData.planned_date,
                locationName: dateData.location_name,
                reminderType: reminderType
            },
            channels: {
                email: true,
                websocket: true,
                inApp: true,
                push: true
            }
        };
    }

    /**
     * Enhanced HTML email builder for date notifications
     * @param {Object} notification - Notification object
     * @param {Object} user - User object
     * @returns {string} - Enhanced HTML content
     */
    async buildDateEmailHtml(notification, user) {
        const appName = SettingsService.get('app.name', 'Your Dating App');
        const appUrl = SettingsService.get('app.url', 'https://yourapp.com');
        const userName = user?.first_name || user?.name || 'there';
        
        // Get date-specific styling and content
        const dateStyles = this.getDateEmailStyles(notification.type);
        const ctaUrl = this.buildDateCtaUrl(notification);
        const ctaText = this.getDateCtaText(notification.type);

        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${notification.title}</title>
            <style>
                ${this.getBaseEmailStyles()}
                ${dateStyles}
            </style>
        </head>
        <body>
            <div class="email-container">
                <div class="header">
                    <h1 class="app-name">${appName}</h1>
                    <div class="date-icon">${this.getDateIcon(notification.type)}</div>
                </div>
                
                <div class="greeting">
                    Hi ${userName},
                </div>
                
                <h2 class="notification-title">${notification.title}</h2>
                
                <div class="date-card ${notification.type}">
                    <div class="date-content">
                        ${this.buildDateCardContent(notification)}
                    </div>
                </div>
                
                <div class="notification-message">
                    ${notification.message.replace(/\n/g, '<br>')}
                </div>
                
                <div class="cta-container">
                    <a href="${ctaUrl}" class="cta-button ${notification.type}">${ctaText}</a>
                </div>
                
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
     * Get base email styles
     * @returns {string} - CSS styles
     */
    getBaseEmailStyles() {
        return `
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
            .date-icon {
                font-size: 32px;
                margin-top: 10px;
            }
            .notification-title {
                color: #495057;
                font-size: 20px;
                font-weight: 600;
                margin: 24px 0 16px 0;
                text-align: center;
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
                margin: 24px 0;
                padding: 20px;
                background: #f8f9fa;
                border-radius: 8px;
            }
            .cta-container {
                text-align: center;
                margin: 30px 0;
            }
            .cta-button {
                display: inline-block;
                color: white !important;
                padding: 14px 28px;
                text-decoration: none;
                border-radius: 8px;
                font-weight: 600;
                font-size: 16px;
                text-align: center;
                transition: all 0.3s ease;
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
        `;
    }

    /**
     * Get date-specific email styles
     * @param {string} type - Notification type
     * @returns {string} - CSS styles
     */
    getDateEmailStyles(type) {
        const styles = {
            date_request: `
                .date-card.date_request {
                    background: linear-gradient(135deg, #ff6b6b, #ff8e53);
                    color: white;
                    border-radius: 12px;
                    padding: 20px;
                    margin: 20px 0;
                }
                .cta-button.date_request {
                    background: linear-gradient(135deg, #ff6b6b, #ff8e53);
                }
                .cta-button.date_request:hover {
                    background: linear-gradient(135deg, #e55555, #e67a47);
                }
            `,
            date_accepted: `
                .date-card.date_accepted {
                    background: linear-gradient(135deg, #51cf66, #40c057);
                    color: white;
                    border-radius: 12px;
                    padding: 20px;
                    margin: 20px 0;
                }
                .cta-button.date_accepted {
                    background: linear-gradient(135deg, #51cf66, #40c057);
                }
                .cta-button.date_accepted:hover {
                    background: linear-gradient(135deg, #45b358, #37a84b);
                }
            `,
            date_declined: `
                .date-card.date_declined {
                    background: linear-gradient(135deg, #868e96, #6c757d);
                    color: white;
                    border-radius: 12px;
                    padding: 20px;
                    margin: 20px 0;
                }
                .cta-button.date_declined {
                    background: linear-gradient(135deg, #007bff, #0056b3);
                }
                .cta-button.date_declined:hover {
                    background: linear-gradient(135deg, #0056b3, #004085);
                }
            `,
            date_canceled: `
                .date-card.date_canceled {
                    background: linear-gradient(135deg, #dc3545, #c82333);
                    color: white;
                    border-radius: 12px;
                    padding: 20px;
                    margin: 20px 0;
                }
                .cta-button.date_canceled {
                    background: linear-gradient(135deg, #007bff, #0056b3);
                }
                .cta-button.date_canceled:hover {
                    background: linear-gradient(135deg, #0056b3, #004085);
                }
            `,
            date_reminder: `
                .date-card.date_reminder {
                    background: linear-gradient(135deg, #ffc107, #e0a800);
                    color: #212529;
                    border-radius: 12px;
                    padding: 20px;
                    margin: 20px 0;
                }
                .cta-button.date_reminder {
                    background: linear-gradient(135deg, #007bff, #0056b3);
                }
                .cta-button.date_reminder:hover {
                    background: linear-gradient(135deg, #0056b3, #004085);
                }
            `
        };

        return styles[type] || '';
    }

    /**
     * Get date icon for email
     * @param {string} type - Notification type
     * @returns {string} - Emoji icon
     */
    getDateIcon(type) {
        const icons = {
            date_request: '💖',
            date_accepted: '🎉',
            date_declined: '😔',
            date_canceled: '❌',
            date_reminder: '⏰'
        };
        return icons[type] || '💝';
    }

    /**
     * Build date card content
     * @param {Object} notification - Notification object
     * @returns {string} - HTML content
     */
    buildDateCardContent(notification) {
        if (!notification.metadata) return '';

        const formatDate = (dateString) => {
            return new Date(dateString).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
        };

        const content = [];
        
        if (notification.metadata.plannedDate) {
            content.push(`<div><strong>📅 When:</strong> ${formatDate(notification.metadata.plannedDate)}</div>`);
        }
        
        if (notification.metadata.locationName) {
            content.push(`<div><strong>📍 Where:</strong> ${notification.metadata.locationName}</div>`);
        }
        
        if (notification.metadata.requesterName) {
            content.push(`<div><strong>👤 With:</strong> ${notification.metadata.requesterName}</div>`);
        }
        
        if (notification.metadata.recipientName) {
            content.push(`<div><strong>👤 With:</strong> ${notification.metadata.recipientName}</div>`);
        }

        return content.join('<br>');
    }

    /**
     * Build CTA URL for date notifications
     * @param {Object} notification - Notification object
     * @returns {string} - Complete URL
     */
    buildDateCtaUrl(notification) {
        const appUrl = SettingsService.get('app.url', 'https://yourapp.com');
        const dateId = notification.metadata?.dateId;
        
        if (dateId) {
            return `${appUrl}/dates/${dateId}`;
        }
        
        return `${appUrl}/dates`;
    }

    /**
     * Get CTA text for date notifications
     * @param {string} type - Notification type
     * @returns {string} - CTA text
     */
    getDateCtaText(type) {
        const texts = {
            date_request: 'View Invitation',
            date_accepted: 'View Date Details',
            date_declined: 'Find New Matches',
            date_canceled: 'View Your Dates',
            date_reminder: 'View Date Details'
        };
        return texts[type] || 'View Details';
    }
}

module.exports = new DateNotificationService();
