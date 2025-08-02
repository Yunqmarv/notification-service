# Notification Microservice

A highly scalable, enterprise-grade notification microservice built with Node.js, MongoDB, and Redis. This service provides comprehensive notification management with real-time delivery, analytics, caching, and robust monitoring capabilities.

## 🚀 Features

### Core Features
- **Multi-channel Notifications**: Push, Email, SMS, WebSocket
- **Real-time Delivery**: WebSocket integration for instant notifications
- **Advanced Caching**: Redis-based caching with intelligent cache invalidation
- **Comprehensive Analytics**: Detailed metrics, performance monitoring, and reporting
- **Scalable Architecture**: Cluster support, horizontal scaling ready
- **Robust Settings Management**: Database-driven configuration
- **Rate Limiting**: Intelligent rate limiting to prevent abuse
- **Mass Notifications**: Bulk notification sending capabilities
- **Scheduling**: Support for delayed and scheduled notifications

### Enterprise Features
- **Health Monitoring**: Comprehensive health checks and system monitoring
- **Metrics Collection**: Real-time performance and usage metrics
- **Admin Dashboard APIs**: Full administrative control and monitoring
- **Security**: Helmet.js protection, CORS configuration, input validation
- **Error Handling**: Comprehensive error tracking and logging
- **Graceful Shutdown**: Safe service termination
- **Job Scheduling**: Background task processing

## 📋 Prerequisites

- Node.js 16.x or higher
- MongoDB 4.4+ (Atlas or self-hosted)
- Redis 6.x or higher
- PM2 (recommended for production)

## 🛠 Installation

1. **Clone and Navigate**
```bash
cd notifications
```

2. **Install Dependencies**
```bash
npm install
```

3. **Environment Configuration**
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
# MongoDB Connection (Only required ENV variable)
MONGODB_URI=mongodb+srv://yunqmarv:yunqmarv@notifications.3wayhnm.mongodb.net/?retryWrites=true&w=majority&appName=notifications

# Server Configuration
PORT=3000
NODE_ENV=production

# Redis Configuration (Optional - will use settings from DB)
REDIS_HOST=redis-14594.c8.us-east-1-4.ec2.redns.redis-cloud.com
REDIS_PORT=14594
REDIS_USERNAME=default
REDIS_PASSWORD=MUCyQ3fj5taB2VYafGKzBNQlqWlfPqks

# Security
JWT_SECRET=your-super-secure-jwt-secret
ADMIN_SECRET=your-admin-secret

# External Services (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

4. **Start the Service**
```bash
# Development
npm run dev

# Production
npm start

# With PM2 (Recommended for production)
npm run start:pm2
```

## 🔧 Configuration

All configuration is stored in MongoDB except the database connection string. The service automatically creates default settings on first run.

### Default Settings Categories

**Notifications**
- `notifications.defaultTTL`: 2592000 (30 days)
- `notifications.maxPerUser`: 1000
- `notifications.enablePush`: true
- `notifications.enableEmail`: false
- `notifications.enableSMS`: false

**Redis Cache**
- `cache.defaultTTL`: 3600 (1 hour)
- `cache.maxRetries`: 3
- `cache.retryDelay`: 1000

**Rate Limiting**
- `rateLimit.windowMs`: 900000 (15 minutes)
- `rateLimit.maxRequests`: 100

**Server**
- `server.maxRequestSize`: "10mb"
- `server.enableClustering`: true

## 📡 API Endpoints

### Authentication
All API endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Core Notification Endpoints

#### Get Notifications
```http
GET /api/notifications
Query Parameters:
- type: Filter by notification type
- read: Filter by read status (true/false)
- status: Filter by status (pending, sent, delivered, read, failed)
- priority: Filter by priority (low, normal, high, urgent)
- limit: Number of results (1-100, default: 20)
- offset: Pagination offset (default: 0)
- sort: Sort field (createdAt, updatedAt, priority, type)
- order: Sort order (asc, desc, default: desc)
```

#### Create Notification
```http
POST /api/notifications
Content-Type: application/json

{
  "title": "New Match!",
  "message": "You have a new match with Sarah",
  "type": "match",
  "priority": "high",
  "metadata": {
    "matchUserId": "user123",
    "matchName": "Sarah"
  },
  "channels": {
    "push": { "enabled": true },
    "email": { "enabled": false }
  }
}
```

#### Get Specific Notification
```http
GET /api/notifications/{id}
```

#### Mark as Read/Unread
```http
PATCH /api/notifications/{id}/read
Content-Type: application/json

{
  "read": true
}
```

#### Mark All as Read
```http
PATCH /api/notifications/mark-all-read
Content-Type: application/json

{
  "type": "message" // Optional: only mark specific type as read
}
```

