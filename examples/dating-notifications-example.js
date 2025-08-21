// Complete example: How to integrate notifications into your dating app
const NotificationClient = require('../src/clients/notificationClient');

class DatingNotificationService {
    constructor() {
        this.notificationClient = new NotificationClient({
            serviceName: 'dating-app-service',
            debug: true
        });
    }

    /**
     * Send a like notification with robust metadata
     */
    async sendLikeNotification(likedUserId, likerInfo, likeContext) {
        try {
            const notification = {
                userId: likedUserId,
                title: "Someone likes you! ❤️",
                message: `${likerInfo.name} liked your profile. Check them out!`,
                type: 'like',
                priority: 'normal',
                metadata: {
                    // Core like data
                    likeId: likeContext.like_id,
                    likerId: likerInfo.user_id,
                    likerName: likerInfo.name,
                    likerProfilePicture: likerInfo.profile_picture,
                    
                    // Liker demographics
                    likerAge: likerInfo.age,
                    likerLocation: `${likerInfo.city}, ${likerInfo.state}`,
                    likerOccupation: likerInfo.occupation,
                    likerEducation: likerInfo.education,
                    
                    // Compatibility & social proof
                    compatibilityScore: likeContext.compatibility_score,
                    mutualFriends: likeContext.mutual_friends_count,
                    mutualInterests: likeContext.mutual_interests,
                    mutualFollows: likeContext.mutual_follows,
                    
                    // Like context
                    likeType: likeContext.like_type, // 'regular', 'super_like', 'boost'
                    likeSource: likeContext.source, // 'discovery', 'search', 'recommendations'
                    likeTimestamp: new Date().toISOString(),
                    isReciprocal: likeContext.is_reciprocal,
                    
                    // User behavior insights
                    likerActivityLevel: likerInfo.activity_level,
                    likerResponseRate: likerInfo.response_rate,
                    likerVerificationStatus: likerInfo.verification_status,
                    
                    // Personalization data
                    suggestedIceBreakers: likeContext.suggested_ice_breakers,
                    commonTopics: likeContext.common_topics,
                    profileStrength: likeContext.profile_strength_match,
                    
                    // System context
                    deviceInfo: likeContext.device_info,
                    sessionId: likeContext.session_id,
                    experimentGroup: likeContext.experiment_group,
                    
                    // Action URLs
                    actionUrls: {
                        viewProfile: `/profiles/${likerInfo.user_id}`,
                        likeBack: `/users/${likerInfo.user_id}/like`,
                        superLikeBack: `/users/${likerInfo.user_id}/super-like`,
                        viewMutualFriends: `/users/${likerInfo.user_id}/mutual-friends`,
                        startConversation: `/conversations/start/${likerInfo.user_id}`
                    }
                },
                channels: {
                    push: true,
                    email: likeContext.recipient_email_notifications,
                    websocket: true,
                    inApp: true
                }
            };

            const result = await this.notificationClient.createNotification(notification);
            console.log('✅ Like notification sent:', result.notification.id);
            return result;
        } catch (error) {
            console.error('❌ Failed to send like notification:', error);
            throw error;
        }
    }

