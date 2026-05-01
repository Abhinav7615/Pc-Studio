# Cashfree Payment Configuration

## Overview
This guide explains how to configure Cashfree auto payment for Pc Studio.

## Getting Cashfree Credentials

### Step 1: Create Cashfree Account
1. Go to [Cashfree Dashboard](https://dashboard.cashfree.com)
2. Sign up with your business email
3. Complete KYC verification

### Step 2: Get API Credentials
1. After login, go to **Settings → API Keys**
2. Copy your **App ID** and **Secret Key**
3. Note: Use Sandbox keys for testing, Production keys for live

---

## Environment Variables

Add these to your `.env.local` file:

```env
# Cashfree Payment Configuration
CASHFREE_APP_ID=your_app_id_here
CASHFREE_SECRET_KEY=your_secret_key_here
CASHFREE_ENV=production  # Use 'sandbox' for testing
```

### Variable Descriptions

| Variable | Description | Example |
|----------|-------------|---------|
| `CASHFREE_APP_ID` | Your Cashfree App ID | `cf_xxxxxxxx` |
| `CASHFREE_SECRET_KEY` | Your Cashfree Secret Key | `cf_xxxxxxxxxxxx` |
| `CASHFREE_ENV` | Environment | `sandbox` or `production` |

---

## Webhook Configuration

### Step 1: Set Webhook URL
In Cashfree Dashboard:
1. Go to **Settings → Webhooks**
2. Add webhook URL: `https://yourdomain.com/api/payments/webhook`
3. Enable events: `ORDER_PAID`, `ORDER_FAILED`

### Step 2: Verify Webhook
The webhook will automatically:
- ✅ Update order status to "Payment Verified" on success
- ❌ Update order status to "Payment Failed" on failure
- 🔔 Send notification to customer

---

## Testing in Sandbox

### Test Data
Use these test credentials in sandbox:

```env
CASHFREE_APP_ID=your_sandbox_app_id
CASHFREE_SECRET_KEY=your_sandbox_secret_key
CASHFREE_ENV=sandbox
```

### Test Cards
- **UPI**: success@upi
- **Card**: 4111 1111 1111 1111 (any future expiry, any CVV)

---

## Production Checklist

Before going live:

- [ ] Get production App ID & Secret Key
- [ ] Set `CASHFREE_ENV=production`
- [ ] Configure webhook in production
- [ ] Test a small payment
- [ ] Verify order status updates correctly

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| "Payment not configured" | Add CASHFREE_APP_ID and CASHFREE_SECRET_KEY to .env.local |
| "Invalid signature" | Verify webhook URL is correct in Cashfree dashboard |
| "Payment failed" | Check if account is KYC verified |
| Order not updating | Check webhook is enabled and URL is correct |

---

## Current Configuration

**Status**: Not Configured ❌

To enable Cashfree payments:
1. Get credentials from [Cashfree Dashboard](https://dashboard.cashfree.com)
2. Add to `.env.local`
3. Restart the server

---

## Files Modified

- `app/api/payments/create/route.ts` - Payment creation API
- `app/api/payments/webhook/route.ts` - Webhook handler
- `app/payment-return/page.tsx` - Payment return page
- `app/cart/page.tsx` - Added payment method selection
- `models/Order.ts` - Added Cashfree payment fields