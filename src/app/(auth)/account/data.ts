import type { CurationRequest, Status } from "../../(creator)/_lib/types";
import { effectiveStatus } from "../../(creator)/_lib/policy";
export type PostFilter = "ALL" | "ANSWERED" | Status;
export function accountPosts(
  posts: CurationRequest[],
  filter: PostFilter,
  search: string,
  now: number,
) {
  const term = search.trim().toLocaleLowerCase();
  return posts.filter(
    (p) =>
      (filter === "ALL" ||
        (filter === "ANSWERED"
          ? ["BUY", "NOT"].includes(effectiveStatus(p, now))
          : effectiveStatus(p, now) === filter)) &&
      (!term ||
        [p.product.name, p.product.brand, p.concern].some((value) =>
          value.toLocaleLowerCase().includes(term),
        )),
  );
}
export function postCounts(posts: CurationRequest[], now: number) {
  const counts = {
    ALL: posts.length,
    ANSWERED: 0,
    ING: 0,
    BUY: 0,
    NOT: 0,
    EXPIRED: 0,
  };
  for (const post of posts) {
    const status = effectiveStatus(post, now);
    counts[status]++;
    if (status === "BUY" || status === "NOT") counts.ANSWERED++;
  }
  return counts;
}

export type AccountCreator = {
  id: string;
  title: string;
  nickname: string;
  handle: string;
  bio: string;
  avatar: string;
  fictional: boolean;
};

export function mergeOwnRoomPosts(
  existing: CurationRequest[],
  incoming: CurationRequest[],
  creatorId: string,
  authorId: string,
) {
  return [
    ...existing.filter((post) => post.creatorId !== creatorId),
    ...incoming.filter(
      (post) => post.creatorId === creatorId && post.authorId === authorId,
    ),
  ].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}