    /**
     * Send a match notification with comprehensive metadata
     */
    async sendMatchNotification(userId, matchInfo) {
        try {
            const notification = {
                userId: userId,
                title: "It's a Match! 💕",
                message: `You and ${matchInfo.partner_name} liked each other!`,
                type: 'match',
                priority: 'high',
                metadata: {
                    // Core match data
                    matchId: matchInfo.match_id,
                    partnerId: matchInfo.partner_id,
                    partnerName: matchInfo.partner_name,
                    partnerProfilePicture: matchInfo.partner_profile_picture,
                    
                    // Partner demographics
                    partnerAge: matchInfo.partner_age,
                    partnerLocation: `${matchInfo.partner_city}, ${matchInfo.partner_state}`,
                    partnerOccupation: matchInfo.partner_occupation,
                    partnerEducation: matchInfo.partner_education,
                    partnerBio: matchInfo.partner_bio?.substring(0, 200),
                    
                    // Match quality indicators
                    compatibilityScore: matchInfo.compatibility_score,
                    matchScore: matchInfo.match_score,
                    personalityMatch: matchInfo.personality_match_percentage,
                    interestAlignment: matchInfo.interest_alignment_score,
                    
                    // Social connections
                    mutualFriends: matchInfo.mutual_friends_count,
                    mutualInterests: matchInfo.mutual_interests,
                    mutualFollows: matchInfo.mutual_follows,
                    commonActivities: matchInfo.common_activities,
                    
                    // Match context
                    matchType: matchInfo.match_type, // 'regular', 'super_match', 'boost_match'
                    matchSource: matchInfo.source, // 'discovery', 'search', 'recommendations'
                    matchTimestamp: new Date().toISOString(),
                    timeToMatch: matchInfo.time_to_match_hours,
                    
                    // Conversation starters
                    suggestedIceBreakers: matchInfo.suggested_ice_breakers,
                    conversationStarters: matchInfo.conversation_starters,
                    commonTopics: matchInfo.common_topics,
                    sharedExperiences: matchInfo.shared_experiences,
                    
                    // User milestones
                    isFirstMatch: matchInfo.is_first_match_for_user,
                    userMatchCount: matchInfo.user_total_matches,
                    partnerMatchCount: matchInfo.partner_total_matches,
                    
                    // Premium features
                    isPremiumMatch: matchInfo.is_premium_match,
                    boostUsed: matchInfo.boost_used,
                    superLikeInvolved: matchInfo.super_like_involved,
                    
                    // Geographic context
                    distanceKm: matchInfo.distance_km,
                    sameCity: matchInfo.same_city,
                    sameNeighborhood: matchInfo.same_neighborhood,
                    
                    // Timing insights
                    optimalMessageTime: matchInfo.optimal_message_time,
                    partnerActiveHours: matchInfo.partner_active_hours,
                    responseRatePrediction: matchInfo.response_rate_prediction,
                    
                    // Action URLs
                    actionUrls: {
                        startConversation: `/conversations/start/${matchInfo.partner_id}`,
                        viewFullProfile: `/profiles/${matchInfo.partner_id}/full`,
                        sendGif: `/conversations/${matchInfo.partner_id}/gif`,
                        planDate: `/dates/plan/${matchInfo.partner_id}`,
                        viewMutualFriends: `/users/${matchInfo.partner_id}/mutual-friends`
                    }
                },
                channels: {
                    push: true,
                    email: matchInfo.user_email_notifications,
                    websocket: true,
                    inApp: true
                }
            };

            const result = await this.notificationClient.createNotification(notification);
            console.log('✅ Match notification sent:', result.notification.id);
            return result;
        } catch (error) {
            console.error('❌ Failed to send match notification:', error);
            throw error;
        }
    }

