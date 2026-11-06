import { fetchProductHtml } from "./product-fetch";
import { parseProductMetadata } from "./product-metadata";
import { validateProductUrl } from "./product";
import type { Product } from "./types";

const cache = new Map<string, { product: Product; expires: number }>();

export async function loadProduct(input: string): Promise<Product> {
  const url = validateProductUrl(input).href;
  const saved = cache.get(url);
  if (saved && saved.expires > Date.now())
    return structuredClone(saved.product);
  try {
    const page = await fetchProductHtml(url);
    const product = {
      ...parseProductMetadata(page.html, page.url),
      url,
      domain: new URL(url).hostname,
    };
    if (cache.size >= 200) cache.delete(cache.keys().next().value!);
    cache.set(url, { product, expires: Date.now() + 5 * 60 * 1000 });
    return structuredClone(product);
  } catch (error) {
    if (error instanceof Error && /[가-힣]/.test(error.message)) throw error;
    throw new Error(
      "쇼핑몰에 연결하지 못했습니다. 잠시 후 상품 정보 불러오기를 다시 눌러 주세요.",
    );
  }
}
