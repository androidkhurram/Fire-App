import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/** Ensures `/` always reaches the app even if config/static routing behaves oddly in dev. */
export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: '/',
};
