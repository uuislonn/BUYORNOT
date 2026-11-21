"use server";
import { communityViewer } from "./session";
import {
  loginLocalTest,
  localTestProfile,
  logoutLocalTest,
} from "../../lib/auth/local-test";
import { authConfig } from "../../lib/auth/config";
import { authClient } from "../../lib/auth/server";
import { cookies } from "next/headers";
import { exampleComments } from "./example-comments";
import { store } from "./store";
import { loadProduct } from "./product-loader";
import { validateCommunityProductImage } from "./product-metadata";
import { productIdentity } from "../../app/(creator)/_lib/product-url";
import { productPricing } from "../../app/(creator)/_lib/product-price";
import { retainSituationTags } from "../../app/(creator)/_lib/situations";
import { validateProductUrl } from "./product";
import { revalidatePath } from "next/cache";
import { categories } from "./types";
import type {
  Choice,
  CommentTarget,
  PostInput,
  Product,
  Result,
  Viewer,
} from "./types";
async function viewer(): Promise<Viewer | null> {
  return communityViewer();
}
async function result<T>(fn: () => T | Promise<T>): Promise<Result<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "요청을 처리하지 못했습니다.",
    };
  }
}
export async function loadCommunity() {
  return result(async () => {
    const user = await viewer();
    return {
      viewer: user,
      posts: store.list(user),
      savedIds: store.savedIds(user),
    };
  });
}
// Shares the explicitly configured local accounts with curation and account pages.
export async function loginPreview(identifier: string, password: string) {
  return result(async () => {
    if (await loginLocalTest(identifier.trim(), password)) {
      const local = await localTestProfile();
      if (local) return { id: local.id, nickname: local.nickname };
    }
    throw new Error("아이디 또는 비밀번호가 올바르지 않습니다.");
  });
}
export async function logoutDemo() {
  return result(async () => {
    await logoutLocalTest();
    if (authConfig()) {
      const client = await authClient();
      const { error } = await client.auth.signOut();
      if (error) throw new Error("로그아웃하지 못했습니다.");
    }
    const jar = await cookies();
    const token = jar.get("buyornot-demo")?.value;
    if (token) store.sessions.delete(token);
    jar.delete("buyornot-demo");
    const previewToken = jar.get("buyornot-preview")?.value;
    if (previewToken) store.sessions.delete(previewToken);
    jar.delete("buyornot-preview");
    return null;
  });
}
export async function getProductInfo(url: string) {
  return result(async () => {
    const normalized = validateProductUrl(url).href;
    const identity = productIdentity(normalized);
    const duplicate = [...store.posts.values()].find((post) => {
      if (post.deletedAt || post.visibility !== "PUBLIC") return false;
      try {
        return (
          productIdentity(validateProductUrl(post.product.url).href) ===
          identity
        );
      } catch {
        return false;
      }
    });
    const product = duplicate?.product ?? (await loadProduct(normalized));
    return { ...product, duplicateId: duplicate?.id ?? null };
  });
}
export async function savePost(
  input: PostInput,
  id?: string,
  draft?: Pick<
    Product,
    "name" | "brand" | "image" | "price" | "originalPrice" | "discountRate"
  >,
) {
  return result(async () => {
    const user = store.require(await viewer());
    const previous = id ? store.detail(id, user) : null;
    if (previous && previous.authorId !== user.id)
      throw new Error("본인 게시글만 수정할 수 있습니다.");
    const url = validateProductUrl(input.productUrl);
    const unchangedImage =
      previous?.product.url === url.href &&
      previous.product.image === draft?.image;
    let product: Product;
    if (draft) {
      if (
        typeof draft.name !== "string" ||
        !draft.name.trim() ||
        draft.name.length > 100 ||
        typeof draft.brand !== "string" ||
        !draft.brand.trim() ||
        draft.brand.length > 50 ||
        !Number.isSafeInteger(draft.price) ||
        draft.price < 0 ||
        draft.price > 100_000_000
      )
        throw new Error("상품명과 브랜드, 가격을 확인해 주세요.");
      const { originalPrice, discountRate } = productPricing(
        draft.price,
        draft.originalPrice,
        draft.discountRate,
      );
      product = {
        url: url.href,
        domain: url.hostname,
        name: draft.name.trim(),
        brand: draft.brand.trim(),
        image: unchangedImage
          ? previous.product.image
          : validateCommunityProductImage(draft.image, url.href),
        price: draft.price,
        ...(discountRate !== null ? { originalPrice, discountRate } : {}),
        currency: "KRW",
      };
    } else {
      product =
        previous?.product.url === url.href
          ? previous.product
          : await loadProduct(input.productUrl);
    }
    const tags =
      categories.slice(1).includes(input.category) && Array.isArray(input.tags)
        ? retainSituationTags(
            input.tags.filter((tag) => typeof tag === "string"),
            input.category === "명품" ? "잡화" : input.category,
          )
        : previous?.tags;
    return store.save(
      { ...input, tags },
      user,
      id,
      product,
      draft ? input.bodyProfile?.body_type : undefined,
    );
  });
}
export async function deletePost(id: string) {
  return result(async () => store.remove(id, await viewer()));
}
export async function votePost(id: string, choice: Choice) {
  return result(async () => store.vote(id, choice, await viewer()));
}
export async function getPost(id: string) {
  return result(async () => store.open(id, await viewer()));
}

export async function setCommunityProductSaved(id: string, saved: boolean) {
  return result(async () => {
    const value = store.saveProduct(id, saved === true, await viewer());
    revalidatePath("/account");
    return value;
  });
}
async function discussionContext(target: CommentTarget) {
  if (target.kind === "community") {
    const user = await viewer();
    store.detail(target.postId, user);
    return {
      target: { kind: "community", postId: target.postId } as const,
      user,
    };
  }
  if (target.kind !== "curation") throw new Error("게시글을 찾을 수 없습니다.");
  const { readRoomSnapshot } =
    await import("../../app/(creator)/_server/runtime");
  const room = await readRoomSnapshot(target.roomId);
  if (!room.requests.some((request) => request.id === target.postId))
    throw new Error("게시글을 찾을 수 없습니다.");
  return {
    target: {
      kind: "curation",
      roomId: room.creator.id,
      postId: target.postId,
    } as const,
    user: room.viewer,
  };
}
export async function loadDiscussion(target: CommentTarget) {
  return result(async () => {
    const context = await discussionContext(target);
    return {
      comments: [
        ...exampleComments(context.target),
        ...store.listComments(context.target),
      ],
      canComment: !!context.user,
    };
  });
}
export async function submitDiscussionComment(
  target: CommentTarget,
  body: string,
) {
  return result(async () => {
    const context = await discussionContext(target);
    return store.addComment(context.target, body, context.user);
  });
}
