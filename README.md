# Refurbished PC Studio

An e-commerce website for refurbished PCs with separate admin panel.

## Features

### Customer Features
- User registration and login
- Product browsing with discounts
- Cart and order placement
- Manual payment system with screenshot upload
- Order tracking

### Admin Panel
- Dashboard with stats
- Product management (add, edit, delete, discounts)
- Order management and payment verification
- Business settings
- Staff management

## Tech Stack
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- MongoDB
- NextAuth.js
- Formidable (file uploads)

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables in `.env.local`:
```
MONGODB_URI=your-mongodb-connection-string
NEXTAUTH_SECRET=your-secret
NEXTAUTH_URL=http://localhost:3000

# Email OTP settings (required for /api/otp/forgot-password)
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=your-smtp-username
EMAIL_PASS=your-smtp-password
EMAIL_FROM=Refurbished PC Studio <noreply@yourdomain.com>
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

## Deployment

Deploy to Vercel:
1. Push to GitHub
2. Connect to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy

For production, update MONGODB_URI to production database and NEXTAUTH_URL to your domain.

## API Routes

- `/api/auth/[...nextauth]` - Authentication
- `/api/register` - User registration
- `/api/forgot-password` - Password hint
- `/api/products` - Product CRUD
- `/api/orders` - Order management
- `/api/users` - Staff management
- `/api/business-settings` - Business info
- `/api/upload` - File uploads

## Admin Panel

Access at `/admin` (requires admin or staff login)

## Notes

- Passwords are hashed with bcrypt
- File uploads are stored in `public/uploads`
- For online deployment, consider using cloud storage for files (e.g., Vercel Blob, AWS S3)
