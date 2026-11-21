"use server";
import {
  localTestProfile,
  persistLocalTestDatabase,
} from "../../../lib/auth/local-test";
import { store } from "../../../features/community/store";
import { revalidatePath } from "next/cache";
import { authConfig } from "../../../lib/auth/config";
import { requirePostContext, savePost } from "./posts";
import type {
  ApplicationInput,
  Decision,
  DemoIdentity,
  Product,
  RequestInput,
  Result,
  Snapshot,
} from "../_lib/types";
import { validateProductPage } from "./product-metadata";
import { loadProduct } from "../../../features/community/product-loader";
import { productIdentity } from "../_lib/product-url";
import { itemCategory } from "../_lib/product-category";
import * as service from "./service";
import {
  demoEnabled,
  readRoomSnapshot,
  requireSession,
  switchIdentity,
  withRequestViews,
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
    if (await localTestProfile()) {
      persistLocalTestDatabase();
      // Return the same capabilities as the initial page load after every mutation.
      return readRoomSnapshot(creatorId);
    }
    return withRequestViews(
      service.snapshot(session.db, session.actorId, creatorId, demoEnabled()),
    );
  });
}
export async function recordRequestView(creatorId: string, requestId: string) {
  return result(async () => {
    const room = await readRoomSnapshot(creatorId);
    if (!room.requests.some((request) => request.id === requestId))
      throw new service.ServiceError("NOT_FOUND", "고민을 찾을 수 없어요.");
    return store.recordCurationView(room.creator.id, requestId);
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
export async function previewProduct(
  productUrl: string,
  creatorId: string,
): Promise<
  Result<{
    product: Product;
    duplicateId: string | null;
    warning: string | null;
  }>
> {
  return result(async () => {
    const session =
      authConfig() && !(await localTestProfile())
        ? await requirePostContext(creatorId)
        : await requireSession();
    const url = validateProductPage(productUrl);
    const identity = productIdentity(url);
    const duplicate = session.db.requests.find((request) => {
      if (request.creatorId !== creatorId || request.status === "EXPIRED")
        return false;
      try {
        return (
          productIdentity(validateProductPage(request.product.url)) === identity
        );
      } catch {
        return false;
      }
    });
    if (duplicate)
      return {
        product: duplicate.product,
        duplicateId: duplicate.id,
        warning: null,
      };
    let product;
    let warning: string | null = null;
    try {
      const loaded = await loadProduct(url);
      product = {
        ...loaded,
        name: loaded.name.slice(0, 100),
        brand: loaded.brand.slice(0, 50) || new URL(url).hostname,
        price: loaded.price || null,
        category:
          new URL(url).hostname === "www.oliveyoung.co.kr"
            ? "뷰티"
            : itemCategory(loaded.name),
      };
    } catch {
      product = {
        url,
        name: "",
        brand: new URL(url).hostname,
        image: "",
        price: null,
        category: "의류" as const,
        currency: "KRW" as const,
      };
      warning =
        "쇼핑몰에서 대표 이미지를 불러오지 못했어요. 상품 페이지의 첫 번째 이미지 주소와 상품명을 직접 입력해 주세요.";
    }
    return { product, duplicateId: null, warning };
  });
}
export async function createCurationRequest(
  input: RequestInput,
): Promise<Result<Snapshot>> {
  return result(async () => {
    if (!authConfig()) await requireSession();
    validateProductPage(input.productUrl);
    if (!input.productImage)
      throw new service.ServiceError(
        "VALIDATION",
        "상품 대표 이미지를 확인한 후 등록해 주세요.",
      );
    if (authConfig() && !(await localTestProfile())) {
      await savePost("create", input.creatorId, input);
      revalidatePath("/account");
      return readRoomSnapshot(input.creatorId);
    }
    const response = await mutate(input.creatorId, (s) => {
      service.createRequest(s.db, s.actorId, input);
    });
    if (!response.ok)
      throw new service.ServiceError(response.code, response.error);
    return response.data;
  });
}
export async function updateCurationRequest(
  id: string,
  input: RequestInput,
): Promise<Result<Snapshot>> {
  if (authConfig() && !(await localTestProfile()))
    return result(async () => {
      await savePost("update", input.creatorId, input, id);
      revalidatePath("/account");
      return readRoomSnapshot(input.creatorId);
    });
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
  if (authConfig() && !(await localTestProfile()))
    return result(async () => {
      await savePost("delete", creatorId, undefined, id);
      revalidatePath("/account");
      return readRoomSnapshot(creatorId);
    });
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
export async function holdCurationRequest(
  id: string,
  creatorId: string,
): Promise<Result<Snapshot>> {
  return mutate(creatorId, (session) => {
    if (
      !session.db.requests.some(
        (request) => request.id === id && request.creatorId === creatorId,
      )
    )
      throw new service.ServiceError("NOT_FOUND", "요청을 찾을 수 없어요.");
    service.holdRequest(session.db, session.actorId, id);
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

export async function updateCreatorRoom(
  creatorId: string,
  input: { title: string; bio: string },
): Promise<Result<Snapshot>> {
  const response = await mutate(creatorId, ({ db, actorId }) =>
    service.updateRoom(db, actorId, creatorId, input),
  );
  if (response.ok) {
    revalidatePath(`/creators/${creatorId}`);
    revalidatePath(`/creators/${creatorId}/manage`);
  }
  return response;
}
