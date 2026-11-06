import { resolve4 } from "node:dns/promises";
import { request } from "node:https";
import {
  validateProductUrl,
  validateProductImageUrl,
} from "../_lib/product-url";
import { productPricing } from "../_lib/product-price";
import { PRODUCT_FIXTURES } from "./seed";
import type { Product } from "../_lib/types";

export function isPublicIPv4(address: string): boolean {
  const parts = address.split(".").map(Number);
  if (
    parts.length !== 4 ||
    parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255)
  )
    return false;
  const [a, b] = parts;
  return !(
    a === 0 ||
    a === 10 ||
    a === 127 ||
    a >= 224 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && [0, 168].includes(b)) ||
    (a === 198 && [18, 19, 51].includes(b)) ||
    (a === 203 && b === 0)
  );
}

export function validateProductPage(value: string): string {
  const normalized = validateProductUrl(value);
  const url = new URL(normalized);
  const valid = url.hostname.endsWith("musinsa.com")
    ? /^\/products\/\d+$/.test(url.pathname)
    : url.hostname.endsWith("29cm.co.kr")
      ? /^\/(?:products|catalog)\/\d+$/.test(url.pathname)
      : /^\/Product\/\d+$/i.test(url.pathname);
  if (!valid)
    throw new Error("쇼핑몰 홈이 아닌 개별 상품 상세 URL을 입력해 주세요.");
  return normalized;
}

// Resolve once and connect to that public address. Never follow redirects or fetch images server-side.
async function readProductHtml(value: string): Promise<string> {
  const url = new URL(validateProductPage(value));
  const addresses = await resolve4(url.hostname);
  if (!addresses.length || addresses.some((address) => !isPublicIPv4(address)))
    throw new Error("Unsafe address");
  return new Promise((resolve, reject) => {
    const req = request(
      url,
      {
        method: "GET",
        family: 4,
        lookup: (_host, _options, callback) => callback(null, addresses[0], 4),
        headers: {
          Accept: "text/html",
          "Accept-Encoding": "identity",
          "User-Agent": "BUYORNOT-ProductPreview/1.0",
        },
        signal: AbortSignal.timeout(8000),
      },
      (res) => {
        if (
          res.statusCode !== 200 ||
          !res.headers["content-type"]?.includes("text/html")
        ) {
          res.destroy();
          reject(new Error("Product page unavailable"));
          return;
        }
        const chunks: Buffer[] = [];
        let size = 0;
        res.on("data", (chunk: Buffer) => {
          size += chunk.length;
          if (size > 2 * 1024 * 1024) {
            res.destroy(new Error("Page too large"));
            return;
          }
          chunks.push(chunk);
        });
        res.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
        res.on("error", reject);
      },
    );
    req.on("error", reject);
    req.end();
  });
}
function decode(value: string): string {
  return value.replace(
    /&(?:amp|quot|apos|lt|gt|#\d+|#x[\da-f]+);/gi,
    (entity) => {
      const named: Record<string, string> = {
        "&amp;": "&",
        "&quot;": '"',
        "&apos;": "'",
        "&lt;": "<",
        "&gt;": ">",
      };
      if (named[entity.toLowerCase()]) return named[entity.toLowerCase()];
      const code = entity.toLowerCase().startsWith("&#x")
        ? parseInt(entity.slice(3), 16)
        : parseInt(entity.slice(2), 10);
      return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : "";
    },
  );
}
export function parseProductMetadata(
  html: string,
  productUrl: string,
): Product {
  const url = validateProductPage(productUrl);
  const meta = new Map<string, string>();
  for (const tag of html.matchAll(/<meta\b[^>]*>/gi)) {
    const attrs = new Map<string, string>();
    for (const attr of tag[0].matchAll(
      /([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g,
    ))
      attrs.set(attr[1].toLowerCase(), decode(attr[2] ?? attr[3] ?? attr[4]));
    const key = attrs.get("property") ?? attrs.get("name");
    if (key && !meta.has(key.toLowerCase()))
      meta.set(key.toLowerCase(), attrs.get("content") ?? "");
  }
  let structured: Record<string, unknown> | undefined;
  function visit(value: unknown): void {
    if (!value || typeof value !== "object" || structured) return;
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    const row = value as Record<string, unknown>;
    if (
      row["@type"] === "Product" ||
      (Array.isArray(row["@type"]) && row["@type"].includes("Product"))
    ) {
      structured = row;
      return;
    }
    if (row["@graph"]) visit(row["@graph"]);
  }
  for (const script of html.matchAll(
    /<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  )) {
    try {
      visit(JSON.parse(script[1]));
    } catch {
      /* Ignore malformed optional JSON-LD. */
    }
  }
  const imageValue = structured?.image;
  const firstImage = Array.isArray(imageValue) ? imageValue[0] : imageValue;
  const image =
    typeof firstImage === "string"
      ? firstImage
      : firstImage && typeof firstImage === "object"
        ? String((firstImage as Record<string, unknown>).url ?? "")
        : "";
  const candidate =
    image || meta.get("og:image") || meta.get("twitter:image") || "";
  const name = String(structured?.name ?? meta.get("og:title") ?? "")
    .trim()
    .slice(0, 100);
  if (!candidate || !name) throw new Error("Product metadata missing");
  const brand = structured?.brand;
  const brandName =
    typeof brand === "string"
      ? brand
      : brand && typeof brand === "object"
        ? String((brand as Record<string, unknown>).name ?? "")
        : "";
  const rawOffers = structured?.offers;
  const offers = Array.isArray(rawOffers) ? rawOffers[0] : rawOffers;
  const offer =
    offers && typeof offers === "object"
      ? (offers as Record<string, unknown>)
      : {};
  const metaCurrency =
    meta.get("product:price:currency") ?? meta.get("og:price:currency");
  const metaAmount =
    !metaCurrency || metaCurrency.toUpperCase() === "KRW"
      ? (meta.get("product:price:amount") ?? meta.get("og:price:amount"))
      : undefined;
  const offerAmount =
    !offer.priceCurrency || offer.priceCurrency === "KRW"
      ? offer.price
      : undefined;
  const pricing = productPricing(
    metaAmount ?? offerAmount,
    meta.get("product:price:normal_price") ??
      meta.get("product:original_price:amount"),
    meta.get("product:price:sale_rate"),
  );
  return {
    url,
    name,
    brand: brandName.slice(0, 50) || new URL(url).hostname,
    image: validateProductImageUrl(new URL(candidate, url).href),
    ...pricing,
    category: "의류",
    currency: "KRW",
  };
}
const cache = new Map<string, { product: Product; expires: number }>();
export async function loadProductMetadata(value: string): Promise<Product> {
  const url = validateProductPage(value);
  const verified = PRODUCT_FIXTURES.find((product) => product.url === url);
  const cached = cache.get(url);
  if (cached && cached.expires > Date.now()) return { ...cached.product };
  let product: Product;
  try {
    product = parseProductMetadata(await readProductHtml(url), url);
  } catch (error) {
    if (!verified) throw error;
    // Keep a verified image available, but do not advertise a cached seed price after a failed live lookup.
    return {
      ...verified,
      price: null,
      originalPrice: null,
      discountRate: null,
    };
  }
  if (verified) {
    product.category = verified.category;
    if (product.brand === new URL(url).hostname) product.brand = verified.brand;
  }
  if (cache.size >= 200) cache.delete(cache.keys().next().value!);
  cache.set(url, { product, expires: Date.now() + 10 * 60 * 1000 });
  return { ...product };
}
