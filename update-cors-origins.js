#!/usr/bin/env node

// Script to update CORS origins for the notification service
const axios = require('axios');

// API Configuration
const API_BASE = 'http://localhost:3001';
const SETTINGS_API_KEY = process.env.SETTINGS_API_KEY || 'your-secure-api-key-here';

console.log('🔧 Updating CORS origins for notification service...\n');

// CORS settings update
const corsSettingsUpdate = {
    cors: {
        allowedOrigins: [
            'http://localhost:3000',
            'https://localhost:3000',
            'http://localhost:3001',
            'https://localhost:3001',
            'https://authentication-microservice-1kfo.onrender.com',
            'https://marville.ca',
            'https://www.marville.ca',
            'https://app.marville.ca'
        ],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-api-key']
    }
};

async function updateCorsOrigins() {
    const headers = {
        'X-API-Key': SETTINGS_API_KEY,
        'Content-Type': 'application/json'
    };

    try {
        console.log('📡 Sending CORS settings update request...');
        console.log(`URL: ${API_BASE}/api/settings/system/update`);
        console.log('CORS Origins to be added:', corsSettingsUpdate.cors.allowedOrigins);
        
        const response = await axios.patch(`${API_BASE}/api/settings/system/update`, corsSettingsUpdate, { headers });
        
        if (response.data.success) {
            console.log('✅ CORS origins updated successfully!');
            console.log(`Session ID: ${response.data.data.sessionId}`);
            console.log(`Total updates: ${response.data.data.totalUpdates}`);
            console.log(`Restart required: ${response.data.data.restartRequired}`);
            
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
            
            console.log('\n🎉 Your frontend should now be able to connect to the notification service!');
            console.log('📝 Note: You may need to restart the notification service for changes to take effect.');
            
        } else {
            console.log('❌ CORS settings update failed:', response.data.message);
            if (response.data.data?.results?.failed?.length > 0) {
                console.log('Failed updates:');
                response.data.data.results.failed.forEach(failure => {
                    console.log(`  - ${failure.key}: ${failure.error}`);
                });
            }
        }
    } catch (error) {
        console.log('❌ Error updating CORS settings:', error.response?.data?.message || error.message);
        if (error.response?.status === 403) {
            console.log('🔑 Make sure you have the correct SETTINGS_API_KEY environment variable set.');
        }
        if (error.response?.data?.errors) {
            console.log('Validation errors:');
            error.response.data.errors.forEach(err => {
                console.log(`  - ${err.field}: ${err.message}`);
            });
        }
    }
}

// Run the update
if (require.main === module) {
    updateCorsOrigins().catch(console.error);
}

module.exports = { updateCorsOrigins };
