import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { FileCommunityPersistence } from "../../../features/community/persistence";
import { store } from "../../../features/community/store";
import type { Profile } from "../../(creator)/_lib/types";
import type { AccountActivity } from "./activity-types";

// Called only after the local account has been verified on the server.
export function localAccountActivity(
  profile: Profile,
): AccountActivity | undefined {
  if (profile.role !== "USER") return undefined;
  const path = join(
    process.cwd(),
    ".local-test-accounts",
    `examples-${encodeURIComponent(profile.id)}.json`,
  );
  if (existsSync(path)) return JSON.parse(readFileSync(path, "utf8"));
  const posts = store
    .list(profile)
    .filter((post) => post.authorId !== profile.id)
    .slice(0, 40);
  for (const [i, post] of posts.slice(0, 10).entries()) {
    const id = `member-story-${i}`;
    if (!store.posts.has(id))
      store.posts.set(id, {
        ...post,
        id,
        authorId: profile.id,
        nickname: profile.nickname,
        concern: [
          "평소 입는 스타일에 잘 맞을까요? 오래 활용할 수 있을지 고민이에요.",
          "비슷한 제품과 비교 중인데 어떤 선택이 좋을까요?",
          "가격과 활용도를 생각했을 때 구매해도 괜찮을까요?",
        ][i % 3],
        createdAt: new Date(Date.now() - i * 86400000).toISOString(),
        updatedAt: new Date().toISOString(),
        buy: 0,
        not: 0,
        deletedAt: null,
      });
  }
  for (const [i, post] of posts.slice(0, 12).entries()) {
    if (!post.myVote) store.vote(post.id, i % 3 === 0 ? "NOT" : "BUY", profile);
  }
  new FileCommunityPersistence(
    join(process.cwd(), ".data", "community.json"),
  ).write({
    version: 1,
    posts: [...store.posts.values()],
    votes: [...store.votes],
  });
  const texts = [
    "평소 스타일에도 잘 어울릴 것 같아요!",
    "비슷한 제품 써봤는데 활용도가 좋았어요.",
    "가격 대비 오래 쓸 수 있을 것 같아요.",
    "다른 컬러도 비교해 보면 좋겠어요.",
    "데일리로 쓰기에는 이쪽이 더 좋아 보여요.",
    "소재와 사이즈를 확인하고 고르면 좋겠어요.",
    "저도 고민하던 제품인데 후기가 궁금해요.",
    "가지고 있는 아이템과 조합하기 좋겠어요.",
    "할인할 때 구매하면 더 만족스러울 것 같아요.",
    "포인트 아이템으로 추천해요!",
  ];
  const result: AccountActivity = {
    savedPosts: posts.slice(12, 22),
    savedProducts: posts.slice(22, 32),
    comments: posts.slice(0, 10).map((post, i) => ({
      id: `comment-${i}`,
      post,
      text: texts[i],
      date: new Date(Date.now() - i * 3600000).toISOString(),
    })),
    notifications: posts.slice(0, 10).map((post, i) => ({
      id: `notice-${i}`,
      title: [
        "참여한 투표에 새로운 선택이 모였어요",
        "저장한 글에 새 소식이 있어요",
        "관심 있는 상품을 다시 살펴보세요",
      ][i % 3],
      text: post.product.name,
      href: `/community?post=${encodeURIComponent(post.id)}`,
      date: new Date(Date.now() - i * 7200000).toISOString(),
    })),
  };
  writeFileSync(path, JSON.stringify(result), { mode: 0o600 });
  return result;
}
