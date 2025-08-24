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
     * Send a like notification with essential metadata
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
                    
                    // Basic liker info
                    likerAge: likerInfo.age,
                    likerLocation: `${likerInfo.city}, ${likerInfo.state}`,
                    likerOccupation: likerInfo.occupation,
                    
                    // Compatibility & social proof
                    compatibilityScore: likeContext.compatibility_score,
                    mutualFriends: likeContext.mutual_friends_count,
                    mutualInterests: likeContext.mutual_interests,
                    
                    // Like context
                    likeType: likeContext.like_type, // 'regular', 'super_like', 'boost'
                    likeSource: likeContext.source, // 'discovery', 'search', 'recommendations'
                    likeTimestamp: new Date().toISOString(),
                    isReciprocal: likeContext.is_reciprocal,
                    
                    // Personalization data
                    suggestedIceBreakers: likeContext.suggested_ice_breakers,
                    commonTopics: likeContext.common_topics,
                    
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
     * Send a match notification with essential metadata
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
                    
                    // Partner basic info
                    partnerAge: matchInfo.partner_age,
                    partnerLocation: `${matchInfo.partner_city}, ${matchInfo.partner_state}`,
                    partnerOccupation: matchInfo.partner_occupation,
                    partnerBio: matchInfo.partner_bio?.substring(0, 150),
                    
                    // Match quality indicators
                    compatibilityScore: matchInfo.compatibility_score,
                    matchScore: matchInfo.match_score,
                    
                    // Social connections
                    mutualFriends: matchInfo.mutual_friends_count,
                    mutualInterests: matchInfo.mutual_interests,
                    commonActivities: matchInfo.common_activities,
                    
                    // Match context
                    matchType: matchInfo.match_type, // 'regular', 'super_match', 'boost_match'
                    matchSource: matchInfo.source,
                    matchTimestamp: new Date().toISOString(),
                    
                    // Conversation starters
                    suggestedIceBreakers: matchInfo.suggested_ice_breakers,
                    commonTopics: matchInfo.common_topics,
                    
                    // Premium features
                    isPremiumMatch: matchInfo.is_premium_match,
                    superLikeInvolved: matchInfo.super_like_involved,
                    
                    // Geographic context
                    distanceKm: matchInfo.distance_km,
                    sameCity: matchInfo.same_city,
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
     * Send a super like notification with essential metadata
     */
    async sendSuperLikeNotification(likedUserId, superLikerInfo, superLikeContext) {
        try {
            const notification = {
                userId: likedUserId,
                title: "You got a Super Like! ⭐",
                message: `${superLikerInfo.name} super liked you! They're really interested.`,
                type: 'superlike',
                priority: 'high',
                metadata: {
                    // Core super like data
                    superLikeId: superLikeContext.super_like_id,
                    superLikerId: superLikerInfo.user_id,
                    superLikerName: superLikerInfo.name,
                    superLikerProfilePicture: superLikerInfo.profile_picture,
                    
                    // Basic super liker info
                    superLikerAge: superLikerInfo.age,
                    superLikerLocation: `${superLikerInfo.city}, ${superLikerInfo.state}`,
                    superLikerOccupation: superLikerInfo.occupation,
                    
                    // Compatibility & social proof
                    compatibilityScore: superLikeContext.compatibility_score,
                    mutualFriends: superLikeContext.mutual_friends_count,
                    mutualInterests: superLikeContext.mutual_interests,
                    
                    // Super like context
                    superLikeSource: superLikeContext.source,
                    superLikeTimestamp: new Date().toISOString(),
                    premiumUser: superLikeContext.is_premium_user,
                    
                    // Personalization data
                    suggestedIceBreakers: superLikeContext.suggested_ice_breakers,
                    commonTopics: superLikeContext.common_topics,
                },
                channels: {
                    push: true,
                    email: true,
                    websocket: true,
                    inApp: true
                }
            };

            const result = await this.notificationClient.createNotification(notification);
            console.log('✅ Super like notification sent:', result.notification.id);
            return result;
        } catch (error) {
            console.error('❌ Failed to send super like notification:', error);
            throw error;
        }
    }

    /**
     * Send a rizz notification with essential metadata
     */
    async sendRizzNotification(recipientUserId, rizzSenderInfo, rizzContext) {
        try {
            const notification = {
                userId: recipientUserId,
                title: "Someone's got rizz! 🔥",
                message: `${rizzSenderInfo.name} sent you some serious rizz!`,
                type: 'rizz',
                priority: 'normal',
                metadata: {
                    // Core rizz data
                    rizzId: rizzContext.rizz_id,
                    senderId: rizzSenderInfo.user_id,
                    senderName: rizzSenderInfo.name,
                    senderProfilePicture: rizzSenderInfo.profile_picture,
                    
                    // Rizz content
                    rizzMessage: rizzContext.rizz_message,
                    rizzType: rizzContext.rizz_type, // 'pickup_line', 'compliment', 'funny', 'smooth'
                    rizzRating: rizzContext.rizz_rating,
                    
                    // Sender info
                    senderAge: rizzSenderInfo.age,
                    senderLocation: `${rizzSenderInfo.city}, ${rizzSenderInfo.state}`,
                    senderOccupation: rizzSenderInfo.occupation,
                    
                    // Context
                    compatibilityScore: rizzContext.compatibility_score,
                    mutualInterests: rizzContext.mutual_interests,
                    rizzTimestamp: new Date().toISOString(),
                },
                channels: {
                    push: true,
                    email: false,
                    websocket: true,
                    inApp: true
                }
            };

            const result = await this.notificationClient.createNotification(notification);
            console.log('✅ Rizz notification sent:', result.notification.id);
            return result;
        } catch (error) {
            console.error('❌ Failed to send rizz notification:', error);
            throw error;
        }
    }

    /**
     * Send a connection request notification
     */
    async sendConnectionNotification(recipientUserId, connectionInfo) {
        try {
            const notification = {
                userId: recipientUserId,
                title: "New Connection Request 🤝",
                message: `${connectionInfo.sender_name} wants to connect with you!`,
                type: 'connection',
                priority: 'normal',
                metadata: {
                    // Connection data
                    connectionId: connectionInfo.connection_id,
                    senderId: connectionInfo.sender_id,
                    senderName: connectionInfo.sender_name,
                    senderProfilePicture: connectionInfo.sender_profile_picture,
                    
                    // Sender info
                    senderAge: connectionInfo.sender_age,
                    senderLocation: connectionInfo.sender_location,
                    senderOccupation: connectionInfo.sender_occupation,
                    senderVerified: connectionInfo.sender_verified,
                    
                    // Connection context
                    connectionType: connectionInfo.connection_type, // 'friend', 'professional', 'dating'
                    connectionReason: connectionInfo.connection_reason,
                    mutualConnections: connectionInfo.mutual_connections,
                    mutualInterests: connectionInfo.mutual_interests,
                    
                    connectionTimestamp: new Date().toISOString(),
                },
                channels: {
                    push: true,
                    email: true,
                    websocket: true,
                    inApp: true
                }
            };

            const result = await this.notificationClient.createNotification(notification);
            console.log('✅ Connection notification sent:', result.notification.id);
            return result;
        } catch (error) {
            console.error('❌ Failed to send connection notification:', error);
            throw error;
        }
    }

    /**
     * Send a system notification
     */
    async sendSystemNotification(userId, systemInfo) {
        try {
            const notification = {
                userId: userId,
                title: systemInfo.title,
                message: systemInfo.message,
                type: 'system',
                priority: systemInfo.priority || 'normal',
                metadata: {
                    systemType: systemInfo.system_type, // 'maintenance', 'update', 'announcement'
                    actionRequired: systemInfo.action_required,
                    actionUrl: systemInfo.action_url,
                    systemTimestamp: new Date().toISOString(),
                    version: systemInfo.app_version,
                    platform: systemInfo.platform,
                },
                channels: {
                    push: true,
                    email: systemInfo.send_email || false,
                    websocket: true,
                    inApp: true
                }
            };

            const result = await this.notificationClient.createNotification(notification);
            console.log('✅ System notification sent:', result.notification.id);
            return result;
        } catch (error) {
            console.error('❌ Failed to send system notification:', error);
            throw error;
        }
    }

    /**
     * Send a promotional notification
     */
    async sendPromotionalNotification(userId, promoInfo) {
        try {
            const notification = {
                userId: userId,
                title: promoInfo.title,
                message: promoInfo.message,
                type: 'promotional',
                priority: 'low',
                metadata: {
                    promoId: promoInfo.promo_id,
                    promoType: promoInfo.promo_type, // 'discount', 'feature', 'subscription'
                    discountPercentage: promoInfo.discount_percentage,
                    promoCode: promoInfo.promo_code,
                    validUntil: promoInfo.valid_until,
                    targetFeature: promoInfo.target_feature,
                    callToAction: promoInfo.call_to_action,
                    promoUrl: promoInfo.promo_url,
                    promoTimestamp: new Date().toISOString(),
                },
                channels: {
                    push: true,
                    email: true,
                    websocket: true,
                    inApp: true
                }
            };

            const result = await this.notificationClient.createNotification(notification);
            console.log('✅ Promotional notification sent:', result.notification.id);
            return result;
        } catch (error) {
            console.error('❌ Failed to send promotional notification:', error);
            throw error;
        }
    }

    /**
     * Send an update notification
     */
    async sendUpdateNotification(userId, updateInfo) {
        try {
            const notification = {
                userId: userId,
                title: updateInfo.title,
                message: updateInfo.message,
                type: 'update',
                priority: updateInfo.priority || 'normal',
                metadata: {
                    updateType: updateInfo.update_type, // 'profile', 'preferences', 'security'
                    updateCategory: updateInfo.update_category,
                    actionRequired: updateInfo.action_required,
                    actionUrl: updateInfo.action_url,
                    completionStatus: updateInfo.completion_status,
                    nextSteps: updateInfo.next_steps,
                    updateTimestamp: new Date().toISOString(),
                },
                channels: {
                    push: true,
                    email: updateInfo.send_email || false,
                    websocket: true,
                    inApp: true
                }
            };

            const result = await this.notificationClient.createNotification(notification);
            console.log('✅ Update notification sent:', result.notification.id);
            return result;
        } catch (error) {
            console.error('❌ Failed to send update notification:', error);
            throw error;
        }
    }

    /**
     * Send an alert notification
     */
    async sendAlertNotification(userId, alertInfo) {
        try {
            const notification = {
                userId: userId,
                title: alertInfo.title,
                message: alertInfo.message,
                type: 'alert',
                priority: 'high',
                metadata: {
                    alertType: alertInfo.alert_type, // 'security', 'safety', 'violation'
                    alertSeverity: alertInfo.alert_severity, // 'low', 'medium', 'high', 'critical'
                    alertCategory: alertInfo.alert_category,
                    actionRequired: alertInfo.action_required,
                    actionUrl: alertInfo.action_url,
                    incidentId: alertInfo.incident_id,
                    alertTimestamp: new Date().toISOString(),
                },
                channels: {
                    push: true,
                    email: true,
                    websocket: true,
                    inApp: true
                }
            };

            const result = await this.notificationClient.createNotification(notification);
            console.log('✅ Alert notification sent:', result.notification.id);
            return result;
        } catch (error) {
            console.error('❌ Failed to send alert notification:', error);
            throw error;
        }
    }

    /**
     * Send a payment notification
     */
    async sendPaymentNotification(userId, paymentInfo) {
        try {
            const notification = {
                userId: userId,
                title: paymentInfo.title,
                message: paymentInfo.message,
                type: 'payment',
                priority: 'normal',
                metadata: {
                    paymentId: paymentInfo.payment_id,
                    transactionId: paymentInfo.transaction_id,
                    paymentType: paymentInfo.payment_type, // 'subscription', 'boost', 'gift'
                    amount: paymentInfo.amount,
                    currency: paymentInfo.currency,
                    paymentStatus: paymentInfo.payment_status,
                    paymentMethod: paymentInfo.payment_method,
                    nextBillingDate: paymentInfo.next_billing_date,
                    paymentTimestamp: new Date().toISOString(),
                },
                channels: {
                    push: true,
                    email: true,
                    websocket: true,
                    inApp: true
                }
            };

            const result = await this.notificationClient.createNotification(notification);
            console.log('✅ Payment notification sent:', result.notification.id);
            return result;
        } catch (error) {
            console.error('❌ Failed to send payment notification:', error);
            throw error;
        }
    }

    /**
     * Send a security notification
     */
    async sendSecurityNotification(userId, securityInfo) {
        try {
            const notification = {
                userId: userId,
                title: securityInfo.title,
                message: securityInfo.message,
                type: 'security',
                priority: 'high',
                metadata: {
                    securityEventId: securityInfo.security_event_id,
                    securityEventType: securityInfo.security_event_type, // 'login', 'password_change', 'suspicious_activity'
                    deviceInfo: securityInfo.device_info,
                    ipAddress: securityInfo.ip_address,
                    location: securityInfo.location,
                    actionTaken: securityInfo.action_taken,
                    actionRequired: securityInfo.action_required,
                    securityTimestamp: new Date().toISOString(),
                },
                channels: {
                    push: true,
                    email: true,
                    websocket: true,
                    inApp: true
                }
            };

            const result = await this.notificationClient.createNotification(notification);
            console.log('✅ Security notification sent:', result.notification.id);
            return result;
        } catch (error) {
            console.error('❌ Failed to send security notification:', error);
            throw error;
        }
    }

    /**
     * Send a maintenance notification
     */
    async sendMaintenanceNotification(userId, maintenanceInfo) {
        try {
            const notification = {
                userId: userId,
                title: maintenanceInfo.title,
                message: maintenanceInfo.message,
                type: 'maintenance',
                priority: 'normal',
                metadata: {
                    maintenanceId: maintenanceInfo.maintenance_id,
                    maintenanceType: maintenanceInfo.maintenance_type, // 'scheduled', 'emergency', 'update'
                    affectedServices: maintenanceInfo.affected_services,
                    startTime: maintenanceInfo.start_time,
                    endTime: maintenanceInfo.end_time,
                    estimatedDuration: maintenanceInfo.estimated_duration,
                    impact: maintenanceInfo.impact, // 'low', 'medium', 'high'
                    maintenanceTimestamp: new Date().toISOString(),
                },
                channels: {
                    push: true,
                    email: true,
                    websocket: true,
                    inApp: true
                }
            };

            const result = await this.notificationClient.createNotification(notification);
            console.log('✅ Maintenance notification sent:', result.notification.id);
            return result;
        } catch (error) {
            console.error('❌ Failed to send maintenance notification:', error);
            throw error;
        }
    }
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
                    
                    // Requester basic info
                    requesterAge: dateRequestData.requester_age,
                    requesterOccupation: dateRequestData.requester_occupation,
                    requesterLocation: dateRequestData.requester_location,
                    requesterVerified: dateRequestData.requester_verified,
                    
                    // Date proposal details
                    proposedDateTime: dateRequestData.date_time,
                    activity: dateRequestData.activity,
                    activityCategory: dateRequestData.activity_category,
                    estimatedDuration: dateRequestData.estimated_duration,
                    personalMessage: dateRequestData.personal_message,
                    
                    // Venue information
                    venueDetails: {
                        name: dateRequestData.venue_name,
                        address: dateRequestData.venue_address,
                        rating: dateRequestData.venue_rating,
                        priceRange: dateRequestData.venue_price_range,
                        cuisine: dateRequestData.venue_cuisine
                    },
                    
                    // Cost and logistics
                    costEstimate: dateRequestData.cost_estimate,
                    whoPays: dateRequestData.who_pays, // 'requester', 'split', 'recipient'
                    
                    // Distance and convenience
                    distanceFromRecipient: dateRequestData.distance_from_recipient_km,
                    travelTimeMinutes: dateRequestData.travel_time_minutes,
                    
                    // Safety basics
                    safetyScore: dateRequestData.safety_score,
                    publicVenue: dateRequestData.is_public_venue,
                    
                    // Match context
                    matchInfo: {
                        matchId: dateRequestData.match_id,
                        daysSinceMatch: dateRequestData.days_since_match,
                        conversationQuality: dateRequestData.conversation_quality_score,
                        messageCount: dateRequestData.message_count,
                        compatibilityScore: dateRequestData.compatibility_score
                    },
                    
                    // Timing
                    requestCreatedAt: new Date().toISOString(),
                    expiresAt: dateRequestData.expires_at,
                    
                    // Preferences alignment
                    prefAlignment: {
                        activityMatch: dateRequestData.activity_preference_match,
                        priceRangeMatch: dateRequestData.price_preference_match,
                        locationMatch: dateRequestData.location_preference_match
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

    /**
     * Send a date accepted notification
     */
    async sendDateAcceptedNotification(userId, dateAcceptedInfo) {
        try {
            const notification = {
                userId: userId,
                title: "Date Accepted! 🎉",
                message: `${dateAcceptedInfo.accepter_name} accepted your date request!`,
                type: 'date_accepted',
                priority: 'high',
                metadata: {
                    dateId: dateAcceptedInfo.date_id,
                    dateRequestId: dateAcceptedInfo.date_request_id,
                    accepterId: dateAcceptedInfo.accepter_id,
                    accepterName: dateAcceptedInfo.accepter_name,
                    accepterProfilePicture: dateAcceptedInfo.accepter_profile_picture,
                    
                    // Date details
                    dateTime: dateAcceptedInfo.date_time,
                    activity: dateAcceptedInfo.activity,
                    venue: dateAcceptedInfo.venue_name,
                    venueAddress: dateAcceptedInfo.venue_address,
                    
                    // Response context
                    acceptanceMessage: dateAcceptedInfo.acceptance_message,
                    acceptedAt: new Date().toISOString(),
                    
                    // Next steps
                    nextSteps: dateAcceptedInfo.next_steps,
                    reminderSet: dateAcceptedInfo.reminder_set,
                },
                channels: {
                    push: true,
                    email: true,
                    websocket: true,
                    inApp: true
                }
            };

            const result = await this.notificationClient.createNotification(notification);
            console.log('✅ Date accepted notification sent:', result.notification.id);
            return result;
        } catch (error) {
            console.error('❌ Failed to send date accepted notification:', error);
            throw error;
        }
    }

    /**
     * Send a date declined notification
     */
    async sendDateDeclinedNotification(userId, dateDeclinedInfo) {
        try {
            const notification = {
                userId: userId,
                title: "Date Declined",
                message: `${dateDeclinedInfo.decliner_name} declined your date request.`,
                type: 'date_declined',
                priority: 'normal',
                metadata: {
                    dateRequestId: dateDeclinedInfo.date_request_id,
                    declinerId: dateDeclinedInfo.decliner_id,
                    declinerName: dateDeclinedInfo.decliner_name,
                    declinerProfilePicture: dateDeclinedInfo.decliner_profile_picture,
                    
                    // Decline context
                    declineReason: dateDeclinedInfo.decline_reason,
                    declineMessage: dateDeclinedInfo.decline_message,
                    declinedAt: new Date().toISOString(),
                    
                    // Alternative suggestions
                    suggestAlternative: dateDeclinedInfo.suggest_alternative,
                    alternativeDates: dateDeclinedInfo.alternative_dates,
                    
                    // Encouragement
                    encouragementMessage: dateDeclinedInfo.encouragement_message,
                },
                channels: {
                    push: true,
                    email: false,
                    websocket: true,
                    inApp: true
                }
            };

            const result = await this.notificationClient.createNotification(notification);
            console.log('✅ Date declined notification sent:', result.notification.id);
            return result;
        } catch (error) {
            console.error('❌ Failed to send date declined notification:', error);
            throw error;
        }
    }

    /**
     * Send a date canceled notification
     */
    async sendDateCanceledNotification(userId, dateCanceledInfo) {
        try {
            const notification = {
                userId: userId,
                title: "Date Canceled ⚠️",
                message: `${dateCanceledInfo.canceler_name} had to cancel your upcoming date.`,
                type: 'date_canceled',
                priority: 'high',
                metadata: {
                    dateId: dateCanceledInfo.date_id,
                    cancelerId: dateCanceledInfo.canceler_id,
                    cancelerName: dateCanceledInfo.canceler_name,
                    cancelerProfilePicture: dateCanceledInfo.canceler_profile_picture,
                    
                    // Original date details
                    originalDateTime: dateCanceledInfo.original_date_time,
                    originalActivity: dateCanceledInfo.original_activity,
                    originalVenue: dateCanceledInfo.original_venue,
                    
                    // Cancellation context
                    cancelReason: dateCanceledInfo.cancel_reason,
                    cancelMessage: dateCanceledInfo.cancel_message,
                    canceledAt: new Date().toISOString(),
                    
                    // Rescheduling options
                    offerReschedule: dateCanceledInfo.offer_reschedule,
                    suggestedNewDates: dateCanceledInfo.suggested_new_dates,
                    
                    // Compensation
                    refundOffered: dateCanceledInfo.refund_offered,
                    creditOffered: dateCanceledInfo.credit_offered,
                },
                channels: {
                    push: true,
                    email: true,
                    websocket: true,
                    inApp: true
                }
            };

            const result = await this.notificationClient.createNotification(notification);
            console.log('✅ Date canceled notification sent:', result.notification.id);
            return result;
        } catch (error) {
            console.error('❌ Failed to send date canceled notification:', error);
            throw error;
        }
    }

    /**
     * Send a date reminder notification
     */
    async sendDateReminderNotification(userId, dateReminderInfo) {
        try {
            const notification = {
                userId: userId,
                title: "Date Reminder ⏰",
                message: `Don't forget your date with ${dateReminderInfo.partner_name} ${dateReminderInfo.time_until}!`,
                type: 'date_reminder',
                priority: 'normal',
                metadata: {
                    dateId: dateReminderInfo.date_id,
                    partnerId: dateReminderInfo.partner_id,
                    partnerName: dateReminderInfo.partner_name,
                    partnerProfilePicture: dateReminderInfo.partner_profile_picture,
                    
                    // Date details
                    dateTime: dateReminderInfo.date_time,
                    activity: dateReminderInfo.activity,
                    venueName: dateReminderInfo.venue_name,
                    venueAddress: dateReminderInfo.venue_address,
                    
                    // Timing
                    timeUntilDate: dateReminderInfo.time_until,
                    reminderType: dateReminderInfo.reminder_type, // '24h', '2h', '30min'
                    
                    // Helpful info
                    weatherInfo: dateReminderInfo.weather_info,
                    transportationSuggestions: dateReminderInfo.transportation_suggestions,
                    dressCode: dateReminderInfo.dress_code,
                    specialInstructions: dateReminderInfo.special_instructions,
                    
                    reminderTimestamp: new Date().toISOString(),
                },
                channels: {
                    push: true,
                    email: false,
                    websocket: true,
                    inApp: true
                }
            };

            const result = await this.notificationClient.createNotification(notification);
            console.log('✅ Date reminder notification sent:', result.notification.id);
            return result;
        } catch (error) {
            console.error('❌ Failed to send date reminder notification:', error);
            throw error;
        }
    }
}

