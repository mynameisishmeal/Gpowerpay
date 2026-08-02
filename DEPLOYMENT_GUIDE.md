# 🚀 Gpowerpay Deployment Guide

## Quick Start

This guide will help you deploy Gpowerpay to production in ~30 minutes.

---

## 📋 Prerequisites

- [ ] Node.js 18+ installed
- [ ] MongoDB database (MongoDB Atlas recommended)
- [ ] Domain name with DNS access
- [ ] Paystack account (production keys)
- [ ] SMTP email service (Gmail, SendGrid, Mailgun, etc.)
- [ ] Cloudinary account (for image hosting)
- [ ] Google OAuth credentials (optional but recommended)

---

## 🔧 Step 1: Environment Setup

### 1.1 Copy Environment File
```bash
cp .env.production.example .env.local
```

### 1.2 Fill in Required Variables

#### **MongoDB** (Required)
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/gpowerpay?retryWrites=true&w=majority
```
👉 Get from: [MongoDB Atlas](https://cloud.mongodb.com/)

#### **NextAuth** (Required)
```bash
# Generate secret
openssl rand -base64 32
```
```env
NEXTAUTH_SECRET=<generated-secret>
NEXTAUTH_URL=https://yourdomain.com
```

#### **SMTP Email** (Required)
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=your-email@gmail.com
```

