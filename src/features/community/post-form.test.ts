import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import { RequestForm } from "../../app/(creator)/_components/request-form";
import { seedPosts } from "./seed";
import { PostForm } from "./post-form";

vi.mock("./actions", () => ({
  getProductInfo: vi.fn(),
  savePost: vi.fn(),
}));

it("renders the exact same new-post form in the community and curation room", () => {
  const community = renderToStaticMarkup(
    createElement(PostForm, {
      initialUrl: "",
      close: () => {},
      saved: () => {},
    }),
  );
  const curation = renderToStaticMarkup(
    createElement(RequestForm, {
      creatorId: "seoa",
      busy: false,
      onClose: () => {},
      onSubmit: () => {},
    }),
  );
  expect(community).toBe(curation);
  expect(community.match(/type="checkbox"/g)).toHaveLength(5);
  expect(community).not.toContain("상품 정보 불러오기");
});

it("shows the brand and price guidance in the shared product preview", () => {
  const post = { ...seedPosts[0], myVote: null };
  const markup = renderToStaticMarkup(
    createElement(PostForm, {
      post,
      initialUrl: post.product.url,
      close: () => {},
      saved: () => {},
    }),
  );
  expect(markup).toContain(`>${post.product.brand}</span>`);
  expect(markup).not.toContain(">상품 대표 이미지</span>");
  expect(markup).toContain(
    "<small>상품 상세 페이지에서 최종 가격과 옵션을 확인해 주세요.</small>",
  );
});
it("does not offer an example link in a new curation form", () => {
  const markup = renderToStaticMarkup(
    createElement(RequestForm, {
      creatorId: "seoa",
      busy: false,
      onClose: () => {},
      onSubmit: () => {},
    }),
  );
  expect(markup).not.toContain("상품 링크 예시로 확인하기");
});

it("renders a separate duplicate dialog with the product card above the post", async () => {
  const { DuplicatePost } =
    await import("../../app/(creator)/_components/duplicate-post");
  const markup = renderToStaticMarkup(
    createElement(DuplicatePost, {
      creatorId: "seoa",
      id: "req-1",
      product: {
        ...seedPosts[0].product,
        category: "의류",
        price: 6990,
        originalPrice: 25900,
        discountRate: 73,
      },
      image: seedPosts[0].product.image,
      onClose: () => {},
    }),
  );
  expect(markup).toMatch(
    /<dialog[\s\S]*이미 함께 고민 중인 상품이에요[\s\S]*73% 할인[\s\S]*6,990원[\s\S]*기존 글을 불러오는 중이에요/,
  );
  expect(markup).not.toContain("기존 글 바로가기");
});

it("shows an accessible vote bar with the same percentages as the community card", async () => {
  const { VoteResults } = await import("./vote-buttons");
  const html = renderToStaticMarkup(
    createElement(VoteResults, { buy: 7, not: 3 }),
  );
  expect(html).toContain("BUY 70%");
  expect(html).toContain("NOT 30%");
  expect(html).toMatch(/role="meter"[^>]*aria-valuenow="70"/);
  expect(html).toContain("width:70%");
});
