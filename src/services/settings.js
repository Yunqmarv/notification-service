const Setting = require('../models/Setting');
const RedisManager = require('../config/redis');
const Logger = require('../utils/logger');

class SettingsService {
    constructor() {
        this.cache = new Map();
        this.cachePrefix = 'settings:';
        this.cacheTTL = 300; // 5 minutes
        this.isInitialized = false;
        this.defaultSettings = this.getDefaultSettings();
    }

    getDefaultSettings() {
        return [
            // Server Configuration
            {
                key: 'server.port',
                value: 3001,
                type: 'number',
                category: 'server',
                description: 'Server port number',
                isPublic: false,
                isEditable: true,
                validation: { required: true, min: 1000, max: 65535 }
            },
            {
                key: 'server.host',
                value: '0.0.0.0',
                type: 'string',
                category: 'server',
                description: 'Server host address',
                isPublic: false,
                isEditable: true,
                validation: { required: true }
            },
            {
                key: 'server.maxRequestSize',
                value: '10mb',
                type: 'string',
                category: 'server',
                description: 'Maximum request body size',
                isPublic: false,
                isEditable: true,
                validation: { required: true }
            },
            {
                key: 'server.enableCluster',
                value: false,
                type: 'boolean',
                category: 'server',
                description: 'Enable cluster mode for production',
                isPublic: false,
                isEditable: true
            },

            // Redis Configuration
            {
                key: 'redis.host',
                value: 'redis-14594.c8.us-east-1-4.ec2.redns.redis-cloud.com',
                type: 'string',
                category: 'redis',
                description: 'Redis server host',
                isPublic: false,
                isEditable: true,
                validation: { required: true }
            },
            {
                key: 'redis.port',
                value: 14594,
                type: 'number',
                category: 'redis',
                description: 'Redis server port',
                isPublic: false,
                isEditable: true,
                validation: { required: true, min: 1, max: 65535 }
            },
            {
                key: 'redis.username',
                value: 'default',
                type: 'string',
                category: 'redis',
                description: 'Redis username',
                isPublic: false,
                isEditable: true
            },
            {
                key: 'redis.password',
                value: 'MUCyQ3fj5taB2VYafGKzBNQlqWlfPqks',
                type: 'string',
                category: 'redis',
                description: 'Redis password',
                isPublic: false,
                isEditable: true
            },
            {
                key: 'redis.database',
                value: 0,
                type: 'number',
                category: 'redis',
                description: 'Redis database number',
                isPublic: false,
                isEditable: true,
                validation: { min: 0, max: 15 }
            },
            {
                key: 'redis.cacheTTL',
                value: 3600,
                type: 'number',
                category: 'redis',
                description: 'Default cache TTL in seconds',
                isPublic: false,
                isEditable: true,
                validation: { min: 60, max: 86400 }
            },

            // CORS Configuration
            {
                key: 'cors.allowedOrigins',
                value: ['*'],
                type: 'array',
                category: 'cors',
                description: 'Allowed CORS origins',
                isPublic: false,
                isEditable: true
            },

            // Rate Limiting
            {
                key: 'rateLimit.windowMs',
                value: 900000, // 15 minutes
                type: 'number',
                category: 'rateLimit',
                description: 'Rate limit window in milliseconds',
                isPublic: false,
                isEditable: true,
                validation: { min: 60000, max: 3600000 }
            },
            {
                key: 'rateLimit.max',
                value: 1000,
                type: 'number',
                category: 'rateLimit',
                description: 'Maximum requests per window',
                isPublic: false,
                isEditable: true,
                validation: { min: 10, max: 10000 }
            },

            // Notification Settings
            {
                key: 'notifications.defaultTTL',
                value: 2592000, // 30 days
                type: 'number',
                category: 'notifications',
                description: 'Default notification TTL in seconds',
                isPublic: true,
                isEditable: true,
                validation: { min: 3600, max: 31536000 }
            },
            {
                key: 'notifications.maxPerUser',
                value: 1000,
                type: 'number',
                category: 'notifications',
                description: 'Maximum notifications per user',
                isPublic: true,
                isEditable: true,
                validation: { min: 100, max: 10000 }
            },
            {
                key: 'notifications.batchSize',
                value: 100,
                type: 'number',
                category: 'notifications',
                description: 'Batch size for bulk operations',
                isPublic: false,
                isEditable: true,
                validation: { min: 10, max: 1000 }
            },
            {
                key: 'notifications.enablePush',
                value: true,
                type: 'boolean',
                category: 'notifications',
                description: 'Enable push notifications',
                isPublic: true,
                isEditable: true
            },
            {
                key: 'notifications.enableEmail',
                value: true,
                type: 'boolean',
                category: 'notifications',
                description: 'Enable email notifications',
                isPublic: true,
                isEditable: true
            },
            {
                key: 'notifications.enableSMS',
                value: false,
                type: 'boolean',
                category: 'notifications',
                description: 'Enable SMS notifications',
                isPublic: true,
                isEditable: true
            },
            {
                key: 'notifications.enableWebSocket',
                value: true,
                type: 'boolean',
                category: 'notifications',
                description: 'Enable WebSocket notifications',
                isPublic: true,
                isEditable: true
            },

            // WebSocket Configuration
            {
                key: 'websocket.host',
                value: 'localhost',
                type: 'string',
                category: 'websocket',
                description: 'WebSocket server host',
                isPublic: false,
                isEditable: true
            },
            {
                key: 'websocket.port',
                value: 3002,
                type: 'number',
                category: 'websocket',
                description: 'WebSocket server port',
                isPublic: false,
                isEditable: true,
                validation: { min: 1000, max: 65535 }
            },
            {
                key: 'websocket.notifyEndpoint',
                value: '/notify',
                type: 'string',
                category: 'websocket',
                description: 'WebSocket notification endpoint',
                isPublic: false,
                isEditable: true
            },

            // Analytics Settings
            {
                key: 'analytics.retentionDays',
                value: 90,
                type: 'number',
                category: 'analytics',
                description: 'Analytics data retention in days',
                isPublic: false,
                isEditable: true,
                validation: { min: 30, max: 365 }
            },
            {
                key: 'analytics.enableDetailedTracking',
                value: true,
                type: 'boolean',
                category: 'analytics',
                description: 'Enable detailed analytics tracking',
                isPublic: false,
                isEditable: true
            },

            // Security Settings
            {
                key: 'security.jwtSecret',
                value: 'your-super-secret-jwt-key-change-this-in-production',
                type: 'string',
                category: 'security',
                description: 'JWT secret key',
                isPublic: false,
                isEditable: true,
                validation: { required: true }
            },
            {
                key: 'security.tokenExpiry',
                value: '24h',
                type: 'string',
                category: 'security',
                description: 'JWT token expiry time',
                isPublic: false,
                isEditable: true
            },

            // Logging Settings
            {
                key: 'logging.level',
                value: 'info',
                type: 'string',
                category: 'logging',
                description: 'Logging level',
                isPublic: false,
                isEditable: true,
                validation: { enum: ['error', 'warn', 'info', 'debug'] }
            },
            {
                key: 'logging.enableFileLogging',
                value: true,
                type: 'boolean',
                category: 'logging',
                description: 'Enable file logging',
                isPublic: false,
                isEditable: true
            },

            // Performance Settings
            {
                key: 'performance.cacheEnabled',
                value: true,
                type: 'boolean',
                category: 'performance',
                description: 'Enable caching',
                isPublic: false,
                isEditable: true
            },
            {
                key: 'performance.metricsEnabled',
                value: true,
                type: 'boolean',
                category: 'performance',
                description: 'Enable metrics collection',
                isPublic: false,
                isEditable: true
            },

            // Feature Flags
            {
                key: 'features.enableAdvancedAnalytics',
                value: true,
                type: 'boolean',
                category: 'features',
                description: 'Enable advanced analytics features',
                isPublic: true,
                isEditable: true
            },
            {
                key: 'features.enableBulkOperations',
                value: true,
                type: 'boolean',
                category: 'features',
                description: 'Enable bulk operations',
                isPublic: false,
                isEditable: true
            },
            {
                key: 'features.enableScheduledNotifications',
                value: true,
                type: 'boolean',
                category: 'features',
                description: 'Enable scheduled notifications',
                isPublic: true,
                isEditable: true
            }
        ];
    }

