import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { it, expect, vi } from "vitest";
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/creators/seoa",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("../_server/actions", () => ({}));
import { CreatorWorkspace } from "../_components/workspace";
import { createSeed } from "../_server/seed";
import { snapshot } from "../_server/service";
import { SiteHeader } from "../../../components/site-header";
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

it("큐레이션 룸은 홈·커뮤니티와 같은 공통 상단바를 표시한다", () => {
  const initial = snapshot(createSeed(), null, "seoa", false);
  const html = renderToStaticMarkup(
    createElement(CreatorWorkspace, { initial }),
  );
  const expected = renderToStaticMarkup(
    createElement(SiteHeader, {
      currentPage: "curation",
      onAccount: () => {},
    }),
  );
  const header = html.match(/<header\b[\s\S]*?<\/header>/)?.[0];
  expect(header).toBe(expected);
  expect(header).toMatch(
    /<a\b(?=[^>]*href="\/creators\/seoa")(?=[^>]*aria-current="page")[^>]*>Curation Room<\/a>/,
  );
});

it("로그인한 사용자의 공통 상단바에 My Page를 표시한다", () => {
  const db = createSeed();
  const member = db.profiles.find((profile) => profile.role === "USER")!;
  const initial = snapshot(db, member.id, "seoa", false);
  const html = renderToStaticMarkup(
    createElement(CreatorWorkspace, { initial }),
  );
  const header = html.match(/<header\b[\s\S]*?<\/header>/)?.[0];
  expect(header).toContain(">My Page</button>");
  expect(header).not.toContain(">Login</button>");
});

it("공통 상단바를 적용해도 본문의 룸·추천 숍 탭과 개설 신청을 유지한다", () => {
  const initial = snapshot(createSeed(), null, "seoa", false);
  const html = renderToStaticMarkup(
    createElement(CreatorWorkspace, { initial }),
  );
  const tabs =
    html.match(
      /<button\b(?=[^>]*role="tab")(?=[^>]*aria-controls="creator-content")[^>]*>[\s\S]*?<\/button>/g,
    ) ?? [];
  expect(tabs).toHaveLength(2);
  expect(tabs[0]).toContain("큐레이션 룸");
  expect(tabs[0]).toContain('aria-selected="true"');
  expect(tabs[1]).toContain("추천 숍");
  expect(tabs[1]).toContain('aria-selected="false"');
  expect(html).toContain("당신의 큐레이션 룸을 열어보세요");
});
