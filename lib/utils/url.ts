import { headers } from 'next/headers';

/**
 * Get the base URL for the application
 * Works in both server and client environments
 * 
 * Priority:
 * 1. Auto-detect from headers (server-side, for dynamic domains like Ngrok)
 * 2. window.location.origin (client-side)
 * 3. NEXTAUTH_URL environment variable (fallback)
 * 4. Vercel URL (if deployed on Vercel)
 * 5. Fallback to localhost:3000
 */
export async function getBaseUrl(): Promise<string> {
  // 1. Try to get dynamically from request headers (server-side)
  try {
    const headersList = await headers();
    const host = headersList.get('x-forwarded-host') || headersList.get('host');
    const protocol = headersList.get('x-forwarded-proto') || 'http';
    if (host) {
      return `${protocol}://${host}`;
    }
  } catch (e) {
    // Ignore error if outside request context
  }

  // 2. Client-side: use window.location.origin
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  // 3. Check NEXTAUTH_URL (for explicit configuration)
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL;
  }

  // 4. Check Vercel URL (automatically set on Vercel deployments)
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // 5. Fallback to localhost for development
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
export async function getAbsoluteUrl(path: string): Promise<string> {
  const baseUrl = await getBaseUrl();
  
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  return `${baseUrl}${normalizedPath}`;
}
