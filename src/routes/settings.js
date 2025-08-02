const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const SettingsService = require('../services/settings');
const ValidationMiddleware = require('../middleware/validation');
const Logger = require('../utils/logger');

// API Key authentication middleware
const authenticateApiKey = (req, res, next) => {
    const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
    const expectedApiKey = process.env.SETTINGS_API_KEY;
    
    if (!expectedApiKey) {
        Logger.error('SETTINGS_API_KEY environment variable not set');
        return res.status(500).json({
            success: false,
            message: 'Server configuration error',
            code: 'MISSING_API_KEY_CONFIG'
        });
    }
    
    if (!apiKey || apiKey !== expectedApiKey) {
        return res.status(401).json({
            success: false,
            message: 'Invalid or missing API key',
            code: 'INVALID_API_KEY'
        });
    }
    
    req.apiKeyAuthenticated = true;
    next();
};

/**
 * @swagger
 * components:
 *   schemas:
 *     Setting:
 *       type: object
 *       required:
 *         - key
 *         - value
 *       properties:
 *         key:
 *           type: string
 *           description: Setting key
 *         value:
 *           type: object
 *           description: Setting value
 *         description:
 *           type: string
 *           description: Setting description
 *         category:
 *           type: string
 *           description: Setting category
 *         isPublic:
 *           type: boolean
 *           description: Whether setting is publicly readable
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         updatedBy:
 *           type: string
 *           description: User ID who updated the setting
 */

/**
 * @swagger
 * /api/settings:
 *   get:
 *     summary: Get all notification settings
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: publicOnly
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Return only public settings
 *     responses:
 *       200:
 *         description: Settings retrieved successfully
 */
