# System Notifications API

This document describes how to use the system notifications endpoint for creating notifications programmatically from other services.

## Overview

The system notifications endpoint allows internal services to create notifications without requiring JWT user authentication. Instead, it uses API key authentication for security.

## Endpoints

### Create System Notification

**POST** `/api/system/notifications`

Creates a notification for any user in the system. This endpoint is designed for internal service-to-service communication.

#### Authentication

Requires a system API key in the header:
```
x-api-key: YOUR_SYSTEM_API_KEY
```

#### Request Body

```json
{
  "userId": "user123",           // Required: Target user ID
  "title": "New Match!",         // Required: Notification title (max 200 chars)
  "message": "You have a new match with Sarah", // Required: Message (max 1000 chars)
  "type": "match",              // Required: Notification type
  "priority": "high",           // Optional: Priority level (default: normal)
  "metadata": {                 // Optional: Additional data
    "matchId": "match123",
    "profilePicture": "url"
  },
  "channels": {                 // Optional: Delivery channels
    "push": true,
    "email": true,
    "websocket": true
  },
  "scheduling": {               // Optional: Scheduling options
    "immediate": true
  }
}
```

#### Notification Types

- `message` - Direct messages
- `match` - New matches
- `like` - Likes received
- `superlike` - Super likes
- `rizz` - Rizz notifications
- `connection` - New connections
- `system` - System announcements
- `promotional` - Promotional content
- `reminder` - Reminders
- `update` - App updates
- `alert` - Important alerts
- `warning` - Warning messages
- `error` - Error notifications
- `success` - Success messages
- `info` - Informational messages
- `achievement` - Achievements unlocked
- `event` - Event notifications
- `social` - Social activity
- `payment` - Payment related
- `security` - Security alerts
- `maintenance` - Maintenance notices

#### Priority Levels

- `low` - Low priority
- `normal` - Normal priority (default)
- `high` - High priority
- `urgent` - Urgent notifications

#### Response

**Success (201):**
```json
{
  "success": true,
  "message": "Notification created successfully",
  "data": {
    "id": "notification_id",
    "userId": "user123",
    "title": "New Match!",
    "message": "You have a new match with Sarah",
    "type": "match",
    "priority": "high",
    "status": "pending",
    "read": false,
    "createdAt": "2025-08-01T10:00:00.000Z",
    "createdBy": "system"
  }
}
```

**Error (400):**
```json
{
  "success": false,
  "message": "userId is required in payload for system notifications"
}
```

**Authentication Error (401):**
```json
{
  "success": false,
  "message": "Invalid or missing system API key",
  "code": "INVALID_SYSTEM_API_KEY"
}
```

## Configuration

### Environment Variables

Set the system API key in your environment:

```bash
SYSTEM_API_KEY=your_secure_system_api_key_here
```

### Database Settings

You can also configure the API key in the database settings:

```javascript
{
  "security.systemApiKey": "your_secure_system_api_key_here"
}
```

## Usage Examples

### Node.js/Express Service

```javascript
const axios = require('axios');

async function createNotification(userId, title, message, type, options = {}) {
  try {
    const response = await axios.post('http://notifications-service:3001/api/system/notifications', {
      userId,
      title,
      message,
      type,
      priority: options.priority || 'normal',
      metadata: options.metadata || {},
      channels: options.channels || { push: true, websocket: true }
    }, {
      headers: {
        'x-api-key': process.env.SYSTEM_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  } catch (error) {
    console.error('Failed to create notification:', error.response?.data || error.message);
    throw error;
  }
}

// Usage
await createNotification(
  'user123', 
  'New Match!', 
  'You have a new match with Sarah',
  'match',
  { 
    priority: 'high',
    metadata: { matchId: 'match123' }
  }
);
```

### cURL Example

```bash
curl -X POST "http://localhost:3001/api/system/notifications" \
  -H "x-api-key: your_system_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "title": "New Match!",
    "message": "You have a new match with Sarah",
    "type": "match",
    "priority": "high",
    "metadata": {
      "matchId": "match123"
    }
  }'
```

## Security Considerations

1. **API Key Protection**: Keep your system API key secure and never expose it in client-side code
2. **Internal Use Only**: This endpoint should only be accessible from your internal network
3. **Rate Limiting**: Consider implementing rate limiting for system endpoints
4. **Audit Logging**: All system notifications are logged with the creator marked as "system"

## Differences from User Endpoint

| Feature | User Endpoint (`/api/notifications`) | System Endpoint (`/api/system/notifications`) |
|---------|-----------------------------------|-----------------------------------------------|
| Authentication | JWT Bearer token required | System API key required |
| User ID | Optional (defaults to token user) | Required in payload |
| Created By | Set to authenticated user ID | Set to "system" |
| Use Case | User creating notifications | System creating notifications |

## Documentation

Full API documentation is available at `/api-docs` when the service is running.
