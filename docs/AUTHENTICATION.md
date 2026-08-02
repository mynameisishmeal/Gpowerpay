# Authentication & Authorization Guide

This document explains how to use the authentication and authorization system in Gpowerpay.

## Overview

Gpowerpay uses **NextAuth.js v5** with three separate authentication providers:
- **Customer** authentication (with social login via Google/Facebook)
- **Admin** authentication (Super Admin and Support roles)
- **Rider** authentication (Delivery personnel)

## User Roles

### Customer (`customer`)
- Regular users who can browse products, place orders, manage profile and addresses
- Can register via email or social login (Google/Facebook)
- Access to: `/profile`, `/cart`, `/checkout`, `/orders`, `/wallet`

### Super Admin (`superadmin`)
- Full administrative access
- Can create/manage Support users
- Can reset passwords and activate/deactivate accounts
- Access to: All admin routes

### Support (`support`)
- Limited administrative access
- Cannot manage other admin users
- Access to: Most admin routes (configured by Super Admin)

### Rider (`rider`)
- Delivery personnel
- Can view and manage assigned deliveries
- Access to: `/rider/*` routes

## Protecting Routes

### 1. Server-Side (Middleware)

Routes are automatically protected by the middleware in `middleware.ts`. The middleware:
- Redirects unauthenticated users to appropriate login pages
- Validates user roles for protected routes
- Handles route-specific access control

**Protected routes are configured in `middleware.ts`:**

```typescript
const protectedRoutes = {
  customer: ['/profile', '/cart', '/checkout', '/orders', '/wallet'],
  admin: ['/admin/dashboard', '/admin/products', ...],
  rider: ['/rider/dashboard', '/rider/deliveries', ...],
};
```

### 2. Client-Side (React Hook)

Use the `useRequireAuth` hook in client components:

```typescript
import { useRequireAuth } from '@/lib/hooks/useRequireAuth';

export default function ProfilePage() {
  // Protect customer page
  useRequireAuth({ requiredRole: 'customer' });
  
  // Rest of component...
}
```

**Multiple roles:**
```typescript
// Allow both superadmin and support
useRequireAuth({ 
  requiredRole: ['superadmin', 'support'] 
});
```

### 3. Component Wrapper

Use the `<ProtectedRoute>` component:

```tsx
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function DashboardPage() {
  return (
    <ProtectedRoute requiredRole="customer">
      <Dashboard />
    </ProtectedRoute>
  );
}
```

### 4. API Routes

Use server-side auth helpers in API routes:

```typescript
import { requireAuth, requireCustomer, requireAdmin } from '@/lib/serverAuth';

// Basic authentication check
export async function GET(request: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;
  
  // Your API logic...
}

// Require specific role
export async function POST(request: NextRequest) {
  const { session, error } = await requireAdmin();
  if (error) return error;
  
  // Admin-only logic...
}

// Allow multiple roles
export async function PUT(request: NextRequest) {
  const { session, error } = await requireAuth(['superadmin', 'support']);
  if (error) return error;
  
  // Your API logic...
}
```

**Available helpers:**
- `requireAuth([roles])` - General authentication with optional role check
- `requireCustomer()` - Shortcut for customer-only routes
- `requireAdmin()` - Shortcut for admin routes (superadmin or support)
- `requireSuperAdmin()` - Shortcut for super admin only
- `requireRider()` - Shortcut for rider routes

## Login Pages

### Customer Login
- **URL:** `/login`
- **Features:** Email/password, Google/Facebook OAuth, remember me
- **Redirects to:** `/` or `callbackUrl` parameter

### Admin Login
- **URL:** `/admin/login`
- **Features:** Email/password only (no social login)
- **Redirects to:** `/admin/dashboard` or `callbackUrl` parameter

### Rider Login
- **URL:** Create at `/rider/login` (not implemented yet)
- Use similar pattern to admin login

## Registration

### Customer Registration
- **URL:** `/register`
- **Features:** 
  - Email/password registration
  - Optional phone number
  - Password strength indicator
  - Email verification (token sent)

### Admin/Support Creation
- **Method:** Programmatic only (via Super Admin)
- **API:** `POST /api/admin/auth/create-support`
- Super Admin can create Support users through admin panel

## Session Management

