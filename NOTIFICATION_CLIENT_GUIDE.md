# Notification Client Usage Guide

This guide explains how to use the `NotificationClient` across your microservices to create notifications.

## Installation

Copy the `notificationClient.js` file to your microservice and install the required dependency:

```bash
npm install axios
```

## Setup

### Basic Setup

```javascript
const NotificationClient = require('./path/to/notificationClient');

// Initialize with default configuration
const notificationClient = new NotificationClient({
    serviceName: 'your-service-name',
    debug: true // Enable for development
});
```

### Advanced Setup

```javascript
const NotificationClient = require('./path/to/notificationClient');

const notificationClient = new NotificationClient({
    baseURL: 'http://notifications-service:3001',
    apiKey: process.env.SYSTEM_API_KEY,
    timeout: 30000,
    retries: 3,
    retryDelay: 1000,
    serviceName: 'matching-service',
    debug: process.env.NODE_ENV === 'development'
});
```

## Environment Variables

Set these environment variables in your microservice:

```bash
# Notification service configuration
NOTIFICATION_SERVICE_URL=http://localhost:3001
SYSTEM_API_KEY=319f4d26e31c1a4c0b44e2a8dff8b2e8c83136557af36f9260c75ea3ca9164e8

# Email service configuration (for email notifications)
EMAIL_SERVICE_URL=http://localhost:3001
EMAIL_API_KEY=dating-app-email-service-2025-secure-keyeniola-
```

## Usage Examples

### 1. Match Service Integration

```javascript
// matchingService.js
const NotificationClient = require('./clients/notificationClient');

class MatchingService {
    constructor() {
        this.notificationClient = new NotificationClient({
            serviceName: 'matching-service',
            debug: true
        });
    }

    async createMatch(user1Id, user2Id, matchData) {
        try {
            // Your matching logic here
            const match = await this.saveMatch(user1Id, user2Id, matchData);

            // Send notifications to both users
            await Promise.all([
                this.notificationClient.sendMatchNotification(user1Id, {
                    matchId: match.id,
                    partnerId: user2Id,
                    name: matchData.user2Name,
                    profilePicture: matchData.user2ProfilePicture,
                    emailNotifications: matchData.user1EmailEnabled
                }),
                this.notificationClient.sendMatchNotification(user2Id, {
                    matchId: match.id,
                    partnerId: user1Id,
                    name: matchData.user1Name,
                    profilePicture: matchData.user1ProfilePicture,
                    emailNotifications: matchData.user2EmailEnabled
                })
            ]);

            return match;
        } catch (error) {
            console.error('Failed to create match notifications:', error);
            // Don't fail the match creation if notifications fail
        }
    }
}
```

### 2. Messaging Service Integration

```javascript
// messagingService.js
const NotificationClient = require('./clients/notificationClient');

class MessagingService {
    constructor() {
        this.notificationClient = new NotificationClient({
            serviceName: 'messaging-service'
        });
    }

    async sendMessage(senderId, recipientId, messageData) {
        try {
            // Save message to database
            const message = await this.saveMessage(senderId, recipientId, messageData);

            // Get sender information
            const sender = await this.getUserInfo(senderId);

            // Send notification to recipient
            await this.notificationClient.sendMessageNotification(recipientId, {
                messageId: message.id,
                senderId: senderId,
                senderName: sender.name,
                conversationId: message.conversationId,
                preview: messageData.text.substring(0, 100),
                emailNotifications: await this.getUserEmailPreference(recipientId)
            });

            return message;
        } catch (error) {
            console.error('Failed to send message notification:', error);
        }
    }
}
```

### 3. Payment Service Integration

```javascript
// paymentService.js
const NotificationClient = require('./clients/notificationClient');

class PaymentService {
    constructor() {
        this.notificationClient = new NotificationClient({
            serviceName: 'payment-service'
        });
    }

    async processPayment(userId, paymentData) {
        try {
            const result = await this.chargePayment(paymentData);

            // Send payment notification
            await this.notificationClient.sendPaymentNotification(userId, {
                paymentId: result.paymentId,
                amount: paymentData.amount,
                currency: paymentData.currency,
                success: result.success,
                message: result.success ? 
                    `Payment of ${paymentData.amount} ${paymentData.currency} was successful.` :
                    `Payment failed: ${result.error}`
            });

            return result;
        } catch (error) {
            // Send failure notification
            await this.notificationClient.sendPaymentNotification(userId, {
                paymentId: null,
                amount: paymentData.amount,
                currency: paymentData.currency,
                success: false,
                message: `Payment processing failed: ${error.message}`
            });
            
            throw error;
        }
    }
}
```

### 4. User Service Integration

```javascript
// userService.js
const NotificationClient = require('./clients/notificationClient');

class UserService {
    constructor() {
        this.notificationClient = new NotificationClient({
            serviceName: 'user-service'
        });
    }

    async onUserRegistration(userId, userData) {
        // Send welcome notification
        await this.notificationClient.sendSystemNotification(userId, {
            title: 'Welcome to Your Dating App! 🎉',
            message: 'Welcome! Your profile is now active and ready to connect with amazing people.',
            category: 'onboarding',
            priority: 'high',
            push: true,
            email: true
        });
    }

    async onProfileUpdate(userId, changes) {
        // Send profile update confirmation
        await this.notificationClient.sendSystemNotification(userId, {
            title: 'Profile Updated ✅',
            message: 'Your profile has been successfully updated.',
            category: 'profile',
            priority: 'normal',
            push: true,
            email: false
        });
    }

    async onSecurityEvent(userId, eventData) {
        // Send security alert
        await this.notificationClient.sendSecurityNotification(userId, {
            title: 'Security Alert 🔒',
            message: `New login detected from ${eventData.location}`,
            eventType: 'login',
            ipAddress: eventData.ipAddress,
            location: eventData.location,
            timestamp: new Date().toISOString()
        });
    }
}
```

