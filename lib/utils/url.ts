/**
 * Get the base URL for the application
 * Works in both server and client environments
 * 
 * Priority:
 * 1. NEXTAUTH_URL environment variable (if set)
 * 2. Vercel URL (if deployed on Vercel)
 * 3. Auto-detect from headers (server-side)
 * 4. window.location.origin (client-side)
 * 5. Fallback to localhost:3000
 */
export function getBaseUrl(): string {
  // 1. Check NEXTAUTH_URL (for explicit configuration)
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL;
  }

  // 2. Check Vercel URL (automatically set on Vercel deployments)
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // 3. Client-side: use window.location.origin
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  // 4. Fallback to localhost for development
  return 'http://localhost:3000';
}

/**
 * Get the base URL from request headers (server-side only)
 * More reliable than environment variables for dynamic deployments
 * 
 * @param headers - Request headers (from Next.js request)
 * @returns The base URL with protocol
 */
export function getBaseUrlFromHeaders(headers: Headers): string {
  // Check for forwarded protocol and host
  const protocol = headers.get('x-forwarded-proto') || 'http';
  const host = headers.get('x-forwarded-host') || headers.get('host') || 'localhost:3000';
  
  return `${protocol}://${host}`;
}

/**
 * Build an absolute URL from a relative path
 * 
 * @param path - Relative path (e.g., '/api/users')
 * @returns Absolute URL
 */
export function getAbsoluteUrl(path: string): string {
  const baseUrl = getBaseUrl();
  
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  return `${baseUrl}${normalizedPath}`;
}
