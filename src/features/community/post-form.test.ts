import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { PostForm } from "./post-form";

vi.mock("./actions", () => ({
  getProductInfo: vi.fn(),
  savePost: vi.fn(),
}));

describe("고민 작성 공개 설정", () => {
  it("전체 공개 안내와 세 개의 신체 정보 공개 선택지만 제공한다", () => {
    const markup = renderToStaticMarkup(
      createElement(PostForm, {
        initialUrl: "",
        close: () => {},
        saved: () => {},
      }),
    );
    expect(markup.match(/type="checkbox"/g)).toHaveLength(3);
    for (const label of ["나이", "퍼스널 컬러", "키 및 몸무게"])
      expect(markup).toContain(label);
    expect(markup).toContain("공개 범위: 전체 공개");
    expect(markup).not.toContain("팔로워 공개");
    expect(markup).not.toContain("링크 공개");
    expect(markup).not.toContain("체형");
  });
});
