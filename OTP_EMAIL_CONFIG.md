# OTP Email Configuration Guide

## Current OTP Sender Email
**Current:** `shopotpmain@gmail.com`

## How to Change OTP Sender Email

### Step 1: Update Environment Variables
Edit your `.env` file and change the `EMAIL_FROM` variable:

```env
# Change this line:
EMAIL_FROM=your-new-email@example.com

# Example:
EMAIL_FROM=noreply@yourcompany.com
```

### Step 2: Update Email Credentials (if needed)
If you're changing to a different email provider, also update:

```env
EMAIL_HOST=smtp.gmail.com          # or your SMTP host
EMAIL_PORT=587                     # or 465 for SSL
EMAIL_USER=your-email@gmail.com    # your email username
EMAIL_PASS=your-app-password       # your email password/app password
```

### Step 3: Deploy Changes
After updating the `.env` file on your server:

```bash
# Restart your application
npm run build
# Deploy to your hosting platform
```

## Email Providers Supported

### Gmail
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=shopotpmain@gmail.com
EMAIL_PASS=your-app-password  # Use App Passwords, not regular password
```

### Outlook/Hotmail
```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USER=your-email@outlook.com
EMAIL_PASS=your-password
```

### Custom SMTP
```env
EMAIL_HOST=your-smtp-server.com
EMAIL_PORT=587
EMAIL_USER=your-username
EMAIL_PASS=your-password
```

## Important Notes

1. **Gmail App Passwords**: If using Gmail, you must use App Passwords, not your regular password
2. **Security**: Never commit `.env` file to Git - it's already in `.gitignore`
3. **Testing**: Test OTP sending after changes to ensure it works
4. **Fallback**: If EMAIL_FROM is not set, system uses `noreply@refurbishedpc.com`

## Current Configuration
- **From Email:** `shopotpmain@gmail.com`
- **SMTP Host:** `smtp.gmail.com`
- **Port:** `587` (TLS)
- **Authentication:** Yes ✅ (App Password configured)

## Files That Use This Configuration
- `lib/sendEmail.ts` - Main email sending function
- `app/api/otp/register/route.ts` - Registration OTP
- `app/api/otp/forgot-password/route.ts` - Password reset OTP
- All other email sending functions

## Testing OTP Email
After changing the email, test by:
1. Going to registration page
2. Entering an email address
3. Checking if OTP arrives from the new email address</content>
<parameter name="filePath">d:\Pc Studio\OTP_EMAIL_CONFIG.md