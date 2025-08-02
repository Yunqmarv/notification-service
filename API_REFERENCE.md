# Notification Microservice - API Reference

## Table of Contents
1. [Authentication](#authentication)
2. [Core Notification Endpoints](#core-notification-endpoints)
3. [Settings Endpoints](#settings-endpoints)
4. [Analytics Endpoints](#analytics-endpoints)
5. [Health Endpoints](#health-endpoints)
6. [Admin Endpoints](#admin-endpoints)
7. [Test Endpoints](#test-endpoints)
8. [WebSocket Events](#websocket-events)
9. [Error Responses](#error-responses)
10. [Rate Limiting](#rate-limiting)

---

## Authentication

### JWT Token Format
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Admin API Key Format
```
x-api-key: admin-test-key-123
```

---

## Core Notification Endpoints

### 1. Create Notification

**Endpoint:** `POST /api/notifications`  
**Authentication:** JWT Required  
**Description:** Create a new notification for a user

#### Request Payload
```json
{
  "userId": "user123",
  "type": "match",
  "title": "New Match!",
  "message": "You have a new match with Sarah",
  "priority": "normal",
  "data": {
    "matchId": "match456",
    "profileImage": "https://example.com/image.jpg",
    "matchName": "Sarah"
  },
  "channels": {
    "push": true,
    "email": false,
    "sms": false,
    "websocket": true
  },
  "metadata": {
    "source": "matching_service",
    "tags": ["dating", "match"]
  }
}
```

#### Success Response (201)
```json
{
  "success": true,
  "message": "Notification created successfully",
  "data": {
    "id": "64f1234567890abcdef12345",
    "userId": "user123",
    "type": "match",
    "title": "New Match!",
    "message": "You have a new match with Sarah",
    "priority": "normal",
    "isRead": false,
    "data": {
      "matchId": "match456",
      "profileImage": "https://example.com/image.jpg",
      "matchName": "Sarah"
    },
    "channels": {
      "push": true,
      "email": false,
      "sms": false,
      "websocket": true
    },
    "delivery": {
      "push": { "sent": false, "sentAt": null, "error": null },
      "email": { "sent": false, "sentAt": null, "error": null },
      "sms": { "sent": false, "sentAt": null, "error": null },
      "websocket": { "sent": true, "sentAt": "2025-08-01T19:00:00.000Z" }
    },
    "metadata": {
      "source": "matching_service",
      "version": 1,
      "tags": ["dating", "match"]
    },
    "createdAt": "2025-08-01T19:00:00.000Z",
    "updatedAt": "2025-08-01T19:00:00.000Z",
    "expiresAt": "2025-08-31T19:00:00.000Z"
  }
}
```

#### Error Response (400)
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "userId",
      "message": "userId is required"
    },
    {
      "field": "type",
      "message": "type must be one of: match, like, superlike, rizz, connection, message, system"
    }
  ]
}
```

---

### 2. Get User Notifications

**Endpoint:** `GET /api/notifications`  
**Authentication:** JWT Required  
**Description:** Retrieve notifications for the authenticated user

#### Query Parameters
```
limit=20          // Number of notifications to return (default: 20, max: 100)
offset=0          // Number of notifications to skip (default: 0)
type=match        // Filter by notification type (optional)
isRead=false      // Filter by read status (optional)
priority=high     // Filter by priority (optional)
since=2025-08-01  // Filter notifications since date (optional)
```

#### Example Request
```bash
GET /api/notifications?limit=10&offset=0&type=match&isRead=false
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "Notifications retrieved successfully",
  "data": {
    "notifications": [
      {
        "id": "64f1234567890abcdef12345",
        "userId": "user123",
        "type": "match",
        "title": "New Match!",
        "message": "You have a new match with Sarah",
        "priority": "normal",
        "isRead": false,
        "data": {
          "matchId": "match456",
          "profileImage": "https://example.com/image.jpg",
          "matchName": "Sarah"
        },
        "createdAt": "2025-08-01T19:00:00.000Z",
        "readAt": null
      },
      {
        "id": "64f1234567890abcdef12346",
        "userId": "user123",
        "type": "like",
        "title": "Someone Liked You!",
        "message": "You received a like from Emma",
        "priority": "normal",
        "isRead": true,
        "data": {
          "likerId": "user789",
          "likerName": "Emma"
        },
        "createdAt": "2025-08-01T18:30:00.000Z",
        "readAt": "2025-08-01T18:45:00.000Z"
      }
    ],
    "pagination": {
      "total": 45,
      "limit": 10,
      "offset": 0,
      "hasMore": true
    },
    "summary": {
      "unreadCount": 12,
      "totalCount": 45
    }
  }
}
```

---

### 3. Get Single Notification

**Endpoint:** `GET /api/notifications/{notificationId}`  
**Authentication:** JWT Required  
**Description:** Retrieve a specific notification

#### Success Response (200)
```json
{
  "success": true,
  "message": "Notification retrieved successfully",
  "data": {
    "id": "64f1234567890abcdef12345",
    "userId": "user123",
    "type": "match",
    "title": "New Match!",
    "message": "You have a new match with Sarah",
    "priority": "normal",
    "isRead": false,
    "data": {
      "matchId": "match456",
      "profileImage": "https://example.com/image.jpg",
      "matchName": "Sarah"
    },
    "channels": {
      "push": true,
      "email": false,
      "sms": false,
      "websocket": true
    },
    "delivery": {
      "push": { "sent": true, "sentAt": "2025-08-01T19:00:05.000Z", "error": null },
      "websocket": { "sent": true, "sentAt": "2025-08-01T19:00:00.000Z" }
    },
    "createdAt": "2025-08-01T19:00:00.000Z",
    "updatedAt": "2025-08-01T19:00:05.000Z",
    "readAt": null,
    "expiresAt": "2025-08-31T19:00:00.000Z"
  }
}
```

#### Error Response (404)
```json
{
  "success": false,
  "message": "Notification not found"
}
```

---

### 4. Mark Notification as Read

**Endpoint:** `PUT /api/notifications/{notificationId}/read`  
**Authentication:** JWT Required  
**Description:** Mark a notification as read

#### Success Response (200)
```json
{
  "success": true,
  "message": "Notification marked as read",
  "data": {
    "id": "64f1234567890abcdef12345",
    "isRead": true,
    "readAt": "2025-08-01T19:15:00.000Z",
    "updatedAt": "2025-08-01T19:15:00.000Z"
  }
}
```

---

### 5. Mark All Notifications as Read

**Endpoint:** `PUT /api/notifications/read-all`  
**Authentication:** JWT Required  
**Description:** Mark all notifications as read for the authenticated user

#### Request Payload (Optional)
```json
{
  "type": "match",        // Optional: only mark specific type as read
  "olderThan": "2025-08-01T00:00:00.000Z"  // Optional: only mark older notifications
}
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "All notifications marked as read",
  "data": {
    "updatedCount": 12,
    "unreadCount": 0
  }
}
```

---

### 6. Delete Notification

**Endpoint:** `DELETE /api/notifications/{notificationId}`  
**Authentication:** JWT Required  
**Description:** Delete a specific notification

#### Success Response (200)
```json
{
  "success": true,
  "message": "Notification deleted successfully"
}
```

---

### 7. Get Notification Statistics

**Endpoint:** `GET /api/notifications/stats`  
**Authentication:** JWT Required  
**Description:** Get notification statistics for the authenticated user

#### Success Response (200)
```json
{
  "success": true,
  "message": "Notification statistics retrieved successfully",
  "data": {
    "total": 45,
    "unread": 12,
    "byType": {
      "match": 15,
      "like": 20,
      "superlike": 5,
      "message": 3,
      "system": 2
    },
    "byPriority": {
      "low": 10,
      "normal": 30,
      "high": 4,
      "urgent": 1
    },
    "thisWeek": 8,
    "thisMonth": 25
  }
}
```

---

## Settings Endpoints

### 1. Get Public Settings

**Endpoint:** `GET /api/settings`  
**Authentication:** None Required  
**Description:** Get publicly accessible settings

#### Query Parameters
```
category=notifications  // Filter by category (optional)
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "Settings retrieved successfully",
  "data": {
    "notifications.types": [
      "match", "like", "superlike", "rizz", 
      "connection", "message", "system"
    ],
    "notifications.priorities": [
      "low", "normal", "high", "urgent"
    ],
    "notifications.maxRetries": 3,
    "server.version": "1.0.0",
    "features.pushNotifications": true,
    "features.emailNotifications": true
  }
}
```

---

### 2. Get User Preferences

**Endpoint:** `GET /api/settings/preferences`  
**Authentication:** JWT Required  
**Description:** Get notification preferences for the authenticated user

#### Success Response (200)
```json
{
  "success": true,
  "message": "User preferences retrieved successfully",
  "data": {
    "userId": "user123",
    "preferences": {
      "emailNotifications": true,
      "pushNotifications": true,
      "smsNotifications": false,
      "websocketNotifications": true,
      "notificationTypes": {
        "matches": true,
        "likes": true,
        "superLikes": true,
        "messages": true,
        "rizz": false,
        "connections": true,
        "system": true
      },
      "quiet_hours": {
        "enabled": true,
        "start": "22:00",
        "end": "08:00",
        "timezone": "America/New_York"
      },
      "frequency": {
        "email": "immediate",
        "push": "immediate"
      },
      "language": "en",
      "sound": "default"
    },
    "createdAt": "2025-07-01T10:00:00.000Z",
    "updatedAt": "2025-08-01T15:30:00.000Z"
  }
}
```

---

### 3. Update User Preferences

**Endpoint:** `PUT /api/settings/preferences`  
**Authentication:** JWT Required  
**Description:** Update notification preferences for the authenticated user

#### Request Payload
```json
{
  "emailNotifications": false,
  "pushNotifications": true,
  "notificationTypes": {
    "matches": true,
    "likes": false,
    "messages": true
  },
  "quiet_hours": {
    "enabled": true,
    "start": "23:00",
    "end": "07:00"
  },
  "frequency": {
    "email": "daily",
    "push": "immediate"
  }
}
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "User preferences updated successfully",
  "data": {
    "userId": "user123",
    "preferences": {
      "emailNotifications": false,
      "pushNotifications": true,
      "smsNotifications": false,
      "websocketNotifications": true,
      "notificationTypes": {
        "matches": true,
        "likes": false,
        "superLikes": true,
        "messages": true,
        "rizz": false,
        "connections": true,
        "system": true
      },
      "quiet_hours": {
        "enabled": true,
        "start": "23:00",
        "end": "07:00",
        "timezone": "America/New_York"
      },
      "frequency": {
        "email": "daily",
        "push": "immediate"
      },
      "language": "en",
      "sound": "default"
    },
    "updatedAt": "2025-08-01T19:30:00.000Z"
  }
}
```

---

## Analytics Endpoints

### 1. Get User Analytics

**Endpoint:** `GET /api/analytics`  
**Authentication:** JWT Required  
**Description:** Get notification analytics for the authenticated user

#### Query Parameters
```
timeRange=7d     // Time range: 1h, 24h, 7d, 30d (default: 7d)
type=match       // Filter by notification type (optional)
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "Analytics retrieved successfully",
  "data": {
    "timeRange": "7d",
    "summary": {
      "totalNotifications": 25,
      "readNotifications": 20,
      "unreadNotifications": 5,
      "readRate": 80.0
    },
    "byType": {
      "match": { "total": 8, "read": 7, "unread": 1 },
      "like": { "total": 12, "read": 10, "unread": 2 },
      "message": { "total": 3, "read": 2, "unread": 1 },
      "system": { "total": 2, "read": 1, "unread": 1 }
    },
    "byDay": [
      { "date": "2025-07-26", "total": 4, "read": 3 },
      { "date": "2025-07-27", "total": 6, "read": 5 },
      { "date": "2025-07-28", "total": 3, "read": 3 },
      { "date": "2025-07-29", "total": 2, "read": 2 },
      { "date": "2025-07-30", "total": 5, "read": 4 },
      { "date": "2025-07-31", "total": 3, "read": 2 },
      { "date": "2025-08-01", "total": 2, "read": 1 }
    ],
    "engagement": {
      "averageReadTime": "2.5 minutes",
      "mostActiveHour": 14,
      "mostActiveDay": "Friday"
    }
  }
}
```

---

### 2. Get Metrics

**Endpoint:** `GET /api/metrics`  
**Authentication:** JWT Required  
**Description:** Get system metrics for the authenticated user

#### Query Parameters
```
category=notifications  // Metric category (optional)
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "Metrics retrieved successfully",
  "data": {
    "user": {
      "totalNotifications": 125,
      "thisMonth": 45,
      "thisWeek": 12,
      "today": 3,
      "averageDaily": 4.2
    },
    "performance": {
      "averageDeliveryTime": "150ms",
      "successRate": 99.2,
      "failureRate": 0.8
    },
    "engagement": {
      "readRate": 85.4,
      "clickThroughRate": 12.3,
      "averageTimeToRead": "3.2 minutes"
    }
  }
}
```

---

## Health Endpoints

### 1. Basic Health Check

**Endpoint:** `GET /api/health`  
**Authentication:** None Required  
**Description:** Basic health check for the service

#### Success Response (200)
```json
{
  "success": true,
  "message": "Service is healthy",
  "data": {
    "status": "healthy",
    "uptime": "2:30:45",
    "timestamp": "2025-08-01T19:30:00.000Z",
    "version": "1.0.0",
    "database": "connected",
    "redis": "connected"
  }
}
```

#### Unhealthy Response (503)
```json
{
  "success": false,
  "message": "Service is unhealthy",
  "data": {
    "status": "unhealthy",
    "uptime": "2:30:45",
    "timestamp": "2025-08-01T19:30:00.000Z",
    "version": "1.0.0",
    "database": "disconnected",
    "redis": "connected",
    "errors": [
      "MongoDB connection failed"
    ]
  }
}
```

---

## Admin Endpoints

### 1. Get System Statistics

**Endpoint:** `GET /api/admin/stats`  
**Authentication:** Admin API Key Required  
**Description:** Get comprehensive system statistics

#### Success Response (200)
```json
{
  "success": true,
  "message": "System statistics retrieved successfully",
  "data": {
    "system": {
      "uptime": "5 days, 12:30:45",
      "version": "1.0.0",
      "nodeVersion": "v16.20.0",
      "environment": "production",
      "memory": {
        "used": "256MB",
        "free": "768MB",
        "total": "1GB",
        "percentage": 25.0
      },
      "cpu": {
        "usage": "15%",
        "load": [0.5, 0.3, 0.2]
      }
    },
    "database": {
      "status": "connected",
      "connections": 8,
      "responseTime": "12ms",
      "collections": {
        "notifications": 125430,
        "settings": 45,
        "users": 8920
      }
    },
    "redis": {
      "status": "connected",
      "memory": "64MB",
      "keys": 1250,
      "hitRate": 94.5
    },
    "notifications": {
      "total": 125430,
      "today": 1250,
      "thisWeek": 8420,
      "thisMonth": 35600,
      "pending": 15,
      "failed": 23,
      "successRate": 99.8
    },
    "users": {
      "total": 8920,
      "active": 2340,
      "activeToday": 890
    },
    "performance": {
      "averageResponseTime": "45ms",
      "requestsPerSecond": 125,
      "errorRate": 0.02
    }
  }
}
```

---

### 2. Send Mass Notification

**Endpoint:** `POST /api/admin/notifications/mass-send`  
**Authentication:** Admin API Key Required  
**Description:** Send notifications to multiple users

#### Request Payload
```json
{
  "title": "System Maintenance",
  "message": "The app will be under maintenance from 2-4 AM EST",
  "type": "system",
  "priority": "high",
  "data": {
    "maintenanceStart": "2025-08-02T02:00:00.000Z",
    "maintenanceEnd": "2025-08-02T04:00:00.000Z",
    "affectedServices": ["matching", "messaging"]
  },
  "targetUsers": {
    "userIds": ["user1", "user2", "user3"],
    "criteria": {
      "location": "US",
      "active": true,
      "lastLogin": "2025-07-01"
    },
    "exclude": ["user4", "user5"]
  },
  "channels": {
    "push": true,
    "email": true,
    "sms": false,
    "websocket": true
  },
  "scheduling": {
    "sendAt": "2025-08-02T01:00:00.000Z"
  },
  "metadata": {
    "source": "admin_panel",
    "campaign": "maintenance_2025_08_02"
  }
}
```

#### Success Response (201)
```json
{
  "success": true,
  "message": "Mass notification initiated successfully",
  "data": {
    "batchId": "batch_64f1234567890abcdef12345",
    "targetCount": 1250,
    "estimatedDelivery": "2025-08-02T01:05:00.000Z",
    "status": "scheduled",
    "preview": {
      "title": "System Maintenance",
      "message": "The app will be under maintenance from 2-4 AM EST",
      "type": "system",
      "priority": "high"
    },
    "targeting": {
      "userIds": 3,
      "criteria": 1247,
      "excluded": 2,
      "total": 1250
    },
    "channels": {
      "push": 1250,
      "email": 1250,
      "sms": 0,
      "websocket": 1250
    }
  }
}
```

---

### 3. Get User Notifications (Admin)

**Endpoint:** `GET /api/admin/users/{userId}/notifications`  
**Authentication:** Admin API Key Required  
**Description:** Get notifications for a specific user

#### Query Parameters
```
limit=50         // Number of notifications (default: 50, max: 100)
offset=0         // Offset for pagination
type=match       // Filter by type (optional)
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "User notifications retrieved successfully",
  "data": {
    "userId": "user123",
    "notifications": [
      {
        "id": "64f1234567890abcdef12345",
        "type": "match",
        "title": "New Match!",
        "message": "You have a new match with Sarah",
        "priority": "normal",
        "isRead": false,
        "createdAt": "2025-08-01T19:00:00.000Z",
        "delivery": {
          "push": { "sent": true, "sentAt": "2025-08-01T19:00:05.000Z" },
          "websocket": { "sent": true, "sentAt": "2025-08-01T19:00:00.000Z" }
        }
      }
    ],
    "pagination": {
      "total": 45,
      "limit": 50,
      "offset": 0,
      "hasMore": false
    },
    "summary": {
      "total": 45,
      "unread": 12,
      "byType": {
        "match": 15,
        "like": 20,
        "message": 10
      }
    }
  }
}
```

---

### 4. Force Send Notification

**Endpoint:** `POST /api/admin/notifications/{notificationId}/force-send`  
**Authentication:** Admin API Key Required  
**Description:** Force resend a failed notification

#### Success Response (200)
```json
{
  "success": true,
  "message": "Notification resent successfully",
  "data": {
    "notificationId": "64f1234567890abcdef12345",
    "resendAttempt": 2,
    "delivery": {
      "push": { "sent": true, "sentAt": "2025-08-01T19:30:00.000Z", "error": null },
      "email": { "sent": false, "sentAt": null, "error": "SMTP timeout" }
    },
    "status": "partially_delivered"
  }
}
```

---

### 5. Admin Settings Management

#### Get All Settings
**Endpoint:** `GET /api/admin/settings`  
**Authentication:** Admin API Key Required

#### Query Parameters
```
category=server     // Filter by category (optional)
publicOnly=false    // Show only public settings (optional)
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "Settings retrieved successfully",
  "data": {
    "server.port": 3001,
    "server.host": "0.0.0.0",
    "server.maxConnections": 1000,
    "notifications.defaultPriority": "normal",
    "notifications.maxRetries": 3,
    "redis.host": "localhost",
    "redis.port": 6379,
    "features.pushNotifications": true,
    "features.emailNotifications": true,
    "rateLimit.maxRequests": 100,
    "rateLimit.windowMs": 900000
  }
}
```

#### Create Setting
**Endpoint:** `POST /api/admin/settings`  
**Authentication:** Admin API Key Required

#### Request Payload
```json
{
  "key": "feature.newFeatureEnabled",
  "value": true,
  "category": "features",
  "description": "Enable the new dating feature",
  "isPublic": false
}
```

#### Success Response (201)
```json
{
  "success": true,
  "message": "Setting created successfully",
  "data": {
    "key": "feature.newFeatureEnabled",
    "value": true,
    "type": "boolean",
    "category": "features",
    "description": "Enable the new dating feature",
    "isPublic": false,
    "isEditable": true,
    "validation": {
      "required": false,
      "enum": []
    },
    "metadata": {
      "createdBy": "admin",
      "version": 1
    },
    "createdAt": "2025-08-01T19:30:00.000Z",
    "updatedAt": "2025-08-01T19:30:00.000Z"
  }
}
```

#### Update Setting
**Endpoint:** `PUT /api/admin/settings/{key}`  
**Authentication:** Admin API Key Required

#### Request Payload
```json
{
  "value": false,
  "description": "Updated description"
}
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "Setting updated successfully",
  "data": {
    "key": "feature.newFeatureEnabled",
    "value": false,
    "type": "boolean",
    "category": "features",
    "description": "Updated description",
    "isPublic": false,
    "isEditable": true,
    "metadata": {
      "createdBy": "admin",
      "version": 1,
      "lastModifiedBy": "admin",
      "lastModifiedAt": "2025-08-01T19:35:00.000Z"
    },
    "updatedAt": "2025-08-01T19:35:00.000Z"
  }
}
```

#### Delete Setting
**Endpoint:** `DELETE /api/admin/settings/{key}`  
**Authentication:** Admin API Key Required

#### Success Response (200)
```json
{
  "success": true,
  "message": "Setting deleted successfully"
}
```

#### Bulk Update Settings
**Endpoint:** `POST /api/admin/settings/bulk`  
**Authentication:** Admin API Key Required

#### Request Payload
```json
{
  "settings": {
    "server.maxConnections": 1500,
    "server.timeout": 30000,
    "notifications.maxRetries": 5
  },
  "category": "server"
}
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "Settings updated successfully",
  "data": {
    "updated": 3,
    "settings": [
      {
        "key": "server.maxConnections",
        "value": 1500,
        "success": true,
        "result": { "updatedAt": "2025-08-01T19:40:00.000Z" }
      },
      {
        "key": "server.timeout",
        "value": 30000,
        "success": true,
        "result": { "updatedAt": "2025-08-01T19:40:00.000Z" }
      },
      {
        "key": "notifications.maxRetries",
        "value": 5,
        "success": true,
        "result": { "updatedAt": "2025-08-01T19:40:00.000Z" }
      }
    ]
  }
}
```

---

### 6. Cache Management

**Endpoint:** `POST /api/admin/cache/clear`  
**Authentication:** Admin API Key Required  
**Description:** Clear application cache

#### Request Payload
```json
{
  "pattern": "user:*",    // Clear specific pattern (optional)
  "clearAll": false       // Clear entire cache (optional)
}
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "Cache cleared successfully",
  "data": {
    "clearedKeys": 145,
    "pattern": "user:*",
    "timestamp": "2025-08-01T19:45:00.000Z"
  }
}
```

---

### 7. Notification Cleanup

**Endpoint:** `POST /api/admin/notifications/cleanup`  
**Authentication:** Admin API Key Required  
**Description:** Clean up old notifications

#### Request Payload
```json
{
  "olderThanDays": 90,
  "keepRead": false,
  "dryRun": false,
  "types": ["system", "promotional"]
}
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "Cleanup completed successfully",
  "data": {
    "deletedCount": 1250,
    "olderThanDays": 90,
    "keepRead": false,
    "dryRun": false,
    "deletedByType": {
      "system": 450,
      "promotional": 800
    },
    "totalSizeSaved": "15.2MB",
    "executionTime": "2.3s"
  }
}
```

---

### 8. Get System Logs

**Endpoint:** `GET /api/admin/logs`  
**Authentication:** Admin API Key Required  
**Description:** Retrieve system logs

#### Query Parameters
```
level=error      // Filter by log level: error, warn, info, debug
limit=100        // Number of log entries (default: 100, max: 1000)
offset=0         // Offset for pagination
since=2025-08-01 // Filter logs since date
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "Logs retrieved successfully",
  "data": {
    "logs": [
      {
        "timestamp": "2025-08-01T19:45:30.123Z",
        "level": "error",
        "message": "Failed to send push notification",
        "meta": {
          "userId": "user123",
          "notificationId": "64f1234567890abcdef12345",
          "error": "Device token invalid"
        }
      },
      {
        "timestamp": "2025-08-01T19:44:15.456Z",
        "level": "warn",
        "message": "High memory usage detected",
        "meta": {
          "memoryUsage": "85%",
          "threshold": "80%"
        }
      }
    ],
    "pagination": {
      "total": 1250,
      "limit": 100,
      "offset": 0,
      "hasMore": true
    }
  }
}
```

---

## Test Endpoints

### 1. Create Test Notifications

**Endpoint:** `POST /api/test/notifications`  
**Authentication:** JWT Required (Development Only)  
**Description:** Create test notifications for development

#### Request Payload
```json
{
  "count": 10,
  "types": ["match", "like", "message"],
  "userId": "testuser123"
}
```

#### Success Response (201)
```json
{
  "success": true,
  "message": "Test notifications created successfully",
  "data": {
    "created": 10,
    "notifications": [
      {
        "id": "64f1234567890abcdef12345",
        "type": "match",
        "title": "Test Match Notification",
        "userId": "testuser123"
      }
    ]
  }
}
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

