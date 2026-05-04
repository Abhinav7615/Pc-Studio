# MSG91 API Configuration Status Report

## Current Setup
- ✅ API Key configured in `.env.local`: `MSG91_API_KEY=502324AjF9BONX69f62f28P1`
- ✅ SMS provider code integrated across:
  - `/api/otp/register` - registration OTP via SMS
  - `/api/otp/forgot-password` - password reset OTP via SMS  
  - `/api/otp/mobile` - mobile verification OTP
- ✅ All OTP routes build successfully

## Issue Found
❌ **API Key is not working** - All MSG91 endpoints returning 404

**Tested endpoints:**
- `https://api.msg91.com/api/sendhttp` - 404
- `https://api.msg91.com/api/send` - 404
- `https://control.msg91.com/api/sendSMS` - 404
- `https://api.msg91.com/api/v5/send` - 404 (Route Missing)

## What Could Be Wrong

1. **API Key is invalid or expired**
   - Check MSG91 dashboard for active API keys
   - Generate a new API key if needed

2. **Account has billing/suspension issues**
   - Log in to MSG91 account
   - Check account status and credits
   - Verify if SMS credits are available

3. **Account needs activation**
   - First time accounts may need verification
   - Check for pending SMS limits or restrictions

4. **Different authentication method required**
   - Some MSG91 accounts may use different auth (OAuth, API v5)
   - Check MSG91 API documentation for your account type

## Solutions

### Option 1: Fix MSG91 Account
1. Go to https://www.msg91.com/user/login
2. Login with your credentials
3. Check Account Settings > API Keys
4. Verify the API key: `502324AjF9BONX69f62f28P1`
5. If invalid, generate a new one and update `.env.local`
6. Check SMS Balance/Credits

### Option 2: Use Twilio Fallback (Recommended for Testing)
Add these to `.env.local`:
```
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_SMS_FROM=+1234567890
```

The system will automatically use Twilio if MSG91 fails.

### Option 3: Development Mode (For Testing Without SMS)
In development (`NODE_ENV=development`), SMS will log to console instead of failing:
```
📱 [DEV MODE] SMS would be sent:
   To: 919876543210
   Message: Your OTP is: 123456
```

## Testing Commands

After fixing the API key:

```bash
# Test OTP registration
curl -X POST http://localhost:3000/api/otp/register \
  -H "Content-Type: application/json" \
  -d '{"action":"send","mobile":"9876543210"}'

# Test OTP forgot-password
curl -X POST http://localhost:3000/api/otp/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"action":"send","identifier":"your-email@example.com","method":"mobile"}'
```

## Configuration Summary

| Setting | Value | Status |
|---------|-------|--------|
| MSG91_API_KEY | 502324AjF9BONX69f62f28P1 | ❌ Not working |
| MSG91_SENDER_ID | PCSTUD | ✅ Configured |
| Email OTP | (fallback) | ✅ Working |
| Twilio SMS | (optional) | 🔲 Not configured |

## Next Steps

1. **Verify MSG91 account status** at msg91.com dashboard
2. **Update API key** if needed in `.env.local`
3. **Test with curl** or registration page
4. **Switch to Twilio** as temporary solution if MSG91 is down
5. **Report** the actual error from MSG91 dashboard if it's account-related

---

**Note:** SMS OTP is mandatory for registration. If both MSG91 and Twilio fail, registration will be blocked with error: "Failed to send OTP".
