import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import { ProductCard } from "../_components/product-card";
import { CreatorWorkspace } from "../_components/workspace";
import { createSeed } from "../_server/seed";
import { snapshot } from "../_server/service";
import s from "../_components/creator.module.css";
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/creators/seoa",
  useSearchParams: () => new URLSearchParams("view=shop"),
}));
vi.mock("../_server/actions", () => ({}));

it("큐레이션 카드는 이미지를 채우고 비회원도 쇼핑몰 링크를 사용할 수 있다", () => {
  const db = createSeed();
  const request = {
    ...db.requests[0],
    product: {
      ...db.requests[0].product,
      image: "https://image.msscdn.net/product.jpg",
    },
  };
  const html = renderToStaticMarkup(
    createElement(ProductCard, {
      request,
      author: db.profiles.find((p) => p.id === request.authorId),
      liked: false,
      own: false,
      pending: false,
      now: new Date(request.createdAt).getTime(),
      onHeart: vi.fn(),
      onEvaluate: vi.fn(),
      onEdit: vi.fn(),
      onDelete: vi.fn(),
      onDetail: vi.fn(),
    }),
  );
  const link = html.match(/<a\b[\s\S]*?<\/a>/)?.[0];
  expect(link).toContain(s.photoCover);
  expect(link).not.toContain(s.productPhoto);
  expect(link).toContain("쇼핑몰에서 보기 ↗");
  expect(link).toContain('target="_blank"');
  expect(link).toContain('rel="noopener noreferrer sponsored"');
  expect(link).not.toContain("<button");
});

it("추천 숍에도 이미지 채우기와 같은 쇼핑몰 바로가기 표시를 적용한다", () => {
  const initial = snapshot(createSeed(), null, "seoa", false);
  const html = renderToStaticMarkup(
    createElement(CreatorWorkspace, { initial }),
  );
  const cards = html.match(/<article\b[\s\S]*?<\/article>/g) ?? [];
  expect(cards.length).toBeGreaterThan(0);
  for (const card of cards) {
    expect(card).toContain(s.shopCard);
    expect(card).toContain(s.photoCover);
    expect(card).toContain("쇼핑몰에서 보기 ↗");
    expect(card).toContain('rel="noopener noreferrer sponsored"');
  }
});