    async initialize() {
        try {
            Logger.info('🔧 Initializing Settings Service...');

            // Initialize default settings in database
            await this.initializeDefaultSettings();
            
            // Load all settings into cache
            await this.loadAllSettings();
            
            this.isInitialized = true;
            Logger.info('✅ Settings Service initialized successfully');
        } catch (error) {
            Logger.error('❌ Failed to initialize Settings Service:', error);
            throw error;
        }
    }

    async initializeDefaultSettings() {
        try {
            for (const defaultSetting of this.defaultSettings) {
                const existing = await Setting.findOne({ key: defaultSetting.key });
                
                if (!existing) {
                    await Setting.create({
                        ...defaultSetting,
                        metadata: {
                            createdBy: 'system',
                            isDefault: true,
                            version: 1
                        }
                    });
                    Logger.debug(`Created default setting: ${defaultSetting.key}`);
                }
            }
        } catch (error) {
            Logger.error('Error initializing default settings:', error);
            throw error;
        }
    }

    async loadAllSettings() {
        try {
            const settings = await Setting.find({}).lean();
            
            // Load into memory cache with proper type parsing
            this.cache.clear();
            for (const setting of settings) {
                const parsedValue = this.parseValue(setting.value, setting.type);
                this.cache.set(setting.key, parsedValue);
            }

            // Load into Redis cache with proper type parsing
            for (const setting of settings) {
                const cacheKey = `${this.cachePrefix}${setting.key}`;
                const parsedValue = this.parseValue(setting.value, setting.type);
                await RedisManager.set(cacheKey, parsedValue, this.cacheTTL);
            }

            Logger.info(`Loaded ${settings.length} settings into cache`);
        } catch (error) {
            Logger.error('Error loading settings:', error);
            throw error;
        }
    }

