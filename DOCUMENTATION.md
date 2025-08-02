# Notification Microservice - Complete Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Prerequisites](#prerequisites)
4. [Installation & Setup](#installation--setup)
5. [Configuration](#configuration)
6. [API Authentication](#api-authentication)
7. [API Endpoints](#api-endpoints)
8. [WebSocket Events](#websocket-events)
9. [Database Schema](#database-schema)
10. [Services](#services)
11. [Deployment](#deployment)
12. [Monitoring & Logging](#monitoring--logging)
13. [Troubleshooting](#troubleshooting)
14. [Performance Optimization](#performance-optimization)
15. [Security](#security)

---

## Overview

The Notification Microservice is a comprehensive, production-ready Node.js application designed to handle real-time notifications for dating applications. It supports multiple notification types, real-time delivery via WebSockets, push notifications, email, SMS, and provides robust admin management capabilities.

### Key Features
- **Real-time notifications** via WebSockets
- **Multiple delivery channels**: Push notifications, Email, SMS
- **Admin management** with API key authentication
- **Analytics and metrics** collection
- **Rate limiting** and security features
- **Caching** with Redis
- **Comprehensive logging**
- **Health monitoring**
- **Swagger API documentation**

### Notification Types Supported
- Match notifications
- Like notifications
- Super like notifications
- Rizz notifications
- Connection notifications
- Message notifications
- System notifications
- Custom notifications

---

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client App    │    │   Admin Panel   │    │  External APIs  │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          │ JWT Auth             │ API Key              │
          │                      │                      │
┌─────────▼──────────────────────▼──────────────────────▼───────┐
│                    Express.js Server                          │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│  │   Routes    │ │ Middleware  │ │  Services   │            │
│  │             │ │             │ │             │            │
│  │ • API       │ │ • Auth      │ │ • Notif     │            │
│  │ • Admin     │ │ • Rate Limit│ │ • Analytics │            │
│  │ • Health    │ │ • Validation│ │ • Cache     │            │
│  └─────────────┘ └─────────────┘ └─────────────┘            │
└────────────────────────┬───────────────────────────────────┘
                         │
    ┌────────────────────┼────────────────────┐
    │                    │                    │
┌───▼────┐        ┌─────▼─────┐        ┌─────▼─────┐
│MongoDB │        │   Redis   │        │WebSocket  │
│        │        │   Cache   │        │ Clients   │
│• Notifs│        │           │        │           │
│• Users │        │• Settings │        │• Real-time│
│• Settings│      │• Sessions │        │• Events   │
└────────┘        └───────────┘        └───────────┘
```

---

## Prerequisites

### System Requirements
- **Node.js**: v16.0.0 or higher
- **MongoDB**: v4.4 or higher
- **Redis**: v6.0 or higher
- **RAM**: Minimum 2GB (4GB+ recommended)
- **Storage**: 10GB+ available space

### Development Tools
- npm or yarn package manager
- PM2 (for production deployment)
- Docker (optional, for containerization)

---

## Installation & Setup

### 1. Clone and Install
```bash
# Navigate to the project directory
cd /path/to/your/dating-project/notifications

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

### 2. Environment Configuration
Create a `.env` file with the following variables:

```env
# Server Configuration
NODE_ENV=development
PORT=3001
HOST=0.0.0.0

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/dating_notifications
MONGODB_OPTIONS={"useNewUrlParser":true,"useUnifiedTopology":true}

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# Admin API Key
ADMIN_API_KEY=admin-test-key-123

# External Services (Optional)
EMAIL_SERVICE_API_KEY=your-email-service-key
SMS_SERVICE_API_KEY=your-sms-service-key
PUSH_NOTIFICATION_KEY=your-push-notification-key

# Logging
LOG_LEVEL=info
LOG_FILE_PATH=./logs
```

### 3. Database Setup
```bash
# Start MongoDB (if not running)
brew services start mongodb-community  # macOS
sudo systemctl start mongod            # Linux

# Start Redis (if not running)
brew services start redis              # macOS
sudo systemctl start redis-server      # Linux
```

### 4. Start the Server
```bash
# Development mode
npm run dev

# Production mode
npm start

# Using PM2 (recommended for production)
pm2 start ecosystem.config.js
```

### 5. Verify Installation
```bash
# Check server health
curl http://localhost:3001/api/health

# Expected response:
{
  "success": true,
  "message": "Service is healthy",
  "data": {
    "status": "healthy",
    "uptime": "0:00:45",
    "database": "connected",
    "redis": "connected"
  }
}
```

---

## Configuration

### Server Settings
The service uses a sophisticated settings system that can be configured at runtime:

#### Core Settings Categories:
- **server**: Port, host, timeouts, clustering
- **security**: CORS, rate limiting, authentication
- **notifications**: Default types, priorities, delivery settings
- **redis**: Connection, caching, session management
- **logging**: Levels, file rotation, error handling
- **websocket**: Connection limits, heartbeat intervals
- **performance**: Memory limits, CPU thresholds

#### Managing Settings via API:
```bash
# Get all settings (Admin only)
curl -H "x-api-key: admin-test-key-123" \
     http://localhost:3001/api/admin/settings

# Update a setting
curl -X PUT \
     -H "x-api-key: admin-test-key-123" \
     -H "Content-Type: application/json" \
     -d '{"value": 5000}' \
     http://localhost:3001/api/admin/settings/server.port
```

---

## API Authentication

### 1. JWT Authentication (User Endpoints)
Used for regular API endpoints accessed by client applications.

```javascript
// Generate a test token
const jwt = require('jsonwebtoken');
const token = jwt.sign(
  { userId: 'user123', email: 'user@example.com' },
  'your-super-secret-jwt-key-change-this-in-production',
  { expiresIn: '24h' }
);

// Use in requests
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:3001/api/notifications
```

### 2. API Key Authentication (Admin Endpoints)
Used for administrative operations and system management.

```bash
# All admin endpoints require the x-api-key header
curl -H "x-api-key: admin-test-key-123" \
     http://localhost:3001/api/admin/stats
```

---

## API Endpoints

### Base URL
```
http://localhost:3001/api
```

### Swagger Documentation
Access interactive API documentation at:
```
http://localhost:3001/api-docs
```

### Core Notification Endpoints

#### 1. Create Notification
```http
POST /api/notifications
Authorization: Bearer JWT_TOKEN
Content-Type: application/json

{
  "userId": "user123",
  "type": "match",
  "title": "New Match!",
  "message": "You have a new match with Sarah",
  "priority": "normal",
  "data": {
    "matchId": "match456",
    "profileImage": "https://example.com/image.jpg"
  }
}
```

#### 2. Get User Notifications
```http
GET /api/notifications?limit=20&offset=0&type=match
Authorization: Bearer JWT_TOKEN
```

#### 3. Mark Notification as Read
```http
PUT /api/notifications/{notificationId}/read
Authorization: Bearer JWT_TOKEN
```

#### 4. Delete Notification
```http
DELETE /api/notifications/{notificationId}
Authorization: Bearer JWT_TOKEN
```

### Settings Endpoints

#### 1. Get Public Settings
```http
GET /api/settings?category=notifications
```

#### 2. Update User Preferences
```http
PUT /api/settings/preferences
Authorization: Bearer JWT_TOKEN
Content-Type: application/json

{
  "emailNotifications": true,
  "pushNotifications": true,
  "smsNotifications": false,
  "notificationTypes": {
    "matches": true,
    "likes": true,
    "messages": true
  }
}
```

### Admin Endpoints

#### 1. System Statistics
```http
GET /api/admin/stats
x-api-key: admin-test-key-123
```

#### 2. Mass Notification
```http
POST /api/admin/notifications/mass-send
x-api-key: admin-test-key-123
Content-Type: application/json

{
  "title": "System Maintenance",
  "message": "The app will be under maintenance from 2-4 AM",
  "type": "system",
  "priority": "high",
  "targetUsers": {
    "userIds": ["user1", "user2"],
    "criteria": {
      "location": "US",
      "active": true
    }
  }
}
```

#### 3. User Management
```http
GET /api/admin/users/{userId}/notifications?limit=50
x-api-key: admin-test-key-123
```

#### 4. Settings Management
```http
# Get all settings
GET /api/admin/settings
x-api-key: admin-test-key-123

# Create setting
POST /api/admin/settings
x-api-key: admin-test-key-123
Content-Type: application/json

{
  "key": "feature.newFeatureEnabled",
  "value": true,
  "category": "features",
  "description": "Enable new feature X"
}

# Update setting
PUT /api/admin/settings/feature.newFeatureEnabled
x-api-key: admin-test-key-123
Content-Type: application/json

{
  "value": false
}

# Delete setting
DELETE /api/admin/settings/feature.newFeatureEnabled
x-api-key: admin-test-key-123

# Bulk update
POST /api/admin/settings/bulk
x-api-key: admin-test-key-123
Content-Type: application/json

{
  "settings": {
    "server.maxConnections": 1000,
    "server.timeout": 30000
  }
}
```

#### 5. Cache Management
```http
POST /api/admin/cache/clear
x-api-key: admin-test-key-123
Content-Type: application/json

{
  "clearAll": true
}
```

#### 6. Notification Cleanup
```http
POST /api/admin/notifications/cleanup
x-api-key: admin-test-key-123
Content-Type: application/json

{
  "olderThanDays": 90,
  "keepRead": false,
  "dryRun": false
}
```

### Analytics Endpoints

#### 1. Get Analytics
```http
GET /api/analytics?timeRange=7d&type=match
Authorization: Bearer JWT_TOKEN
```

#### 2. Metrics
```http
GET /api/metrics?category=notifications
Authorization: Bearer JWT_TOKEN
```

### Health Endpoints

#### 1. Health Check
```http
GET /api/health
```

#### 2. Detailed Health (Admin)
```http
GET /api/admin/health
x-api-key: admin-test-key-123
```

---

## WebSocket Events

### Connection
```javascript
const socket = io('ws://localhost:3001', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

### Events

#### Client → Server
```javascript
// Join user room
socket.emit('join', { userId: 'user123' });

// Mark notification as read
socket.emit('markAsRead', { notificationId: 'notif456' });

// Request notification history
socket.emit('getHistory', { limit: 20, offset: 0 });
```

#### Server → Client
```javascript
// New notification received
socket.on('notification', (data) => {
  console.log('New notification:', data);
  // {
  //   id: 'notif789',
  //   type: 'match',
  //   title: 'New Match!',
  //   message: 'You have a new match',
  //   timestamp: '2025-08-01T18:30:00Z',
  //   data: { matchId: 'match123' }
  // }
});

// Notification status update
socket.on('notificationUpdate', (data) => {
  console.log('Notification updated:', data);
});

// Connection events
socket.on('connected', () => {
  console.log('Connected to notification service');
});

socket.on('error', (error) => {
  console.error('WebSocket error:', error);
});
```

---

## Database Schema

### Notifications Collection
```javascript
{
  _id: ObjectId,
  userId: String,           // Target user ID
  type: String,             // 'match', 'like', 'message', etc.
  title: String,            // Notification title
  message: String,          // Notification content
  priority: String,         // 'low', 'normal', 'high', 'urgent'
  isRead: Boolean,          // Read status
  data: Object,             // Additional data
  channels: {               // Delivery channels
    push: Boolean,
    email: Boolean,
    sms: Boolean,
    websocket: Boolean
  },
  delivery: {               // Delivery status
    push: { sent: Boolean, sentAt: Date, error: String },
    email: { sent: Boolean, sentAt: Date, error: String },
    sms: { sent: Boolean, sentAt: Date, error: String },
    websocket: { sent: Boolean, sentAt: Date }
  },
  metadata: {
    source: String,         // Source system
    version: Number,        // Schema version
    tags: [String]          // Custom tags
  },
  createdAt: Date,
  updatedAt: Date,
  readAt: Date,
  expiresAt: Date
}
```

### Settings Collection
```javascript
{
  _id: ObjectId,
  key: String,              // Unique setting key
  value: Mixed,             // Setting value
  type: String,             // 'string', 'number', 'boolean', 'object'
  category: String,         // Setting category
  description: String,      // Human-readable description
  isPublic: Boolean,        // Public API access
  isEditable: Boolean,      // Can be modified
  validation: {
    required: Boolean,
    min: Number,
    max: Number,
    pattern: String,
    enum: [String]
  },
  metadata: {
    createdBy: String,
    version: Number,
    lastModifiedBy: String,
    lastModifiedAt: Date,
    isDefault: Boolean
  },
  createdAt: Date,
  updatedAt: Date
}
```

### User Preferences Schema
```javascript
{
  userId: String,
  preferences: {
    emailNotifications: Boolean,
    pushNotifications: Boolean,
    smsNotifications: Boolean,
    websocketNotifications: Boolean,
    notificationTypes: {
      matches: Boolean,
      likes: Boolean,
      superLikes: Boolean,
      messages: Boolean,
      rizz: Boolean,
      connections: Boolean,
      system: Boolean
    },
    quiet_hours: {
      enabled: Boolean,
      start: String,        // "22:00"
      end: String           // "08:00"
    },
    frequency: {
      email: String,        // 'immediate', 'hourly', 'daily'
      push: String
    }
  },
  createdAt: Date,
  updatedAt: Date
}
```

---

## Services

### 1. NotificationService
Handles core notification operations.

```javascript
// Create notification
await NotificationService.create({
  userId: 'user123',
  type: 'match',
  title: 'New Match!',
  message: 'You have a new match with Sarah'
});

// Send mass notification
await NotificationService.sendMassNotification({
  title: 'System Update',
  message: 'New features available',
  targetUsers: { criteria: { active: true } }
});

// Get user notifications
const notifications = await NotificationService.getUserNotifications('user123', {
  limit: 20,
  offset: 0,
  type: 'match'
});
```

### 2. AnalyticsService
Provides metrics and analytics.

```javascript
// Get system stats
const stats = await AnalyticsService.getSystemStats();

// Get user analytics
const userAnalytics = await AnalyticsService.getUserAnalytics('user123');

// Track event
await AnalyticsService.trackEvent('notification_sent', {
  type: 'match',
  userId: 'user123'
});
```

### 3. CacheService
Redis-based caching layer.

```javascript
// Set cache
await CacheService.set('user:123:notifications', data, 300);

// Get cache
const data = await CacheService.get('user:123:notifications');

// Clear pattern
await CacheService.clearPattern('user:123:*');
```

### 4. SettingsService
Dynamic configuration management.

```javascript
// Get setting
const port = await SettingsService.get('server.port', 3001);

// Set setting
await SettingsService.set('feature.enabled', true, 'admin');

// Get user preferences
const prefs = await SettingsService.getUserPreferences('user123');
```

### 5. WebSocketService
Real-time communication.

```javascript
// Send to user
WebSocketService.sendToUser('user123', 'notification', data);

// Send to room
WebSocketService.sendToRoom('matches', 'update', data);

// Broadcast
WebSocketService.broadcast('system_announcement', data);
```

---

## Deployment

### Development
```bash
npm run dev
```

### Production with PM2
```bash
# Install PM2 globally
npm install -g pm2

# Start with ecosystem file
pm2 start ecosystem.config.js

# Monitor
pm2 monit

# Logs
pm2 logs notifications

# Restart
pm2 restart notifications

# Stop
pm2 stop notifications
```

### Docker Deployment
```dockerfile
# Dockerfile
FROM node:16-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3001

CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  notifications:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo:27017/notifications
      - REDIS_HOST=redis
    depends_on:
      - mongo
      - redis
  
  mongo:
    image: mongo:4.4
    volumes:
      - mongo_data:/data/db
  
  redis:
    image: redis:6-alpine
    volumes:
      - redis_data:/data

volumes:
  mongo_data:
  redis_data:
```

### Environment-specific Configurations

#### Staging
```env
NODE_ENV=staging
PORT=3001
MONGODB_URI=mongodb://staging-mongo:27017/notifications
REDIS_HOST=staging-redis
LOG_LEVEL=debug
```

#### Production
```env
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb://prod-mongo:27017/notifications
REDIS_HOST=prod-redis
LOG_LEVEL=info
ENABLE_CLUSTERING=true
```

---

## Monitoring & Logging

### Log Files
- `logs/current.log` - General application logs
- `logs/current-error.log` - Error logs only
- `logs/current-debug.log` - Debug information
- `logs/exceptions-YYYY-MM-DD.log` - Uncaught exceptions
- `logs/rejections-YYYY-MM-DD.log` - Unhandled promise rejections

### Log Levels
- **error**: Critical errors requiring immediate attention
- **warn**: Warning conditions
- **info**: General information
- **debug**: Debug information

### Monitoring Endpoints

#### Health Check
```bash
curl http://localhost:3001/api/health
```

#### System Metrics
```bash
curl -H "x-api-key: admin-test-key-123" \
     http://localhost:3001/api/admin/stats
```

#### Live Logs
```bash
curl -H "x-api-key: admin-test-key-123" \
     "http://localhost:3001/api/admin/logs?level=error&limit=100"
```

### Performance Monitoring
```javascript
// Built-in metrics collection
{
  "system": {
    "uptime": "2:30:45",
    "memory": {
      "used": "145MB",
      "free": "1.8GB",
      "total": "2GB"
    },
    "cpu": {
      "usage": "15%",
      "load": [0.5, 0.3, 0.2]
    }
  },
  "database": {
    "status": "connected",
    "connections": 5,
    "responseTime": "12ms"
  },
  "redis": {
    "status": "connected",
    "memory": "50MB",
    "keys": 1250
  },
  "notifications": {
    "total": 45230,
    "today": 1250,
    "pending": 15,
    "failed": 3
  }
}
```

---

## Troubleshooting

### Common Issues

#### 1. Server Won't Start
```bash
# Check if port is already in use
lsof -i :3001

# Check MongoDB connection
mongo mongodb://localhost:27017/dating_notifications

# Check Redis connection
redis-cli ping
```

#### 2. Database Connection Issues
```bash
# MongoDB not running
brew services start mongodb-community  # macOS
sudo systemctl start mongod            # Linux

# Check MongoDB logs
tail -f /usr/local/var/log/mongodb/mongo.log  # macOS
tail -f /var/log/mongodb/mongod.log           # Linux
```

#### 3. Redis Connection Issues
```bash
# Redis not running
brew services start redis              # macOS
sudo systemctl start redis-server      # Linux

# Test Redis
redis-cli ping
# Expected: PONG
```

#### 4. WebSocket Connection Issues
- Check CORS settings
- Verify JWT token format
- Ensure firewall allows WebSocket connections
- Check browser console for connection errors

#### 5. High Memory Usage
```bash
# Check memory usage
pm2 monit

# Restart if needed
pm2 restart notifications

# Check for memory leaks
node --inspect server.js
```

### Debug Mode
```bash
# Enable debug logging
DEBUG=notification:* npm run dev

# Or set in environment
NODE_ENV=development LOG_LEVEL=debug npm start
```

### Error Codes

| Code | Meaning | Solution |
|------|---------|----------|
| 400 | Bad Request | Check request format and required fields |
| 401 | Unauthorized | Verify JWT token or API key |
| 403 | Forbidden | Check user permissions |
| 404 | Not Found | Verify endpoint URL and resource ID |
| 429 | Rate Limited | Reduce request frequency |
| 500 | Server Error | Check logs for detailed error message |

---

## Performance Optimization

### Caching Strategy
- **Redis**: User preferences, settings, frequent queries
- **Memory**: In-process caching for hot data
- **TTL**: Configurable cache expiration times

### Database Optimization
```javascript
// Indexes for performance
db.notifications.createIndex({ userId: 1, createdAt: -1 });
db.notifications.createIndex({ type: 1, createdAt: -1 });
db.notifications.createIndex({ isRead: 1, userId: 1 });
db.settings.createIndex({ key: 1 }, { unique: true });
db.settings.createIndex({ category: 1 });
```

### Rate Limiting
```javascript
// Default rate limits
{
  "general": "100 requests per 15 minutes",
  "admin": "1000 requests per 15 minutes",
  "websocket": "50 connections per IP"
}
```

### Memory Management
- Automatic garbage collection
- Memory leak detection
- Connection pooling
- Process clustering support

### Scaling Recommendations
1. **Horizontal Scaling**: Deploy multiple instances behind load balancer
2. **Database Sharding**: Shard by userId for large datasets
3. **Redis Clustering**: Use Redis cluster for high availability
4. **CDN**: Serve static assets via CDN
5. **Message Queues**: Use Redis/RabbitMQ for async processing

---

## Security

### Authentication & Authorization
- **JWT tokens** for user authentication
- **API keys** for admin operations
- **Role-based access control**
- **Token expiration** and refresh

### Security Headers
```javascript
// Implemented security headers
{
  "helmet": "Content security, XSS protection",
  "cors": "Cross-origin resource sharing",
  "compression": "Response compression",
  "rateLimit": "Request rate limiting"
}
```

### Data Protection
- **Input validation** on all endpoints
- **SQL injection** prevention (NoSQL injection)
- **XSS protection** via helmet
- **CSRF protection** for state-changing operations

### Best Practices
1. **Regular security updates**: Keep dependencies updated
2. **Environment variables**: Never commit secrets
3. **HTTPS only**: Use HTTPS in production
4. **Audit logs**: Log all admin operations
5. **Backup encryption**: Encrypt database backups

### Security Configuration
```env
# Security settings
ENABLE_HTTPS=true
CORS_ORIGIN=https://yourdomain.com
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=900000
JWT_SECRET=your-very-long-random-secret-key-here
SESSION_SECRET=another-very-long-random-secret
```

---

## API Testing Examples

### Complete Test Suite

#### Test User Notifications Flow
```bash
#!/bin/bash

# 1. Create a test JWT token
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# 2. Create notification
curl -X POST http://localhost:3001/api/notifications \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "testuser123",
    "type": "match",
    "title": "Test Match",
    "message": "You have a test match!"
  }'

# 3. Get notifications
curl -H "Authorization: Bearer $TOKEN" \
     "http://localhost:3001/api/notifications?limit=10"

# 4. Mark as read
NOTIF_ID="notification_id_here"
curl -X PUT http://localhost:3001/api/notifications/$NOTIF_ID/read \
  -H "Authorization: Bearer $TOKEN"

# 5. Delete notification
curl -X DELETE http://localhost:3001/api/notifications/$NOTIF_ID \
  -H "Authorization: Bearer $TOKEN"
```

#### Test Admin Operations
```bash
#!/bin/bash

API_KEY="admin-test-key-123"

# 1. Get system stats
curl -H "x-api-key: $API_KEY" \
     http://localhost:3001/api/admin/stats

# 2. Send mass notification
curl -X POST http://localhost:3001/api/admin/notifications/mass-send \
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "System Maintenance",
    "message": "Scheduled maintenance tonight",
    "type": "system",
    "targetUsers": {
      "criteria": {"active": true}
    }
  }'

# 3. Manage settings
curl -X POST http://localhost:3001/api/admin/settings \
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "test.setting",
    "value": "test_value",
    "category": "testing"
  }'

# 4. Clear cache
curl -X POST http://localhost:3001/api/admin/cache/clear \
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"clearAll": true}'
```

---

## Support & Maintenance

### Regular Maintenance Tasks
1. **Daily**: Check error logs, monitor performance
2. **Weekly**: Database cleanup, cache optimization
3. **Monthly**: Security updates, dependency updates
4. **Quarterly**: Performance review, capacity planning

### Backup Strategy
```bash
# MongoDB backup
mongodump --uri="mongodb://localhost:27017/dating_notifications" --out backup/

# Redis backup
redis-cli --rdb backup/redis-backup.rdb

# Log rotation
logrotate /etc/logrotate.d/notification-service
```

### Update Process
```bash
# 1. Backup current version
pm2 save

# 2. Update dependencies
npm update

# 3. Run tests
npm test

# 4. Deploy with zero downtime
pm2 reload notifications
```

---

This documentation provides comprehensive coverage of your notification microservice. It includes everything from basic setup to advanced configuration, troubleshooting, and maintenance procedures. The documentation is structured to serve both developers implementing the service and administrators managing it in production.

For any specific questions or additional details needed, refer to the inline code documentation or the Swagger API docs at `/api-docs`.
