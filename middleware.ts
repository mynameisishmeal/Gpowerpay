import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Define protected routes and their required roles
const protectedRoutes = {
  // Customer routes - require 'customer' role
  customer: ['/profile', '/cart', '/checkout', '/orders', '/wallet'],
  
  // Admin routes - require 'superadmin' or 'support' roles
  admin: ['/admin/dashboard', '/admin/products', '/admin/orders', '/admin/customers', '/admin/riders', '/admin/users', '/admin/settings'],
  
  // Rider routes - require 'rider' role
  rider: ['/rider/dashboard', '/rider/deliveries', '/rider/earnings'],
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
  '/products',
  '/about',
  '/contact',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route));
  
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Get the user's session token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // If no token, redirect to appropriate login page
  if (!token) {
    // Redirect admin routes to admin login
    if (pathname.startsWith('/admin')) {
      const url = new URL('/admin/login', request.url);
      url.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(url);
    }
    
    // Redirect rider routes to rider login (if you create one)
    if (pathname.startsWith('/rider')) {
      const url = new URL('/login', request.url); // Or create /rider/login
      url.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(url);
    }
    
    // Redirect all other protected routes to customer login
    const url = new URL('/login', request.url);
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }

  // Check role-based access
  const userRole = token.role as string;

  // Customer routes
  if (protectedRoutes.customer.some(route => pathname.startsWith(route))) {
    if (userRole !== 'customer') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Admin routes - allow both superadmin and support
  if (protectedRoutes.admin.some(route => pathname.startsWith(route))) {
    if (userRole !== 'superadmin' && userRole !== 'support') {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  // Rider routes
  if (protectedRoutes.rider.some(route => pathname.startsWith(route))) {
    if (userRole !== 'rider') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Prevent customers from accessing admin/rider routes
  if (pathname.startsWith('/admin') && userRole === 'customer') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (pathname.startsWith('/rider') && userRole === 'customer') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Allow access
  return NextResponse.next();
}

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
