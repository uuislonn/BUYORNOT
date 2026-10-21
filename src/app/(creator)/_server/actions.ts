"use server";
import type {
  ApplicationInput,
  Decision,
  DemoIdentity,
  RequestInput,
  Result,
  Snapshot,
} from "../_lib/types";
import { validateProductUrl } from "../_lib/product-url";
import { PRODUCT_FIXTURES } from "./seed";
import * as service from "./service";
import {
  demoEnabled,
  readRoomSnapshot,
  requireSession,
  switchIdentity,
} from "./runtime";
export async function getRoomSnapshot(creatorId: string): Promise<Snapshot> {
  return readRoomSnapshot(creatorId);
}
async function result<T>(fn: () => Promise<T>): Promise<Result<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (error) {
    if (error instanceof service.ServiceError)
      return { ok: false, code: error.code, error: error.message };
    if (error instanceof Error && /URL|HTTPS|쇼핑몰/.test(error.message))
      return { ok: false, code: "VALIDATION", error: error.message };
    console.error(
      "Creator action failed",
      error instanceof Error ? error.name : "UnknownError",
    );
    return {
      ok: false,
      code: "INTERNAL",
      error: "요청을 처리하지 못했어요. 잠시 후 다시 시도해 주세요.",
    };
  }
}
async function mutate(
  creatorId: string,
  fn: (session: Awaited<ReturnType<typeof requireSession>>) => void,
): Promise<Result<Snapshot>> {
  return result(async () => {
    const session = await requireSession();
    // Validate the target room before mutation. Do not trust client actor IDs or roles.
    service.snapshot(session.db, session.actorId, creatorId, demoEnabled());
    fn(session);
    return service.snapshot(
      session.db,
      session.actorId,
      creatorId,
      demoEnabled(),
    );
  });
}
export async function setDemoIdentity(
  identity: DemoIdentity,
  creatorId: string,
): Promise<Result<Snapshot>> {
  return result(async () => {
    await switchIdentity(identity);
    return getRoomSnapshot(creatorId);
  });
}
export async function previewProduct(productUrl: string, creatorId: string) {
  return result(async () => {
    const session = await requireSession();
    const url = validateProductUrl(productUrl);
    const duplicate = session.db.requests.find(
      (r) =>
        r.creatorId === creatorId &&
        r.product.url === url &&
        r.status !== "EXPIRED",
    );
    // TODO: connect to lib/supabase — metadata adapter. Do NOT fetch arbitrary input or follow redirects.
    return {
      product: PRODUCT_FIXTURES.find((p) => p.url === url) ?? {
        url,
        name: "",
        brand: new URL(url).hostname,
        image: "",
        price: null,
        category: "의류" as const,
        currency: "KRW" as const,
      },
      duplicateId: duplicate?.id ?? null,
      isMock: true,
    };
  });
}
export async function createCurationRequest(
  input: RequestInput,
): Promise<Result<Snapshot>> {
  return mutate(input.creatorId, (s) => {
    service.createRequest(s.db, s.actorId, input);
  });
}
export async function updateCurationRequest(
  id: string,
  input: RequestInput,
): Promise<Result<Snapshot>> {
  return mutate(input.creatorId, (s) => {
    if (
      !s.db.requests.some((r) => r.id === id && r.creatorId === input.creatorId)
    )
      throw new service.ServiceError("NOT_FOUND", "요청을 찾을 수 없어요.");
    service.updateRequest(s.db, s.actorId, id, input);
  });
}
export async function deleteCurationRequest(
  id: string,
  creatorId: string,
): Promise<Result<Snapshot>> {
  return mutate(creatorId, (s) => {
    if (!s.db.requests.some((r) => r.id === id && r.creatorId === creatorId))
      throw new service.ServiceError("NOT_FOUND", "요청을 찾을 수 없어요.");
    service.deleteRequest(s.db, s.actorId, id);
  });
}
export async function evaluateCurationRequest(
  id: string,
  creatorId: string,
  decision: Decision,
  comment: string,
): Promise<Result<Snapshot>> {
  return mutate(creatorId, (s) => {
    if (!s.db.requests.some((r) => r.id === id && r.creatorId === creatorId))
      throw new service.ServiceError("NOT_FOUND", "요청을 찾을 수 없어요.");
    service.evaluateRequest(s.db, s.actorId, id, decision, comment);
  });
}
export async function toggleRequestHeart(
  id: string,
  creatorId: string,
): Promise<Result<Snapshot>> {
  return mutate(creatorId, (s) => {
    if (!s.db.requests.some((r) => r.id === id && r.creatorId === creatorId))
      throw new service.ServiceError("NOT_FOUND", "요청을 찾을 수 없어요.");
    service.toggleHeart(s.db, s.actorId, id);
  });
}
export async function toggleCreatorFollow(
  creatorId: string,
): Promise<Result<Snapshot>> {
  return mutate(creatorId, (s) =>
    service.toggleFollow(s.db, s.actorId, creatorId),
  );
}
export async function getApplicationVerificationCode(): Promise<
  Result<string>
> {
  return result(async () => (await requireSession()).verificationCode);
}
export async function submitCreatorApplication(
  input: ApplicationInput,
  creatorId: string,
): Promise<Result<Snapshot>> {
  return mutate(creatorId, (s) => {
    service.submitApplication(s.db, s.actorId, input, s.verificationCode);
  });
}
export async function reviewCreatorApplication(
  id: string,
  creatorId: string,
  approve: boolean,
  reason: string,
): Promise<Result<Snapshot>> {
  return mutate(creatorId, (s) =>
    service.reviewApplication(s.db, s.actorId, id, approve, reason),
  );
}
