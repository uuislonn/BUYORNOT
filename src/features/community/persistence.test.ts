import { seedPosts } from "./seed";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  FileCommunityPersistence,
  type CommunityPersistence,
} from "./persistence";
import { CommunityStore } from "./store";
import type { PostInput, Product } from "./types";

const owner = { id: "preview-1111", nickname: "1111" };
const product: Product = {
  url: "https://www.musinsa.com/products/7421561",
  domain: "www.musinsa.com",
  name: "저장 검증 상품",
  brand: "브랜드",
  image: "https://image.msscdn.net/photo.jpg",
  price: 169100,
  currency: "KRW",
};
const input: PostInput = {
  productUrl: product.url,
  category: "의류",
  concern: "살까요?",
  visibility: "PUBLIC",
  bodyProfile: { age: "25" },
};
let directory: string;
let file: string;
it("상세 열기마다 조회수를 기록하고 재시작·수정 후에도 보존한다", () => {
  const store = new CommunityStore(new FileCommunityPersistence(file));
  const post = store.save(input, owner, undefined, product);
  expect(post.views).toBe(0);
  store.list(null);
  store.detail(post.id, null);
  expect(store.open(post.id, null).views).toBe(1);
  expect(store.open(post.id, null).views).toBe(2);
  const restarted = new CommunityStore(new FileCommunityPersistence(file));
  expect(restarted.detail(post.id, owner).views).toBe(2);
  expect(restarted.save(input, owner, post.id, product).views).toBe(2);
});
it("비공개 글을 열 수 없는 사용자의 조회수는 기록하지 않는다", () => {
  const store = new CommunityStore();
  const post = store.save(input, owner, undefined, product);
  store.posts.get(post.id)!.visibility = "LINK_ONLY";
  expect(() => store.open(post.id, null)).toThrow();
  expect(store.detail(post.id, owner).views).toBe(0);
});
beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), "buyornot-persistence-"));
  file = join(directory, "community.json");
});
afterEach(() => {
  rmSync(directory, { recursive: true, force: true });
});

describe("실제 파일 저장", () => {
  it("서버를 새로 만들어도 글·투표가 남고 1111 계정으로 수정·삭제한다", () => {
    const initial = new CommunityStore(new FileCommunityPersistence(file));
    const post = initial.save(
      input,
      initial.login(owner).viewer,
      undefined,
      product,
    );
    initial.vote(post.id, "BUY", owner);
    const restarted = new CommunityStore(new FileCommunityPersistence(file));
    const signedIn = restarted.login(owner).viewer;
    expect(restarted.list(null).find((p) => p.id === post.id)?.concern).toBe(
      "살까요?",
    );
    expect(restarted.detail(post.id, signedIn).myVote).toBe("BUY");
    restarted.save({ ...input, concern: "수정한 고민" }, signedIn, post.id);
    const again = new CommunityStore(new FileCommunityPersistence(file));
    expect(again.detail(post.id, owner).concern).toBe("수정한 고민");
    expect(() =>
      again.remove(post.id, { id: "another", nickname: "다른 사용자" }),
    ).toThrow("본인");
    again.remove(post.id, owner);
    const afterDelete = new CommunityStore(new FileCommunityPersistence(file));
    expect(() => afterDelete.detail(post.id, owner)).toThrow("찾을 수");
    expect(afterDelete.list(null).some((p) => p.id === post.id)).toBe(false);
  });
  it("디스크 저장 실패 시 글·투표 변경을 되돌린다", () => {
    const disk = new FileCommunityPersistence(file);
    const initial = new CommunityStore(disk);
    const post = initial.save(input, owner, undefined, product);
    const broken: CommunityPersistence = {
      read: () => disk.read(),
      write: () => {
        throw new Error("disk full");
      },
    };
    const store = new CommunityStore(broken);
    const size = store.posts.size;
    expect(() => store.save(input, owner, undefined, product)).toThrow(
      "disk full",
    );
    expect(store.posts.size).toBe(size);
    expect(() => store.remove(post.id, owner)).toThrow();
    expect(store.detail(post.id, owner).deletedAt).toBeNull();
    expect(() => store.vote(post.id, "BUY", owner)).toThrow();
    expect(store.detail(post.id, owner).myVote).toBeNull();
    expect(store.detail(post.id, owner).buy).toBe(0);
  });
  it("손상된 저장 파일은 빈 데이터로 덮어쓰지 않는다", () => {
    writeFileSync(file, "broken data");
    expect(
      () => new CommunityStore(new FileCommunityPersistence(file)),
    ).toThrow("덮어쓰지 않았");
    expect(readFileSync(file, "utf8")).toBe("broken data");
  });
  it("로그인 세션 토큰은 파일에 저장하지 않는다", () => {
    const store = new CommunityStore(new FileCommunityPersistence(file));
    const session = store.login(owner);
    store.save(input, owner, undefined, product);
    expect(readFileSync(file, "utf8")).not.toContain(session.token);
    expect(
      new CommunityStore(new FileCommunityPersistence(file)).viewer(
        session.token,
      ),
    ).toBeNull();
  });
});

