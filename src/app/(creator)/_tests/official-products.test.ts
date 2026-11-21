import { expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import {
  OFFICIAL_PRODUCTS,
  OFFICIAL_ROOM_SELECTIONS,
} from "../_content/official-products";
import { directoryDatabase, addDirectoryRooms } from "../_server/directory";
import { getAffiliateLink, validateProductUrl } from "../_lib/product-url";

it("provides real local photos and individually approved brand sales links", () => {
  expect(OFFICIAL_PRODUCTS.length).toBeGreaterThanOrEqual(50);
  for (const sale of OFFICIAL_PRODUCTS) {
    expect(existsSync(`public${sale.product.image}`)).toBe(true);
    expect(readFileSync(`public${sale.product.image}`).length).toBeGreaterThan(
      1500,
    );
    expect(getAffiliateLink(sale.product.url)).toBe(sale.product.url);
    if (
      ["gramicci.com", "www.lemaire.fr"].includes(
        new URL(sale.product.url).hostname,
      )
    )
      expect(sale.product.price).toBeNull();
  }
  const brandProduct = "https://aakam.kr/product/washed-field-jacket-khaki/654";
  expect(getAffiliateLink(brandProduct)).toBe(brandProduct);
  expect(validateProductUrl(brandProduct)).toBe(brandProduct);
});

it("keeps each room distinct, mixes brands, and preserves activity on repeated loads", () => {
  const db = directoryDatabase();
  for (const [id, selected] of Object.entries(OFFICIAL_ROOM_SELECTIONS)) {
    const posts = db.requests.filter((post) => post.creatorId === id);
    expect(posts.length).toBeGreaterThanOrEqual(10);
    expect(
      new Set(posts.map((post) => post.product.brand)).size,
    ).toBeGreaterThanOrEqual(4);
    expect(selected.length).toBeGreaterThanOrEqual(5);
    const editorial = posts
      .filter(
        (post) =>
          post.id.startsWith("official-") || post.id.startsWith("directory-"),
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    expect(
      new Set(editorial.slice(0, 5).map((post) => post.product.brand)).size,
    ).toBeGreaterThanOrEqual(3);
    expect(new Set(posts.map((post) => post.product.url)).size).toBe(
      posts.length,
    );
  }
  expect(
    new Set(
      OFFICIAL_ROOM_SELECTIONS["fictional-yuri"].filter((id) =>
        OFFICIAL_ROOM_SELECTIONS["fictional-nayun"].includes(id),
      ),
    ).size,
  ).toBeLessThan(3);
  const member = {
    ...structuredClone(db.requests[0]),
    id: "member-keep",
    authorId: "member",
    creatorId: "fictional-yuri",
    concern: "내가 작성한 질문",
    createdAt: "2026-11-16T10:30:00Z",
  };
  db.requests.push(member);
  const post = db.requests.find((post) => post.id.startsWith("official-"))!;
  post.status = "BUY";
  db.hearts[post.id] = ["member"];
  const before = structuredClone(db);
  addDirectoryRooms(db);
  expect(db).toEqual(before);
  expect(db.requests.find((post) => post.id === member.id)).toEqual(member);
});