    /**
     * Send a date request notification with extensive metadata
     */
    async sendDateRequestNotification(recipientUserId, dateRequestData) {
        try {
            const notification = {
                userId: recipientUserId,
                title: `${dateRequestData.requester_name} wants to take you on a date! 💕`,
                message: `"${dateRequestData.activity}" at ${dateRequestData.venue_name}`,
                type: 'date_request',
                priority: 'high',
                metadata: {
                    // Core request data
                    dateRequestId: dateRequestData.request_id,
                    requesterId: dateRequestData.requester_id,
                    requesterName: dateRequestData.requester_name,
                    requesterProfilePicture: dateRequestData.requester_profile_picture,
                    
                    // Requester details
                    requesterAge: dateRequestData.requester_age,
                    requesterOccupation: dateRequestData.requester_occupation,
                    requesterLocation: dateRequestData.requester_location,
                    requesterVerified: dateRequestData.requester_verified,
                    requesterRating: dateRequestData.requester_rating,
                    
                    // Date proposal details
                    proposedDateTime: dateRequestData.date_time,
                    dateTimeFlexible: dateRequestData.time_flexible,
                    activity: dateRequestData.activity,
                    activityCategory: dateRequestData.activity_category,
                    estimatedDuration: dateRequestData.estimated_duration,
                    personalMessage: dateRequestData.personal_message,
                    
                    // Venue information
                    venueDetails: {
                        name: dateRequestData.venue_name,
                        address: dateRequestData.venue_address,
                        coordinates: dateRequestData.venue_coordinates,
                        rating: dateRequestData.venue_rating,
                        priceRange: dateRequestData.venue_price_range,
                        cuisine: dateRequestData.venue_cuisine,
                        ambiance: dateRequestData.venue_ambiance,
                        photos: dateRequestData.venue_photos
                    },
                    
                    // Cost and logistics
                    costEstimate: dateRequestData.cost_estimate,
                    whoPays: dateRequestData.who_pays, // 'requester', 'split', 'recipient'
                    transportationSuggested: dateRequestData.transportation,
                    parkingAvailable: dateRequestData.parking_available,
                    accessibility: dateRequestData.accessibility_features,
                    
                    // Distance and convenience
                    distanceFromRecipient: dateRequestData.distance_from_recipient_km,
                    travelTimeMinutes: dateRequestData.travel_time_minutes,
                    nearPublicTransport: dateRequestData.near_public_transport,
                    
                    // Safety and verification
                    safetyScore: dateRequestData.safety_score,
                    publicVenue: dateRequestData.is_public_venue,
                    crowdedArea: dateRequestData.is_crowded_area,
                    emergencyContacts: dateRequestData.emergency_contacts_shared,
                    backgroundCheckStatus: dateRequestData.background_check_status,
                    
                    // Match context
                    matchInfo: {
                        matchId: dateRequestData.match_id,
                        matchDate: dateRequestData.match_date,
                        daysSinceMatch: dateRequestData.days_since_match,
                        conversationQuality: dateRequestData.conversation_quality_score,
                        messageCount: dateRequestData.message_count,
                        mutualInterests: dateRequestData.mutual_interests,
                        compatibilityScore: dateRequestData.compatibility_score
                    },
                    
                    // Timing insights
                    requestCreatedAt: new Date().toISOString(),
                    expiresAt: dateRequestData.expires_at,
                    optimalResponseTime: dateRequestData.optimal_response_time,
                    requesterTimezone: dateRequestData.requester_timezone,
                    recipientTimezone: dateRequestData.recipient_timezone,
                    
                    // User preferences alignment
                    prefAlignment: {
                        activityMatch: dateRequestData.activity_preference_match,
                        priceRangeMatch: dateRequestData.price_preference_match,
                        timeMatch: dateRequestData.time_preference_match,
                        locationMatch: dateRequestData.location_preference_match,
                        durationMatch: dateRequestData.duration_preference_match
                    },
                    
                    // Previous interaction history
                    interactionHistory: {
                        previousDates: dateRequestData.previous_dates_count,
                        previousCancellations: dateRequestData.previous_cancellations,
                        averageRating: dateRequestData.average_date_rating,
                        lastInteraction: dateRequestData.last_interaction_date,
                        responsePatterns: dateRequestData.response_patterns
                    },
                    
                    // AI insights
                    aiRecommendations: {
                        shouldAccept: dateRequestData.ai_should_accept_score,
                        riskFactors: dateRequestData.ai_risk_factors,
                        compatibilityPrediction: dateRequestData.ai_compatibility_prediction,
                        conversationStarters: dateRequestData.ai_conversation_starters
                    },
                    
                    // Action URLs
                    actionUrls: {
                        accept: `/date-requests/${dateRequestData.request_id}/accept`,
                        decline: `/date-requests/${dateRequestData.request_id}/decline`,
                        counterPropose: `/date-requests/${dateRequestData.request_id}/counter`,
                        viewVenue: `/venues/${dateRequestData.venue_id}`,
                        viewProfile: `/profiles/${dateRequestData.requester_id}`,
                        safetyTips: '/safety/date-tips',
                        reportConcern: `/date-requests/${dateRequestData.request_id}/report`
                    }
                },
                channels: {
                    push: true,
                    email: dateRequestData.recipient_email_notifications,
                    websocket: true,
                    inApp: true
                },
                // Set expiration for date request notifications
                expiresAt: dateRequestData.expires_at
            };

            const result = await this.notificationClient.createNotification(notification);
            console.log('✅ Date request notification sent:', result.notification.id);
            return result;
        } catch (error) {
            console.error('❌ Failed to send date request notification:', error);
            throw error;
        }
    }
}

module.exports = DatingNotificationService;