#### Delete Notification
```http
DELETE /api/notifications/{id}
```

#### Get Unread Count
```http
GET /api/notifications/unread-count?type=message
```

#### Get Grouped Notifications
```http
GET /api/notifications/grouped?includeRead=false&limit=10
```

#### Get Notifications by Type
```http
GET /api/notifications/types/message?read=false&limit=50&offset=0
```

### Settings Management

#### Get All Settings
```http
GET /api/settings?category=notifications&publicOnly=true
```

#### Get Specific Setting
```http
GET /api/settings/notifications.defaultTTL
```

#### Create/Update Setting (Admin Only)
```http
POST /api/settings
Content-Type: application/json

{
  "key": "notifications.customSetting",
  "value": "customValue",
  "description": "Custom notification setting",
  "category": "notifications",
  "isPublic": false
}
```

#### Update Setting (Admin Only)
```http
PUT /api/settings/notifications.defaultTTL
Content-Type: application/json

{
  "value": 1800,
  "description": "Updated TTL for notifications"
}
```

#### Bulk Update Settings (Admin Only)
```http
POST /api/settings/bulk
Content-Type: application/json

{
  "settings": {
    "notifications.enablePush": true,
    "notifications.enableEmail": false
  },
  "category": "notifications"
}
```

### Analytics & Monitoring

#### Analytics Overview
```http
GET /api/analytics/overview?timeRange=24h&userId=user123
```

#### Notification Trends
```http
GET /api/analytics/notifications/trends?timeRange=7d&groupBy=day&type=message
```

#### Delivery Statistics
```http
GET /api/analytics/delivery/stats?timeRange=24h&channel=push
```

#### User Engagement
```http
GET /api/analytics/user/engagement?timeRange=7d
```

#### Performance Metrics (Admin Only)
```http
GET /api/analytics/performance?timeRange=1h
```

#### Export Analytics (Admin Only)
```http
GET /api/analytics/export?format=json&timeRange=7d&includeUserData=false
```

### Admin Endpoints

#### System Statistics
```http
GET /api/admin/stats
```

#### Send Mass Notification
```http
POST /api/admin/notifications/mass-send
Content-Type: application/json

{
  "title": "System Maintenance",
  "message": "The system will undergo maintenance tonight",
  "type": "system",
  "priority": "high",
  "targetUsers": {
    "userIds": ["user1", "user2", "user3"]
  },
  "scheduling": {
    "sendAt": "2025-07-31T20:00:00Z"
  }
}
```

#### Get User Notifications (Admin Only)
```http
GET /api/admin/users/{userId}/notifications?limit=50&offset=0
```

#### Force Resend Notification
```http
POST /api/admin/notifications/{notificationId}/force-send
```

#### Clear Cache
```http
POST /api/admin/cache/clear
Content-Type: application/json

{
  "pattern": "notifications:*",
  "clearAll": false
}
```

#### System Health
```http
GET /api/admin/health
```

#### Cleanup Old Notifications
```http
POST /api/admin/notifications/cleanup
Content-Type: application/json

{
  "olderThanDays": 90,
  "keepRead": false,
  "dryRun": true
}
```

#### Get System Logs
```http
GET /api/admin/logs?level=error&limit=100&offset=0
```

### Health & Metrics

#### Health Check
```http
GET /health
```

#### Detailed Health
```http
GET /health/detailed
```

#### Metrics
```http
GET /metrics
```

#### Prometheus Metrics
```http
GET /metrics/prometheus
```

## 🔔 Notification Types

The service supports the following notification types:

- `message` - Direct messages between users
- `match` - New matches found
- `like` - User likes/reactions
- `superlike` - Premium likes
- `rizz` - Special interaction type
- `connection` - New connections made
- `system` - System notifications
- `promotional` - Marketing notifications
- `reminder` - Reminder notifications
- `update` - App updates
- `alert` - Important alerts
- `warning` - Warning messages
- `error` - Error notifications
- `success` - Success confirmations
- `info` - Informational messages
- `achievement` - User achievements
- `event` - Event notifications
- `social` - Social activity
- `payment` - Payment-related
- `security` - Security alerts
- `maintenance` - Maintenance notices

## ⚡ Performance Features

### Caching Strategy
- **Redis-based caching** with intelligent invalidation
- **Multi-level caching** for different data types
- **Cache warming** for frequently accessed data
- **Cache statistics** and monitoring

### Rate Limiting
- **User-based rate limiting** to prevent abuse
- **IP-based rate limiting** for additional security
- **Custom rate limits** for different endpoints
- **Rate limit analytics** and monitoring

### Clustering
- **Multi-process clustering** for improved performance
- **Load balancing** across worker processes
- **Graceful worker management** and restart
- **Cluster health monitoring**