### Client → Server Events

#### Join User Room
```javascript
socket.emit('join', {
  userId: 'user123',
  preferences: {
    realtime: true,
    types: ['match', 'like', 'message']
  }
});

// Response
{
  "event": "joined",
  "room": "user:user123",
  "timestamp": "2025-08-01T19:50:00.000Z"
}
```

#### Mark Notification as Read
```javascript
socket.emit('markAsRead', {
  notificationId: '64f1234567890abcdef12345'
});

// Response
{
  "event": "marked_read",
  "notificationId": "64f1234567890abcdef12345",
  "timestamp": "2025-08-01T19:50:00.000Z"
}
```

#### Request Notification History
```javascript
socket.emit('getHistory', {
  limit: 20,
  offset: 0,
  type: 'match'
});

// Response
{
  "event": "history",
  "data": {
    "notifications": [...],
    "pagination": {...}
  }
}
```

### Server → Client Events

#### New Notification
```javascript
socket.on('notification', (data) => {
  console.log('New notification:', data);
});

// Event Data
{
  "event": "notification",
  "data": {
    "id": "64f1234567890abcdef12345",
    "type": "match",
    "title": "New Match!",
    "message": "You have a new match with Sarah",
    "priority": "normal",
    "data": {
      "matchId": "match456",
      "profileImage": "https://example.com/image.jpg"
    },
    "timestamp": "2025-08-01T19:50:00.000Z"
  }
}
```

