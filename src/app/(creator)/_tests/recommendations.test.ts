import { expect, it } from "vitest";
import { seedPosts } from "../../../features/community/seed";
import { luxuryProductName } from "../../../lib/product-name";
import { addDirectoryRooms, directoryDatabase } from "../_server/directory";
import { roomRecommendations } from "../_server/recommendations";

function recommendationId(value: string) {
  const url = new URL(value);
  return url.searchParams.get("goodsNo") ?? url.pathname.split("/").at(-1);
}

it("lists separate storefront recommendations and an Instagram link in all nine rooms", () => {
  const db = directoryDatabase();
  expect(db.creators).toHaveLength(9);
  const all = new Set<string>();
  const roomSizes = new Map<string, number>();
  const linkedProducts = new Set(
    [
      ...seedPosts.map((post) => post.product.url),
      ...db.requests.map((post) => post.product.url),
    ].map((url) => recommendationId(url)),
  );
  for (const room of db.creators) {
    const requests = db.requests.filter((post) => post.creatorId === room.id);
    const recommendations = roomRecommendations(room.id, requests);
    roomSizes.set(room.id, recommendations.length);
    expect(
      room.links.some(({ url }) =>
        /^https:\/\/www\.instagram\.com\//.test(url),
      ),
    ).toBe(true);
    for (const product of recommendations) {
      expect(product.url).toMatch(
        /^https:\/\/www\.(?:musinsa\.com\/products\/\d+|oliveyoung\.co\.kr\/store\/goods\/getGoodsDetail\.do\?goodsNo=A\d{12})$/,
      );
      expect(linkedProducts.has(recommendationId(product.url))).toBe(false);
      expect(product.image).toMatch(
        /image\.(?:msscdn\.net|oliveyoung\.co\.kr)\//,
      );
      expect(product.price).toBeGreaterThan(0);
      expect(all.has(product.url)).toBe(false);
      all.add(product.url);
    }
  }
  expect(Object.fromEntries(roomSizes)).toEqual({
    seoa: 7,
    sophy: 4,
    "fictional-nayun": 4,
    "fictional-yuri": 3,
    "fictional-rion": 4,
    "fictional-seowoo": 3,
    "fictional-doa": 5,
    leeyull: 2,
    yuria: 3,
  });
});

it("omits a recommendation if the same Musinsa item is already in the room", () => {
  const initial = roomRecommendations("seoa", []);
  const db = directoryDatabase();
  const request = db.requests.find((post) => post.creatorId === "seoa")!;
  const product = { ...request.product, url: initial[0].url + "?ref=shop" };
  expect(
    roomRecommendations("seoa", [{ ...request, product }]),
  ).not.toContainEqual(initial[0]);
});

it("removes obsolete names even from saved starter posts and preserves member text", () => {
  const db = directoryDatabase();
  const original = db.requests.find((post) => post.creatorId === "seoa")!;
  db.requests.push(
    {
      ...original,
      id: "member-example-20261106-req-15",
      creatorId: "fictional-yuri",
      concern: "모아님, 이 가방 어때요?",
    },
    {
      ...original,
      id: "member-example-20261106-req-11",
      creatorId: "fictional-nayun",
      concern: "나윤님, 이 셔츠 어때요?",
    },
    {
      ...original,
      id: "member-personal-post",
      creatorId: "fictional-yuri",
      concern: "나윤님, 안녕하세요.",
    },
  );
  addDirectoryRooms(db);
  expect(
    db.requests.find((post) => post.id === "member-example-20261106-req-15")
      ?.concern,
  ).toBe("이 가방 어때요?");
  expect(
    db.requests.find((post) => post.id === "member-example-20261106-req-11")
      ?.concern,
  ).toBe("이 셔츠 어때요?");
  expect(
    db.requests.find((post) => post.id === "member-personal-post")?.concern,
  ).toBe("나윤님, 안녕하세요.");
});

it.each([
  ["니트 / FKS447KN0056001", "니트"],
  ["카디건 / 8092863", "카디건"],
  ["자켓(Black)_Q266AMDB08BKN", "자켓(Black)"],
  ["태비 숄더 백 26 CCX04 LHBLK", "태비 숄더 백 26"],
  ["4 스티치 체인 지갑 - 블랙", "4 스티치 체인 지갑 - 블랙"],
])("shortens only the trailing model code in %s", (source, expected) => {
  expect(luxuryProductName(source)).toBe(expected);
});
