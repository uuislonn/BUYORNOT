import { expect, it } from "vitest";
import { compareFeedPosts, parseFeedSort } from "./feed-sort";
import { seedPosts } from "./seed";
import type { FeedPost } from "./types";

const posts: FeedPost[] = [
  {
    ...seedPosts[0],
    id: "new",
    createdAt: "2026-11-14",
    buy: 1,
    not: 0,
    myVote: null,
  },
  {
    ...seedPosts[0],
    id: "views",
    createdAt: "2026-11-12",
    views: 20,
    buy: 0,
    not: 0,
    myVote: null,
  },
  {
    ...seedPosts[0],
    id: "votes",
    createdAt: "2026-11-13",
    views: 2,
    buy: 2,
    not: 10,
    myVote: null,
  },
];
it("최신순·조회수순·BUY+NOT 투표순으로 정렬한다", () => {
  expect(
    [...posts].sort((a, b) => compareFeedPosts(a, b, "latest"))[0].id,
  ).toBe("new");
  expect([...posts].sort((a, b) => compareFeedPosts(a, b, "views"))[0].id).toBe(
    "views",
  );
  expect([...posts].sort((a, b) => compareFeedPosts(a, b, "votes"))[0].id).toBe(
    "votes",
  );
});
it("동점은 최신순으로, 기존 조회수 없는 글은 0으로 처리한다", () => {
  expect(
    compareFeedPosts(posts[0], { ...posts[2], views: 0 }, "views"),
  ).toBeLessThan(0);
  expect(
    compareFeedPosts(posts[0], { ...posts[2], buy: 0, not: 1 }, "votes"),
  ).toBeLessThan(0);
  expect(parseFeedSort("popular")).toBe("votes");
  expect(parseFeedSort("unknown")).toBe("latest");
});
