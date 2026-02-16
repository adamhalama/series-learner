import { NextResponse, type NextRequest } from "next/server";
import {
  APP_GATE_COOKIE_NAME,
  assertAppGateConfiguration,
  isAppGateEnabled,
  sanitizeNextPath,
  verifyAppGateToken,
} from "./src/lib/app-gate";

const PUBLIC_PATHS = new Set([
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
  "/unlock",
  "/api/auth/unlock",
  "/api/auth/lock",
]);

const hasFileExtension = (pathname: string) => /\.[^/]+$/.test(pathname);

const isPublicPath = (pathname: string) => {
  if (PUBLIC_PATHS.has(pathname)) {
    return true;
  }

  if (pathname.startsWith("/_next/")) {
    return true;
  }

  return hasFileExtension(pathname);
};

export async function middleware(request: NextRequest) {
  if (!isAppGateEnabled()) {
    return NextResponse.next();
  }

  try {
    assertAppGateConfiguration();
  } catch {
    return new NextResponse("App gate is misconfigured.", { status: 500 });
  }

  const { pathname, search } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(APP_GATE_COOKIE_NAME)?.value;
  const isValidSession = await verifyAppGateToken(token);

  if (isValidSession) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/") || request.method !== "GET") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const unlockUrl = request.nextUrl.clone();
  unlockUrl.pathname = "/unlock";
  unlockUrl.search = `?next=${encodeURIComponent(
    sanitizeNextPath(`${pathname}${search}`),
  )}`;

  return NextResponse.redirect(unlockUrl);
}

export const config = {
  matcher: ["/:path*"],
};
