# Dynamic URL Configuration

This document explains how Gpower Pay handles base URLs dynamically across different deployment environments.

## Overview

Instead of hardcoding `localhost:3000` or specific domain names, the application now uses **dynamic URL detection** that works across:

- Local development
- Staging environments
- Production deployments (Vercel, custom servers, etc.)
- Behind reverse proxies and load balancers

## How It Works

### URL Detection Priority

The application detects the base URL in this order:

1. **`NEXTAUTH_URL`** environment variable (if explicitly set)
2. **`VERCEL_URL`** environment variable (automatically set on Vercel)
3. **Request headers** (`x-forwarded-proto`, `x-forwarded-host`, `host`)
4. **`window.location.origin`** (client-side)
5. **Fallback** to `http://localhost:3000`

### Utility Functions

Location: `lib/utils/url.ts`

#### `getBaseUrl()`
Returns the base URL for the current environment.

```typescript
import { getBaseUrl } from '@/lib/utils/url';

const baseUrl = getBaseUrl();
// Returns: "https://gpowerpay.com" or "http://localhost:3000"
```

#### `getBaseUrlFromHeaders(headers)`
Gets the base URL from request headers (server-side only).

```typescript
import { getBaseUrlFromHeaders } from '@/lib/utils/url';

export async function GET(request: Request) {
  const baseUrl = getBaseUrlFromHeaders(request.headers);
  // More reliable for API routes
}
```

#### `getAbsoluteUrl(path)`
Builds an absolute URL from a relative path.

```typescript
import { getAbsoluteUrl } from '@/lib/utils/url';

const verifyUrl = getAbsoluteUrl('/verify-email?token=abc123');
// Returns: "https://gpowerpay.com/verify-email?token=abc123"
```

## Updated Files

### 1. `lib/utils/url.ts` (NEW)
Central utility for URL detection across the application.

### 2. `lib/services/emailService.ts`
- Replaced `process.env.NEXTAUTH_URL` with `getBaseUrl()`
- Email verification links now work in any environment
- Order notification links are environment-aware

### 3. `.env.local` & `.env.example`
- Added documentation about dynamic URL detection
- Made `NEXTAUTH_URL` optional with clear explanation

### 4. `README.md`
- Updated environment variable documentation
- Explained auto-detection behavior

## Environment Configuration

### Development (Local)

No configuration needed! It will auto-detect `http://localhost:3000`.

```bash
# .env.local (optional)
# NEXTAUTH_URL is not required
```

### Vercel Deployment

No configuration needed! Vercel automatically sets `VERCEL_URL`.

```bash
# Vercel automatically provides:
VERCEL_URL=your-app.vercel.app
```

### Custom Server / VPS

Set `NEXTAUTH_URL` explicitly if needed:

```bash
# .env.production
NEXTAUTH_URL=https://gpowerpay.com
```

### Behind Reverse Proxy (Nginx, Apache)

Ensure your proxy passes the correct headers:

```nginx
# Nginx configuration
proxy_set_header X-Forwarded-Proto $scheme;
proxy_set_header X-Forwarded-Host $host;
proxy_set_header Host $host;
```

The application will automatically detect the correct URL from these headers.

## Benefits

✅ **Zero Configuration** - Works out of the box in development  
✅ **Environment Agnostic** - Same code works everywhere  
✅ **Deployment Flexible** - No hardcoded URLs to change  
✅ **Secure** - Uses HTTPS in production automatically  
✅ **Debug Friendly** - Clear fallback chain for troubleshooting

## Usage Examples

### In Email Templates

```typescript
import { getBaseUrl } from '@/lib/utils/url';

const verificationUrl = `${getBaseUrl()}/verify-email?token=${token}`;
```

### In API Routes

```typescript
import { getBaseUrlFromHeaders } from '@/lib/utils/url';

export async function POST(request: Request) {
  const baseUrl = getBaseUrlFromHeaders(request.headers);
  const callbackUrl = `${baseUrl}/api/webhooks/paystack`;
  // ...
}
```

### In Client Components

```typescript
'use client';
import { getAbsoluteUrl } from '@/lib/utils/url';

function ShareButton() {
  const shareUrl = getAbsoluteUrl(`/products/${productSlug}`);
  // Share button with absolute URL
}
```

## Testing

### Test URL Detection

```typescript
// Development
console.log(getBaseUrl()); // http://localhost:3000

// Vercel Preview
console.log(getBaseUrl()); // https://gpowerpay-git-main-user.vercel.app

// Production
console.log(getBaseUrl()); // https://gpowerpay.com
```

## Troubleshooting

### Issue: URLs Still Showing localhost in Production

**Solution:** Check that your reverse proxy is passing the correct headers:
- `x-forwarded-proto`: Should be `https`
- `x-forwarded-host`: Should be your domain
- `host`: Should be your domain

### Issue: Email Links Not Working

**Solution:** Verify `getBaseUrl()` returns the correct URL in your environment:
```typescript
console.log('Base URL:', getBaseUrl());
```

If incorrect, explicitly set `NEXTAUTH_URL` in your environment variables.

## Migration Notes

### Before (Hardcoded)
```typescript
const url = `http://localhost:3000/verify-email?token=${token}`;
```

### After (Dynamic)
```typescript
import { getBaseUrl } from '@/lib/utils/url';
const url = `${getBaseUrl()}/verify-email?token=${token}`;
```

## Future Enhancements

- [ ] Add URL detection health check endpoint
- [ ] Log detected URLs in production for debugging
- [ ] Support custom port detection in development
- [ ] Add URL validation utilities

## Support

For issues related to URL detection, check:
1. Environment variables (especially `NEXTAUTH_URL` if set)
2. Request headers in browser DevTools
3. Server logs for detected URLs
4. Reverse proxy configuration (if applicable)
