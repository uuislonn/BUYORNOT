// Exact hosts only. This mock adapter NEVER fetches a user-provided URL.
export const PRODUCT_HOSTS = [
  "musinsa.com",
  "www.musinsa.com",
  "29cm.co.kr",
  "www.29cm.co.kr",
  "product.29cm.co.kr",
  "www.wconcept.co.kr",
  "wconcept.co.kr",
] as const;
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
    !PRODUCT_HOSTS.some((host) => host === url.hostname)
  ) {
    throw new Error(
      "지원 쇼핑몰의 HTTPS 링크만 사용할 수 있어요. (무신사·29CM·W컨셉)",
    );
  }
  const aliases: Record<string, string> = {
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
  return url.href;
}
// No invented commission IDs: until a provider is configured, return the validated original.
export function getAffiliateLink(productUrl: string): string {
  // TODO: connect to lib/supabase — retrieve an approved affiliate URL on the server.
  return validateProductUrl(productUrl);
}
export function formatPrice(price: number | null): string {
  return price === null
    ? "가격 확인 필요"
    : `${new Intl.NumberFormat("ko-KR").format(price)}원`;
}
