const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

class Logger {
    constructor() {
        this.logger = null;
        this.isLoggingEnabled = process.env.ENABLE_LOGGING !== 'false'; // Default to true
        this.isConsoleLoggingEnabled = process.env.ENABLE_CONSOLE_LOGGING !== 'false'; // Default to true
        this.isFileLoggingEnabled = process.env.ENABLE_FILE_LOGGING !== 'false'; // Default to true
        this.isDebugLoggingEnabled = process.env.ENABLE_DEBUG_LOGGING === 'true'; // Default to false in production
        this.isSecurityLoggingEnabled = process.env.ENABLE_SECURITY_LOGGING !== 'false'; // Default to true
        this.isPerformanceLoggingEnabled = process.env.ENABLE_PERFORMANCE_LOGGING !== 'false'; // Default to true
        this.isRequestLoggingEnabled = process.env.ENABLE_REQUEST_LOGGING !== 'false'; // Default to true
        
        this.initialize();
    }

    initialize() {
        // If logging is completely disabled, create a no-op logger
        if (!this.isLoggingEnabled) {
            this.logger = this.createNoOpLogger();
            return;
        }

        const logDir = path.join(__dirname, '../..', 'logs');
        
        // Create custom format
        const customFormat = winston.format.combine(
            winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            winston.format.errors({ stack: true }),
            winston.format.json(),
            winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
                let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
                
                if (stack) {
                    log += `\n${stack}`;
                }
                
                if (Object.keys(meta).length > 0) {
                    log += `\nMeta: ${JSON.stringify(meta, null, 2)}`;
                }
                
                return log;
            })
        );

        // Configure transports conditionally
        const transports = [];

        // Add console transport if enabled
        if (this.isConsoleLoggingEnabled) {
            transports.push(
                new winston.transports.Console({
                    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
                    format: winston.format.combine(
                        winston.format.colorize(),
                        winston.format.timestamp({ format: 'HH:mm:ss' }),
                        winston.format.printf(({ timestamp, level, message }) => {
                            return `${timestamp} ${level}: ${message}`;
                        })
                    )
                })
            );
        }

        // Add file transports if enabled
        if (this.isFileLoggingEnabled) {
            // File transport for all logs
            transports.push(
                new DailyRotateFile({
                    filename: path.join(logDir, 'application-%DATE%.log'),
                    datePattern: 'YYYY-MM-DD',
                    maxSize: '20m',
                    maxFiles: '30d',
                    level: 'info',
                    format: customFormat,
                    createSymlink: true,
                    symlinkName: 'current.log'
                })
            );

            // Error file transport
            transports.push(
                new DailyRotateFile({
                    filename: path.join(logDir, 'error-%DATE%.log'),
                    datePattern: 'YYYY-MM-DD',
                    maxSize: '20m',
                    maxFiles: '30d',
                    level: 'error',
                    format: customFormat,
                    createSymlink: true,
                    symlinkName: 'current-error.log'
                })
            );

            // Debug file transport (only if debug logging is enabled)
            if (this.isDebugLoggingEnabled) {
                transports.push(
                    new DailyRotateFile({
                        filename: path.join(logDir, 'debug-%DATE%.log'),
                        datePattern: 'YYYY-MM-DD',
                        maxSize: '10m',
                        maxFiles: '7d',
                        level: 'debug',
                        format: customFormat,
                        createSymlink: true,
                        symlinkName: 'current-debug.log'
                    })
                );
            }
        }

        // Create logger instance
        this.logger = winston.createLogger({
            level: process.env.LOG_LEVEL || (this.isDebugLoggingEnabled ? 'debug' : 'info'),
            format: customFormat,
            transports,
            exitOnError: false,
            silent: process.env.NODE_ENV === 'test' || !this.isLoggingEnabled
        });

        // Handle uncaught exceptions and rejections only if file logging is enabled
        if (this.isFileLoggingEnabled) {
            this.logger.exceptions.handle(
                new DailyRotateFile({
                    filename: path.join(logDir, 'exceptions-%DATE%.log'),
                    datePattern: 'YYYY-MM-DD',
                    maxSize: '20m',
                    maxFiles: '30d',
                    format: customFormat
                })
            );

            this.logger.rejections.handle(
                new DailyRotateFile({
                    filename: path.join(logDir, 'rejections-%DATE%.log'),
                    datePattern: 'YYYY-MM-DD',
                    maxSize: '20m',
                    maxFiles: '30d',
                    format: customFormat
                })
            );
        }
    }

    /**
     * Create a no-operation logger that does nothing
     */
    createNoOpLogger() {
        const noOp = () => {};
        return {
            debug: noOp,
            info: noOp,
            warn: noOp,
            error: noOp,
            exceptions: { handle: noOp },
            rejections: { handle: noOp }
        };
    }

    // Logging methods with conditional checks
    debug(message, meta = {}) {
        if (!this.isLoggingEnabled || (!this.isDebugLoggingEnabled && process.env.NODE_ENV === 'production')) {
            return;
        }
        this.logger.debug(message, meta);
    }

    info(message, meta = {}) {
        if (!this.isLoggingEnabled) return;
        this.logger.info(message, meta);
    }

    warn(message, meta = {}) {
        if (!this.isLoggingEnabled) return;
        this.logger.warn(message, meta);
    }

    error(message, error = null, meta = {}) {
        if (!this.isLoggingEnabled) return;
        
        if (error instanceof Error) {
            this.logger.error(message, { error: error.message, stack: error.stack, ...meta });
        } else if (error) {
            this.logger.error(message, { error, ...meta });
        } else {
            this.logger.error(message, meta);
        }
    }

    fatal(message, error = null, meta = {}) {
        if (!this.isLoggingEnabled) return;
        this.error(`FATAL: ${message}`, error, meta);
    }

    // Structured logging methods with conditional checks
    logRequest(req, res, responseTime) {
        if (!this.isLoggingEnabled || !this.isRequestLoggingEnabled) return;
        
        const logData = {
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
            userAgent: req.get('User-Agent'),
            ip: req.ip,
            responseTime: `${responseTime}ms`,
            requestId: req.requestId,
            userId: req.userId || 'anonymous'
        };

        if (res.statusCode >= 400) {
            this.warn('HTTP Request Error', logData);
        } else {
            this.info('HTTP Request', logData);
        }
    }

    logDatabaseOperation(operation, collection, duration, error = null) {
        if (!this.isLoggingEnabled || (!this.isDebugLoggingEnabled && process.env.NODE_ENV === 'production')) {
            return;
        }
        
        const logData = {
            operation,
            collection,
            duration: `${duration}ms`,
            timestamp: new Date().toISOString()
        };

        if (error) {
            this.error('Database Operation Failed', error, logData);
        } else {
            this.debug('Database Operation', logData);
        }
    }

    logCacheOperation(operation, key, hit = null, duration = null) {
        if (!this.isLoggingEnabled || (!this.isDebugLoggingEnabled && process.env.NODE_ENV === 'production')) {
            return;
        }
        
        const logData = {
            operation,
            key,
            hit: hit !== null ? (hit ? 'HIT' : 'MISS') : undefined,
            duration: duration ? `${duration}ms` : undefined,
            timestamp: new Date().toISOString()
        };

        // this.debug('Cache Operation', logData);
    }

    logNotificationEvent(event, notificationId, userId, details = {}) {
        if (!this.isLoggingEnabled) return;
        
        const logData = {
            event,
            notificationId,
            userId,
            timestamp: new Date().toISOString(),
            ...details
        };

        // this.info('Notification Event', logData);
    }

    logWebSocketEvent(event, userId, details = {}) {
        if (!this.isLoggingEnabled || (!this.isDebugLoggingEnabled && process.env.NODE_ENV === 'production')) {
            return;
        }
        
        const logData = {
            event,
            userId,
            timestamp: new Date().toISOString(),
            ...details
        };

        // this.debug('WebSocket Event', logData);
    }

    logMetric(metricName, value, tags = {}) {
        if (!this.isLoggingEnabled || (!this.isDebugLoggingEnabled && process.env.NODE_ENV === 'production')) {
            return;
        }
        
        const logData = {
            metric: metricName,
            value,
            tags,
            timestamp: new Date().toISOString()
        };

        this.debug('Metric', logData);
    }

    logSecurityEvent(event, userId, ip, details = {}) {
        if (!this.isLoggingEnabled || !this.isSecurityLoggingEnabled) return;
        
        const logData = {
            event,
            userId,
            ip,
            timestamp: new Date().toISOString(),
            ...details
        };

        this.warn('Security Event', logData);
    }

    logPerformanceMetric(operation, duration, details = {}) {
        if (!this.isLoggingEnabled || !this.isPerformanceLoggingEnabled) return;
        
        const logData = {
            operation,
            duration: `${duration}ms`,
            timestamp: new Date().toISOString(),
            ...details
        };

        if (duration > 1000) {
            this.warn('Slow Operation', logData);
        } else {
            this.debug('Performance Metric', logData);
        }
    }

    // Stream for Morgan middleware
    get stream() {
        if (!this.isLoggingEnabled || !this.isRequestLoggingEnabled) {
            return {
                write: () => {} // No-op if request logging is disabled
            };
        }
        
        return {
            write: (message) => {
                this.info(message.trim());
            }
        };
    }

    // Get logger instance for advanced usage
    getLogger() {
        return this.logger;
    }

    // Create child logger with additional context
    child(defaultMeta) {
        if (!this.isLoggingEnabled) {
            const noOp = () => {};
            return {
                debug: noOp,
                info: noOp,
                warn: noOp,
                error: noOp,
                fatal: noOp
            };
        }
        
        return {
            debug: (message, meta = {}) => this.debug(message, { ...defaultMeta, ...meta }),
            info: (message, meta = {}) => this.info(message, { ...defaultMeta, ...meta }),
            warn: (message, meta = {}) => this.warn(message, { ...defaultMeta, ...meta }),
            error: (message, error = null, meta = {}) => this.error(message, error, { ...defaultMeta, ...meta }),
            fatal: (message, error = null, meta = {}) => this.fatal(message, error, { ...defaultMeta, ...meta })
        };
    }

    // Health check for logging system
    healthCheck() {
        try {
            if (!this.isLoggingEnabled) {
                return { status: 'disabled', message: 'Logging is disabled via environment variables' };
            }
            
            this.info('Logger health check');
            return { 
                status: 'healthy', 
                message: 'Logger is working correctly',
                config: {
                    loggingEnabled: this.isLoggingEnabled,
                    consoleLoggingEnabled: this.isConsoleLoggingEnabled,
                    fileLoggingEnabled: this.isFileLoggingEnabled,
                    debugLoggingEnabled: this.isDebugLoggingEnabled,
                    securityLoggingEnabled: this.isSecurityLoggingEnabled,
                    performanceLoggingEnabled: this.isPerformanceLoggingEnabled,
                    requestLoggingEnabled: this.isRequestLoggingEnabled
                }
            };
        } catch (error) {
            return { status: 'unhealthy', message: 'Logger health check failed', error: error.message };
        }
    }

    // Get logs from log files
    async getLogs({ level = null, limit = 100, offset = 0 } = {}) {
        const fs = require('fs').promises;
        const readline = require('readline');
        const { createReadStream } = require('fs');
        
        try {
            if (!this.isLoggingEnabled || !this.isFileLoggingEnabled) {
                return {
                    logs: [],
                    total: 0,
                    message: 'File logging is disabled'
                };
            }

            const logDir = path.join(__dirname, '../..', 'logs');
            const logFiles = [];
            
            // Get all log files, prioritizing current files
            try {
                const files = await fs.readdir(logDir);
                const currentDate = new Date().toISOString().split('T')[0];
                
                // Add current log files first
                if (files.includes('current.log')) logFiles.push(path.join(logDir, 'current.log'));
                if (files.includes('current-error.log')) logFiles.push(path.join(logDir, 'current-error.log'));
                if (files.includes('current-debug.log')) logFiles.push(path.join(logDir, 'current-debug.log'));
                
                // Add today's files
                const todayFiles = files.filter(file => file.includes(currentDate))
                    .sort((a, b) => b.localeCompare(a)); // Most recent first
                
                for (const file of todayFiles) {
                    const fullPath = path.join(logDir, file);
                    if (!logFiles.includes(fullPath)) {
                        logFiles.push(fullPath);
                    }
                }
                
            } catch (dirError) {
                console.error('Error reading log directory:', dirError);
                return {
                    logs: [],
                    total: 0,
                    error: 'Unable to read log directory'
                };
            }

            const allLogs = [];
            
            // Read logs from files
            for (const logFile of logFiles) {
                try {
                    await this.readLogsFromFile(logFile, allLogs, level);
                } catch (fileError) {
                    console.error(`Error reading log file ${logFile}:`, fileError);
                    // Continue with other files
                }
            }
            
            // Sort logs by timestamp (most recent first)
            allLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            
            // Apply pagination
            const paginatedLogs = allLogs.slice(offset, offset + limit);
            
            return {
                logs: paginatedLogs,
                total: allLogs.length,
                offset,
                limit
            };
            
        } catch (error) {
            console.error('Error retrieving logs:', error);
            throw new Error(`Failed to retrieve logs: ${error.message}`);
        }
    }

    // Helper method to read logs from a single file
    async readLogsFromFile(filePath, allLogs, levelFilter = null) {
        const fs = require('fs');
        const readline = require('readline');
        
        return new Promise((resolve, reject) => {
            if (!fs.existsSync(filePath)) {
                resolve();
                return;
            }

            const fileStream = fs.createReadStream(filePath);
            const rl = readline.createInterface({
                input: fileStream,
                crlfDelay: Infinity
            });

            rl.on('line', (line) => {
                if (!line.trim()) return;
                
                try {
                    // Try to parse as JSON first (structured logs)
                    if (line.startsWith('{')) {
                        const logEntry = JSON.parse(line);
                        if (levelFilter && logEntry.level !== levelFilter) return;
                        
                        allLogs.push({
                            timestamp: logEntry.timestamp,
                            level: logEntry.level,
                            message: logEntry.message,
                            metadata: logEntry,
                            source: path.basename(filePath)
                        });
                    } else {
                        // Parse text format logs
                        const match = line.match(/^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}) \[(\w+)\]: (.+)$/);
                        if (match) {
                            const [, timestamp, level, message] = match;
                            if (levelFilter && level.toLowerCase() !== levelFilter.toLowerCase()) return;
                            
                            allLogs.push({
                                timestamp,
                                level: level.toLowerCase(),
                                message,
                                source: path.basename(filePath)
                            });
                        } else {
                            // Fallback for unstructured logs
                            allLogs.push({
                                timestamp: new Date().toISOString(),
                                level: 'info',
                                message: line,
                                source: path.basename(filePath)
                            });
                        }
                    }
                } catch (parseError) {
                    // If parsing fails, treat as plain text
                    allLogs.push({
                        timestamp: new Date().toISOString(),
                        level: 'info',
                        message: line,
                        source: path.basename(filePath),
                        parseError: true
                    });
                }
            });

            rl.on('close', () => {
                resolve();
            });

            rl.on('error', (error) => {
                reject(error);
            });
        });
    }
}

// Export singleton instance
module.exports = new Logger();
