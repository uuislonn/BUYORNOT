import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  auth: {
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
    resetPasswordForEmail: vi.fn(),
    updateUser: vi.fn(),
    signInWithOAuth: vi.fn(),
    signOut: vi.fn(),
  },
  from: vi.fn(),
  rpc: vi.fn(),
  currentUser: vi.fn(),
  remove: vi.fn(),
  previewLogin: vi.fn(),
  resolveUsername: vi.fn(),
}));
vi.mock("../../features/community/actions", () => ({
  loginPreview: mocks.previewLogin,
}));
vi.mock("./username-server", () => ({
  resolveUsername: mocks.resolveUsername,
}));
vi.mock("./server", () => ({
  authClient: async () => ({
    auth: mocks.auth,
    from: mocks.from,
    rpc: mocks.rpc,
  }),
  currentUser: mocks.currentUser,
}));
vi.mock("next/headers", () => ({
  headers: async () => new Headers({ origin: "http://localhost:3000" }),
  cookies: async () => ({ delete: mocks.remove }),
}));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`);
  },
}));
import {
  submitAuth,
  kakaoLogin,
  logout,
  checkUsername,
} from "../../app/(auth)/actions";
import {
  demoEnabled,
  readRoomSnapshot,
  switchIdentity,
} from "../../app/(creator)/_server/runtime";
import { passwordError } from "./config";
function form(values: Record<string, string> = {}) {
  const data = new FormData();
  for (const [key, value] of Object.entries({
    email: "member@example.com",
    password: "password1234",
    confirm: "password1234",
    nickname: "테스트",
    username: "member_1",
    ...values,
  }))
    data.set(key, value);
  return data;
}
beforeEach(() => {
  vi.resetAllMocks();
  mocks.rpc.mockResolvedValue({ data: true, error: null });
  const query = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue({ data: [], error: null }),
  };
  mocks.from.mockReturnValue(query);
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "test-public-key");
  vi.stubEnv("NEXT_PUBLIC_KAKAO_AUTH_ENABLED", "true");
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000");
});
afterEach(() => vi.unstubAllEnvs());
describe("아이디 중복 확인", () => {
  it("닉네임은 2~15자를 허용하고 범위를 벗어나면 가입을 차단한다", async () => {
    for (const nickname of ["가", "가".repeat(16)]) {
      expect(
        (await submitAuth("signup", form({ nickname }))).message,
      ).toContain("2~15자");
    }
    expect(mocks.auth.signUp).not.toHaveBeenCalled();
  });
  it("아이디를 서버에서 이메일로 변환한 뒤 비밀번호로 로그인한다", async () => {
    mocks.resolveUsername.mockResolvedValue("member@example.com");
    mocks.auth.signInWithPassword.mockResolvedValue({ error: null });
    await expect(
      submitAuth("login", form({ email: " Member_1 " })),
    ).rejects.toThrow("REDIRECT:/account");
    expect(mocks.resolveUsername).toHaveBeenCalledWith("member_1");
    expect(mocks.auth.signInWithPassword).toHaveBeenCalledWith({
      email: "member@example.com",
      password: "password1234",
    });
  });
  it("없는 아이디로는 비밀번호 인증을 요청하지 않는다", async () => {
    mocks.resolveUsername.mockResolvedValue(null);
    expect(
      (await submitAuth("login", form({ email: "missing_user" }))).message,
    ).toContain("아이디 또는 비밀번호");
    expect(mocks.auth.signInWithPassword).not.toHaveBeenCalled();
  });
  it("이메일 로그인은 아이디 조회 없이 기존 인증을 사용한다", async () => {
    mocks.auth.signInWithPassword.mockResolvedValue({ error: null });
    await expect(submitAuth("login", form())).rejects.toThrow(
      "REDIRECT:/account",
    );
    expect(mocks.resolveUsername).not.toHaveBeenCalled();
  });
  it("실제 조회 결과에 따라 사용 가능과 중복을 구분한다", async () => {
    expect((await checkUsername(" Member_1 ")).status).toBe("available");
    expect(mocks.rpc).toHaveBeenCalledWith("username_available", {
      candidate: "Member_1",
    });
    mocks.rpc.mockResolvedValue({ data: false, error: null });
    expect((await checkUsername("member_1")).status).toBe("duplicate");
  });
  it("조회 실패를 사용 가능으로 표시하지 않는다", async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { code: "42883" } });
    expect((await checkUsername("member_1")).status).toBe("error");
  });
  it("유효하지 않은 닉네임은 조회하지 않는다", async () => {
    expect((await checkUsername(" ")).status).toBe("error");
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("가입 시 서버에서 다시 확인하여 중복 계정 생성을 차단한다", async () => {
    mocks.rpc.mockResolvedValue({ data: false, error: null });
    expect((await submitAuth("signup", form())).message).toContain(
      "이미 사용 중",
    );
    expect(mocks.auth.signUp).not.toHaveBeenCalled();
  });
});
describe("real auth actions", () => {
  it("공통 로그인 화면에서도 기존 1111 개발 로그인을 처리한다", async () => {
    vi.stubEnv("NODE_ENV", "development");
    mocks.previewLogin.mockResolvedValue({
      ok: true,
      data: { id: "preview-1111", nickname: "1111" },
    });
    await expect(
      submitAuth("login", form({ email: "1111", password: "1111" })),
    ).rejects.toThrow("REDIRECT:/community");
    expect(mocks.previewLogin).toHaveBeenCalledWith("1111", "1111", false);
    expect(mocks.auth.signInWithPassword).not.toHaveBeenCalled();
  });
  it("잘못된 개발 계정 비밀번호로는 로그인하지 않는다", async () => {
    vi.stubEnv("NODE_ENV", "development");
    mocks.previewLogin.mockResolvedValue({
      ok: false,
      error: "아이디 또는 비밀번호가 올바르지 않습니다.",
    });
    expect(
      (await submitAuth("login", form({ email: "1111", password: "wrong" })))
        .ok,
    ).not.toBe(true);
  });
  it("운영 환경에서는 개발 로그인을 호출하지 않는다", async () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(
      (await submitAuth("login", form({ email: "1111", password: "1111" }))).ok,
    ).not.toBe(true);
    expect(mocks.previewLogin).not.toHaveBeenCalled();
  });
  it("does not send users to an unconfigured Kakao provider", async () => {
    vi.stubEnv("NEXT_PUBLIC_KAKAO_AUTH_ENABLED", "false");
    expect((await kakaoLogin()).message).toContain("설정");
    expect(mocks.auth.signInWithOAuth).not.toHaveBeenCalled();
  });
  it("fails closed without service configuration", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    expect((await submitAuth("login", form())).ok).not.toBe(true);
    expect(mocks.auth.signInWithPassword).not.toHaveBeenCalled();
  });
  it("validates signup password and confirmation before contacting the provider", async () => {
    await submitAuth("signup", form({ password: "short", confirm: "short" }));
    await submitAuth("signup", form({ confirm: "different123" }));
    expect(mocks.auth.signUp).not.toHaveBeenCalled();
    expect(passwordError("a".repeat(129) + "1")).not.toBeNull();
  });
  it("passes only nickname metadata, never a submitted admin role", async () => {
    mocks.auth.signUp.mockResolvedValue({
      data: { session: null },
      error: null,
    });
    const result = await submitAuth("signup", form({ role: "ADMIN" }));
    expect(result.ok).toBe(true);
    expect(mocks.auth.signUp).toHaveBeenCalledWith({
      email: "member@example.com",
      password: "password1234",
      options: {
        data: { nickname: "테스트", username: "member_1" },
        emailRedirectTo: "http://localhost:3000/auth/callback",
      },
    });
  });
  it("rejects invalid email before auth calls", async () => {
    await submitAuth("login", form({ email: "not-an-email" }));
    expect(mocks.auth.signInWithPassword).not.toHaveBeenCalled();
  });
  it("shows a generic credentials error without exposing provider text", async () => {
    mocks.auth.signInWithPassword.mockResolvedValue({
      error: { code: "invalid_credentials", message: "SECRET" },
    });
    const result = await submitAuth("login", form());
    expect(result.message).toContain("이메일 또는 비밀번호");
    expect(result.message).not.toContain("SECRET");
  });
  it("clears demo cookie and redirects after a real login", async () => {
    mocks.auth.signInWithPassword.mockResolvedValue({ error: null });
    await expect(submitAuth("login", form())).rejects.toThrow(
      "REDIRECT:/account",
    );
    expect(mocks.remove).toHaveBeenCalledWith("buyornot-creator-demo");
  });
  it("requests recovery with a fixed callback, without exposing account existence", async () => {
    mocks.auth.resetPasswordForEmail.mockResolvedValue({ error: null });
    expect((await submitAuth("reset", form())).ok).toBe(true);
    expect(mocks.auth.resetPasswordForEmail).toHaveBeenCalledWith(
      "member@example.com",
      { redirectTo: "http://localhost:3000/auth/callback?flow=recovery" },
    );
  });
  it("requires a server-verified user to update the password", async () => {
    mocks.currentUser.mockResolvedValue(null);
    expect((await submitAuth("update", form())).ok).not.toBe(true);
    expect(mocks.auth.updateUser).not.toHaveBeenCalled();
  });
  it("updates the password only after user verification", async () => {
    mocks.currentUser.mockResolvedValue({ id: "real-user" });
    mocks.auth.updateUser.mockResolvedValue({ error: null });
    expect((await submitAuth("update", form())).ok).toBe(true);
    expect(mocks.auth.updateUser).toHaveBeenCalledWith({
      password: "password1234",
    });
  });
  it("starts Kakao PKCE through Supabase and redirects to its authorize URL", async () => {
    mocks.auth.signInWithOAuth.mockResolvedValue({
      data: { url: "https://example.supabase.co/auth/v1/authorize" },
      error: null,
    });
    await expect(kakaoLogin()).rejects.toThrow(
      "REDIRECT:https://example.supabase.co/auth/v1/authorize",
    );
    expect(mocks.auth.signInWithOAuth).toHaveBeenCalledWith({
      provider: "kakao",
      options: {
        redirectTo: "http://localhost:3000/auth/callback",
        queryParams: { scope: "profile_nickname" },
      },
    });
  });
  it("does not claim logout succeeded when provider signout fails", async () => {
    mocks.auth.signOut.mockResolvedValue({ error: { code: "network" } });
    expect((await logout()).message).toContain("로그아웃하지 못했어요");
    expect(mocks.remove).not.toHaveBeenCalled();
  });
  it("signs out and removes the demo cookie", async () => {
    mocks.auth.signOut.mockResolvedValue({ error: null });
    await expect(logout()).rejects.toThrow("REDIRECT:/login");
    expect(mocks.remove).toHaveBeenCalled();
  });
});

describe("real identity isolation", () => {
  it("disables every demo role when real auth is configured", async () => {
    expect(demoEnabled()).toBe(false);
    await expect(switchIdentity("admin")).rejects.toThrow("데모 역할 전환");
  });
  it("never promotes an untrusted metadata role to admin", async () => {
    mocks.currentUser.mockResolvedValue({
      id: "real-user",
      user_metadata: { nickname: "실제 회원", role: "ADMIN" },
    });
    const room = await readRoomSnapshot("seoa");
    expect(room.viewer?.role).toBe("USER");
    expect(room.viewer?.id).toBe("real-user");
    expect(room.demoEnabled).toBe(false);
  });
});
