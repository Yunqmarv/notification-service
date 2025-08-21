const axios = require('axios');

async function testJWTWithAPI() {
    console.log('🔍 Testing JWT with API directly...\n');
    
    const baseURL = 'http://localhost:3001'; // Local service
    const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiOGU1ODA4NDQtNDA1My00ZjYwLTk1NDktNTcyMmMwYzQxZTEzIiwiZW1haWwiOiJleGNsdXNpdmVtYXJ2QGdtYWlsLmNvbSIsInVzZXJuYW1lIjoiZXhjbHVzaXZlbWFydiIsIm5hbWUiOiJFeGNsdXNpdmVtYXJ2Iiwicm9sZSI6InVzZXIiLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwidHlwZSI6ImFjY2VzcyIsInNjb3BlIjoiYWxsIiwiX3dlYnNvY2tldCI6IndlYnNvY2tldCIsIl9jaGF0U2VydiI6ImNoYXRTZXJ2IiwiX2F1dGhTZXJ2IjoiYXV0aFNlcnYiLCJfbm90aWZpY2F0aW9uU2VydiI6Im5vdGlmaWNhdGlvblNlcnYiLCJfZmlsZVNlcnYiOiJmaWxlU2VydiIsIl9fZGF0ZSI6eyJrZXkiOiJfZGF0ZV9fMjRoIiwic2VydmljZSI6ImRhdGVzZXJ2aWNlXzZlZGFhMzhiMDQiLCJpc19hY3RpdmUiOnRydWUsImlzc3VlZF9ieSI6ImF1dGhTZXJ2aWNlXzJiZTY4ZGZkNjkwOTQwYzgiLCJwZXJtaXNzaW9ucyI6WyJjcmVhdGVfZGF0ZSIsImFjY2VwdF9kYXRlX2Zyb21fb3RoZXJzIiwicmVqZWN0X2RhdGVfZnJvbV9vdGhlcnMiLCJjYW5jZWxfZGF0ZV9vd25fZGF0ZSJdLCJyZWdpb24iOiJnbG9iYWwiLCJyZXF1ZXN0ZWRfYXQiOiIyMDI1LTA4LTIxVDE4OjA1OjI1LjYzNloiLCJleHBpcnlfc2Vjb25kcyI6IjI0aCIsInZlcnNpb24iOjEsImludGVybmFsX2ZsYWdzIjp7InByaW9yaXR5X3VzZXIiOmZhbHNlLCJvbl9wcm9tbyI6ZmFsc2V9fSwiX19naWZ0Ijp7ImtleSI6Il9naWZ0X18yNGgiLCJzZXJ2aWNlIjoiZ2lmdHNlcnZpY2VfYzE2YTVjOWQyYiIsInNlcnZpY2VpZF9fIjoiOWRmMDQ3YTg2ZWIzNzM3ZDdiZTViMmZjZTMxMTI4M2FjZTNjIiwiaXNfYWN0aXZlIjp0cnVlLCJpc3N1ZWRfYnkiOiJhdXRoU2VydmljZV8zNjVlMGYwM2JiYTA1MDlkIiwicGVybWlzc2lvbnMiOlsic2VuZF9naWZ0IiwicmVjZWl2ZV9naWZ0Iiwidmlld19naWZ0X2hpc3RvcnkiLCJ2aWV3X2dpZnRlZF91c2VycyIsIm1hbmFnZV9yZWNlaXZlZF9naWZ0cyIsIm1hbmFnZV9jb2luX2JhbGFuY2UiLCJjYW5fd2l0aGRyYXdfY29pbnMiXSwicmVnaW9uIjoiZ2xvYmFsIiwicmVxdWVzdGVkX2F0IjoiMjAyNS0wOC0yMVQxODowNToyNS42MzZaIiwiZXhwaXJ5X3NlY29uZHMiOiIyNGgiLCJ2ZXJzaW9uIjoxLCJpbnRlcm5hbF9mbGFncyI6eyJpc19naWZ0ZWRfdXNlciI6ZmFsc2UsImhhc19wZW5kaW5nX2dpZnRzIjpmYWxzZX19LCJfX2FkcyI6eyJrZXkiOiJfYWRzX18yNGgiLCJzZXJ2aWNlIjoiYWRzc2VydmljZV9jNDRhZWM3NWFkIiwic2VydmljZWlkX18iOiJhZHNfZTdlYjYzZGY3NTNjNTE0ZWU0MTk3YWJjMzNhM2IwMGEiLCJpc19hY3RpdmUiOnRydWUsImlzc3VlZF9ieSI6ImF1dGhTZXJ2aWNlXzE5ODBmZTdiOWUwYmEwZTciLCJwZXJtaXNzaW9ucyI6WyJjcmVhdGVfYWRfY2FtcGFpZ24iLCJwYXVzZV9hZF9jYW1wYWlnbiIsInJlc3VtZV9hZF9jYW1wYWlnbiIsInN0b3BfYWRfY2FtcGFpZ24iLCJ2aWV3X2FkX2NhbXBhaWduIiwiZGVsZXRlX2FkX2NhbXBhaWduIiwiY3JlYXRlX2Fkc19jcmVhdGl2ZSIsInZpZXdfYWRzX2NyZWF0aXZlIiwidXBkYXRlX2Fkc19jcmVhdGl2ZSIsImRlbGV0ZV9hZHNfY3JlYXRpdmUiLCJ2aWV3X2Fkc19hbmFseXRpY3MiLCJtYW5hZ2VfYWRzX3RhcmdldGluZyIsInZpZXdfYWRzX3RhcmdldGluZyJdLCJyZWdpb24iOiJnbG9iYWwiLCJyZXF1ZXN0ZWRfYXQiOiIyMDI1LTA4LTIxVDE4OjA1OjI1LjYzNloiLCJleHBpcnlfc2Vjb25kcyI6IjI0aCIsInZlcnNpb24iOjF9LCJ0d29fZmFjdG9yX3ZlcmlmaWVkIjp0cnVlLCJpYXQiOjE3NTU3OTk1MjUsImp0aSI6ImRkZDY3YjY3M2ZjYTlhYzE1ZDJhZjMzZTZiNjZkNTVkIiwiZXhwIjoxNzU1ODg1OTI1LCJhdWQiOiJkYXRpbmctYXBwIiwiaXNzIjoiYXV0aC1zZXJ2aWNlIiwic3ViIjoiOGU1ODA4NDQtNDA1My00ZjYwLTk1NDktNTcyMmMwYzQxZTEzIn0.cJI1KBRS-bDEsNE0ItTYC4Ynv1V9pydG1vQ7KCxYGg4';
    
    try {
        // Test 1: Check service health
        console.log('1️⃣ Testing service health...');
        const healthResponse = await axios.get(`${baseURL}/health`);
        console.log('✅ Service is running:', healthResponse.data.status);
        console.log('');
        
        // Test 2: Test JWT validation with a simple API call
        console.log('2️⃣ Testing JWT validation...');
        try {
            const notificationsResponse = await axios.get(`${baseURL}/api/notifications`, {
                headers: {
                    'Authorization': `Bearer ${testToken}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('✅ JWT validation successful!');
            console.log('   Notifications count:', notificationsResponse.data.notifications?.length || 0);
            console.log('   User ID from response:', notificationsResponse.data.userId);
            
        } catch (apiError) {
            console.log('❌ JWT validation failed:');
            console.log('   Status:', apiError.response?.status);
            console.log('   Message:', apiError.response?.data?.message);
            console.log('   Code:', apiError.response?.data?.code);
            
            if (apiError.response?.status === 401) {
                console.log('\n🔍 This means the JWT secret in the database doesn\'t match the token signing secret');
                console.log('   The token was signed with a different secret than what\'s stored in the database');
            }
        }
        
        // Test 3: Check what settings are available
        console.log('\n3️⃣ Testing settings endpoint...');
        try {
            const settingsResponse = await axios.get(`${baseURL}/api/settings`, {
                headers: {
                    'x-api-key': '319f4d26e31c1a4c0b44e2a8dff8b2e8c83136557af36f9260c75ea3ca9164e8'
                }
            });
            
            console.log('✅ Settings retrieved successfully');
            const securitySettings = settingsResponse.data.settings.filter(s => s.category === 'security');
            console.log('   Security settings found:', securitySettings.length);
            
            const jwtSetting = securitySettings.find(s => s.key === 'security.jwtSecret');
            if (jwtSetting) {
                console.log('   JWT secret configured:', jwtSetting.key);
                console.log('   JWT secret length:', jwtSetting.value?.length || 'null');
                console.log('   JWT secret preview:', jwtSetting.value?.substring(0, 20) + '...' || 'null');
            } else {
                console.log('   ❌ No JWT secret found in settings!');
            }
            
        } catch (settingsError) {
            console.log('❌ Settings retrieval failed:', settingsError.response?.data?.message);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testJWTWithAPI().catch(console.error);
