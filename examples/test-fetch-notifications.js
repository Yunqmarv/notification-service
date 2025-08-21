// Test script to demonstrate how users fetch notifications
const axios = require('axios');

class NotificationFetcher {
    constructor(baseURL = 'https://notifications-v845.onrender.com', userId = '8e580844-4053-4f60-9549-5722c0c41e13') {
        this.baseURL = baseURL;
        this.userId = userId;
        
        // For testing, we'll use a mock JWT token or API key
        // In real app, you'd get this from user authentication
        this.token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiOGU1ODA4NDQtNDA1My00ZjYwLTk1NDktNTcyMmMwYzQxZTEzIiwiZW1haWwiOiJleGNsdXNpdmVtYXJ2QGdtYWlsLmNvbSIsInVzZXJuYW1lIjoiZXhjbHVzaXZlbWFydiIsIm5hbWUiOiJFeGNsdXNpdmVtYXJ2Iiwicm9sZSI6InVzZXIiLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwidHlwZSI6ImFjY2VzcyIsInNjb3BlIjoiYWxsIiwiX3dlYnNvY2tldCI6IndlYnNvY2tldCIsIl9jaGF0U2VydiI6ImNoYXRTZXJ2IiwiX2F1dGhTZXJ2IjoiYXV0aFNlcnYiLCJfbm90aWZpY2F0aW9uU2VydiI6Im5vdGlmaWNhdGlvblNlcnYiLCJfZmlsZVNlcnYiOiJmaWxlU2VydiIsIl9fZGF0ZSI6eyJrZXkiOiJfZGF0ZV9fMjRoIiwic2VydmljZSI6ImRhdGVzZXJ2aWNlXzgzNWNhMWEzMmYiLCJpc19hY3RpdmUiOnRydWUsImlzc3VlZF9ieSI6ImF1dGhTZXJ2aWNlXzNlNWIzYWIwMDc5YzlhM2EiLCJwZXJtaXNzaW9ucyI6WyJjcmVhdGVfZGF0ZSIsImFjY2VwdF9kYXRlX2Zyb21fb3RoZXJzIiwicmVqZWN0X2RhdGVfZnJvbV9vdGhlcnMiLCJjYW5jZWxfZGF0ZV9vd25fZGF0ZSJdLCJyZWdpb24iOiJnbG9iYWwiLCJyZXF1ZXN0ZWRfYXQiOiIyMDI1LTA4LTIxVDIwOjUyOjUxLjM5MloiLCJleHBpcnlfc2Vjb25kcyI6IjI0aCIsInZlcnNpb24iOjEsImludGVybmFsX2ZsYWdzIjp7InByaW9yaXR5X3VzZXIiOmZhbHNlLCJvbl9wcm9tbyI6ZmFsc2V9fSwiX19naWZ0Ijp7ImtleSI6Il9naWZ0X18yNGgiLCJzZXJ2aWNlIjoiZ2lmdHNlcnZpY2VfMTZhMTc0Zjk5MSIsInNlcnZpY2VpZF9fIjoiN2IwZGIyNTdlNWMzZGMyMWU5MzVhNGU1OTYzOTIwMzc0YjE3IiwiaXNfYWN0aXZlIjp0cnVlLCJpc3N1ZWRfYnkiOiJhdXRoU2VydmljZV8xYjAyNmMyYTcwNzUyM2JiIiwicGVybWlzc2lvbnMiOlsic2VuZF9naWZ0IiwicmVjZWl2ZV9naWZ0Iiwidm'; // Replace with actual JWT
        
        this.client = axios.create({
            baseURL: this.baseURL,
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json'
            }
        });
    }

    /**
     * Test 1: Fetch all notifications for user
     */
    async fetchAllNotifications() {
        try {
            console.log('📥 Fetching all notifications...');
            
            const response = await this.client.get('/api/notifications', {
                params: {
                    limit: 20,
                    offset: 0,
                    sort: 'createdAt',
                    order: 'desc'
                }
            });
            
            const { notifications, pagination } = response.data.data;
            
            console.log(`✅ Found ${notifications.length} notifications (Total: ${pagination.total})`);
            console.log('📋 Recent notifications:');
            
            notifications.slice(0, 3).forEach((notif, index) => {
                console.log(`   ${index + 1}. [${notif.type}] ${notif.title}`);
                console.log(`      💬 ${notif.message}`);
                console.log(`      📅 ${new Date(notif.createdAt).toLocaleString()}`);
                console.log(`      👁️ Read: ${notif.read ? 'Yes' : 'No'}`);
                console.log('');
            });
            
            return { notifications, pagination };
        } catch (error) {
            console.error('❌ Error fetching notifications:', error.response?.data || error.message);
            return null;
        }
    }

    /**
     * Test 2: Fetch unread notifications count
     */
    async fetchUnreadCount() {
        try {
            console.log('🔢 Fetching unread count...');
            
            const response = await this.client.get('/api/notifications/unread-count');
            const { count } = response.data.data;
            
            console.log(`✅ Unread notifications: ${count}`);
            return count;
        } catch (error) {
            console.error('❌ Error fetching unread count:', error.response?.data || error.message);
            return null;
        }
    }

    /**
     * Test 3: Fetch notifications by type
     */
    async fetchNotificationsByType(type = 'date_request') {
        try {
            console.log(`📝 Fetching ${type} notifications...`);
            
            const response = await this.client.get(`/api/notifications/types/${type}`, {
                params: {
                    read: false, // Only unread
                    limit: 10
                }
            });
            
            const { notifications, pagination } = response.data.data;
            
            console.log(`✅ Found ${notifications.length} unread ${type} notifications`);
            
            notifications.forEach((notif, index) => {
                console.log(`   ${index + 1}. ${notif.title}`);
                if (notif.metadata) {
                    // Show some key metadata based on type
                    if (type === 'date_request' && notif.metadata.venueDetails) {
                        console.log(`      🍽️ Venue: ${notif.metadata.venueDetails.name}`);
                        console.log(`      💰 Price: ${notif.metadata.venueDetails.priceRange}`);
                    } else if (type === 'like' && notif.metadata.likerName) {
                        console.log(`      👤 From: ${notif.metadata.likerName}`);
                        console.log(`      💯 Compatibility: ${notif.metadata.compatibilityScore}%`);
                    } else if (type === 'match' && notif.metadata.partnerName) {
                        console.log(`      👤 Partner: ${notif.metadata.partnerName}`);
                        console.log(`      💯 Match Score: ${notif.metadata.compatibilityScore}%`);
                    }
                }
                console.log('');
            });
            
            return { notifications, pagination };
        } catch (error) {
            console.error(`❌ Error fetching ${type} notifications:`, error.response?.data || error.message);
            return null;
        }
    }

    /**
     * Test 4: Fetch grouped notifications
     */
    async fetchGroupedNotifications() {
        try {
            console.log('📊 Fetching grouped notifications...');
            
            const response = await this.client.get('/api/notifications/grouped', {
                params: {
                    includeRead: false,
                    limit: 10
                }
            });
            
            const { groups } = response.data.data;
            
            console.log(`✅ Found ${groups.length} notification types with unread messages:`);
            
            groups.forEach((group, index) => {
                console.log(`   ${index + 1}. ${group.type.toUpperCase()}`);
                console.log(`      📊 Total: ${group.count}, Unread: ${group.unreadCount}`);
                console.log(`      📰 Latest: "${group.notification.title}"`);
                console.log(`      📅 ${new Date(group.notification.createdAt).toLocaleString()}`);
                console.log('');
            });
            
            return groups;
        } catch (error) {
            console.error('❌ Error fetching grouped notifications:', error.response?.data || error.message);
            return null;
        }
    }

    /**
     * Test 5: Fetch specific notification with full metadata
     */
    async fetchSpecificNotification(notificationId) {
        try {
            console.log(`🔍 Fetching notification: ${notificationId}...`);
            
            const response = await this.client.get(`/api/notifications/${notificationId}`);
            const notification = response.data.data;
            
            console.log('✅ Notification details:');
            console.log(`   📋 Title: ${notification.title}`);
            console.log(`   💬 Message: ${notification.message}`);
            console.log(`   📂 Type: ${notification.type}`);
            console.log(`   ⚡ Priority: ${notification.priority}`);
            console.log(`   👁️ Read: ${notification.read ? 'Yes' : 'No'}`);
            console.log(`   📅 Created: ${new Date(notification.createdAt).toLocaleString()}`);
            
            if (notification.metadata) {
                console.log('   🏷️ Metadata:');
                console.log('      ', JSON.stringify(notification.metadata, null, 6));
            }
            
            return notification;
        } catch (error) {
            console.error('❌ Error fetching notification:', error.response?.data || error.message);
            return null;
        }
    }

    /**
     * Test 6: Mark notification as read
     */
    async markNotificationRead(notificationId) {
        try {
            console.log(`✅ Marking notification as read: ${notificationId}...`);
            
            const response = await this.client.patch(`/api/notifications/${notificationId}/read`, {
                read: true
            });
            
            console.log('✅ Notification marked as read successfully');
            return response.data.data;
        } catch (error) {
            console.error('❌ Error marking notification as read:', error.response?.data || error.message);
            return null;
        }
    }

    /**
     * Test 7: Mark all notifications as read
     */
    async markAllNotificationsRead() {
        try {
            console.log('✅ Marking all notifications as read...');
            
            const response = await this.client.patch('/api/notifications/mark-all-read');
            const { modifiedCount } = response.data.data;
            
            console.log(`✅ Marked ${modifiedCount} notifications as read`);
            return modifiedCount;
        } catch (error) {
            console.error('❌ Error marking all notifications as read:', error.response?.data || error.message);
            return null;
        }
    }

    /**
     * Run comprehensive notification fetch tests
     */
    async runAllTests() {
        console.log('🚀 Starting Notification Fetch Tests...\n');
        
        try {
            // Test 1: Get all notifications
            const allNotifications = await this.fetchAllNotifications();
            console.log('─'.repeat(60));
            
            // Test 2: Get unread count
            await this.fetchUnreadCount();
            console.log('─'.repeat(60));
            
            // Test 3: Get notifications by type
            await this.fetchNotificationsByType('date_request');
            console.log('─'.repeat(60));
            
            await this.fetchNotificationsByType('like');
            console.log('─'.repeat(60));
            
            await this.fetchNotificationsByType('match');
            console.log('─'.repeat(60));
            
            // Test 4: Get grouped notifications
            await this.fetchGroupedNotifications();
            console.log('─'.repeat(60));
            
            // Test 5: Get specific notification (if we have any)
            if (allNotifications && allNotifications.notifications.length > 0) {
                const firstNotification = allNotifications.notifications[0];
                await this.fetchSpecificNotification(firstNotification.id);
                console.log('─'.repeat(60));
                
                // Test 6: Mark notification as read
                await this.markNotificationRead(firstNotification.id);
                console.log('─'.repeat(60));
            }
            
            console.log('✅ All notification fetch tests completed successfully!');
            
        } catch (error) {
            console.error('❌ Test suite failed:', error.message);
        }
    }
}

// Export for use in other modules
module.exports = NotificationFetcher;

// Run tests if file is executed directly
if (require.main === module) {
    const fetcher = new NotificationFetcher();
    fetcher.runAllTests().catch(console.error);
}