module.exports = DatingNotificationService;

// Helper functions for generating random test data
const randomNames = ['Sarah Johnson', 'Alex Thompson', 'Jordan Martinez', 'Taylor Smith', 'Morgan Davis', 'Casey Wilson', 'Riley Brown', 'Jamie Garcia', 'Avery Miller', 'Quinn Anderson'];
const randomCities = ['New York', 'San Francisco', 'Los Angeles', 'Chicago', 'Boston', 'Seattle', 'Austin', 'Denver', 'Portland', 'Miami'];
const randomStates = ['NY', 'CA', 'CA', 'IL', 'MA', 'WA', 'TX', 'CO', 'OR', 'FL'];
const randomOccupations = ['Software Engineer', 'Product Manager', 'UX Designer', 'Marketing Manager', 'Data Scientist', 'Teacher', 'Nurse', 'Lawyer', 'Architect', 'Photographer'];
const randomInterests = ['hiking', 'photography', 'cooking', 'travel', 'music', 'art', 'fitness', 'reading', 'dancing', 'gaming'];
const randomActivities = ['Dinner at Italian Restaurant', 'Coffee at Local Café', 'Walk in the Park', 'Art Museum Visit', 'Wine Tasting', 'Hiking Trail', 'Concert', 'Cooking Class', 'Beach Day', 'Farmers Market'];
const randomVenues = ['Bella Vista Ristorante', 'The Coffee House', 'Central Park', 'Modern Art Museum', 'Napa Valley Winery', 'Mountain Trail', 'Concert Hall', 'Culinary Institute', 'Santa Monica Beach', 'Downtown Market'];

function getRandomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function getRandomElements(array, count) {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
}

function getRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateRandomUserId() {
    return 'user_' + Math.random().toString(36).substr(2, 16);
}

function generateRandomId(prefix) {
    return prefix + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8);
}

// Test runner and example usage
async function runTests() {
    console.log('🚀 Starting Dating Notifications Test Suite...\n');
    
    const datingNotifications = new DatingNotificationService();
    
    try {
        // Test 1: Like Notification
        console.log('📝 Test 1: Sending Like Notification');
        await testLikeNotification(datingNotifications);
        console.log('');
        
        // Test 2: Super Like Notification
        console.log('📝 Test 2: Sending Super Like Notification');
        await testSuperLikeNotification(datingNotifications);
        console.log('');
        
        // Test 3: Match Notification
        console.log('📝 Test 3: Sending Match Notification');
        await testMatchNotification(datingNotifications);
        console.log('');
        
        // Test 4: Rizz Notification
        console.log('📝 Test 4: Sending Rizz Notification');
        await testRizzNotification(datingNotifications);
        console.log('');
        
        // Test 5: Connection Notification
        console.log('📝 Test 5: Sending Connection Notification');
        await testConnectionNotification(datingNotifications);
        console.log('');
        
        // Test 6: Date Request Notification
        console.log('📝 Test 6: Sending Date Request Notification');
        await testDateRequestNotification(datingNotifications);
        console.log('');
        
        // Test 7: Date Accepted Notification
        console.log('📝 Test 7: Sending Date Accepted Notification');
        await testDateAcceptedNotification(datingNotifications);
        console.log('');
        
        // Test 8: Date Reminder Notification
        console.log('📝 Test 8: Sending Date Reminder Notification');
        await testDateReminderNotification(datingNotifications);
        console.log('');
        
        // Test 9: Security Notification
        console.log('📝 Test 9: Sending Security Notification');
        await testSecurityNotification(datingNotifications);
        console.log('');
        
        // Test 10: Payment Notification
        console.log('📝 Test 10: Sending Payment Notification');
        await testPaymentNotification(datingNotifications);
        console.log('');
        
        console.log('✅ All tests completed successfully!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        process.exit(1);
    }
}

async function testLikeNotification(service) {
    const likedUserId = '8e580844-4053-4f60-9549-5722c0c41e13';
    const randomLiker = getRandomElement(randomNames);
    const randomCity = getRandomElement(randomCities);
    const randomState = getRandomElement(randomStates);
    const likerInfo = {
        user_id: generateRandomUserId(),
        name: randomLiker,
        profile_picture: `https://example.com/${randomLiker.toLowerCase().replace(' ', '')}.jpg`,
        age: getRandomNumber(22, 35),
        city: randomCity,
        state: randomState,
        occupation: getRandomElement(randomOccupations)
    };
    
    const likeContext = {
        like_id: generateRandomId('like'),
        compatibility_score: getRandomNumber(70, 95),
        mutual_friends_count: getRandomNumber(0, 8),
        mutual_interests: getRandomElements(randomInterests, getRandomNumber(2, 5)),
        like_type: getRandomElement(['regular', 'super_like']),
        source: getRandomElement(['discovery', 'search', 'recommendations']),
        is_reciprocal: Math.random() > 0.7,
        suggested_ice_breakers: [
            `I noticed you love ${getRandomElement(randomInterests)} too! What's your favorite spot?`,
            `Your ${getRandomElement(randomInterests)} photos are amazing! Tell me more about that!`
        ],
        common_topics: getRandomElements(randomInterests, getRandomNumber(2, 4)),
        recipient_email_notifications: Math.random() > 0.3
    };
    
    const result = await service.sendLikeNotification(likedUserId, likerInfo, likeContext);
    console.log(`   ✅ Like notification sent with ID: ${result.notification.id}`);
    return result;
}

async function testMatchNotification(service) {
    const userId = '8e580844-4053-4f60-9549-5722c0c41e13';
    const randomPartner = getRandomElement(randomNames);
    const randomCity = getRandomElement(randomCities);
    const randomState = getRandomElement(randomStates);
    const matchInfo = {
        match_id: generateRandomId('match'),
        partner_id: generateRandomUserId(),
        partner_name: randomPartner,
        partner_profile_picture: `https://example.com/${randomPartner.toLowerCase().replace(' ', '')}.jpg`,
        partner_age: getRandomNumber(23, 36),
        partner_city: randomCity,
        partner_state: randomState,
        partner_occupation: getRandomElement(randomOccupations),
        partner_bio: `Love exploring new places and trying different cuisines. Always up for good conversations about ${getRandomElements(randomInterests, 2).join(' and ')}.`,
        
        // Match quality
        compatibility_score: getRandomNumber(80, 98),
        match_score: getRandomNumber(75, 95),
        
        // Social connections
        mutual_friends_count: getRandomNumber(1, 8),
        mutual_interests: getRandomElements(randomInterests, getRandomNumber(3, 6)),
        common_activities: getRandomElements(['rock climbing', 'wine tasting', 'board games', 'live music'], getRandomNumber(1, 3)),
        
        // Match context
        match_type: getRandomElement(['regular', 'super_match']),
        source: getRandomElement(['discovery', 'search', 'recommendations']),
        
        // Conversation aids
        suggested_ice_breakers: [
            `I see we both love ${getRandomElement(randomInterests)}! What got you into it?`,
            `Your photos from ${randomCity} are amazing! I've always wanted to visit there.`
        ],
        common_topics: getRandomElements(randomInterests, getRandomNumber(2, 4)),
        
        // Premium
        is_premium_match: Math.random() > 0.6,
        super_like_involved: Math.random() > 0.7,
        
        // Geography
        distance_km: getRandomNumber(5, 50),
        same_city: Math.random() > 0.4,
        
        user_email_notifications: Math.random() > 0.2
    };
    
    const result = await service.sendMatchNotification(userId, matchInfo);
    console.log(`   ✅ Match notification sent with ID: ${result.notification.id}`);
    return result;
}

async function testDateRequestNotification(service) {
    const recipientUserId = '8e580844-4053-4f60-9549-5722c0c41e13';
    const randomRequester = getRandomElement(randomNames);
    const randomActivity = getRandomElement(randomActivities);
    const randomVenue = getRandomElement(randomVenues);
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + getRandomNumber(2, 7));
    futureDate.setHours(getRandomNumber(17, 21), getRandomNumber(0, 59));
    
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 2);
    expirationDate.setHours(23, 59, 59);
    
    const dateRequestData = {
        request_id: generateRandomId('date_req'),
        requester_id: generateRandomUserId(),
        requester_name: randomRequester,
        requester_profile_picture: `https://example.com/${randomRequester.toLowerCase().replace(' ', '')}.jpg`,
        requester_age: getRandomNumber(24, 34),
        requester_occupation: getRandomElement(randomOccupations),
        requester_location: `${getRandomElement(randomCities)} Downtown`,
        requester_verified: Math.random() > 0.3,
        
        // Date details
        date_time: futureDate.toISOString(),
        activity: randomActivity,
        activity_category: getRandomElement(['dining', 'entertainment', 'outdoor', 'cultural']),
        estimated_duration: getRandomElement(['1 hour', '2 hours', '3 hours', 'Half day']),
        personal_message: `I found this amazing place with great reviews. Would love to ${randomActivity.toLowerCase()} with you!`,
        
        // Venue details
        venue_name: randomVenue,
        venue_address: `${getRandomNumber(100, 999)} ${getRandomElement(['Main', 'First', 'Second', 'Market', 'Oak'])} Street, ${getRandomElement(randomCities)}, ${getRandomElement(randomStates)}`,
        venue_rating: (Math.random() * 2 + 3).toFixed(1), // 3.0 to 5.0
        venue_price_range: getRandomElement(['$', '$$', '$$$']),
        venue_cuisine: getRandomElement(['Italian', 'Asian', 'American', 'Mediterranean', 'Mexican']),
        
        // Logistics
        cost_estimate: getRandomElement(['$30-50 per person', '$50-80 per person', '$80-120 per person']),
        who_pays: getRandomElement(['requester', 'split']),
        
        // Distance
        distance_from_recipient_km: getRandomNumber(3, 25),
        travel_time_minutes: getRandomNumber(15, 45),
        
        // Safety
        safety_score: (Math.random() * 2 + 8).toFixed(1), // 8.0 to 10.0
        is_public_venue: Math.random() > 0.2,
        
        // Match context
        match_id: generateRandomId('match'),
        days_since_match: getRandomNumber(1, 14),
        conversation_quality_score: (Math.random() * 3 + 7).toFixed(1), // 7.0 to 10.0
        message_count: getRandomNumber(10, 50),
        compatibility_score: getRandomNumber(75, 95),
        
        // Timing
        expires_at: expirationDate.toISOString(),
        
        // Preferences
        activity_preference_match: getRandomNumber(70, 95),
        price_preference_match: getRandomNumber(80, 100),
        location_preference_match: getRandomNumber(75, 98),
        
        recipient_email_notifications: Math.random() > 0.25
    };
    
    const result = await service.sendDateRequestNotification(recipientUserId, dateRequestData);
    console.log(`   ✅ Date request notification sent with ID: ${result.notification.id}`);
    return result;
}

