const express = require('express');
const router = express.Router();

// Simple test routes without authentication
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'Test endpoint working',
        timestamp: new Date().toISOString()
    });
});

router.get('/test/notifications', (req, res) => {
    res.json({
        success: true,
        message: 'Notifications test endpoint working',
        data: {
            notifications: [],
            pagination: {
                total: 0,
                limit: 20,
                offset: 0,
                hasMore: false
            }
        }
    });
});

router.post('/test/notifications', (req, res) => {
    res.status(201).json({
        success: true,
        message: 'Test notification created',
        data: {
            id: '507f1f77bcf86cd799439011',
            title: req.body.title || 'Test Notification',
            message: req.body.message || 'Test message',
            type: req.body.type || 'info',
            userId: 'test-user-123',
            read: false,
            createdAt: new Date().toISOString()
        }
    });
});

module.exports = router;
