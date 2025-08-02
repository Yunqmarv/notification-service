const mongoose = require('mongoose');
const Logger = require('../utils/logger');

class DatabaseConnection {
    constructor() {
        this.connection = null;
        this.isConnected = false;
        this.connectionAttempts = 0;
        this.maxRetries = 5;
        this.retryDelay = 5000; // 5 seconds
    }

    async connect() {
        if (this.isConnected) {
            return this.connection;
        }

        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('MONGODB_URI environment variable is required');
        }

        const options = {
            maxPoolSize: 10, // Maximum number of connections
            serverSelectionTimeoutMS: 5000, // Timeout for initial connection
            socketTimeoutMS: 45000, // Socket timeout
            retryWrites: true,
            retryReads: true,
            readPreference: 'primary',
            writeConcern: {
                w: 'majority',
                j: true,
                wtimeout: 5000
            }
        };

        try {
            Logger.info('🔌 Connecting to MongoDB...');
            
            // Configure mongoose settings (only valid options)
            mongoose.set('bufferCommands', false);
            
            this.connection = await mongoose.connect(mongoUri, options);
            this.isConnected = true;
            this.connectionAttempts = 0;

            // Set up event listeners
            this.setupEventListeners();

            Logger.info('✅ MongoDB connected successfully');
            return this.connection;

        } catch (error) {
            this.connectionAttempts++;
            Logger.error(`❌ MongoDB connection failed (attempt ${this.connectionAttempts}):`, error);
            console.error('Full MongoDB error:', error); // Debug log

            if (this.connectionAttempts < this.maxRetries) {
                Logger.info(`🔄 Retrying connection in ${this.retryDelay}ms...`);
                await new Promise(resolve => setTimeout(resolve, this.retryDelay));
                return this.connect();
            } else {
                throw new Error(`Failed to connect to MongoDB after ${this.maxRetries} attempts: ${error.message}`);
            }
        }
    }

    setupEventListeners() {
        const db = mongoose.connection;

        db.on('error', (error) => {
            Logger.error('MongoDB connection error:', error);
            this.isConnected = false;
        });

        db.on('disconnected', () => {
            Logger.warn('MongoDB disconnected');
            this.isConnected = false;
            this.reconnect();
        });

        db.on('reconnected', () => {
            Logger.info('MongoDB reconnected');
            this.isConnected = true;
        });

        db.on('close', () => {
            Logger.info('MongoDB connection closed');
            this.isConnected = false;
        });

        // Handle application termination
        process.on('SIGINT', () => this.disconnect());
        process.on('SIGTERM', () => this.disconnect());
    }

    async reconnect() {
        if (this.isConnected) return;

        try {
            await new Promise(resolve => setTimeout(resolve, this.retryDelay));
            await this.connect();
        } catch (error) {
            Logger.error('Reconnection failed:', error);
        }
    }

    async disconnect() {
        if (!this.isConnected) return;

        try {
            await mongoose.connection.close();
            this.isConnected = false;
            Logger.info('✅ MongoDB disconnected gracefully');
        } catch (error) {
            Logger.error('Error disconnecting from MongoDB:', error);
        }
    }

    getConnectionState() {
        return {
            isConnected: this.isConnected,
            readyState: mongoose.connection.readyState,
            host: mongoose.connection.host,
            port: mongoose.connection.port,
            name: mongoose.connection.name
        };
    }

    async healthCheck() {
        try {
            if (!this.isConnected) {
                return { status: 'disconnected', message: 'Not connected to MongoDB' };
            }

            // Ping the database
            await mongoose.connection.db.admin().ping();
            
            const stats = await mongoose.connection.db.stats();
            
            return {
                status: 'healthy',
                message: 'MongoDB connection is healthy',
                details: {
                    readyState: mongoose.connection.readyState,
                    host: mongoose.connection.host,
                    port: mongoose.connection.port,
                    database: mongoose.connection.name,
                    collections: stats.collections,
                    dataSize: stats.dataSize,
                    indexSize: stats.indexSize
                }
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                message: 'MongoDB health check failed',
                error: error.message
            };
        }
    }
}

module.exports = new DatabaseConnection();
