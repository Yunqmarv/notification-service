const nodemailer = require('nodemailer');
const Logger = require('../utils/logger');

class EmailService {
    constructor() {
        this.transporter = null;
        this.isInitialized = false;
        this.emailTemplates = new Map();
        this.initializeTemplates();
    }

    async initialize() {
        try {
            Logger.info('📧 Initializing Email Service...');

            // Create transporter based on environment
            if (process.env.NODE_ENV === 'production') {
                // Production email configuration
                this.transporter = nodemailer.createTransporter({
                    host: process.env.SMTP_HOST || 'smtp.gmail.com',
                    port: parseInt(process.env.SMTP_PORT) || 587,
                    secure: process.env.SMTP_SECURE === 'true',
                    auth: {
                        user: process.env.SMTP_USER,
                        pass: process.env.SMTP_PASS
                    },
                    pool: true,
                    maxConnections: 5,
                    maxMessages: 100,
                    rateLimit: 14 // emails per second
                });
            } else {
                // Development: Use Ethereal Email (test email service)
                const testAccount = await nodemailer.createTestAccount();
                this.transporter = nodemailer.createTransporter({
                    host: 'smtp.ethereal.email',
                    port: 587,
                    secure: false,
                    auth: {
                        user: testAccount.user,
                        pass: testAccount.pass
                    }
                });

                Logger.info('📧 Using Ethereal Email for development', {
                    user: testAccount.user,
                    pass: testAccount.pass
                });
            }

            // Verify connection
            await this.transporter.verify();
            this.isInitialized = true;

            Logger.info('✅ Email Service initialized successfully');
        } catch (error) {
            Logger.error('❌ Failed to initialize Email Service:', error);
            throw error;
        }
    }

