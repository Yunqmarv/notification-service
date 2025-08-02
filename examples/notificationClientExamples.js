// Example: How to use the NotificationClient in your microservices
const NotificationClient = require('./src/clients/notificationClient');

// Initialize the notification client
const notificationClient = new NotificationClient({
    serviceName: 'example-service',
    debug: true
});

// Example usage functions
class ExampleService {
    
    // Example 1: Send a match notification
    async handleNewMatch() {
        try {
            const result = await notificationClient.sendMatchNotification('user_4743276c8677b833ce78fc97772c4256', {
                matchId: 'match_789',
                partnerId: 'user_456',
                name: 'Sarah Johnson',
                profilePicture: 'https://example.com/profile.jpg',
                emailNotifications: true
            });
            
            console.log('✅ Match notification sent:', result.notification.id);
        } catch (error) {
            console.error('❌ Failed to send match notification:', error.message);
        }
    }

    // Example 2: Send a message notification
    async handleNewMessage() {
        try {
            const result = await notificationClient.sendMessageNotification('user_4743276c8677b833ce78fc97772c4256', {
                messageId: 'msg_123',
                senderId: 'user_456',
                senderName: 'Alex Smith',
                conversationId: 'conv_789',
                preview: 'Hey! How are you doing?',
                emailNotifications: true
            });
            
            console.log('✅ Message notification sent:', result.notification.id);
        } catch (error) {
            console.error('❌ Failed to send message notification:', error.message);
        }
    }

    // Example 3: Send a system notification
    async handleSystemAnnouncement() {
        try {
            const result = await notificationClient.sendSystemNotification('user_4743276c8677b833ce78fc97772c4256', {
                title: 'New Feature Available! 🎉',
                message: 'We\'ve just released video calling! Try it out with your matches.',
                category: 'feature-announcement',
                priority: 'high',
                push: true,
                email: true,
                action: 'view_features',
                data: { featureId: 'video-calling' }
            });
            
            console.log('✅ System notification sent:', result.notification.id);
        } catch (error) {
            console.error('❌ Failed to send system notification:', error.message);
        }
    }

    // Example 4: Send a payment notification
    async handlePaymentProcessed() {
        try {
            const result = await notificationClient.sendPaymentNotification('user_4743276c8677b833ce78fc97772c4256', {
                paymentId: 'pay_123',
                amount: 9.99,
                currency: 'USD',
                success: true,
                message: 'Your premium subscription has been activated!'
            });
            
            console.log('✅ Payment notification sent:', result.notification.id);
        } catch (error) {
            console.error('❌ Failed to send payment notification:', error.message);
        }
    }

    // Example 5: Send a security notification
    async handleSecurityEvent() {
        try {
            const result = await notificationClient.sendSecurityNotification('user_4743276c8677b833ce78fc97772c4256', {
                title: 'New Login Detected 🔒',
                message: 'We detected a new login to your account from New York, NY.',
                eventType: 'login',
                ipAddress: '192.168.1.100',
                location: 'New York, NY',
                timestamp: new Date().toISOString()
            });
            
            console.log('✅ Security notification sent:', result.notification.id);
        } catch (error) {
            console.error('❌ Failed to send security notification:', error.message);
        }
    }

    // Example 6: Send bulk notifications
    async handleBulkNotifications() {
        try {
            const notifications = [
                {
                    userId: 'user_4743276c8677b833ce78fc97772c4256',
                    title: 'Weekend Special Event! 🎊',
                    message: 'Join our speed dating event this Saturday at 7 PM!',
                    type: 'event',
                    priority: 'normal',
                    metadata: {
                        eventId: 'event_123',
                        eventDate: '2025-08-03T19:00:00Z'
                    },
                    channels: {
                        push: true,
                        email: true,
                        websocket: true,
                        inApp: true
                    }
                },
                {
                    userId: 'user_456',
                    title: 'Profile Boost Available! ⭐',
                    message: 'Your free profile boost is ready to use. Get 3x more visibility!',
                    type: 'promotional',
                    priority: 'normal',
                    metadata: {
                        boostId: 'boost_789',
                        expiresAt: '2025-08-10T23:59:59Z'
                    },
                    channels: {
                        push: true,
                        email: false,
                        websocket: true,
                        inApp: true
                    }
                }
            ];

            const results = await notificationClient.createBulkNotifications(notifications);
            
            console.log(`✅ Bulk notifications sent: ${results.successful.length}/${results.total}`);
            
            if (results.failed.length > 0) {
                console.log('❌ Failed notifications:', results.failed);
            }
        } catch (error) {
            console.error('❌ Failed to send bulk notifications:', error.message);
        }
    }

    // Example 7: Custom notification with advanced options
    async handleCustomNotification() {
        try {
            const result = await notificationClient.createNotification({
                userId: 'user_4743276c8677b833ce78fc97772c4256',
                title: 'Custom Achievement Unlocked! 🏆',
                message: 'Congratulations! You\'ve received 100 likes. You\'re on fire!',
                type: 'achievement',
                priority: 'high',
                metadata: {
                    achievementId: 'likes_100',
                    category: 'social_milestone',
                    reward: 'premium_week',
                    previousLikes: 99,
                    newLikes: 100
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
            
            console.log('✅ Custom notification sent:', result.notification.id);
        } catch (error) {
            console.error('❌ Failed to send custom notification:', error.message);
        }
    }

    // Example 8: Health check
    async checkNotificationServiceHealth() {
        try {
            const health = await notificationClient.checkHealth();
            
            if (health.healthy) {
                console.log('✅ Notification service is healthy');
                console.log(`   Status: ${health.status}`);
                console.log(`   Version: ${health.version}`);
                console.log(`   Uptime: ${health.uptime}s`);
            } else {
                console.warn('⚠️ Notification service is not healthy');
                console.warn(`   Error: ${health.error}`);
            }
            
            return health;
        } catch (error) {
            console.error('❌ Failed to check notification service health:', error.message);
            return { healthy: false, error: error.message };
        }
    }
}

// Demo function to run all examples
async function runExamples() {
    console.log('🚀 Starting NotificationClient examples...\n');
    
    const service = new ExampleService();
    
    // Check service health first
    await service.checkNotificationServiceHealth();
    console.log('');
    
    // Run all examples
    await service.handleNewMatch();
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
    
    await service.handleNewMessage();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await service.handleSystemAnnouncement();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await service.handlePaymentProcessed();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await service.handleSecurityEvent();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await service.handleCustomNotification();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await service.handleBulkNotifications();
    
    console.log('\n✅ All examples completed!');
}

// Export for use in other modules
module.exports = {
    ExampleService,
    notificationClient,
    runExamples
};

// Run examples if this file is executed directly
if (require.main === module) {
    runExamples().catch(console.error);
}