async function testSuperLikeNotification(service) {
    const likedUserId = '8e580844-4053-4f60-9549-5722c0c41e13';
    const randomSuperLiker = getRandomElement(randomNames);
    const randomCity = getRandomElement(randomCities);
    const randomState = getRandomElement(randomStates);
    const superLikerInfo = {
        user_id: generateRandomUserId(),
        name: randomSuperLiker,
        profile_picture: `https://example.com/${randomSuperLiker.toLowerCase().replace(' ', '')}.jpg`,
        age: getRandomNumber(22, 35),
        city: randomCity,
        state: randomState,
        occupation: getRandomElement(randomOccupations)
    };
    
    const superLikeContext = {
        super_like_id: generateRandomId('superlike'),
        compatibility_score: getRandomNumber(80, 98),
        mutual_friends_count: getRandomNumber(1, 10),
        mutual_interests: getRandomElements(randomInterests, getRandomNumber(3, 6)),
        source: getRandomElement(['discovery', 'search', 'recommendations']),
        is_premium_user: Math.random() > 0.5,
        suggested_ice_breakers: [
            `I noticed you love ${getRandomElement(randomInterests)} too! What's your favorite spot?`,
            `Your ${getRandomElement(randomInterests)} photos are amazing! Tell me more about that!`
        ],
        common_topics: getRandomElements(randomInterests, getRandomNumber(2, 4))
    };
    
    const result = await service.sendSuperLikeNotification(likedUserId, superLikerInfo, superLikeContext);
    console.log(`   ✅ Super like notification sent with ID: ${result.notification.id}`);
    return result;
}

