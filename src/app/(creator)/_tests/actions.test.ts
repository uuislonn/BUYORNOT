import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const cookieState = vi.hoisted(() => ({ values: new Map<string, string>() }));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      cookieState.values.has(name)
        ? { value: cookieState.values.get(name) }
        : undefined,
    set: (name: string, value: string) => cookieState.values.set(name, value),
  }),
}));
import {
  createCurationRequest,
  deleteCurationRequest,
  evaluateCurationRequest,
  getRoomSnapshot,
  previewProduct,
  reviewCreatorApplication,
  setDemoIdentity,
  toggleCreatorFollow,
  toggleRequestHeart,
} from "../_server/actions";
import { PRODUCT_FIXTURES } from "../_server/seed";
import * as metadata from "../_server/product-metadata";
import type { DemoIdentity, RequestInput } from "../_lib/types";
const input: RequestInput = {
  creatorId: "seoa",
  productUrl: "https://www.musinsa.com/products/90000009",
  productName: "서버 액션 상품",
  productImage: "https://image.msscdn.net/images/goods_img/test.jpg",
  brand: "TEST",
  price: 10000,
  category: "의류",
  concern: "잘 맞을까요?",
  tags: [],
  bodySpec: {},
};
beforeEach(() => {
  cookieState.values.clear();
  vi.stubEnv("NODE_ENV", "test");
});
afterEach(() => {
  vi.unstubAllEnvs();
});
describe("server action session boundary", () => {
  it("keeps the input product link and requests the actual image during preview", async () => {
    await setDemoIdentity("member", "seoa");
    const spy = vi
      .spyOn(metadata, "loadProductMetadata")
      .mockResolvedValueOnce({
        url: input.productUrl,
        image: input.productImage!,
        name: input.productName,
        brand: input.brand,
        price: null,
        category: "의류",
        currency: "KRW",
      });
    expect(await previewProduct(input.productUrl, "seoa")).toMatchObject({
      ok: true,
      data: {
        product: { url: input.productUrl, image: input.productImage },
        warning: null,
      },
    });
    spy.mockRestore();
    expect(await createCurationRequest(input)).toMatchObject({
      ok: true,
      data: {
        requests: expect.arrayContaining([
          expect.objectContaining({
            product: expect.objectContaining({
              url: input.productUrl,
              image: input.productImage,
            }),
          }),
        ]),
      },
    });
  });
  it("shows a manual image fallback when a shop blocks metadata instead of returning sample images", async () => {
    await setDemoIdentity("member", "seoa");
    const spy = vi
      .spyOn(metadata, "loadProductMetadata")
      .mockRejectedValueOnce(new Error("HTTP 403"));
    expect(await previewProduct(input.productUrl, "seoa")).toMatchObject({
      ok: true,
      data: {
        product: { url: input.productUrl, image: "" },
        warning: expect.any(String),
      },
    });
    spy.mockRestore();
  });
  it("rejects creation without a product image", async () => {
    await setDemoIdentity("member", "seoa");
    expect(
      await createCurationRequest({ ...input, productImage: undefined }),
    ).toMatchObject({ ok: false, code: "VALIDATION" });
  });
  it("rejects guest mutation requests even when bypassing UI", async () => {
    const results = await Promise.all([
      createCurationRequest(input),
      deleteCurationRequest("req-1", "seoa"),
      evaluateCurationRequest("req-1", "seoa", "BUY", ""),
      toggleRequestHeart("req-1", "seoa"),
      toggleCreatorFollow("seoa"),
      previewProduct(input.productUrl, "seoa"),
      reviewCreatorApplication("fake", "seoa", true, ""),
    ]);
    for (const result of results)
      expect(result).toMatchObject({ ok: false, code: "UNAUTHENTICATED" });
  });
  it("checks owner authority on the server and keeps failed state unchanged", async () => {
    await setDemoIdentity("member", "seoa");
    const denied = await evaluateCurationRequest(
      "req-1",
      "seoa",
      "BUY",
      "forged owner",
    );
    expect(denied).toMatchObject({ ok: false, code: "FORBIDDEN" });
    expect(
      (await getRoomSnapshot("seoa")).requests.find((r) => r.id === "req-1")
        ?.status,
    ).toBe("ING");
  });
  it("persists a decision across role switches within a session and isolates other sessions", async () => {
    await setDemoIdentity("creator", "seoa");
    expect(
      await evaluateCurationRequest("req-1", "seoa", "BUY", "좋아요"),
    ).toMatchObject({ ok: true });
    await setDemoIdentity("guest", "seoa");
    expect(
      (await getRoomSnapshot("seoa")).requests.find((r) => r.id === "req-1")
        ?.status,
    ).toBe("BUY");
    cookieState.values.clear();
    expect(
      (await getRoomSnapshot("seoa")).requests.find((r) => r.id === "req-1")
        ?.status,
    ).toBe("ING");
  });
  it("rejects unknown demo identities", async () => {
    expect(await setDemoIdentity("root" as DemoIdentity, "seoa")).toMatchObject(
      { ok: false, code: "VALIDATION" },
    );
  });
  it("disables role switching and writes by default in production, including an existing cookie", async () => {
    await setDemoIdentity("admin", "seoa");
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("CREATOR_DEMO_ENABLED", "false");
    expect(await setDemoIdentity("creator", "seoa")).toMatchObject({
      ok: false,
      code: "DEMO_DISABLED",
    });
    expect(await createCurationRequest(input)).toMatchObject({
      ok: false,
      code: "DEMO_DISABLED",
    });
    expect((await getRoomSnapshot("seoa")).demoEnabled).toBe(false);
  });
  it("returns duplicate preview information without requesting a shopping website", async () => {
    await setDemoIdentity("member", "seoa");
    const metadataSpy = vi
      .spyOn(metadata, "loadProductMetadata")
      .mockResolvedValueOnce(PRODUCT_FIXTURES[0]);
    const result = await previewProduct(
      `${PRODUCT_FIXTURES[0].url}?utm_source=link`,
      "seoa",
    );
    expect(result).toMatchObject({
      ok: true,
      data: {
        duplicateId: "req-1",
        product: { image: PRODUCT_FIXTURES[0].image },
        warning: null,
      },
    });
    expect(metadataSpy).toHaveBeenCalledWith(PRODUCT_FIXTURES[0].url);
    metadataSpy.mockRestore();
  });
});
