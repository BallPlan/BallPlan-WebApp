import { next } from '@vercel/edge';

// Two jobs while the main app isn't public yet:
// 1. Everything except /admin and /waitlist (and built static assets)
//    redirects to /waitlist.
// 2. /admin stays gated behind a shared secret, same as before — visiting
//    /admin?key=<ADMIN_GATE_KEY> once sets a cookie, after which the real
//    Supabase-backed login takes over. No key configured server-side means
//    everything fails closed (404), not open.
export const config = {
  matcher: ['/:path*'],
};

const ADMIN_COOKIE_NAME = 'admin_gate';
const ADMIN_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function isStaticAsset(pathname) {
  return pathname.startsWith('/assets/') || /\.[a-zA-Z0-9]+$/.test(pathname);
}

function isAdminPath(pathname) {
  return pathname === '/admin' || pathname.startsWith('/admin/') || pathname === '/admin.html';
}

export default function middleware(request) {
  const url = new URL(request.url);
  const { pathname } = url;

  if (isStaticAsset(pathname)) {
    return next();
  }

  if (isAdminPath(pathname)) {
    return handleAdminGate(request, url);
  }

  if (pathname === '/waitlist') {
    return next();
  }

  url.pathname = '/waitlist';
  url.search = '';
  return Response.redirect(url, 307);
}

function handleAdminGate(request, url) {
  const gateKey = process.env.ADMIN_GATE_KEY;

  if (!gateKey) {
    return new Response(null, { status: 404 });
  }

  const cookieHeader = request.headers.get('cookie') || '';
  const hasValidCookie = cookieHeader
    .split(';')
    .map((c) => c.trim())
    .includes(`${ADMIN_COOKIE_NAME}=${gateKey}`);

  if (hasValidCookie) {
    return next();
  }

  const providedKey = url.searchParams.get('key');
  if (providedKey && providedKey === gateKey) {
    url.searchParams.delete('key');
    return new Response(null, {
      status: 302,
      headers: {
        Location: url.toString(),
        'Set-Cookie': `${ADMIN_COOKIE_NAME}=${gateKey}; Path=/; Max-Age=${ADMIN_COOKIE_MAX_AGE}; HttpOnly; Secure; SameSite=Strict`,
      },
    });
  }

  return new Response(null, { status: 404 });
}