async function testRizzNotification(service) {
    const recipientUserId = '8e580844-4053-4f60-9549-5722c0c41e13';
    const randomSender = getRandomElement(randomNames);
    const randomCity = getRandomElement(randomCities);
    const randomState = getRandomElement(randomStates);
    const rizzMessages = [
        "Are you a magician? Because whenever I look at you, everyone else disappears!",
        "Do you have a map? I keep getting lost in your eyes.",
        "Is your name Google? Because you have everything I've been searching for.",
        "Are you made of copper and tellurium? Because you're Cu-Te!"
    ];
    
    const rizzSenderInfo = {
        user_id: generateRandomUserId(),
        name: randomSender,
        profile_picture: `https://example.com/${randomSender.toLowerCase().replace(' ', '')}.jpg`,
        age: getRandomNumber(22, 35),
        city: randomCity,
        state: randomState,
        occupation: getRandomElement(randomOccupations)
    };
    
    const rizzContext = {
        rizz_id: generateRandomId('rizz'),
        rizz_message: getRandomElement(rizzMessages),
        rizz_type: getRandomElement(['pickup_line', 'compliment', 'funny', 'smooth']),
        rizz_rating: getRandomNumber(7, 10),
        compatibility_score: getRandomNumber(75, 95),
        mutual_interests: getRandomElements(randomInterests, getRandomNumber(2, 4))
    };
    
    const result = await service.sendRizzNotification(recipientUserId, rizzSenderInfo, rizzContext);
    console.log(`   ✅ Rizz notification sent with ID: ${result.notification.id}`);
    return result;
}

