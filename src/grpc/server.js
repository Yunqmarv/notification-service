const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const path = require('path');
const Logger = require('../utils/logger');
const NotificationService = require('../services/notification');
const MetricsCollector = require('../services/metrics');
const SettingsService = require('../services/settings');

class GrpcNotificationServer {
    constructor() {
        this.server = null;
        this.port = null;
        this.isRunning = false;
        this.packageDefinition = null;
        this.notificationProto = null;
    }

    async initialize() {
        try {
            // Load the protocol buffer definition
            const PROTO_PATH = path.join(__dirname, '../../proto/notification.proto');
            
            this.packageDefinition = protoLoader.loadSync(PROTO_PATH, {
                keepCase: true,
                longs: String,
                enums: String,
                defaults: true,
                oneofs: true,
            });

            this.notificationProto = grpc.loadPackageDefinition(this.packageDefinition).notification;

            // Create the gRPC server
            this.server = new grpc.Server();

            // Add the notification service
            this.server.addService(this.notificationProto.NotificationService.service, {
                CreateNotification: this.createNotification.bind(this),
                SendSecurityNotification: this.sendSecurityNotification.bind(this),
                SendSystemNotification: this.sendSystemNotification.bind(this),
                SendMatchNotification: this.sendMatchNotification.bind(this),
                SendMessageNotification: this.sendMessageNotification.bind(this),
                SendPaymentNotification: this.sendPaymentNotification.bind(this),
                SendLikeNotification: this.sendLikeNotification.bind(this),
                HealthCheck: this.healthCheck.bind(this),
            });

            Logger.info('gRPC Notification Server initialized successfully');
        } catch (error) {
            Logger.error('Failed to initialize gRPC server:', error);
            throw error;
        }
    }

    async start() {
        if (this.isRunning) {
            Logger.warn('gRPC server is already running');
            return;
        }

        try {
            this.port = SettingsService.get('grpc.port', 50051);
            const host = SettingsService.get('grpc.host', '0.0.0.0');
            const address = `${host}:${this.port}`;

            await new Promise((resolve, reject) => {
                this.server.bindAsync(address, grpc.ServerCredentials.createInsecure(), (error, port) => {
                    if (error) {
                        reject(error);
                        return;
                    }

                    this.server.start();
                    this.isRunning = true;
                    this.port = port;
                    
                    Logger.info(`🚀 gRPC Notification Server started on ${address}`);
                    resolve(port);
                });
            });

        } catch (error) {
            Logger.error('Failed to start gRPC server:', error);
            throw error;
        }
    }

    async stop() {
        if (!this.isRunning || !this.server) {
            return;
        }

        try {
            await new Promise((resolve) => {
                this.server.tryShutdown(() => {
                    this.isRunning = false;
                    Logger.info('gRPC Notification Server stopped');
                    resolve();
                });
            });
        } catch (error) {
            Logger.error('Error stopping gRPC server:', error);
            // Force shutdown if graceful shutdown fails
            this.server.forceShutdown();
            this.isRunning = false;
        }
    }

    // gRPC method implementations

    async createNotification(call, callback) {
        const startTime = Date.now();
        
        try {
            const request = call.request;
            
            Logger.debug('gRPC CreateNotification called', {
                userId: request.user_id,
                type: request.type,
                title: request.title
            });

            // Convert gRPC request to internal format
            const notificationData = {
                userId: request.user_id,
                title: request.title,
                message: request.message,
                type: request.type,
                priority: request.priority || 'normal',
                metadata: request.metadata || {},
                channels: {
                    push: request.channels?.push ?? true,
                    email: request.channels?.email ?? false,
                    websocket: request.channels?.websocket ?? true,
                    inApp: request.channels?.in_app ?? true,
                    sms: request.channels?.sms ?? false
                },
                scheduling: {
                    immediate: request.scheduling?.immediate ?? true,
                    deliveryTime: request.scheduling?.delivery_time
                }
            };

            // Create the notification
            const result = await NotificationService.createNotification(notificationData);

            // Record metrics
            await MetricsCollector.recordGrpcRequest('CreateNotification', 'success', Date.now() - startTime);

            callback(null, {
                success: true,
                message: 'Notification created successfully',
                notification_id: result.id,
                status: result.status || 'created',
                metadata: {}
            });

        } catch (error) {
            Logger.error('gRPC CreateNotification error:', error);
            await MetricsCollector.recordGrpcRequest('CreateNotification', 'error', Date.now() - startTime);
            
            callback({
                code: grpc.status.INTERNAL,
                message: error.message || 'Failed to create notification'
            });
        }
    }

