// Simple example showing how to fetch notifications
// This demonstrates how to check if notifications were created and retrieve them

const axios = require('axios');

class NotificationChecker {
    constructor() {
        this.baseURL = 'https://notifications-v845.onrender.com';
        this.apiKey = '319f4d26e31c1a4c0b44e2a8dff8b2e8c83136557af36f9260c75ea3ca9164e8';
        this.testUserId = '8e580844-4053-4f60-9549-5722c0c41e13';
    }

    // Check if our test notifications were created by looking at the database
    async checkNotificationsExist() {
        try {
            console.log('🔍 Checking if our test notifications exist...\n');
            
            // For demonstration, let's create a simple notification first
            const testNotification = {
                userId: this.testUserId,
                title: 'Test Fetch Notification 📱',
                message: 'This is a test notification to demonstrate fetching',
                type: 'system',
                priority: 'normal',
                metadata: {
                    test: true,
                    fetchDemo: true,
                    createdAt: new Date().toISOString(),
                    purpose: 'demonstrate user notification fetching'
                },
                channels: {
                    push: true,
                    email: false,
                    websocket: true,
                    inApp: true
                }
            };

            // Create the test notification using system API
            const createResponse = await axios.post(
                `${this.baseURL}/api/system/notifications`,
                testNotification,
                {
                    headers: {
                        'x-api-key': this.apiKey,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (createResponse.data.success) {
                const notificationId = createResponse.data.data.id;
                console.log(`✅ Test notification created with ID: ${notificationId}`);
                console.log(`📋 Title: ${createResponse.data.data.title}`);
                console.log(`📂 Type: ${createResponse.data.data.type}`);
                console.log(`👤 User: ${createResponse.data.data.userId}`);
                console.log('');
                
                return {
                    notificationId,
                    notification: createResponse.data.data
                };
            } else {
                console.log('❌ Failed to create test notification');
                return null;
            }

        } catch (error) {
            console.error('❌ Error creating test notification:', error.response?.data || error.message);
            return null;
        }
    }

    // Demonstrate how users would typically fetch notifications in a real app
    async demonstrateUserFetching() {
        console.log('📚 How Users Fetch Notifications in Real Applications:\n');

        console.log('1️⃣ Frontend JavaScript (React/Vue/Angular):');
        console.log(`
// User authentication provides JWT token
const userToken = getUserAuthToken(); // From login/auth system

// Fetch user's notifications
async function loadNotifications() {
    try {
        const response = await fetch('/api/notifications?limit=20&read=false', {
            headers: {
                'Authorization': 'Bearer ' + userToken,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            displayNotifications(data.data.notifications);
            updateUnreadCount(data.data.pagination.total);
        }
    } catch (error) {
        console.error('Failed to load notifications:', error);
    }
}
        `);

        console.log('2️⃣ Mobile App (React Native/Flutter):');
        console.log(`
// Similar approach with mobile HTTP client
const fetchNotifications = async () => {
    try {
        const response = await httpClient.get('/api/notifications', {
            headers: { 'Authorization': 'Bearer ' + userToken },
            params: { limit: 20, sort: 'createdAt', order: 'desc' }
        });
        
        return response.data.data.notifications;
    } catch (error) {
        handleError(error);
    }
};
        `);

        console.log('3️⃣ Backend Service (Node.js/Python/etc):');
        console.log(`
// When displaying user profile/dashboard
app.get('/dashboard', authenticateUser, async (req, res) => {
    const userId = req.user.id;
    
    // Fetch notifications for dashboard
    const notifications = await notificationService.getUserNotifications(userId, {
        limit: 10,
        read: false
    });
    
    res.render('dashboard', { 
        notifications: notifications.data.notifications,
        unreadCount: notifications.data.pagination.total
    });
});
        `);

        console.log('4️⃣ Real-time Updates (WebSocket):');
        console.log(`
// Connect to WebSocket for real-time notifications
const ws = new WebSocket('wss://notifications.yourapp.com/ws');
ws.onmessage = (event) => {
    const notification = JSON.parse(event.data);
    
    // Add to notification list
    addNotificationToUI(notification);
    
    // Show toast/banner
    showNotificationToast(notification.title, notification.message);
    
    // Update unread count
    incrementUnreadCount();
};
        `);

        console.log('\n📋 Key Points for User Notification Fetching:\n');
        console.log('• Users need JWT tokens from authentication');
        console.log('• Notifications are fetched per user (userId from token)');
        console.log('• Support pagination for large notification lists');
        console.log('• Filter by read/unread status, type, priority');
        console.log('• Real-time updates via WebSocket for instant delivery');
        console.log('• Cache responses for better performance');
        console.log('• Handle errors gracefully (network issues, auth expiry)');
        console.log('');
    }

    // Show the structure of fetched notifications
    async showNotificationStructure() {
        console.log('📄 Structure of Fetched Notifications:\n');
        
        const exampleNotification = {
            id: "cccfa537-d73b-4b72-87f7-9122269a875d",
            userId: "8e580844-4053-4f60-9549-5722c0c41e13",
            title: "Jordan Martinez wants to take you on a date! 💕",
            message: "\"Dinner at Italian Restaurant\" at Bella Vista Ristorante",
            type: "date_request",
            priority: "high",
            status: "sent",
            read: false,
            readAt: null,
            metadata: {
                dateRequestId: "date_req_1724276882744",
                requesterId: "user_0a18a61423efa8f3a6dba414437328f7",
                requesterName: "Jordan Martinez",
                requesterAge: 29,
                venueDetails: {
                    name: "Bella Vista Ristorante",
                    address: "123 Market Street, San Francisco, CA",
                    rating: 4.5,
                    priceRange: "$$",
                    cuisine: "Italian"
                },
                actionUrls: {
                    accept: "/date-requests/date_req_1724276882744/accept",
                    decline: "/date-requests/date_req_1724276882744/decline",
                    counterPropose: "/date-requests/date_req_1724276882744/counter",
                    viewProfile: "/profiles/user_0a18a61423efa8f3a6dba414437328f7"
                }
            },
            channels: {
                push: { enabled: true, sent: true, sentAt: "2025-08-21T21:28:02.948Z" },
                email: { enabled: true, sent: true, sentAt: "2025-08-21T21:28:03.747Z" },
                inApp: { enabled: true, sent: true, sentAt: "2025-08-21T21:28:02.744Z" }
            },
            analytics: {
                impressions: 0,
                clicks: 0,
                interactions: []
            },
            createdAt: "2025-08-21T21:28:02.748Z",
            updatedAt: "2025-08-21T21:28:03.752Z",
            timeAgo: "2 hours ago"
        };

        console.log('📄 Example notification structure:');
        console.log(JSON.stringify(exampleNotification, null, 2));
        console.log('');

        console.log('🏷️ Key Fields Explained:');
        console.log('• id: Unique notification identifier');
        console.log('• userId: Target user who receives the notification');
        console.log('• title/message: Display content');
        console.log('• type: Category (like, match, date_request, etc.)');
        console.log('• priority: Urgency level (low, normal, high, urgent)');
        console.log('• read: Whether user has read the notification');
        console.log('• metadata: Rich context data for the notification');
        console.log('• channels: Delivery status across different channels');
        console.log('• analytics: Interaction tracking data');
        console.log('• timeAgo: Human-readable time since creation');
        console.log('');
    }

    async runDemo() {
        console.log('🚀 Notification Fetching Demonstration\n');
        console.log('=' * 60);
        console.log('');

        // Step 1: Create a test notification
        const result = await this.checkNotificationsExist();
        console.log('─'.repeat(60));
        
        // Step 2: Show how users fetch in real apps
        await this.demonstrateUserFetching();
        console.log('─'.repeat(60));
        
        // Step 3: Show notification structure
        await this.showNotificationStructure();
        console.log('─'.repeat(60));
        
        console.log('✅ Notification fetching demonstration completed!');
        console.log('');
        console.log('🔗 API Documentation: https://notifications-v845.onrender.com/api-docs');
        console.log('📖 Full Guide: See USER_FETCH_GUIDE.md');
    }
}

// Run demo if file is executed directly
if (require.main === module) {
    const checker = new NotificationChecker();
    checker.runDemo().catch(console.error);
}

module.exports = NotificationChecker;
