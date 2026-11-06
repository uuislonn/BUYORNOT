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
    !allowedHosts.includes(url.hostname)
  )
    throw new Error("지원하는 쇼핑몰의 HTTPS 상품 링크만 사용할 수 있습니다.");
  url.hash = "";
  if (url.hostname === "m.musinsa.com") url.hostname = "www.musinsa.com";
  if (url.hostname === "m.29cm.co.kr") url.hostname = "www.29cm.co.kr";
  if (["oliveyoung.co.kr", "m.oliveyoung.co.kr"].includes(url.hostname)) {
    url.hostname = "www.oliveyoung.co.kr";
    url.pathname = url.pathname.replace(/^\/m\//, "/store/");
  }
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
  return url;
}
