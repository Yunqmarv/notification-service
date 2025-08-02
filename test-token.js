#!/usr/bin/env node

// Simple test script for notification endpoints
const jwt = require('jsonwebtoken');

// Default JWT secret (should match what's in your settings)
const JWT_SECRET = 'your-super-secret-jwt-key-for-notifications-service-2024';

// Create a test token
const testPayload = {
    userId: 'test-user-123',
    role: 'user',
    email: 'test@example.com'
};

const token = jwt.sign(testPayload, JWT_SECRET, { expiresIn: '24h' });

console.log('Generated test JWT token:');
console.log(token);
console.log('\nTest user ID:', testPayload.userId);
console.log('\nExample usage:');
console.log(`curl -X GET http://localhost:3001/api/notifications -H "Authorization: Bearer ${token}"`);
