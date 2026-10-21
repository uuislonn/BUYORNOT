import { describe, expect, it } from "vitest";
import { CommunityStore } from "./store";
import { validateProductUrl } from "./product";
import type { PostInput } from "./types";
const input: PostInput = {
  productUrl: "https://www.musinsa.com/products/1",
  concern: "고민 중이에요",
  category: "의류",
  visibility: "PUBLIC",
  bodyProfile: { height_cm: "165" },
};
describe("상품 URL 보안", () => {
  it.each([
    "http://www.musinsa.com/p",
    "https://localhost/p",
    "https://127.0.0.1",
    "https://2130706433",
    "https://10.0.0.1",
    "https://169.254.169.254",
    "https://[::1]",
    "https://[::ffff:127.0.0.1]",
    "https://www.musinsa.com.evil.com",
    "https://www.musinsa.com@127.0.0.1",
    "https://u:p@www.musinsa.com",
    "https://www.musinsa.com:8443",
    "file:///etc/passwd",
    "javascript:alert(1)",
  ])("위험한 URL 차단: %s", (url) =>
    expect(() => validateProductUrl(url)).toThrow(),
  );
  it("허용된 상품 HTTPS URL만 수락", () =>
    expect(validateProductUrl(input.productUrl).hostname).toBe(
      "www.musinsa.com",
    ));
});
describe("Mock 권한과 데이터 흐름", () => {
  it("비회원 조회 허용, 작성/투표/삭제 차단", () => {
    const s = new CommunityStore();
    expect(s.list(null).length).toBe(6);
    expect(() => s.save(input, null)).toThrow("로그인");
    expect(() => s.vote("sample-0", "BUY", null)).toThrow("로그인");
    expect(() => s.remove("sample-0", null)).toThrow("로그인");
  });
  it("투표 생성 → 취소 → 변경, 중복 없이 집계", () => {
    const s = new CommunityStore();
    const u = s.login().viewer;
    expect(s.vote("sample-0", "BUY", u)).toMatchObject({
      buy: 87,
      not: 14,
      myVote: "BUY",
    });
    expect(s.vote("sample-0", "BUY", u)).toMatchObject({
      buy: 86,
      not: 14,
      myVote: null,
    });
    s.vote("sample-0", "BUY", u);
    expect(s.vote("sample-0", "NOT", u)).toMatchObject({
      buy: 86,
      not: 15,
      myVote: "NOT",
    });
    expect(s.votes.size).toBe(1);
  });
  it("수정/삭제는 본인만 허용, 삭제 후 조회 차단", () => {
    const s = new CommunityStore();
    const u = s.login().viewer;
    const other = s.login().viewer;
    const p = s.save(input, u);
    expect(() => s.save(input, other, p.id)).toThrow("본인");
    expect(() => s.remove(p.id, other)).toThrow("본인");
    expect(s.save({ ...input, concern: "수정" }, u, p.id).concern).toBe("수정");
    s.remove(p.id, u);
    expect(() => s.detail(p.id, u)).toThrow("찾을 수");
  });
  it("비공개 데이터 보호 및 공개 선택 스냅샷 복사", () => {
    const s = new CommunityStore();
    const u = s.login().viewer;
    const source = { ...input, bodyProfile: { height_cm: "165" } };
    const p = s.save({ ...source, visibility: "FOLLOWERS" }, u);
    source.bodyProfile.height_cm = "180";
    expect(s.detail(p.id, u).bodyProfile).toEqual({ height_cm: "165" });
    expect(() => s.detail(p.id, null)).toThrow();
    const link = s.save({ ...input, visibility: "LINK_ONLY" }, u);
    expect(() => s.detail(link.id, s.login().viewer)).toThrow();
  });
  it("검증 우회와 301자 차단", () => {
    const s = new CommunityStore();
    const u = s.login().viewer;
    expect(() => s.save({ ...input, concern: "a".repeat(301) }, u)).toThrow();
    expect(() =>
      s.save({ ...input, category: "임의" as PostInput["category"] }, u),
    ).toThrow();
    expect(() =>
      s.save({ ...input, bodyProfile: { height_cm: "a".repeat(41) } }, u),
    ).toThrow();
  });
  it("위조/만료 세션 거부", () => {
    const s = new CommunityStore();
    expect(s.viewer("forged")).toBeNull();
    const session = s.login();
    expect(s.viewer(session.token)).toEqual(session.viewer);
    s.sessions.get(session.token)!.expires = 0;
    expect(s.viewer(session.token)).toBeNull();
  });
});
