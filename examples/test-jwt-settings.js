const SettingsService = require('../src/services/settings');
const jwt = require('jsonwebtoken');

async function testJWTSettings() {
    console.log('🔍 Testing JWT Settings...\n');
    
    try {
        // Initialize settings service
        await SettingsService.initialize();
        console.log('✅ Settings service initialized');
        
        // Get the JWT secret from database settings
        const jwtSecret = SettingsService.get('security.jwtSecret');
        console.log('📋 JWT Secret from database settings:');
        console.log('   Length:', jwtSecret ? jwtSecret.length : 'null');
        console.log('   Value preview:', jwtSecret ? jwtSecret.substring(0, 20) + '...' : 'null');
        
        if (!jwtSecret) {
            console.log('❌ No JWT secret found in database settings!');
            console.log('   Available security settings:');
            
            // Try to get all settings with security prefix
            const allSettings = SettingsService.getByCategory('security');
            console.log('   Security settings:', allSettings);
            return;
        }
        
        // Test JWT verification with our token
        const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiOGU1ODA4NDQtNDA1My00ZjYwLTk1NDktNTcyMmMwYzQxZTEzIiwiZW1haWwiOiJleGNsdXNpdmVtYXJ2QGdtYWlsLmNvbSIsInVzZXJuYW1lIjoiZXhjbHVzaXZlbWFydiIsIm5hbWUiOiJFeGNsdXNpdmVtYXJ2Iiwicm9sZSI6InVzZXIiLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwidHlwZSI6ImFjY2VzcyIsInNjb3BlIjoiYWxsIiwiX3dlYnNvY2tldCI6IndlYnNvY2tldCIsIl9jaGF0U2VydiI6ImNoYXRTZXJ2IiwiX2F1dGhTZXJ2IjoiYXV0aFNlcnYiLCJfbm90aWZpY2F0aW9uU2VydiI6Im5vdGlmaWNhdGlvblNlcnYiLCJfZmlsZVNlcnYiOiJmaWxlU2VydiIsIl9fZGF0ZSI6eyJrZXkiOiJfZGF0ZV9fMjRoIiwic2VydmljZSI6ImRhdGVzZXJ2aWNlXzZlZGFhMzhiMDQiLCJpc19hY3RpdmUiOnRydWUsImlzc3VlZF9ieSI6ImF1dGhTZXJ2aWNlXzJiZTY4ZGZkNjkwOTQwYzgiLCJwZXJtaXNzaW9ucyI6WyJjcmVhdGVfZGF0ZSIsImFjY2VwdF9kYXRlX2Zyb21fb3RoZXJzIiwicmVqZWN0X2RhdGVfZnJvbV9vdGhlcnMiLCJjYW5jZWxfZGF0ZV9vd25fZGF0ZSJdLCJyZWdpb24iOiJnbG9iYWwiLCJyZXF1ZXN0ZWRfYXQiOiIyMDI1LTA4LTIxVDE4OjA1OjI1LjYzNloiLCJleHBpcnlfc2Vjb25kcyI6IjI0aCIsInZlcnNpb24iOjEsImludGVybmFsX2ZsYWdzIjp7InByaW9yaXR5X3VzZXIiOmZhbHNlLCJvbl9wcm9tbyI6ZmFsc2V9fSwiX19naWZ0Ijp7ImtleSI6Il9naWZ0X18yNGgiLCJzZXJ2aWNlIjoiZ2lmdHNlcnZpY2VfYzE2YTVjOWQyYiIsInNlcnZpY2VpZF9fIjoiOWRmMDQ3YTg2ZWIzNzM3ZDdiZTViMmZjZTMxMTI4M2FjZTNjIiwiaXNfYWN0aXZlIjp0cnVlLCJpc3N1ZWRfYnkiOiJhdXRoU2VydmljZV8zNjVlMGYwM2JiYTA1MDlkIiwicGVybWlzc2lvbnMiOlsic2VuZF9naWZ0IiwicmVjZWl2ZV9naWZ0Iiwidmlld19naWZ0X2hpc3RvcnkiLCJ2aWV3X2dpZnRlZF91c2VycyIsIm1hbmFnZV9yZWNlaXZlZF9naWZ0cyIsIm1hbmFnZV9jb2luX2JhbGFuY2UiLCJjYW5fd2l0aGRyYXdfY29pbnMiXSwicmVnaW9uIjoiZ2xvYmFsIiwicmVxdWVzdGVkX2F0IjoiMjAyNS0wOC0yMVQxODowNToyNS42MzZaIiwiZXhwaXJ5X3NlY29uZHMiOiIyNGgiLCJ2ZXJzaW9uIjoxLCJpbnRlcm5hbF9mbGFncyI6eyJpc19naWZ0ZWRfdXNlciI6ZmFsc2UsImhhc19wZW5kaW5nX2dpZnRzIjpmYWxzZX19LCJfX2FkcyI6eyJrZXkiOiJfYWRzX18yNGgiLCJzZXJ2aWNlIjoiYWRzc2VydmljZV9jNDRhZWM3NWFkIiwic2VydmljZWlkX18iOiJhZHNfZTdlYjYzZGY3NTNjNTE0ZWU0MTk3YWJjMzNhM2IwMGEiLCJpc19hY3RpdmUiOnRydWUsImlzc3VlZF9ieSI6ImF1dGhTZXJ2aWNlXzE5ODBmZTdiOWUwYmEwZTciLCJwZXJtaXNzaW9ucyI6WyJjcmVhdGVfYWRfY2FtcGFpZ24iLCJwYXVzZV9hZF9jYW1wYWlnbiIsInJlc3VtZV9hZF9jYW1wYWlnbiIsInN0b3BfYWRfY2FtcGFpZ24iLCJ2aWV3X2FkX2NhbXBhaWduIiwiZGVsZXRlX2FkX2NhbXBhaWduIiwiY3JlYXRlX2Fkc19jcmVhdGl2ZSIsInZpZXdfYWRzX2NyZWF0aXZlIiwidXBkYXRlX2Fkc19jcmVhdGl2ZSIsImRlbGV0ZV9hZHNfY3JlYXRpdmUiLCJ2aWV3X2Fkc19hbmFseXRpY3MiLCJtYW5hZ2VfYWRzX3RhcmdldGluZyIsInZpZXdfYWRzX3RhcmdldGluZyJdLCJyZWdpb24iOiJnbG9iYWwiLCJyZXF1ZXN0ZWRfYXQiOiIyMDI1LTA4LTIxVDE4OjA1OjI1LjYzNloiLCJleHBpcnlfc2Vjb25kcyI6IjI0aCIsInZlcnNpb24iOjF9LCJ0d29fZmFjdG9yX3ZlcmlmaWVkIjp0cnVlLCJpYXQiOjE3NTU3OTk1MjUsImp0aSI6ImRkZDY3YjY3M2ZjYTlhYzE1ZDJhZjMzZTZiNjZkNTVkIiwiZXhwIjoxNzU1ODg1OTI1LCJhdWQiOiJkYXRpbmctYXBwIiwiaXNzIjoiYXV0aC1zZXJ2aWNlIiwic3ViIjoiOGU1ODA4NDQtNDA1My00ZjYwLTk1NDktNTcyMmMwYzQxZTEzIn0.cJI1KBRS-bDEsNE0ItTYC4Ynv1V9pydG1vQ7KCxYGg4';
        
        try {
            const decoded = jwt.verify(testToken, jwtSecret);
            console.log('✅ JWT verification successful!');
            console.log('   User ID (user_id):', decoded.user_id);
            console.log('   User ID (userId):', decoded.userId);
            console.log('   Subject (sub):', decoded.sub);
            console.log('   Role:', decoded.role);
            console.log('   Expires:', new Date(decoded.exp * 1000).toISOString());
        } catch (jwtError) {
            console.log('❌ JWT verification failed:', jwtError.message);
            console.log('   Error type:', jwtError.name);
            
            // Try to decode without verification to see the payload
            const decoded = jwt.decode(testToken, { complete: true });
            console.log('   Token header algorithm:', decoded.header.alg);
            console.log('   Token payload user_id:', decoded.payload.user_id);
            console.log('   Token expiry:', new Date(decoded.payload.exp * 1000).toISOString());
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

testJWTSettings().catch(console.error);
