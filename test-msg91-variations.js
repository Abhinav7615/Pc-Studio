// Test different MSG91 API formats
const API_KEY = '502324AjF9BONX69f62f28P1';
const SENDER_ID = 'PCSTUD';
const PHONE = '919876543210';
const MESSAGE = 'Test OTP: 123456';

async function testVariations() {
  console.log('🧪 Testing MSG91 API Variations\n');

  const tests = [
    // Old sendhttp endpoint
    {
      name: 'GET /api/sendhttp (legacy)',
      request: () => fetch(
        `https://api.msg91.com/api/sendhttp?authkey=${API_KEY}&mobiles=${PHONE}&message=${encodeURIComponent(MESSAGE)}&sender=${SENDER_ID}&route=4`,
        { method: 'GET' }
      )
    },
    // POST variant
    {
      name: 'POST /api/send',
      request: () => fetch(
        'https://api.msg91.com/api/send',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `authkey=${API_KEY}&mobiles=${PHONE}&message=${encodeURIComponent(MESSAGE)}&sender=${SENDER_ID}`
        }
      )
    },
    // New POST endpoint
    {
      name: 'POST /api/v5/send (JSON)',
      request: () => fetch(
        'https://api.msg91.com/api/v5/send',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'authkey': API_KEY },
          body: JSON.stringify({
            recipients: [{ mobiles: PHONE }],
            message: MESSAGE,
            sender: SENDER_ID
          })
        }
      )
    },
    // API v5 with route
    {
      name: 'POST /api/v5/send (with route)',
      request: () => fetch(
        'https://api.msg91.com/api/v5/send',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'authkey': API_KEY },
          body: JSON.stringify({
            recipients: [{ mobiles: PHONE }],
            message: MESSAGE,
            sender: SENDER_ID,
            route: 4
          })
        }
      )
    },
    // bearer token format
    {
      name: 'Bearer token format',
      request: () => fetch(
        `https://api.msg91.com/api/send?key=${API_KEY}&mobiles=${PHONE}&message=${encodeURIComponent(MESSAGE)}&sender=${SENDER_ID}`,
        { method: 'GET' }
      )
    },
    // Control endpoint
    {
      name: 'control.msg91.com (POST)',
      request: () => fetch(
        'https://control.msg91.com/api/sendSMS',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `authkey=${API_KEY}&mobiles=${PHONE}&message=${encodeURIComponent(MESSAGE)}&sender=${SENDER_ID}`
        }
      )
    },
    // Simple test
    {
      name: 'Simple GET without params',
      request: () => fetch(
        `https://api.msg91.com/api/send?authkey=${API_KEY}&route=4&mobiles=${PHONE}&message=${encodeURIComponent(MESSAGE)}`,
        { method: 'GET' }
      )
    }
  ];

  for (const test of tests) {
    try {
      console.log(`📍 ${test.name}`);
      const response = await test.request();
      const body = await response.text();
      
      console.log(`   Status: ${response.status} ${response.statusText}`);
      
      if (response.status === 200 || response.status === 201) {
        console.log(`   ✅ SUCCESS RESPONSE`);
        console.log(`   Body: ${body.substring(0, 150)}`);
      } else if (response.status === 404) {
        console.log(`   ❌ 404 Not Found`);
      } else {
        console.log(`   Response: ${body.substring(0, 100)}`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    console.log('');
  }

  console.log('\n💡 Recommendations:');
  console.log('1. Check if MSG91 has deprecated old endpoints');
  console.log('2. Try using the API key from another account');
  console.log('3. Contact MSG91 support for endpoint information');
  console.log('4. Check MSG91 docs for your account type');
}

testVariations();
