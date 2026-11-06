import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PostOwnerMenu } from "./post-owner-menu";

describe("게시글 작성자 관리 메뉴", () => {
  it("작성자에게 수정·삭제를 담은 더보기 버튼을 제공한다", () => {
    const html = renderToStaticMarkup(
      createElement(PostOwnerMenu, {
        isOwner: true,
        edit: () => {},
        remove: () => {},
      }),
    );
    expect(html).toContain('aria-label="게시글 관리"');
    expect(html).toContain("수정하기");
    expect(html).toContain("삭제하기");
    expect(html).not.toContain(" open=");
  });
  it("다른 사용자와 비회원에게는 관리 메뉴를 표시하지 않는다", () => {
    expect(
      renderToStaticMarkup(
        createElement(PostOwnerMenu, {
          isOwner: false,
          edit: () => {},
          remove: () => {},
        }),
      ),
    ).toBe("");
  });
});
