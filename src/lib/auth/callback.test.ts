import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const exchange = vi.hoisted(() => vi.fn());
vi.mock("./server", () => ({
  authClient: async () => ({ auth: { exchangeCodeForSession: exchange } }),
}));
import { GET } from "../../app/auth/callback/route";
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "test-public-key");
});
afterEach(() => vi.unstubAllEnvs());
describe("auth callback", () => {
  it("exchanges a valid code and ignores arbitrary return URLs", async () => {
    exchange.mockResolvedValue({ error: null });
    const result = await GET(
      new NextRequest(
        "http://localhost:3000/auth/callback?code=one-time-code&next=https://evil.example",
      ),
    );
    expect(exchange).toHaveBeenCalledWith("one-time-code");
    expect(result.headers.get("location")).toBe(
      "http://localhost:3000/account",
    );
    expect(result.headers.get("cache-control")).toContain("no-store");
    expect(result.cookies.get("buyornot-creator-demo")?.value).toBe("");
  });
  it("routes password recovery to the update page", async () => {
    exchange.mockResolvedValue({ error: null });
    const result = await GET(
      new NextRequest(
        "http://localhost:3000/auth/callback?code=recovery-code&flow=recovery",
      ),
    );
    expect(result.headers.get("location")).toBe(
      "http://localhost:3000/update-password",
    );
  });
  it("rejects expired or reused codes", async () => {
    exchange.mockResolvedValue({ error: { message: "expired" } });
    const result = await GET(
      new NextRequest("http://localhost:3000/auth/callback?code=expired"),
    );
    expect(result.headers.get("location")).toBe(
      "http://localhost:3000/login?error=callback",
    );
  });
  it("handles OAuth cancellation without attempting a code exchange", async () => {
    const result = await GET(
      new NextRequest(
        "http://localhost:3000/auth/callback?error=access_denied",
      ),
    );
    expect(exchange).not.toHaveBeenCalled();
    expect(result.headers.get("location")).toContain("/login?error=callback");
  });
});