    /**
     * Initialize email templates
     */
    initializeTemplates() {
        // Welcome email template
        this.emailTemplates.set('welcome', {
            subject: 'Welcome to Our Dating App! 💕',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #e91e63;">Welcome, {{name}}! 💕</h1>
                    <p>We're excited to have you join our dating community!</p>
                    <p>Here are some tips to get started:</p>
                    <ul>
                        <li>Complete your profile</li>
                        <li>Add some great photos</li>
                        <li>Start exploring matches</li>
                    </ul>
                    <p>Happy dating!</p>
                    <p style="color: #666; font-size: 12px;">
                        This email was sent from our notification system.
                    </p>
                </div>
            `,
            text: 'Welcome, {{name}}! We are excited to have you join our dating community!'
        });

        // Match notification template
        this.emailTemplates.set('new_match', {
            subject: 'You have a new match! 💖',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #e91e63;">New Match! 💖</h1>
                    <p>Hi {{name}},</p>
                    <p>You have a new match with {{matchName}}!</p>
                    <p>Don't wait too long to say hello!</p>
                    <a href="{{appUrl}}/matches" style="background: #e91e63; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                        View Match
                    </a>
                </div>
            `,
            text: 'Hi {{name}}, You have a new match with {{matchName}}! Visit the app to say hello!'
        });

        // Message notification template
        this.emailTemplates.set('new_message', {
            subject: 'New message from {{senderName}}',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #e91e63;">New Message 💬</h1>
                    <p>Hi {{name}},</p>
                    <p>{{senderName}} sent you a message:</p>
                    <blockquote style="border-left: 3px solid #e91e63; padding-left: 15px; color: #666;">
                        {{messagePreview}}
                    </blockquote>
                    <a href="{{appUrl}}/messages" style="background: #e91e63; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                        Reply Now
                    </a>
                </div>
            `,
            text: 'Hi {{name}}, {{senderName}} sent you a message: {{messagePreview}}'
        });

        // Password reset template
        this.emailTemplates.set('password_reset', {
            subject: 'Reset Your Password',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #e91e63;">Reset Your Password 🔐</h1>
                    <p>Hi {{name}},</p>
                    <p>We received a request to reset your password. Click the button below to create a new password:</p>
                    <a href="{{resetUrl}}" style="background: #e91e63; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                        Reset Password
                    </a>
                    <p style="color: #666; font-size: 12px;">
                        This link will expire in 1 hour. If you didn't request this, please ignore this email.
                    </p>
                </div>
            `,
            text: 'Hi {{name}}, Click this link to reset your password: {{resetUrl}}'
        });

        // Generic notification template
        this.emailTemplates.set('notification', {
            subject: '{{subject}}',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #e91e63;">{{title}}</h1>
                    <p>Hi {{name}},</p>
                    <div>{{content}}</div>
                    {{#if actionUrl}}
                    <a href="{{actionUrl}}" style="background: #e91e63; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                        {{actionText}}
                    </a>
                    {{/if}}
                </div>
            `,
            text: 'Hi {{name}}, {{content}}'
        });

        Logger.info('📧 Email templates initialized', {
            templates: Array.from(this.emailTemplates.keys())
        });
    }

    /**
     * Send email using template
     */
    async sendTemplateEmail(templateName, recipientEmail, recipientName, templateData = {}) {
        if (!this.isInitialized) {
            throw new Error('Email service not initialized');
        }

        try {
            const template = this.emailTemplates.get(templateName);
            if (!template) {
                throw new Error(`Email template '${templateName}' not found`);
            }

            // Merge template data with defaults
            const data = {
                name: recipientName,
                appUrl: process.env.APP_URL || 'https://yourapp.com',
                ...templateData
            };

            // Replace template variables
            const subject = this.replaceTemplateVars(template.subject, data);
            const html = this.replaceTemplateVars(template.html, data);
            const text = this.replaceTemplateVars(template.text, data);

            const mailOptions = {
                from: `"${process.env.APP_NAME || 'Dating App'}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
                to: recipientEmail,
                subject,
                html,
                text
            };

            const result = await this.transporter.sendMail(mailOptions);

            Logger.info('📧 Email sent successfully', {
                template: templateName,
                to: recipientEmail,
                messageId: result.messageId
            });

            // Log preview URL for development
            if (process.env.NODE_ENV !== 'production') {
                Logger.info('📧 Preview URL:', nodemailer.getTestMessageUrl(result));
            }

            return {
                success: true,
                messageId: result.messageId,
                previewUrl: process.env.NODE_ENV !== 'production' ? 
                    nodemailer.getTestMessageUrl(result) : null
            };

        } catch (error) {
            Logger.error('❌ Failed to send email:', error, {
                template: templateName,
                to: recipientEmail
            });
            throw error;
        }
    }

    /**
     * Send custom email
     */
    async sendEmail(recipientEmail, subject, content, isHtml = true) {
        if (!this.isInitialized) {
            throw new Error('Email service not initialized');
        }

        try {
            const mailOptions = {
                from: `"${process.env.APP_NAME || 'Dating App'}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
                to: recipientEmail,
                subject
            };

            if (isHtml) {
                mailOptions.html = content;
                mailOptions.text = content.replace(/<[^>]*>/g, ''); // Strip HTML
            } else {
                mailOptions.text = content;
            }

            const result = await this.transporter.sendMail(mailOptions);

            Logger.info('📧 Custom email sent successfully', {
                to: recipientEmail,
                subject,
                messageId: result.messageId
            });

            return {
                success: true,
                messageId: result.messageId,
                previewUrl: process.env.NODE_ENV !== 'production' ? 
                    nodemailer.getTestMessageUrl(result) : null
            };

        } catch (error) {
            Logger.error('❌ Failed to send custom email:', error, {
                to: recipientEmail,
                subject
            });
            throw error;
        }
    }

    /**
     * Send bulk emails
     */
    async sendBulkEmails(emails) {
        if (!this.isInitialized) {
            throw new Error('Email service not initialized');
        }

        const results = [];
        const batchSize = 10; // Process in batches to avoid overwhelming the server

        try {
            for (let i = 0; i < emails.length; i += batchSize) {
                const batch = emails.slice(i, i + batchSize);
                
                const batchPromises = batch.map(async (emailData) => {
                    try {
                        if (emailData.template) {
                            return await this.sendTemplateEmail(
                                emailData.template,
                                emailData.to,
                                emailData.name,
                                emailData.data
                            );
                        } else {
                            return await this.sendEmail(
                                emailData.to,
                                emailData.subject,
                                emailData.content,
                                emailData.isHtml
                            );
                        }
                    } catch (error) {
                        return { success: false, error: error.message, to: emailData.to };
                    }
                });

                const batchResults = await Promise.allSettled(batchPromises);
                results.push(...batchResults.map(r => r.value || r.reason));

                // Small delay between batches
                if (i + batchSize < emails.length) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }

            const successful = results.filter(r => r.success).length;
            const failed = results.length - successful;

            Logger.info('📧 Bulk email sending completed', {
                total: emails.length,
                successful,
                failed
            });

            return { successful, failed, results };

        } catch (error) {
            Logger.error('❌ Bulk email sending failed:', error);
            throw error;
        }
    }

    /**
     * Replace template variables
     */
    replaceTemplateVars(template, data) {
        return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            return data[key] !== undefined ? data[key] : match;
        });
    }

    /**
     * Validate email address
     */
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    /**
     * Add custom template
     */
    addTemplate(name, template) {
        if (!template.subject || (!template.html && !template.text)) {
            throw new Error('Template must have subject and either html or text content');
        }

        this.emailTemplates.set(name, template);
        Logger.info('📧 Email template added', { name });
    }

    /**
     * Get template list
     */
    getTemplates() {
        return Array.from(this.emailTemplates.keys());
    }

    /**
     * Health check
     */
    async healthCheck() {
        try {
            if (!this.isInitialized) {
                return {
                    status: 'unhealthy',
                    message: 'Email service not initialized'
                };
            }

            await this.transporter.verify();
            
            return {
                status: 'healthy',
                message: 'Email service is operational',
                templates: this.getTemplates().length
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                message: 'Email service health check failed',
                error: error.message
            };
        }
    }

    /**
     * Get email statistics
     */
    async getStats() {
        // TODO: Implement email statistics tracking
        // This could include sent emails count, failed emails, bounce rates, etc.
        return {
            totalSent: 0,
            totalFailed: 0,
            templates: this.getTemplates().length,
            lastUpdated: new Date().toISOString()
        };
    }

    /**
     * Close transporter
     */
    async close() {
        if (this.transporter) {
            this.transporter.close();
            this.isInitialized = false;
            Logger.info('📧 Email service closed');
        }
    }
}

module.exports = new EmailService();