**Gmail Setup:**
1. Enable 2FA on your Google account
2. Generate App Password: [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Use that app password (not your regular password)

**Production SMTP Services** (Recommended):
- SendGrid: 100 emails/day free
- Mailgun: 5,000 emails/month free
- Amazon SES: $0.10/1000 emails

#### **Paystack** (Required)
```env
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_xxxxx
PAYSTACK_SECRET_KEY=sk_live_xxxxx
```
👉 Get from: [Paystack Dashboard](https://dashboard.paystack.com/settings/developer)

**⚠️ Important**: Switch from test keys to live keys!

#### **Cloudinary** (Required)
```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
NEXT_PUBLIC_CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your-preset
```
👉 Get from: [Cloudinary Console](https://console.cloudinary.com/)

#### **Google OAuth** (Optional)
```env
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxxx
```
👉 Get from: [Google Cloud Console](https://console.cloud.google.com/apis/credentials)

**OAuth Setup**:
1. Create project in Google Cloud Console
2. Enable Google+ API
3. Create OAuth 2.0 credentials
4. Add authorized redirect: `https://yourdomain.com/api/auth/callback/google`

---

## 🏗️ Step 2: Build & Test Locally

### 2.1 Install Dependencies
```bash
npm install
```

### 2.2 Build Production
```bash
npm run build
```

### 2.3 Test Production Build
```bash
npm run start
```
Open http://localhost:3000 and test:
- Login
- Browse products
- Add to cart
- Complete checkout
- Fund wallet
- Place order
- Check email

---

## 🌐 Step 3: Deploy (Choose One)

### Option A: Vercel (Recommended - Easiest)

**Why Vercel?**
- ✅ Free tier available
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Zero config deployment
- ✅ Made for Next.js

**Steps:**
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

**Set Environment Variables**:
1. Go to Vercel dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add all variables from `.env.local`
5. Redeploy

**Custom Domain**:
1. Go to Settings → Domains
2. Add your domain
3. Update DNS records as instructed

---

### Option B: Railway (Easy + Database Included)

**Why Railway?**
- ✅ Free tier with $5 credit
- ✅ Can host MongoDB on same platform
- ✅ Automatic deployments
- ✅ Simple UI

**Steps:**
1. Create account: [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub"
3. Connect your repository
4. Add environment variables
5. Deploy!

---

### Option C: DigitalOcean App Platform

**Why DigitalOcean?**
- ✅ $5/month starter plan
- ✅ Full control
- ✅ Built-in load balancing
- ✅ Database hosting available

**Steps:**
1. Create account: [digitalocean.com](https://www.digitalocean.com)
2. Go to Apps → Create App
3. Connect GitHub repository
4. Configure build settings:
   - Build Command: `npm run build`
   - Run Command: `npm start`
5. Add environment variables
6. Deploy

---

### Option D: VPS (Advanced - Full Control)

**Providers**: AWS EC2, DigitalOcean Droplet, Linode, Vultr

**Requirements**:
- Ubuntu 22.04 LTS
- 2GB RAM minimum
- Node.js 18+
- Nginx (reverse proxy)
- PM2 (process manager)
- SSL certificate (Let's Encrypt)

**Quick Setup Script**:
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx

# Clone repository
git clone https://github.com/yourusername/gpowerpay.git
cd gpowerpay

# Install dependencies
npm install

# Build
npm run build

# Start with PM2
pm2 start npm --name "gpowerpay" -- start
pm2 save
pm2 startup

# Configure Nginx
sudo nano /etc/nginx/sites-available/gpowerpay
```

**Nginx Configuration**:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/gpowerpay /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Install SSL (Let's Encrypt)
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## 🔐 Step 4: Security Checklist

### 4.1 SSL/HTTPS
- [ ] HTTPS enabled (automatic with Vercel/Railway)
- [ ] Force HTTPS redirect
- [ ] Valid SSL certificate

### 4.2 Environment Variables
- [ ] All secrets in environment variables (not in code)
- [ ] Production database separate from development
- [ ] Production Paystack keys (not test keys)
- [ ] Secure NEXTAUTH_SECRET (32+ characters)

### 4.3 Database
- [ ] MongoDB authentication enabled
- [ ] IP whitelist configured
- [ ] Automated backups enabled
- [ ] Connection string uses SSL

### 4.4 CORS & Security Headers
Already configured in Next.js, but verify:
- [ ] CORS properly configured
- [ ] CSP headers set
- [ ] X-Frame-Options set
- [ ] X-Content-Type-Options set

---

## 📊 Step 5: Post-Deployment

### 5.1 Smoke Tests
Test these immediately after deployment:

- [ ] Homepage loads
- [ ] Customer login works
- [ ] Admin login works (`/admin/login`)
- [ ] Rider login works (`/rider/login`)
- [ ] Can browse products
- [ ] Can add to cart
- [ ] Wallet funding works (Paystack)
- [ ] Order placement works
- [ ] Email notifications sent
- [ ] Notifications appear in bell icon

### 5.2 Set Up Monitoring

**Error Tracking** (Recommended):
```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

**Uptime Monitoring**:
- [UptimeRobot](https://uptimerobot.com/) - Free
- [Pingdom](https://www.pingdom.com/)
- [StatusCake](https://www.statuscake.com/)

**Analytics**:
- Google Analytics
- Plausible Analytics
- Fathom Analytics

### 5.3 Database Backup

**MongoDB Atlas** (Automatic):
- Go to Backup tab
- Enable automated backups
- Configure retention period

**Manual Backup**:
```bash
mongodump --uri="mongodb+srv://..." --out=./backup
```

---

## 🚨 Step 6: Emergency Procedures

### Rollback (Vercel)
```bash
vercel rollback
```

### Rollback (PM2)
```bash
cd gpowerpay
git pull origin previous-version
npm install
npm run build
pm2 restart gpowerpay
```

### Database Restore
```bash
mongorestore --uri="mongodb+srv://..." ./backup
```

### Check Logs
```bash
# Vercel
vercel logs

# PM2
pm2 logs gpowerpay

# Nginx
sudo tail -f /var/log/nginx/error.log
```

---

## 📞 Support & Resources

### Documentation
- Next.js: https://nextjs.org/docs
- MongoDB: https://docs.mongodb.com/
- Paystack: https://paystack.com/docs
- NextAuth: https://next-auth.js.org/

### Community
- Next.js Discord
- Stack Overflow
- GitHub Issues

### Emergency Contacts
- MongoDB Support: https://support.mongodb.com
- Paystack Support: support@paystack.com
- Cloudinary Support: https://support.cloudinary.com

---

## ✅ Launch Checklist

Before announcing to users:

- [ ] SSL certificate valid
- [ ] All environment variables set
- [ ] Database connected and backed up
- [ ] Email delivery working
- [ ] Payment gateway working (test with small amount)
- [ ] Error monitoring enabled
- [ ] Uptime monitoring enabled
- [ ] Test order completed end-to-end
- [ ] Admin can manage orders
- [ ] Riders can login and mark delivered
- [ ] Mobile responsive
- [ ] All links working

---

## 🎉 Success!

Your Gpowerpay platform is now live! 

**Next Steps**:
1. Monitor error logs for first 24 hours
2. Be available for user support
3. Track key metrics (orders, users, revenue)
4. Gather user feedback
5. Plan next iteration

**Good luck! 🚀**

