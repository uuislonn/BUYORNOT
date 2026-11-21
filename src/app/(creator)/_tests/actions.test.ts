import { beforeEach, expect, it, vi } from "vitest";
import { createSeed } from "../_server/seed";
import { snapshot } from "../_server/service";

const mocks = vi.hoisted(() => ({
  session: vi.fn(),
  readSnapshot: vi.fn(),
  persist: vi.fn(),
  profile: vi.fn(),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("../../../lib/auth/local-test", () => ({
  localTestProfile: mocks.profile,
  persistLocalTestDatabase: mocks.persist,
}));
vi.mock("../../../lib/auth/config", () => ({ authConfig: () => null }));
vi.mock("../_server/posts", () => ({
  requirePostContext: vi.fn(),
  savePost: vi.fn(),
}));
vi.mock("../_server/runtime", () => ({
  demoEnabled: () => false,
  requireSession: mocks.session,
  readRoomSnapshot: mocks.readSnapshot,
  switchIdentity: vi.fn(),
  withRequestViews: (room: unknown) => room,
}));
import {
  evaluateCurationRequest,
  recordRequestView,
  toggleRequestHeart,
  toggleCreatorFollow,
} from "../_server/actions";

beforeEach(() => vi.clearAllMocks());
it("keeps creator participation enabled after a heart and consecutive BUY / NOT decisions", async () => {
  const db = createSeed();
  const actorId = db.creators[0].ownerId;
  mocks.profile.mockResolvedValue(db.profiles.find((p) => p.id === actorId));
  mocks.session.mockResolvedValue({ db, actorId });
  mocks.readSnapshot.mockImplementation(async (creatorId: string) => ({
    ...snapshot(db, actorId, creatorId, false),
    localTest: true,
    postsEnabled: true,
  }));
  const requests = db.requests
    .filter((r) => r.creatorId === "seoa" && r.status === "ING")
    .slice(0, 2);
  expect(requests).toHaveLength(2);
  const results = [
    await toggleRequestHeart(requests[0].id, "seoa"),
    await evaluateCurationRequest(requests[0].id, "seoa", "BUY", "추천해요"),
    await evaluateCurationRequest(
      requests[1].id,
      "seoa",
      "NOT",
      "다른 상품을 추천해요",
    ),
  ];
  for (const result of results) {
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.localTest).toBe(true);
      expect(result.data.postsEnabled).toBe(true);
      expect(result.data.viewer?.id).toBe(actorId);
    }
  }
  expect(db.requests.find((r) => r.id === requests[0].id)?.status).toBe("BUY");
  expect(db.requests.find((r) => r.id === requests[1].id)?.status).toBe("NOT");
  expect(mocks.persist).toHaveBeenCalledTimes(3);
});

it("persists follow and unfollow without changing other members' follows", async () => {
  const db = createSeed();
  const actorId = "member";
  db.follows.seoa = ["sample-1"];
  mocks.profile.mockResolvedValue(
    db.profiles.find((profile) => profile.id === actorId),
  );
  mocks.session.mockResolvedValue({ db, actorId });
  mocks.readSnapshot.mockImplementation(async (id: string) => ({
    ...snapshot(db, actorId, id, false),
    localTest: true,
    postsEnabled: true,
  }));
  const added = await toggleCreatorFollow("seoa");
  expect(added.ok && added.data.following).toBe(true);
  expect(db.follows.seoa).toEqual(["sample-1", "member"]);
  const removed = await toggleCreatorFollow("seoa");
  expect(removed.ok && removed.data.following).toBe(false);
  expect(db.follows.seoa).toEqual(["sample-1"]);
  expect(mocks.persist).toHaveBeenCalledTimes(2);
});

it("counts views only for a request in the selected room", async () => {
  const room = snapshot(createSeed(), null, "seoa", false);
  mocks.readSnapshot.mockResolvedValue(room);
  expect(await recordRequestView("seoa", "unknown")).toMatchObject({
    ok: false,
    code: "NOT_FOUND",
  });
  const id = room.requests[0].id;
  expect(await recordRequestView("seoa", id)).toEqual({ ok: true, data: 1 });
  expect(await recordRequestView("seoa", id)).toEqual({ ok: true, data: 2 });
});
