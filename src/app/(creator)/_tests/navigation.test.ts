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
