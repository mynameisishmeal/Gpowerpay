# Find Your Google OAuth Project

Your Google Client ID: `759195303176-rebd8n6chjfs73vm5gei16b6sl9d6u05.apps.googleusercontent.com`

Project Number: **759195303176**

## Step 1: Find Which Google Account

Try these accounts (most likely first):
1. ✅ `maelsav100@gmail.com` (from your SMTP config)
2. Any other personal Gmail accounts you have
3. Any work/organization Google accounts

## Step 2: Access the Project

Open this link in **Incognito mode** and try each account:

🔗 **Direct Link:** https://console.cloud.google.com/apis/credentials?project=759195303176

If you can access it, you found the right account!

## Step 3: Update OAuth Callback URLs

Once you find it:

1. Go to: https://console.cloud.google.com/apis/credentials
2. Find your OAuth 2.0 Client ID (starts with `759195303176-rebd...`)
3. Click **Edit** (pencil icon)
4. Under **Authorized redirect URIs**, add:

   ### For Development:
   ```
   http://localhost:3000/api/auth/callback/google
   ```

   ### For Production (update with your domain):
   ```
   https://yourdomain.com/api/auth/callback/google
   https://www.yourdomain.com/api/auth/callback/google
   ```

   ### For Vercel Deployments:
   ```
   https://your-app.vercel.app/api/auth/callback/google
   https://your-app-git-main-username.vercel.app/api/auth/callback/google
   ```

5. Click **Save**

## Step 4: Verify It Works

Test Google sign-in on:
- ✅ Local: http://localhost:3000/login
- ✅ Production: https://yourdomain.com/login

## Troubleshooting

### "Access blocked: This app's request is invalid"
➡️ The redirect URI in Google Console doesn't match your deployment URL.

### "Error 400: redirect_uri_mismatch"
➡️ Add the exact URL shown in the error message to your Google Console.

### Can't Find the Project?
Try:
1. Check all your Google accounts at https://myaccount.google.com
2. Look for accounts where you've used Google Cloud Platform
3. Check your email for "Google Cloud Platform" messages

### Still Can't Find It?
You can create a new OAuth client:
1. Go to https://console.cloud.google.com
2. Create a new project
3. Enable Google+ API
4. Create new OAuth 2.0 credentials
5. Update your `.env.local` with new credentials

## Quick Links

- Google Cloud Console: https://console.cloud.google.com
- Your Project (if found): https://console.cloud.google.com/apis/credentials?project=759195303176
- Manage Google Accounts: https://myaccount.google.com
