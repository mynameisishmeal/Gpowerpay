import { NextResponse } from 'next/server';
import NextAuth from 'next-auth';
import { authConfig } from '@/auth.config';

// Define protected routes and their required roles
const protectedRoutes = {
  // Customer routes - require 'customer' role
  customer: ['/profile', '/cart', '/checkout', '/orders', '/wallet', '/dashboard', '/settings', '/notifications', '/wishlist'],
  
  // Admin routes - require 'superadmin' or 'support' roles
  admin: ['/admin/dashboard', '/admin/products', '/admin/orders', '/admin/customers', '/admin/riders', '/admin/users', '/admin/settings'],
  
  // Rider routes - require 'rider' role
  rider: ['/rider/dashboard', '/rider/deliveries', '/rider/earnings', '/rider/orders', '/rider/settings'],
};

// Public routes that don't require authentication
const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/admin/login',
  '/rider/login',
  '/rider/verify',
  '/products',
  '/about',
  '/contact',
];

export default NextAuth(authConfig).auth((req) => {
  const { pathname } = req.nextUrl;

  // Skip middleware for static files, API routes (except protected ones), and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') || // NextAuth handles its own auth
    pathname.startsWith('/static') ||
    pathname.includes('/favicon.ico') ||
    pathname.includes('.') // Files with extensions
  ) {
    return NextResponse.next();
  }

  // Check if route is public
  const isPublicRoute = publicRoutes.some(route => {
    if (route === '/') {
      return pathname === '/';
    }
    return pathname === route || pathname.startsWith(`${route}/`);
  });
  
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Get the user's session token from NextAuth v5
  const token = req.auth;

  // If no token, redirect to appropriate login page or return 401 for API routes
  if (!token?.user) {
    // If it's an API route, return 401 Unauthorized instead of redirecting
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Redirect admin routes to admin login
    if (pathname.startsWith('/admin')) {
      const url = new URL('/admin/login', req.url);
      url.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(url);
    }
    
    // Redirect rider routes to rider login
    if (pathname.startsWith('/rider')) {
      const url = new URL('/rider/login', req.url);
      url.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(url);
    }
    
    // Redirect all other protected routes to customer login
    const url = new URL('/login', req.url);
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }

  // Check role-based access
  const userRole = token.user.role as string;

  // Block riders from customer-only API routes
  if (userRole === 'rider') {
    // Specifically block /api/orders but ALLOW /api/orders/[id]
    if (pathname === '/api/orders' || pathname === '/api/orders/') {
      return NextResponse.json({ error: 'Forbidden. Riders cannot access this API endpoint.' }, { status: 403 });
    }
    
    const customerApiRoutes = ['/api/cart', '/api/wallet', '/api/wishlist', '/api/profile'];
    if (customerApiRoutes.some(route => pathname.startsWith(route))) {
      return NextResponse.json({ error: 'Forbidden. Riders cannot access this API endpoint.' }, { status: 403 });
    }
  }

  // Block riders from customer-only routes
  const customerOnlyRoutes = ['/profile', '/cart', '/checkout', '/orders', '/wallet', '/wishlist', '/dashboard', '/settings', '/notifications'];
  if (customerOnlyRoutes.some(route => pathname.startsWith(route))) {
    if (userRole === 'rider') {
      // Redirect riders to their dashboard
      return NextResponse.redirect(new URL('/rider/dashboard', req.url));
    }
  }

  // Customer routes - only allow customers (not admin or rider)
  if (protectedRoutes.customer.some(route => pathname.startsWith(route))) {
    if (!['customer', 'worker'].includes(userRole)) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  // Admin routes - allow sadmin and admin
  if (protectedRoutes.admin.some(route => pathname.startsWith(route))) {
    if (!['sadmin', 'admin', 'support'].includes(userRole)) {
      return NextResponse.redirect(new URL('/admin/login', req.url));
    }
  }

  // Rider routes - only allow riders
  if (protectedRoutes.rider.some(route => pathname.startsWith(route))) {
    if (userRole !== 'rider') {
      return NextResponse.redirect(new URL('/rider/login', req.url));
    }
  }

  // Prevent customers from accessing admin/rider routes
  if (pathname.startsWith('/admin') && !['sadmin', 'admin', 'support'].includes(userRole)) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  if (pathname.startsWith('/rider') && userRole !== 'rider') {
    return NextResponse.redirect(new URL('/', req.url));
  }

  // Allow access
  return NextResponse.next();
});

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public directory)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