    get(key, defaultValue = null) {
        try {
            // Try memory cache first
            if (this.cache.has(key)) {
                return this.cache.get(key);
            }

            // Return default value if not found
            return defaultValue;
        } catch (error) {
            Logger.error(`Error getting setting ${key}:`, error);
            return defaultValue;
        }
    }

    async getAsync(key, defaultValue = null) {
        try {
            // Try memory cache first
            if (this.cache.has(key)) {
                return this.cache.get(key);
            }

            // Try Redis cache
            const cacheKey = `${this.cachePrefix}${key}`;
            const cachedValue = await RedisManager.get(cacheKey);
            
            if (cachedValue !== null) {
                // Update memory cache
                this.cache.set(key, cachedValue);
                return cachedValue;
            }

            // Fallback to database
            const setting = await Setting.findOne({ key }).lean();
            if (setting) {
                const value = this.parseValue(setting.value, setting.type);
                
                // Update caches
                this.cache.set(key, value);
                await RedisManager.set(cacheKey, value, this.cacheTTL);
                
                return value;
            }

            return defaultValue;
        } catch (error) {
            Logger.error(`Error getting setting ${key} async:`, error);
            return defaultValue;
        }
    }

    /**
     * Parse value based on its type
     * @param {*} value - The raw value from database
     * @param {string} type - The expected type (string, number, boolean, array, object)
     * @returns {*} Parsed value
     */
    parseValue(value, type) {
        if (value === null || value === undefined) {
            return value;
        }

        switch (type) {
            case 'array':
                if (Array.isArray(value)) {
                    return value;
                }
                if (typeof value === 'string') {
                    try {
                        // Try to parse as JSON array
                        return JSON.parse(value.replace(/'/g, '"'));
                    } catch (e) {
                        // If parsing fails, split by comma and clean up
                        return value
                            .replace(/[\[\]']/g, '')
                            .split(',')
                            .map(item => item.trim())
                            .filter(item => item.length > 0);
                    }
                }
                return value;

            case 'object':
                if (typeof value === 'object' && !Array.isArray(value)) {
                    return value;
                }
                if (typeof value === 'string') {
                    try {
                        return JSON.parse(value);
                    } catch (e) {
                        Logger.warn(`Failed to parse object value for type ${type}:`, value);
                        return {};
                    }
                }
                return value;

            case 'boolean':
                if (typeof value === 'boolean') {
                    return value;
                }
                if (typeof value === 'string') {
                    return value.toLowerCase() === 'true';
                }
                return Boolean(value);

            case 'number':
                if (typeof value === 'number') {
                    return value;
                }
                if (typeof value === 'string') {
                    const parsed = parseFloat(value);
                    return isNaN(parsed) ? value : parsed;
                }
                return value;

            case 'string':
            default:
                return String(value);
        }
    }

    async set(key, value, userId = null) {
        try {
            const setting = await Setting.updateSetting(key, value, userId);
            
            // Update caches
            this.cache.set(key, value);
            const cacheKey = `${this.cachePrefix}${key}`;
            await RedisManager.set(cacheKey, value, this.cacheTTL);
            
            Logger.info(`Setting updated: ${key}`, { userId, value });
            return setting;
        } catch (error) {
            Logger.error(`Error setting ${key}:`, error);
            throw error;
        }
    }

    async getByCategory(category) {
        try {
            const settings = await Setting.getByCategory(category);
            return settings.map(setting => setting.toJSON());
        } catch (error) {
            Logger.error(`Error getting settings by category ${category}:`, error);
            return [];
        }
    }

    async getPublicSettings() {
        try {
            const settings = await Setting.getPublicSettings();
            return settings.map(setting => setting.toJSON());
        } catch (error) {
            Logger.error('Error getting public settings:', error);
            return [];
        }
    }

    async getAllSettings() {
        try {
            const settings = await Setting.find({}).sort({ category: 1, key: 1 });
            return settings.map(setting => setting.toJSON());
        } catch (error) {
            Logger.error('Error getting all settings:', error);
            return [];
        }
    }

    async createSetting(settingData, userId = null) {
        try {
            const setting = await Setting.create({
                ...settingData,
                metadata: {
                    createdBy: userId || 'system',
                    version: 1
                }
            });

            // Update caches
            this.cache.set(setting.key, setting.value);
            const cacheKey = `${this.cachePrefix}${setting.key}`;
            await RedisManager.set(cacheKey, setting.value, this.cacheTTL);

            Logger.info(`Setting created: ${setting.key}`, { userId });
            return setting.toJSON();
        } catch (error) {
            Logger.error('Error creating setting:', error);
            throw error;
        }
    }

    async deleteSetting(key, userId = null) {
        try {
            const setting = await Setting.findOne({ key });
            if (!setting) {
                throw new Error(`Setting '${key}' not found`);
            }

            if (!setting.isEditable) {
                throw new Error(`Setting '${key}' is not deletable`);
            }

            await Setting.deleteOne({ key });

            // Remove from caches
            this.cache.delete(key);
            const cacheKey = `${this.cachePrefix}${key}`;
            await RedisManager.del(cacheKey);

            Logger.info(`Setting deleted: ${key}`, { userId });
            return true;
        } catch (error) {
            Logger.error(`Error deleting setting ${key}:`, error);
            throw error;
        }
    }

    async refreshCache() {
        try {
            await this.loadAllSettings();
            Logger.info('Settings cache refreshed');
        } catch (error) {
            Logger.error('Error refreshing settings cache:', error);
            throw error;
        }
    }

    async clearCache() {
        try {
            // Clear memory cache
            this.cache.clear();
            
            // Clear Redis cache
            await RedisManager.flushPattern(`${this.cachePrefix}*`);
            
            Logger.info('Settings cache cleared');
        } catch (error) {
            Logger.error('Error clearing settings cache:', error);
            throw error;
        }
    }

    // Configuration getters for common settings
    getServerConfig() {
        return {
            port: this.get('server.port', 3001),
            host: this.get('server.host', '0.0.0.0'),
            maxRequestSize: this.get('server.maxRequestSize', '10mb'),
            enableCluster: this.get('server.enableCluster', false)
        };
    }

    getRedisConfig() {
        return {
            host: this.get('redis.host'),
            port: this.get('redis.port'),
            username: this.get('redis.username'),
            password: this.get('redis.password'),
            database: this.get('redis.database', 0),
            cacheTTL: this.get('redis.cacheTTL', 3600)
        };
    }

    getNotificationConfig() {
        return {
            defaultTTL: this.get('notifications.defaultTTL', 2592000),
            maxPerUser: this.get('notifications.maxPerUser', 1000),
            batchSize: this.get('notifications.batchSize', 100),
            enablePush: this.get('notifications.enablePush', true),
            enableEmail: this.get('notifications.enableEmail', true),
            enableSMS: this.get('notifications.enableSMS', false),
            enableWebSocket: this.get('notifications.enableWebSocket', true)
        };
    }

    getWebSocketConfig() {
        return {
            host: this.get('websocket.host', 'localhost'),
            port: this.get('websocket.port', 3002),
            notifyEndpoint: this.get('websocket.notifyEndpoint', '/notify')
        };
    }

    getRateLimitConfig() {
        return {
            windowMs: this.get('rateLimit.windowMs', 900000),
            max: this.get('rateLimit.max', 1000)
        };
    }

    healthCheck() {
        return {
            status: this.isInitialized ? 'healthy' : 'unhealthy',
            message: this.isInitialized ? 'Settings service is healthy' : 'Settings service not initialized',
            cacheSize: this.cache.size,
            initialized: this.isInitialized
        };
    }

    /**
     * Get user notification preferences
     */
    async getUserPreferences(userId) {
        try {
            const cacheKey = `user_preferences:${userId}`;
            
            // Try cache first
            const cached = await RedisManager.get(cacheKey);
            if (cached) {
                Logger.logCacheOperation('GET', cacheKey, true);
                return JSON.parse(cached);
            }

            // Get from database
            const setting = await Setting.findOne({ 
                key: `user.${userId}.preferences`,
                category: 'user_preferences'
            });

            let preferences = null;
            if (setting) {
                preferences = setting.value;
            } else {
                // Return default user preferences
                preferences = this.getDefaultUserPreferences();
            }

            // Cache for 1 hour
            await RedisManager.setex(cacheKey, 3600, JSON.stringify(preferences));
            Logger.logCacheOperation('SET', cacheKey);

            return preferences;
        } catch (error) {
            Logger.error('Error getting user preferences:', error, { userId });
            throw error;
        }
    }

    /**
     * Update user notification preferences
     */
    async updateUserPreferences(userId, preferences) {
        try {
            const key = `user.${userId}.preferences`;
            const cacheKey = `user_preferences:${userId}`;

            // Upsert the setting
            const setting = await Setting.findOneAndUpdate(
                { 
                    key,
                    category: 'user_preferences'
                },
                {
                    key,
                    value: preferences,
                    category: 'user_preferences',
                    description: `Notification preferences for user ${userId}`,
                    isPublic: false,
                    isEditable: true,
                    updatedBy: userId,
                    updatedAt: new Date()
                },
                { 
                    upsert: true, 
                    new: true 
                }
            );

            // Clear cache
            await RedisManager.del(cacheKey);
            Logger.logCacheOperation('DELETE', cacheKey);

            Logger.info('User preferences updated', { userId, version: preferences.version });
            return setting.value;
        } catch (error) {
            Logger.error('Error updating user preferences:', error, { userId });
            throw error;
        }
    }

    /**
     * Get default user preferences structure
     */
    getDefaultUserPreferences() {
        return {
            userId: null,
            version: 1,
            lastUpdated: new Date(),
            notificationChannels: {
                push: {
                    enabled: true,
                    types: ['match', 'like', 'superlike', 'connection', 'message', 'rizz'],
                    schedule: {
                        enabled: true,
                        quietHours: {
                            enabled: true,
                            startTime: '22:00',
                            endTime: '08:00',
                            timezone: 'UTC'
                        },
                        weekends: true
                    }
                },
                email: {
                    enabled: true,
                    types: ['match', 'connection', 'system', 'promotional'],
                    frequency: 'daily',
                    digest: true
                },
                sms: {
                    enabled: false,
                    types: ['urgent'],
                    urgentOnly: true
                },
                inApp: {
                    enabled: true,
                    soundEnabled: true,
                    vibrationEnabled: true,
                    badgeCount: true
                }
            },
            privacySettings: {
                showOnlineStatus: true,
                readReceipts: true,
                typingIndicators: true,
                profileViewNotifications: true
            },
            contentFilters: {
                adultContent: false,
                promotionalContent: true,
                socialFeatures: true,
                gamificationElements: true
            },
            smartNotifications: {
                enabled: false,
                aiOptimization: false,
                locationBased: false,
                behaviorBased: false,
                priorityFiltering: true
            },
            accessibilityOptions: {
                highContrast: false,
                largeText: false,
                screenReader: false,
                reduceMotion: false
            },
            dataPreferences: {
                analyticsOptIn: true,
                personalizationOptIn: true,
                marketingOptIn: false,
                dataRetention: '1year'
            }
        };
    }

    /**
     * Get user preferences by category
     */
    async getUserPreferencesByCategory(userId, category) {
        try {
            const preferences = await this.getUserPreferences(userId);
            return preferences?.[category] || null;
        } catch (error) {
            Logger.error('Error getting user preferences by category:', error, { userId, category });
            throw error;
        }
    }

    /**
     * Update specific user preference category
     */
    async updateUserPreferenceCategory(userId, category, data) {
        try {
            const preferences = await this.getUserPreferences(userId);
            if (!preferences) {
                throw new Error('User preferences not found');
            }

            preferences[category] = { ...preferences[category], ...data };
            preferences.lastUpdated = new Date();
            preferences.version += 1;

            return await this.updateUserPreferences(userId, preferences);
        } catch (error) {
            Logger.error('Error updating user preference category:', error, { userId, category });
            throw error;
        }
    }

    /**
     * Reset user preferences to defaults
     */
    async resetUserPreferences(userId) {
        try {
            const defaultPrefs = this.getDefaultUserPreferences();
            defaultPrefs.userId = userId;
            defaultPrefs.lastUpdated = new Date();
            
            return await this.updateUserPreferences(userId, defaultPrefs);
        } catch (error) {
            Logger.error('Error resetting user preferences:', error, { userId });
            throw error;
        }
    }

    /**
     * Export user preferences (GDPR compliance)
     */
    async exportUserPreferences(userId) {
        try {
            const preferences = await this.getUserPreferences(userId);
            return {
                userId,
                exportedAt: new Date().toISOString(),
                data: preferences,
                format: 'JSON',
                version: '1.0'
            };
        } catch (error) {
            Logger.error('Error exporting user preferences:', error, { userId });
            throw error;
        }
    }

    /**
     * Get system settings
     */
    async getSystemSettings() {
        try {
            const systemSettings = await Setting.find({ 
                category: 'system'
            }).lean();

            const organized = {};
            for (const setting of systemSettings) {
                const keyParts = setting.key.split('.');
                if (keyParts[0] === 'system' && keyParts.length >= 3) {
                    const category = keyParts[1];
                    const settingName = keyParts.slice(2).join('.');
                    
                    if (!organized[category]) {
                        organized[category] = {};
                    }
                    organized[category][settingName] = setting.value;
                }
            }

            return organized;
        } catch (error) {
            Logger.error('Error getting system settings:', error);
            throw error;
        }
    }

    /**
     * Get all categories from settings
     */
    async getCategories() {
        try {
            const categories = await Setting.distinct('category');
            return categories.filter(cat => cat && cat.trim() !== ''); // Remove null/empty categories
        } catch (error) {
            Logger.error('Error getting categories:', error);
            throw error;
        }
    }

    /**
     * Get setting by key
     */
    async getSetting(key, publicOnly = true) {
        try {
            const query = { key };
            if (publicOnly) {
                query.isPublic = true;
            }

            const setting = await Setting.findOne(query).lean();
            return setting ? setting.value : null;
        } catch (error) {
            Logger.error('Error getting setting:', error);
            throw error;
        }
    }

    /**
     * Delete setting by key
     */
    async delete(key) {
        try {
            const result = await Setting.deleteOne({ key });
            
            // Clear from cache
            this.cache.delete(key);
            
            // Clear from Redis cache
            if (RedisManager.getClient() && RedisManager.getClient().isReady) {
                try {
                    await RedisManager.getClient().del(`${this.cachePrefix}${key}`);
                } catch (redisError) {
                    Logger.warn('Failed to clear setting from Redis cache:', redisError);
                }
            }

            return result.deletedCount > 0;
        } catch (error) {
            Logger.error('Error deleting setting:', error);
            throw error;
        }
    }
}

module.exports = new SettingsService();