it("upgrades the old six placeholder products to the ZIP fixtures without losing authored posts or votes", () => {
  const old = {
    ...structuredClone(seedPosts[0]),
    product: {
      ...seedPosts[0].product,
      url: "https://www.musinsa.com/products/100000",
    },
  };
  const authored = {
    ...structuredClone(seedPosts[0]),
    id: "own-example",
    authorId: "test-member",
    concern: "내가 작성한 글",
  };
  writeFileSync(
    file,
    JSON.stringify({
      version: 1,
      posts: [old, authored],
      votes: [["sample-0:test-member", "BUY"]],
    }),
  );
  const upgraded = new CommunityStore(new FileCommunityPersistence(file));
  expect(upgraded.posts.size).toBe(seedPosts.length + 1);
  expect(upgraded.posts.get("sample-0")?.product).toEqual(seedPosts[0].product);
  expect(upgraded.posts.get("own-example")).toEqual(authored);
  expect(upgraded.votes.get("sample-0:test-member")).toBe("BUY");
  expect(upgraded.posts.get("sample-0")?.buy).toBe(seedPosts[0].buy + 1);
});

it("기존 저장 파일에서 시작해 계정별 상품 저장과 두 화면의 댓글을 유지한다", () => {
  const disk = new FileCommunityPersistence(file);
  disk.write({ version: 1, posts: seedPosts, votes: [] });
  const store = new CommunityStore(disk);
  const postId = seedPosts[0].id;
  const community = { kind: "community", postId } as const;
  const curation = { kind: "curation", roomId: "seoa", postId } as const;
  expect(() => store.saveProduct(postId, true, null)).toThrow("로그인");
  expect(() => store.addComment(community, "의견", null)).toThrow("로그인");
  expect(() => store.addComment(community, "  ", owner)).toThrow("1~500자");
  expect(() => store.addComment(community, "가".repeat(501), owner)).toThrow(
    "1~500자",
  );
  store.saveProduct(postId, true, owner);
  store.addComment(community, "  잘 어울려요.  ", owner);
  store.addComment(curation, "사이즈도 확인해 보세요.", owner);
  const restarted = new CommunityStore(disk);
  expect(restarted.savedIds(owner)).toEqual([postId]);
  expect(restarted.savedIds({ id: "other", nickname: "다른 회원" })).toEqual(
    [],
  );
  expect(
    restarted.listComments(community).map((comment) => comment.body),
  ).toEqual(["잘 어울려요."]);
  expect(
    restarted.listComments(curation).map((comment) => comment.body),
  ).toEqual(["사이즈도 확인해 보세요."]);
  restarted.saveProduct(postId, false, owner);
  expect(new CommunityStore(disk).savedIds(owner)).toEqual([]);
});

it("저장된 기본 글의 반복 프로필과 고민을 갱신하고 회원 글과 투표 기록을 보존한다", () => {
  const disk = new FileCommunityPersistence(file);
  const seed = seedPosts.find((post) => post.id === "sample-30")!;
  const old = {
    ...seed,
    concern: "반복 고민",
    bodyProfile: { personal_color: "봄 웜톤" },
    buy: 91,
    views: 5,
  };
  const member = {
    ...old,
    id: "member-beauty",
    authorId: owner.id,
    concern: "직접 작성한 글",
  };
  const edited = {
    ...seedPosts[31],
    concern: "수정한 글",
    updatedAt: "2026-11-07T08:00:00.000Z",
  };
  disk.write({
    version: 1,
    posts: [old, member, edited],
    votes: [[`${seed.id}:${owner.id}`, "BUY"]],
  });

  const restarted = new CommunityStore(disk);
  expect(restarted.detail(seed.id, owner)).toMatchObject({
    concern: seed.concern,
    bodyProfile: seed.bodyProfile,
    buy: 91,
    views: 5,
    myVote: "BUY",
  });
  expect(restarted.posts.get(member.id)).toEqual(member);
  expect(restarted.posts.get(edited.id)).toEqual(edited);
  expect(
    disk.read()?.posts.find((post) => post.id === seed.id)?.bodyProfile,
  ).toEqual(seed.bodyProfile);
});

it("기본 커뮤니티 글은 상품별 고민을 쓰고 뷰티 톤은 필요한 글에 다양하게 표시한다", () => {
  expect(new Set(seedPosts.map((post) => post.concern)).size).toBe(
    seedPosts.length,
  );
  const tones = seedPosts
    .filter((post) => post.category === "뷰티")
    .map((post) => post.bodyProfile.personal_color);
  expect(new Set(tones)).toEqual(
    new Set([undefined, "봄 웜톤", "여름 쿨톤", "가을 웜톤", "겨울 쿨톤"]),
  );
});

it("persists curation view counts per room and reads older files without counts", () => {
  const disk = new FileCommunityPersistence(file);
  disk.write({ version: 1, posts: [], votes: [] });
  const store = new CommunityStore(disk);
  expect(store.curationViewCount("seoa", "req-1")).toBe(0);
  store.recordCurationView("seoa", "req-1");
  store.recordCurationView("seoa", "req-1");
  store.recordCurationView("sophy", "req-1");
  const restarted = new CommunityStore(disk);
  expect(restarted.curationViewCount("seoa", "req-1")).toBe(2);
  expect(restarted.curationViewCount("sophy", "req-1")).toBe(1);
});
