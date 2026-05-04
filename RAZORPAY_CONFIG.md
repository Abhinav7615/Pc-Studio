# Razorpay Payment Configuration

## Overview
This guide explains how to configure Razorpay auto payment for Pc Studio.

## Getting Razorpay Credentials

### Step 1: Create Razorpay Account
1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com)
2. Sign up with your business email
3. Complete KYC verification

### Step 2: Get API Credentials
1. After login, go to **Settings → API Keys**
2. Copy your **Key ID** and **Key Secret**
3. Note: Use Test keys for testing, Live keys for production

---

## Environment Variables

Add these to your `.env.local` file:

```env
# Razorpay Payment Configuration
RAZORPAY_KEY_ID=your_key_id_here
RAZORPAY_KEY_SECRET=your_key_secret_here
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here
```

### Variable Descriptions

| Variable | Description | Example |
|----------|-------------|---------|
| `RAZORPAY_KEY_ID` | Your Razorpay Key ID | `rzp_test_xxxxxxxx` |
| `RAZORPAY_KEY_SECRET` | Your Razorpay Key Secret | `xxxxxxxxxxxx` |
| `RAZORPAY_WEBHOOK_SECRET` | Webhook secret for signature verification | `xxxxxxxx` |

---

## Webhook Configuration

### Step 1: Set Webhook URL
In Razorpay Dashboard:
1. Go to **Settings → Webhooks**
2. Add webhook URL: `https://yourdomain.com/api/payments/webhook`
3. Enable events: `payment.captured`, `payment.failed`

### Step 2: Set Webhook Secret
1. In webhook settings, set a secret key
2. Add the same secret to your `.env.local` as `RAZORPAY_WEBHOOK_SECRET`

### Step 3: Verify Webhook
The webhook will automatically:
- Update order status to "Payment Verified" on successful payment
- Move orders to processing queue
- Send notifications to customers
- Reserve product stock

---

## Testing

### Test Credentials
Use these test credentials for development:

```env
RAZORPAY_KEY_ID=rzp_test_your_test_key_id
RAZORPAY_KEY_SECRET=your_test_key_secret
RAZORPAY_WEBHOOK_SECRET=your_test_webhook_secret
```

### Test Cards
Use these test card details for payment testing:
- **Success Card**: 4111 1111 1111 1111
- **Failure Card**: 4000 0000 0000 0002

---

## Integration Flow

1. **Order Creation**: Customer places order with Razorpay payment method
2. **Payment Processing**: Customer completes payment on Razorpay checkout
3. **Webhook Trigger**: Razorpay sends webhook to your server
4. **Order Update**: System automatically updates order status to "Payment Verified"
5. **Processing Queue**: Order moves to "Paid" tab for admin processing
6. **Notification**: Customer receives payment confirmation notification

---

## Error Handling

The webhook handles various payment statuses:
- `captured` → Order status: "Payment Verified"
- `failed` → Order status: "Payment Failed"
- `pending` → Order status: "Payment Processing"

All webhook events are logged for debugging and monitoring.