const axios = require('axios');
const Logger = require('../utils/logger');

class EmailClient {
    constructor(config = {}) {
        this.baseURL = config.baseURL;
        this.apiKey = config.apiKey;
        this.timeout = config.timeout;
        this.retries = config.retries;
        this.retryDelay = config.retryDelay;
        
        this.client = axios.create({
            baseURL: this.baseURL,
            timeout: this.timeout,
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': this.apiKey,
                'User-Agent': 'NotificationService/1.0'
            }
        });

        // Add response interceptor for logging
        this.client.interceptors.response.use(
            (response) => {
                Logger.debug('Email service response', {
                    status: response.status,
                    messageId: response.data?.data?.messageId
                });
                return response;
            },
            (error) => {
                Logger.error('Email service error', {
                    status: error.response?.status,
                    message: error.response?.data?.message || error.message,
                    endpoint: error.config?.url
                });
                return Promise.reject(error);
            }
        );
    }

    /**
     * Send a single email
     * @param {Object} emailData - Email data
     * @returns {Promise<Object>} - Email sending result
     */
    async sendEmail(emailData) {
        const startTime = Date.now();
        
        try {
            const payload = this.formatEmailPayload(emailData);
            
            Logger.info('Sending email via email service', {
                to: payload.to,
                subject: payload.subject,
                priority: payload.priority
            });

            const response = await this.retryRequest(() => 
                this.client.post('/send-email', payload)
            );

            const processingTime = Date.now() - startTime;
            
            Logger.info('Email sent successfully', {
                messageId: response.data.data.messageId,
                to: payload.to,
                provider: response.data.data.provider,
                processingTime: `${processingTime}ms`
            });

            return {
                success: true,
                messageId: response.data.data.messageId,
                provider: response.data.data.provider,
                processingTime,
                data: response.data
            };

        } catch (error) {
            const processingTime = Date.now() - startTime;
            
            Logger.error('Failed to send email', {
                error: error.message,
                to: emailData.to,
                processingTime: `${processingTime}ms`,
                statusCode: error.response?.status
            });

            throw new Error(`Email sending failed: ${error.response?.data?.message || error.message}`);
        }
    }

    /**
     * Send bulk emails
     * @param {Array} emailsData - Array of email data objects
     * @returns {Promise<Object>} - Bulk sending result
     */
    async sendBulkEmails(emailsData) {
        const startTime = Date.now();
        
        try {
            if (!Array.isArray(emailsData) || emailsData.length === 0) {
                throw new Error('emailsData must be a non-empty array');
            }

            if (emailsData.length > 100) {
                throw new Error('Maximum 100 emails per batch');
            }

            const payload = {
                emails: emailsData.map(email => this.formatEmailPayload(email))
            };

            Logger.info('Sending bulk emails via email service', {
                count: emailsData.length
            });

            const response = await this.retryRequest(() => 
                this.client.post('/send-bulk-email', payload)
            );

            const processingTime = Date.now() - startTime;
            
            Logger.info('Bulk emails sent', {
                total: response.data.summary.total,
                successful: response.data.summary.successful,
                failed: response.data.summary.failed,
                successRate: response.data.summary.successRate,
                processingTime: `${processingTime}ms`
            });

            return {
                success: true,
                summary: response.data.summary,
                results: response.data.results,
                processingTime,
                data: response.data
            };

        } catch (error) {
            const processingTime = Date.now() - startTime;
            
            Logger.error('Failed to send bulk emails', {
                error: error.message,
                count: emailsData?.length,
                processingTime: `${processingTime}ms`,
                statusCode: error.response?.status
            });

            throw new Error(`Bulk email sending failed: ${error.response?.data?.message || error.message}`);
        }
    }

    /**
     * Check email service health
     * @returns {Promise<Object>} - Health status
     */
    async checkHealth() {
        try {
            const response = await this.client.get('/health');
            const data = response.data;
            
            // Extract health information from the actual response structure
            const isHealthy = data.success && 
                            data.database?.mongodb?.status === 'connected' &&
                            (data.smtp?.primary?.status === 'connected' || data.smtp?.backup?.status === 'connected');
            
            return {
                healthy: isHealthy,
                status: data.success ? 'operational' : 'degraded',
                smtp: data.smtp,
                version: data.version,
                database: data.database,
                queue: data.queue,
                system: data.system,
                timestamp: data.timestamp,
                uptime: data.system?.uptime
            };
        } catch (error) {
            Logger.warn('Email service health check failed', {
                error: error.message,
                statusCode: error.response?.status
            });
            
            return {
                healthy: false,
                error: error.message,
                statusCode: error.response?.status
            };
        }
    }

    /**
     * Get email service metrics
     * @returns {Promise<Object>} - Service metrics
     */
    async getMetrics() {
        try {
            const response = await this.client.get('/metrics');
            return response.data;
        } catch (error) {
            Logger.warn('Failed to get email service metrics', {
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Format email payload for the email service
     * @param {Object} emailData - Raw email data
     * @returns {Object} - Formatted payload
     */
    formatEmailPayload(emailData) {
        // Extract notification-specific data
        const {
            to,
            subject,
            message,
            html,
            text,
            priority = 'normal',
            cc,
            bcc,
            template,
            templateData,
            metadata = {}
        } = emailData;

        if (!to || !subject) {
            throw new Error('Email requires "to" and "subject" fields');
        }

        // Build the payload
        const payload = {
            to: to.trim().toLowerCase(),
            subject: subject.trim(),
            priority
        };

        // Handle HTML content
        if (html) {
            payload.html = html;
        } else if (message) {
            // Convert plain message to basic HTML
            payload.html = this.messageToHtml(message, templateData);
        } else {
            throw new Error('Email requires either "html" or "message" content');
        }

        // Add text version if provided
        if (text) {
            payload.text = text;
        } else if (message && !html) {
            payload.text = message;
        }

        // Add optional fields
        if (cc) payload.cc = cc;
        if (bcc) payload.bcc = bcc;

        // Add metadata
        payload.metadata = {
            ...metadata,
            source: 'notification-service',
            notificationId: metadata.notificationId,
            userId: metadata.userId,
            notificationType: metadata.type,
            timestamp: new Date().toISOString()
        };

        return payload;
    }

    /**
     * Convert plain message to basic HTML
     * @param {string} message - Plain text message
     * @param {Object} templateData - Optional template data
     * @returns {string} - HTML content
     */
    messageToHtml(message, templateData = {}) {
        // Basic HTML template for notifications
        const htmlTemplate = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Notification</title>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }
                .notification-container {
                    background: #f8f9fa;
                    border-radius: 8px;
                    padding: 24px;
                    border-left: 4px solid #007bff;
                }
                .notification-title {
                    color: #007bff;
                    font-size: 18px;
                    font-weight: 600;
                    margin-bottom: 16px;
                }
                .notification-message {
                    color: #495057;
                    font-size: 16px;
                    line-height: 1.5;
                    margin-bottom: 20px;
                }
                .notification-footer {
                    color: #6c757d;
                    font-size: 14px;
                    border-top: 1px solid #dee2e6;
                    padding-top: 16px;
                    margin-top: 20px;
                }
                .cta-button {
                    display: inline-block;
                    background: #007bff;
                    color: white;
                    padding: 12px 24px;
                    text-decoration: none;
                    border-radius: 5px;
                    font-weight: 500;
                    margin: 16px 0;
                }
            </style>
        </head>
        <body>
            <div class="notification-container">
                ${templateData.title ? `<div class="notification-title">${templateData.title}</div>` : ''}
                <div class="notification-message">
                    ${message.replace(/\n/g, '<br>')}
                </div>
                ${templateData.ctaText && templateData.ctaUrl ? 
                    `<a href="${templateData.ctaUrl}" class="cta-button">${templateData.ctaText}</a>` : ''
                }
                <div class="notification-footer">
                    ${templateData.appName || 'Your Dating App'}<br>
                    <small>This is an automated notification. Please do not reply to this email.</small>
                </div>
            </div>
        </body>
        </html>`;

        return htmlTemplate;
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
                
                // Don't retry on client errors (4xx)
                if (error.response?.status >= 400 && error.response?.status < 500) {
                    throw error;
                }
                
                if (attempt < this.retries) {
                    const delay = this.retryDelay * Math.pow(2, attempt - 1); // Exponential backoff
                    Logger.warn(`Email service request failed, retrying in ${delay}ms`, {
                        attempt,
                        maxRetries: this.retries,
                        error: error.message
                    });
                    
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
        
        throw lastError;
    }

    /**
     * Validate email address
     * @param {string} email - Email address to validate
     * @returns {boolean} - True if valid
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
}

module.exports = EmailClient;
