import { beforeEach, afterEach, it, expect, vi } from "vitest";
const state = vi.hoisted(() => ({
  host: "localhost:3000",
  token: "",
  file: "",
  activity: "",
  mtime: 1,
}));
vi.mock("node:fs", () => ({
  existsSync: () => true,
  readFileSync: (path: string) =>
    path.endsWith("activity.json") ? state.activity : state.file,
  statSync: () => ({ mtimeMs: state.mtime }),
  writeFileSync: vi.fn(),
  renameSync: vi.fn(),
}));
vi.mock("next/headers", () => ({
  headers: async () => ({ get: () => state.host }),
  cookies: async () => ({
    get: () => (state.token ? { value: state.token } : undefined),
    set: (_name: string, value: string) => {
      state.token = value;
    },
    delete: () => {
      state.token = "";
    },
  }),
}));
import { passwordHash } from "./local-test-crypto";
import {
  localTestEnabled,
  loginLocalTest,
  localTestProfile,
  localTestDatabase,
} from "./local-test";
beforeEach(() => {
  vi.stubEnv("NODE_ENV", "development");
  vi.stubEnv("BUYORNOT_LOCAL_TEST_LOGIN", "true");
  state.host = "localhost:3000";
  state.token = "";
  state.file = JSON.stringify({
    secret: "fixture-key",
    accounts: [
      {
        id: "fixture-member",
        nickname: "테스트",
        role: "USER",
        salt: "salt",
        hash: passwordHash("fixture-pass", "salt"),
      },
    ],
  });
});
afterEach(() => vi.unstubAllEnvs());
it("disables local login and cookies in production even when configured", async () => {
  vi.stubEnv("NODE_ENV", "production");
  expect(localTestEnabled()).toBe(false);
  expect(await loginLocalTest("fixture-member", "fixture-pass")).toBe(false);
  expect(await localTestProfile()).toBeNull();
});
it("signs in only with configured credentials and resolves the server-side role", async () => {
  expect(await loginLocalTest("fixture-member", "wrong")).toBe(false);
  expect(await localTestProfile()).toBeNull();
  expect(await loginLocalTest("fixture-member", "fixture-pass")).toBe(true);
  expect(await localTestProfile()).toMatchObject({
    id: "fixture-member",
    role: "USER",
  });
});
it("rejects logins and cookies on non-loopback hosts", async () => {
  await loginLocalTest("fixture-member", "fixture-pass");
  state.host = "example.com";
  expect(await localTestProfile()).toBeNull();
  expect(await loginLocalTest("fixture-member", "fixture-pass")).toBe(false);
});
it("requires explicit opt-in", async () => {
  vi.stubEnv("BUYORNOT_LOCAL_TEST_LOGIN", "");
  expect(await loginLocalTest("fixture-member", "fixture-pass")).toBe(false);
  expect(await localTestProfile()).toBeNull();
});

it("reloads example activity changed on disk instead of serving an empty cached account", () => {
  const empty = {
    profiles: [],
    creators: [],
    requests: [],
    evaluations: [],
    applications: [],
    hearts: {},
    follows: {},
  };
  state.activity = JSON.stringify(empty);
  expect(localTestDatabase().requests).toHaveLength(0);
  state.activity = JSON.stringify({
    ...empty,
    requests: [{ id: "new-example", authorId: "fixture-member" }],
  });
  state.mtime++;
  expect(localTestDatabase().requests.map((p) => p.id)).toEqual([
    "new-example",
  ]);
});
