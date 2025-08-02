#!/usr/bin/env node

// Script to check the JWT secret in the database
require('dotenv').config();
const mongoose = require('mongoose');

async function checkJWTSecret() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Get the settings collection
        const db = mongoose.connection.db;
        const settingsCollection = db.collection('settings');
        
        // Find JWT secret setting
        const jwtSetting = await settingsCollection.findOne({ key: 'security.jwtSecret' });
        
        if (jwtSetting) {
            console.log('JWT Secret found in database:');
            console.log('Key:', jwtSetting.key);
            console.log('Value:', jwtSetting.value);
            console.log('Type:', jwtSetting.type);
        } else {
            console.log('JWT Secret not found in database');
            
            // Let's see all security-related settings
            const securitySettings = await settingsCollection.find({ 
                key: { $regex: /security/i } 
            }).toArray();
            
            console.log('Security settings found:', securitySettings.length);
            securitySettings.forEach(setting => {
                console.log(`- ${setting.key}: ${setting.value}`);
            });
        }
        
        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error.message);
    }
}

checkJWTSecret();
