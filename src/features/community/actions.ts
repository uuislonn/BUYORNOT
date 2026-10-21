"use server";
import { cookies } from "next/headers";
import { store } from "./store";
import { mockProduct } from "./product";
import type { Choice, PostInput, Result } from "./types";
async function viewer() {
  return store.viewer((await cookies()).get("buyornot-demo")?.value);
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
export async function loginDemo() {
  return result(async () => {
    const session = store.login();
    (await cookies()).set("buyornot-demo", session.token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 86400,
      path: "/",
    });
    return session.viewer;
  });
}
export async function logoutDemo() {
  return result(async () => {
    const jar = await cookies();
    const token = jar.get("buyornot-demo")?.value;
    if (token) store.sessions.delete(token);
    jar.delete("buyornot-demo");
    return null;
  });
}
export async function getProductInfo(url: string) {
  return result(() => mockProduct(url));
}
export async function savePost(input: PostInput, id?: string) {
  return result(async () => store.save(input, await viewer(), id));
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
