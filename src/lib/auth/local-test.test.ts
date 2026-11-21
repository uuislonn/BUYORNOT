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

it("keeps Soal's identity and ownership when discovery rooms are reordered and reloaded", async () => {
  const { createSeed } = await import("../../app/(creator)/_server/seed");
  const db = createSeed();
  const soal = db.creators.find((room) => room.id === "seoa")!;
  db.creators.unshift({
    ...soal,
    id: "another-room",
    ownerId: "another-owner",
  });
  const cfg = JSON.parse(state.file);
  cfg.accounts.push({
    id: "fixture-creator",
    nickname: "크리에이터 테스트",
    role: "CREATOR",
    salt: "salt",
    hash: passwordHash("fixture-pass", "salt"),
  });
  state.file = JSON.stringify(cfg);
  state.activity = JSON.stringify(db);
  state.mtime++;
  for (let pass = 0; pass < 2; pass++) {
    const loaded = localTestDatabase();
    expect(
      loaded.creators.find((room) => room.id === "another-room")?.ownerId,
    ).toBe("another-owner");
    expect(loaded.creators.find((room) => room.id === "seoa")?.ownerId).toBe(
      "fixture-creator",
    );
    expect(
      loaded.profiles.find((profile) => profile.id === "fixture-creator"),
    ).toMatchObject({
      nickname: "소올soal",
      avatar: "/creators/soal-avatar.jpg",
    });
    state.activity = JSON.stringify(loaded);
    state.mtime++;
  }
  await loginLocalTest("fixture-creator", "fixture-pass");
  expect(await localTestProfile()).toMatchObject({
    nickname: "소올soal",
    avatar: "/creators/soal-avatar.jpg",
  });
});
