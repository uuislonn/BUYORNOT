import { NextResponse, type NextRequest } from "next/server";
import { authClient } from "../../../lib/auth/server";
import { authConfig } from "../../../lib/auth/config";
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (code && authConfig()) {
    try {
      const client = await authClient();
      const { error } = await client.auth.exchangeCodeForSession(code);
      if (!error) {
        const target =
          request.nextUrl.searchParams.get("flow") === "recovery"
            ? "/update-password"
            : "/account";
        const response = NextResponse.redirect(new URL(target, request.url));
        response.cookies.delete("buyornot-creator-demo");
        response.headers.set("Cache-Control", "private, no-store");
        return response;
      }
    } catch {
      /* Never log auth codes, tokens or provider errors. */
    }
  }
  return NextResponse.redirect(new URL("/login?error=callback", request.url));
}