async function testConnectionNotification(service) {
    const recipientUserId = '8e580844-4053-4f60-9549-5722c0c41e13';
    const randomSender = getRandomElement(randomNames);
    const randomCity = getRandomElement(randomCities);
    const randomState = getRandomElement(randomStates);
    
    const connectionInfo = {
        connection_id: generateRandomId('conn'),
        sender_id: generateRandomUserId(),
        sender_name: randomSender,
        sender_profile_picture: `https://example.com/${randomSender.toLowerCase().replace(' ', '')}.jpg`,
        sender_age: getRandomNumber(22, 35),
        sender_location: `${randomCity}, ${randomState}`,
        sender_occupation: getRandomElement(randomOccupations),
        sender_verified: Math.random() > 0.3,
        connection_type: getRandomElement(['friend', 'professional', 'dating']),
        connection_reason: getRandomElement(['mutual_interests', 'location', 'work', 'mutual_friends']),
        mutual_connections: getRandomNumber(1, 5),
        mutual_interests: getRandomElements(randomInterests, getRandomNumber(2, 4))
    };
    
    const result = await service.sendConnectionNotification(recipientUserId, connectionInfo);
    console.log(`   ✅ Connection notification sent with ID: ${result.notification.id}`);
    return result;
}

async function testDateAcceptedNotification(service) {
    const userId = '8e580844-4053-4f60-9549-5722c0c41e13';
    const randomAccepter = getRandomElement(randomNames);
    const randomActivity = getRandomElement(randomActivities);
    const randomVenue = getRandomElement(randomVenues);
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + getRandomNumber(2, 7));
    futureDate.setHours(getRandomNumber(17, 21), getRandomNumber(0, 59));
    
    const dateAcceptedInfo = {
        date_id: generateRandomId('date'),
        date_request_id: generateRandomId('date_req'),
        accepter_id: generateRandomUserId(),
        accepter_name: randomAccepter,
        accepter_profile_picture: `https://example.com/${randomAccepter.toLowerCase().replace(' ', '')}.jpg`,
        date_time: futureDate.toISOString(),
        activity: randomActivity,
        venue_name: randomVenue,
        venue_address: `${getRandomNumber(100, 999)} ${getRandomElement(['Main', 'First', 'Second', 'Market', 'Oak'])} Street`,
        acceptance_message: "Looking forward to it! This sounds like so much fun!",
        next_steps: ["Get in touch with your Date", "Confirm meeting time", "Check weather"],
        reminder_set: true
    };
    
    const result = await service.sendDateAcceptedNotification(userId, dateAcceptedInfo);
    console.log(`   ✅ Date accepted notification sent with ID: ${result.notification.id}`);
    return result;
}

