import { beforeEach, afterEach, it, expect, vi } from "vitest";
const mock = vi.hoisted(() => ({
  local: vi.fn(),
  user: vi.fn(),
  config: vi.fn(),
  demo: vi.fn(),
}));
vi.mock("../../lib/auth/local-test", () => ({ localTestProfile: mock.local }));
vi.mock("../../lib/auth/server", () => ({ currentUser: mock.user }));
vi.mock("../../lib/auth/config", () => ({ authConfig: mock.config }));
vi.mock("../../app/(creator)/_server/posts", () => ({
  memberProfile: (u: { id: string; user_metadata: { nickname: string } }) => ({
    id: u.id,
    nickname: u.user_metadata.nickname,
  }),
}));
vi.mock("./store", () => ({ store: { viewer: mock.demo } }));
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: () => ({ value: "demo-token" }) }),
}));
import { communityViewer } from "./session";
beforeEach(() => {
  vi.resetAllMocks();
  mock.local.mockResolvedValue(null);
  mock.user.mockResolvedValue(null);
  mock.config.mockReturnValue({});
});
afterEach(() => vi.unstubAllEnvs());
it("uses the same verified local test identity as curation and account pages", async () => {
  mock.local.mockResolvedValue({
    id: "test-member",
    nickname: "일반회원 테스트",
    role: "USER",
  });
  expect(await communityViewer()).toEqual({
    id: "test-member",
    nickname: "일반회원 테스트",
  });
  expect(mock.demo).not.toHaveBeenCalled();
});
it("uses the real authenticated identity without trusting a separate demo cookie", async () => {
  mock.user.mockResolvedValue({
    id: "real-member",
    user_metadata: { nickname: "회원" },
  });
  expect(await communityViewer()).toEqual({
    id: "real-member",
    nickname: "회원",
  });
  expect(mock.demo).not.toHaveBeenCalled();
});
it("does not fall back to demo sessions when real authentication is configured", async () => {
  expect(await communityViewer()).toBeNull();
  expect(mock.demo).not.toHaveBeenCalled();
});
it("blocks demo sessions in production even without auth configuration", async () => {
  vi.stubEnv("NODE_ENV", "production");
  mock.config.mockReturnValue(null);
  expect(await communityViewer()).toBeNull();
  expect(mock.demo).not.toHaveBeenCalled();
});
