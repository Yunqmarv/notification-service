#!/usr/bin/env node

/**
 * Logging Test Script
 * 
 * This script demonstrates and tests the conditional logging functionality.
 * Run with different environment variables to see the effects.
 */

require('dotenv').config();
const Logger = require('./src/utils/logger');

console.log('🧪 Testing Conditional Logging System...\n');

// Test logger health check
const health = Logger.healthCheck();
console.log('📋 Logger Health Check:', JSON.stringify(health, null, 2));
console.log('');

// Test different log levels
console.log('📝 Testing log levels:');
Logger.debug('This is a debug message');
Logger.info('This is an info message');
Logger.warn('This is a warning message');
Logger.error('This is an error message');
console.log('');

// Test structured logging methods
console.log('🔍 Testing structured logging:');

// Security event (should respect ENABLE_SECURITY_LOGGING)
Logger.logSecurityEvent('test_event', 'test-user-123', '127.0.0.1', {
    action: 'login_attempt',
    result: 'success'
});

// Performance metric (should respect ENABLE_PERFORMANCE_LOGGING)
Logger.logPerformanceMetric('test_operation', 250, {
    operation: 'database_query',
    collection: 'users'
});

// Notification event
Logger.logNotificationEvent('sent', 'notif-123', 'user-456', {
    type: 'push',
    title: 'Test Notification'
});

// Database operation (should respect ENABLE_DEBUG_LOGGING)
Logger.logDatabaseOperation('find', 'notifications', 45);

// Cache operation (should respect ENABLE_DEBUG_LOGGING)
Logger.logCacheOperation('get', 'user:123', true, 2);

// WebSocket event (should respect ENABLE_DEBUG_LOGGING)
Logger.logWebSocketEvent('connection', 'user-789', {
    event: 'connect',
    room: 'notifications'
});

console.log('');
console.log('✅ Logging test completed!');
console.log('');
console.log('💡 Try running with different environment variables:');
console.log('   ENABLE_LOGGING=false node test-logging.js');
console.log('   ENABLE_DEBUG_LOGGING=true node test-logging.js');
console.log('   ENABLE_SECURITY_LOGGING=false node test-logging.js');
console.log('   LOG_LEVEL=error node test-logging.js');
