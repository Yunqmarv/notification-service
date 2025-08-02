const Notification = require('../models/Notification');
const Logger = require('../utils/logger');
const CacheService = require('./cache');

class AnalyticsService {
    constructor() {
        this.metricsCache = new Map();
    }

    async getOverview(timeRange = '24h', userId = null) {
        const cacheKey = `analytics:overview:${timeRange}:${userId || 'all'}`;
        const cached = await CacheService.get(cacheKey);
        
        if (cached) {
            return cached;
        }

        const timeRangeMs = this.parseTimeRange(timeRange);
        const startDate = new Date(Date.now() - timeRangeMs);
        
        const filter = {
            createdAt: { $gte: startDate }
        };
        
        if (userId) {
            filter.userId = userId;
        }

        const [
            totalNotifications,
            readNotifications,
            sentNotifications,
            failedNotifications,
            typeDistribution
        ] = await Promise.all([
            Notification.countDocuments(filter),
            Notification.countDocuments({ ...filter, read: true }),
            Notification.countDocuments({ ...filter, status: 'sent' }),
            Notification.countDocuments({ ...filter, status: 'failed' }),
            this.getTypeDistributionQuery(filter)
        ]);

        const overview = {
            timeRange,
            totalNotifications,
            readNotifications,
            unreadNotifications: totalNotifications - readNotifications,
            sentNotifications,
            failedNotifications,
            readRate: totalNotifications > 0 ? (readNotifications / totalNotifications * 100).toFixed(2) : 0,
            deliveryRate: totalNotifications > 0 ? (sentNotifications / totalNotifications * 100).toFixed(2) : 0,
            typeDistribution,
            generatedAt: new Date().toISOString()
        };

        // Cache for 5 minutes
        await CacheService.set(cacheKey, overview, 300);
        
        return overview;
    }