#### Notification Update
```javascript
socket.on('notificationUpdate', (data) => {
  console.log('Notification updated:', data);
});

// Event Data
{
  "event": "notificationUpdate",
  "data": {
    "id": "64f1234567890abcdef12345",
    "isRead": true,
    "readAt": "2025-08-01T19:50:00.000Z"
  }
}
```

#### System Announcements
```javascript
socket.on('systemAnnouncement', (data) => {
  console.log('System announcement:', data);
});

// Event Data
{
  "event": "systemAnnouncement",
  "data": {
    "type": "maintenance",
    "title": "Scheduled Maintenance",
    "message": "System will be down for maintenance",
    "startTime": "2025-08-02T02:00:00.000Z",
    "endTime": "2025-08-02T04:00:00.000Z"
  }
}
```

---

## Error Responses

### Standard Error Format
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message (development only)",
  "code": "ERROR_CODE",
  "timestamp": "2025-08-01T19:50:00.000Z",
  "path": "/api/notifications",
  "requestId": "req_123456789"
}
```

### Common Error Codes

#### 400 - Bad Request
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "userId",
      "message": "userId is required",
      "value": null
    },
    {
      "field": "type",
      "message": "type must be one of: match, like, superlike, rizz, connection, message, system",
      "value": "invalid_type"
    }
  ],
  "code": "VALIDATION_ERROR"
}
```