async function testDateReminderNotification(service) {
    const userId = '8e580844-4053-4f60-9549-5722c0c41e13';
    const randomPartner = getRandomElement(randomNames);
    const randomActivity = getRandomElement(randomActivities);
    const randomVenue = getRandomElement(randomVenues);
    const dateTime = new Date();
    dateTime.setHours(dateTime.getHours() + 2); // 2 hours from now
    
    const dateReminderInfo = {
        date_id: generateRandomId('date'),
        partner_id: generateRandomUserId(),
        partner_name: randomPartner,
        partner_profile_picture: `https://example.com/${randomPartner.toLowerCase().replace(' ', '')}.jpg`,
        date_time: dateTime.toISOString(),
        activity: randomActivity,
        venue_name: randomVenue,
        venue_address: `${getRandomNumber(100, 999)} ${getRandomElement(['Main', 'First', 'Second', 'Market', 'Oak'])} Street`,
        time_until: "in 2 hours",
        reminder_type: "2h",
        weather_info: "Sunny, 72°F",
        transportation_suggestions: ["Uber (15 min)", "Walk (25 min)", "Bus (20 min)"],
        dress_code: "Smart casual",
        special_instructions: "Ask for the rooftop seating"
    };
    
    const result = await service.sendDateReminderNotification(userId, dateReminderInfo);
    console.log(`   ✅ Date reminder notification sent with ID: ${result.notification.id}`);
    return result;
}

