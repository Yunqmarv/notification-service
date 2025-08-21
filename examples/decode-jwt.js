const jwt = require('jsonwebtoken');

// Decode JWT without verification to see what's inside
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiOGU1ODA4NDQtNDA1My00ZjYwLTk1NDktNTcyMmMwYzQxZTEzIiwiZW1haWwiOiJleGNsdXNpdmVtYXJ2QGdtYWlsLmNvbSIsInVzZXJuYW1lIjoiZXhjbHVzaXZlbWFydiIsIm5hbWUiOiJFeGNsdXNpdmVtYXJ2Iiwicm9sZSI6InVzZXIiLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwidHlwZSI6ImFjY2VzcyIsInNjb3BlIjoiYWxsIiwiX3dlYnNvY2tldCI6IndlYnNvY2tldCIsIl9jaGF0U2VydiI6ImNoYXRTZXJ2IiwiX2F1dGhTZXJ2IjoiYXV0aFNlcnYiLCJfbm90aWZpY2F0aW9uU2VydiI6Im5vdGlmaWNhdGlvblNlcnYiLCJfZmlsZVNlcnYiOiJmaWxlU2VydiIsIl9fZGF0ZSI6eyJrZXkiOiJfZGF0ZV9fMjRoIiwic2VydmljZSI6ImRhdGVzZXJ2aWNlXzZlZGFhMzhiMDQiLCJpc19hY3RpdmUiOnRydWUsImlzc3VlZF9ieSI6ImF1dGhTZXJ2aWNlXzJiZTY4ZGZkNjkwOTQwYzgiLCJwZXJtaXNzaW9ucyI6WyJjcmVhdGVfZGF0ZSIsImFjY2VwdF9kYXRlX2Zyb21fb3RoZXJzIiwicmVqZWN0X2RhdGVfZnJvbV9vdGhlcnMiLCJjYW5jZWxfZGF0ZV9vd25fZGF0ZSJdLCJyZWdpb24iOiJnbG9iYWwiLCJyZXF1ZXN0ZWRfYXQiOiIyMDI1LTA4LTIxVDE4OjA1OjI1LjYzNloiLCJleHBpcnlfc2Vjb25kcyI6IjI0aCIsInZlcnNpb24iOjEsImludGVybmFsX2ZsYWdzIjp7InByaW9yaXR5X3VzZXIiOmZhbHNlLCJvbl9wcm9tbyI6ZmFsc2V9fSwiX19naWZ0Ijp7ImtleSI6Il9naWZ0X18yNGgiLCJzZXJ2aWNlIjoiZ2lmdHNlcnZpY2VfYzE2YTVjOWQyYiIsInNlcnZpY2VpZF9fIjoiOWRmMDQ3YTg2ZWIzNzM3ZDdiZTViMmZjZTMxMTI4M2FjZTNjIiwiaXNfYWN0aXZlIjp0cnVlLCJpc3N1ZWRfYnkiOiJhdXRoU2VydmljZV8zNjVlMGYwM2JiYTA1MDlkIiwicGVybWlzc2lvbnMiOlsic2VuZF9naWZ0IiwicmVjZWl2ZV9naWZ0Iiwidmlld19naWZ0X2hpc3RvcnkiLCJ2aWV3X2dpZnRlZF91c2VycyIsIm1hbmFnZV9yZWNlaXZlZF9naWZ0cyIsIm1hbmFnZV9jb2luX2JhbGFuY2UiLCJjYW5fd2l0aGRyYXdfY29pbnMiXSwicmVnaW9uIjoiZ2xvYmFsIiwicmVxdWVzdGVkX2F0IjoiMjAyNS0wOC0yMVQxODowNToyNS42MzZaIiwiZXhwaXJ5X3NlY29uZHMiOiIyNGgiLCJ2ZXJzaW9uIjoxLCJpbnRlcm5hbF9mbGFncyI6eyJpc19naWZ0ZWRfdXNlciI6ZmFsc2UsImhhc19wZW5kaW5nX2dpZnRzIjpmYWxzZX19LCJfX2FkcyI6eyJrZXkiOiJfYWRzX18yNGgiLCJzZXJ2aWNlIjoiYWRzc2VydmljZV9jNDRhZWM3NWFkIiwic2VydmljZWlkX18iOiJhZHNfZTdlYjYzZGY3NTNjNTE0ZWU0MTk3YWJjMzNhM2IwMGEiLCJpc19hY3RpdmUiOnRydWUsImlzc3VlZF9ieSI6ImF1dGhTZXJ2aWNlXzE5ODBmZTdiOWUwYmEwZTciLCJwZXJtaXNzaW9ucyI6WyJjcmVhdGVfYWRfY2FtcGFpZ24iLCJwYXVzZV9hZF9jYW1wYWlnbiIsInJlc3VtZV9hZF9jYW1wYWlnbiIsInN0b3BfYWRfY2FtcGFpZ24iLCJ2aWV3X2FkX2NhbXBhaWduIiwiZGVsZXRlX2FkX2NhbXBhaWduIiwiY3JlYXRlX2Fkc19jcmVhdGl2ZSIsInZpZXdfYWRzX2NyZWF0aXZlIiwidXBkYXRlX2Fkc19jcmVhdGl2ZSIsImRlbGV0ZV9hZHNfY3JlYXRpdmUiLCJ2aWV3X2Fkc19hbmFseXRpY3MiLCJtYW5hZ2VfYWRzX3RhcmdldGluZyIsInZpZXdfYWRzX3RhcmdldGluZyJdLCJyZWdpb24iOiJnbG9iYWwiLCJyZXF1ZXN0ZWRfYXQiOiIyMDI1LTA4LTIxVDE4OjA1OjI1LjYzNloiLCJleHBpcnlfc2Vjb25kcyI6IjI0aCIsInZlcnNpb24iOjF9LCJ0d29fZmFjdG9yX3ZlcmlmaWVkIjp0cnVlLCJpYXQiOjE3NTU3OTk1MjUsImp0aSI6ImRkZDY3YjY3M2ZjYTlhYzE1ZDJhZjMzZTZiNjZkNTVkIiwiZXhwIjoxNzU1ODg1OTI1LCJhdWQiOiJkYXRpbmctYXBwIiwiaXNzIjoiYXV0aC1zZXJ2aWNlIiwic3ViIjoiOGU1ODA4NDQtNDA1My00ZjYwLTk1NDktNTcyMmMwYzQxZTEzIn0.DHO2TZFhJ1Xa9dBNt7Ey8dNtVFKM1EWhk_zQ6WvBqgs";

