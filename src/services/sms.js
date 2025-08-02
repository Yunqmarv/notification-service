const twilio = require('twilio');
const Logger = require('../utils/logger');

class SMSService {
    constructor() {
        this.client = null;
        this.isInitialized = false;
        this.smsTemplates = new Map();
        this.initializeTemplates();
    }

    async initialize() {
        try {
            Logger.info('📱 Initializing SMS Service...');

            // Get Twilio credentials from settings
            const settingsService = require('./settings');
            const twilioSettings = await settingsService.get('twilio');

            if (!twilioSettings.enabled) {
                Logger.info('📱 SMS Service disabled in settings');
                return;
            }

            this.client = twilio(twilioSettings.accountSid, twilioSettings.authToken);
            this.isInitialized = true;

            Logger.info('✅ SMS Service initialized successfully');
        } catch (error) {
            Logger.error('❌ Failed to initialize SMS Service:', error);
            // Don't throw error, just log it - SMS is optional
        }
    }

    initializeTemplates() {
        this.smsTemplates.set('verification', {
            message: 'Your verification code is: {{code}}. Valid for 10 minutes.'
        });

        this.smsTemplates.set('new_match', {
            message: 'You have a new match! 💕 Open the app to see who it is.'
        });

        this.smsTemplates.set('new_message', {
            message: 'New message from {{senderName}}! Open the app to reply.'
        });

        Logger.info('📱 SMS templates initialized');
    }

    async sendSMS(phoneNumber, message) {
        if (!this.isInitialized) {
            Logger.warn('📱 SMS Service not initialized, skipping SMS');
            return { success: false, reason: 'SMS service not initialized' };
        }

        try {
            const settingsService = require('./settings');
            const twilioSettings = await settingsService.get('twilio');

            const result = await this.client.messages.create({
                body: message,
                from: twilioSettings.phoneNumber,
                to: phoneNumber
            });

            Logger.info('📱 SMS sent successfully', {
                to: phoneNumber,
                sid: result.sid
            });

            return { success: true, sid: result.sid };
        } catch (error) {
            Logger.error('❌ Failed to send SMS:', error);
            return { success: false, error: error.message };
        }
    }

    async sendTemplateSMS(templateName, phoneNumber, templateData = {}) {
        const template = this.smsTemplates.get(templateName);
        if (!template) {
            throw new Error(`SMS template '${templateName}' not found`);
        }

        const message = this.replaceTemplateVars(template.message, templateData);
        return await this.sendSMS(phoneNumber, message);
    }

    replaceTemplateVars(template, data) {
        return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            return data[key] !== undefined ? data[key] : match;
        });
    }

    async healthCheck() {
        if (!this.isInitialized) {
            return { status: 'disabled', message: 'SMS service not initialized' };
        }

        return { status: 'healthy', message: 'SMS service operational' };
    }
}

module.exports = new SMSService();
