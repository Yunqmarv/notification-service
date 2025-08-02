#!/usr/bin/env node

// Test script for the robust system settings endpoint
const axios = require('axios');

// API Configuration
const API_BASE = 'http://localhost:3001';
const SETTINGS_API_KEY = process.env.SETTINGS_API_KEY || 'your-secure-api-key-here';

console.log('Using API key authentication for system settings test');

// Test system settings update
const systemSettingsUpdate = {
    notifications: {
        defaultBatchSize: 500,
        maxRetryAttempts: 5,
        retryDelayMs: 5000,
        enableWebsockets: true,
        enablePushNotifications: true,
        enableEmailNotifications: true,
        enableSmsNotifications: false
    },
    redis: {
        cacheTimeout: 3600,
        compressionEnabled: true
    },
    database: {
        connectionPoolSize: 25,
        queryTimeout: 30000
    },
    security: {
        jwtExpirationTime: '24h',
        maxLoginAttempts: 5
    },
    logging: {
        level: 'info',
        enableFileLogging: true
    }
};

async function testSystemSettingsUpdate() {
    console.log('🚀 Testing robust system settings update endpoint...\n');
    
    const headers = {
        'X-API-Key': SETTINGS_API_KEY,
        'Content-Type': 'application/json'
    };

    try {
        console.log('Sending system settings update request...');
        console.log(`URL: ${API_BASE}/api/settings/system/update`);
        console.log('Payload:', JSON.stringify(systemSettingsUpdate, null, 2));
        console.log('Headers:', headers);
        
        const response = await axios.patch(`${API_BASE}/api/settings/system/update`, systemSettingsUpdate, { headers });
        
        if (response.data.success) {
            console.log('✅ System settings updated successfully!');
            console.log(`Session ID: ${response.data.data.sessionId}`);
            console.log(`Categories updated: ${response.data.data.categoriesUpdated.join(', ')}`);
            console.log(`Total updates: ${response.data.data.totalUpdates}`);
            console.log(`Restart required: ${response.data.data.restartRequired}`);
            console.log(`Immediate changes: ${response.data.data.immediateChanges.length}`);
            
            if (response.data.data.nextSteps && response.data.data.nextSteps.length > 0) {
                console.log('\n📋 Next Steps:');
                response.data.data.nextSteps.forEach(step => {
                    console.log(`  - ${step.action}: ${step.description}`);
                });
            }
            
            if (response.data.data.warnings && response.data.data.warnings.length > 0) {
                console.log('\n⚠️  Warnings:');
                response.data.data.warnings.forEach(warning => {
                    console.log(`  - ${warning.message}`);
                });
            }
            
        } else {
            console.log('❌ System settings update failed:', response.data.message);
            if (response.data.data?.results?.failed?.length > 0) {
                console.log('Failed updates:');
                response.data.data.results.failed.forEach(failure => {
                    console.log(`  - ${failure.key}: ${failure.error}`);
                });
            }
        }
    } catch (error) {
        console.log('❌ Error testing system settings:', error.response?.data?.message || error.message);
        if (error.response?.data?.errors) {
            console.log('Validation errors:');
            error.response.data.errors.forEach(err => {
                console.log(`  - ${err.field}: ${err.message}`);
            });
        }
    }
}

// Run the test
if (require.main === module) {
    testSystemSettingsUpdate().catch(console.error);
}

module.exports = { testSystemSettingsUpdate, SETTINGS_API_KEY };