## 📊 Monitoring & Analytics

### Metrics Collection
- **Real-time performance metrics**
- **Usage analytics and patterns**
- **Error tracking and alerting**
- **Cache performance monitoring**
- **Database query performance**

### Health Monitoring
- **System health checks**
- **Service dependency monitoring**
- **Resource usage tracking**
- **Automated health reporting**

### Analytics Features
- **User engagement tracking**
- **Notification delivery analytics**
- **Performance trend analysis**
- **Custom report generation**
- **Data export capabilities**

## 🔐 Security Features

### Authentication & Authorization
- **JWT-based authentication**
- **Role-based access control**
- **Admin permission system**
- **API key management**

### Data Protection
- **Input validation and sanitization**
- **SQL injection prevention**
- **XSS protection**
- **CSRF protection**
- **Helmet.js security headers**

### Rate Limiting & Abuse Prevention
- **Intelligent rate limiting**
- **IP-based restrictions**
- **Request pattern analysis**
- **Abuse detection and prevention**

## 🚀 Production Deployment

### Using PM2 (Recommended)
```bash
# Install PM2 globally
npm install -g pm2

# Start with PM2
npm run start:pm2

# Monitor
pm2 monit

# View logs
pm2 logs notification-service

# Restart
pm2 restart notification-service

# Stop
pm2 stop notification-service
```

### Using Docker
```bash
# Build image
docker build -t notification-service .

# Run container
docker run -d \
  --name notification-service \
  -p 3000:3000 \
  --env-file .env \
  notification-service
```

### Environment-specific Configurations

#### Development
- Detailed logging and debugging
- Hot reloading enabled
- Development-friendly error messages
- Test email service (Ethereal)

#### Production
- Optimized performance settings
- Security hardening enabled
- Production logging configuration
- Real email service integration
- Clustering enabled
- Health monitoring active

## 📝 API Documentation

The service includes comprehensive API documentation available at:
- **Swagger UI**: `http://localhost:3000/api-docs`
- **JSON Schema**: `http://localhost:3000/api-docs.json`

## 🔧 WebSocket Integration

The service provides WebSocket URL endpoints for real-time notifications:

```javascript
// Get WebSocket URL
const response = await fetch('/api/notifications/websocket-url', {
  headers: { 'Authorization': 'Bearer ' + token }
});
const { websocketUrl } = await response.json();

// Connect to WebSocket
const ws = new WebSocket(websocketUrl);
ws.onmessage = (event) => {
  const notification = JSON.parse(event.data);
  // Handle real-time notification
};
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run integration tests
npm run test:integration

# Run load tests
npm run test:load
```

## 📈 Scaling Considerations

### Horizontal Scaling
- **Load balancer** distribution across multiple instances
- **Database clustering** for improved performance
- **Redis clustering** for cache scalability
- **Message queue integration** for async processing

### Vertical Scaling
- **Memory optimization** for large datasets
- **CPU optimization** for high throughput
- **Database indexing** for query performance
- **Connection pooling** for resource efficiency

## 🔍 Troubleshooting

### Common Issues

#### Connection Issues
```bash
# Check MongoDB connection
npm run test:db

# Check Redis connection
npm run test:redis

# Check all health endpoints
curl http://localhost:3000/health/detailed
```

#### Performance Issues
```bash
# Monitor metrics
curl http://localhost:3000/metrics

# Check system stats
curl http://localhost:3000/api/admin/stats
```

#### Cache Issues
```bash
# Clear cache
curl -X POST http://localhost:3000/api/admin/cache/clear \
  -H "Content-Type: application/json" \
  -d '{"clearAll": true}'
```

### Logs and Monitoring
- **Application logs**: Available via `/api/admin/logs`
- **System metrics**: Available via `/metrics`
- **Health status**: Available via `/health`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

---

## 🎯 Quick Start Example

Here's a complete example of using the notification service:

```javascript
// 1. Create a notification
const notification = await fetch('/api/notifications', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({
    title: 'Welcome!',
    message: 'Thanks for joining our platform',
    type: 'welcome',
    priority: 'normal'
  })
});

// 2. Get user notifications
const notifications = await fetch('/api/notifications?limit=10', {
  headers: { 'Authorization': 'Bearer ' + token }
});

// 3. Mark as read
await fetch(`/api/notifications/${notificationId}/read`, {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({ read: true })
});

// 4. Get analytics
const analytics = await fetch('/api/analytics/overview?timeRange=24h', {
  headers: { 'Authorization': 'Bearer ' + token }
});
```

This notification microservice provides everything you need for a robust, scalable notification system with comprehensive analytics, monitoring, and management capabilities. The service is designed to handle high-volume notifications while maintaining performance and reliability.
# notification-service