console.log('🔍 Decoding JWT Token (without verification)...\n');

try {
    // Decode without verification to see the payload
    const decoded = jwt.decode(token, { complete: true });
    
    console.log('📋 Token Header:');
    console.log(JSON.stringify(decoded.header, null, 2));
    
    console.log('\n📋 Token Payload:');
    console.log(JSON.stringify(decoded.payload, null, 2));
    
    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    const exp = decoded.payload.exp;
    
    console.log('\n⏰ Token Timing:');
    console.log(`Current time: ${now} (${new Date(now * 1000).toISOString()})`);
    console.log(`Token expires: ${exp} (${new Date(exp * 1000).toISOString()})`);
    console.log(`Token expired: ${exp < now ? '❌ YES' : '✅ NO'}`);
    
    // Check user ID fields
    console.log('\n👤 User ID Fields:');
    console.log(`user_id: ${decoded.payload.user_id}`);
    console.log(`userId: ${decoded.payload.userId}`);
    console.log(`sub: ${decoded.payload.sub}`);
    
} catch (error) {
    console.error('❌ Error decoding token:', error.message);
}

// Try to verify with common secrets
const commonSecrets = [
    'jhbefyuved87teedvuDUE867D5RFRDYUBEDIUEHDUYGETUYB3dygiu33ud3089y7e2e7fsv2biuduevdwudwgdcdhcdiochdcgvcDUYGET7FDUEBDOD978T67DFTEYDUEsiochecghvecbhdcbydcvgdcgyudcuichucdhjcdciuhcececuvycdcicdcdvfv',
];

console.log('\n🔐 Testing common JWT secrets...');

for (const secret of commonSecrets) {
    try {
        const verified = jwt.verify(token, secret);
        console.log(`✅ Token verified with secret: "${secret}"`);
        console.log(`   User ID: ${verified.user_id || verified.userId || verified.sub}`);
        break;
    } catch (error) {
        console.log(`❌ Failed with secret: "${secret}" - ${error.message}`);
    }
}
