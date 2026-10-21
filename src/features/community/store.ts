import { randomUUID } from "node:crypto";
import { seedPosts } from "./seed";
import { mockProduct } from "./product";
import {
  categories,
  type Choice,
  type FeedPost,
  type Post,
  type PostInput,
  type Viewer,
} from "./types";
// TODO: connect to lib/supabase. Process-local Dummy Data resets on restart; not multi-instance storage.
export class CommunityStore {
  posts = new Map<string, Post>(
    seedPosts.map((p) => [p.id, structuredClone(p)]),
  );
  votes = new Map<string, Choice>();
  sessions = new Map<string, { viewer: Viewer; expires: number }>();
  viewer(token?: string): Viewer | null {
    const session = token ? this.sessions.get(token) : null;
    return session && session.expires > Date.now() ? session.viewer : null;
  }
  login() {
    const token = randomUUID();
    const viewer = { id: randomUUID(), nickname: "나의 살말" };
    this.sessions.set(token, { viewer, expires: Date.now() + 86400000 });
    return { token, viewer };
  }
  require(viewer: Viewer | null): Viewer {
    if (!viewer) throw new Error("로그인이 필요한 서비스입니다.");
    return viewer;
  }
  canRead(post: Post, viewer: Viewer | null) {
    return (
      !post.deletedAt &&
      (post.visibility === "PUBLIC" || post.authorId === viewer?.id)
    );
  }
  detail(id: string, viewer: Viewer | null): FeedPost {
    const p = this.posts.get(id);
    if (!p || !this.canRead(p, viewer))
      throw new Error("게시글을 찾을 수 없습니다.");
    return {
      ...structuredClone(p),
      myVote: viewer ? (this.votes.get(`${id}:${viewer.id}`) ?? null) : null,
    };
  }
  list(viewer: Viewer | null): FeedPost[] {
    return [...this.posts.values()]
      .filter((p) => this.canRead(p, viewer))
      .map((p) => this.detail(p.id, viewer));
  }
  save(input: PostInput, viewer: Viewer | null, id?: string): FeedPost {
    const user = this.require(viewer);
    const previous = id ? this.detail(id, viewer) : null;
    if (previous && previous.authorId !== user.id)
      throw new Error("본인 게시글만 수정할 수 있습니다.");
    if (
      !categories.slice(1).includes(input.category) ||
      !["PUBLIC", "FOLLOWERS", "LINK_ONLY"].includes(input.visibility) ||
      typeof input.concern !== "string" ||
      !input.concern.trim() ||
      input.concern.length > 300
    )
      throw new Error("카테고리와 1~300자의 고민을 입력해 주세요.");
    const bodyProfile: PostInput["bodyProfile"] = {};
    for (const key of [
      "age",
      "height_cm",
      "weight_kg",
      "body_type",
      "personal_color",
    ] as const) {
      const value = input.bodyProfile?.[key];
      if (value !== undefined) {
        if (typeof value !== "string" || value.length > 40)
          throw new Error("신체 정보 입력을 확인해 주세요.");
        bodyProfile[key] = value;
      }
    }
    const post: Post = {
      id: previous?.id ?? randomUUID(),
      authorId: user.id,
      nickname: user.nickname,
      product: mockProduct(input.productUrl),
      concern: input.concern.trim(),
      category: input.category,
      visibility: input.visibility,
      bodyProfile,
      createdAt: previous?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
      buy: previous?.buy ?? 0,
      not: previous?.not ?? 0,
    };
    this.posts.set(post.id, post);
    return this.detail(post.id, viewer);
  }
  remove(id: string, viewer: Viewer | null) {
    const user = this.require(viewer);
    const p = this.detail(id, viewer);
    if (p.authorId !== user.id)
      throw new Error("본인 게시글만 삭제할 수 있습니다.");
    this.posts.set(id, { ...p, deletedAt: new Date().toISOString() });
  }
  vote(id: string, choice: Choice, viewer: Viewer | null): FeedPost {
    const user = this.require(viewer);
    if (!["BUY", "NOT"].includes(choice)) throw new Error("잘못된 투표입니다.");
    const p = this.detail(id, viewer);
    const key = `${id}:${user.id}`;
    const old = this.votes.get(key);
    if (old === "BUY") p.buy--;
    if (old === "NOT") p.not--;
    if (old === choice) this.votes.delete(key);
    else {
      this.votes.set(key, choice);
      if (choice === "BUY") p.buy++;
      else p.not++;
    }
    this.posts.set(id, p);
    return this.detail(id, viewer);
  }
}
const globalStore = globalThis as typeof globalThis & {
  communityStore?: CommunityStore;
};
export const store = (globalStore.communityStore ??= new CommunityStore());
