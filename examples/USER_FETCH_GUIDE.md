# How Users Can Fetch Notifications

The notification service provides multiple endpoints for users to fetch their notifications in different ways. Here are all the methods available:

## Authentication Required

All user notification endpoints require JWT token authentication:
```bash
Authorization: Bearer <your-jwt-token>
```

## 1. Get All User Notifications

### Basic Request
```bash
GET /api/notifications
```

### With Filters and Pagination
```bash
GET /api/notifications?type=like&read=false&limit=20&offset=0&sort=createdAt&order=desc
```

### Example Response
```json
{
  "success": true,
  "message": "Notifications retrieved successfully",
  "data": {
    "notifications": [
      {
        "id": "cccfa537-d73b-4b72-87f7-9122269a875d",
        "userId": "8e580844-4053-4f60-9549-5722c0c41e13",
        "title": "Jordan Martinez wants to take you on a date! 💕",
        "message": "\"Dinner at Italian Restaurant\" at Bella Vista Ristorante",
        "type": "date_request",
        "priority": "high",
        "status": "sent",
        "read": false,
        "metadata": {
          "dateRequestId": "date_req_1724276882744",
          "requesterId": "user_0a18a61423efa8f3a6dba414437328f7",
          "requesterName": "Jordan Martinez",
          "venueDetails": {
            "name": "Bella Vista Ristorante",
            "rating": 4.5,
            "priceRange": "$$"
          },
          "actionUrls": {
            "accept": "/date-requests/date_req_1724276882744/accept",
            "decline": "/date-requests/date_req_1724276882744/decline"
          }
        },
        "createdAt": "2025-08-21T21:28:02.748Z",
        "timeAgo": "2 hours ago"
      }
    ],
    "pagination": {
      "total": 15,
      "limit": 20,
      "offset": 0,
      "hasMore": false
    }
  }
}
```

### Available Query Parameters
- `type`: Filter by notification type (like, match, date_request, etc.)
- `read`: Filter by read status (true/false)
- `status`: Filter by status (pending, sent, delivered, read, failed)
- `priority`: Filter by priority (low, normal, high, urgent)
- `limit`: Number of results (1-100, default: 20)
- `offset`: Pagination offset (default: 0)
- `sort`: Sort field (createdAt, updatedAt, priority, type)
- `order`: Sort order (asc, desc, default: desc)

## 2. Get Unread Count

```bash
GET /api/notifications/unread-count
```

### With Type Filter
```bash
GET /api/notifications/unread-count?type=message
```

### Example Response
```json
{
  "success": true,
  "message": "Unread count retrieved successfully",
  "data": {
    "count": 7
  }
}
```

## 3. Get Grouped Notifications

Groups notifications by type and shows the most recent notification for each type:

```bash
GET /api/notifications/grouped?includeRead=false&limit=10
```

### Example Response
```json
{
  "success": true,
  "message": "Grouped notifications retrieved successfully",
  "data": {
    "groups": [
      {
        "_id": "date_request",
        "type": "date_request",
        "count": 3,
        "unreadCount": 2,
        "hasUnread": true,
        "notification": {
          "id": "cccfa537-d73b-4b72-87f7-9122269a875d",
          "title": "Jordan Martinez wants to take you on a date! 💕",
          "type": "date_request",
          "createdAt": "2025-08-21T21:28:02.748Z"
        }
      },
      {
        "_id": "like",
        "type": "like",
        "count": 8,
        "unreadCount": 5,
        "hasUnread": true,
        "notification": {
          "id": "4acd6a3e-d622-4e4a-80e7-252bd206ec39",
          "title": "Someone likes you! ❤️",
          "type": "like",
          "createdAt": "2025-08-21T21:28:02.045Z"
        }
      }
    ]
  }
}
```

## 4. Get Specific Notification

```bash
GET /api/notifications/{notification-id}
```

### Example Response
```json
{
  "success": true,
  "message": "Notification retrieved successfully",
  "data": {
    "id": "cccfa537-d73b-4b72-87f7-9122269a875d",
    "userId": "8e580844-4053-4f60-9549-5722c0c41e13",
    "title": "Jordan Martinez wants to take you on a date! 💕",
    "message": "\"Dinner at Italian Restaurant\" at Bella Vista Ristorante",
    "type": "date_request",
    "priority": "high",
    "metadata": {
      "dateRequestId": "date_req_1724276882744",
      "requesterId": "user_0a18a61423efa8f3a6dba414437328f7",
      "requesterName": "Jordan Martinez",
      "requesterAge": 29,
      "venueDetails": {
        "name": "Bella Vista Ristorante",
        "address": "123 Market Street, San Francisco, CA",
        "rating": 4.5,
        "priceRange": "$$",
        "cuisine": "Italian"
      },
      "actionUrls": {
        "accept": "/date-requests/date_req_1724276882744/accept",
        "decline": "/date-requests/date_req_1724276882744/decline",
        "counterPropose": "/date-requests/date_req_1724276882744/counter",
        "viewProfile": "/profiles/user_0a18a61423efa8f3a6dba414437328f7"
      }
    },
    "createdAt": "2025-08-21T21:28:02.748Z"
  }
}
```

## 5. Get Notifications by Type

```bash
GET /api/notifications/types/like?read=false&limit=50&offset=0
```

