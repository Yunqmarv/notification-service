const express = require('express');
const cluster = require('cluster');
const os = require('os');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') }); // Load environment variables with correct path
require('express-async-errors');

const DatabaseConnection = require('./config/database');
const RedisManager = require('./config/redis');
const Logger = require('./utils/logger');
const MetricsCollector = require('./services/metrics');
const SettingsService = require('./services/settings');
const ErrorHandler = require('./middleware/errorHandler');
const RateLimitService = require('./middleware/rateLimit');
const ValidationMiddleware = require('./middleware/validation');
const HealthService = require('./services/health');
const SwaggerService = require('./config/swagger');
const JobScheduler = require('./services/scheduler');
const WebSocketNotifier = require('./services/websocketNotifier');
const EmailDeliveryService = require('./services/emailDelivery');

// Import routes
const notificationRoutes = require('./routes/notifications');
const analyticsRoutes = require('./routes/analytics');
const healthRoutes = require('./routes/health');
const metricsRoutes = require('./routes/metrics');
const adminRoutes = require('./routes/admin');
const testRoutes = require('./routes/test');

class NotificationMicroservice {
    constructor() {
        this.app = express();
        this.server = null;
        this.isShuttingDown = false;
        this.connections = new Set();
    }

    async initialize() {
        try {
            Logger.info('🚀 Initializing Notification Microservice...');

            // Connect to MongoDB and load settings
            await DatabaseConnection.connect();
            await SettingsService.initialize();
            
            // Connect to Redis
            await RedisManager.connect();
            
            // Initialize metrics collection
            await MetricsCollector.initialize();
            
            // Initialize health service
            await HealthService.initialize();
            
            // Initialize job scheduler
            await JobScheduler.initialize();
            
            // Initialize WebSocket notifier
            await WebSocketNotifier.initialize();
            
            // Initialize email delivery service
            await EmailDeliveryService.initialize();
            
            // Setup Express middleware
            this.setupMiddleware();
            
            // Setup routes
            this.setupRoutes();
            
            // Setup error handling
            this.setupErrorHandling();
            
            // Setup graceful shutdown
            this.setupGracefulShutdown();
            
            // Log system configuration
            this.logSystemConfiguration();
            
            Logger.info('✅ Notification Microservice initialized successfully');
            
        } catch (error) {
            console.error('❌ INITIALIZATION FAILED - Full Error:', error);
            console.error('Error stack:', error.stack);
            Logger.error('❌ Failed to initialize Notification Microservice:', error);
            process.exit(1);
        }
    }