    async getNotificationTrends(options = {}) {
        const { timeRange = '7d', groupBy = 'day', type, userId } = options;
        
        const timeRangeMs = this.parseTimeRange(timeRange);
        const startDate = new Date(Date.now() - timeRangeMs);
        
        const matchStage = {
            createdAt: { $gte: startDate }
        };
        
        if (type) matchStage.type = type;
        if (userId) matchStage.userId = userId;

        const groupFormat = this.getGroupFormat(groupBy);
        
        const pipeline = [
            { $match: matchStage },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: groupFormat,
                            date: '$createdAt'
                        }
                    },
                    count: { $sum: 1 },
                    read: { $sum: { $cond: ['$read', 1, 0] } },
                    sent: { $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] } },
                    failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } }
                }
            },
            { $sort: { _id: 1 } }
        ];

        const trends = await Notification.aggregate(pipeline);
        
        return {
            timeRange,
            groupBy,
            trends: trends.map(trend => ({
                period: trend._id,
                total: trend.count,
                read: trend.read,
                sent: trend.sent,
                failed: trend.failed,
                readRate: trend.count > 0 ? (trend.read / trend.count * 100).toFixed(2) : 0
            }))
        };
    }

    async getDeliveryStats(options = {}) {
        const { timeRange = '24h', channel } = options;
        
        const timeRangeMs = this.parseTimeRange(timeRange);
        const startDate = new Date(Date.now() - timeRangeMs);
        
        const filter = {
            createdAt: { $gte: startDate }
        };

        const pipeline = [
            { $match: filter },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 }
                }
            }
        ];

        const statusStats = await Notification.aggregate(pipeline);
        
        const stats = {
            timeRange,
            totalAttempts: 0,
            successful: 0,
            failed: 0,
            pending: 0,
            statusBreakdown: {}
        };

        statusStats.forEach(stat => {
            stats.totalAttempts += stat.count;
            stats.statusBreakdown[stat._id] = stat.count;
            
            switch (stat._id) {
                case 'sent':
                case 'delivered':
                    stats.successful += stat.count;
                    break;
                case 'failed':
                    stats.failed += stat.count;
                    break;
                case 'pending':
                    stats.pending += stat.count;
                    break;
            }
        });

        stats.successRate = stats.totalAttempts > 0 ? 
            (stats.successful / stats.totalAttempts * 100).toFixed(2) : 0;
        
        return stats;
    }

    async getUserEngagement(options = {}) {
        const { timeRange = '7d', userId } = options;
        
        const timeRangeMs = this.parseTimeRange(timeRange);
        const startDate = new Date(Date.now() - timeRangeMs);
        
        const filter = {
            createdAt: { $gte: startDate }
        };
        
        if (userId) {
            filter.userId = userId;
        }

        const pipeline = [
            { $match: filter },
            {
                $group: {
                    _id: '$userId',
                    totalNotifications: { $sum: 1 },
                    readNotifications: { $sum: { $cond: ['$read', 1, 0] } },
                    lastActivity: { $max: '$updatedAt' }
                }
            },
            {
                $project: {
                    userId: '$_id',
                    totalNotifications: 1,
                    readNotifications: 1,
                    unreadNotifications: { $subtract: ['$totalNotifications', '$readNotifications'] },
                    engagementRate: {
                        $cond: [
                            { $gt: ['$totalNotifications', 0] },
                            { $multiply: [{ $divide: ['$readNotifications', '$totalNotifications'] }, 100] },
                            0
                        ]
                    },
                    lastActivity: 1
                }
            },
            { $sort: { engagementRate: -1 } }
        ];

        const engagement = await Notification.aggregate(pipeline);
        
        return {
            timeRange,
            userCount: engagement.length,
            averageEngagementRate: engagement.length > 0 ? 
                (engagement.reduce((sum, user) => sum + user.engagementRate, 0) / engagement.length).toFixed(2) : 0,
            users: engagement
        };
    }

    async getPerformanceMetrics(timeRange = '1h') {
        // This would typically integrate with system monitoring
        // For now, return basic Node.js metrics
        const memUsage = process.memoryUsage();
        
        return {
            timeRange,
            memory: {
                used: Math.round(memUsage.heapUsed / 1024 / 1024),
                total: Math.round(memUsage.heapTotal / 1024 / 1024),
                rss: Math.round(memUsage.rss / 1024 / 1024)
            },
            uptime: process.uptime(),
            cpuUsage: process.cpuUsage(),
            platform: process.platform,
            nodeVersion: process.version,
            generatedAt: new Date().toISOString()
        };
    }

    async getDailyReport(date = null) {
        const targetDate = date ? new Date(date) : new Date();
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);

        const filter = {
            createdAt: { $gte: startOfDay, $lte: endOfDay }
        };

        const [overview, trends, topTypes] = await Promise.all([
            this.getOverview('24h'),
            this.getNotificationTrends({ timeRange: '24h', groupBy: 'hour' }),
            this.getTopNotificationTypes(filter)
        ]);

        return {
            date: targetDate.toISOString().split('T')[0],
            overview,
            hourlyTrends: trends.trends,
            topNotificationTypes: topTypes,
            generatedAt: new Date().toISOString()
        };
    }

    async getTypeDistribution(options = {}) {
        const { timeRange = '7d', userId } = options;
        
        const timeRangeMs = this.parseTimeRange(timeRange);
        const startDate = new Date(Date.now() - timeRangeMs);
        
        const filter = {
            createdAt: { $gte: startDate }
        };
        
        if (userId) {
            filter.userId = userId;
        }

        return await this.getTypeDistributionQuery(filter);
    }

    async getCacheStats() {
        // This would integrate with Redis to get actual cache stats
        // For now, return mock data
        return {
            hits: 1250,
            misses: 150,
            hitRate: 89.3,
            totalKeys: 450,
            memoryUsage: '25MB',
            generatedAt: new Date().toISOString()
        };
    }

    async exportData(options = {}) {
        const { format = 'json', timeRange = '7d', includeUserData = false } = options;
        
        const overview = await this.getOverview(timeRange);
        const trends = await this.getNotificationTrends({ timeRange });
        const typeDistribution = await this.getTypeDistribution({ timeRange });
        
        const exportData = {
            overview,
            trends: trends.trends,
            typeDistribution,
            exportedAt: new Date().toISOString(),
            timeRange
        };

        if (includeUserData) {
            exportData.userEngagement = await this.getUserEngagement({ timeRange });
        }

        // For now, just return JSON. In a real implementation,
        // you'd convert to CSV/XLSX based on format parameter
        return JSON.stringify(exportData, null, 2);
    }

    async getSystemStats() {
        const memUsage = process.memoryUsage();
        
        return {
            system: {
                uptime: process.uptime(),
                memory: {
                    used: Math.round(memUsage.heapUsed / 1024 / 1024),
                    total: Math.round(memUsage.heapTotal / 1024 / 1024)
                },
                nodeVersion: process.version,
                platform: process.platform
            },
            notifications: await this.getOverview('24h'),
            generatedAt: new Date().toISOString()
        };
    }

    async getSystemHealth() {
        return {
            status: 'healthy',
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            timestamp: new Date().toISOString()
        };
    }

    async getActiveUsers(timeRange = '24h') {
        const timeRangeMs = this.parseTimeRange(timeRange);
        const startDate = new Date(Date.now() - timeRangeMs);
        
        const activeUsers = await Notification.distinct('userId', {
            createdAt: { $gte: startDate }
        });

        return {
            timeRange,
            activeUserCount: activeUsers.length,
            users: activeUsers
        };
    }

    // Helper methods
    parseTimeRange(timeRange) {
        const timeRanges = {
            '1h': 60 * 60 * 1000,
            '24h': 24 * 60 * 60 * 1000,
            '7d': 7 * 24 * 60 * 60 * 1000,
            '30d': 30 * 24 * 60 * 60 * 1000,
            '90d': 90 * 24 * 60 * 60 * 1000,
            '365d': 365 * 24 * 60 * 60 * 1000
        };
        
        return timeRanges[timeRange] || timeRanges['24h'];
    }

    getGroupFormat(groupBy) {
        const formats = {
            hour: '%Y-%m-%d %H:00',
            day: '%Y-%m-%d',
            week: '%Y-%U',
            month: '%Y-%m'
        };
        
        return formats[groupBy] || formats.day;
    }

    async getTypeDistributionQuery(filter) {
        const pipeline = [
            { $match: filter },
            {
                $group: {
                    _id: '$type',
                    count: { $sum: 1 },
                    read: { $sum: { $cond: ['$read', 1, 0] } }
                }
            },
            { $sort: { count: -1 } }
        ];

        const distribution = await Notification.aggregate(pipeline);
        
        return distribution.map(item => ({
            type: item._id,
            count: item.count,
            readCount: item.read,
            readRate: item.count > 0 ? (item.read / item.count * 100).toFixed(2) : 0
        }));
    }

    async getTopNotificationTypes(filter, limit = 10) {
        const pipeline = [
            { $match: filter },
            {
                $group: {
                    _id: '$type',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
            { $limit: limit }
        ];

        const topTypes = await Notification.aggregate(pipeline);
        
        return topTypes.map(item => ({
            type: item._id,
            count: item.count
        }));
    }
}

module.exports = new AnalyticsService();
