# 🚀 DEPLOYMENT CHECKLIST - Step by Step

## PHASE 1: Gather Credentials (15-20 minutes)

### MongoDB Atlas Setup
- [ ] Create/login to MongoDB Atlas account (https://www.mongodb.com/cloud/atlas)
- [ ] Create a new cluster (M0 free tier)
- [ ] Wait for cluster deployment
- [ ] Create database user with credentials
- [ ] Add IP access (allow 0.0.0.0/0 for Vercel compatibility)
- [ ] Copy Connection String: `mongodb+srv://user:pass@cluster.mongodb.net/refurbished-pc-studio`
- [ ] **Save this somewhere safely** ✅

### Gmail App Password Setup
- [ ] Go to https://myaccount.google.com/
- [ ] Enable 2-Factor Authentication (Security → 2-Step Verification)
- [ ] Go to App passwords (Security → App passwords)
- [ ] Select Mail + Your Device
- [ ] Copy the 16-character App Password
- [ ] **Save this somewhere safely** ✅

### NextAuth Secret Generation
- [ ] Generate 32-char random string (run this in terminal):
  ```bash
  openssl rand -hex 32
  ```
- [ ] **Copy and save the output** ✅

---

## PHASE 2: Setup Environment Variables (5 minutes)

When complete, you'll have all three credentials ready:
1. MongoDB Connection String
2. Gmail App Password
3. NextAuth Secret

Then I'll update your `.env.local` file with all values.

---

## PHASE 3: Test Locally (5-10 minutes)

- [ ] Run: `npm install`
- [ ] Run: `npm run dev`
- [ ] Test homepage: http://localhost:3000
- [ ] Test registration & OTP email
- [ ] Test login
- [ ] Test admin login

---

## PHASE 4: Git Repository (5 minutes)

- [ ] Initialize git: `git init`
- [ ] Add all files: `git add .`
- [ ] First commit: `git commit -m "Initial commit"`
- [ ] Create GitHub repository: https://github.com/new
- [ ] Push code to GitHub

---

## PHASE 5: Configure Vercel (10 minutes)

- [ ] Go to https://vercel.com/dashboard
- [ ] Import your GitHub repository
- [ ] Add all environment variables
- [ ] Deploy

---

## PHASE 6: Verify Production (5 minutes)

- [ ] Visit deployed URL
- [ ] Test OTP email sending
- [ ] Test registration/login
- [ ] Test admin features

---

## Current Status

**Phase 1: Ready to start** ✨

**Next Action:** Please provide the following:

1. **MongoDB Connection String** (from MongoDB Atlas)
   ```
   mongodb+srv://username:password@cluster.mongodb.net/refurbished-pc-studio
   ```

2. **Gmail App Password** (16 characters, spaces included)
   ```
   xxxx xxxx xxxx xxxx
   ```

3. **GitHub Username** (for repository creation)
   ```
   your-username
   ```

Once you provide these, I'll:
- ✅ Update .env.local with all credentials
- ✅ Verify database connection works
- ✅ Test email/OTP functionality
- ✅ Setup Git repository
- ✅ Prepare for Vercel deployment

---

## ⚠️ SECURITY REMINDERS

🔒 **NEVER share these values:**
- MONGODB_URI (contains database password)
- EMAIL_PASS (Gmail App Password)
- NEXTAUTH_SECRET

🔒 **These are already in .gitignore:**
- .env.local (local only)
- .env.production (local only)

✅ **Vercel will handle production secrets securely** through their dashboard.

---

Ready? Let's go! 🎯
