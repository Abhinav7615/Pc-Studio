# MSG91 OTP Widget - Testing & Debugging Guide

## Quick Start Testing

### Prerequisites
- MongoDB running (local or Atlas)
- `.env.local` configured with:
  - `MONGODB_URI`
  - `NEXTAUTH_SECRET`
  - `NEXTAUTH_URL`
  - `MSG91_API_KEY` (for SMS fallback)
  - `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM` (for email OTP)

### Start Development Server
```bash
npm install
npm run dev
```

Server will be available at `http://localhost:3000`

---

## Test Scenario 1: User Registration with Widget OTP

### Step 1: Navigate to Registration Page
```
1. Open http://localhost:3000/register
2. You should see the registration form
```

### Step 2: Fill Registration Form
```
Fields to fill:
- Name: "Test User"
- Email: "testuser@example.com" (optional)
- Mobile: "9876543210" (10-digit number, must be valid Indian number)
- Password: "TestPass123"
- Password Hint: "My favorite place"
- Invitation Code: (leave empty or enter valid referral code)
```

### Step 3: Trigger Widget
```
1. Click "Send OTP" button
2. Expected: Form disappears, error shows if validation fails
3. Expected: Widget container appears with text "Verify your mobile number to complete registration"
4. Expected: MSG91 widget script loads (check DevTools > Console for load messages)
```

### Step 4: Verify Widget Loaded
```
Check DevTools > Console for:
✓ "MSG91 OTP widget loaded"
✓ No errors about script loading

Check DevTools > Network for:
✓ Requests to https://verify.msg91.com/otp-provider.js (or fallback CDN)
```

### Step 5: Complete Widget OTP
```
1. Widget should display OTP input field
2. Check your phone for SMS with OTP code
3. Enter OTP in widget
4. Click verify/submit in widget
5. Widget should validate and return success
```

### Step 6: Verify Success
```
Expected outcomes:
✓ Widget closes automatically
✓ Success message shows with referral code
✓ Referral code is displayed and copyable
✓ "Copy" button works
✓ "Continue to Login" button appears
6. Check MongoDB for new user in Users collection
7. Verify User has referralCode field populated
```

### Troubleshooting Registration

| Issue | Solution |
|-------|----------|
| Widget doesn't appear | Check browser console for script errors; verify widgetId in code |
| OTP not received | Check SMS balance in MSG91 account; verify mobile number format |
| "Invalid mobile number" error | Ensure 10-digit number without country code |
| Build errors | Run `rm -rf .next && npm install` |

---

## Test Scenario 2: Password Reset with Mobile OTP

### Step 1: Navigate to Forgot Password
```
1. Open http://localhost:3000/forgot-password
2. You should see method selection (Email/Mobile)
```

### Step 2: Select Mobile Method
```
1. Click "Mobile" radio button
2. Enter registered mobile number: "9876543210"
3. Click "Send OTP"
```

### Step 3: Widget Appears
```
Expected:
✓ Widget container appears
✓ "Verify your mobile number to reset password" message
✓ Widget OTP input visible
```

### Step 4: Complete Widget OTP
```
1. Check phone for SMS with OTP
2. Enter OTP in widget
3. Widget verifies successfully
4. Widget closes automatically
```

### Step 5: Reset Password
```
Expected after widget closes:
✓ Form changes to password reset section
✓ Password hint displayed: "My favorite place"
✓ "New Password" field visible
✓ "Confirm Password" field visible

Actions:
1. Enter new password: "NewPass456"
2. Confirm password: "NewPass456"
3. Click "Reset Password"
```

### Step 6: Verify Reset Success
```
Expected:
✓ Success message: "Password reset successfully! Redirecting to login..."
✓ After 2 seconds: Redirected to /login
✓ Can login with new password: NewPass456
```

### Troubleshooting Password Reset

| Issue | Solution |
|-------|----------|
| "User not found" | Verify registered mobile number is correct |
| Widget error after 1st attempt | Try again; check SMS quota |
| Can't login with new password | Verify password was saved; try reset again |

---

## Test Scenario 3: Password Reset with Email OTP

### Step 1: Navigate to Forgot Password
```
1. Open http://localhost:3000/forgot-password
2. Select "Email" radio button
```

### Step 2: Enter Email
```
1. Enter registered email: "testuser@example.com"
2. Click "Send OTP"
```

### Step 3: Check Email
```
Expected:
✓ Success message: "OTP sent to te***@example.com"
✓ Email arrives at your email address
✓ Email contains 6-digit OTP code
```

