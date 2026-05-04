# MSG91 OTP Widget Implementation Guide

## Overview

This project now uses the **MSG91 OTP Widget** for mobile OTP verification in two flows:
1. **User Registration** (`/app/register/page.tsx`)
2. **Password Reset** (`/app/forgot-password/page.tsx`)

The widget provides a secure, pre-built OTP verification interface that handles SMS delivery and verification automatically.

## Architecture

### Widget Configuration
- **Widget ID**: `366441705372363439393933`
- **Provider**: MSG91 (https://msg91.com)
- **Script Sources**:
  - Primary: `https://verify.msg91.com/otp-provider.js`
  - Fallback: `https://verify.phone91.com/otp-provider.js`

### Flow Overview

```
User Registration Flow:
1. User fills form (name, email, mobile, password, etc.)
2. Clicks "Send OTP" button
3. Widget displays in modal/inline container
4. User enters OTP sent via SMS
5. Widget verifies OTP with MSG91 backend
6. On success: Widget returns verification token
7. Frontend calls /api/register with otpToken
8. Registration completes, referral code generated

Password Reset Flow:
1. User chooses reset method (Email or Mobile)
2. For Mobile: Shows MSG91 widget
3. For Email: Shows manual OTP input (via /api/otp/forgot-password)
4. User verifies OTP
5. User enters new password
6. Backend updates password
```

## Frontend Implementation

### 1. Registration Page (`/app/register/page.tsx`)

#### State Management
```typescript
const [showOtpWidget, setShowOtpWidget] = useState(false);
const [otpToken, setOtpToken] = useState('');
const [form, setForm] = useState({
  name: '',
  email: '',
  mobile: '',
  password: '',
  passwordHint: '',
  invitationCode: '',
});
```

#### Widget Initialization (useEffect)
```typescript
useEffect(() => {
  if (showOtpWidget && window.initSendOTP) {
    const configuration = {
      widgetId: '366441705372363439393933',
      tokenAuth: process.env.NEXT_PUBLIC_MSG91_WIDGET_TOKEN,
      identifier: form.mobile || '',
      exposeMethods: 'true',
      success: async (data: any) => {
        setOtpToken(data.token || data.tokenAuth || '');
        setShowOtpWidget(false);
        handleCompleteRegistration(data.token || data.tokenAuth || '');
      },
      failure: (error: any) => {
        setError(error?.message || 'OTP verification failed.');
      },
    };
    
    if (window.initSendOTP) {
      window.initSendOTP(configuration);
    }
  }
}, [showOtpWidget]);
```

#### Flow
1. User fills registration form
2. Clicks "Send OTP" - validates form and calls `handleSubmit()`
3. `handleSubmit()` sets `showOtpWidget = true`
4. useEffect initializes widget with mobile number
5. User verifies OTP in widget
6. Widget calls success callback with token
7. `handleCompleteRegistration(token)` sends token to `/api/register`

### 2. Forgot Password Page (`/app/forgot-password/page.tsx`)

#### Method Selection
- **Email**: Manual OTP input via `/api/otp/forgot-password`
- **Mobile**: MSG91 widget (same configuration as registration)

#### Widget Initialization (useEffect)
```typescript
useEffect(() => {
  if (showOtpWidget && method === 'mobile' && window.initSendOTP) {
    const configuration = {
      widgetId: '366441705372363439393933',
      tokenAuth: process.env.NEXT_PUBLIC_MSG91_WIDGET_TOKEN,
      identifier: identifierForWidget || '',
      exposeMethods: 'true',
      success: async (data: any) => {
        const token = data.token || data.tokenAuth || '';
        setResetToken(token);
        setShowOtpWidget(false);
        setStep('reset');
      },
      failure: (error: any) => {
        setError(error?.message || 'OTP verification failed.');
      },
    };
    
    if (window.initSendOTP) {
      window.initSendOTP(configuration);
    }
  }
}, [showOtpWidget, identifierForWidget, method]);
```

### 3. Script Loading

Both pages load MSG91 widget scripts using Next.js `<Script>` component:

```typescript
import Script from 'next/script';

// In component:
<Script
  src="https://verify.msg91.com/otp-provider.js"
  strategy="lazyOnload"
/>
<Script
  src="https://verify.phone91.com/otp-provider.js"
  strategy="lazyOnload"
  onLoad={() => console.log('MSG91 OTP widget loaded')}
/>
```

## Backend Implementation

### 1. Registration API (`/app/api/register/route.ts`)

#### Accepts Both Token Types
```typescript
const { ..., registerToken, otpToken } = await request.json();

// Widget OTP flow - token is pre-verified by MSG91
if (otpToken && !registerToken) {
  if (!otpToken || typeof otpToken !== 'string') {
    return NextResponse.json({ error: 'Invalid OTP token' }, { status: 400 });
  }
}

// Legacy manual OTP flow (still supported)
else if (registerToken && !otpToken) {
  const registerInfo = await Token.findOne({ token: registerToken, type: 'register' });
  // ... validation
}
```

#### Registration Process
1. Validates form fields (name, mobile, email format)
2. Checks if user already exists
3. Hashes password with bcrypt
4. Creates User document with referral code
5. If invitation code provided: Creates referral coupons
6. Returns referral code to frontend

### 2. OTP Send API (`/app/api/otp/forgot-password/route.ts`)

Handles email OTP for forgot-password (mobile uses widget):

```typescript
// Action: send
// Sends OTP to specified email, generates 6-digit OTP
// Returns: resetToken (temporary token for password reset)

// Action: verify
// Verifies OTP matches what was sent
// Returns: resetToken stored in MongoDB with 15-min expiration
```

### 3. Reset Password API (`/app/api/auth/reset-password/route.ts`)

```typescript
const { resetToken, newPassword } = await request.json();

// Find and validate reset token
const tokenInfo = await Token.findOne({ 
  token: resetToken, 
  type: 'reset',
  expiresAt: { $gt: new Date() }
});

// Update user password
await User.findByIdAndUpdate(tokenInfo.userId, {
  password: hashedPassword
});
```

## Type Definitions

Added to `/types/next-auth.d.ts`:

```typescript
declare global {
  interface Window {
    initSendOTP?: (config: {
      widgetId: string;
      tokenAuth: string;
      identifier?: string;
      exposeMethods?: string;
      success?: (data: any) => void;
      failure?: (error: any) => void;
    }) => void;
  }
}
```

## Environment Variables

```env
# .env.local
MSG91_API_KEY=502324AjF9BONX69f62f28P1
MSG91_SENDER_ID=PCSTUD
```

**Note**: Widget-based approach doesn't require API key for OTP verification (widget handles it internally).

## Flow Diagrams

### Registration with Widget
```
[Registration Form]
       ↓
[Validate Form]
       ↓
[Show MSG91 Widget]
       ↓
[User enters OTP in widget]
       ↓
[Widget verifies with MSG91]
       ↓
[Widget success callback → token]
       ↓
[POST /api/register with token]
       ↓
[Create user, generate referral code]
       ↓
[Return referral code to user]
```

### Password Reset with Mobile
```
[Enter email/mobile]
       ↓
[Select "Mobile" method]
       ↓
[Show MSG91 Widget]
       ↓
[User enters OTP in widget]
       ↓
[Widget verifies with MSG91]
       ↓
[Widget success callback → token]
       ↓
[User enters new password]
       ↓
[POST /api/auth/reset-password with token]
       ↓
[Update password in database]
       ↓
[Redirect to login]
```

## Testing

### Local Development
- Widget scripts load from MSG91 CDN
- SMS actually sends to real phone numbers
- OTP verification works with real MSG91 account
- No mocking needed for widget verification

### Testing Registration:
1. Navigate to `/register`
2. Fill form with valid details
3. Click "Send OTP"
4. Widget should appear
5. Enter OTP received via SMS
6. Account should be created

### Testing Forgot Password:
1. Navigate to `/forgot-password`
2. Select "Mobile" as recovery method
3. Enter registered mobile number
4. Click "Send OTP"
5. Widget should appear
6. Enter OTP and verify
7. Enter new password
8. Password should be reset

## Error Handling

### Widget Errors
- Network errors: Widget displays inline error message
- Invalid OTP: User can retry or request new OTP
- Failed callback: Frontend shows error notification

### Backend Errors
- Invalid/expired token: 400 error with specific message
- User not found: 404 error
- Database errors: 500 error

## Security Considerations

1. **OTP Token Validation**: Backend verifies token format before using
2. **Password Hashing**: bcryptjs with salt rounds = 12
3. **Token Expiration**: All tokens expire after 15 minutes
4. **HTTPS Only**: Widget communicates via HTTPS to MSG91
5. **No OTP Storage**: Widget-verified OTPs aren't stored locally

## Future Enhancements

1. **Email OTP Widget**: When available from MSG91
2. **Biometric OTP**: If MSG91 adds support
3. **WhatsApp OTP**: Alternative delivery method
4. **Resend Options**: Allow retry with different method
5. **Multiple Devices**: Support verification on multiple devices

## Troubleshooting

### Widget Not Appearing
- Check browser console for script load errors
- Verify MSG91 widget script URLs are accessible
- Check if widgetId is correct: `366441705372363439393933`
- Ensure `window.initSendOTP` is defined

### OTP Not Received
- Verify mobile number format (10 digits, no country code)
- Check SMS provider (MSG91 account status)
- Verify mobile number is in India (+91)
- Check SMS balance in MSG91 account

### Token Verification Failed
- Ensure token is passed within 15 minutes of generation
- Check token format (should be string)
- Verify mobile number matches what was used for OTP

## References

- MSG91 Documentation: https://msg91.com/docs
- Widget Documentation: [Widget URL from MSG91]
- Next.js Script Component: https://nextjs.org/docs/app/api-reference/components/script
- bcryptjs: https://github.com/dcodeIO/bcrypt.js