### Getting Session (Client-Side)

```typescript
import { useSession } from 'next-auth/react';

function MyComponent() {
  const { data: session, status } = useSession();
  
  if (status === 'loading') return <Loader />;
  if (status === 'unauthenticated') return <Login />;
  
  return <div>Welcome, {session.user.name}!</div>;
}
```

### Getting Session (Server-Side)

```typescript
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Use session.user data...
}
```

## Session Data Structure

```typescript
{
  user: {
    id: string;           // User ID from database
    email: string;        // User email
    name: string;         // User full name
    role: string;         // 'customer' | 'superadmin' | 'support' | 'rider'
    image?: string;       // Profile picture URL (optional)
  },
  expires: string;        // Session expiration date
}
```

## Password Management

### Customer Password Reset
1. User requests reset at `/forgot-password`
2. System sends reset email with token
3. User clicks link and sets new password at `/reset-password?token=...`

### Admin Password Reset
- Super Admin can reset any admin/support password via admin panel
- API: `POST /api/admin/auth/reset-password`

## Security Features

1. **Password Hashing:** bcrypt with 12 rounds
2. **Token-based:** JWT tokens for session management
3. **Reset Tokens:** Cryptographically secure reset tokens with expiration
4. **Role-based Access:** Strict role checking at middleware and API level
5. **Inactive Account Protection:** Admin accounts can be deactivated
6. **Login Monitoring:** All admin login attempts are logged

## Environment Variables

Required in `.env.local`:

```env
# Database
MONGODB_URI=mongodb://...

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# OAuth (Optional - for social login)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
FACEBOOK_CLIENT_ID=your-facebook-client-id
FACEBOOK_CLIENT_SECRET=your-facebook-client-secret
```

## Examples

### Example: Protected Customer Page

```tsx
'use client';

import { useRequireAuth } from '@/lib/hooks/useRequireAuth';
import { useSession } from 'next-auth/react';

export default function OrdersPage() {
  useRequireAuth({ requiredRole: 'customer' });
  const { data: session } = useSession();
  
  return (
    <div>
      <h1>My Orders</h1>
      <p>Welcome, {session?.user?.name}</p>
      {/* Orders content */}
    </div>
  );
}
```

### Example: Protected Admin Page

```tsx
'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function AdminDashboard() {
  return (
    <ProtectedRoute requiredRole={['superadmin', 'support']}>
      <div>
        <h1>Admin Dashboard</h1>
        {/* Admin content */}
      </div>
    </ProtectedRoute>
  );
}
```

### Example: Protected API Route

```typescript
import { requireCustomer } from '@/lib/serverAuth';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { session, error } = await requireCustomer();
  if (error) return error;
  
  // Customer is authenticated, proceed with order
  const body = await request.json();
  
  // Create order for session.user.id...
  
  return NextResponse.json({ success: true });
}
```

## Troubleshooting

### "Unauthorized" errors
- Check if user is logged in
- Verify user has correct role for the route
- Check `NEXTAUTH_SECRET` is set in `.env.local`

### Redirects not working
- Ensure middleware is running (check `middleware.ts`)
- Verify route is listed in protected routes
- Check for typos in route paths

### Social login not working
- Verify OAuth credentials in `.env.local`
- Check OAuth callback URLs in Google/Facebook console
- Ensure `NEXTAUTH_URL` matches your domain

## API Reference

### Customer Auth Routes
- `POST /api/auth/register` - Register new customer
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `POST /api/auth/verify-email` - Verify email with token

### Admin Auth Routes
- `POST /api/admin/auth/create-support` - Create Support user (Super Admin only)
- `POST /api/admin/auth/reset-password` - Reset admin password (Super Admin only)
- `POST /api/admin/auth/toggle-status` - Activate/deactivate admin (Super Admin only)
- `GET /api/admin/auth/list` - List all admin users (Super Admin only)
- `GET /api/admin/auth/profile` - Get admin profile
- `PUT /api/admin/auth/profile` - Update admin profile

### User Profile Routes
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile
- `GET /api/user/addresses` - Get all addresses
- `POST /api/user/addresses` - Add new address
- `PUT /api/user/addresses/[id]` - Update address
- `DELETE /api/user/addresses/[id]` - Delete address