    async sendSecurityNotification(call, callback) {
        const startTime = Date.now();
        
        try {
            const request = call.request;
            
            // Logger.debug('gRPC SendSecurityNotification called', {
            //     userId: request.user_id,
            //     eventType: request.security_event_type
            // });

            // Convert gRPC request to internal format
            const notificationData = {
                userId: request.user_id,
                title: request.title,
                message: request.message,
                type: 'security',
                priority: 'high',
                metadata: {
                    securityEventId: request.security_event_id,
                    securityEventType: request.security_event_type,
                    deviceInfo: request.device_info ? {
                        deviceType: request.device_info.device_type,
                        browser: request.device_info.browser,
                        os: request.device_info.os,
                        fingerprint: request.device_info.fingerprint
                    } : {},
                    ipAddress: request.ip_address,
                    location: request.location,
                    actionTaken: request.action_taken,
                    actionRequired: request.action_required,
                    securityTimestamp: new Date().toISOString(),
                    category: 'security'
                },
                channels: {
                    push: false,
                    email: false,
                    websocket: true,
                    inApp: true
                }
            };

            // Create the notification
            const result = await NotificationService.createNotification(notificationData);

            // Record metrics
            await MetricsCollector.recordGrpcRequest('SendSecurityNotification', 'success', Date.now() - startTime);

            callback(null, {
                success: true,
                message: 'Security notification sent successfully',
                notification_id: result.id,
                status: result.status || 'created',
                metadata: {
                    security_event_id: request.security_event_id,
                    event_type: request.security_event_type
                }
            });

        } catch (error) {
            Logger.error('gRPC SendSecurityNotification error:', error);
            await MetricsCollector.recordGrpcRequest('SendSecurityNotification', 'error', Date.now() - startTime);
            
            callback({
                code: grpc.status.INTERNAL,
                message: error.message || 'Failed to send security notification'
            });
        }
    }

    async sendSystemNotification(call, callback) {
        const startTime = Date.now();
        
        try {
            const request = call.request;
            
            const notificationData = {
                userId: request.user_id,
                title: request.title || 'System Notification',
                message: request.message,
                type: 'system',
                priority: request.priority || 'normal',
                metadata: {
                    category: request.category || 'system',
                    action: request.action,
                    data: request.data || {}
                },
                channels: {
                    push: request.push !== false,
                    email: request.email === true,
                    websocket: true,
                    inApp: true
                }
            };

            const result = await NotificationService.createNotification(notificationData);
            await MetricsCollector.recordGrpcRequest('SendSystemNotification', 'success', Date.now() - startTime);

            callback(null, {
                success: true,
                message: 'System notification sent successfully',
                notification_id: result.id,
                status: result.status || 'created',
                metadata: {}
            });

        } catch (error) {
            Logger.error('gRPC SendSystemNotification error:', error);
            await MetricsCollector.recordGrpcRequest('SendSystemNotification', 'error', Date.now() - startTime);
            
            callback({
                code: grpc.status.INTERNAL,
                message: error.message || 'Failed to send system notification'
            });
        }
    }

    async sendMatchNotification(call, callback) {
        const startTime = Date.now();
        
        try {
            const request = call.request;
            
            const notificationData = {
                userId: request.user_id,
                title: 'New Match! 💕',
                message: `You have a new match with ${request.partner_name || 'someone special'}!`,
                type: 'match',
                priority: 'high',
                metadata: {
                    matchId: request.match_id,
                    partnerId: request.partner_id,
                    partnerName: request.partner_name,
                    profilePicture: request.profile_picture,
                    category: 'matching'
                },
                channels: {
                    push: true,
                    email: request.email_notifications !== false,
                    websocket: true,
                    inApp: true
                }
            };

            const result = await NotificationService.createNotification(notificationData);
            await MetricsCollector.recordGrpcRequest('SendMatchNotification', 'success', Date.now() - startTime);

            callback(null, {
                success: true,
                message: 'Match notification sent successfully',
                notification_id: result.id,
                status: result.status || 'created',
                metadata: {
                    match_id: request.match_id,
                    partner_id: request.partner_id
                }
            });

        } catch (error) {
            Logger.error('gRPC SendMatchNotification error:', error);
            await MetricsCollector.recordGrpcRequest('SendMatchNotification', 'error', Date.now() - startTime);
            
            callback({
                code: grpc.status.INTERNAL,
                message: error.message || 'Failed to send match notification'
            });
        }
    }

