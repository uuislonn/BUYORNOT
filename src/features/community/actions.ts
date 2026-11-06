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
import { store } from "./store";
import { loadProduct } from "./product-loader";
import { validateProductUrl } from "./product";
import type { Choice, PostInput, Result, Viewer } from "./types";
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
    return { viewer: user, posts: store.list(user) };
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
  return result(() => loadProduct(url));
}
export async function savePost(input: PostInput, id?: string) {
  return result(async () => {
    const user = store.require(await viewer());
    const previous = id ? store.detail(id, user) : null;
    if (previous && previous.authorId !== user.id)
      throw new Error("본인 게시글만 수정할 수 있습니다.");
    const product =
      previous?.product.url === validateProductUrl(input.productUrl).href
        ? previous.product
        : await loadProduct(input.productUrl);
    return store.save(input, user, id, product);
  });
}
export async function deletePost(id: string) {
  return result(async () => store.remove(id, await viewer()));
}
export async function votePost(id: string, choice: Choice) {
  return result(async () => store.vote(id, choice, await viewer()));
}
export async function getPost(id: string) {
  return result(async () => store.detail(id, await viewer()));
}