#### 401 - Unauthorized
```json
{
  "success": false,
  "message": "Authentication required",
  "code": "UNAUTHORIZED",
  "details": "JWT token missing or invalid"
}
```

#### 403 - Forbidden
```json
{
  "success": false,
  "message": "Access denied",
  "code": "FORBIDDEN",
  "details": "Admin privileges required"
}
```

#### 404 - Not Found
```json
{
  "success": false,
  "message": "Notification not found",
  "code": "NOT_FOUND",
  "details": "Notification with ID '64f1234567890abcdef12345' does not exist"
}
```

#### 429 - Rate Limited
```json
{
  "success": false,
  "message": "Rate limit exceeded",
  "code": "RATE_LIMITED",
  "details": "Too many requests. Try again in 15 minutes",
  "retryAfter": 900
}
```

#### 500 - Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error",
  "code": "INTERNAL_ERROR",
  "details": "An unexpected error occurred"
}
```

---

## Rate Limiting

### Default Limits
- **General API**: 100 requests per 15 minutes per IP
- **Admin API**: 1000 requests per 15 minutes per API key
- **WebSocket connections**: 50 connections per IP
- **Notification creation**: 10 notifications per minute per user

### Rate Limit Headers
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1691785200
X-RateLimit-Window: 900
```

### Rate Limit Exceeded Response
```json
{
  "success": false,
  "message": "Rate limit exceeded",
  "code": "RATE_LIMITED",
  "details": "Too many requests. Limit: 100 per 15 minutes",
  "retryAfter": 900,
  "limit": 100,
  "remaining": 0,
  "resetTime": "2025-08-01T20:00:00.000Z"
}
```

---

This API reference provides complete documentation for all endpoints with request/response examples. Each endpoint includes authentication requirements, payload formats, and comprehensive response examples including error cases.
