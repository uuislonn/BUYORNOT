import { OFFICIAL_PRODUCTS } from "../_content/official-products";
import { addOfficialRoomProducts } from "./official-room-products";
import { normalizeProductCategories } from "../_lib/product-category";
import { SOPHY_LINKED_ITEMS } from "../_content/sophy-products";
import { SOPHY_VIDEO } from "../_content/sophy-video";
import entries from "./creator-directory.json";
import { createSeed } from "./seed";
import { DIRECTORY_PRODUCTS } from "../_content/directory-products";
import type { Database, Profile } from "../_lib/types";
const instagram: Record<string, string> = {
  seoa: "i0c0i",
  sophy: "sopppppphyyyy",
  "fictional-nayun": "choi_sil_zzang",
  "fictional-yuri": "yyyyyyyyyyhk",
  "fictional-rion": "fit.the.size",
  "fictional-seowoo": "dh_visual",
  "fictional-doa": "wt830",
  leeyull: "yulleesis",
  yuria: "yuriaimda",
};

// Public editorial fixtures only: no login credentials, member body data or activity.
export function addDirectoryRooms(db: Database) {
  normalizeProductCategories(db);
  const source = createSeed();
  const soal = db.creators.find((room) => room.id === "seoa");
  const originalSoal = source.creators.find((room) => room.id === "seoa")!;
  if (soal) {
    if (["소올soal", "소올의 큐레이션 룸"].includes(soal.title))
      soal.title = originalSoal.title;
    if (soal.cover?.includes("soal-banner")) soal.cover = originalSoal.cover;
    const owner = db.profiles.find((profile) => profile.id === soal.ownerId);
    const originalOwner = source.profiles.find(
      (profile) => profile.id === originalSoal.ownerId,
    )!;
    if (owner) {
      if (!owner.avatar || owner.avatar.includes("soal-avatar"))
        owner.avatar = originalOwner.avatar;
      if (["크리에이터 테스트", "소올soal"].includes(owner.nickname))
        owner.nickname = originalOwner.nickname;
    }
  }
  // Keep member questions and follows when retiring the two remaining placeholder rooms.
  for (const [oldId, nextId] of [
    ["fictional-moa", "fictional-yuri"],
    ["fictional-harin", "fictional-nayun"],
  ]) {
    if (!db.creators.some((room) => room.id === oldId)) continue;
    db.requests = db.requests.filter(
      (request) => !request.id.startsWith(`directory-${oldId}-`),
    );
    for (const request of db.requests)
      if (request.creatorId === oldId) request.creatorId = nextId;
    db.follows[nextId] = [
      ...new Set([...(db.follows[nextId] ?? []), ...(db.follows[oldId] ?? [])]),
    ];
    delete db.follows[oldId];
    db.creators = db.creators.filter((room) => room.id !== oldId);
  }
  for (const entry of entries) {
    const room = db.creators.find((value) => value.id === entry.room.id);
    if (!room) db.creators.push(structuredClone(entry.room));
    else if (room.handle.endsWith(".archive"))
      Object.assign(room, structuredClone(entry.room));
    // Refresh retired channel banners while preserving custom owner-uploaded covers.
    if (
      room &&
      [
        "/creators/fit-banner.jpg",
        "/creators/kkang-banner.jpg",
        "/creators/winter-banner.jpg",
        "/creators/kkang-style.jpg",
        "/creators/winter-style.jpg",
      ].includes(room.cover)
    )
      room.cover = entry.room.cover;
    const owner = db.profiles.find((profile) => profile.id === entry.owner.id);
    if (owner) Object.assign(owner, entry.owner);
    else db.profiles.push({ ...entry.owner, role: "CREATOR" } as Profile);
    const authorId = `reader-${entry.room.id}`;
    if (!db.profiles.some((profile) => profile.id === authorId))
      db.profiles.push({
        id: authorId,
        nickname: "취향 탐색 중",
        role: "USER",
        avatar: "",
        verified: false,
      });
    // The same Celine card holder now links to its official page; retain post IDs and reactions.
    const officialCard = OFFICIAL_PRODUCTS.find(
      (sale) => sale.id === "celine-card",
    )!.product;
    for (const post of db.requests)
      if (
        post.id.startsWith(`directory-${entry.room.id}-`) &&
        post.authorId === authorId &&
        post.product.url === "https://www.musinsa.com/products/4941162"
      )
        post.product = structuredClone(officialCard);
    // Update only generated product examples, preserving all member-created questions.
    db.requests = db.requests.filter(
      (request) =>
        !request.id.startsWith(`directory-${entry.room.id}-`) ||
        entry.productUrls.includes(request.product.url),
    );
    for (const [i, url] of entry.productUrls.entries()) {
      const product =
        OFFICIAL_PRODUCTS.find((value) => value.product.url === url)?.product ??
        DIRECTORY_PRODUCTS.find((value) => value.url === url) ??
        source.requests.find((post) => post.product.url === url)?.product;
      if (!product) continue;
      const concern =
        product.category === "신발"
          ? "평소 입는 바지와 잘 어울릴까요? 착화감과 활용도까지 생각하면 살 만한지 고민이에요."
          : product.category === "잡화"
            ? "기본 코디에 자주 활용할 수 있을까요? 디자인과 실용성 사이에서 고민 중이에요."
            : "평소 코디에 추가하기 괜찮을까요? 핏과 소재, 오래 입을 수 있을지 고민돼요.";
      const previous = db.requests.find(
        (request) =>
          request.id.startsWith(`directory-${entry.room.id}-`) &&
          request.product.url === url,
      );
      if (previous) {
        previous.product = structuredClone(product);
        previous.concern = concern;
        previous.tags = [product.category];
        continue;
      }
      const id = `directory-${entry.room.id}-product-${url.split("/").at(-1)}`;
      const timestamp = new Date(Date.now() - i * 3600000).toISOString();
      db.requests.push({
        id,
        creatorId: entry.room.id,
        authorId,
        product: structuredClone(product),
        concern,
        tags: [product.category],
        bodySpec: {},
        status: "ING",
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    }
  }
  if (!db.creators.some((room) => room.id === "sophy")) {
    db.creators.unshift({
      id: "sophy",
      ownerId: "sophy-video-owner",
      title: "소피의 위시리스트 살말 룸",
      handle: "sopppppphyyyy",
      bio: "실제 판매 상품과 함께 살펴보는 위시리스트. 소피의 살말 의견을 참고해 나에게 맞는 선택을 찾아보세요.",
      cover: "/curation-products/sophy/banner.jpg",
      topics: ["SALMAL", "VIDEO", "ARCHIVE"],
      links: [
        { label: "원본 영상", url: SOPHY_VIDEO.url },
        { label: "YouTube", url: SOPHY_VIDEO.channel },
      ],
    });
    db.profiles.push({
      id: "sophy-video-owner",
      nickname: "소피 SOPHY",
      role: "CREATOR",
      avatar: "/curation-products/sophy/avatar.jpg",
      verified: false,
    });
  }
  const sophy = db.creators.find((room) => room.id === "sophy");
  if (sophy) {
    sophy.cover = "/curation-products/sophy/banner.jpg";
    sophy.title = "소피의 큐레이션 룸";
    sophy.bio = "개성 있는 옷과 신발, 일상에서 오래 쓸 아이템을 함께 골라요.";
    sophy.topics = ["개성 있는 스타일", "패션", "뷰티"];
    sophy.links = [{ label: "YouTube", url: SOPHY_VIDEO.channel }];
  }
  const authorId = "reader-sophy";
  if (!db.profiles.some((profile) => profile.id === authorId))
    db.profiles.push({
      id: authorId,
      nickname: "취향 탐색 중",
      role: "USER",
      avatar: "",
      verified: false,
    });
  for (const item of SOPHY_LINKED_ITEMS) {
    const id = `sophy-product-${item.seconds}`;
    const existing = db.requests.find((request) => request.id === id);
    if (existing) {
      if (existing.creatorId === "sophy" && existing.authorId === authorId)
        existing.product = structuredClone(item.sale.product);
      continue;
    }
    const timestamp = new Date(Date.now() - item.seconds * 1000).toISOString();
    const decision =
      item.verdict === "BUY" || item.verdict === "NOT" ? item.verdict : null;
    db.requests.push({
      id,
      creatorId: "sophy",
      authorId,
      product: structuredClone(item.sale.product),
      concern: item.concern,
      tags: [item.sale.product.category],
      bodySpec: {},
      status: decision ?? "ING",
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    if (decision)
      db.evaluations.push({
        id: `${id}-opinion`,
        requestId: id,
        creatorId: "sophy-video-owner",
        decision,
        comment: `영상 속 의견 참고: ${item.reason}`,
        createdAt: timestamp,
      });
  }
  const owner = db.profiles.find(
    (profile) => profile.id === "sophy-video-owner",
  );
  if (owner) owner.avatar = "/curation-products/sophy/avatar.jpg";
  addOfficialRoomProducts(db);
  for (const room of db.creators) {
    const handle = instagram[room.id];
    if (
      handle &&
      !room.links.some((link) => /instagram|인스타그램/i.test(link.label))
    )
      room.links.push({
        label: "Instagram",
        url: `https://www.instagram.com/${handle}/`,
      });
  }
  for (const post of db.requests) {
    if (!/^(?:req-|member-example-20261106-req-)\d+$/.test(post.id)) continue;
    post.concern = post.concern.replace(
      /^(?:나윤|하린|유리|모아|서우|리온|도아)\s*님(?:\s*화장일기처럼)?[,，]?\s*/,
      "",
    );
  }
  // Keep discovery in a stable style sequence, independent of persisted insertion order.
  const discoveryOrder = [
    "seoa",
    "sophy",
    "fictional-yuri",
    "fictional-nayun",
    "leeyull",
    "yuria",
    "fictional-rion",
    "fictional-seowoo",
    "fictional-doa",
  ];
  const rank = new Map(discoveryOrder.map((id, index) => [id, index]));
  db.creators.sort(
    (a, b) =>
      (rank.get(a.id) ?? discoveryOrder.length) -
      (rank.get(b.id) ?? discoveryOrder.length),
  );
  return db;
}
export function directoryDatabase() {
  return addDirectoryRooms(createSeed());
}
