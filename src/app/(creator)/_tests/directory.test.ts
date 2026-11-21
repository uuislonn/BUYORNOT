vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("../_server/actions", () => ({ toggleCreatorFollow: vi.fn() }));
import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { directoryDatabase, addDirectoryRooms } from "../_server/directory";
import { snapshot } from "../_server/service";
import { CreatorDirectory } from "../_components/creator-directory";
describe("creator discovery", () => {
  it("provides fashion and luxury rooms alongside Soal and Sophy", () => {
    const db = directoryDatabase();
    expect(db.creators).toHaveLength(9);
    for (const room of db.creators) {
      const data = snapshot(db, null, room.id, false);
      expect(data.owner).toBeDefined();
      expect(data.requests.length).toBeGreaterThan(0);
      expect(data.requests.every((post) => post.creatorId === room.id)).toBe(
        true,
      );
    }
    const names = db.profiles
      .filter((profile) =>
        db.creators.some(
          (room) =>
            room.id.startsWith("fictional-") && room.ownerId === profile.id,
        ),
      )
      .map((profile) => profile.nickname);
    expect(names.sort()).toEqual(
      [
        "핏더사이즈",
        "깡스타일리스트",
        "최겨울",
        "옆집언니 최실장",
        "김무비 MOVIEKIM",
      ].sort(),
    );
    const selected = db.requests.filter((request) =>
      request.creatorId.startsWith("fictional-"),
    );
    expect(
      selected.some((request) => request.product.category === "뷰티"),
    ).toBe(false);
  });
  it("does not overwrite existing room settings or member activity when adding directory rooms", () => {
    const db = directoryDatabase();
    const room = db.creators.find((room) => room.id === "fictional-nayun")!;
    room.title = "변경한 룸 이름";
    const count = db.requests.length;
    addDirectoryRooms(db);
    expect(room.title).toBe("변경한 룸 이름");
    expect(db.requests).toHaveLength(count);
  });
  it("renders separate room links rather than sending every visitor to Soal", () => {
    const db = directoryDatabase();
    const rooms = db.creators.map((room) => ({
      ...room,
      nickname: db.profiles.find((p) => p.id === room.ownerId)!.nickname,
      avatar: "",
      topics: room.topics ?? [],
      categories: [],
      following: false,
      mine: false,
    }));
    const html = renderToStaticMarkup(
      createElement(CreatorDirectory, { rooms }),
    );
    for (const room of rooms)
      expect(html).toContain(`href="/creators/${room.id}"`);
    expect(html).toContain("어떤 취향과 함께 골라볼까요?");
  });
});

it("keeps follow controls outside room links and shows the saved follow state", () => {
  const db = directoryDatabase();
  const rooms = db.creators.slice(0, 3).map((room, index) => ({
    ...room,
    nickname: `크리에이터${index}`,
    avatar: "",
    topics: [],
    categories: [],
    following: index === 1,
    mine: index === 2,
  }));
  const html = renderToStaticMarkup(
    createElement(CreatorDirectory, { rooms, signedIn: true }),
  );
  expect(html).toContain(
    'aria-label="크리에이터0 팔로우" aria-pressed="false"',
  );
  expect(html).toContain(
    'aria-label="크리에이터1 팔로우 취소" aria-pressed="true"',
  );
  expect(html).not.toContain('aria-label="크리에이터2 팔로우"');
  const ownerSection = html.match(
    /<section[^>]*aria-labelledby="own-curation-rooms"[^>]*>([\s\S]*?)<\/section>/,
  )?.[1];
  expect(ownerSection).toContain("나의 큐레이션룸");
  const categoryControls = html.indexOf("크리에이터 검색");
  const ownHeading = html.indexOf("나의 큐레이션룸");
  const directoryHeading = html.indexOf("취향별 큐레이션 룸");
  expect(ownHeading).toBeGreaterThan(categoryControls);
  expect(directoryHeading).toBeGreaterThan(ownHeading);
  expect(ownerSection).toContain(`href="/creators/${rooms[2].id}"`);
  expect(ownerSection).toContain(`href="/creators/${rooms[2].id}/manage"`);
  expect(
    html.match(new RegExp(`href="/creators/${rooms[2].id}"`, "g")),
  ).toHaveLength(1);
  expect(html).not.toContain("나의 취향을 기다리는 고민이 있어요.");

  for (const anchor of html.matchAll(/<a\b[^>]*>([\s\S]*?)<\/a>/g))
    expect(anchor[1]).not.toContain("<button");
});

