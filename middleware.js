import { next } from '@vercel/edge';

// Gates every /admin request behind a shared secret before the admin bundle
// is ever served. Visiting /admin?key=<ADMIN_GATE_KEY> once sets a cookie;
// after that the real Supabase-backed login takes over as normal. Anyone
// without the key gets a plain 404 — the route doesn't appear to exist.
export const config = {
  matcher: ['/admin', '/admin/:path*', '/admin.html'],
};

const COOKIE_NAME = 'admin_gate';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export default function middleware(request) {
  const gateKey = process.env.ADMIN_GATE_KEY;
  const url = new URL(request.url);

  // No key configured server-side — fail closed, not open.
  if (!gateKey) {
    return new Response(null, { status: 404 });
  }

  const cookieHeader = request.headers.get('cookie') || '';
  const hasValidCookie = cookieHeader
    .split(';')
    .map((c) => c.trim())
    .includes(`${COOKIE_NAME}=${gateKey}`);

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
        'Set-Cookie': `${COOKIE_NAME}=${gateKey}; Path=/; Max-Age=${COOKIE_MAX_AGE}; HttpOnly; Secure; SameSite=Strict`,
      },
    });
  }

  return new Response(null, { status: 404 });
}
