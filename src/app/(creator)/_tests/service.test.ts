import { beforeEach, describe, expect, it } from "vitest";
import { createSeed } from "../_server/seed";
import * as service from "../_server/service";
import { effectiveStatus, meetsFastTrack, REQUEST_TTL } from "../_lib/policy";
import type { ApplicationInput, Database, RequestInput } from "../_lib/types";
const NOW = Date.parse("2026-10-21T10:00:00Z");
let db: Database;
const input = (): RequestInput => ({
  creatorId: "seoa",
  productUrl: "https://www.musinsa.com/products/90000001",
  productName: "테스트 코트",
  brand: "TEST",
  price: 120000,
  category: "의류",
  concern: "출근용으로 괜찮을까요?",
  tags: ["출근룩"],
  bodySpec: { height_cm: 158 },
});
const application = (): ApplicationInput => ({
  roomTitle: "새로운 취향",
  bio: "오래 입을 옷을 골라요.",
  channelType: "Instagram",
  channelUrl: "https://www.instagram.com/test/",
  followers: 500,
  contentCount: 10,
  verificationCode: "BON-TEST",
  consent: true,
});
beforeEach(() => {
  db = createSeed(NOW);
});
function errorCode(fn: () => unknown, code: string) {
  try {
    fn();
    throw new Error("Expected service rejection");
  } catch (error) {
    expect(error).toBeInstanceOf(service.ServiceError);
    expect((error as service.ServiceError).code).toBe(code);
  }
}
describe("server-side participation and ownership", () => {
  it("denies guest create, heart, follow, evaluation and application", () => {
    for (const action of [
      () => service.createRequest(db, null, input(), NOW),
      () => service.toggleHeart(db, null, "req-1"),
      () => service.toggleFollow(db, null, "seoa"),
      () => service.evaluateRequest(db, null, "req-1", "BUY", "", NOW),
      () => service.submitApplication(db, null, application(), "BON-TEST", NOW),
    ])
      errorCode(action, "UNAUTHENTICATED");
  });
  it("stores only explicitly disclosed body attributes and server-owned identity", () => {
    const value = {
      ...input(),
      bodySpec: { height_cm: 158, secret: "never store" },
      authorId: "admin",
      status: "BUY",
    };
    const id = service.createRequest(db, "member", value, NOW);
    const created = db.requests.find((r) => r.id === id)!;
    expect(created.authorId).toBe("member");
    expect(created.status).toBe("ING");
    expect(created.bodySpec).toEqual({ height_cm: 158 });
  });
  it("allows author edit but rejects another user and immutable product links", () => {
    const id = service.createRequest(db, "member", input(), NOW);
    errorCode(
      () => service.updateRequest(db, "sample-1", id, input(), NOW),
      "FORBIDDEN",
    );
    service.updateRequest(
      db,
      "member",
      id,
      { ...input(), concern: "수정한 고민", bodySpec: {} },
      NOW,
    );
    expect(db.requests.find((r) => r.id === id)?.concern).toBe("수정한 고민");
    expect(db.requests.find((r) => r.id === id)?.bodySpec).toEqual({});
    errorCode(
      () =>
        service.updateRequest(
          db,
          "member",
          id,
          { ...input(), productUrl: "https://www.musinsa.com/products/other" },
          NOW,
        ),
      "VALIDATION",
    );
  });
  it("allows only author deletion and removes linked catalog/evaluation state", () => {
    errorCode(() => service.deleteRequest(db, "creator", "req-5"), "FORBIDDEN");
    service.toggleHeart(db, "member", "req-5");
    service.deleteRequest(db, "member", "req-5");
    expect(db.requests.some((r) => r.id === "req-5")).toBe(false);
    expect(db.evaluations.some((e) => e.requestId === "req-5")).toBe(false);
    expect(db.hearts["req-5"]).toBeUndefined();
  });
  it("toggles hearts and follows without adding duplicate membership", () => {
    service.toggleHeart(db, "member", "req-1");
    service.toggleFollow(db, "member", "seoa");
    const state = service.snapshot(db, "member", "seoa", true, NOW);
    expect(state.likedIds).toContain("req-1");
    expect(state.following).toBe(true);
    expect(state.followerCount).toBe(1);
    service.toggleHeart(db, "member", "req-1");
    service.toggleFollow(db, "member", "seoa");
    expect(service.snapshot(db, "member", "seoa", true, NOW).following).toBe(
      false,
    );
    expect(db.hearts["req-1"]).toEqual([]);
  });
});
describe("request validation and expiry", () => {
  it("rejects 151 characters and accepts exactly 150", () => {
    errorCode(
      () =>
        service.createRequest(
          db,
          "member",
          { ...input(), concern: "가".repeat(151) },
          NOW,
        ),
      "VALIDATION",
    );
    expect(
      service.createRequest(
        db,
        "member",
        { ...input(), concern: "가".repeat(150) },
        NOW,
      ),
    ).toBeTruthy();
  });
  it.each([
    { price: -1 },
    { price: 1.5 },
    { category: "전체" },
    { tags: ["1", "2", "3", "4", "5"] },
    { bodySpec: { height_cm: 10 } },
  ])("rejects malformed metadata %j", (patch) => {
    errorCode(
      () =>
        service.createRequest(
          db,
          "member",
          { ...input(), ...patch } as RequestInput,
          NOW,
        ),
      "VALIDATION",
    );
  });
  it("rejects duplicate canonical links including tracking parameters", () => {
    service.createRequest(db, "member", input(), NOW);
    errorCode(
      () =>
        service.createRequest(
          db,
          "sample-1",
          {
            ...input(),
            productUrl: input().productUrl + "?utm_source=test#top",
          },
          NOW,
        ),
      "DUPLICATE",
    );
  });
  it("expires precisely at 30 days and preserves completed decisions", () => {
    const base = db.requests[0];
    expect(
      effectiveStatus(base, Date.parse(base.createdAt) + REQUEST_TTL - 1),
    ).toBe("ING");
    expect(
      effectiveStatus(base, Date.parse(base.createdAt) + REQUEST_TTL),
    ).toBe("EXPIRED");
    expect(effectiveStatus({ ...base, status: "BUY" }, NOW + REQUEST_TTL)).toBe(
      "BUY",
    );
    service.expireRequests(db, NOW);
    expect(db.requests.find((r) => r.id === "req-7")?.status).toBe("EXPIRED");
    errorCode(
      () => service.evaluateRequest(db, "creator", "req-7", "BUY", "", NOW),
      "CONFLICT",
    );
    errorCode(
      () =>
        service.updateRequest(
          db,
          "sample-2",
          "req-7",
          {
            ...input(),
            productUrl: db.requests.find((r) => r.id === "req-7")!.product.url,
          },
          NOW,
        ),
      "CONFLICT",
    );
  });
});
describe("creator decisions", () => {
  it.each(["member", "admin", "sample-1"])(
    "rejects non-owner identity %s",
    (actor) => {
      errorCode(
        () => service.evaluateRequest(db, actor, "req-1", "BUY", "", NOW),
        "FORBIDDEN",
      );
    },
  );
  it("rejects a creator who owns another room", () => {
    db.profiles[1].role = "CREATOR";
    errorCode(
      () => service.evaluateRequest(db, "member", "req-1", "BUY", "", NOW),
      "FORBIDDEN",
    );
  });
  it("atomically creates BUY decision and exposes it on subsequent room reads", () => {
    service.evaluateRequest(db, "creator", "req-1", "BUY", "おすすめです", NOW);
    const state = service.snapshot(db, null, "seoa", true, NOW);
    expect(state.requests.find((r) => r.id === "req-1")?.status).toBe("BUY");
    expect(
      state.evaluations.find((r) => r.requestId === "req-1")?.comment,
    ).toBe("おすすめです");
    errorCode(
      () => service.evaluateRequest(db, "creator", "req-1", "NOT", "変更", NOW),
      "CONFLICT",
    );
    expect(db.evaluations.filter((e) => e.requestId === "req-1")).toHaveLength(
      1,
    );
  });
  it("rejects invalid or overlong decisions without partially changing state", () => {
    errorCode(
      () =>
        service.evaluateRequest(
          db,
          "creator",
          "req-1",
          "BUY",
          "가".repeat(151),
          NOW,
        ),
      "VALIDATION",
    );
    expect(db.requests[0].status).toBe("ING");
    expect(db.evaluations).toHaveLength(3);
  });
});
describe("creator applications", () => {
  it.each([
    [499, 10, false],
    [500, 9, false],
    [500, 10, true],
    [501, 11, true],
  ])("fast-track boundary %s / %s", (followers, contentCount, expected) => {
    expect(meetsFastTrack({ followers, contentCount })).toBe(expected);
  });
  it("keeps fast-track submissions pending until an admin review", () => {
    const id = service.submitApplication(
      db,
      "member",
      application(),
      "BON-TEST",
      NOW,
    );
    expect(db.applications.find((a) => a.id === id)?.status).toBe("PENDING");
    expect(db.profiles[1].role).toBe("USER");
    errorCode(
      () => service.reviewApplication(db, "creator", id, true, ""),
      "FORBIDDEN",
    );
    service.reviewApplication(db, "admin", id, true, "");
    expect(db.profiles[1]).toMatchObject({ role: "CREATOR", verified: true });
    const room = db.creators.find((c) => c.ownerId === "member")!;
    expect(
      service.snapshot(db, "member", room.id, true, NOW).owner.verified,
    ).toBe(true);
    errorCode(
      () => service.reviewApplication(db, "admin", id, true, ""),
      "CONFLICT",
    );
  });
  it("requires server-issued code, matching channel, consent and a unique pending application", () => {
    errorCode(
      () =>
        service.submitApplication(
          db,
          "member",
          { ...application(), verificationCode: "invented" },
          "BON-TEST",
          NOW,
        ),
      "VALIDATION",
    );
    errorCode(
      () =>
        service.submitApplication(
          db,
          "member",
          { ...application(), channelUrl: "https://evil.example/account" },
          "BON-TEST",
          NOW,
        ),
      "VALIDATION",
    );
    errorCode(
      () =>
        service.submitApplication(
          db,
          "member",
          { ...application(), consent: false },
          "BON-TEST",
          NOW,
        ),
      "VALIDATION",
    );
    service.submitApplication(db, "member", application(), "BON-TEST", NOW);
    errorCode(
      () =>
        service.submitApplication(db, "member", application(), "BON-TEST", NOW),
      "CONFLICT",
    );
  });
  it("requires rejection reason and permits a new application after rejection", () => {
    const id = service.submitApplication(
      db,
      "member",
      application(),
      "BON-TEST",
      NOW,
    );
    errorCode(
      () => service.reviewApplication(db, "admin", id, false, ""),
      "VALIDATION",
    );
    service.reviewApplication(
      db,
      "admin",
      id,
      false,
      "활동 내역을 보완해 주세요",
    );
    expect(db.profiles[1].role).toBe("USER");
    expect(
      service.submitApplication(db, "member", application(), "BON-TEST", NOW),
    ).not.toBe(id);
  });
  it("does not expose applicant records to other users", () => {
    service.submitApplication(db, "member", application(), "BON-TEST", NOW);
    expect(service.snapshot(db, null, "seoa", true, NOW).applications).toEqual(
      [],
    );
    expect(
      service.snapshot(db, "creator", "seoa", true, NOW).ownApplication,
    ).toBeNull();
    expect(
      service.snapshot(db, "admin", "seoa", true, NOW).applications,
    ).toHaveLength(1);
  });
});
