import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { store } from "./store";
import {
  getProductInfo,
  deletePost,
  loadCommunity,
  loginPreview,
  logoutDemo,
  savePost,
  votePost,
} from "./actions";
import { loadProduct } from "./product-loader";

const identity = vi.hoisted(() => ({
  current: null as { id: string; nickname: string } | null,
}));
vi.mock("./session", () => ({ communityViewer: async () => identity.current }));
vi.mock("../../lib/auth/local-test", () => ({
  loginLocalTest: vi.fn(async (id: string, password: string) => {
    if (
      process.env.NODE_ENV === "production" ||
      id !== "member-id" ||
      password !== "member-password"
    )
      return false;
    identity.current = { id, nickname: "지혜" };
    return true;
  }),
  localTestProfile: async () => identity.current,
  logoutLocalTest: async () => {
    identity.current = null;
  },
}));
vi.mock("./product-loader", () => ({ loadProduct: vi.fn() }));

const jar = vi.hoisted(() => new Map<string, string>());
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      jar.has(name) ? { value: jar.get(name) } : undefined,
    set: (name: string, value: string) => jar.set(name, value),
    delete: (name: string) => jar.delete(name),
  }),
}));
beforeEach(() => {
  jar.clear();
  identity.current = null;
  vi.mocked(loadProduct).mockReset();
});

describe("실제 상품 정보 연결", () => {
  const product = {
    url: "https://www.musinsa.com/products/7096804",
    domain: "www.musinsa.com",
    name: "95 바시티 후드 가디건-네이비",
    brand: "비터셀즈",
    image: "https://image.msscdn.net/product.jpg",
    price: 101370,
    currency: "KRW" as const,
  };
  it("미리보기에서 읽은 실제 정보를 게시글 저장과 재조회에도 유지한다", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.mocked(loadProduct).mockResolvedValue(product);
    expect(await getProductInfo(product.url)).toEqual({
      ok: true,
      data: product,
    });
    await loginPreview("member-id", "member-password");
    const result = await savePost({
      productUrl: product.url,
      concern: "데일리로 입을까요?",
      category: "의류",
      visibility: "PUBLIC",
      bodyProfile: {},
    });
    expect(result.ok && result.data.product).toEqual(product);
    if (result.ok) {
      const user = identity.current!;
      expect(store.detail(result.data.id, user).product).toEqual(product);
      store.posts.delete(result.data.id);
    }
  });
  it("모든 사용자 계정을 구분하고 각 작성자만 자기 글을 수정·삭제한다", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.mocked(loadProduct).mockResolvedValue(product);
    const a = store.login({ id: "user-a", nickname: "첫 사용자" });
    const b = store.login({ id: "user-b", nickname: "둘째 사용자" });
    const input = {
      productUrl: product.url,
      concern: "내 고민",
      category: "의류" as const,
      visibility: "PUBLIC" as const,
      bodyProfile: {},
    };
    const created: string[] = [];
    try {
      identity.current = a.viewer;
      const first = await savePost({
        ...input,
        authorId: b.viewer.id,
      } as typeof input);
      expect(first.ok).toBe(true);
      if (!first.ok) throw new Error(first.error);
      created.push(first.data.id);
      expect(first.data.authorId).toBe(a.viewer.id);
      identity.current = b.viewer;
      const feed = await loadCommunity();
      expect(feed.ok && feed.data.viewer?.id).toBe(b.viewer.id);
      expect(
        (
          await savePost(
            { ...input, concern: "다른 사람 글 수정" },
            first.data.id,
          )
        ).ok,
      ).toBe(false);
      expect((await deletePost(first.data.id)).ok).toBe(false);
      const second = await savePost(input);
      expect(second.ok).toBe(true);
      if (!second.ok) throw new Error(second.error);
      created.push(second.data.id);
      expect(second.data.authorId).toBe(b.viewer.id);
      expect(
        (
          await savePost(
            { ...input, concern: "둘째 사용자 수정" },
            second.data.id,
          )
        ).ok,
      ).toBe(true);
      identity.current = a.viewer;
      expect((await deletePost(second.data.id)).ok).toBe(false);
      expect(
        (await savePost({ ...input, concern: "첫 사용자 수정" }, first.data.id))
          .ok,
      ).toBe(true);
      identity.current = null;
      jar.clear();
      expect((await deletePost(first.data.id)).ok).toBe(false);
      identity.current = a.viewer;
      expect((await deletePost(first.data.id)).ok).toBe(true);
      identity.current = b.viewer;
      expect((await deletePost(second.data.id)).ok).toBe(true);
    } finally {
      for (const id of created) store.posts.delete(id);
    }
  });
  it("비회원의 저장은 외부 상품 조회 전에 차단한다", async () => {
    expect(
      (
        await savePost({
          productUrl: product.url,
          concern: "고민",
          category: "의류",
          visibility: "PUBLIC",
          bodyProfile: {},
        })
      ).ok,
    ).toBe(false);
    expect(loadProduct).not.toHaveBeenCalled();
  });
});
afterEach(() => {
  vi.unstubAllEnvs();
  store.sessions.clear();
});

describe("개발용 임시 로그인", () => {
  it("이전 데모 쿠키는 로그인으로 인정하지 않는다", async () => {
    vi.stubEnv("NODE_ENV", "development");
    jar.set("buyornot-demo", store.login().token);
    const result = await loadCommunity();
    expect(result.ok && result.data.viewer).toBeNull();
    expect((await votePost("sample-0", "BUY")).ok).toBe(false);
  });
  it("이전 1111 로그인과 남은 미리보기 쿠키를 거부한다", async () => {
    vi.stubEnv("NODE_ENV", "development");
    expect((await loginPreview("1111", "1111")).ok).toBe(false);
    expect((await loginPreview("member@example.com", "1111")).ok).toBe(false);
    jar.set("buyornot-preview", store.login().token);
    const result = await loadCommunity();
    expect(result.ok && result.data.viewer).toBeNull();
    expect((await votePost("sample-0", "BUY")).ok).toBe(false);
  });
  it("지정한 계정으로 로그인하고 투표한 뒤 로그아웃한다", async () => {
    vi.stubEnv("NODE_ENV", "development");
    expect((await loginPreview("member-id", "wrong")).ok).toBe(false);
    const login = await loginPreview("member-id", "member-password");
    expect(login.ok).toBe(true);
    expect((await votePost("sample-0", "BUY")).ok).toBe(true);
    await logoutDemo();
    expect((await votePost("sample-0", "BUY")).ok).toBe(false);
  });
  it("프로덕션에서는 고정 자격 증명과 남은 세션도 차단", async () => {
    vi.stubEnv("NODE_ENV", "production");
    jar.set("buyornot-preview", store.login().token);
    expect((await loginPreview("1111", "1111")).ok).toBe(false);
    const result = await loadCommunity();
    expect(result.ok && result.data.viewer).toBeNull();
    expect((await votePost("sample-0", "BUY")).ok).toBe(false);
  });
});
