import { validateProductImageUrl } from "../../app/(creator)/_lib/product-url";
import {
  offerOriginalPrice,
  productPricing,
} from "../../app/(creator)/_lib/product-price";
import { allowedHosts } from "./product";
import type { Product } from "./types";

type JsonObject = Record<string, unknown>;
const object = (value: unknown): JsonObject | null =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonObject)
    : null;

function decode(value: string): string {
  return value
    .replace(
      /&(#x[\da-f]+|#\d+|amp|quot|apos|lt|gt|nbsp);/gi,
      (entity, code: string) => {
        const named: Record<string, string> = {
          amp: "&",
          quot: '"',
          apos: "'",
          lt: "<",
          gt: ">",
          nbsp: " ",
        };
        if (!code.startsWith("#")) return named[code.toLowerCase()] ?? entity;
        const n =
          code[1].toLowerCase() === "x"
            ? parseInt(code.slice(2), 16)
            : parseInt(code.slice(1), 10);
        return n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : entity;
      },
    )
    .trim();
}
function attributes(tag: string): Record<string, string> {
  return Object.fromEntries(
    [...tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)].map(
      (match) => [
        match[1].toLowerCase(),
        decode(match[2] ?? match[3] ?? match[4]),
      ],
    ),
  );
}
function text(value: unknown): string {
  return typeof value === "string"
    ? decode(value).replace(/\s+/g, " ").slice(0, 300)
    : "";
}
function imageUrl(value: unknown, base: URL): string {
  if (Array.isArray(value)) {
    for (const entry of value) {
      const image = imageUrl(entry, base);
      if (image) return image;
    }
    return "";
  }
  const image = object(value);
  const raw = text(image ? (image.contentUrl ?? image.url) : value);
  if (!raw) return "";
  try {
    const url = new URL(raw, base);
    if (url.protocol !== "https:" || url.username || url.password || url.port)
      return "";
    // Only images served by public shop/CDN hostnames are handed to the browser.
    const host = url.hostname;
    const hosts = [
      "image.msscdn.net",
      "img.29cm.co.kr",
      "image.wconcept.co.kr",
      "static.nike.com",
      "assets.adidas.com",
      "image.oliveyoung.co.kr",
      "img.ssfshop.com",
    ];
    if (host === base.hostname || hosts.includes(host)) return url.href;
    return validateProductImageUrl(url.href, base.href);
  } catch {
    return "";
  }
}
export function validateCommunityProductImage(
  value: string,
  productUrl: string,
) {
  const image = /^https:\/\//i.test(value)
    ? imageUrl(value, new URL(productUrl))
    : "";
  if (!image)
    throw new Error("쇼핑몰 상품 이미지의 HTTPS 주소를 입력해 주세요.");
  return image;
}
function amount(value: unknown): number | null {
  if (typeof value !== "number" && typeof value !== "string") return null;
  const n = Number(
    typeof value === "string" ? value.replace(/[,₩\s]/g, "") : value,
  );
  return Number.isFinite(n) && n > 0 && n <= 1_000_000_000 ? n : null;
}
function products(value: unknown): JsonObject[] {
  if (Array.isArray(value)) return value.flatMap(products);
  const data = object(value);
  if (!data) return [];
  const types = Array.isArray(data["@type"]) ? data["@type"] : [data["@type"]];
  if (types.includes("Product")) return [data];
  return [...products(data["@graph"]), ...products(data.mainEntity)];
}

export function parseProductMetadata(
  html: string,
  url: URL,
  allowMissingPrice = false,
): Product {
  const meta = new Map<string, string>();
  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    const attr = attributes(match[0]);
    const key = attr.property ?? attr.name;
    if (key && attr.content && !meta.has(key.toLowerCase()))
      meta.set(key.toLowerCase(), attr.content);
  }
  const candidates: JsonObject[] = [];
  for (const match of html.matchAll(
    /<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi,
  )) {
    if (attributes(match[1]).type?.toLowerCase() !== "application/ld+json")
      continue;
    try {
      candidates.push(...products(JSON.parse(match[2])));
    } catch {
      /* Ignore invalid unrelated JSON-LD. */
    }
  }
  const id = allowedHosts.includes(url.hostname)
    ? url.pathname.match(/\/(?:products?|goods)\/(\d+)\/?$/)?.[1]
    : undefined;
  const candidate =
    (id
      ? candidates.find(
          (p) => String(p.sku) === id || text(p.url).endsWith(`/${id}`),
        )
      : undefined) ?? (candidates.length === 1 ? candidates[0] : undefined);
  if (candidate && id && candidate.sku && String(candidate.sku) !== id)
    throw new Error(
      "링크와 상품 정보가 일치하지 않습니다. 상품 상세 주소를 다시 확인해 주세요.",
    );
  if (
    !candidate &&
    !allowedHosts.includes(url.hostname) &&
    meta.get("og:type") !== "product"
  )
    throw new Error("상품 상세 페이지에서 공개 상품 정보를 찾지 못했어요.");
  const rawOffers = candidate?.offers;
  const offers = (Array.isArray(rawOffers) ? rawOffers : [rawOffers])
    .map(object)
    .filter((p) => p !== null);
  const offer = offers.find(
    (p) => !p.priceCurrency || p.priceCurrency === "KRW",
  );
  const currency = text(
    offer?.priceCurrency ?? meta.get("product:price:currency"),
  );
  if (currency && currency !== "KRW")
    throw new Error("원화로 표시된 상품 상세 링크를 입력해 주세요.");
  const name = text(candidate?.name ?? meta.get("og:title"));
  const image =
    imageUrl(candidate?.image, url) || imageUrl(meta.get("og:image"), url);
  const saleCurrency = meta.get("product:sale_price:currency");
  const salePrice =
    !saleCurrency || saleCurrency.toUpperCase() === "KRW"
      ? amount(meta.get("product:sale_price:amount"))
      : null;
  const rawPrice =
    salePrice ??
    offer?.price ??
    offer?.lowPrice ??
    meta.get("product:price:amount") ??
    meta.get("og:price:amount");
  const pricing = productPricing(
    amount(rawPrice),
    offerOriginalPrice(offer?.priceSpecification) ??
      meta.get("product:price:normal_price") ??
      meta.get("product:original_price:amount") ??
      (salePrice !== null ? meta.get("product:price:amount") : undefined),
    meta.get("product:price:sale_rate"),
  );
  const { price, originalPrice, discountRate } = pricing;
  const brandObject = object(candidate?.brand);
  const brand = text(
    brandObject?.name ??
      candidate?.brand ??
      meta.get("product:brand") ??
      meta.get("og:site_name"),
  );
  if (!name || !image || (price === null && !allowMissingPrice))
    throw new Error(
      "이 상품의 이름·가격·사진을 모두 읽지 못했습니다. 쇼핑몰의 상품 상세 페이지 링크로 다시 시도해 주세요.",
    );
  return {
    url: url.href,
    domain: url.hostname,
    name,
    image,
    price: price ?? 0,
    ...(discountRate !== null ? { originalPrice, discountRate } : {}),
    currency: "KRW",
    brand,
  };
}
