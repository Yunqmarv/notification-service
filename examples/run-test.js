#!/usr/bin/env node

// Simple test runner for dating notifications
const path = require('path');

// Add current directory to module path
const notificationsDir = path.join(__dirname, '..');
process.chdir(notificationsDir);

console.log('🚀 Dating Notifications Test Runner');
console.log('📁 Working directory:', process.cwd());
console.log('');

// Import and run the tests
const { quickTest } = require('./dating-notifications-example');

const testType = process.argv[2] || 'all';

console.log(`📋 Running tests for: ${testType}`);
console.log('⏳ Starting tests...\n');

quickTest(testType)
    .then(() => {
        console.log('\n🎉 Test runner completed!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Test runner failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    });
