import { OFFICIAL_PRODUCTS } from "../_content/official-products";
import { SOPHY_SALE_PRODUCTS } from "../_content/sophy-products";
// Known storefronts use explicit URL and metadata rules.
export const PRODUCT_HOSTS = [
  "musinsa.com",
  "m.musinsa.com",
  "www.musinsa.com",
  "29cm.co.kr",
  "m.29cm.co.kr",
  "www.29cm.co.kr",
  "product.29cm.co.kr",
  "www.wconcept.co.kr",
  "wconcept.co.kr",
  "oliveyoung.co.kr",
  "www.oliveyoung.co.kr",
  "m.oliveyoung.co.kr",
] as const;
export function oliveYoungProductUrl(url: URL): URL {
  const goodsNo = url.searchParams.get("goodsNo");
  if (
    !/^\/(?:store|m)\/goods\/getGoodsDetail\.do$/.test(url.pathname) ||
    !goodsNo ||
    !/^A[0-9]{12}$/.test(goodsNo)
  ) {
    throw new Error("올리브영 상품 상세 링크를 입력해 주세요.");
  }
  return new URL(
    `https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=${goodsNo}`,
  );
}

export function isPublicProductHostname(hostname: string): boolean {
  return (
    /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:[a-z]{2,63}|xn--[a-z0-9-]{2,59})$/i.test(
      hostname,
    ) &&
    !/\.(?:localhost|local|internal|lan|home|test|invalid|example|onion)$/i.test(
      hostname,
    )
  );
}

export function hasStorefrontProductPath(url: URL): boolean {
  return (
    /\/(?:products?|goods|items?)\//i.test(url.pathname) ||
    /\/(?:products?|goods|items?)\.html?$/i.test(url.pathname) ||
    /\/p\/.+\.html$/i.test(url.pathname) ||
    ["product_no", "productNo", "goodsNo", "itemNo", "branduid"].some(
      (key) => !!url.searchParams.get(key),
    )
  );
}

export function validateProductUrl(value: string): string {
  if (typeof value !== "string" || value.length > 2048)
    throw new Error("올바른 상품 URL을 입력해 주세요.");
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw new Error("https://로 시작하는 상품 URL을 입력해 주세요.");
  }
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.port ||
    !isPublicProductHostname(url.hostname)
  ) {
    throw new Error("공개 상품 상세 페이지의 HTTPS 링크를 입력해 주세요.");
  }
  if (
    ["oliveyoung.co.kr", "www.oliveyoung.co.kr", "m.oliveyoung.co.kr"].includes(
      url.hostname,
    )
  )
    return oliveYoungProductUrl(url).href;
  const aliases: Record<string, string> = {
    "m.musinsa.com": "www.musinsa.com",
    "m.29cm.co.kr": "www.29cm.co.kr",
    "musinsa.com": "www.musinsa.com",
    "29cm.co.kr": "www.29cm.co.kr",
    "wconcept.co.kr": "www.wconcept.co.kr",
  };
  url.hostname = aliases[url.hostname] ?? url.hostname;
  url.hash = "";
  for (const key of [...url.searchParams.keys()]) {
    if (/^(utm_|fbclid$|gclid$|ref$|affiliate)/i.test(key))
      url.searchParams.delete(key);
  }
  url.searchParams.sort();
  url.pathname = url.pathname.replace(/\/+$/, "") || "/";
  if (url.hostname === "www.musinsa.com") {
    const legacy = url.pathname.match(
      /^\/app\/(?:goods|product\/detail)\/(\d+)(?:\/0)?$/,
    );
    if (legacy) url.pathname = `/products/${legacy[1]}`;
  }
  if (url.hostname === "www.29cm.co.kr") {
    const legacy = url.pathname.match(/^\/product\/(\d+)$/);
    if (legacy) url.pathname = `/products/${legacy[1]}`;
  }
  if (
    !PRODUCT_HOSTS.some((host) => host === url.hostname) &&
    !hasStorefrontProductPath(url)
  ) {
    throw new Error("쇼핑몰 홈이 아닌 개별 상품 상세 URL을 입력해 주세요.");
  }
  return url.href;
}
// No invented commission IDs: until a provider is configured, return the validated original.
export function getAffiliateLink(productUrl: string): string {
  // TODO: connect to lib/supabase — retrieve an approved affiliate URL on the server.
  // Curated, individually verified links may point to a brand official store.
  if (
    SOPHY_SALE_PRODUCTS.some((sale) => sale.product.url === productUrl) ||
    OFFICIAL_PRODUCTS.some((sale) => sale.product.url === productUrl)
  )
    return productUrl;
  return validateProductUrl(productUrl);
}
export function formatPrice(price: number | null): string {
  return price === null
    ? "가격 확인 필요"
    : `${new Intl.NumberFormat("ko-KR").format(price)}원`;
}

// Images are rendered by the browser; never proxy arbitrary image URLs through the server.
export function validateProductImageUrl(
  value: string,
  productUrl?: string,
): string {
  if (typeof value !== "string" || value.length > 4096)
    throw new Error("상품 이미지 URL을 확인해 주세요.");
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("상품 이미지 HTTPS URL을 입력해 주세요.");
  }
  const domains = [
    "msscdn.net",
    "musinsa.com",
    "29cm.co.kr",
    "wconcept.co.kr",
    "wconcept.com",
    "oliveyoung.co.kr",
    "cafe24.com",
    "poxo.com",
    "shopify.com",
    "godomall.com",
    "makeshop.co.kr",
    "imweb.me",
  ];
  const productHost = productUrl
    ? new URL(productUrl).hostname.replace(/^www\./, "")
    : "";
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.port ||
    !isPublicProductHostname(url.hostname) ||
    (![...domains, productHost].some(
      (domain) =>
        url.hostname === domain || url.hostname.endsWith(`.${domain}`),
    ) &&
      !(
        productUrl &&
        !PRODUCT_HOSTS.some((host) => host === new URL(productUrl).hostname)
      ))
  )
    throw new Error(
      "쇼핑몰에서 제공하는 상품 이미지 HTTPS URL을 입력해 주세요.",
    );
  return url.href;
}

export function productIdentity(value: string): string {
  try {
    const url = new URL(value);
    url.hash = "";
    url.pathname = url.pathname.replace(/\/+$/, "") || "/";
    const cafe24Id =
      url.pathname.match(/^\/product\/[^/]+\/(\d+)(?:\/|$)/i)?.[1] ??
      (/^\/product\/detail\.html$/i.test(url.pathname)
        ? url.searchParams.get("product_no")
        : null);
    if (cafe24Id && /^\d+$/.test(cafe24Id))
      return `${url.hostname.replace(/^www\./, "")}:product:${cafe24Id}`;
    for (const key of [...url.searchParams.keys()]) {
      if (/^(utm_|fbclid$|gclid$|ref$|affiliate)/i.test(key))
        url.searchParams.delete(key);
    }
    url.searchParams.sort();
    return url.href;
  } catch {
    return value;
  }
}
