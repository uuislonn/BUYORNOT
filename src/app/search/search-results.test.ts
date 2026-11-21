import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { it, expect, vi } from "vitest";
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("../../features/community/actions", () => ({}));
vi.mock("../(creator)/_server/actions", () => ({}));
import { SearchResults } from "./search-results";
import { directoryDatabase } from "../(creator)/_server/directory";
import { snapshot } from "../(creator)/_server/service";
import { seedPosts } from "../../features/community/seed";
it("groups actual matching posts under two text headings and keeps their different card behaviors", () => {
  const db = directoryDatabase();
  const room = snapshot(db, null, "sophy", false);
  const name = room.requests[0].product.name;
  const post = {
    ...seedPosts[0],
    product: { ...seedPosts[0].product, name },
    myVote: null,
  };
  const html = renderToStaticMarkup(
    createElement(SearchResults, {
      query: name,
      initialPosts: [post],
      rooms: [room],
      communityError: "",
    }),
  );
  expect(html).toContain('id="vote-results">살말 투표');
  expect(html).toContain('id="curation-results">큐레이션 룸');
  expect(html).toContain('role="meter"');
  expect(html.match(/role="meter"/g)).toHaveLength(1);
  expect(html).toContain("소피의 큐레이션 룸");
  expect(html).toContain(`#request-${room.requests[0].id}`);
  expect(html).toContain("찜하기");
  expect(html).not.toContain("에서 찾기");
});
it("shows separate empty results without substituting unrelated cards", () => {
  const html = renderToStaticMarkup(
    createElement(SearchResults, {
      query: "일치하지않는검색어",
      initialPosts: seedPosts.map((p) => ({ ...p, myVote: null })),
      rooms: [],
      communityError: "",
    }),
  );
  expect(html).toContain("검색어에 맞는 살말 투표가 없어요.");
  expect(html).toContain("검색어에 맞는 큐레이션 글이 없어요.");
  expect(html).not.toContain('role="meter"');
});
