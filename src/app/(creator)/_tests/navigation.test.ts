import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { it, expect, vi } from "vitest";
const navigation = vi.hoisted(() => ({ query: "" }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/creators/seoa",
  useSearchParams: () => new URLSearchParams(navigation.query),
}));
vi.mock("../_server/actions", () => ({}));
import { CreatorWorkspace } from "../_components/workspace";
import { createSeed } from "../_server/seed";
import { snapshot } from "../_server/service";
it("the curation logo opens the actual home rather than redirecting back to the same room", () => {
  const initial = snapshot(createSeed(), null, "seoa", false);
  const html = renderToStaticMarkup(
    createElement(CreatorWorkspace, { initial }),
  );
  expect(html).toMatch(
    /<a\b(?=[^>]*href="\/")(?=[^>]*aria-label="Buy or Not 홈")[^>]*>/,
  );
  expect(html).not.toContain('aria-label="BUY OR NOT 크리에이터 홈"');
});
it("shows management to the owner and participation to members", () => {
  const db = createSeed();
  const owner = snapshot(db, db.creators[0].ownerId, "seoa", false);
  const ownerHtml = renderToStaticMarkup(
    createElement(CreatorWorkspace, { initial: owner }),
  );
  expect(ownerHtml).toContain("/creators/seoa/manage");
  expect(ownerHtml).toContain("내 큐레이션 룸 관리");
  expect(ownerHtml).toContain("보류");
  expect(ownerHtml).toContain('aria-label="카테고리"');
  expect(ownerHtml).not.toContain("CREATOR&#x27;S ROOM");
  expect(ownerHtml).not.toContain("룸 개설하기");
  expect(ownerHtml).not.toContain("당신의 큐레이션 룸을 열어보세요");
  expect(ownerHtml).not.toContain("살말 고민 작성하기");
  expect(ownerHtml).not.toContain("취향 팔로우");
  const member = db.profiles.find((profile) => profile.role === "USER")!;
  const memberHtml = renderToStaticMarkup(
    createElement(CreatorWorkspace, {
      initial: snapshot(db, member.id, "seoa", false),
    }),
  );
  expect(memberHtml).toContain("살말 고민 작성하기");
  expect(memberHtml).toContain("취향 팔로우");
  expect(memberHtml).not.toContain("/creators/seoa/manage");
  expect(memberHtml).not.toContain("BUY 판정");
  expect(memberHtml).not.toContain("룸 개설하기");
});

it("shows Sophy's channel banner with the same image-only treatment as Soal", async () => {
  const { directoryDatabase } = await import("../_server/directory");
  const db = directoryDatabase();
  for (const id of db.creators.map((room) => room.id)) {
    const html = renderToStaticMarkup(
      createElement(CreatorWorkspace, {
        initial: snapshot(db, null, id, false),
      }),
    );
    expect(html).not.toContain("GOOD TASTE, BETTER CHOICES.");
    expect(html).not.toContain("선택은 가볍게.");
    expect(html).not.toContain("BUY OR NOT ARCHIVE");
    expect(html).toContain("channelCover");
  }
});

it("opens the room on all statuses and shows their total", () => {
  const initial = snapshot(createSeed(), null, "seoa", false);
  const html = renderToStaticMarkup(
    createElement(CreatorWorkspace, { initial }),
  );
  expect(html).toMatch(/aria-selected="true"[^>]*>전체<span><\/span><b>/);
  expect(html).toContain(`${initial.requests.length}개의 고민`);
  for (const label of ["미답변", "사라", "마라", "만료 / 미투표"])
    expect(html).toContain(label);
});

it("sorts by view count and then by newest, including posts without view counts", () => {
  const initial = snapshot(createSeed(), null, "seoa", false);
  const [first, second, third] = initial.requests;
  first.views = 2;
  second.views = 5;
  third.views = undefined;
  initial.requests = [first, second, third];
  navigation.query = "sort=views";
  try {
    const html = renderToStaticMarkup(
      createElement(CreatorWorkspace, { initial }),
    );
    expect(html).toContain("조회수순");
    const order = [...html.matchAll(/data-request-id="([^"]+)"/g)].map(
      (match) => match[1],
    );
    expect(order).toEqual([second.id, first.id, third.id]);
  } finally {
    navigation.query = "";
  }
});
