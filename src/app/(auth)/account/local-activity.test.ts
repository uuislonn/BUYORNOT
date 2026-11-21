import { expect, it, vi } from "vitest";
vi.mock("node:fs", () => ({
  existsSync: () => false,
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
}));
vi.mock("../../../features/community/persistence", () => ({
  FileCommunityPersistence: class {
    write = vi.fn();
  },
}));
vi.mock("../../../features/community/store", async () => {
  const { seedPosts } = await import("../../../features/community/seed");
  return {
    store: {
      posts: new Map(seedPosts.map((post) => [post.id, structuredClone(post)])),
      votes: new Map(),
      list: () => seedPosts.map((post) => ({ ...post, myVote: null })),
      vote: vi.fn(),
      snapshot: vi.fn(),
    },
  };
});
import { store } from "../../../features/community/store";
import { localAccountActivity } from "./local-activity";
import type { Profile } from "../../(creator)/_lib/types";
it("builds account activity without copying teammate products into duplicate public posts", () => {
  const before = structuredClone([...store.posts.entries()]);
  const result = localAccountActivity({
    id: "account-example-reader",
    nickname: "지혜",
    role: "USER",
  } as Profile);
  expect(result?.savedProducts).toHaveLength(10);
  expect(result?.savedPosts).toHaveLength(10);
  expect([...store.posts.entries()]).toEqual(before);
  expect(
    [...store.posts.keys()].some((id) => id.startsWith("member-story-")),
  ).toBe(false);
});
