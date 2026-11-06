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
    return host === base.hostname || hosts.includes(host) ? url.href : "";
  } catch {
    return "";
  }
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

export function parseProductMetadata(html: string, url: URL): Product {
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
  const id = url.pathname.match(/\/(?:products?|goods)\/(\d+)\/?$/)?.[1];
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
  const price = amount(
    offer?.price ??
      offer?.lowPrice ??
      meta.get("product:price:amount") ??
      meta.get("og:price:amount"),
  );
  const brandObject = object(candidate?.brand);
  const brand = text(
    brandObject?.name ?? candidate?.brand ?? meta.get("product:brand"),
  );
  if (!name || !image || price === null)
    throw new Error(
      "이 상품의 이름·가격·사진을 모두 읽지 못했습니다. 쇼핑몰의 상품 상세 페이지 링크로 다시 시도해 주세요.",
    );
  return {
    url: url.href,
    domain: url.hostname,
    name,
    image,
    price,
    currency: "KRW",
    brand,
  };
}
