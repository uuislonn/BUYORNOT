import { describe, it, expect } from "vitest";
import { createSeed } from "../../(creator)/_server/seed";
import { accountPosts, postCounts, mergeOwnRoomPosts } from "./data";
const now = Date.parse("2026-11-06T00:00:00Z");
const posts = createSeed(now).requests;
describe("my page post data", () => {
  it("counts expired requests separately from waiting replies", () => {
    const counts = postCounts(posts, now);
    expect(counts.ALL).toBe(48);
    expect(counts.ING).toBe(44);
    expect(counts.EXPIRED).toBe(1);
    expect(counts.ANSWERED).toBe(3);
  });
  it("includes both BUY and NOT in answered requests", () => {
    const result = accountPosts(posts, "ANSWERED", "", now);
    expect(new Set(result.map((p) => p.status))).toEqual(
      new Set(["BUY", "NOT"]),
    );
    expect(result).toHaveLength(3);
  });
  it("combines status and a case insensitive product search", () => {
    const target = posts[0];
    const result = accountPosts(
      posts,
      "ING",
      target.product.name.toLowerCase(),
      now,
    );
    expect(result.map((p) => p.id)).toContain(target.id);
    expect(accountPosts(posts, "NOT", target.product.name, now)).toHaveLength(
      0,
    );
  });
  it("searches concern text and treats whitespace as no search", () => {
    expect(accountPosts(posts, "ALL", "   ", now)).toHaveLength(48);
    expect(
      accountPosts(posts, "ALL", posts[0].concern, now).map((p) => p.id),
    ).toContain(posts[0].id);
  });
  it("handles empty actual accounts without adding sample counts", () => {
    expect(postCounts([], now)).toEqual({
      ALL: 0,
      ANSWERED: 0,
      ING: 0,
      BUY: 0,
      NOT: 0,
      EXPIRED: 0,
    });
    expect(accountPosts([], "ALL", "", now)).toHaveLength(0);
  });
});

describe("questions in multiple creator rooms", () => {
  it("keeps questions from other rooms after creating or editing one room", () => {
    const first = {
      ...posts[0],
      id: "own-a",
      authorId: "me",
      creatorId: "room-a",
    };
    const other = {
      ...posts[1],
      id: "own-b",
      authorId: "me",
      creatorId: "room-b",
    };
    const edited = { ...first, concern: "수정한 질문" };
    const unrelated = {
      ...posts[2],
      id: "not-mine",
      authorId: "other",
      creatorId: "room-a",
    };
    const merged = mergeOwnRoomPosts(
      [first, other],
      [edited, unrelated],
      "room-a",
      "me",
    );
    expect(merged).toHaveLength(2);
    expect(merged.find((post) => post.id === "own-a")?.concern).toBe(
      "수정한 질문",
    );
    expect(merged.find((post) => post.id === "own-b")).toEqual(other);
  });
});