    async sendMessageNotification(call, callback) {
        const startTime = Date.now();
        
        try {
            const request = call.request;
            
            const notificationData = {
                userId: request.user_id,
                title: 'New Message 💬',
                message: `${request.sender_name || 'Someone'} sent you a message`,
                type: 'message',
                priority: 'high',
                metadata: {
                    messageId: request.message_id,
                    senderId: request.sender_id,
                    senderName: request.sender_name,
                    conversationId: request.conversation_id,
                    preview: request.preview,
                    category: 'messaging'
                },
                channels: {
                    push: true,
                    email: request.email_notifications !== false,
                    websocket: true,
                    inApp: true
                }
            };

            const result = await NotificationService.createNotification(notificationData);
            await MetricsCollector.recordGrpcRequest('SendMessageNotification', 'success', Date.now() - startTime);

            callback(null, {
                success: true,
                message: 'Message notification sent successfully',
                notification_id: result.id,
                status: result.status || 'created',
                metadata: {
                    message_id: request.message_id,
                    sender_id: request.sender_id
                }
            });

        } catch (error) {
            Logger.error('gRPC SendMessageNotification error:', error);
            await MetricsCollector.recordGrpcRequest('SendMessageNotification', 'error', Date.now() - startTime);
            
            callback({
                code: grpc.status.INTERNAL,
                message: error.message || 'Failed to send message notification'
            });
        }
    }

    async sendPaymentNotification(call, callback) {
        const startTime = Date.now();
        
        try {
            const request = call.request;
            
            const notificationData = {
                userId: request.user_id,
                title: request.success ? 'Payment Successful ✅' : 'Payment Failed ❌',
                message: request.message || (request.success ? 
                    'Your payment has been processed successfully.' : 
                    'Your payment could not be processed. Please try again.'),
                type: 'payment',
                priority: 'high',
                metadata: {
                    paymentId: request.payment_id,
                    amount: request.amount,
                    currency: request.currency,
                    success: request.success,
                    category: 'payment'
                },
                channels: {
                    push: true,
                    email: true,
                    websocket: true,
                    inApp: true
                }
            };

            const result = await NotificationService.createNotification(notificationData);
            await MetricsCollector.recordGrpcRequest('SendPaymentNotification', 'success', Date.now() - startTime);

            callback(null, {
                success: true,
                message: 'Payment notification sent successfully',
                notification_id: result.id,
                status: result.status || 'created',
                metadata: {
                    payment_id: request.payment_id,
                    amount: request.amount.toString(),
                    currency: request.currency
                }
            });

        } catch (error) {
            Logger.error('gRPC SendPaymentNotification error:', error);
            await MetricsCollector.recordGrpcRequest('SendPaymentNotification', 'error', Date.now() - startTime);
            
            callback({
                code: grpc.status.INTERNAL,
                message: error.message || 'Failed to send payment notification'
            });
        }
    }

    async sendLikeNotification(call, callback) {
        const startTime = Date.now();
        
        try {
            const request = call.request;
            
            const notificationData = {
                userId: request.user_id,
                title: 'Someone Likes You! 💖',
                message: `${request.liker_name || 'Someone'} likes your profile!`,
                type: 'like',
                priority: 'normal',
                metadata: {
                    likeId: request.like_id,
                    likerId: request.liker_id,
                    likerName: request.liker_name,
                    profilePicture: request.profile_picture,
                    category: 'social'
                },
                channels: {
                    push: true,
                    email: request.email_notifications !== false,
                    websocket: true,
                    inApp: true
                }
            };

            const result = await NotificationService.createNotification(notificationData);
            await MetricsCollector.recordGrpcRequest('SendLikeNotification', 'success', Date.now() - startTime);

            callback(null, {
                success: true,
                message: 'Like notification sent successfully',
                notification_id: result.id,
                status: result.status || 'created',
                metadata: {
                    like_id: request.like_id,
                    liker_id: request.liker_id
                }
            });

        } catch (error) {
            Logger.error('gRPC SendLikeNotification error:', error);
            await MetricsCollector.recordGrpcRequest('SendLikeNotification', 'error', Date.now() - startTime);
            
            callback({
                code: grpc.status.INTERNAL,
                message: error.message || 'Failed to send like notification'
            });
        }
    }

    async healthCheck(call, callback) {
        try {
            callback(null, {
                healthy: true,
                status: 'serving',
                version: require('../../package.json').version,
                uptime: Math.floor(process.uptime()),
                details: {
                    service: 'notification-grpc-server',
                    timestamp: new Date().toISOString()
                }
            });
        } catch (error) {
            callback({
                code: grpc.status.INTERNAL,
                message: 'Health check failed'
            });
        }
    }

    getStatus() {
        return {
            isRunning: this.isRunning,
            port: this.port,
            service: 'notification-grpc-server'
        };
    }
}

module.exports = GrpcNotificationServer;
