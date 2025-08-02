#!/usr/bin/env node

// Comprehensive test script for creating robust notifications with detailed metadata
const jwt = require('jsonwebtoken');
const axios = require('axios');

// JWT Configuration - Using the actual secret from your database
const JWT_SECRET = 'your-super-secret-jwt-key-change-this-in-production';
const API_BASE = 'http://localhost:3001';

// Create test token with the correct secret
const testPayload = {
    userId: 'user_cd67c8dcf653ae77445dea77f18396c8',
    role: 'user',
    email: 'payment@eniola.ng'
};

const token = jwt.sign(testPayload, JWT_SECRET, { expiresIn: '24h' });
console.log('Using JWT secret from database/fallback. Generated token:', token);

// Comprehensive notification data with robust metadata
const notifications = [
    {
        title: "New Match Found! 💕",
        message: "You have a new match with Sarah Mitchell! She's 24, loves hiking and photography. Start chatting now!",
        type: "match",
        priority: "high",
        metadata: {
            matchId: "match_67890",
            targetUserId: "user_sarah_mitchell_456",
            targetUser: {
                name: "Sarah Mitchell",
                age: 24,
                location: "San Francisco, CA",
                avatar: "https://example.com/avatars/sarah_456.jpg",
                verified: true,
                premium: false,
                lastActive: "2025-08-01T04:30:00.000Z"
            },
            compatibility: {
                score: 92,
                commonInterests: ["hiking", "photography", "traveling", "coffee"],
                mutualFriends: 3,
                distance: "2.4 miles"
            },
            algorithm: {
                version: "v2.3.1",
                factors: ["interests", "location", "age_preference", "activity_level"],
                confidence: 0.89
            },
            tags: ["new_match", "high_compatibility", "verified_user"],
            actionButtons: [
                { text: "View Profile", action: "view_profile", url: "/profile/user_sarah_mitchell_456" },
                { text: "Send Message", action: "start_chat", url: "/chat/match_67890" }
            ],
            tracking: {
                campaign: "smart_matching_v2",
                source: "algorithm_suggestion",
                medium: "push_notification"
            }
        },
        channels: {
            push: { enabled: true, template: "match_found" },
            email: { enabled: true, template: "new_match_email" },
            inApp: { enabled: true, template: "match_card" },
            websocket: { enabled: true, event: "new_match" }
        }
    },
    // {
    //     title: "Someone liked your photo! 👍",
    //     message: "Alex Rodriguez liked your beach vacation photo from last weekend. Check out their profile!",
    //     type: "like",
    //     priority: "normal",
    //     metadata: {
    //         likeId: "like_12345",
    //         fromUserId: "user_alex_rodriguez_789",
    //         fromUser: {
    //             name: "Alex Rodriguez",
    //             age: 28,
    //             location: "Oakland, CA",
    //             avatar: "https://example.com/avatars/alex_789.jpg",
    //             verified: false,
    //             premium: true,
    //             lastActive: "2025-08-01T05:10:00.000Z"
    //         },
    //         targetPhoto: {
    //             photoId: "photo_beach_vacation_2024",
    //             url: "https://example.com/photos/beach_vacation.jpg",
    //             uploadDate: "2025-07-28T10:30:00.000Z",
    //             likes: 47,
    //             caption: "Perfect weekend at Santa Monica Beach! 🏖️"
    //         },
    //         engagement: {
    //             totalLikes: 48,
    //             newLikesToday: 5,
    //             profileViews: 23,
    //             recentActivity: "increased_engagement"
    //         },
    //         tags: ["photo_like", "potential_match", "premium_user"],
    //         actionButtons: [
    //             { text: "Like Back", action: "like_back", userId: "user_alex_rodriguez_789" },
    //             { text: "View Profile", action: "view_profile", url: "/profile/user_alex_rodriguez_789" }
    //         ],
    //         tracking: {
    //             photoEngagement: true,
    //             likeSource: "photo_swipe",
    //             userBehavior: "active_liker"
    //         }
    //     }
    // },
    // {
    //     title: "Super Like! ⭐",
    //     message: "Emma Johnson sent you a Super Like! She really wants to connect with you.",
    //     type: "superlike",
    //     priority: "urgent",
    //     metadata: {
    //         superLikeId: "superlike_54321",
    //         fromUserId: "user_emma_johnson_321",
    //         fromUser: {
    //             name: "Emma Johnson",
    //             age: 26,
    //             location: "Berkeley, CA",
    //             avatar: "https://example.com/avatars/emma_321.jpg",
    //             verified: true,
    //             premium: true,
    //             lastActive: "2025-08-01T05:05:00.000Z",
    //             badges: ["verified", "premium", "top_pick"]
    //         },
    //         superLikeDetails: {
    //             message: "Love your hiking photos! We should explore Mt. Tamalpais together! 🥾",
    //             timestamp: "2025-08-01T05:12:30.000Z",
    //             remainingSuperLikes: 4,
    //             isPremiumSuperLike: true
    //         },
    //         compatibility: {
    //             score: 87,
    //             commonInterests: ["hiking", "rock_climbing", "yoga", "sustainable_living"],
    //             mutualFriends: 1,
    //             distance: "3.8 miles"
    //         },
    //         tags: ["super_like", "premium_user", "verified", "high_intent"],
    //         actionButtons: [
    //             { text: "Super Like Back", action: "super_like_back", userId: "user_emma_johnson_321" },
    //             { text: "Message Her", action: "start_chat", special: true },
    //             { text: "View Profile", action: "view_profile", url: "/profile/user_emma_johnson_321" }
    //         ],
    //         priorityBoost: {
    //             enabled: true,
    //             duration: "24h",
    //             reason: "super_like_received"
    //         }
    //     }
    // },
    // {
    //     title: "You got Rizzed! 🔥",
    //     message: "Marcus Williams sent you a Rizz! His charm level is off the charts. Respond with your best rizz!",
    //     type: "rizz",
    //     priority: "high",
    //     metadata: {
    //         rizzId: "rizz_98765",
    //         fromUserId: "user_marcus_williams_654",
    //         fromUser: {
    //             name: "Marcus Williams",
    //             age: 29,
    //             location: "San Jose, CA",
    //             avatar: "https://example.com/avatars/marcus_654.jpg",
    //             verified: false,
    //             premium: false,
    //             rizzScore: 94,
    //             lastActive: "2025-08-01T05:08:00.000Z"
    //         },
    //         rizzContent: {
    //             message: "Are you a magician? Because whenever I look at your photos, everyone else disappears! ✨",
    //             rizzLevel: "legendary",
    //             category: "compliment",
    //             originalityScore: 0.78,
    //             timestamp: "2025-08-01T05:13:45.000Z"
    //         },
    //         gameElements: {
    //             challenge: "rizz_battle",
    //             pointsAwarded: 150,
    //             streakBonus: 50,
    //             leaderboard: {
    //                 userRank: 23,
    //                 cityRank: 156,
    //                 rizzRating: "🔥 Fire"
    //             }
    //         },
    //         tags: ["rizz_received", "high_scorer", "game_element"],
    //         actionButtons: [
    //             { text: "Rizz Back", action: "send_rizz", special: true },
    //             { text: "Like Profile", action: "like_profile", userId: "user_marcus_williams_654" },
    //             { text: "Start Chat", action: "start_conversation", gamified: true }
    //         ],
    //         tracking: {
    //             feature: "rizz_game",
    //             engagement: "interactive_content",
    //             viral: "shareable_moment"
    //         }
    //     }
    // },
    // {
    //     title: "New Connection! 🤝",
    //     message: "You and Jessica Chen are now connected! You both swiped right. Start your conversation!",
    //     type: "connection",
    //     priority: "high",
    //     metadata: {
    //         connectionId: "connection_13579",
    //         matchUserId: "user_jessica_chen_987",
    //         matchUser: {
    //             name: "Jessica Chen",
    //             age: 25,
    //             location: "Palo Alto, CA",
    //             avatar: "https://example.com/avatars/jessica_987.jpg",
    //             verified: true,
    //             premium: true,
    //             education: "Stanford University",
    //             profession: "Software Engineer",
    //             lastActive: "2025-08-01T05:15:00.000Z"
    //         },
    //         connectionDetails: {
    //             matchDate: "2025-08-01T05:14:22.000Z",
    //             bothSwipedRight: true,
    //             timeToMatch: "2h 15m",
    //             isInstantMatch: false,
    //             conversationStarted: false
    //         },
    //         iceBreakers: [
    //             {
    //                 category: "common_interest",
    //                 text: "I see you love tech too! What's your favorite programming language?",
    //                 confidence: 0.85
    //             },
    //             {
    //                 category: "location",
    //                 text: "Fellow Bay Area explorer! What's your favorite hiking spot around here?",
    //                 confidence: 0.78
    //             },
    //             {
    //                 category: "education",
    //                 text: "Stanford alum! What was your favorite class there?",
    //                 confidence: 0.72
    //             }
    //         ],
    //         mutualConnections: {
    //             count: 2,
    //             friends: ["Mike Thompson", "Sarah Kim"]
    //         },
    //         tags: ["new_connection", "mutual_interest", "premium_match", "educated"],
    //         actionButtons: [
    //             { text: "Send Message", action: "start_chat", primary: true },
    //             { text: "View Profile", action: "view_full_profile" },
    //             { text: "Send GIF", action: "send_gif", fun: true }
    //         ]
    //     }
    // },
    // {
    //     title: "System Update Available 🔄",
    //     message: "New features available! Enhanced matching algorithm and video calls are now live. Update now for the best experience.",
    //     type: "system",
    //     priority: "normal",
    //     metadata: {
    //         updateId: "update_v2.4.0",
    //         version: {
    //             current: "2.3.8",
    //             available: "2.4.0",
    //             releaseDate: "2025-08-01T00:00:00.000Z",
    //             isRequired: false,
    //             isCritical: false
    //         },
    //         features: [
    //             {
    //                 name: "Enhanced Matching Algorithm",
    //                 description: "30% more accurate matches based on deeper personality analysis",
    //                 icon: "🎯",
    //                 category: "matching"
    //             },
    //             {
    //                 name: "Video Call Feature",
    //                 description: "Connect face-to-face before meeting in person",
    //                 icon: "📹",
    //                 category: "communication",
    //                 beta: true
    //             },
    //             {
    //                 name: "Profile Verification 2.0",
    //                 description: "Enhanced verification with AI-powered photo authentication",
    //                 icon: "✅",
    //                 category: "safety"
    //             }
    //         ],
    //         bugFixes: [
    //             "Fixed notification delay issues",
    //             "Improved app performance on older devices",
    //             "Enhanced photo upload quality"
    //         ],
    //         systemHealth: {
    //             status: "optimal",
    //             uptime: "99.9%",
    //             averageResponseTime: "120ms",
    //             lastMaintenance: "2025-07-28T02:00:00.000Z"
    //         },
    //         tags: ["system_update", "new_features", "optional_update"],
    //         actionButtons: [
    //             { text: "Update Now", action: "app_update", primary: true },
    //             { text: "Learn More", action: "view_changelog", url: "/changelog/v2.4.0" },
    //             { text: "Remind Later", action: "snooze_update", duration: "24h" }
    //         ]
    //     }
    // },
    // {
    //     title: "Special Promotion! 💎",
    //     message: "Limited time: Get 50% off Premium Plus! Unlock unlimited likes, see who liked you, and boost your profile visibility.",
    //     type: "promotional",
    //     priority: "normal",
    //     metadata: {
    //         promoId: "promo_premium_50off_summer2024",
    //         offer: {
    //             type: "percentage_discount",
    //             value: 50,
    //             originalPrice: 29.99,
    //             discountedPrice: 14.99,
    //             currency: "USD",
    //             validUntil: "2025-08-07T23:59:59.000Z",
    //             isLimitedTime: true,
    //             usageLimit: 1
    //         },
    //         targetSegment: {
    //             userType: "free_user",
    //             engagementLevel: "high",
    //             likesGiven: 45,
    //             profileViews: 67,
    //             daysSinceSignup: 14
    //         },
    //         premiumFeatures: [
    //             {
    //                 name: "Unlimited Likes",
    //                 description: "Like as many profiles as you want",
    //                 icon: "💝",
    //                 value: "high"
    //             },
    //             {
    //                 name: "See Who Liked You",
    //                 description: "View all users who already liked your profile",
    //                 icon: "👀",
    //                 value: "high"
    //             },
    //             {
    //                 name: "Profile Boost",
    //                 description: "Get 10x more profile views for 30 minutes",
    //                 icon: "🚀",
    //                 value: "medium"
    //             },
    //             {
    //                 name: "Advanced Filters",
    //                 description: "Filter by education, profession, and lifestyle",
    //                 icon: "🎯",
    //                 value: "medium"
    //             }
    //         ],
    //         analytics: {
    //             campaign: "summer_promotion_2024",
    //             segment: "high_engagement_free_users",
    //             expectedConversion: 0.12,
    //             abTest: "variant_b"
    //         },
    //         tags: ["promotion", "premium_upgrade", "limited_time", "discount"],
    //         actionButtons: [
    //             { text: "Claim Offer", action: "upgrade_premium", primary: true, urgent: true },
    //             { text: "Learn More", action: "view_premium_features" },
    //             { text: "Maybe Later", action: "dismiss_promo", track: true }
    //         ]
    //     }
    // },
    // {
    //     title: "Daily Reminder 📅",
    //     message: "You have 3 new profile views today! Check them out and see who's interested in getting to know you better.",
    //     type: "reminder",
    //     priority: "low",
    //     metadata: {
    //         reminderId: "reminder_daily_activity_20250801",
    //         reminderType: "daily_engagement",
    //         stats: {
    //             newProfileViews: 3,
    //             newLikes: 1,
    //             newMatches: 0,
    //             newMessages: 0,
    //             unreadMessages: 2
    //         },
    //         dailyGoals: {
    //             profileViews: { target: 5, current: 3, achieved: false },
    //             likesGiven: { target: 20, current: 12, achieved: false },
    //             messagesExchanged: { target: 3, current: 1, achieved: false },
    //             profileUpdates: { target: 1, current: 0, achieved: false }
    //         },
    //         suggestions: [
    //             {
    //                 type: "profile_improvement",
    //                 title: "Add a new photo",
    //                 description: "Profiles with 6+ photos get 40% more matches",
    //                 impact: "high",
    //                 effort: "low"
    //             },
    //             {
    //                 type: "engagement",
    //                 title: "Send 5 more likes",
    //                 description: "You're close to your daily goal!",
    //                 impact: "medium",
    //                 effort: "low"
    //             }
    //         ],
    //         streaks: {
    //             dailyLogin: { current: 7, best: 23, streak: true },
    //             weeklyActivity: { current: 3, target: 5, onTrack: true }
    //         },
    //         tags: ["daily_reminder", "activity_stats", "engagement_boost"],
    //         actionButtons: [
    //             { text: "View Profiles", action: "view_profile_views", primary: true },
    //             { text: "Update Profile", action: "edit_profile" },
    //             { text: "Start Swiping", action: "discovery_mode" }
    //         ]
    //     }
    // },
    // {
    //     title: "Profile Update Suggestion 📝",
    //     message: "Your profile could use a refresh! Users with updated bios get 60% more matches. Add your latest interests and photos.",
    //     type: "update",
    //     priority: "low",
    //     metadata: {
    //         updateId: "suggestion_profile_refresh_20250801",
    //         profileAnalysis: {
    //             lastUpdated: "2025-07-15T10:30:00.000Z",
    //             daysSinceUpdate: 17,
    //             completeness: 73,
    //             optimizationScore: 6.8,
    //             missingElements: ["recent_photos", "updated_bio", "interests_refresh"]
    //         },
    //         recommendations: [
    //             {
    //                 category: "photos",
    //                 priority: "high",
    //                 suggestion: "Add 2-3 recent photos showing your current style",
    //                 impact: "+40% profile views",
    //                 examples: ["outdoor activity", "social setting", "close-up smile"]
    //             },
    //             {
    //                 category: "bio",
    //                 priority: "medium",
    //                 suggestion: "Update your bio with current interests and goals",
    //                 impact: "+25% meaningful conversations",
    //                 tips: ["mention current hobbies", "add conversation starters", "show personality"]
    //             },
    //             {
    //                 category: "interests",
    //                 priority: "medium",
    //                 suggestion: "Refresh your interest tags",
    //                 impact: "+30% compatible matches",
    //                 trending: ["sustainability", "mindfulness", "local_exploration"]
    //             }
    //         ],
    //         benchmarks: {
    //             profileViews: { average: 15, userCurrent: 8, improvement: "87% increase possible" },
    //             matchRate: { average: 12, userCurrent: 6, improvement: "100% increase possible" },
    //             responseRate: { average: 45, userCurrent: 62, status: "above average" }
    //         },
    //         tags: ["profile_optimization", "improvement_suggestion", "low_priority"],
    //         actionButtons: [
    //             { text: "Update Profile", action: "edit_profile", primary: true },
    //             { text: "Add Photos", action: "upload_photos" },
    //             { text: "Later", action: "remind_tomorrow" }
    //         ]
    //     }
    // },
    // {
    //     title: "Achievement Unlocked! 🏆",
    //     message: "Congratulations! You've unlocked the 'Social Butterfly' achievement for connecting with 10 people this month!",
    //     type: "achievement",
    //     priority: "normal",
    //     metadata: {
    //         achievementId: "achievement_social_butterfly_level1",
    //         achievement: {
    //             name: "Social Butterfly",
    //             level: 1,
    //             description: "Connect with 10 people in a single month",
    //             icon: "🦋",
    //             category: "social",
    //             rarity: "common",
    //             pointsAwarded: 250,
    //             unlockedAt: "2025-08-01T05:16:00.000Z"
    //         },
    //         progress: {
    //             requirement: 10,
    //             completed: 10,
    //             nextLevel: {
    //                 requirement: 25,
    //                 name: "Social Butterfly Level 2",
    //                 reward: "Special badge and profile boost",
    //                 pointsReward: 500
    //             }
    //         },
    //         userStats: {
    //             totalAchievements: 8,
    //             totalPoints: 1750,
    //             rank: "Active Dater",
    //             nextRank: "Dating Pro",
    //             pointsToNextRank: 250
    //         },
    //         relatedAchievements: [
    //             {
    //                 name: "Conversation Starter",
    //                 description: "Send first message in 5 conversations",
    //                 progress: "3/5",
    //                 icon: "💬"
    //             },
    //             {
    //                 name: "Photo Perfect",
    //                 description: "Upload 6 high-quality photos",
    //                 progress: "4/6",
    //                 icon: "📸"
    //             }
    //         ],
    //         rewards: {
    //             points: 250,
    //             badge: "social_butterfly_bronze",
    //             profileBoost: { duration: "2h", multiplier: 1.5 },
    //             specialFeature: "custom_achievement_frame"
    //         },
    //         tags: ["achievement", "milestone", "gamification", "social_engagement"],
    //         actionButtons: [
    //             { text: "View Badge", action: "view_achievements", primary: true },
    //             { text: "Share Achievement", action: "share_achievement", social: true },
    //             { text: "See Progress", action: "view_stats" }
    //         ]
    //     }
    // }
];

