import { validateProductUrl } from "../_lib/product-url";
import type { CurationRequest, Product } from "../_lib/types";
import { recommendationsByRoom } from "./recommendation-catalog";

function productKey(value: string): string {
  const musinsaId = value.match(
    /^https:\/\/(?:www\.|m\.)?musinsa\.com\/(?:products|app\/goods)\/(\d+)(?:[/?#]|$)/,
  )?.[1];
  if (musinsaId) return musinsaId;
  try {
    return validateProductUrl(value);
  } catch {
    return value;
  }
}

export function roomRecommendations(
  creatorId: string,
  requests: readonly CurationRequest[],
): Product[] {
  const used = new Set(requests.map((post) => productKey(post.product.url)));
  return (recommendationsByRoom[creatorId] ?? []).filter(
    (product) => !used.has(productKey(product.url)),
  );
}
