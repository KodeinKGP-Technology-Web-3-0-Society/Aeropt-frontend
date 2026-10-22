import type { NextConfig } from "next";

/**
 * `NEXT_PUBLIC_*` values are inlined at build time. A missing one used to
 * resolve to `undefined`/`""` and only show up later as a confusing fetch to
 * `undefined/api/...` (or a same-origin 404), so name it here, once, while the
 * build is still on screen. `src/lib/auth.ts` throws a matching named error at
 * runtime for the same case.
 *
 * Defaults for local work live in `.env.example`:
 *   NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000/api/v1  (Django)
 *   NEXT_PUBLIC_AGENT_API_BASE=http://127.0.0.1:8001       (agent)
 */
const REQUIRED_PUBLIC_ENV = ["NEXT_PUBLIC_API_BASE_URL", "NEXT_PUBLIC_AGENT_API_BASE"] as const;

const missingEnv = REQUIRED_PUBLIC_ENV.filter((key) => !process.env[key]);
if (missingEnv.length > 0) {
  const message =
    `[next.config] Missing required env: ${missingEnv.join(", ")}. ` +
    `Copy .env.example to .env.local and fill them in.`;
  // Opt-in hard failure for deploy pipelines; a warning locally so `next build`
  // still works for someone only checking types or bundling.
  if (process.env.STRICT_PUBLIC_ENV === "1") {
    throw new Error(message);
  }
  console.warn(message);
}

/**
 * Baseline response headers. Nothing here depends on the route, so it is a
 * static list rather than per-request work.
 *
 * No CSP: the app inlines a theme-boot script in `layout.tsx` and KaTeX writes
 * inline styles, so a useful policy needs a nonce pipeline — a bigger change
 * than this pass, and a half-broken CSP is worse than none.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Allow microphone for voice doubt solving; deny camera, geolocation, payment.
  { key: "Permissions-Policy", value: "camera=(), microphone=(self), geolocation=(), payment=()" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const isAndroid = process.env.BUILD_TARGET === "android";

const nextConfig: NextConfig = {
  turbopack: { root: __dirname },
  allowedDevOrigins: ["their-shake-probe-knives.trycloudflare.com"],
  skipTrailingSlashRedirect: true,
  experimental: { proxyTimeout: 300_000 },
  ...(isAndroid
    ? {
        output: "export",
        images: { unoptimized: true },
        trailingSlash: true,
      }
    : {
        async rewrites() {
          const django = process.env.DJANGO_ORIGIN || "http://127.0.0.1:8000";
          const agent = process.env.AGENT_ORIGIN || "http://127.0.0.1:8001";
          return [
            { source: "/api/v1/:path*/", destination: `${django}/api/v1/:path*/` },
            { source: "/api/v1/:path*", destination: `${django}/api/v1/:path*/` },
            { source: "/agent-api/:path*", destination: `${agent}/:path*` },
          ];
        },
        async redirects() {
          return [
            {
              source: "/study/:conceptId((?!room).*)",
              destination: "/study/room?concept=:conceptId",
              permanent: false,
            },
            {
              source: "/lesson/:conceptId((?!room).*)",
              destination: "/lesson/room?concept=:conceptId",
              permanent: false,
            },
            {
              source: "/chat/:sessionId((?!session).*)",
              destination: "/chat/session?id=:sessionId",
              permanent: false,
            },
          ];
        },
        async headers() {
          return [{ source: "/:path*", headers: securityHeaders }];
        },
      }),
};

export default nextConfig;