### Step 4: Enter Email OTP
```
1. Form changes to OTP input
2. Message shows: "We've sent an OTP to your email address"
3. Enter 6-digit OTP from email
4. Click "Verify OTP"
```

### Step 5: Reset Password
```
Expected same as mobile flow:
✓ New password form appears
✓ Password hint displayed
✓ Enter new password and confirm
4. Click "Reset Password"
```

### Step 6: Verify Reset Success
```
Same success indicators as mobile flow
```

---

## Test Scenario 4: Referral Code System

### Create Referrer Account
```
1. Register as User A with phone: "9111111111"
2. Copy referral code shown in success page
3. Example: "USR123XYZ"
```

### Register Invitee with Referral
```
1. Go to /register
2. Fill form for User B (phone: "9222222222")
3. In "Invitation Code" field: "USR123XYZ"
4. Complete registration
```

### Verify Referral Rewards
```
Expected:
✓ Invitee (User B) sees "Welcome Bonus - Invitee Discount"
✓ Shows discount amount: "₹50" (or configured amount)
✓ Shows coupon code that can be copied
✓ Referrer (User A) receives separate coupon code

Check MongoDB Coupons collection:
✓ Two new coupons created
✓ One for User A (referrer)
✓ One for User B (invitee)
✓ Both have 30-day expiration (or configured)
```

---

## Debugging Guide

### Enable Console Logging

#### In Browser DevTools
```javascript
// Check for widget initialization
console.log('Window has initSendOTP:', typeof window.initSendOTP);

// Monitor OTP form submission
// DevTools > Elements > Find input with name="identifier"
```

#### Server Logs
```bash
# Watch Next.js server output
npm run dev

# Look for:
- [MSG91 DEBUG] messages from API routes
- "OTP verified successfully" messages
- "Registration error:" if any
```

### Check Network Requests

#### Widget Script Loading
```
DevTools > Network tab:
1. Filter: .js files
2. Look for: verify.msg91.com/otp-provider.js
3. Expected: 200 response
4. Size: ~50-100KB
```

#### API Calls
```
DevTools > Network > Fetch/XHR:
1. POST /api/register
   - Headers: Content-Type: application/json
   - Body: { form data, otpToken }
   - Response: { referralCode, success: true }

2. POST /api/auth/reset-password
   - Headers: Content-Type: application/json
   - Body: { resetToken, newPassword }
   - Response: { success: true }
```

### Check Database

#### MongoDB Atlas UI or Local mongosh

```javascript
// Check new user
db.users.findOne({ mobile: "9876543210" })
// Expected fields: name, email, mobile, referralCode, customerId, password (hashed)

// Check tokens
db.tokens.find({ type: 'register' })
// Expected: token, type, mobile, email, expiresAt

// Check coupons created
db.coupons.find({ type: 'referral' })
// Expected: code, discountValue, expirationDate, user (populated)
```

---

## Common Errors & Solutions

### Error: "Invalid OTP"

**Causes:**
1. OTP typed incorrectly
2. OTP expired (> 15 minutes)
3. OTP doesn't match what was sent

**Solution:**
```
- Request new OTP and try again immediately
- Verify OTP is exactly 6 digits
- Check phone for correct OTP code
- Try again within 15 minutes
```

### Error: "User already exists"

**Causes:**
1. Same email already registered
2. Same mobile already registered

**Solution:**
```
- Use different mobile number
- Use different email address
- Or reset existing user password instead
```

### Error: "Invalid mobile number"

**Causes:**
1. Less than 10 digits
2. More than 10 digits
3. Contains non-numeric characters
4. Country code included (+91)

**Solution:**
```
- Use exactly 10 digits
- Remove country code
- Use only numbers
- Examples that work:
  ✓ 9876543210
  ✓ 9111111111
  ✗ +919876543210
  ✗ 91 9876543210
  ✗ 987654321 (only 9 digits)
```

### Error: "Password must be at least 6 characters"

**Solution:**
```
- Enter password with 6+ characters
- Password can include: a-z, A-Z, 0-9, special chars
```

### Error: "OTP token is required"

**Causes:**
1. Widget didn't complete successfully
2. Widget callback didn't receive token
3. Submission happened without widget verification

**Solution:**
```
- Verify OTP again in widget
- Wait for widget success callback
- Check browser console for widget errors
- Reload page and try again
```

### Widget Not Appearing

**Troubleshooting Steps:**

```bash
# Step 1: Check script loading
# DevTools > Console
console.log(window.initSendOTP)
# Should output: function (not undefined)

# Step 2: Check for script errors
# DevTools > Console
# Look for red errors about verify.msg91.com

# Step 3: Check page rendering
# DevTools > Elements
# Find div#otp-widget-container
# Should exist in DOM

# Step 4: Check styles
# Ensure container is not hidden (display: none)
```

