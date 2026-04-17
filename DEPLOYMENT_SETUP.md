# Deployment Setup Guide - Production Checklist

## Step 1: MongoDB Atlas Setup ⚙️

### Create MongoDB Atlas Account & Cluster:
1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up or login with your account
3. Create a new cluster (choose M0 free tier for testing)
4. Wait for cluster to be deployed (5-10 minutes)

### Get Connection String:
1. In Atlas, click "Connect" on your cluster
2. Select "Drivers" (Node.js)
3. Copy the connection string - looks like:
   ```
   mongodb+srv://<username>:<password>@<cluster>.mongodb.net/refurbished-pc-studio
   ```
4. Replace `<username>` and `<password>` with actual credentials
5. Database name is already: `refurbished-pc-studio`

### Important Notes:
- Add IP address to IP Whitelist (or allow 0.0.0.0/0 for Vercel)
- Create a database user with strong password
- Never commit credentials to git - use environment variables only

---

## Step 2: Gmail App Password Setup 📧

### Enable 2-Factor Authentication:
1. Go to https://myaccount.google.com/
2. Click "Security" on left menu
3. Enable "2-Step Verification" (if not already enabled)

### Generate App Password:
1. Still in Security section, find "App passwords"
2. Select "Mail" and "Windows Computer" (or your device)
3. Google will generate a 16-character password
4. Copy this password - you'll need it for EMAIL_PASS

### Email Configuration:
- EMAIL_HOST: smtp.gmail.com
- EMAIL_PORT: 587
- EMAIL_USER: your-email@gmail.com
- EMAIL_PASS: [Your 16-char App Password]
- EMAIL_FROM: your-email@gmail.com

---

## Step 3: Update Environment Variables

### Local Development (.env.local):
Replace the placeholder values with your actual credentials.

### Production (Vercel):
You'll add these via Vercel dashboard after pushing to GitHub.

---

## Step 4: Generate NextAuth Secret

Run this command to generate a secure NEXTAUTH_SECRET:
```bash
openssl rand -hex 32
```
Or use an online generator: https://generate-secret.vercel.app/32

---

## Step 5: Test Locally Before Deployment

Commands to verify everything works:
```bash
# Install dependencies
npm install

# Run the development server
npm run dev

# Visit http://localhost:3000 to test
```

Test these features:
- [ ] Homepage loads
- [ ] User registration works
- [ ] Email OTP is received
- [ ] Login works
- [ ] Admin login works
- [ ] Admin panel accessible
- [ ] Products display
- [ ] Cart functionality works
- [ ] Orders creation works

---

## Step 6: Database Seeding (Optional)

If you want to seed initial data:
```bash
npm run seed
```

---

## Step 7: Git Setup

### Initialize Repository:
```bash
git init
git add .
git commit -m "Initial commit: PC Studio website"
```

### Create GitHub Repository:
1. Go to https://github.com/new
2. Create new repository named: `pc-studio` (or your choice)
3. Push your code:
```bash
git remote add origin https://github.com/YOUR_USERNAME/pc-studio.git
git branch -M main
git push -u origin main
```

---

## Step 8: Vercel Deployment

### Connect Vercel to GitHub:
1. Go to https://vercel.com/dashboard
2. Click "New Project"
3. Import your GitHub repository
4. Choose Next.js as framework (auto-detected)
5. Set build command: `npm run build`
6. Click Deploy

### Add Environment Variables in Vercel:
1. In Vercel project, go to Settings → Environment Variables
2. Add ALL these variables:

```
MONGODB_URI = mongodb+srv://username:password@cluster.mongodb.net/refurbished-pc-studio
NEXTAUTH_SECRET = [your 32-char secret]
NEXTAUTH_URL = https://your-domain.vercel.app
EMAIL_HOST = smtp.gmail.com
EMAIL_PORT = 587
EMAIL_USER = your-email@gmail.com
EMAIL_PASS = [Gmail App Password]
EMAIL_FROM = your-email@gmail.com
NODE_ENV = production
```

3. Click "Save"
4. Go to Deployments and click "Redeploy" to apply changes

---

## Troubleshooting

### Email/OTP Not Working:
- Check EMAIL_PASS is correct (16-char App Password, not regular password)
- Verify Gmail 2FA is enabled
- Check IP whitelist in MongoDB Atlas
- Look at Vercel logs for error messages

### MongoDB Connection Errors:
- Verify connection string is correct
- Check username/password in URL
- Ensure IP is whitelisted in Atlas
- Try connecting with MongoDB Compass to verify credentials

### Build Failures:
- Check Vercel logs for specific errors
- Ensure all environment variables are set
- Run `npm run build` locally to test
- Check for TypeScript errors

---

## Summary of Required Credentials

You'll need to collect:
1. **MongoDB Atlas**
   - Connection string: `mongodb+srv://...`

2. **Gmail**
   - App Password (16 chars)

3. **NextAuth**
   - Secret (32 char random string)

4. **Vercel Domain**
   - Your final deployed URL

---

## Next Steps After Deployment

1. Test all features on production
2. Set up domain (optional - already set to vercel.app)
3. Monitor Vercel logs for any errors
4. Keep email credentials secure
5. Backup your database occasionally

Good luck! 🚀
