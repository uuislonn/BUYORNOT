import { fetchProductHtml } from "../../../features/community/product-fetch";
import { validateProductUrl } from "../../../features/community/product";
import { OFFICIAL_PRODUCTS } from "../_content/official-products";
import { SOPHY_SALE_PRODUCTS } from "../_content/sophy-products";
import { PRODUCT_HOSTS } from "../_lib/product-url";
import { PRICE_REFRESH_MS, type LivePrice } from "../_lib/live-price";
import {
  parseLiveProductPricing,
  validateProductPage,
} from "./product-metadata";

const officialUrls = new Set(
  [...OFFICIAL_PRODUCTS, ...SOPHY_SALE_PRODUCTS].map(
    ({ product }) => product.url,
  ),
);

function marketplaceUrl(value: string): URL {
  try {
    const canonical = value.replace(
      /^https:\/\/m\.(musinsa\.com|29cm\.co\.kr)(?=\/)/,
      "https://www.$1",
    );
    const url = new URL(validateProductPage(canonical));
    if (!PRODUCT_HOSTS.some((host) => host === url.hostname))
      throw new Error("Unsupported price source");
    if (url.hostname !== "www.oliveyoung.co.kr") url.search = "";
    return url;
  } catch {
    const url = validateProductUrl(value);
    const productPaths: Record<string, RegExp> = {
      "www.nike.com": /^\/(?:kr\/)?t\/.+/,
      "www.adidas.co.kr": /\.html$/i,
      "www.ssfshop.com": /\/[^/]+\/GM[A-Z0-9]+\/good$/i,
    };
    if (!productPaths[url.hostname]?.test(url.pathname))
      throw new Error("Unsupported product");
    url.search = "";
    return url;
  }
}

export function livePriceTarget(value: string) {
  try {
    const url = marketplaceUrl(value);
    return {
      url,
      official: false,
      validate(candidate: string) {
        const next = marketplaceUrl(candidate);
        if (next.href !== url.href) throw new Error("Product changed");
        return next;
      },
    };
  } catch {
    if (!officialUrls.has(value)) return null;
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || url.port)
      return null;
    return {
      url,
      official: true,
      validate(candidate: string) {
        if (candidate !== url.href) throw new Error("Product changed");
        return url;
      },
    };
  }
}

type PriceEntry = { value: LivePrice | null; retryAt: number };
const cache = new Map<string, PriceEntry>();
const pending = new Map<string, Promise<LivePrice | null>>();

export async function loadLivePrice(
  target: NonNullable<ReturnType<typeof livePriceTarget>>,
) {
  const key = target.url.href;
  const cached = cache.get(key);
  if (cached && cached.retryAt > Date.now()) return cached.value;
  const inFlight = pending.get(key);
  if (inFlight) return inFlight;
  if (pending.size >= 12) return cached?.value ?? null;

  const startedAt = Date.now();
  const task = (async () => {
    let value = cached?.value ?? null;
    try {
      const { html } = await fetchProductHtml(key, undefined, target.validate);
      const pricing = parseLiveProductPricing(html, target.official);
      if (pricing.price !== null) {
        value = {
          ...pricing,
          price: pricing.price,
          checkedAt: new Date().toISOString(),
        };
      }
    } catch {
      // Keep the last confirmed price when the storefront cannot be reached.
    }
    cache.delete(key);
    if (cache.size >= 500) {
      const oldest = cache.keys().next().value;
      if (oldest !== undefined) cache.delete(oldest);
    }
    cache.set(key, { value, retryAt: startedAt + PRICE_REFRESH_MS });
    return value;
  })().finally(() => pending.delete(key));
  pending.set(key, task);
  return task;
}
