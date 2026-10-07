import { next } from '@vercel/edge';

// The main app is public (no more blanket redirect to /waitlist — that was
// the pre-launch gate; see git history before 2026-10-07 if it ever needs
// to come back). /admin and /support still stay behind a secret key —
// visiting the page once with ?key=<key> sets a cookie, after which the
// real Supabase-backed login for that portal takes over. Each has its own
// key and its own cookie — neither opens the other. No key configured
// server-side means that portal fails closed (404), not open.
//      /admin   -> ADMIN_GATE_KEY
//      /support -> SUPPORT_GATE_KEY
// /agent is plain public (like the main app) — agents are external people
// the owner hands this link to directly, and the real protection is the
// Supabase agent login itself (role-restricted), not a pre-launch key.
export const config = {
  matcher: ['/:path*'],
};

const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

const PORTALS = [
  { prefix: '/admin', html: '/admin.html', envKey: 'ADMIN_GATE_KEY', cookie: 'admin_gate', cookiePath: '/admin' },
  { prefix: '/support', html: '/support.html', envKey: 'SUPPORT_GATE_KEY', cookie: 'support_gate', cookiePath: '/support' },
];

function portalFor(pathname) {
  return (
    PORTALS.find((p) => pathname === p.prefix || pathname.startsWith(`${p.prefix}/`) || pathname === p.html) || null
  );
}

// Length-independent-ish comparison so a wrong guess can't be narrowed down
// character by character from response timing.
function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  let diff = a.length ^ b.length;
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i += 1) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

export default function middleware(request) {
  const url = new URL(request.url);
  const { pathname } = url;

  // portal.html paths (e.g. /admin.html, the raw built file someone could
  // request directly instead of the friendly /admin path) are matched here
  // too, so there's no bypass of the gate via the built filename.
  const portal = portalFor(pathname);
  if (portal) {
    return handleGate(request, url, portal);
  }

  // Everything else — the public app and the static assets it loads — is
  // live.
  return next();
}

function handleGate(request, url, portal) {
  const gateKey = process.env[portal.envKey];

  if (!gateKey) {
    return new Response(null, { status: 404 });
  }

  // No portal's key may double as another's — if two ever get configured
  // the same, fail closed rather than silently letting one key open both.
  const sharesAnotherPortalsKey = PORTALS.some(
    (p) => p.envKey !== portal.envKey && safeEqual(gateKey, process.env[p.envKey] || ''),
  );
  if (sharesAnotherPortalsKey) {
    return new Response(null, { status: 404 });
  }

  const cookieHeader = request.headers.get('cookie') || '';
  const cookieValue = cookieHeader
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${portal.cookie}=`))
    ?.slice(portal.cookie.length + 1);

  if (cookieValue && safeEqual(cookieValue, gateKey)) {
    return next();
  }

  const providedKey = url.searchParams.get('key');
  if (providedKey && safeEqual(providedKey, gateKey)) {
    url.searchParams.delete('key');
    return new Response(null, {
      status: 302,
      headers: {
        Location: url.toString(),
        'Set-Cookie': `${portal.cookie}=${gateKey}; Path=${portal.cookiePath}; Max-Age=${COOKIE_MAX_AGE}; HttpOnly; Secure; SameSite=Strict`,
      },
    });
  }

  return new Response(null, { status: 404 });
}
