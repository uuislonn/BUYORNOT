import {
  hasStorefrontProductPath,
  isPublicProductHostname,
  oliveYoungProductUrl,
} from "../../app/(creator)/_lib/product-url";

// Exact host matching rejects IP literals, private addresses, userinfo and spoofed subdomains.
export const allowedHosts = [
  "www.musinsa.com",
  "musinsa.com",
  "m.musinsa.com",
  "musinsa.onelink.me",
  "www.29cm.co.kr",
  "29cm.co.kr",
  "m.29cm.co.kr",
  "29cm.onelink.me",
  "www.wconcept.co.kr",
  "www.oliveyoung.co.kr",
  "oliveyoung.co.kr",
  "m.oliveyoung.co.kr",
  "www.nike.com",
  "www.adidas.co.kr",
  "www.ssfshop.com",
];
export function validateProductUrl(input: string): URL {
  if (typeof input !== "string" || input.length > 2048)
    throw new Error("올바른 상품 URL을 입력해 주세요.");
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new Error("올바른 상품 URL을 입력해 주세요.");
  }
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.port ||
    !isPublicProductHostname(url.hostname) ||
    (!allowedHosts.includes(url.hostname) && !hasStorefrontProductPath(url))
  )
    throw new Error("공개 상품 상세 페이지의 HTTPS 링크를 입력해 주세요.");
  url.hash = "";
  if (["musinsa.com", "m.musinsa.com"].includes(url.hostname))
    url.hostname = "www.musinsa.com";
  if (["29cm.co.kr", "m.29cm.co.kr"].includes(url.hostname))
    url.hostname = "www.29cm.co.kr";
  if (
    ["oliveyoung.co.kr", "m.oliveyoung.co.kr", "www.oliveyoung.co.kr"].includes(
      url.hostname,
    )
  )
    return oliveYoungProductUrl(url);
  if (["www.musinsa.com", "musinsa.com"].includes(url.hostname)) {
    const legacy = url.pathname.match(
      /^\/app\/(?:goods|product\/detail)\/(\d+)(?:\/0)?\/?$/,
    );
    if (legacy) url.pathname = `/products/${legacy[1]}`;
  }
  if (["www.29cm.co.kr", "29cm.co.kr"].includes(url.hostname)) {
    const legacy = url.pathname.match(/^\/product\/(\d+)\/?$/);
    if (legacy) url.pathname = `/products/${legacy[1]}`;
  }
  if (!allowedHosts.includes(url.hostname)) {
    for (const key of [...url.searchParams.keys()]) {
      if (/^(utm_|fbclid$|gclid$|ref$|affiliate)/i.test(key))
        url.searchParams.delete(key);
    }
    url.searchParams.sort();
    url.pathname = url.pathname.replace(/\/+$/, "") || "/";
  }
  return url;
}