// Test runner and example usage
async function runTests() {
    console.log('🚀 Starting Dating Notifications Test Suite...\n');
    
    const datingNotifications = new DatingNotificationService();
    
    try {
        // Test 1: Like Notification
        console.log('📝 Test 1: Sending Like Notification');
        await testLikeNotification(datingNotifications);
        console.log('');
        
        // Test 2: Match Notification
        console.log('📝 Test 2: Sending Match Notification');
        await testMatchNotification(datingNotifications);
        console.log('');
        
        // Test 3: Date Request Notification
        console.log('📝 Test 3: Sending Date Request Notification');
        await testDateRequestNotification(datingNotifications);
        console.log('');
        
        console.log('✅ All tests completed successfully!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        process.exit(1);
    }
}

async function testLikeNotification(service) {
    const likedUserId = '8e580844-4053-4f60-9549-5722c0c41e13';
    const likerInfo = {
        user_id: 'user_0a18a61423efa8f3a6dba414437328f7',
        name: 'Sarah Johnson',
        profile_picture: 'https://example.com/sarah.jpg',
        age: 28,
        city: 'New York',
        state: 'NY',
        occupation: 'Software Engineer',
        education: 'Masters in Computer Science',
        activity_level: 'high',
        response_rate: 0.85,
        verification_status: 'verified'
    };
    
    const likeContext = {
        like_id: 'like_' + Date.now(),
        compatibility_score: 85,
        mutual_friends_count: 3,
        mutual_interests: ['hiking', 'photography', 'cooking'],
        mutual_follows: 2,
        like_type: 'super_like',
        source: 'discovery',
        is_reciprocal: false,
        suggested_ice_breakers: [
            "I noticed you love hiking too! What's your favorite trail?",
            "Your photography skills are amazing! What camera do you use?"
        ],
        common_topics: ['travel', 'food', 'technology'],
        profile_strength_match: 92,
        device_info: { platform: 'iOS', version: '15.0' },
        session_id: 'session_' + Date.now(),
        experiment_group: 'control',
        recipient_email_notifications: true
    };
    
    const result = await service.sendLikeNotification(likedUserId, likerInfo, likeContext);
    console.log(`   ✅ Like notification sent with ID: ${result.notification.id}`);
    return result;
}

async function testMatchNotification(service) {
    const userId = '8e580844-4053-4f60-9549-5722c0c41e13';
    const matchInfo = {
        match_id: 'match_' + Date.now(),
        partner_id: 'user_0a18a61423efa8f3a6dba414437328f7',
        partner_name: 'Alex Thompson',
        partner_profile_picture: 'https://example.com/alex.jpg',
        partner_age: 30,
        partner_city: 'San Francisco',
        partner_state: 'CA',
        partner_occupation: 'Product Manager',
        partner_education: 'MBA',
        partner_bio: 'Love exploring new restaurants and weekend adventures. Always up for a good conversation about tech and travel.',
        
        // Match quality
        compatibility_score: 92,
        match_score: 88,
        personality_match_percentage: 85,
        interest_alignment_score: 90,
        
        // Social connections
        mutual_friends_count: 5,
        mutual_interests: ['travel', 'food', 'hiking', 'technology'],
        mutual_follows: 3,
        common_activities: ['rock climbing', 'wine tasting'],
        
        // Match context
        match_type: 'super_match',
        source: 'discovery',
        time_to_match_hours: 2.5,
        
        // Conversation aids
        suggested_ice_breakers: [
            "I see we both love hiking! Have you been to Yosemite?",
            "Your travel photos are amazing! What's your favorite destination?"
        ],
        conversation_starters: [
            "Ask about their recent trip to Japan",
            "Mention the mutual friend Emma"
        ],
        common_topics: ['startup culture', 'sustainable travel', 'food photography'],
        shared_experiences: ['both lived in NYC', 'both attended tech conferences'],
        
        // Milestones
        is_first_match_for_user: false,
        user_total_matches: 12,
        partner_total_matches: 8,
        
        // Premium
        is_premium_match: true,
        boost_used: false,
        super_like_involved: true,
        
        // Geography
        distance_km: 15,
        same_city: true,
        same_neighborhood: false,
        
        // Timing
        optimal_message_time: '2025-08-21T19:00:00Z',
        partner_active_hours: ['18:00-22:00'],
        response_rate_prediction: 0.78,
        
        user_email_notifications: true
    };
    
    const result = await service.sendMatchNotification(userId, matchInfo);
    console.log(`   ✅ Match notification sent with ID: ${result.notification.id}`);
    return result;
}

async function testDateRequestNotification(service) {
    const recipientUserId = '8e580844-4053-4f60-9549-5722c0c41e13';
    const dateRequestData = {
        request_id: 'date_req_' + Date.now(),
        requester_id: 'user_0a18a61423efa8f3a6dba414437328f7',
        requester_name: 'Jordan Martinez',
        requester_profile_picture: 'https://example.com/jordan.jpg',
        requester_age: 29,
        requester_occupation: 'UX Designer',
        requester_location: 'Downtown SF',
        requester_verified: true,
        requester_rating: 4.8,
        
        // Date details
        date_time: '2025-08-25T19:30:00Z',
        time_flexible: true,
        activity: 'Dinner at Italian Restaurant',
        activity_category: 'dining',
        estimated_duration: '2 hours',
        personal_message: 'I found this amazing Italian place with great reviews. Would love to take you there!',
        
        // Venue details
        venue_name: 'Bella Vista Ristorante',
        venue_address: '123 Market Street, San Francisco, CA',
        venue_coordinates: { lat: 37.7749, lng: -122.4194 },
        venue_rating: 4.5,
        venue_price_range: '$$',
        venue_cuisine: 'Italian',
        venue_ambiance: 'romantic, cozy',
        venue_photos: ['https://example.com/venue1.jpg'],
        venue_id: 'venue_123',
        
        // Logistics
        cost_estimate: '$60-80 per person',
        who_pays: 'requester',
        transportation: 'ride share recommended',
        parking_available: true,
        accessibility_features: ['wheelchair accessible'],
        
        // Distance
        distance_from_recipient_km: 8,
        travel_time_minutes: 25,
        near_public_transport: true,
        
        // Safety
        safety_score: 9.2,
        is_public_venue: true,
        is_crowded_area: true,
        emergency_contacts_shared: false,
        background_check_status: 'verified',
        
        // Match context
        match_id: 'match_previous_123',
        match_date: '2025-08-15T00:00:00Z',
        days_since_match: 6,
        conversation_quality_score: 8.5,
        message_count: 24,
        mutual_interests: ['food', 'art', 'travel'],
        compatibility_score: 87,
        
        // Timing
        expires_at: '2025-08-23T23:59:59Z',
        optimal_response_time: '24 hours',
        requester_timezone: 'America/Los_Angeles',
        recipient_timezone: 'America/Los_Angeles',
        
        // Preferences
        activity_preference_match: 85,
        price_preference_match: 90,
        time_preference_match: 80,
        location_preference_match: 95,
        duration_preference_match: 88,
        
        // History
        previous_dates_count: 0,
        previous_cancellations: 0,
        average_date_rating: null,
        last_interaction_date: '2025-08-21T10:30:00Z',
        response_patterns: 'typically responds within 2 hours',
        
        // AI insights
        ai_should_accept_score: 82,
        ai_risk_factors: ['none detected'],
        ai_compatibility_prediction: 'high',
        ai_conversation_starters: [
            'Ask about their favorite Italian dish',
            'Mention the restaurant\'s wine selection'
        ],
        
        recipient_email_notifications: true
    };
    
    const result = await service.sendDateRequestNotification(recipientUserId, dateRequestData);
    console.log(`   ✅ Date request notification sent with ID: ${result.notification.id}`);
    return result;
}

// Quick test function for individual notification types
async function quickTest(type = 'all') {
    const service = new DatingNotificationService();
    
    try {
        switch (type.toLowerCase()) {
            case 'like':
                await testLikeNotification(service);
                break;
            case 'match':
                await testMatchNotification(service);
                break;
            case 'date':
            case 'date_request':
                await testDateRequestNotification(service);
                break;
            case 'all':
            default:
                await runTests();
                break;
        }
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Export test functions
module.exports.runTests = runTests;
module.exports.quickTest = quickTest;
module.exports.testLikeNotification = testLikeNotification;
module.exports.testMatchNotification = testMatchNotification;
module.exports.testDateRequestNotification = testDateRequestNotification;

// Run tests if file is executed directly
if (require.main === module) {
    const testType = process.argv[2] || 'all';
    quickTest(testType).catch(console.error);
}
