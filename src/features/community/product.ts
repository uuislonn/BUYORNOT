import type { Product } from "./types";
// Exact host matching rejects IP literals, private addresses, userinfo and spoofed subdomains.
export const allowedHosts = [
  "www.musinsa.com",
  "musinsa.com",
  "www.29cm.co.kr",
  "29cm.co.kr",
  "www.wconcept.co.kr",
  "www.oliveyoung.co.kr",
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
    !allowedHosts.includes(url.hostname)
  )
    throw new Error("지원하는 쇼핑몰의 HTTPS 상품 링크만 사용할 수 있습니다.");
  url.hash = "";
  return url;
}
export function mockProduct(input: string): Product {
  const url = validateProductUrl(input);
  // Dummy metadata only. No outbound request, DNS resolution or redirect following occurs.
  // TODO: connect to lib/supabase; real crawler must pin validated public DNS addresses and revalidate every redirect.
  return {
    url: url.href,
    domain: url.hostname,
    name: "직접 입력한 쇼핑몰 상품",
    brand: "상품 정보 확인 필요",
    image: "",
    price: 0,
    currency: "KRW",
  };
}
