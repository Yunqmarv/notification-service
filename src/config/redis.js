const Redis = require('ioredis');
const Logger = require('../utils/logger');

class RedisManager {
    constructor() {
        this.client = null;
        this.isConnected = false;
        this.connectionAttempts = 0;
        this.maxRetries = 5;
        this.retryDelay = 3000; // 3 seconds
        this.config = null;
    }

    async connect() {
        if (this.isConnected && this.client) {
            return this.client;
        }

        try {
            // Get Redis configuration from settings
            await this.loadConfiguration();

            Logger.info('🔌 Connecting to Redis...');

            const options = {
                host: this.config.host,
                port: this.config.port,
                username: this.config.username,
                password: this.config.password,
                db: this.config.database || 0,
                retryDelayOnFailover: 1000,
                enableReadyCheck: true,
                maxRetriesPerRequest: 3,
                retryDelayOnError: 500,
                connectTimeout: 10000,
                commandTimeout: 5000,
                lazyConnect: true,
                keepAlive: 30000,
                // Connection pool settings
                family: 4,
                maxConnections: 20,
                minConnections: 5,
                // Cluster settings (if needed)
                enableOfflineQueue: false,
                // Sentinel settings (if needed)
                sentinelRetryDelayOnFailover: 5000
            };

            this.client = new Redis(options);

            // Set up event listeners
            this.setupEventListeners();

            // Connect
            await this.client.connect();

            this.isConnected = true;
            this.connectionAttempts = 0;

            Logger.info('✅ Redis connected successfully');
            return this.client;

        } catch (error) {
            this.connectionAttempts++;
            Logger.error(`❌ Redis connection failed (attempt ${this.connectionAttempts}):`, error.message);

            if (this.connectionAttempts < this.maxRetries) {
                Logger.info(`🔄 Retrying Redis connection in ${this.retryDelay}ms...`);
                await new Promise(resolve => setTimeout(resolve, this.retryDelay));
                return this.connect();
            } else {
                throw new Error(`Failed to connect to Redis after ${this.maxRetries} attempts`);
            }
        }
    }

    async loadConfiguration() {
        // For now, use hardcoded values, but this will be moved to SettingsService
        this.config = {
            host: 'redis-14594.c8.us-east-1-4.ec2.redns.redis-cloud.com',
            port: 14594,
            username: 'default',
            password: 'MUCyQ3fj5taB2VYafGKzBNQlqWlfPqks',
            database: 0
        };

        // TODO: Load from SettingsService once it's initialized
        // const SettingsService = require('../services/settings');
        // this.config = await SettingsService.get('redis', this.config);
    }

    setupEventListeners() {
        this.client.on('connect', () => {
            Logger.info('Redis connecting...');
        });

        this.client.on('ready', () => {
            Logger.info('Redis connection ready');
            this.isConnected = true;
        });

        this.client.on('error', (error) => {
            Logger.error('Redis connection error:', error);
            this.isConnected = false;
        });

        this.client.on('close', () => {
            Logger.warn('Redis connection closed');
            this.isConnected = false;
        });

        this.client.on('reconnecting', (delay) => {
            Logger.info(`Redis reconnecting in ${delay}ms...`);
        });

        this.client.on('end', () => {
            Logger.warn('Redis connection ended');
            this.isConnected = false;
        });
    }

    async disconnect() {
        if (!this.client) return;

        try {
            await this.client.quit();
            this.isConnected = false;
            Logger.info('✅ Redis disconnected gracefully');
        } catch (error) {
            Logger.error('Error disconnecting from Redis:', error);
        }
    }

    // Cache operations
    async set(key, value, ttl = 3600) {
        try {
            if (!this.isConnected) await this.connect();
            
            const serializedValue = typeof value === 'object' ? JSON.stringify(value) : value;
            
            if (ttl) {
                return await this.client.setex(key, ttl, serializedValue);
            } else {
                return await this.client.set(key, serializedValue);
            }
        } catch (error) {
            Logger.error(`Redis SET error for key ${key}:`, error);
            throw error;
        }
    }

    async get(key) {
        try {
            if (!this.isConnected) await this.connect();
            
            const value = await this.client.get(key);
            if (!value) return null;
            
            try {
                return JSON.parse(value);
            } catch {
                return value;
            }
        } catch (error) {
            Logger.error(`Redis GET error for key ${key}:`, error);
            return null;
        }
    }

    async del(key) {
        try {
            if (!this.isConnected) await this.connect();
            return await this.client.del(key);
        } catch (error) {
            Logger.error(`Redis DEL error for key ${key}:`, error);
            throw error;
        }
    }

    async exists(key) {
        try {
            if (!this.isConnected) await this.connect();
            return await this.client.exists(key);
        } catch (error) {
            Logger.error(`Redis EXISTS error for key ${key}:`, error);
            return false;
        }
    }

    async expire(key, ttl) {
        try {
            if (!this.isConnected) await this.connect();
            return await this.client.expire(key, ttl);
        } catch (error) {
            Logger.error(`Redis EXPIRE error for key ${key}:`, error);
            throw error;
        }
    }

    async ttl(key) {
        try {
            if (!this.isConnected) await this.connect();
            return await this.client.ttl(key);
        } catch (error) {
            Logger.error(`Redis TTL error for key ${key}:`, error);
            return -1;
        }
    }

    // Hash operations
    async hset(key, field, value) {
        try {
            if (!this.isConnected) await this.connect();
            const serializedValue = typeof value === 'object' ? JSON.stringify(value) : value;
            return await this.client.hset(key, field, serializedValue);
        } catch (error) {
            Logger.error(`Redis HSET error for key ${key}, field ${field}:`, error);
            throw error;
        }
    }

