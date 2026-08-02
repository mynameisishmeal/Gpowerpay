import { auth } from '@/auth';
import { NextResponse } from 'next/server';

/**
 * IMPORTANT: ROLE MAPPING
 * This app shares a database with GpowerCRM (legacy system).
 * The role names CANNOT be changed without breaking GpowerCRM.
 * 
 * Legacy Role → Actual Meaning in GpowerPay:
 * - 'sadmin'   → Super Admin (highest privilege)
 * - 'admin'    → Support Staff
 * - 'worker'   → Customer (regular user)
 * - 'customer' → Customer (regular user)
 * 
 * DO NOT modify these mappings or role names!
 */

type UserRole = 'customer' | 'sadmin' | 'admin' | 'worker' | 'support';

/**
 * Server-side authentication helper for API routes
 * Checks if user is authenticated and optionally validates role
 * 
 * @param allowedRoles - Optional array of roles that are allowed to access the route
 * @returns Object with session, user, and error response if unauthorized
 * 
 * @example
 * // In an API route - require authentication only
 * const { session, error } = await requireAuth();
 * if (error) return error;
 * 
 * @example
 * // In an API route - require super admin only
 * const { session, error } = await requireAuth(['sadmin']);
 * if (error) return error;
 * 
 * @example
 * // In an API route - allow admin staff (sadmin + admin)
 * const { session, error } = await requireAuth(['sadmin', 'admin']);
 * if (error) return error;
 */
export async function requireAuth(allowedRoles?: UserRole[]) {
  const session = await auth();

  // Check if user is authenticated
  if (!session || !session.user) {
    return {
      session: null,
      user: null,
      error: NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      ),
    };
  }

  // Check if user has required role
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = session.user.role as UserRole;
    
    if (!allowedRoles.includes(userRole)) {
      return {
        session,
        user: session.user,
        error: NextResponse.json(
          { error: 'Forbidden. You do not have permission to access this resource.' },
          { status: 403 }
        ),
      };
    }
  }

  return {
    session,
    user: session.user,
    error: null,
  };
}

/**
 * Quick helper to check if user is a customer (worker or customer role)
 * Note: 'worker' is a legacy role name from GpowerCRM that means "customer"
 */
export async function requireCustomer() {
  return requireAuth(['customer', 'worker']);
}

/**
 * Quick helper to check if user is admin staff (sadmin or admin)
 * Note: 'sadmin' = superadmin, 'admin' = support staff (legacy GpowerCRM roles)
 */
export async function requireAdmin() {
  return requireAuth(['sadmin', 'admin']);
}

/**
 * Quick helper to check if user is super admin (sadmin only)
 * Note: 'sadmin' is the legacy GpowerCRM name for superadmin
 */
export async function requireSuperAdmin() {
  return requireAuth(['sadmin']);
}

/**
 * Quick helper to check if user is support staff (admin role)
 * Note: 'admin' is the legacy GpowerCRM name for support staff
 */
export async function requireSupport() {
  return requireAuth(['admin']);
}