### Example Response
```json
{
  "success": true,
  "message": "Notifications retrieved successfully",
  "data": {
    "notifications": [
      {
        "id": "4acd6a3e-d622-4e4a-80e7-252bd206ec39",
        "title": "Someone likes you! ❤️",
        "message": "Sarah Johnson liked your profile. Check them out!",
        "type": "like",
        "metadata": {
          "likerId": "user_0a18a61423efa8f3a6dba414437328f7",
          "likerName": "Sarah Johnson",
          "compatibilityScore": 85,
          "mutualFriends": 3
        }
      }
    ],
    "pagination": {
      "total": 8,
      "limit": 50,
      "offset": 0,
      "hasMore": false
    }
  }
}
```

## 6. Mark Notification as Read/Unread

```bash
PATCH /api/notifications/{notification-id}/read
Content-Type: application/json

{
  "read": true
}
```

### Example Response
```json
{
  "success": true,
  "message": "Notification marked as read",
  "data": {
    "id": "cccfa537-d73b-4b72-87f7-9122269a875d",
    "read": true,
    "readAt": "2025-08-21T23:45:30.123Z"
  }
}
```

## 7. Mark All Notifications as Read

```bash
PATCH /api/notifications/mark-all-read
Content-Type: application/json

{
  "type": "like"  // Optional: only mark specific type as read
}
```

### Example Response
```json
{
  "success": true,
  "message": "All notifications marked as read",
  "data": {
    "modifiedCount": 12
  }
}
```

## 8. Delete Notification

```bash
DELETE /api/notifications/{notification-id}
```

### Example Response
```json
{
  "success": true,
  "message": "Notification deleted successfully"
}
```

## Complete JavaScript Examples

### 1. Fetch User's Latest Notifications
```javascript
async function fetchLatestNotifications(token, limit = 20) {
    try {
        const response = await fetch('/api/notifications?limit=' + limit + '&sort=createdAt&order=desc', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            console.log('Latest notifications:', data.data.notifications);
            return data.data.notifications;
        } else {
            console.error('Error fetching notifications:', data.message);
        }
    } catch (error) {
        console.error('Network error:', error);
    }
}
```

### 2. Get Unread Notifications Only
```javascript
async function fetchUnreadNotifications(token) {
    try {
        const response = await fetch('/api/notifications?read=false&sort=createdAt&order=desc', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            console.log('Unread notifications:', data.data.notifications);
            console.log('Total unread:', data.data.pagination.total);
            return data.data.notifications;
        }
    } catch (error) {
        console.error('Error fetching unread notifications:', error);
    }
}
```

### 3. Get Notification Dashboard Summary
```javascript
async function fetchNotificationDashboard(token) {
    try {
        // Get grouped notifications and unread count in parallel
        const [groupedResponse, countResponse] = await Promise.all([
            fetch('/api/notifications/grouped?includeRead=false&limit=10', {
                headers: { 'Authorization': `Bearer ${token}` }
            }),
            fetch('/api/notifications/unread-count', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
        ]);
        
        const [groupedData, countData] = await Promise.all([
            groupedResponse.json(),
            countResponse.json()
        ]);
        
        return {
            groups: groupedData.data.groups,
            totalUnread: countData.data.count
        };
    } catch (error) {
        console.error('Error fetching dashboard:', error);
    }
}
```

### 4. Mark Notification as Read
```javascript
async function markNotificationRead(token, notificationId) {
    try {
        const response = await fetch(`/api/notifications/${notificationId}/read`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ read: true })
        });
        
        const data = await response.json();
        
        if (data.success) {
            console.log('Notification marked as read');
            return true;
        } else {
            console.error('Error marking as read:', data.message);
            return false;
        }
    } catch (error) {
        console.error('Network error:', error);
        return false;
    }
}
```

### 5. Real-time Notifications with Polling
```javascript
class NotificationManager {
    constructor(token) {
        this.token = token;
        this.lastCheck = new Date();
        this.pollInterval = null;
    }
    
    startPolling(intervalMs = 30000) { // Poll every 30 seconds
        this.pollInterval = setInterval(() => {
            this.checkForNewNotifications();
        }, intervalMs);
    }
    
    stopPolling() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }
    }
    
    async checkForNewNotifications() {
        try {
            const response = await fetch(`/api/notifications?read=false&sort=createdAt&order=desc&limit=50`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                const newNotifications = data.data.notifications.filter(
                    notif => new Date(notif.createdAt) > this.lastCheck
                );
                
                if (newNotifications.length > 0) {
                    this.onNewNotifications(newNotifications);
                }
                
                this.lastCheck = new Date();
            }
        } catch (error) {
            console.error('Error checking for notifications:', error);
        }
    }
    
    onNewNotifications(notifications) {
        console.log('New notifications received:', notifications);
        // Handle new notifications (show toast, update UI, etc.)
        notifications.forEach(notif => {
            this.showNotificationToast(notif);
        });
    }
    
    showNotificationToast(notification) {
        // Example toast notification
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(notification.title, {
                body: notification.message,
                icon: '/notification-icon.png',
                data: notification
            });
        }
    }
}

// Usage
const notificationManager = new NotificationManager(userToken);
notificationManager.startPolling(30000); // Check every 30 seconds
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error (development only)"
}
```

Common HTTP status codes:
- `200`: Success
- `400`: Bad request (validation errors)
- `401`: Unauthorized (invalid/missing token)
- `404`: Not found
- `500`: Internal server error

## Performance Features

- **Caching**: Responses are cached for improved performance
- **Pagination**: All list endpoints support pagination
- **Filtering**: Multiple filter options available
- **Sorting**: Flexible sorting options
- **Rate Limiting**: Prevents abuse

This comprehensive API gives users complete control over fetching and managing their notifications with rich metadata and flexible filtering options.