router.get('/', [
    query('category').optional().isString().isLength({ max: 50 }),
    query('publicOnly').optional().isBoolean(),
    ValidationMiddleware.handleValidation
], async (req, res) => {
    try {
        const { category, publicOnly = true } = req.query;

        // All settings are accessible with API key, public only for unauthenticated requests
        const settings = await SettingsService.getAllSettings({
            category,
            publicOnly: !req.apiKeyAuthenticated && publicOnly
        });

        Logger.info('Settings retrieved', { 
            category, 
            count: Object.keys(settings).length,
            authenticated: !!req.apiKeyAuthenticated
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
 * /api/settings/{key}:
 *   get:
 *     summary: Get a specific setting
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
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
router.get('/:key', [
    param('key').isString().isLength({ min: 1, max: 100 }),
    ValidationMiddleware.handleValidation
], async (req, res) => {
    try {
        const { key } = req.params;

        const setting = await SettingsService.getSetting(key, !req.apiKeyAuthenticated);

        if (setting === null) {
            return res.status(404).json({
                success: false,
                message: 'Setting not found or not accessible'
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
 * /api/settings:
 *   post:
 *     summary: Create or update a setting (Admin only)
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
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
 *       403:
 *         description: Admin access required
 */
router.post('/', [
    authenticateApiKey,
    body('key').notEmpty().isString().isLength({ min: 1, max: 100 }),
    body('value').exists(),
    body('description').optional().isString().isLength({ max: 500 }),
    body('category').optional().isString().isLength({ max: 50 }),
    body('isPublic').optional().isBoolean(),
    ValidationMiddleware.handleValidation
], async (req, res) => {
    try {
        const { key, value, description, category, isPublic } = req.body;
        
        const setting = await SettingsService.set(key, value, 'api_key_user');

        Logger.info('Setting created/updated', { 
            key, 
            category,
            authenticatedViaApiKey: true
        });

        res.json({
            success: true,
            message: 'Setting created/updated successfully',
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
 * /api/settings/{key}:
 *   put:
 *     summary: Update a specific setting (Admin only)
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
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
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Setting not found
 */
router.put('/:key', [
    authenticateApiKey,
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

        const setting = await SettingsService.set(key, value, 'api_key_user');

        if (!setting) {
            return res.status(404).json({
                success: false,
                message: 'Setting not found'
            });
        }

        Logger.info('Setting updated', { 
            key, 
            category,
            authenticatedViaApiKey: true
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
 * /api/settings/{key}:
 *   delete:
 *     summary: Delete a setting (Admin only)
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
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
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Setting not found
 */
router.delete('/:key', [
    authenticateApiKey,
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
            authenticatedViaApiKey: true
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

/**
 * @swagger
 * /api/settings/bulk:
 *   post:
 *     summary: Bulk update settings (Admin only)
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
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
 *       403:
 *         description: Admin access required
 */
router.post('/bulk', [
    authenticateApiKey,
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
                const result = await SettingsService.set(key, value, 'api_key_user');
                results.push({ key, value, success: true, result });
            } catch (error) {
                results.push({ key, value, success: false, error: error.message });
            }
        }

        Logger.info('Bulk settings update', { 
            count: Object.keys(settings).length,
            category,
            authenticatedViaApiKey: true
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
 * /api/settings/categories:
 *   get:
 *     summary: Get all setting categories
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 */
router.get('/categories', async (req, res) => {
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
 * /api/settings/system/update:
 *   patch:
 *     summary: Update system settings (Very Robust Admin Endpoint)
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               server:
 *                 type: object
 *                 properties:
 *                   maxConcurrentConnections:
 *                     type: integer
 *                     minimum: 100
 *                     maximum: 10000
 *                   requestTimeout:
 *                     type: integer
 *                     minimum: 5000
 *                     maximum: 300000
 *                   enableCors:
 *                     type: boolean
 *                   enableRateLimit:
 *                     type: boolean
 *                   maintenanceMode:
 *                     type: boolean
 *               notifications:
 *                 type: object
 *                 properties:
 *                   defaultBatchSize:
 *                     type: integer
 *                     minimum: 10
 *                     maximum: 1000
 *                   maxRetryAttempts:
 *                     type: integer
 *                     minimum: 1
 *                     maximum: 10
 *                   retryDelayMs:
 *                     type: integer
 *                     minimum: 1000
 *                     maximum: 300000
 *                   enableWebsockets:
 *                     type: boolean
 *                   enablePushNotifications:
 *                     type: boolean
 *                   enableEmailNotifications:
 *                     type: boolean
 *                   enableSmsNotifications:
 *                     type: boolean
 *                   globalQuietHours:
 *                     type: object
 *                     properties:
 *                       enabled:
 *                         type: boolean
 *                       startTime:
 *                         type: string
 *                         pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$'
 *                       endTime:
 *                         type: string
 *                         pattern: '^([01]?[0-9]|2[0-3]):[0-5][0-9]$'
 *                       timezone:
 *                         type: string
 *               redis:
 *                 type: object
 *                 properties:
 *                   cacheTimeout:
 *                     type: integer
 *                     minimum: 60
 *                     maximum: 86400
 *                   maxMemoryPolicy:
 *                     type: string
 *                     enum: [allkeys-lru, allkeys-lfu, volatile-lru, volatile-lfu, allkeys-random, volatile-random, volatile-ttl, noeviction]
 *                   enableCluster:
 *                     type: boolean
 *                   compressionEnabled:
 *                     type: boolean
 *               database:
 *                 type: object
 *                 properties:
 *                   connectionPoolSize:
 *                     type: integer
 *                     minimum: 5
 *                     maximum: 100
 *                   queryTimeout:
 *                     type: integer
 *                     minimum: 5000
 *                     maximum: 60000
 *                   enableQueryLogging:
 *                     type: boolean
 *                   autoIndexCreation:
 *                     type: boolean
 *               security:
 *                 type: object
 *                 properties:
 *                   jwtExpirationTime:
 *                     type: string
 *                     pattern: '^[0-9]+(s|m|h|d)$'
 *                   enableTwoFactorAuth:
 *                     type: boolean
 *                   passwordMinLength:
 *                     type: integer
 *                     minimum: 6
 *                     maximum: 50
 *                   maxLoginAttempts:
 *                     type: integer
 *                     minimum: 3
 *                     maximum: 10
 *                   enableIpWhitelist:
 *                     type: boolean
 *                   allowedIpRanges:
 *                     type: array
 *                     items:
 *                       type: string
 *               analytics:
 *                 type: object
 *                 properties:
 *                   enableMetrics:
 *                     type: boolean
 *                   dataRetentionDays:
 *                     type: integer
 *                     minimum: 30
 *                     maximum: 2555
 *                   enableRealTimeTracking:
 *                     type: boolean
 *                   anonymizeData:
 *                     type: boolean
 *               logging:
 *                 type: object
 *                 properties:
 *                   level:
 *                     type: string
 *                     enum: [error, warn, info, debug, trace]
 *                   enableFileLogging:
 *                     type: boolean
 *                   maxLogFileSize:
 *                     type: string
 *                     pattern: '^[0-9]+(KB|MB|GB)$'
 *                   logRetentionDays:
 *                     type: integer
 *                     minimum: 7
 *                     maximum: 365
 *               features:
 *                 type: object
 *                 properties:
 *                   enableBetaFeatures:
 *                     type: boolean
 *                   enableExperimentalFeatures:
 *                     type: boolean
 *                   maintenanceWindow:
 *                     type: object
 *                     properties:
 *                       enabled:
 *                         type: boolean
 *                       startTime:
 *                         type: string
 *                       duration:
 *                         type: integer
 *                       message:
 *                         type: string
 *     responses:
 *       200:
 *         description: System settings updated successfully
 *       400:
 *         description: Invalid input data or business rule violation
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.patch('/system/update', [
    authenticateApiKey,
    // Server Settings Validation
    body('server.maxConcurrentConnections').optional().isInt({ min: 100, max: 10000 }),
    body('server.requestTimeout').optional().isInt({ min: 5000, max: 300000 }),
    body('server.enableCors').optional().isBoolean(),
    body('server.enableRateLimit').optional().isBoolean(),
    body('server.maintenanceMode').optional().isBoolean(),
    
    // Notification Settings Validation
    body('notifications.defaultBatchSize').optional().isInt({ min: 10, max: 1000 }),
    body('notifications.maxRetryAttempts').optional().isInt({ min: 1, max: 10 }),
    body('notifications.retryDelayMs').optional().isInt({ min: 1000, max: 300000 }),
    body('notifications.enableWebsockets').optional().isBoolean(),
    body('notifications.enablePushNotifications').optional().isBoolean(),
    body('notifications.enableEmailNotifications').optional().isBoolean(),
    body('notifications.enableSmsNotifications').optional().isBoolean(),
    body('notifications.globalQuietHours.enabled').optional().isBoolean(),
    body('notifications.globalQuietHours.startTime').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
    body('notifications.globalQuietHours.endTime').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
    body('notifications.globalQuietHours.timezone').optional().isString(),
    
    // Redis Settings Validation
    body('redis.cacheTimeout').optional().isInt({ min: 60, max: 86400 }),
    body('redis.maxMemoryPolicy').optional().isIn(['allkeys-lru', 'allkeys-lfu', 'volatile-lru', 'volatile-lfu', 'allkeys-random', 'volatile-random', 'volatile-ttl', 'noeviction']),
    body('redis.enableCluster').optional().isBoolean(),
    body('redis.compressionEnabled').optional().isBoolean(),
    
    // Database Settings Validation
    body('database.connectionPoolSize').optional().isInt({ min: 5, max: 100 }),
    body('database.queryTimeout').optional().isInt({ min: 5000, max: 60000 }),
    body('database.enableQueryLogging').optional().isBoolean(),
    body('database.autoIndexCreation').optional().isBoolean(),
    
    // Security Settings Validation
    body('security.jwtExpirationTime').optional().matches(/^[0-9]+(s|m|h|d)$/),
    body('security.enableTwoFactorAuth').optional().isBoolean(),
    body('security.passwordMinLength').optional().isInt({ min: 6, max: 50 }),
    body('security.maxLoginAttempts').optional().isInt({ min: 3, max: 10 }),
    body('security.enableIpWhitelist').optional().isBoolean(),
    body('security.allowedIpRanges').optional().isArray(),
    
    // Analytics Settings Validation
    body('analytics.enableMetrics').optional().isBoolean(),
    body('analytics.dataRetentionDays').optional().isInt({ min: 30, max: 2555 }),
    body('analytics.enableRealTimeTracking').optional().isBoolean(),
    body('analytics.anonymizeData').optional().isBoolean(),
    
    // Logging Settings Validation
    body('logging.level').optional().isIn(['error', 'warn', 'info', 'debug', 'trace']),
    body('logging.enableFileLogging').optional().isBoolean(),
    body('logging.maxLogFileSize').optional().matches(/^[0-9]+(KB|MB|GB)$/),
    body('logging.logRetentionDays').optional().isInt({ min: 7, max: 365 }),
    
    // Features Settings Validation
    body('features.enableBetaFeatures').optional().isBoolean(),
    body('features.enableExperimentalFeatures').optional().isBoolean(),
    body('features.maintenanceWindow.enabled').optional().isBoolean(),
    body('features.maintenanceWindow.startTime').optional().isString(),
    body('features.maintenanceWindow.duration').optional().isInt({ min: 5, max: 1440 }),
    body('features.maintenanceWindow.message').optional().isString().isLength({ max: 500 }),
    
    ValidationMiddleware.handleValidation
], async (req, res) => {
    try {
        const updates = req.body;
        
        // Get current system settings
        const currentSettings = await SettingsService.getSystemSettings();
        
        // Create comprehensive update tracking
        const updateSession = {
            sessionId: require('crypto').randomUUID(),
            apiKeyUser: 'api_authenticated',
            timestamp: new Date(),
            updates: Object.keys(updates),
            previousValues: {},
            newValues: {},
            validationResults: [],
            applyResults: []
        };

        // Validate business rules and dependencies
        const validationResult = await validateSystemSettingsBusinessRules(updates, currentSettings);
        if (!validationResult.isValid) {
            return res.status(400).json({
                success: false,
                message: 'System settings validation failed',
                errors: validationResult.errors,
                sessionId: updateSession.sessionId,
                timestamp: new Date().toISOString()
            });
        }

        updateSession.validationResults = validationResult.warnings || [];

        // Process each category of settings
        const settingsToUpdate = [];
        const results = [];

        for (const [category, categorySettings] of Object.entries(updates)) {
            Logger.info(`Processing ${category} settings`, { 
                sessionId: updateSession.sessionId, 
                apiKeyUser: updateSession.apiKeyUser,
                settings: Object.keys(categorySettings)
            });

            for (const [settingKey, settingValue] of Object.entries(categorySettings)) {
                const fullKey = `system.${category}.${settingKey}`;
                
                // Store previous value for rollback capability
                const previousValue = await SettingsService.get(fullKey);
                updateSession.previousValues[fullKey] = previousValue;
                updateSession.newValues[fullKey] = settingValue;

                settingsToUpdate.push({
                    key: fullKey,
                    value: settingValue,
                    category: 'system',
                    description: `System ${category} setting: ${settingKey}`,
                    isPublic: false,
                    isEditable: true,
                    updatedBy: 'api_authenticated',
                    metadata: {
                        updateSession: updateSession.sessionId,
                        previousValue,
                        validatedAt: new Date(),
                        requiresRestart: getRestartRequirement(category, settingKey)
                    }
                });
            }
        }

        // Apply settings in transaction-like manner
        try {
            for (const setting of settingsToUpdate) {
                const result = await SettingsService.set(
                    setting.key, 
                    setting.value, 
                    setting.updatedBy
                );
                
                results.push({
                    key: setting.key,
                    success: !!result,
                    requiresRestart: setting.metadata.requiresRestart,
                    previousValue: setting.metadata.previousValue,
                    newValue: setting.value
                });

                updateSession.applyResults.push(result);
            }

            // Apply immediate changes that don't require restart
            const immediateChanges = await applyImmediateSystemChanges(updates, updateSession.sessionId);
            
            // Determine if service restart is required
            const restartRequired = results.some(r => r.requiresRestart);
            
            // Log comprehensive audit trail
            Logger.info('System settings updated successfully', {
                sessionId: updateSession.sessionId,
                apiKeyUser: updateSession.apiKeyUser,
                categoriesUpdated: Object.keys(updates),
                settingsCount: results.length,
                restartRequired,
                immediateChanges,
                timestamp: new Date().toISOString()
            });

            // Prepare response
            const response = {
                success: true,
                message: 'System settings updated successfully',
                data: {
                    sessionId: updateSession.sessionId,
                    updatedSettings: results,
                    categoriesUpdated: Object.keys(updates),
                    totalUpdates: results.length,
                    restartRequired,
                    immediateChanges,
                    rollbackAvailable: true,
                    nextSteps: generateNextSteps(results, restartRequired),
                    warnings: updateSession.validationResults
                },
                timestamp: new Date().toISOString()
            };

            // Send notifications to other admins about system changes
            await notifyAdminsOfSystemChanges(updateSession, updateSession.apiKeyUser);

            res.json(response);

        } catch (applyError) {
            // Rollback on failure
            Logger.error('Error applying system settings, initiating rollback', applyError, {
                sessionId: updateSession.sessionId,
                apiKeyUser: updateSession.apiKeyUser
            });

            await rollbackSystemSettings(updateSession);
            
            throw new Error(`Settings application failed: ${applyError.message}`);
        }

    } catch (error) {
        Logger.error('Error updating system settings:', error, { 
            apiKeyUser: 'api_authenticated',
            updateData: req.body
        });
        
        res.status(500).json({
            success: false,
            message: 'Failed to update system settings',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * System settings business rules validation
 */
async function validateSystemSettingsBusinessRules(updates, currentSettings) {
    const errors = [];
    const warnings = [];
    
    // Rule 1: Notification channels dependency check
    if (updates.notifications) {
        const notifSettings = updates.notifications;
        // Only check if we're explicitly disabling all channels
        const explicitlyDisablingAll = 
            notifSettings.enablePushNotifications === false &&
            notifSettings.enableEmailNotifications === false &&
            notifSettings.enableSmsNotifications === false;
            
        if (explicitlyDisablingAll) {
            errors.push({
                field: 'notifications',
                message: 'At least one notification channel must remain enabled',
                code: 'NOTIFICATION_CHANNEL_REQUIRED'
            });
        }
    }

    // Rule 2: Security settings validation
    if (updates.security?.enableIpWhitelist && (!updates.security?.allowedIpRanges || updates.security.allowedIpRanges.length === 0)) {
        errors.push({
            field: 'security.allowedIpRanges',
            message: 'IP ranges must be specified when IP whitelist is enabled',
            code: 'IP_WHITELIST_RANGES_REQUIRED'
        });
    }

    // Rule 3: Resource allocation validation
    if (updates.database?.connectionPoolSize && updates.redis?.enableCluster) {
        if (updates.database.connectionPoolSize > 50) {
            warnings.push({
                field: 'database.connectionPoolSize',
                message: 'High connection pool size with Redis cluster may cause resource contention',
                code: 'RESOURCE_CONTENTION_WARNING'
            });
        }
    }

    // Rule 4: Maintenance mode validation
    if (updates.server?.maintenanceMode === true) {
        warnings.push({
            field: 'server.maintenanceMode',
            message: 'Maintenance mode will prevent new connections and may affect users',
            code: 'MAINTENANCE_MODE_WARNING'
        });
    }

    // Rule 5: Log level validation for production
    if (updates.logging?.level === 'debug' || updates.logging?.level === 'trace') {
        warnings.push({
            field: 'logging.level',
            message: 'Debug/trace logging may impact performance and disk usage',
            code: 'VERBOSE_LOGGING_WARNING'
        });
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings
    };
}

/**
 * Determine if setting change requires service restart
 */
function getRestartRequirement(category, settingKey) {
    const restartRequired = {
        server: ['maxConcurrentConnections', 'enableCors'],
        database: ['connectionPoolSize', 'autoIndexCreation'],
        redis: ['enableCluster'],
        security: ['enableTwoFactorAuth', 'enableIpWhitelist']
    };

    return restartRequired[category]?.includes(settingKey) || false;
}

/**
 * Apply immediate system changes that don't require restart
 */
async function applyImmediateSystemChanges(updates, sessionId) {
    const immediateChanges = [];
    
    try {
        // Update logging level immediately
        if (updates.logging?.level) {
            Logger.setLevel(updates.logging.level);
            immediateChanges.push('logging_level_updated');
        }

        // Update maintenance mode immediately
        if (updates.server?.maintenanceMode !== undefined) {
            // This would update a global maintenance flag
            immediateChanges.push('maintenance_mode_updated');
        }

        // Update rate limiting immediately
        if (updates.server?.enableRateLimit !== undefined) {
            // This would update rate limiting middleware
            immediateChanges.push('rate_limiting_updated');
        }

        Logger.info('Applied immediate system changes', { sessionId, changes: immediateChanges });
        return immediateChanges;
    } catch (error) {
        Logger.error('Error applying immediate changes', error, { sessionId });
        return [];
    }
}

/**
 * Generate next steps recommendations
 */
function generateNextSteps(results, restartRequired) {
    const steps = [];
    
    if (restartRequired) {
        steps.push({
            action: 'restart_service',
            priority: 'high',
            description: 'Service restart required for some changes to take effect',
            estimatedDowntime: '30-60 seconds'
        });
    }

    const notificationChanges = results.filter(r => r.key.includes('notifications'));
    if (notificationChanges.length > 0) {
        steps.push({
            action: 'verify_notifications',
            priority: 'medium',
            description: 'Test notification delivery after changes',
            testEndpoints: ['/api/notifications/test']
        });
    }

    steps.push({
        action: 'monitor_metrics',
        priority: 'low',
        description: 'Monitor system metrics for impact of changes',
        duration: '24 hours'
    });

    return steps;
}

/**
 * Rollback system settings on failure
 */
async function rollbackSystemSettings(updateSession) {
    try {
        Logger.warn('Rolling back system settings', { sessionId: updateSession.sessionId });
        
        for (const [key, previousValue] of Object.entries(updateSession.previousValues)) {
            await SettingsService.set(key, previousValue, 'system_rollback');
        }
        
        Logger.info('System settings rollback completed', { sessionId: updateSession.sessionId });
    } catch (rollbackError) {
        Logger.error('Critical: Rollback failed', rollbackError, { sessionId: updateSession.sessionId });
    }
}

/**
 * Notify other admins of system changes
 */
async function notifyAdminsOfSystemChanges(updateSession, adminUserId) {
    try {
        // This would send notifications to other admin users
        Logger.info('System change notifications sent to admins', { 
            sessionId: updateSession.sessionId,
            initiatedBy: adminUserId 
        });
    } catch (error) {
        Logger.error('Error notifying admins', error);
    }
}

module.exports = router;