// Function to create notifications
async function createNotifications() {
    console.log('🚀 Creating 10 robust test notifications with comprehensive metadata...\n');
    
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    for (let i = 0; i < notifications.length; i++) {
        const notification = notifications[i];
        
        try {
            console.log(`Creating notification ${i + 1}/10: ${notification.type.toUpperCase()} - ${notification.title}`);
            
            const response = await axios.post(`${API_BASE}/api/notifications`, notification, { headers });
            
            if (response.data.success) {
                console.log(`✅ Created: ${response.data.data.id}`);
                console.log(`   Type: ${notification.type}`);
                console.log(`   Priority: ${notification.priority}`);
                console.log(`   Metadata keys: ${Object.keys(notification.metadata).length}`);
                console.log('');
            } else {
                console.log(`❌ Failed: ${response.data.message}`);
            }
        } catch (error) {
            console.log(`❌ Error creating notification ${i + 1}:`, error.response?.data?.message || error.message);
        }
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('🎉 Finished creating notifications!\n');
    
    // Fetch and display summary
    try {
        const response = await axios.get(`${API_BASE}/api/notifications`, { headers });
        if (response.data.success) {
            console.log(`📊 Total notifications for user: ${response.data.data.notifications.length}`);
            console.log(`📈 Notification types created:`);
            
            const typeCounts = {};
            response.data.data.notifications.forEach(notif => {
                typeCounts[notif.type] = (typeCounts[notif.type] || 0) + 1;
            });
            
            Object.entries(typeCounts).forEach(([type, count]) => {
                console.log(`   ${type}: ${count}`);
            });
        }
    } catch (error) {
        console.log('Error fetching summary:', error.message);
    }
}

// Run the script
if (require.main === module) {
    createNotifications().catch(console.error);
}

module.exports = { createNotifications, notifications, token };
