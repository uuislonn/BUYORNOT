import { describe, expect, it, vi } from "vitest";
import {
  fetchProductHtml,
  isPublicAddress,
  type ProductTransport,
} from "./product-fetch";
import { validateProductUrl } from "./product";

function transport(): ProductTransport {
  return {
    lookupAll: vi.fn().mockResolvedValue([{ address: "1.1.1.1", family: 4 }]),
    readPage: vi.fn().mockResolvedValue({ status: 200, html: "product HTML" }),
  };
}
describe("상품 조회 SSRF 방어", () => {
  it("무신사 앱 공유 링크를 실제 상품 페이지까지 따라간다", async () => {
    const client = transport();
    vi.mocked(client.readPage)
      .mockResolvedValueOnce({
        status: 302,
        location: "https://www.musinsa.com/products/7421561",
        html: "",
      })
      .mockResolvedValueOnce({ status: 200, html: "actual product" });
    const page = await fetchProductHtml(
      "https://musinsa.onelink.me/ANAQ/3pobkz5i",
      client,
    );
    expect(page.url.href).toBe("https://www.musinsa.com/products/7421561");
    expect(page.html).toBe("actual product");
    expect(client.lookupAll).toHaveBeenCalledTimes(2);
  });
  it("29CM 공유 링크도 상품 페이지로 연결한다", async () => {
    const client = transport();
    vi.mocked(client.readPage)
      .mockResolvedValueOnce({
        status: 302,
        location: "https://www.29cm.co.kr/products/4149783",
        html: "",
      })
      .mockResolvedValueOnce({ status: 200, html: "29CM product" });
    expect(
      (
        await fetchProductHtml(
          "https://29cm.onelink.me/1080201211/example",
          client,
        )
      ).url.hostname,
    ).toBe("www.29cm.co.kr");
  });
  it("올리브영 모바일 링크를 동일 상품의 웹 상세 주소로 정규화한다", () => {
    expect(
      validateProductUrl(
        "https://m.oliveyoung.co.kr/m/goods/getGoodsDetail.do?goodsNo=A000000234446",
      ).href,
    ).toBe(
      "https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=A000000234446",
    );
  });
  it.each([
    "https://evil.onelink.me/ANAQ/x",
    "https://musinsa.onelink.me.evil.test/ANAQ/x",
  ])("임의의 공유 도메인 %s은 차단한다", (url) => {
    expect(() => validateProductUrl(url)).toThrow();
  });
  it("앱 설치 안내 페이지를 상품 페이지로 처리하지 않는다", async () => {
    await expect(
      fetchProductHtml("https://musinsa.onelink.me/ANAQ/example", transport()),
    ).rejects.toThrow("상품을 찾지 못했");
  });
  it.each([
    "127.0.0.1",
    "10.0.0.1",
    "172.16.0.1",
    "192.168.1.1",
    "169.254.169.254",
    "100.64.0.1",
    "0.0.0.0",
    "224.0.0.1",
    "198.18.0.1",
    "::1",
    "fc00::1",
    "fe80::1",
    "::ffff:127.0.0.1",
    "2001:db8::1",
    "2002:7f00:1::",
    "invalid",
  ])("공개 목적지가 아닌 %s 차단", (address) => {
    expect(isPublicAddress(address)).toBe(false);
  });
  it.each(["1.1.1.1", "8.8.8.8", "2606:4700:4700::1111"])(
    "공개 목적지 %s 허용",
    (address) => {
      expect(isPublicAddress(address)).toBe(true);
    },
  );
  it("검증한 DNS 주소만 실제 요청에 넘긴다", async () => {
    const client = transport();
    expect(
      (await fetchProductHtml("https://www.musinsa.com/products/1", client))
        .html,
    ).toBe("product HTML");
    expect(client.readPage).toHaveBeenCalledWith(
      new URL("https://www.musinsa.com/products/1"),
      { address: "1.1.1.1", family: 4 },
      expect.any(Number),
    );
  });
  it("DNS 결과에 사설 주소가 하나라도 있으면 접속하지 않는다", async () => {
    const client = transport();
    vi.mocked(client.lookupAll).mockResolvedValue([
      { address: "1.1.1.1", family: 4 },
      { address: "10.0.0.1", family: 4 },
    ]);
    await expect(
      fetchProductHtml("https://www.musinsa.com/products/1", client),
    ).rejects.toThrow("공개");
    expect(client.readPage).not.toHaveBeenCalled();
  });
  it("허용되지 않은 호스트로 리다이렉트되면 차단한다", async () => {
    const client = transport();
    vi.mocked(client.readPage).mockResolvedValue({
      status: 302,
      location: "https://127.0.0.1/admin",
      html: "",
    });
    await expect(
      fetchProductHtml("https://www.musinsa.com/products/1", client),
    ).rejects.toThrow();
    expect(client.readPage).toHaveBeenCalledTimes(1);
  });
  it("리다이렉트마다 DNS를 다시 검사한다", async () => {
    const client = transport();
    vi.mocked(client.readPage).mockResolvedValueOnce({
      status: 302,
      location: "/products/2",
      html: "",
    });
    vi.mocked(client.lookupAll)
      .mockResolvedValueOnce([{ address: "1.1.1.1", family: 4 }])
      .mockResolvedValueOnce([{ address: "127.0.0.1", family: 4 }]);
    await expect(
      fetchProductHtml("https://www.musinsa.com/products/1", client),
    ).rejects.toThrow("공개");
    expect(client.readPage).toHaveBeenCalledTimes(1);
  });
  it("무한 리다이렉트를 제한한다", async () => {
    const client = transport();
    vi.mocked(client.readPage).mockResolvedValue({
      status: 302,
      location: "/products/1",
      html: "",
    });
    await expect(
      fetchProductHtml("https://www.musinsa.com/products/1", client),
    ).rejects.toThrow("이동이 너무");
    expect(client.readPage).toHaveBeenCalledTimes(6);
  });
});
