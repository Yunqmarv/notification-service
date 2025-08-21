const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    notificationId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    userId: {
        type: String,
        required: true,
        index: true
    },
    title: {
        type: String,
        required: true,
        maxlength: 200
    },
    message: {
        type: String,
        required: true,
        maxlength: 1000
    },
    type: {
        type: String,
        required: true,
        enum: [
            'message', 'match', 'like', 'superlike', 'rizz', 'connection',
            'system', 'promotional', 'reminder', 'update', 'alert',
            'warning', 'error', 'success', 'info', 'achievement',
            'event', 'social', 'payment', 'security', 'maintenance',
            // Date-related notification types
            'date_request', 'date_accepted', 'date_declined', 'date_canceled', 'date_reminder'
        ],
        index: true
    },
    priority: {
        type: String,
        enum: ['low', 'normal', 'high', 'urgent'],
        default: 'normal',
        index: true
    },
    status: {
        type: String,
        enum: ['pending', 'sent', 'delivered', 'read', 'failed'],
        default: 'pending',
        index: true
    },
    readStatus: {
        type: Boolean,
        default: false,
        index: true
    },
    readAt: {
        type: Date,
        default: null
    },
    deliveredAt: {
        type: Date,
        default: null
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    channels: {
        push: {
            enabled: { type: Boolean, default: true },
            sent: { type: Boolean, default: false },
            sentAt: Date,
            messageId: String,
            error: String
        },
        email: {
            enabled: { type: Boolean, default: false },
            sent: { type: Boolean, default: false },
            sentAt: Date,
            messageId: String,
            error: String
        },
        sms: {
            enabled: { type: Boolean, default: false },
            sent: { type: Boolean, default: false },
            sentAt: Date,
            messageId: String,
            error: String
        },
        websocket: {
            enabled: { type: Boolean, default: true },
            sent: { type: Boolean, default: false },
            sentAt: Date,
            error: String
        },
        inApp: {
            enabled: { type: Boolean, default: true },
            sent: { type: Boolean, default: true },
            sentAt: { type: Date, default: Date.now }
        }
    },
    scheduling: {
        scheduledFor: Date,
        timezone: String,
        recurring: {
            enabled: { type: Boolean, default: false },
            pattern: String, // cron pattern
            endDate: Date
        }
    },
    analytics: {
        impressions: { type: Number, default: 0 },
        clicks: { type: Number, default: 0 },
        interactions: [{
            type: String,
            timestamp: { type: Date, default: Date.now },
            metadata: mongoose.Schema.Types.Mixed
        }],
        deliveryAttempts: { type: Number, default: 0 },
        lastDeliveryAttempt: Date
    },
    grouping: {
        groupId: String,
        batchId: String,
        campaignId: String
    },
    expiresAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true,
    versionKey: false
});

