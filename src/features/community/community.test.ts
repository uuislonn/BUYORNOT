import { describe, expect, it } from "vitest";
import { CommunityStore } from "./store";
import { validateProductUrl } from "./product";
import { categories, type PostInput, type Product } from "./types";
const productFixture: Product = {
  url: "https://www.musinsa.com/products/1",
  domain: "www.musinsa.com",
  name: "테스트 상품",
  brand: "테스트 브랜드",
  image: "https://image.msscdn.net/test-product.jpg",
  price: 59000,
  currency: "KRW",
};
const input: PostInput = {
  productUrl: "https://www.musinsa.com/products/1",
  concern: "고민 중이에요",
  category: "의류",
  visibility: "PUBLIC",
  bodyProfile: { height_cm: "165" },
};
describe("상품 URL 보안", () => {
  it.each([
    "http://www.musinsa.com/p",
    "https://localhost/p",
    "https://127.0.0.1",
    "https://2130706433",
    "https://10.0.0.1",
    "https://169.254.169.254",
    "https://[::1]",
    "https://[::ffff:127.0.0.1]",
    "https://www.musinsa.com.evil.com",
    "https://www.musinsa.com@127.0.0.1",
    "https://u:p@www.musinsa.com",
    "https://www.musinsa.com:8443",
    "file:///etc/passwd",
    "javascript:alert(1)",
  ])("위험한 URL 차단: %s", (url) =>
    expect(() => validateProductUrl(url)).toThrow(),
  );
  it("허용된 상품 HTTPS URL만 수락", () =>
    expect(validateProductUrl(input.productUrl).hostname).toBe(
      "www.musinsa.com",
    ));
});
describe("Mock 권한과 데이터 흐름", () => {
  it("잡화는 가방 8개·주얼리 4개·목도리 4개로 구성된다", () => {
    const posts = new CommunityStore()
      .list(null)
      .filter((p) => p.category === "잡화");
    const jewelry = posts.filter((p) =>
      /목걸이|귀걸이|팔찌|ring/i.test(p.product.name),
    );
    const scarves = posts.filter((p) =>
      /머플러|목도리|scarf/i.test(p.product.name),
    );
    expect(posts).toHaveLength(16);
    expect(jewelry).toHaveLength(4);
    expect(scarves).toHaveLength(4);
    expect(
      posts.filter((p) => !jewelry.includes(p) && !scarves.includes(p)),
    ).toHaveLength(8);
    expect(
      [...jewelry, ...scarves].every((p) => !p.concern.includes("가방")),
    ).toBe(true);
  });
  it("예시 카드 80개는 고유 ID와 다양한 고민·투표 수를 가진다", () => {
    const posts = new CommunityStore().list(null);
    expect(posts).toHaveLength(80);
    expect(new Set(posts.map((p) => p.id)).size).toBe(80);
    expect(new Set(posts.map((p) => p.nickname)).size).toBe(80);
    expect(posts.every((p) => p.nickname.trim().length > 0)).toBe(true);
    expect(new Set(posts.map((p) => p.product.url)).size).toBe(80);
    expect(new Set(posts.map((p) => p.product.name)).size).toBe(80);
    expect(new Set(posts.map((p) => p.product.image)).size).toBe(80);
    for (const { product } of posts) {
      const productUrl = validateProductUrl(product.url);
      const imageUrl = new URL(product.image);
      const productId = productUrl.pathname.split("/").at(-1)!;
      expect(imageUrl.hostname).toBe("image.msscdn.net");
      expect(imageUrl.protocol).toBe("https:");
      expect(imageUrl.pathname).toContain(`/${productId}/`);
      expect(imageUrl.pathname).not.toContain("..");
    }
    expect(new Set(posts.map((p) => p.concern)).size).toBeGreaterThan(6);
    expect(new Set(posts.map((p) => p.buy)).size).toBeGreaterThan(6);
    expect(posts.every((p) => p.buy >= 0 && p.not >= 0)).toBe(true);
    expect(posts.every((p) => p.product.image && p.product.url)).toBe(true);
  });
  it.each(categories.filter((category) => category !== "전체"))(
    "%s 카테고리에는 서로 다른 상품이 16개 있다",
    (category) => {
      const posts = new CommunityStore()
        .list(null)
        .filter((post) => post.category === category);
      expect(posts).toHaveLength(16);
      expect(new Set(posts.map((post) => post.product.url)).size).toBe(16);
      expect(
        posts.every(
          (post) => post.concern.length > 0 && post.concern.length <= 300,
        ),
      ).toBe(true);
    },
  );
  it("비회원 조회 허용, 작성/투표/삭제 차단", () => {
    const s = new CommunityStore();
    expect(s.list(null).length).toBe(80);
    expect(() => s.save(input, null)).toThrow("로그인");
    expect(() => s.vote("sample-0", "BUY", null)).toThrow("로그인");
    expect(() => s.remove("sample-0", null)).toThrow("로그인");
  });
  it("투표 생성 → 취소 → 변경, 중복 없이 집계", () => {
    const s = new CommunityStore();
    const u = s.login().viewer;
    expect(s.vote("sample-0", "BUY", u)).toMatchObject({
      buy: 87,
      not: 14,
      myVote: "BUY",
    });
    expect(s.vote("sample-0", "BUY", u)).toMatchObject({
      buy: 86,
      not: 14,
      myVote: null,
    });
    s.vote("sample-0", "BUY", u);
    expect(s.vote("sample-0", "NOT", u)).toMatchObject({
      buy: 86,
      not: 15,
      myVote: "NOT",
    });
    expect(s.votes.size).toBe(1);
  });
  it("수정/삭제는 본인만 허용, 삭제 후 조회 차단", () => {
    const s = new CommunityStore();
    const u = s.login().viewer;
    const other = s.login().viewer;
    const p = s.save(input, u, undefined, productFixture);
    expect(() => s.save(input, other, p.id)).toThrow("본인");
    expect(() => s.remove(p.id, other)).toThrow("본인");
    expect(s.save({ ...input, concern: "수정" }, u, p.id).concern).toBe("수정");
    s.remove(p.id, u);
    expect(() => s.detail(p.id, u)).toThrow("찾을 수");
  });
  it("전체 공개만 작성 가능하고 공개 신체 정보만 복사한다", () => {
    const s = new CommunityStore();
    const u = s.login().viewer;
    for (const visibility of ["FOLLOWERS", "LINK_ONLY"] as const) {
      expect(() =>
        s.save({ ...input, visibility }, u, undefined, productFixture),
      ).toThrow();
    }
    const source = {
      ...input,
      bodyProfile: {
        age: "25",
        personal_color: "여름 쿨",
        height_cm: "165",
        weight_kg: "55",
        body_type: "비공개 체형",
      },
    };
    const p = s.save(source, u, undefined, productFixture);
    source.bodyProfile.height_cm = "180";
    expect(s.detail(p.id, null).bodyProfile).toEqual({
      age: "25",
      personal_color: "여름 쿨",
      height_cm: "165",
      weight_kg: "55",
    });
    expect(p.visibility).toBe("PUBLIC");
  });
  it("기존 비공개 게시글은 계속 작성자만 조회할 수 있다", () => {
    const s = new CommunityStore();
    const u = s.login().viewer;
    const p = s.save(input, u, undefined, productFixture);
    for (const visibility of ["FOLLOWERS", "LINK_ONLY"] as const) {
      s.posts.set(p.id, { ...p, visibility });
      expect(() => s.detail(p.id, null)).toThrow();
      expect(() => s.detail(p.id, s.login().viewer)).toThrow();
      expect(s.detail(p.id, u).id).toBe(p.id);
    }
  });
  it("검증 우회와 301자 차단", () => {
    const s = new CommunityStore();
    const u = s.login().viewer;
    expect(() => s.save({ ...input, concern: "a".repeat(301) }, u)).toThrow();
    expect(() =>
      s.save({ ...input, category: "임의" as PostInput["category"] }, u),
    ).toThrow();
    expect(() =>
      s.save({ ...input, bodyProfile: { height_cm: "a".repeat(41) } }, u),
    ).toThrow();
  });
  it("위조/만료 세션 거부", () => {
    const s = new CommunityStore();
    expect(s.viewer("forged")).toBeNull();
    const session = s.login();
    expect(s.viewer(session.token)).toEqual(session.viewer);
    s.sessions.get(session.token)!.expires = 0;
    expect(s.viewer(session.token)).toBeNull();
  });
  it("같은 상품의 고민 수정은 상품 정보를 보존하고 새 URL은 다시 검증", () => {
    const s = new CommunityStore();
    const u = s.login().viewer;
    const p = s.save(input, u, undefined, productFixture);
    const product = { ...p.product, name: "상품명", price: 59000 };
    s.posts.set(p.id, { ...p, product });
    expect(
      s.save({ ...input, concern: "수정한 고민" }, u, p.id).product,
    ).toEqual(product);
    expect(() =>
      s.save({ ...input, productUrl: "https://127.0.0.1" }, u, p.id),
    ).toThrow();
    const changed = s.save(
      { ...input, productUrl: "https://www.nike.com/product/new" },
      u,
      p.id,
      {
        ...productFixture,
        url: "https://www.nike.com/product/new",
        domain: "www.nike.com",
        name: "새 상품",
        price: 99000,
      },
    );
    expect(changed.product.domain).toBe("www.nike.com");
    expect(changed.product.name).toBe("새 상품");
    expect(changed.product.price).toBe(99000);
  });
  it("상품 정보 없이 저장하거나 다른 링크의 정보를 연결할 수 없다", () => {
    const s = new CommunityStore();
    const user = s.login().viewer;
    expect(() => s.save(input, user)).toThrow("먼저 불러와");
    expect(() =>
      s.save(input, user, undefined, {
        ...productFixture,
        url: "https://www.musinsa.com/products/2",
      }),
    ).toThrow("일치하지");
  });
});