    setupMiddleware() {
        // Security middleware
        this.app.use(helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    scriptSrc: ["'self'", "'unsafe-inline'"],
                    imgSrc: ["'self'", "data:", "https:"],
                }
            }
        }));

        // CORS configuration - get from database settings
        let allowedOrigins = SettingsService.get('cors.allowedOrigins');
        
        // Handle case where CORS origins might be stored as a string in the database
        if (typeof allowedOrigins === 'string') {
            try {
                // Try to parse as JSON array
                allowedOrigins = JSON.parse(allowedOrigins.replace(/'/g, '"'));
            } catch (e) {
                // If parsing fails, split by comma and clean up
                allowedOrigins = allowedOrigins
                    .replace(/[\[\]']/g, '')
                    .split(',')
                    .map(origin => origin.trim())
                    .filter(origin => origin.length > 0);
            }
        }
        
        Logger.info('CORS allowed origins:', allowedOrigins);
        
        this.app.use(cors({
            origin: allowedOrigins,
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-api-key'],
            optionsSuccessStatus: 200
        }));

        // Compression
        this.app.use(compression());

        // Logging
        this.app.use(morgan('combined', {
            stream: {
                write: (message) => Logger.info(message.trim())
            }
        }));

        // Body parsing
        this.app.use(express.json({ 
            limit: SettingsService.get('server.maxRequestSize', '10mb') 
        }));
        this.app.use(express.urlencoded({ 
            extended: true, 
            limit: SettingsService.get('server.maxRequestSize', '10mb') 
        }));

        // Rate limiting - temporarily disable
        // this.app.use(RateLimitService.createLimiter());

        // Request tracking
        this.app.use((req, res, next) => {
            req.requestId = require('uuid').v4();
            req.startTime = Date.now();
            
            // Track connection
            this.connections.add(req.socket);
            req.socket.on('close', () => {
                this.connections.delete(req.socket);
            });
            
            next();
        });

        // Metrics collection
        this.app.use(MetricsCollector.middleware());
    }

    setupRoutes() {
        // API Documentation
        SwaggerService.setup(this.app);

        // Health check (no auth required)
        this.app.use('/health', healthRoutes);
        this.app.use('/metrics', metricsRoutes);

        // Test endpoint (no auth required)
        this.app.get('/test', (req, res) => {
            res.json({
                success: true,
                message: 'Test endpoint working',
                timestamp: new Date().toISOString(),
                server: 'Notification Microservice'
            });
        });

        // System notifications route (API key authentication required - for internal system use)
        this.app.use('/api/system/notifications', ValidationMiddleware.authenticateSystemApiKey, notificationRoutes);

        // API routes with validation (for user-facing endpoints)
        this.app.use('/api/notifications', ValidationMiddleware.authenticate, notificationRoutes);
        this.app.use('/api/analytics', ValidationMiddleware.authenticate, analyticsRoutes);
        
        this.app.use('/api/admin', adminRoutes); // Admin routes now handle their own API key authentication

        // Root endpoint
        this.app.get('/', (req, res) => {
            res.json({
                service: 'Notification Microservice',
                version: require('../package.json').version,
                status: 'operational',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                documentation: '/api-docs'
            });
        });

        // 404 handler
        this.app.use('*', (req, res) => {
            res.status(404).json({
                success: false,
                message: 'Endpoint not found',
                path: req.originalUrl,
                timestamp: new Date().toISOString()
            });
        });
    }

    setupErrorHandling() {
        this.app.use(ErrorHandler.handler);
    }

    setupGracefulShutdown() {
        const shutdown = async (signal) => {
            if (this.isShuttingDown) return;
            this.isShuttingDown = true;

            Logger.info(`🛑 Received ${signal}. Starting graceful shutdown...`);

            // Stop accepting new connections
            if (this.server) {
                this.server.close(() => {
                    Logger.info('✅ HTTP server closed');
                });
            }

            try {
                // Close existing connections gracefully
                for (const connection of this.connections) {
                    connection.destroy();
                }

                // Stop job scheduler
                await JobScheduler.shutdown();

                // Disconnect from Redis
                await RedisManager.disconnect();

                // Disconnect from MongoDB
                await DatabaseConnection.disconnect();

                Logger.info('✅ Graceful shutdown completed');
                process.exit(0);
            } catch (error) {
                Logger.error('❌ Error during shutdown:', error);
                process.exit(1);
            }
        };

        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));
        process.on('SIGUSR2', () => shutdown('SIGUSR2')); // Nodemon restart
    }

    logSystemConfiguration() {
        try {
            const loggerHealth = Logger.healthCheck();
            
            Logger.info('🔧 System Configuration:', {
                environment: process.env.NODE_ENV || 'development',
                nodeVersion: process.version,
                logging: loggerHealth.config || 'Configuration unavailable',
                pid: process.pid
            });
            
            // Log CORS configuration
            const corsOrigins = SettingsService.get('cors.allowedOrigins', ['*']);
            Logger.info('🌐 CORS Configuration:', { allowedOrigins: corsOrigins });
            
        } catch (error) {
            Logger.error('Failed to log system configuration:', error);
        }
    }

    async start() {
        const port = SettingsService.get('server.port', 3001);
        const host = SettingsService.get('server.host', '0.0.0.0');

        this.server = this.app.listen(port, host, () => {
            Logger.info(`🌟 Notification Microservice running on http://${host}:${port}`);
            Logger.info(`📖 API Documentation available at http://${host}:${port}/api-docs`);
            Logger.info(`💊 Health check available at http://${host}:${port}/health`);
            Logger.info(`📊 Metrics available at http://${host}:${port}/metrics`);
        });

        this.server.on('error', (error) => {
            Logger.error('Server error:', error);
        });

        return this.server;
    }
}

// Cluster mode for production scalability
async function startService() {
    const cpuCount = os.cpus().length;
    const clusterMode = process.env.CLUSTER_MODE === 'true';

    if (clusterMode && cluster.isMaster) {
        Logger.info(`🔧 Starting ${cpuCount} workers in cluster mode...`);

        // Fork workers
        for (let i = 0; i < cpuCount; i++) {
            cluster.fork();
        }

        cluster.on('exit', (worker, code, signal) => {
            Logger.warn(`Worker ${worker.process.pid} died. Restarting...`);
            cluster.fork();
        });

        cluster.on('online', (worker) => {
            Logger.info(`Worker ${worker.process.pid} is online`);
        });

    } else {
        // Single instance or worker process
        const service = new NotificationMicroservice();
        await service.initialize();
        await service.start();
    }
}

// Start the service
if (require.main === module) {
    startService().catch((error) => {
        console.error('❌ STARTUP FAILED - Full Error:', error);
        console.error('Error stack:', error.stack);
        Logger.error('Failed to start service:', error);
        process.exit(1);
    });
}

module.exports = NotificationMicroservice;
