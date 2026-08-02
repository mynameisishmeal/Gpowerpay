# Setup New Google OAuth Client

Since you don't have access to the existing project, let's create a new one!

## Step 1: Create a New Google Cloud Project

1. Go to https://console.cloud.google.com
2. Sign in with `maelsav100@gmail.com` (or your preferred account)
3. Click the project dropdown (top left) → **New Project**
4. Name it: `Gpower Pay` or `Gpowerpay OAuth`
5. Click **Create**

## Step 2: Enable Google OAuth API

1. In your new project, go to **APIs & Services** → **Library**
2. Search for: **Google+ API** (or Google OAuth2 API)
3. Click **Enable**

## Step 3: Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Choose **External** (for public app)
3. Click **Create**

### Fill in the form:
- **App name**: Gpower Pay
- **User support email**: maelsav100@gmail.com
- **App logo**: (optional, skip for now)
- **App domain**:
  - Application home page: `https://yourdomain.com` (or leave blank)
  - Privacy policy: (optional)
  - Terms of service: (optional)
- **Developer contact**: maelsav100@gmail.com

4. Click **Save and Continue**
5. Skip **Scopes** (click Save and Continue)
6. Add test users if in testing mode (add your email)
7. Click **Save and Continue**

## Step 4: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **+ Create Credentials** → **OAuth client ID**
3. Application type: **Web application**
4. Name: `Gpower Pay Web Client`

### Add Authorized redirect URIs:

```
http://localhost:3000/api/auth/callback/google
https://yourdomain.com/api/auth/callback/google
https://www.yourdomain.com/api/auth/callback/google
```

**For Vercel (if using):**
```
https://your-app.vercel.app/api/auth/callback/google
https://your-app-git-main-username.vercel.app/api/auth/callback/google
```

5. Click **Create**

## Step 5: Copy Your New Credentials

You'll see a popup with:
- **Client ID**: Copy this
- **Client Secret**: Copy this

## Step 6: Update Your .env.local

Replace the old values with your new ones:

```bash
# Google OAuth (NEW - created with maelsav100@gmail.com)
GOOGLE_CLIENT_ID=YOUR_NEW_CLIENT_ID_HERE.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=YOUR_NEW_CLIENT_SECRET_HERE
```

## Step 7: Test It

1. Restart your Next.js server:
   ```bash
   npm run dev
   ```

2. Go to: http://localhost:3000/login

3. Click **Continue with Google**

4. Sign in and authorize the app

5. ✅ You should be logged in!

## Troubleshooting

### "Access blocked: This app's request is invalid"

**Solution:** Make sure you added the exact callback URL:
```
http://localhost:3000/api/auth/callback/google
```

### "Error 400: redirect_uri_mismatch"

**Solution:** The URL in the error message should be added to your Google Console redirect URIs.

### "This app hasn't been verified"

**Solution:** Normal for testing! Click **Advanced** → **Go to Gpower Pay (unsafe)** to continue.

To verify the app for public use:
1. Go to OAuth consent screen
2. Click **Publish App**
3. (Optional) Submit for Google verification if needed

## Adding Multiple Domains Later

When you deploy to production:

1. Go back to: https://console.cloud.google.com/apis/credentials
2. Edit your OAuth client
3. Add production redirect URIs:
   ```
   https://gpowerpay.com/api/auth/callback/google
   https://staging.gpowerpay.com/api/auth/callback/google
   ```
4. Save

## Important Notes

- ✅ Keep localhost URL for development
- ✅ Each deployment environment needs its own redirect URI
- ✅ Save your Client ID and Secret securely
- ✅ Never commit `.env.local` to git

## Quick Links

- Google Cloud Console: https://console.cloud.google.com
- Credentials page: https://console.cloud.google.com/apis/credentials
- OAuth consent screen: https://console.cloud.google.com/apis/credentials/consent
