import { lookup } from "node:dns/promises";
import { request } from "node:https";
import { BlockList, isIP } from "node:net";
import type { LookupAddress } from "node:dns";
import { validateProductUrl } from "./product";

const blocked = new BlockList();
for (const [network, prefix] of [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
] as const)
  blocked.addSubnet(network, prefix, "ipv4");
blocked.addSubnet("2001::", 23, "ipv6");
blocked.addSubnet("2001:db8::", 32, "ipv6");
blocked.addSubnet("2002::", 16, "ipv6");

export function isPublicAddress(address: string): boolean {
  const family = isIP(address);
  if (family === 4) return !blocked.check(address, "ipv4");
  if (family === 6) {
    const prefix = parseInt(address.split(":")[0], 16);
    return (
      prefix >= 0x2000 && prefix <= 0x3fff && !blocked.check(address, "ipv6")
    );
  }
  return false;
}

export interface ProductPage {
  status: number;
  location?: string;
  html: string;
}
export interface ProductTransport {
  lookupAll: (hostname: string) => Promise<LookupAddress[]>;
  readPage: (
    url: URL,
    address: LookupAddress,
    timeout: number,
  ) => Promise<ProductPage>;
}

function readPage(
  url: URL,
  address: LookupAddress,
  timeout: number,
): Promise<ProductPage> {
  return new Promise((resolve, reject) => {
    // Connect directly to the checked IP; keep the original TLS name and Host.
    // No second DNS lookup or pooled connection can change the destination.
    const req = request(
      url,
      {
        hostname: address.address,
        family: address.family,
        servername: url.hostname,
        agent: false,
        headers: {
          Host: url.host,
          Accept: "text/html,application/xhtml+xml",
          "Accept-Encoding": "identity",
          "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
          "User-Agent": "Mozilla/5.0 (compatible; BuyOrNotProductPreview/1.0)",
        },
      },
      (response) => {
        const status = response.statusCode ?? 0;
        if ([301, 302, 303, 307, 308].includes(status)) {
          clearTimeout(timer);
          resolve({ status, location: response.headers.location, html: "" });
          response.destroy();
          return;
        }
        if (
          status !== 200 ||
          !/text\/html|application\/xhtml\+xml/i.test(
            response.headers["content-type"] ?? "",
          )
        ) {
          clearTimeout(timer);
          reject(
            new Error(
              status === 403 && url.hostname === "www.oliveyoung.co.kr"
                ? "올리브영에서 자동 상품 조회를 차단했습니다. 현재 이 링크의 상품 정보를 가져올 수 없습니다."
                : "쇼핑몰에서 상품 정보를 제공하지 않았습니다. 상품 상세 링크를 확인하고 다시 시도해 주세요.",
            ),
          );
          response.destroy();
          req.destroy();
          return;
        }
        const chunks: Buffer[] = [];
        let size = 0;
        response.on("data", (chunk: Buffer) => {
          size += chunk.length;
          if (size > 2 * 1024 * 1024) {
            req.destroy(
              new Error(
                "상품 페이지가 너무 큽니다. 다른 상품 상세 링크로 시도해 주세요.",
              ),
            );
            return;
          }
          chunks.push(chunk);
        });
        response.on("end", () => {
          clearTimeout(timer);
          resolve({ status, html: Buffer.concat(chunks).toString("utf8") });
        });
        response.on("error", (error) => {
          clearTimeout(timer);
          reject(error);
        });
        response.on("aborted", () => {
          clearTimeout(timer);
          reject(new Error("상품 정보 연결이 끊겼습니다. 다시 시도해 주세요."));
        });
      },
    );
    const timer = setTimeout(
      () =>
        req.destroy(
          new Error(
            "상품 정보 조회 시간이 초과되었습니다. 다시 시도해 주세요.",
          ),
        ),
      timeout,
    );
    req.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    req.end();
  });
}

const transport: ProductTransport = {
  lookupAll: (hostname) => lookup(hostname, { all: true, verbatim: true }),
  readPage,
};

export async function fetchProductHtml(
  input: string,
  client = transport,
): Promise<{ html: string; url: URL }> {
  let url = validateProductUrl(input);
  const deadline = Date.now() + 10000;
  for (let redirects = 0; redirects <= 5; redirects++) {
    const remaining = deadline - Date.now();
    if (remaining <= 0)
      throw new Error(
        "상품 정보 조회 시간이 초과되었습니다. 다시 시도해 주세요.",
      );
    let timer: ReturnType<typeof setTimeout> | undefined;
    let addresses: LookupAddress[];
    try {
      addresses = await Promise.race([
        client.lookupAll(url.hostname),
        new Promise<never>((_, reject) => {
          timer = setTimeout(
            () =>
              reject(
                new Error(
                  "쇼핑몰 주소를 확인하지 못했습니다. 다시 시도해 주세요.",
                ),
              ),
            remaining,
          );
        }),
      ]);
    } finally {
      clearTimeout(timer);
    }
    if (
      !addresses.length ||
      addresses.some((address) => !isPublicAddress(address.address))
    )
      throw new Error("안전한 공개 쇼핑몰 주소만 조회할 수 있습니다.");
    const timeout = deadline - Date.now();
    if (timeout <= 0)
      throw new Error(
        "상품 정보 조회 시간이 초과되었습니다. 다시 시도해 주세요.",
      );
    const page = await client.readPage(url, addresses[0], timeout);
    if (page.status === 200) {
      if (url.hostname.endsWith(".onelink.me"))
        throw new Error(
          "공유 링크에서 상품을 찾지 못했습니다. 상품 상세 링크를 복사해 주세요.",
        );
      return { html: page.html, url };
    }
    if (![301, 302, 303, 307, 308].includes(page.status) || !page.location)
      throw new Error(
        "상품 상세 페이지를 불러오지 못했습니다. 링크를 확인해 주세요.",
      );
    url = validateProductUrl(new URL(page.location, url).href);
  }
  throw new Error(
    "상품 링크의 이동이 너무 많습니다. 최종 상품 상세 주소를 입력해 주세요.",
  );
}
