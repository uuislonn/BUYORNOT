import { describe, expect, it } from "vitest";
import { exampleComments } from "./example-comments";
import { seedPosts } from "./seed";

describe("예시 댓글", () => {
  it("대표 커뮤니티 게시글에 닉네임으로 표시되는 댓글을 제공한다", () => {
    const comments = seedPosts.slice(0, 6).flatMap((post) => {
      const examples = exampleComments({ kind: "community", postId: post.id });
      expect(examples.length).toBeGreaterThanOrEqual(2);
      return examples;
    });
    expect(new Set(comments.map((comment) => comment.id)).size).toBe(
      comments.length,
    );
    expect(comments.map((comment) => comment.nickname)).toEqual(
      expect.arrayContaining(["유진", "다은", "지민"]),
    );
    expect(
      exampleComments({ kind: "community", postId: "member-post" }),
    ).toEqual([]);
  });

  it("큐레이션 예시는 지정된 룸과 게시글에서만 조회한다", () => {
    const target = {
      kind: "curation",
      roomId: "seoa",
      postId: "official-seoa-nw-5535",
    } as const;
    expect(exampleComments(target)).toHaveLength(2);
    expect(exampleComments(target)).toEqual(exampleComments(target));
    expect(exampleComments({ ...target, roomId: "fictional-yuri" })).toEqual(
      [],
    );
  });
});
