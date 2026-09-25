import { next } from '@vercel/edge';

// Two jobs while the main app isn't public yet:
// 1. Everything except /admin, /support, /agent and /waitlist (and built
//    static assets) redirects to /waitlist.
// 2. /admin, /support and /agent stay gated behind a secret key — visiting
//    the page once with ?key=<key> sets a cookie, after which the real
//    Supabase-backed login for that portal takes over. Each portal's key is
//    its own secret: the support key opens /support only, and the admin key
//    does not open /support. No key configured server-side means that
//    portal fails closed (404), not open.
//      /admin   -> ADMIN_GATE_KEY
//      /support -> SUPPORT_GATE_KEY (must differ from ADMIN_GATE_KEY)
//      /agent   -> ADMIN_GATE_KEY (unchanged — shares the admin key/cookie)
export const config = {
  matcher: ['/:path*'],
};

const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

const PORTALS = [
  { prefix: '/admin', html: '/admin.html', envKey: 'ADMIN_GATE_KEY', cookie: 'admin_gate', cookiePath: '/' },
  { prefix: '/support', html: '/support.html', envKey: 'SUPPORT_GATE_KEY', cookie: 'support_gate', cookiePath: '/support' },
  { prefix: '/agent', html: '/agent.html', envKey: 'ADMIN_GATE_KEY', cookie: 'admin_gate', cookiePath: '/' },
];

function isStaticAsset(pathname) {
  return pathname.startsWith('/assets/') || /\.[a-zA-Z0-9]+$/.test(pathname);
}

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

  // Gated paths are checked first and unconditionally: isStaticAsset's
  // extension regex (`\.[a-zA-Z0-9]+$`) matches *any* dotted extension,
  // including ".html" — so admin.html/support.html/agent.html themselves
  // used to match it and short-circuit straight to next(), completely
  // bypassing the gate for anyone who requested the raw built file
  // instead of the friendly /admin, /support or /agent path. Checking
  // the portal first closes that regardless of extension.
  const portal = portalFor(pathname);
  if (portal) {
    return handleGate(request, url, portal);
  }

  if (isStaticAsset(pathname)) {
    return next();
  }

  if (pathname === '/waitlist') {
    return next();
  }

  url.pathname = '/waitlist';
  url.search = '';
  return Response.redirect(url, 307);
}

function handleGate(request, url, portal) {
  const gateKey = process.env[portal.envKey];

  if (!gateKey) {
    return new Response(null, { status: 404 });
  }

  // Support must never share the admin key — if someone configures the same
  // value for both, fail closed rather than silently letting one key open
  // both portals.
  if (portal.envKey === 'SUPPORT_GATE_KEY' && safeEqual(gateKey, process.env.ADMIN_GATE_KEY || '')) {
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
