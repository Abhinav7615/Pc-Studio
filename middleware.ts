import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protected routes check can be implemented client-side for now
  // Middleware will be migrated to proxy in future versions

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/orders/:path*'],
};