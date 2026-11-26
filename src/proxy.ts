import { NextResponse, type NextRequest } from "next/server";
import { ACCOUNT_PATH_HEADER } from "@/constants/auth";

/**
 * Minimal proxy: tells the account layout which page was requested (the layout cannot read the URL), so the server-side
 * guard can send a signed-out visitor to the login dialog and bring them back to that page after sign-in.
 * It does no authentication. Real auth (Clerk) will extend this file.
 */
export function proxy(request: NextRequest) {
  const headers = new Headers(request.headers);
  headers.set(ACCOUNT_PATH_HEADER, request.nextUrl.pathname);
  return NextResponse.next({ request: { headers } });
}

export const config = { matcher: "/account/:path*" };