// Indexes for performance
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, type: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, readStatus: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, status: 1, createdAt: -1 });
notificationSchema.index({ status: 1, 'scheduling.scheduledFor': 1 });
notificationSchema.index({ 'grouping.groupId': 1 });
notificationSchema.index({ 'grouping.batchId': 1 });
notificationSchema.index({ 'grouping.campaignId': 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
notificationSchema.index({ 'metadata.relatedUserId': 1 });
notificationSchema.index({ priority: 1, createdAt: -1 });

// Virtual for formatted notification
notificationSchema.virtual('formattedNotification').get(function() {
    return {
        id: this.notificationId,
        userId: this.userId,
        title: this.title,
        message: this.message,
        type: this.type,
        priority: this.priority,
        status: this.status,
        read: this.readStatus,
        readAt: this.readAt,
        deliveredAt: this.deliveredAt,
        metadata: this.metadata,
        channels: this.channels,
        analytics: this.analytics,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
        timeAgo: this.getTimeAgo()
    };
});

// Methods
notificationSchema.methods.markAsRead = function() {
    this.readStatus = true;
    this.readAt = new Date();
    this.status = 'read';
    return this.save();
};

notificationSchema.methods.markAsDelivered = function() {
    this.deliveredAt = new Date();
    if (this.status === 'pending' || this.status === 'sent') {
        this.status = 'delivered';
    }
    return this.save();
};

notificationSchema.methods.incrementImpression = function() {
    this.analytics.impressions += 1;
    this.analytics.interactions.push({
        type: 'impression',
        timestamp: new Date()
    });
    return this.save();
};

notificationSchema.methods.incrementClick = function(metadata = {}) {
    this.analytics.clicks += 1;
    this.analytics.interactions.push({
        type: 'click',
        timestamp: new Date(),
        metadata
    });
    return this.save();
};

notificationSchema.methods.getTimeAgo = function() {
    const now = new Date();
    const diff = now - this.createdAt;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
};

notificationSchema.methods.toJSON = function() {
    return this.formattedNotification;
};

// Statics
notificationSchema.statics.getUserNotifications = function(userId, options = {}) {
    const {
        type,
        read,
        status,
        priority,
        limit = 20,
        offset = 0,
        sort = '-createdAt',
        startDate,
        endDate
    } = options;
    
    const query = { userId };
    
    if (type) query.type = type;
    if (read !== undefined) query.readStatus = read;
    if (status) query.status = status;
    if (priority) query.priority = priority;
    
    if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    return this.find(query)
        .sort(sort)
        .limit(limit)
        .skip(offset)
        .lean();
};

notificationSchema.statics.getUnreadCount = function(userId, type = null) {
    const query = { userId, readStatus: false };
    if (type) query.type = type;
    return this.countDocuments(query);
};

notificationSchema.statics.markAllAsRead = function(userId, type = null) {
    const query = { userId, readStatus: false };
    if (type) query.type = type;
    
    return this.updateMany(query, {
        $set: {
            readStatus: true,
            readAt: new Date(),
            status: 'read'
        }
    });
};

notificationSchema.statics.getNotificationsByGroup = function(groupId, options = {}) {
    const { limit = 50, offset = 0, sort = '-createdAt' } = options;
    
    return this.find({ 'grouping.groupId': groupId })
        .sort(sort)
        .limit(limit)
        .skip(offset)
        .lean();
};

notificationSchema.statics.getAnalytics = function(userId, options = {}) {
    const {
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        endDate = new Date(),
        groupBy = 'day'
    } = options;
    
    const pipeline = [
        {
            $match: {
                userId,
                createdAt: { $gte: startDate, $lte: endDate }
            }
        },
        {
            $group: {
                _id: {
                    type: '$type',
                    date: {
                        $dateToString: {
                            format: groupBy === 'hour' ? '%Y-%m-%d %H' : '%Y-%m-%d',
                            date: '$createdAt'
                        }
                    }
                },
                count: { $sum: 1 },
                read: { $sum: { $cond: ['$readStatus', 1, 0] } },
                unread: { $sum: { $cond: ['$readStatus', 0, 1] } },
                impressions: { $sum: '$analytics.impressions' },
                clicks: { $sum: '$analytics.clicks' }
            }
        },
        {
            $sort: { '_id.date': 1, '_id.type': 1 }
        }
    ];
    
    return this.aggregate(pipeline);
};

notificationSchema.statics.cleanupExpired = function() {
    return this.deleteMany({
        expiresAt: { $lt: new Date() }
    });
};

notificationSchema.statics.getGroupedByType = function(userId, options = {}) {
    const { includeRead = false, limit = 10 } = options;
    
    const pipeline = [
        {
            $match: {
                userId,
                ...(includeRead ? {} : { readStatus: false })
            }
        },
        {
            $sort: { createdAt: -1 }
        },
        {
            $group: {
                _id: '$type',
                latestNotification: { $first: '$$ROOT' },
                count: { $sum: 1 },
                unreadCount: { $sum: { $cond: ['$readStatus', 0, 1] } }
            }
        },
        {
            $limit: limit
        },
        {
            $project: {
                type: '$_id',
                notification: '$latestNotification',
                count: 1,
                unreadCount: 1,
                hasUnread: { $gt: ['$unreadCount', 0] }
            }
        }
    ];
    
    return this.aggregate(pipeline);
};

module.exports = mongoose.model('Notification', notificationSchema);