it("migrates placeholder profiles without losing member questions or follows", () => {
  const db = directoryDatabase();
  const next = db.creators.find((room) => room.id === "fictional-yuri")!;
  db.creators.push({ ...next, id: "fictional-moa", handle: "moa.archive" });
  db.follows["fictional-moa"] = ["member"];
  db.requests.push({
    ...db.requests[0],
    id: "member-preserved-question",
    authorId: "member",
    creatorId: "fictional-moa",
  });
  next.handle = "yuri.archive";
  addDirectoryRooms(db);
  expect(db.creators.some((room) => room.id === "fictional-moa")).toBe(false);
  expect(
    db.requests.find((request) => request.id === "member-preserved-question")
      ?.creatorId,
  ).toBe("fictional-yuri");
  expect(db.follows["fictional-yuri"]).toContain("member");
  expect(
    db.profiles.find((profile) => profile.id === next.ownerId)?.nickname,
  ).toBe("김무비 MOVIEKIM");
});

it("keeps luxury products and discovery order after loading an existing database", () => {
  const db = directoryDatabase();
  const expected = [
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
  expect(db.creators.map((room) => room.id)).toEqual(expected);
  db.creators.reverse();
  addDirectoryRooms(db);
  expect(db.creators.map((room) => room.id)).toEqual(expected);
  for (const id of ["leeyull", "yuria"]) {
    const data = snapshot(db, null, id, false);
    expect(data.requests.length).toBeGreaterThanOrEqual(10);
    expect(
      data.requests.every((post) =>
        ["프라다", "미우미우", "셀린느", "구찌", "막스마라", "르메르"].includes(
          post.product.brand,
        ),
      ),
    ).toBe(true);
    expect(
      data.requests.every(
        (post) =>
          post.product.image.startsWith("/curation-products/") &&
          post.product.url.startsWith("https://"),
      ),
    ).toBe(true);
    expect(data.creator.cover).toBe(`/creators/${id}-banner.jpg`);
  }
});

it("applies a navigation search to creator names and product brands", () => {
  const db = directoryDatabase();
  const rooms = db.creators.map((room) => ({
    ...room,
    nickname: db.profiles.find((p) => p.id === room.ownerId)!.nickname,
    avatar: "",
    topics: [],
    categories: [],
    following: false,
    mine: false,
    searchTerms: db.requests
      .filter((post) => post.creatorId === room.id)
      .map((post) => post.product.brand)
      .join(" "),
  }));
  const html = renderToStaticMarkup(
    createElement(CreatorDirectory, { rooms, initialSearch: "프라다" }),
  );
  expect(html).toContain('href="/creators/leeyull"');
  expect(html).toContain('href="/creators/yuria"');
  expect(html).not.toContain('href="/creators/fictional-rion"');
});

it("uses the shared animated category bar in creator discovery", () => {
  const html = renderToStaticMarkup(
    createElement(CreatorDirectory, { rooms: [] }),
  );
  expect(html).toContain('role="group" aria-label="카테고리"');
  expect(html).toContain(">ALL</button>");
  expect(html).not.toContain('aria-label="관심 카테고리"');
  expect(html).toContain("translateX(0px)");
});

it("shows room creation at the bottom only for an eligible member", () => {
  const eligible = renderToStaticMarkup(
    createElement(CreatorDirectory, {
      rooms: [],
      signedIn: true,
      applicationRoomId: "seoa",
    }),
  );
  expect(eligible).toMatch(/전체 룸 보기[\s\S]*큐레이션룸 만들기/);
  const guest = renderToStaticMarkup(
    createElement(CreatorDirectory, { rooms: [] }),
  );
  expect(guest).not.toContain("큐레이션룸 만들기");
});
