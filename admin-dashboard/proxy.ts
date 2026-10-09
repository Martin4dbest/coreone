import { NextRequest, NextResponse } from "next/server";

const ROOT_DOMAIN = "core1enterprisesolution.com";
const RESERVED_SUBDOMAINS = new Set([
  "www",
  "api",
  "mail",
  "smtp",
  "ftp",
  "autodiscover",
]);

export function proxy(request: NextRequest) {
  const rawHost = (
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    request.nextUrl.hostname
  )
    .split(",")[0]
    .trim();

  const hostname = rawHost.replace(/:\d+$/, "").toLowerCase();
  const suffix = `.${ROOT_DOMAIN}`;

  // Leave the root domain and all unrelated domains unchanged.
  if (!hostname.endsWith(suffix)) {
    return NextResponse.next();
  }

  const tenant = hostname.slice(0, -suffix.length);

  // Only route a single, non-reserved school subdomain.
  if (
    !tenant ||
    tenant.includes(".") ||
    RESERVED_SUBDOMAINS.has(tenant)
  ) {
    return NextResponse.next();
  }

  const pathname = request.nextUrl.pathname;

  // Keep Next.js assets, API endpoints and files out of tenant routing.
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/api/") ||
    pathname === "/change-password" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password" ||
    pathname === "/favicon.ico" ||
    /\.[^/]+$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  // Existing tenant-prefixed links must continue to work.
  const firstSegment = pathname.split("/").filter(Boolean)[0]?.toLowerCase();

  if (firstSegment === tenant) {
    return NextResponse.next();
  }

  // Map the subdomain to the existing [tenant] route.
  const destination = request.nextUrl.clone();
  destination.pathname =
    pathname === "/" ? `/${tenant}` : `/${tenant}${pathname}`;

  return NextResponse.rewrite(destination);
}

export const config = {
  matcher: ["/:path*"],
};
