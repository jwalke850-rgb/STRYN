import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE, authToken } from "@/lib/auth";

// Single-operator gate. With OPERATOR_PASSWORD unset (local dev) the console is open.
export async function proxy(request: NextRequest) {
  const password = process.env.OPERATOR_PASSWORD;
  if (!password) return NextResponse.next();
  if (request.cookies.get(AUTH_COOKIE)?.value === (await authToken(password))) return NextResponse.next();
  const url = new URL("/login", request.url);
  url.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!login|_next/static|_next/image|favicon.ico).*)"],
};