---

## Performance Testing

### Widget Load Time
```javascript
// In browser console before registration:
performance.mark('widget-start');

// After clicking "Send OTP":
performance.mark('widget-end');
performance.measure('widget-load', 'widget-start', 'widget-end');

// View results:
performance.getEntriesByName('widget-load')[0].duration
// Expected: < 2000ms
```

### Registration API Response Time
```
DevTools > Network > POST /api/register
- Check "Time" column
- Expected: < 500ms for successful request
```

### Database Performance
```javascript
// In MongoDB:
db.users.collection.stats()
// Check avgObjSize and totalSize

db.tokens.collection.stats()
// Should be small (temporary tokens)
```

---

## Security Checklist

### Verify No Sensitive Data Logged

```bash
# Check Next.js console output
npm run dev

# Should NOT see:
- Plain text passwords
- Full OTP codes
- API keys in plain text
- User personal data

# Should see:
- [MSG91 DEBUG] messages with sanitized info
- Generic error messages
```

### Verify HTTPS in Production

```javascript
// In production only:
if (!window.location.href.startsWith('https')) {
  console.warn('Not using HTTPS - widget may not work');
}
```

### Verify Token Expiration

```javascript
// Check MongoDB
db.tokens.findOne()
// expiresAt field should be ~15 minutes in future
// Or in past for expired tokens (should be auto-deleted)
```

---

## Load Testing

### Single User Flow (Manual)
```
Time: < 5 seconds total
Steps: Registration → OTP → Success

Expected:
- Page load: < 1s
- Widget load: < 2s
- OTP entry + verification: < 3s
- Redirect: < 1s
```

### Multiple Users (Simulated)
```bash
# Using Apache Bench (if installed)
ab -n 10 -c 5 http://localhost:3000/register

# Expected:
- No errors
- Response time increases slightly with more concurrent users
- Server handles gracefully
```

---

## Browser Compatibility

### Tested Browsers
- [x] Chrome/Edge (latest)
- [x] Firefox (latest)
- [ ] Safari (needs testing)
- [ ] Mobile browsers (needs testing)

### Browser Console Checks
```javascript
// Should output true in all modern browsers:
console.log(typeof fetch);          // function
console.log(typeof Promise);        // function
console.log(typeof async function(){});  // function
```

---

## Cleanup & Reset

### Reset Database (Development Only)
```bash
# Delete all users
db.users.deleteMany({})

# Delete all tokens
db.tokens.deleteMany({})

# Delete all coupons
db.coupons.deleteMany({})
```

### Clear Browser Cache
```
DevTools > Application > Storage > Clear site data
```

### Fresh Build
```bash
rm -rf .next node_modules
npm install
npm run build
```

---

## Quick Reference Commands

```bash
# Development
npm run dev                 # Start dev server
npm run build              # Production build
npm run lint               # Check for linting issues

# Database
npx tsx lib/seed.ts        # Seed admin user

# Testing
npm test                   # Run tests (if configured)

# Deployment
npm run build && npm start # Run production build
```

---

## Monitoring & Analytics

### Key Metrics to Track
1. **Registration Success Rate**
   - Total registrations / Total attempts
   - Target: > 90%

2. **OTP Verification Rate**
   - Total verified OTPs / Total sent OTPs
   - Target: > 95%

3. **API Response Time**
   - Average time: < 500ms
   - P99: < 1000ms

4. **Widget Load Time**
   - Average: < 2 seconds
   - P99: < 5 seconds

### Error Tracking
```javascript
// Log errors to service (e.g., Sentry)
if (error) {
  console.error('OTP Error:', {
    flow: 'registration',
    error: error.message,
    timestamp: new Date(),
  });
}
```

---

## Next Steps

1. **Testing**
   - [ ] Complete manual testing with all scenarios
   - [ ] Test with different mobile numbers
   - [ ] Test with different browsers
   - [ ] Test error cases

2. **Deployment**
   - [ ] Deploy to staging environment
   - [ ] Run smoke tests in staging
   - [ ] Configure production environment
   - [ ] Deploy to production

3. **Monitoring**
   - [ ] Set up error tracking (Sentry)
   - [ ] Set up performance monitoring
   - [ ] Set up user analytics
   - [ ] Create alerting rules

4. **Documentation**
   - [ ] Create user guide for customers
   - [ ] Create admin documentation
   - [ ] Create API documentation for third-party integrations

---

**Last Updated**: 2024  
**Version**: 1.0  
**Status**: Ready for Testing
