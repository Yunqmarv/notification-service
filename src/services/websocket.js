const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const Logger = require('../utils/logger');

class WebSocketService {
    constructor() {
        this.wss = null;
        this.clients = new Map(); // userId -> websocket connection
        this.isInitialized = false;
    }

    async initialize(server) {
        try {
            Logger.info('🔌 Initializing WebSocket Service...');

            this.wss = new WebSocket.Server({ 
                server,
                path: '/notifications/ws'
            });

            this.wss.on('connection', this.handleConnection.bind(this));
            this.isInitialized = true;

            Logger.info('✅ WebSocket Service initialized successfully');
        } catch (error) {
            Logger.error('❌ Failed to initialize WebSocket Service:', error);
            throw error;
        }
    }

    async handleConnection(ws, request) {
        try {
            Logger.info('🔌 New WebSocket connection attempt');

            // Extract token from query parameters or headers
            const url = new URL(request.url, `http://${request.headers.host}`);
            const token = url.searchParams.get('token') || request.headers.authorization?.replace('Bearer ', '');

            if (!token) {
                ws.close(1008, 'Authentication required');
                return;
            }

            // Verify JWT token
            const settingsService = require('./settings');
            const jwtSettings = await settingsService.get('jwt');
            const decoded = jwt.verify(token, jwtSettings.secret);
            const userId = decoded.userId || decoded.user_id || decoded.id;

            if (!userId) {
                ws.close(1008, 'Invalid token');
                return;
            }

            // Store connection
            this.clients.set(userId, ws);
            
            ws.userId = userId;
            ws.isAlive = true;

            // Set up heartbeat
            ws.on('pong', () => {
                ws.isAlive = true;
            });

            ws.on('message', (data) => {
                this.handleMessage(ws, data);
            });

            ws.on('close', () => {
                this.clients.delete(userId);
                Logger.info('🔌 WebSocket connection closed', { userId });
            });

            ws.on('error', (error) => {
                Logger.error('🔌 WebSocket error:', error, { userId });
                this.clients.delete(userId);
            });

            // Send welcome message
            this.sendToUser(userId, {
                type: 'connected',
                message: 'Connected to notification stream',
                timestamp: new Date().toISOString()
            });

            Logger.info('🔌 WebSocket connection established', { userId });

        } catch (error) {
            Logger.error('🔌 WebSocket authentication failed:', error);
            ws.close(1008, 'Authentication failed');
        }
    }

    handleMessage(ws, data) {
        try {
            const message = JSON.parse(data);
            Logger.info('🔌 WebSocket message received', { 
                userId: ws.userId, 
                type: message.type 
            });

            switch (message.type) {
                case 'ping':
                    this.sendToUser(ws.userId, { type: 'pong', timestamp: new Date().toISOString() });
                    break;
                case 'mark_read':
                    this.handleMarkRead(ws.userId, message.notificationId);
                    break;
                default:
                    Logger.warn('🔌 Unknown message type:', message.type);
            }
        } catch (error) {
            Logger.error('🔌 Error handling WebSocket message:', error);
        }
    }

    async handleMarkRead(userId, notificationId) {
        try {
            const notificationService = require('./notification');
            await notificationService.markAsRead(notificationId, userId);
            
            this.sendToUser(userId, {
                type: 'notification_marked_read',
                notificationId,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            Logger.error('🔌 Error marking notification as read:', error);
        }
    }

    sendToUser(userId, data) {
        const ws = this.clients.get(userId);
        if (ws && ws.readyState === WebSocket.OPEN) {
            try {
                ws.send(JSON.stringify(data));
                Logger.debug('🔌 Message sent to user', { userId, type: data.type });
                return true;
            } catch (error) {
                Logger.error('🔌 Error sending message to user:', error, { userId });
                this.clients.delete(userId);
                return false;
            }
        }
        return false;
    }

    sendToMultipleUsers(userIds, data) {
        const results = userIds.map(userId => ({
            userId,
            sent: this.sendToUser(userId, data)
        }));

        Logger.info('🔌 Broadcast message sent', {
            total: userIds.length,
            successful: results.filter(r => r.sent).length,
            type: data.type
        });

        return results;
    }

    broadcastToAll(data) {
        const userIds = Array.from(this.clients.keys());
        return this.sendToMultipleUsers(userIds, data);
    }

    getConnectedUsers() {
        return Array.from(this.clients.keys());
    }

    isUserConnected(userId) {
        return this.clients.has(userId);
    }

    getConnectionCount() {
        return this.clients.size;
    }

    // Heartbeat to keep connections alive
    startHeartbeat() {
        setInterval(() => {
            this.clients.forEach((ws, userId) => {
                if (!ws.isAlive) {
                    Logger.info('🔌 Terminating inactive WebSocket connection', { userId });
                    this.clients.delete(userId);
                    return ws.terminate();
                }

                ws.isAlive = false;
                ws.ping();
            });
        }, 30000); // 30 seconds
    }

    async healthCheck() {
        return {
            status: this.isInitialized ? 'healthy' : 'unhealthy',
            connections: this.getConnectionCount(),
            connectedUsers: this.getConnectedUsers().length
        };
    }

    // Graceful shutdown
    async close() {
        if (this.wss) {
            Logger.info('🔌 Closing WebSocket server...');
            
            // Close all client connections
            this.clients.forEach((ws) => {
                ws.close(1001, 'Server shutting down');
            });
            
            this.clients.clear();
            
            // Close the server
            this.wss.close();
            this.isInitialized = false;
            
            Logger.info('🔌 WebSocket server closed');
        }
    }
}

module.exports = new WebSocketService();
