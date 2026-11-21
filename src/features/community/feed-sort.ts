import type { FeedPost } from "./types";

export const sortOptions = [
  { value: "latest", label: "최신순" },
  { value: "views", label: "조회수순" },
  { value: "votes", label: "투표순" },
] as const;
export type FeedSort = (typeof sortOptions)[number]["value"];

export function parseFeedSort(value: string | null): FeedSort {
  if (value === "popular") return "votes";
  return value === "views" || value === "votes" ? value : "latest";
}

export function compareFeedPosts(
  a: FeedPost,
  b: FeedPost,
  sort: FeedSort,
): number {
  const score =
    sort === "views"
      ? (b.views ?? 0) - (a.views ?? 0)
      : sort === "votes"
        ? b.buy + b.not - (a.buy + a.not)
        : 0;
  return score || b.createdAt.localeCompare(a.createdAt);
}
