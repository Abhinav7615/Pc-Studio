import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

type AuthToken = { role?: string; [key: string]: unknown };

// Cache for token verification to reduce database lookups
const tokenCache = new Map<string, { token: AuthToken; timestamp: number }>();
const CACHE_DURATION = 60000; // 1 minute

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip next internals and auth callback path
  if (pathname.startsWith('/_next') || pathname.startsWith('/api/auth') || pathname.startsWith('/static') || pathname === '/favicon.ico') {
    return NextResponse.next();
  }

  // Admin section: allow only admin/staff users, but permit login/register paths
  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin/login' || pathname === '/admin/register') {
      return NextResponse.next();
    }

    const cookieToken = request.cookies.get('next-auth.session-token')?.value || 
                        request.cookies.get('__Secure-next-auth.session-token')?.value;

    if (!cookieToken) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/login';
      return NextResponse.redirect(url);
    }

    const cacheKey = `admin_${cookieToken}`;
    const cached = tokenCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      const token = cached.token;
      if (token && (token.role === 'admin' || token.role === 'staff')) {
        return NextResponse.next();
      }
    } else {
      const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
      if (token) {
        tokenCache.set(cacheKey, { token, timestamp: Date.now() });
      }
      if (!token || (token.role !== 'admin' && token.role !== 'staff')) {
        const url = request.nextUrl.clone();
        url.pathname = '/admin/login';
        return NextResponse.redirect(url);
      }
      return NextResponse.next();
    }

    const url = request.nextUrl.clone();
    url.pathname = '/admin/login';
    return NextResponse.redirect(url);
  }

  // User orders section: require authenticated user
  if (pathname.startsWith('/orders')) {
    const cookieToken = request.cookies.get('next-auth.session-token')?.value || 
                        request.cookies.get('__Secure-next-auth.session-token')?.value;
    
    if (!cookieToken) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/orders/:path*'],
};