async function testSecurityNotification(service) {
    const userId = '8e580844-4053-4f60-9549-5722c0c41e13';
    
    const securityInfo = {
        title: "New Login Detected 🔐",
        message: "Someone logged into your account from a new device.",
        security_event_id: generateRandomId('sec'),
        security_event_type: getRandomElement(['login', 'password_change', 'suspicious_activity']),
        device_info: {
            device_type: "iPhone 15 Pro",
            browser: "Safari 17.1",
            os: "iOS 17.1"
        },
        ip_address: "192.168.1.100",
        location: `${getRandomElement(randomCities)}, ${getRandomElement(randomStates)}`,
        action_taken: "Login allowed",
        action_required: false
    };
    
    const result = await service.sendSecurityNotification(userId, securityInfo);
    console.log(`   ✅ Security notification sent with ID: ${result.notification.id}`);
    return result;
}

async function testPaymentNotification(service) {
    const userId = '8e580844-4053-4f60-9549-5722c0c41e13';
    
    const paymentInfo = {
        title: "Payment Successful 💳",
        message: "Your Premium subscription has been renewed.",
        payment_id: generateRandomId('pay'),
        transaction_id: generateRandomId('txn'),
        payment_type: getRandomElement(['subscription', 'boost', 'gift']),
        amount: getRandomElement(['9.99', '19.99', '29.99']),
        currency: "USD",
        payment_status: "completed",
        payment_method: "•••• 4242",
        next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    };
    
    const result = await service.sendPaymentNotification(userId, paymentInfo);
    console.log(`   ✅ Payment notification sent with ID: ${result.notification.id}`);
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
            case 'superlike':
                await testSuperLikeNotification(service);
                break;
            case 'match':
                await testMatchNotification(service);
                break;
            case 'rizz':
                await testRizzNotification(service);
                break;
            case 'connection':
                await testConnectionNotification(service);
                break;
            case 'date':
            case 'date_request':
                await testDateRequestNotification(service);
                break;
            case 'date_accepted':
                await testDateAcceptedNotification(service);
                break;
            case 'date_reminder':
                await testDateReminderNotification(service);
                break;
            case 'security':
                await testSecurityNotification(service);
                break;
            case 'payment':
                await testPaymentNotification(service);
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
module.exports.testSuperLikeNotification = testSuperLikeNotification;
module.exports.testMatchNotification = testMatchNotification;
module.exports.testRizzNotification = testRizzNotification;
module.exports.testConnectionNotification = testConnectionNotification;
module.exports.testDateRequestNotification = testDateRequestNotification;
module.exports.testDateAcceptedNotification = testDateAcceptedNotification;
module.exports.testDateReminderNotification = testDateReminderNotification;
module.exports.testSecurityNotification = testSecurityNotification;
module.exports.testPaymentNotification = testPaymentNotification;

// Run tests if file is executed directly
if (require.main === module) {
    const testType = process.argv[2] || 'all';
    quickTest(testType).catch(console.error);
}
