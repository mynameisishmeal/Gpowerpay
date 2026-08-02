# GpowerPay Role Mapping Documentation

## ⚠️ CRITICAL: DO NOT CHANGE ROLE NAMES

This application **shares a MongoDB database** with the legacy **GpowerCRM** system.

Changing role names will **BREAK** GpowerCRM and cause data inconsistencies across both systems.

## Role Mapping

The role names in the database are legacy names from GpowerCRM. Here's what they actually mean in GpowerPay:

| Database Role | Actual Meaning | Access Level | Description |
|---------------|----------------|--------------|-------------|
| `sadmin` | **Super Admin** | Full Access | Highest privilege - can do everything |
| `admin` | **Support Staff** | Admin Access | Support team - can manage orders, users, products |
| `worker` | **Customer** | Customer Access | Regular customer (legacy name) |
| `customer` | **Customer** | Customer Access | Regular customer |
| `support` | **Support** | Support Access | Legacy support role (rarely used) |

## Code Usage

### Authentication Helpers

```typescript
// Super admin only (sadmin)
const { session, error } = await requireSuperAdmin();

// Admin staff (sadmin + admin)
const { session, error } = await requireAdmin();

// Support staff only (admin)
const { session, error } = await requireSupport();

// Customers (customer + worker)
const { session, error } = await requireCustomer();
```

### Frontend Role Checks

```typescript
// Check if user is admin staff
if (session?.user?.role === 'sadmin' || session?.user?.role === 'admin') {
  // Show admin features
}

// Check if user is super admin
if (session?.user?.role === 'sadmin') {
  // Show super admin features
}

// Check if user is customer
if (session?.user?.role === 'customer' || session?.user?.role === 'worker') {
  // Show customer features
}
```

## Dashboard Redirects

```typescript
// Redirect admin staff to admin dashboard
if (['sadmin', 'admin'].includes(session.user.role)) {
  router.push('/admin/dashboard');
}

// Redirect customers to customer dashboard
if (['customer', 'worker'].includes(session.user.role)) {
  router.push('/dashboard');
}
```

## Why These Names?

These role names come from the original GpowerCRM system:
- `sadmin` = "super admin" (shortened)
- `admin` = was originally for support staff
- `worker` = was used for delivery workers, now repurposed as customers

## Migration Note

When GpowerCRM is eventually deprecated, we can:
1. Create a migration script to rename all roles in the database
2. Update both applications simultaneously
3. Then use standard role names like: `superadmin`, `admin`, `support`, `customer`

Until then, **DO NOT** change these role names or the mapping.

## Files Using Role Checks

- `lib/serverAuth.ts` - Server-side auth helpers
- `auth.ts` - NextAuth configuration
- `models/User.ts` - User model schema
- `src/app/dashboard/page.tsx` - Dashboard redirect logic
- All `/api/admin/**` routes - Admin API endpoints

## Last Updated

January 2025 - Role mapping documented and enforced across codebase
