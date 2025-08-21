# Dating Notifications Test Guide

## How to Run the Dating Notifications Example

### Prerequisites

Make sure you're in the notifications directory:
```bash
cd /Users/oluwa/Desktop/my-dating-project/notifications
```

### Running Tests

#### 1. Run All Tests (Recommended)
```bash
# Run all notification types (like, match, date_request)
node examples/dating-notifications-example.js

# Or using npm script
npm run test:dating
```

#### 2. Run Individual Test Types
```bash
# Test only like notifications
node examples/dating-notifications-example.js like
npm run test:dating:like

# Test only match notifications  
node examples/dating-notifications-example.js match
npm run test:dating:match

# Test only date request notifications
node examples/dating-notifications-example.js date
npm run test:dating:date
```

#### 3. Using the Test Runner
```bash
# Using the dedicated test runner
node examples/run-test.js
npm run test:run

# Test runner with specific type
node examples/run-test.js like
node examples/run-test.js match
node examples/run-test.js date
```

### Example Output

When you run the tests, you'll see output like this:

```
🚀 Starting Dating Notifications Test Suite...

📝 Test 1: Sending Like Notification
[NotificationClient] Creating notification: {
  userId: 'user_4743276c8677b833ce78fc97772c4256',
  type: 'like',
  title: 'Someone likes you! ❤️'
}
✅ Like notification sent: 4acd6a3e-d622-4e4a-80e7-252bd206ec39

📝 Test 2: Sending Match Notification
✅ Match notification sent: 1f3ea64e-c4d5-47f6-9e54-44a483ffbe89

📝 Test 3: Sending Date Request Notification
✅ Date request notification sent: cccfa537-d73b-4b72-87f7-9122269a875d

✅ All tests completed successfully!
```

### What Gets Tested

Each test creates a realistic notification with:

#### Like Notification
- User demographics and profile info
- Compatibility scores and mutual connections
- Behavioral insights and verification status
- Suggested conversation starters
- Action URLs for quick responses

#### Match Notification  
- Comprehensive partner information
- Match quality indicators
- Social proof (mutual friends/interests)
- Geographic and timing context
- Conversation aids and ice breakers

#### Date Request Notification
- Detailed venue and activity information
- Safety and verification data
- Cost estimates and logistics
- User preference alignment
- AI-powered recommendations
- Emergency and safety features

### Viewing Results

After running tests, you can:

1. **Check the notification service logs** to see delivery details
2. **Use the API** to retrieve the created notifications:
   ```bash
   # Get notifications for the test user
   curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
        "https://notifications-v845.onrender.com/api/notifications?userId=user_4743276c8677b833ce78fc97772c4256"
   ```

### Customizing Tests

You can modify the test data in `dating-notifications-example.js`:

- Change user IDs in the test functions
- Modify notification content and metadata
- Add new test scenarios
- Test different channel configurations (push, email, websocket)

### Environment Variables

Make sure these are set in your environment:
```bash
NOTIFICATION_SERVICE_URL=https://notifications-v845.onrender.com
SYSTEM_API_KEY=319f4d26e31c1a4c0b44e2a8dff8b2e8c83136557af36f9260c75ea3ca9164e8
```

### Troubleshooting

If tests fail:

1. **Check network connectivity** to the notification service
2. **Verify API key** is correct in the environment
3. **Check service health**:
   ```bash
   curl https://notifications-v845.onrender.com/health
   ```
4. **Review error messages** in the console output

### Integration with Your App

To use this in your actual dating app:

1. **Copy the `DatingNotificationService` class** to your codebase
2. **Install dependencies**:
   ```bash
   npm install axios
   ```
3. **Set environment variables** for your service
4. **Import and use** the service in your business logic:
   ```javascript
   const DatingNotificationService = require('./path/to/dating-notifications');
   const notifications = new DatingNotificationService();
   
   // Send a like notification
   await notifications.sendLikeNotification(userId, likerInfo, likeContext);
   ```

The test examples show you exactly how to structure the data for each notification type with comprehensive metadata that provides rich context for users and analytics.