    async hget(key, field) {
        try {
            if (!this.isConnected) await this.connect();
            const value = await this.client.hget(key, field);
            if (!value) return null;
            
            try {
                return JSON.parse(value);
            } catch {
                return value;
            }
        } catch (error) {
            Logger.error(`Redis HGET error for key ${key}, field ${field}:`, error);
            return null;
        }
    }

    async hgetall(key) {
        try {
            if (!this.isConnected) await this.connect();
            const hash = await this.client.hgetall(key);
            
            // Parse JSON values
            const parsed = {};
            for (const [field, value] of Object.entries(hash)) {
                try {
                    parsed[field] = JSON.parse(value);
                } catch {
                    parsed[field] = value;
                }
            }
            
            return parsed;
        } catch (error) {
            Logger.error(`Redis HGETALL error for key ${key}:`, error);
            return {};
        }
    }

    async hdel(key, field) {
        try {
            if (!this.isConnected) await this.connect();
            return await this.client.hdel(key, field);
        } catch (error) {
            Logger.error(`Redis HDEL error for key ${key}, field ${field}:`, error);
            throw error;
        }
    }

    // List operations
    async lpush(key, ...values) {
        try {
            if (!this.isConnected) await this.connect();
            const serializedValues = values.map(v => typeof v === 'object' ? JSON.stringify(v) : v);
            return await this.client.lpush(key, ...serializedValues);
        } catch (error) {
            Logger.error(`Redis LPUSH error for key ${key}:`, error);
            throw error;
        }
    }

    async rpop(key) {
        try {
            if (!this.isConnected) await this.connect();
            const value = await this.client.rpop(key);
            if (!value) return null;
            
            try {
                return JSON.parse(value);
            } catch {
                return value;
            }
        } catch (error) {
            Logger.error(`Redis RPOP error for key ${key}:`, error);
            return null;
        }
    }

    async llen(key) {
        try {
            if (!this.isConnected) await this.connect();
            return await this.client.llen(key);
        } catch (error) {
            Logger.error(`Redis LLEN error for key ${key}:`, error);
            return 0;
        }
    }

    // Set operations
    async sadd(key, ...members) {
        try {
            if (!this.isConnected) await this.connect();
            const serializedMembers = members.map(m => typeof m === 'object' ? JSON.stringify(m) : m);
            return await this.client.sadd(key, ...serializedMembers);
        } catch (error) {
            Logger.error(`Redis SADD error for key ${key}:`, error);
            throw error;
        }
    }

    async sismember(key, member) {
        try {
            if (!this.isConnected) await this.connect();
            const serializedMember = typeof member === 'object' ? JSON.stringify(member) : member;
            return await this.client.sismember(key, serializedMember);
        } catch (error) {
            Logger.error(`Redis SISMEMBER error for key ${key}:`, error);
            return false;
        }
    }

    async smembers(key) {
        try {
            if (!this.isConnected) await this.connect();
            const members = await this.client.smembers(key);
            
            return members.map(member => {
                try {
                    return JSON.parse(member);
                } catch {
                    return member;
                }
            });
        } catch (error) {
            Logger.error(`Redis SMEMBERS error for key ${key}:`, error);
            return [];
        }
    }

    // Pub/Sub operations
    async publish(channel, message) {
        try {
            if (!this.isConnected) await this.connect();
            const serializedMessage = typeof message === 'object' ? JSON.stringify(message) : message;
            return await this.client.publish(channel, serializedMessage);
        } catch (error) {
            Logger.error(`Redis PUBLISH error for channel ${channel}:`, error);
            throw error;
        }
    }

    async subscribe(channel, callback) {
        try {
            if (!this.isConnected) await this.connect();
            
            const subscriber = this.client.duplicate();
            await subscriber.subscribe(channel);
            
            subscriber.on('message', (receivedChannel, message) => {
                if (receivedChannel === channel) {
                    try {
                        const parsedMessage = JSON.parse(message);
                        callback(parsedMessage);
                    } catch {
                        callback(message);
                    }
                }
            });
            
            return subscriber;
        } catch (error) {
            Logger.error(`Redis SUBSCRIBE error for channel ${channel}:`, error);
            throw error;
        }
    }

    // Utility methods
    async flushPattern(pattern) {
        try {
            if (!this.isConnected) await this.connect();
            const keys = await this.client.keys(pattern);
            if (keys.length > 0) {
                return await this.client.del(...keys);
            }
            return 0;
        } catch (error) {
            Logger.error(`Redis flush pattern error for ${pattern}:`, error);
            throw error;
        }
    }

    async getMemoryUsage() {
        try {
            if (!this.isConnected) await this.connect();
            const info = await this.client.info('memory');
            return info;
        } catch (error) {
            Logger.error('Redis memory usage error:', error);
            return null;
        }
    }

    async healthCheck() {
        try {
            if (!this.isConnected) {
                return { status: 'disconnected', message: 'Not connected to Redis' };
            }

            const startTime = Date.now();
            await this.client.ping();
            const latency = Date.now() - startTime;

            const info = await this.client.info('server');
            const memory = await this.client.info('memory');

            return {
                status: 'healthy',
                message: 'Redis connection is healthy',
                latency: `${latency}ms`,
                details: {
                    server: info,
                    memory: memory
                }
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                message: 'Redis health check failed',
                error: error.message
            };
        }
    }

    getConnectionState() {
        return {
            isConnected: this.isConnected,
            status: this.client ? this.client.status : 'disconnected',
            config: {
                host: this.config?.host,
                port: this.config?.port,
                database: this.config?.database
            }
        };
    }
}

module.exports = new RedisManager();
