import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";

const navigation = vi.hoisted(() => ({ query: "" }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({}),
  useSearchParams: () => new URLSearchParams(navigation.query),
}));
vi.mock("../../(creator)/_server/actions", () => ({}));
vi.mock("./profile-action", () => ({}));
vi.mock("./logout-button", () => ({ LogoutButton: () => null }));
vi.mock("./body-profile-form", () => ({ BodyProfileForm: () => null }));

import { seedPosts } from "../../../features/community/seed";
import { createSeed } from "../../(creator)/_server/seed";
import { MyPage } from "./my-page";

it("shows notifications on initial render and the home section when the URL has no section", () => {
  const renderAccount = () =>
    renderToStaticMarkup(
      createElement(MyPage, {
        nickname: "서연",
        accountRole: "USER",
        email: null,
        provider: "이메일",
        joined: "2026-11-06T00:00:00Z",
        initialPosts: [],
        loadError: false,
        now: 0,
      }),
    );
  navigation.query = "section=notifications";
  const notifications = renderAccount();
  expect(notifications).toContain("<h1>알림</h1>");
  expect(notifications).not.toContain("<h1>마이페이지 홈</h1>");
  expect(notifications).toMatch(
    /<a[^>]*aria-label="내 계정"[^>]*href="\/account"/,
  );
  navigation.query = "";
  expect(renderAccount()).toContain("<h1>마이페이지 홈</h1>");
});

it("links product images to the shop and provides detail and edit controls for written posts", () => {
  navigation.query = "";
  const roomPosts = createSeed().requests.filter(
    (post) => post.creatorId === "seoa",
  );
  const pending = roomPosts.find((post) => post.status === "ING")!;
  const answered = roomPosts.find((post) => post.status === "BUY")!;
  const markup = renderToStaticMarkup(
    createElement(MyPage, {
      nickname: "서연",
      accountRole: "USER",
      email: null,
      provider: "이메일",
      joined: "2026-11-06T00:00:00Z",
      communityPosts: [{ ...seedPosts[0], myVote: null }],
      initialPosts: [pending, answered],
      loadError: false,
      now: Date.parse(pending.createdAt),
    }),
  );
  expect(markup).not.toContain("룸 보기");
  expect(markup.match(/의 큐레이션 룸<\/div>/g)).toHaveLength(2);
  expect(markup.match(/aria-label="[^"]+ 쇼핑몰에서 보기"/g)).toHaveLength(3);
  expect(markup.match(/aria-label="[^"]+ 글과 댓글 보기"/g)).toHaveLength(3);
  expect(markup).toContain('href="/community?post=sample-0"');
  expect(markup.match(/>수정<\/button>/g)).toHaveLength(3);
  expect(markup.match(/>삭제<\/button>/g)).toHaveLength(3);
  expect(markup).toMatch(
    /<button[^>]*disabled[^>]*title="판정 완료 또는 만료된 고민은 수정할 수 없어요\."[^>]*>수정<\/button>/,
  );
});

it("opens participated posts through an in-page control and shows one comments tab", () => {
  navigation.query = "section=participation";
  const markup = renderToStaticMarkup(
    createElement(MyPage, {
      nickname: "서연",
      accountRole: "USER",
      provider: "로컬 테스트",
      email: null,
      joined: "2026-11-06T00:00:00Z",
      initialPosts: [],
      participatedPosts: [{ ...seedPosts[0], myVote: "BUY" }],
      loadError: false,
      now: 0,
    }),
  );
  expect(markup).toMatch(/<button[^>]+aria-label="[^"]+ 투표·댓글 보기"/);
  expect(markup).not.toContain("/community?post=");
  expect(markup).toContain("작성한 댓글");
  expect(markup).not.toContain("댓글 단 글");
  expect(markup).not.toContain("로컬 테스트 로그인");
  expect(markup).not.toContain("일반 회원");
});
