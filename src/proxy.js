import { NextResponse } from 'next/server';

// Private route prefixes that require authentication
const PROTECTED_PREFIXES = [
  '/home',
  '/invoice',
  '/invoices',
  '/addInvoice',
  '/payments',
  '/paymentHistory',
  '/payment',
  '/paymentDetails',
  '/reports',
  '/parties',
  '/items',
  '/ledgers',
  '/ledgerTransactions',
  '/siteProject',
  '/siteDetails',
  '/projectDetails',
  '/addParty',
  '/addItem',
  '/addLedger',
  '/addStaff',
  '/settings',
  '/notifications',
  '/addBusiness',
  '/addSiteProject',
  '/addLedgerTransaction',
  '/staff',
  '/adjustStock',
];

export function proxy(request) {
  const { pathname, search } = request.nextUrl;

  // Ignore static assets, next internals, and API route handlers
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get('auth_token')?.value || null;
  const isAuthenticated = !!token;

  const isAuthRoute = pathname === '/login' || pathname === '/sign-up';
  const isProtectedRoute = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  // 1. If user is NOT authenticated and trying to access a protected route:
  // Redirect to /login with requested path preserved in `next` query param.
  if (!isAuthenticated && isProtectedRoute) {
    const loginUrl = new URL('/login', request.url);
    const fullRequestedPath = pathname + search;
    loginUrl.searchParams.set('next', fullRequestedPath);
    return NextResponse.redirect(loginUrl);
  }

  // 2. If user IS authenticated and visiting auth routes (/login or /sign-up):
  // Redirect to /home.
  if (isAuthenticated && isAuthRoute) {
    const homeUrl = new URL('/home', request.url);
    return NextResponse.redirect(homeUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

export default proxy;
