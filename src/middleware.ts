import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = process.env.SESSION_COOKIE_NAME ?? "grebeg_session";
const secret = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "dev-insecure-secret-change-me"
);

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN", "COORDINATOR"];

async function getPayload(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as { sub: string; role: string };
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const payload = await getPayload(req);

  const isAuthed = Boolean(payload);
  const isAdmin = payload ? ADMIN_ROLES.includes(payload.role) : false;

  // Protect dashboard + admin
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/admin")) {
    if (!isAuthed) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
    if (pathname.startsWith("/admin") && !isAdmin) {
      const url = req.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  // Redirect logged-in users away from /login
  if (pathname === "/login" && isAuthed) {
    const url = req.nextUrl.clone();
    url.pathname = isAdmin ? "/admin" : "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/login"],
};
