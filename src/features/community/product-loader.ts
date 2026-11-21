import { fetchProductHtml } from "./product-fetch";
import { parseProductMetadata } from "./product-metadata";
import { validateProductUrl } from "./product";
import {
  parseProductMetadata as parseCurationProduct,
  validateProductPage,
} from "../../app/(creator)/_server/product-metadata";
import { PRODUCT_HOSTS } from "../../app/(creator)/_lib/product-url";
import { OFFICIAL_PRODUCTS } from "../../app/(creator)/_content/official-products";
import { SOPHY_SALE_PRODUCTS } from "../../app/(creator)/_content/sophy-products";
import { PRODUCT_FIXTURES } from "../../app/(creator)/_server/seed";
import { recommendationsByRoom } from "../../app/(creator)/_server/recommendation-catalog";
import { seedPosts } from "./seed";
import type { Product } from "./types";

const cache = new Map<string, { product: Product; expires: number }>();
const pending = new Map<string, Promise<Product>>();

function productKey(url: URL) {
  try {
    const detail = new URL(validateProductPage(url.href));
    // The path carries the product ID for these stores.
    if (
      detail.hostname !== "www.oliveyoung.co.kr" &&
      PRODUCT_HOSTS.some((host) => host === detail.hostname)
    )
      detail.search = "";
    return detail.href;
  } catch {
    return url.href;
  }
}

const catalog = new Map(
  [
    ...seedPosts.map(({ product }) => product),
    ...PRODUCT_FIXTURES,
    ...OFFICIAL_PRODUCTS.map(({ product }) => product),
    ...SOPHY_SALE_PRODUCTS.map(({ product }) => product),
    ...Object.values(recommendationsByRoom).flat(),
  ]
    .filter((product) => product.name && product.image.startsWith("https://"))
    .reverse()
    .map((product) => [productKey(new URL(product.url)), product]),
);

async function readProductPage(url: string) {
  const match = url.match(/^https:\/\/www\.musinsa\.com\/products\/(\d+)$/);
  if (!match) return fetchProductHtml(url);
  const mobile = `https://m.musinsa.com/products/${match[1]}`;
  // The domestic mobile page publishes the same product and KRW offer.
  return fetchProductHtml(
    mobile,
    undefined,
    (candidate) => {
      if (candidate !== mobile && candidate !== url)
        throw new Error("Unexpected Musinsa redirect");
      return new URL(candidate);
    },
    4500,
  );
}

async function lookup(url: string) {
  try {
    const page = await readProductPage(url);
    let product;
    try {
      product = parseProductMetadata(page.html, page.url, true);
    } catch (primaryError) {
      try {
        const parsed = parseCurationProduct(page.html, page.url.href);
        product = {
          ...parsed,
          domain: page.url.hostname,
          price: parsed.price ?? 0,
        };
      } catch {
        throw primaryError;
      }
    }
    if (cache.size >= 200) cache.delete(cache.keys().next().value!);
    cache.set(url, { product, expires: Date.now() + 5 * 60 * 1000 });
    return product;
  } catch (error) {
    const saved = catalog.get(url);
    if (saved)
      return {
        ...saved,
        domain: new URL(url).hostname,
        price: saved.price ?? 0,
      };
    if (error instanceof Error && /[가-힣]/.test(error.message)) throw error;
    throw new Error(
      "쇼핑몰에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.",
    );
  }
}

export async function loadProduct(input: string): Promise<Product> {
  const url = validateProductUrl(input);
  const key = productKey(url);
  const cached = cache.get(key);
  const found = cached && cached.expires > Date.now() ? cached.product : null;
  if (found)
    return {
      ...found,
      url: url.href,
      domain: url.hostname,
      price: found.price ?? 0,
    };

  let task = pending.get(key);
  if (!task) {
    task = lookup(key).finally(() => pending.delete(key));
    pending.set(key, task);
  }
  const product = await task;
  return { ...product, url: url.href, domain: url.hostname };
}
