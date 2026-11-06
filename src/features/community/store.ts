import { randomUUID } from "node:crypto";
import { join } from "node:path";
import {
  FileCommunityPersistence,
  type CommunityPersistence,
} from "./persistence";
import { seedPosts } from "./seed";
import { validateProductUrl } from "./product";
import {
  categories,
  type Choice,
  type FeedPost,
  type Post,
  type PostInput,
  type Product,
  type Viewer,
} from "./types";
// TODO: connect to lib/supabase before multi-instance/cloud deployment.
export class CommunityStore {
  posts = new Map<string, Post>(
    seedPosts.map((p) => [p.id, structuredClone(p)]),
  );
  votes = new Map<string, Choice>();
  sessions = new Map<string, { viewer: Viewer; expires: number }>();
  private persistence?: CommunityPersistence;
  constructor(persistence?: CommunityPersistence) {
    if (persistence) this.attachPersistence(persistence);
  }
  attachPersistence(persistence: CommunityPersistence) {
    const snapshot = persistence.read();
    if (snapshot) {
      this.posts = new Map(snapshot.posts.map((post) => [post.id, post]));
      this.votes = new Map(snapshot.votes);
    } else {
      persistence.write({
        version: 1,
        posts: [...this.posts.values()],
        votes: [...this.votes],
      });
    }
    // Upgrade only the obsolete six-placeholder fixture set; keep authored posts and votes.
    const legacy = [...this.posts.values()].some(
      (post) =>
        /^sample-[0-5]$/.test(post.id) &&
        post.product.url ===
          `https://www.musinsa.com/products/${100000 + Number(post.id.slice(7))}`,
    );
    if (legacy) {
      for (const seed of seedPosts) {
        const previous = this.posts.get(seed.id);
        if (
          !previous ||
          /^https:\/\/www\.musinsa\.com\/products\/10000[0-5]$/.test(
            previous.product.url,
          )
        ) {
          const post = structuredClone(seed);
          for (const [key, choice] of this.votes)
            if (key.startsWith(`${post.id}:`)) {
              if (choice === "BUY") post.buy++;
              else post.not++;
            }
          this.posts.set(post.id, post);
        }
      }
      persistence.write({
        version: 1,
        posts: [...this.posts.values()],
        votes: [...this.votes],
      });
    }
    this.persistence = persistence;
  }
  private change(mutate: () => void) {
    const previous = this.persistence
      ? structuredClone({
          posts: this.posts,
          votes: this.votes,
          sessions: this.sessions,
        })
      : null;
    try {
      mutate();
      this.persistence?.write({
        version: 1,
        posts: [...this.posts.values()],
        votes: [...this.votes],
      });
    } catch (error) {
      if (previous) {
        this.posts = previous.posts;
        this.votes = previous.votes;
        this.sessions = previous.sessions;
      }
      throw error;
    }
  }
  viewer(token?: string): Viewer | null {
    const session = token ? this.sessions.get(token) : null;
    return session && session.expires > Date.now() ? session.viewer : null;
  }
  login(account?: Viewer) {
    const token = randomUUID();
    const viewer = account
      ? { ...account }
      : { id: randomUUID(), nickname: "나의 살말" };
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
  save(
    input: PostInput,
    viewer: Viewer | null,
    id?: string,
    resolvedProduct?: Product,
  ): FeedPost {
    const user = this.require(viewer);
    const previous = id ? this.detail(id, viewer) : null;
    if (previous && previous.authorId !== user.id)
      throw new Error("본인 게시글만 수정할 수 있습니다.");
    if (
      !categories.slice(1).includes(input.category) ||
      input.visibility !== "PUBLIC" ||
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
      "personal_color",
    ] as const) {
      const value = input.bodyProfile?.[key];
      if (value !== undefined) {
        if (typeof value !== "string" || value.length > 40)
          throw new Error("신체 정보 입력을 확인해 주세요.");
        bodyProfile[key] = value;
      }
    }
    const url = validateProductUrl(input.productUrl);
    const product =
      resolvedProduct ??
      (previous?.product.url === url.href ? previous.product : null);
    if (!product || !product.name || !product.image || product.price <= 0)
      throw new Error("상품 정보를 먼저 불러와 주세요.");
    if (product.url !== url.href || product.domain !== url.hostname)
      throw new Error("상품 링크와 불러온 정보가 일치하지 않습니다.");
    const post: Post = {
      id: previous?.id ?? randomUUID(),
      authorId: user.id,
      nickname: user.nickname,
      product: structuredClone(product),
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
    this.change(() => {
      this.posts.set(post.id, post);
    });
    return this.detail(post.id, viewer);
  }
  remove(id: string, viewer: Viewer | null) {
    const user = this.require(viewer);
    const p = this.detail(id, viewer);
    if (p.authorId !== user.id)
      throw new Error("본인 게시글만 삭제할 수 있습니다.");
    this.change(() => {
      this.posts.set(id, { ...p, deletedAt: new Date().toISOString() });
    });
  }
  vote(id: string, choice: Choice, viewer: Viewer | null): FeedPost {
    const user = this.require(viewer);
    if (!["BUY", "NOT"].includes(choice)) throw new Error("잘못된 투표입니다.");
    const p = this.detail(id, viewer);
    const key = `${id}:${user.id}`;
    const old = this.votes.get(key);
    this.change(() => {
      if (old === "BUY") p.buy--;
      if (old === "NOT") p.not--;
      if (old === choice) this.votes.delete(key);
      else {
        this.votes.set(key, choice);
        if (choice === "BUY") p.buy++;
        else p.not++;
      }
      this.posts.set(id, p);
    });
    return this.detail(id, viewer);
  }
}
const globalStore = globalThis as typeof globalThis & {
  communityStore?: CommunityStore;
};
// Preserve the running preview's posts and sessions when this module hot-reloads.
const previousStore = globalStore.communityStore;
const currentStore = new CommunityStore();
if (previousStore) {
  currentStore.posts = previousStore.posts;
  currentStore.votes = previousStore.votes;
  currentStore.sessions = previousStore.sessions;
}
if (process.env.NODE_ENV === "development")
  currentStore.attachPersistence(
    new FileCommunityPersistence(
      join(process.cwd(), ".data", "community.json"),
    ),
  );
export const store = (globalStore.communityStore = currentStore);
