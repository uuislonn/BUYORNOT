import { beforeEach, describe, it, expect, vi } from "vitest";
const mock = vi.hoisted(() => ({
  local: vi.fn(),
  getUser: vi.fn(),
  updateUser: vi.fn(),
  read: vi.fn(),
  write: vi.fn(),
}));
vi.mock("./local-test", () => ({ localTestProfile: mock.local }));
vi.mock("./server", () => ({
  authClient: async () => ({
    auth: { getUser: mock.getUser, updateUser: mock.updateUser },
  }),
}));
vi.mock("node:fs", () => ({
  existsSync: () => true,
  readFileSync: mock.read,
  writeFileSync: mock.write,
}));
import { getBodyProfile, saveBodyProfile } from "./body-profile";
import {
  cleanBodyProfile,
  disclosedBodyProfile,
} from "../../app/(creator)/_lib/body-profile";
beforeEach(() => {
  vi.resetAllMocks();
  mock.local.mockResolvedValue(null);
  mock.getUser.mockResolvedValue({
    data: {
      user: {
        id: "verified-owner",
        user_metadata: { body_profile: { height_cm: 160, role: "ADMIN" } },
      },
    },
    error: null,
  });
  mock.updateUser.mockResolvedValue({ error: null });
});
describe("private body profile", () => {
  it("requires verified authentication before reading or saving personal data", async () => {
    mock.getUser.mockResolvedValue({ data: { user: null }, error: null });
    expect((await getBodyProfile()).ok).toBe(false);
    expect((await saveBodyProfile({ age: 25 })).ok).toBe(false);
    expect(mock.updateUser).not.toHaveBeenCalled();
  });
  it("reads only the current user's whitelisted body fields", async () => {
    expect(await getBodyProfile()).toMatchObject({
      ok: true,
      profile: { height_cm: 160 },
    });
  });
  it("rejects invalid values before a write", async () => {
    expect((await saveBodyProfile({ age: 10 })).ok).toBe(false);
    expect((await saveBodyProfile({ height_cm: 160.5 })).ok).toBe(false);
    expect(mock.updateUser).not.toHaveBeenCalled();
  });
  it("saves only private body metadata without modifying role or public posts", async () => {
    expect(
      (
        await saveBodyProfile({
          age: 25,
          body_type: "  어깨가 넓은 편  ",
          author_id: "other",
          role: "ADMIN",
        })
      ).ok,
    ).toBe(true);
    expect(mock.updateUser).toHaveBeenCalledWith({
      data: { body_profile: { age: 25, body_type: "어깨가 넓은 편" } },
    });
  });
  it("keeps local test profile data in a separate private file", async () => {
    mock.local.mockResolvedValue({ id: "fixture-owner" });
    mock.read.mockReturnValue('{"height_cm":160}');
    expect((await getBodyProfile()).ok).toBe(true);
    await saveBodyProfile({ height_cm: 161 });
    expect(mock.write).toHaveBeenCalledWith(
      expect.stringContaining("body-fixture-owner.json"),
      '{"height_cm":161}',
      { mode: 0o600 },
    );
    expect(mock.updateUser).not.toHaveBeenCalled();
  });
  it("does not report success when persistence fails", async () => {
    mock.updateUser.mockResolvedValue({ error: { code: "offline" } });
    expect((await saveBodyProfile({ age: 25 })).ok).toBe(false);
  });
  it("allows clearing the saved profile without changing public posts", async () => {
    expect((await saveBodyProfile({})).ok).toBe(true);
    expect(mock.updateUser).toHaveBeenCalledWith({
      data: { body_profile: {} },
    });
  });
});
describe("explicit per-post disclosure", () => {
  it("includes only explicitly selected fields", () => {
    const values = {
      age: "25",
      height_cm: "160",
      weight_kg: "50",
      body_type: "어깨 고민",
    };
    expect(disclosedBodyProfile(values, [])).toEqual({});
    expect(disclosedBodyProfile(values, ["height_cm"])).toEqual({
      height_cm: 160,
    });
  });
  it("rejects selected empty values and ignores extra stored fields", () => {
    expect(() =>
      disclosedBodyProfile({ height_cm: "" }, ["height_cm"]),
    ).toThrow();
    expect(
      cleanBodyProfile({ height_cm: 160, private_note: "ignore" }),
    ).toEqual({ height_cm: 160 });
  });
});
