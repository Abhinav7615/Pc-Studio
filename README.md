# Refurbished PC Studio

An e-commerce website for refurbished PCs with separate admin panel.

## Features

### Customer Features
- User registration with mobile OTP verification (MSG91 widget)
- Password reset with email/mobile OTP support
- Product browsing with discounts
- Referral program with discount coupons
- Cart and order placement
- Manual payment system with screenshot upload
- Order tracking
- Live chat support

### Admin Panel
- Dashboard with stats
- Product management (add, edit, delete, discounts)
- Order management and payment verification
- Business settings
- Staff management
- Content management
- Coupon management
- User management
- Theme customization

## Tech Stack
- Next.js 16.1.6 (App Router)
- TypeScript
- Tailwind CSS
- MongoDB/Mongoose
- NextAuth.js for admin authentication
- MSG91 OTP Widget for mobile verification
- Nodemailer for email OTP
- bcryptjs for password hashing

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables in `.env.local`:
```env
# Database
MONGODB_URI=your-mongodb-connection-string

# Authentication
NEXTAUTH_SECRET=your-secret
NEXTAUTH_URL=http://localhost:3000

# SMS OTP Widget (MSG91)
# Widget is embedded in the app - no API key needed for widget OTP verification
MSG91_API_KEY=your-msg91-api-key (optional, for SMS fallback)
MSG91_SENDER_ID=PCSTUD

# Email OTP Settings (for password reset email OTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=Refurbished PC Studio <noreply@yourdomain.com>

# Payment Gateway (Cashfree)
CASHFREE_APP_ID=your-app-id
CASHFREE_SECRET_KEY=your-secret-key
CASHFREE_ENV=production
NEXT_PUBLIC_CASHFREE_ENV=production

# Shipping (Delhivery)
DELHIVERY_API_KEY=your-api-key
```

3. Start MongoDB locally or use MongoDB Atlas.

4. Run the development server:
```bash
npm run dev
```

5. Seed the admin user (optional):
```bash
npx tsx lib/seed.ts
```

Admin credentials: email: yadavabhinav551@gmail.com, password: adminpassword

## OTP Implementation

### Mobile OTP (Registration & Password Reset)
- Uses **MSG91 OTP Widget** - secure, pre-built verification interface
- Widget ID: `366441705372363439393933`
- Widgets loads via CDN from MSG91
- OTP verified directly with MSG91, no backend storage needed
- Frontend receives verification token from widget

### Email OTP (Password Reset)
- Manual OTP input form
- Sent via Nodemailer/SMTP
- OTP stored temporarily in MongoDB with 15-minute expiration
- User enters OTP manually for verification

### Registration Flow
1. User fills registration form (name, email, mobile, password)
2. Clicks "Send OTP"
3. MSG91 widget appears with secure OTP input
4. User enters OTP received via SMS
5. Widget verifies and returns token
6. Account created with referral code

### Password Reset Flow (Mobile)
1. User enters registered mobile number
2. Selects "Mobile" as recovery method
3. MSG91 widget appears
4. User enters OTP from SMS
5. User enters new password
6. Password updated

See [MSG91_WIDGET_IMPLEMENTATION.md](MSG91_WIDGET_IMPLEMENTATION.md) for detailed documentation.

## Deployment

Deploy to Vercel:
1. Push to GitHub
2. Connect to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy

For production, update MONGODB_URI to production database and NEXTAUTH_URL to your domain.

## API Routes

- `/api/auth/[...nextauth]` - Authentication
- `/api/auth/reset-password` - Password reset
- `/api/register` - User registration with OTP token
- `/api/otp/forgot-password` - Email OTP send/verify
- `/api/products` - Product CRUD
- `/api/orders` - Order management
- `/api/users` - Staff management
- `/api/business-settings` - Business info
- `/api/upload` - File uploads
- `/api/coupons` - Coupon management
- `/api/notifications` - Notification management

## Admin Panel

Access at `/admin` (requires admin or staff login)

- **Dashboard**: View stats and recent orders
- **Products**: Manage products with images and discounts
- **Orders**: Track and manage orders
- **Users**: Manage staff and view user statistics
- **Coupons**: Create and manage discount coupons
- **Content**: Manage business content (T&C, Privacy, FAQs)
- **Theme**: Customize site appearance
- **Settings**: Configure business settings and referral program

## Project Structure

```
.
├── app/                          # Next.js app directory
│   ├── api/                     # API routes
│   │   ├── auth/               # Authentication routes
│   │   ├── otp/                # OTP routes (register, forgot-password)
│   │   ├── products/           # Product management
│   │   ├── orders/             # Order management
│   │   └── ...
│   ├── admin/                  # Admin pages
│   ├── register/               # User registration (MSG91 widget)
│   ├── forgot-password/        # Password reset (MSG91 widget + email)
│   ├── login/                  # User login
│   └── ...
├── components/                  # React components
│   ├── Header.tsx             # Navigation
│   ├── CartContext.tsx        # Cart state management
│   ├── ChatWidget.tsx         # Live chat
│   └── ...
├── lib/                        # Utility functions
│   ├── mongodb.ts            # MongoDB connection
│   ├── sendEmail.ts          # Email sending
│   ├── sendSms.ts            # SMS provider wrapper
│   ├── referral.ts           # Referral logic
│   └── ...
├── models/                     # MongoDB schemas
│   ├── User.ts              # User schema
│   ├── Product.ts           # Product schema
│   ├── Order.ts             # Order schema
│   └── ...
├── types/                      # TypeScript types
├── public/                     # Static files
└── package.json              # Dependencies
```

## Security Notes

- Passwords are hashed with bcrypt (12 salt rounds)
- MSG91 widget handles OTP verification securely
- OTP tokens expire after 15 minutes
- Reset tokens expire after 15 minutes
- HTTPS enforced for all sensitive operations
- NextAuth.js for secure session management

## File Upload

Files are uploaded to `public/uploads` directory. For production deployment:
- Consider using cloud storage (Vercel Blob, AWS S3, Cloudinary)
- Update upload paths in `lib/sendEmail.ts` and image serving logic
- Implement file size limits and validation

## Performance Notes

- Build time: ~30-40 seconds
- Next.js static generation used for public pages
- API routes use dynamic rendering
- MSG91 widget scripts loaded lazily on demand

## Troubleshooting

### Build Errors
- Clear `.next` folder: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`

### OTP Issues
- Check MSG91 account balance for SMS credits
- Verify mobile number format (10 digits for India)
- Check email configuration for SMTP
- Review API logs in `/api/otp/*` routes

### Database Connection
- Verify MONGODB_URI is correct
- Ensure database is accessible
- Check MongoDB network settings for IP whitelist

## References

- [Next.js Documentation](https://nextjs.org/docs)
- [MSG91 Widget Documentation](https://msg91.com)
- [MongoDB Documentation](https://docs.mongodb.com)
- [NextAuth.js Documentation](https://next-auth.js.org)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
