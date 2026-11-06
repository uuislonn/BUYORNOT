import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { createPostShareUrl, sharePost } from "./share";
import { ShareButton } from "./share-button";
import { CommunityStore } from "./store";

const data = {
  title: "상품 · Buy or Not",
  url: "https://buyornot.example/community?post=sample-0",
};

describe("게시글 공유", () => {
  it("필터나 다른 쿼리가 섞이지 않은 게시글 링크를 만든다", () => {
    expect(createPostShareUrl("https://buyornot.example", "id & 한글")).toBe(
      "https://buyornot.example/community?post=id+%26+%ED%95%9C%EA%B8%80",
    );
  });

  it("네이티브 공유가 가능하면 공유 메뉴를 사용한다", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const writeText = vi.fn();
    expect(await sharePost(data, { share, writeText })).toBe("shared");
    expect(share).toHaveBeenCalledWith(data);
    expect(writeText).not.toHaveBeenCalled();
  });

  it("공유 메뉴 취소는 복사를 실행하지 않는다", async () => {
    const share = vi
      .fn()
      .mockRejectedValue(new DOMException("취소", "AbortError"));
    const writeText = vi.fn();
    expect(await sharePost(data, { share, writeText })).toBe("cancelled");
    expect(writeText).not.toHaveBeenCalled();
  });

  it("공유 API가 없으면 게시글 URL만 복사한다", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    expect(await sharePost(data, { writeText })).toBe("copied");
    expect(writeText).toHaveBeenCalledWith(data.url);
  });

  it("공유 API 오류 시 링크 복사로 전환한다", async () => {
    const share = vi.fn().mockRejectedValue(new Error("공유 불가"));
    const writeText = vi.fn().mockResolvedValue(undefined);
    expect(await sharePost(data, { share, writeText })).toBe("copied");
  });

  it("클립보드 거부나 미지원 시 수동 복사를 제공한다", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("권한 없음"));
    expect(await sharePost(data, { writeText })).toBe("manual");
    expect(await sharePost(data, {})).toBe("manual");
  });

  it("공개 게시글에만 접근 가능한 공유 버튼을 표시한다", () => {
    const post = new CommunityStore().detail("sample-0", null);
    expect(
      renderToStaticMarkup(createElement(ShareButton, { post })),
    ).toContain('aria-label="게시글 공유하기"');
    for (const visibility of ["FOLLOWERS", "LINK_ONLY"] as const) {
      expect(
        renderToStaticMarkup(
          createElement(ShareButton, {
            post: { ...post, visibility },
          }),
        ),
      ).toBe("");
    }
  });
});
