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
