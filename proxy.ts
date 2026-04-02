import createMiddleware from 'next-intl/middleware';
import type { NextRequest } from 'next/server';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

// Next.js 16 renamed middleware.ts → proxy.ts with a "proxy" named export.
export function proxy(request: NextRequest) {
  return intlMiddleware(request);
}

export const config = {
  matcher: [
    // Match all paths except API routes, Next.js internals, and static files
    '/((?!api|_next|.*\\..*).*)',
    '/',
  ],
};