### 5. Like Service Integration

```javascript
// likeService.js
const NotificationClient = require('./clients/notificationClient');

class LikeService {
    constructor() {
        this.notificationClient = new NotificationClient({
            serviceName: 'like-service'
        });
    }

    async createLike(likerId, likedUserId, likeData) {
        try {
            const like = await this.saveLike(likerId, likedUserId, likeData);
            
            // Get liker information
            const liker = await this.getUserInfo(likerId);

            // Send notification to the liked user
            await this.notificationClient.sendLikeNotification(likedUserId, {
                likeId: like.id,
                likerId: likerId,
                name: liker.name,
                profilePicture: liker.profilePicture,
                emailNotifications: await this.getUserEmailPreference(likedUserId)
            });

            return like;
        } catch (error) {
            console.error('Failed to send like notification:', error);
        }
    }
}
```

## Advanced Usage

### Bulk Notifications

```javascript
// Send notifications to multiple users
const notifications = users.map(user => ({
    userId: user.id,
    title: 'Special Event! 🎉',
    message: 'Join our special dating event this weekend!',
    type: 'promotional',
    priority: 'normal',
    metadata: {
        eventId: 'event-123',
        category: 'events'
    },
    channels: {
        push: true,
        email: user.emailNotifications,
        websocket: true,
        inApp: true
    }
}));

const results = await notificationClient.createBulkNotifications(notifications);
console.log(`Sent ${results.successful.length}/${results.total} notifications`);
```

### Custom Notifications

```javascript
// Create a custom notification
await notificationClient.createNotification({
    userId: 'user-123',
    title: 'Custom Notification',
    message: 'This is a custom notification with specific settings.',
    type: 'custom',
    priority: 'high',
    metadata: {
        customField: 'customValue',
        source: 'my-service'
    },
    channels: {
        push: true,
        email: true,
        websocket: true,
        inApp: true
    },
    scheduling: {
        immediate: true,
        deliveryTime: new Date().toISOString()
    }
});
```

### Error Handling

```javascript
try {
    const result = await notificationClient.sendMatchNotification(userId, matchData);
    console.log('Notification sent:', result.notification.id);
} catch (error) {
    console.error('Notification failed:', error.message);
    
    // Log to your monitoring system
    logger.error('Notification service error', {
        userId,
        error: error.message,
        service: 'matching-service'
    });
    
    // Continue with your business logic
    // Don't let notification failures break your main flow
}
```

### Health Monitoring

```javascript
// Check notification service health
const health = await notificationClient.checkHealth();
if (!health.healthy) {
    console.warn('Notification service is down:', health.error);
    // Implement fallback behavior or circuit breaker
}
```

## Best Practices

### 1. Service Configuration

```javascript
// config/notification.js
module.exports = {
    notification: {
        baseURL: process.env.NOTIFICATION_SERVICE_URL,
        apiKey: process.env.SYSTEM_API_KEY,
        timeout: 30000,
        retries: 3,
        serviceName: process.env.SERVICE_NAME,
        debug: process.env.NODE_ENV === 'development'
    }
};
```

### 2. Error Handling Middleware

```javascript
// middleware/notificationMiddleware.js
class NotificationMiddleware {
    static async safeNotify(notificationFn) {
        try {
            return await notificationFn();
        } catch (error) {
            console.error('Notification error:', error.message);
            // Don't throw - notifications should not break business logic
            return null;
        }
    }
}

// Usage
await NotificationMiddleware.safeNotify(() => 
    notificationClient.sendMatchNotification(userId, matchData)
);
```

### 3. Circuit Breaker Pattern

```javascript
// utils/circuitBreaker.js
class NotificationCircuitBreaker {
    constructor() {
        this.failures = 0;
        this.nextAttempt = Date.now();
        this.timeout = 60000; // 1 minute
        this.threshold = 5;
    }

    async execute(notificationFn) {
        if (this.failures >= this.threshold && Date.now() < this.nextAttempt) {
            console.warn('Notification service circuit breaker is open');
            return null;
        }

        try {
            const result = await notificationFn();
            this.failures = 0; // Reset on success
            return result;
        } catch (error) {
            this.failures++;
            if (this.failures >= this.threshold) {
                this.nextAttempt = Date.now() + this.timeout;
                console.warn('Notification service circuit breaker opened');
            }
            throw error;
        }
    }
}
```

## Testing

### Unit Tests

```javascript
// tests/notificationClient.test.js
const NotificationClient = require('../clients/notificationClient');

describe('NotificationClient', () => {
    let client;

    beforeEach(() => {
        client = new NotificationClient({
            baseURL: 'http://mock-notification-service',
            apiKey: 'test-key',
            serviceName: 'test-service'
        });
    });

    it('should send match notification', async () => {
        // Mock the HTTP client
        client.client.post = jest.fn().mockResolvedValue({
            data: { success: true, data: { id: 'notif-123' } }
        });

        const result = await client.sendMatchNotification('user-123', {
            matchId: 'match-456',
            name: 'Test User'
        });

        expect(result.success).toBe(true);
        expect(client.client.post).toHaveBeenCalledWith(
            '/api/system/notifications',
            expect.objectContaining({
                userId: 'user-123',
                type: 'match'
            })
        );
    });
});
```

This comprehensive guide shows how to integrate the notification client across all your microservices, ensuring consistent and reliable notification delivery throughout your dating app ecosystem.
