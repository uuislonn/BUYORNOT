import additionalProducts from "./sophy-video-products.json";
import { SOPHY_ITEMS } from "./sophy-video";
import type { Product } from "../_lib/types";
export type SophySaleProduct = {
  sourceSeconds: number;
  product: Product;
  seller: string;
  checkedAt: string;
  imageSource: string;
  priceLabel?: string;
  matchNote?: string;
};
// Same model and image checked against the video and the individual sales page.
// Price snapshots exclude personalized coupons, shipping and currency conversion.
export const SOPHY_SALE_PRODUCTS: SophySaleProduct[] = [
  ...(additionalProducts as SophySaleProduct[]),
  {
    sourceSeconds: 248,
    seller: "룰루레몬 공식몰",
    checkedAt: "2026-11-16",
    imageSource:
      "https://images.lululemon.com/is/image/lululemon/LW4AWMS_0001_1?size=800,800",
    matchNote:
      "영상과 같은 스쿠바 풀집 후디 모델의 공식 판매 페이지입니다. 영상에는 색상이 명시되지 않아 공식몰의 블랙 옵션을 연결했습니다. 재입고 여부를 확인해 주세요.",
    product: {
      name: "스쿠바 풀집 후디 · Black",
      brand: "LULULEMON · 룰루레몬",
      url: "https://www.lululemon.co.kr/ko-kr/p/%EC%8A%A4%EC%BF%A0%EB%B0%94-%ED%92%80%EC%A7%91-%ED%9B%84%EB%94%94/prod8351133.html",
      image: "/curation-products/sophy/scuba-official.jpg",
      price: 159000,
      category: "의류",
      currency: "KRW",
    },
  },
  {
    sourceSeconds: 408,
    seller: "다이닛 공식몰",
    checkedAt: "2026-11-10",
    imageSource:
      "https://cafe24img.poxo.com/ecimg.cafe24img.com/pg739b17156747073/deinet/web/product/small/20260817/e1ea33b8b6a108d2233dbd5fd507f9ba.jpg",
    product: {
      name: "PATCH COLOR FAUX SUEDE BOOTS · LIGHT BLUE",
      brand: "DEINET · 다이닛",
      url: "https://www.deinet.co.kr/product/patch-color-faux-suede-boots-in-light-blue/3402/category/49/display/1/",
      image: "/curation-products/sophy/deinet.jpg",
      price: 106200,
      originalPrice: 118000,
      discountRate: 10,
      category: "신발",
      currency: "KRW",
    },
  },
  {
    sourceSeconds: 776,
    seller: "쓰리타임즈 공식몰",
    checkedAt: "2026-11-10",
    imageSource:
      "https://cdn.shopify.com/s/files/1/0596/8704/3156/files/26Fall_7078.jpg?v=1788152707",
    matchNote:
      "영상과 같은 블랙 쇼퍼백입니다. 현재 품절로 표시되므로 공식몰에서 재입고 여부를 확인해 주세요.",
    product: {
      name: "tht shopper bag · black",
      brand: "THREETIMES · 쓰리타임즈",
      url: "https://threetimes333.com/collections/best-sellers/products/tht-shopper-bag-black",
      image: "/curation-products/sophy/shopper.jpg",
      price: 237600,
      originalPrice: 264000,
      discountRate: 10,
      category: "잡화",
      currency: "KRW",
    },
  },
  {
    sourceSeconds: 523,
    seller: "아캄 공식몰",
    checkedAt: "2026-11-16",
    imageSource:
      "https://ecimg.cafe24img.com/pg1435b06795390045/ykuinc/web/product/big/20250902/1a27c99d133eac3abda583140882a66c.jpg",
    product: {
      name: "Washed Field Jacket (Khaki)",
      brand: "AAKAM · 아캄",
      url: "https://aakam.kr/product/washed-field-jacket-khaki/654",
      image: "/curation-products/sophy/aakam-official.jpg",
      price: 145600,
      originalPrice: 208000,
      discountRate: 30,
      category: "의류",
      currency: "KRW",
    },
  },
  {
    sourceSeconds: 700,
    seller: "시세이도 공식몰 · 일본",
    checkedAt: "2026-11-16",
    imageSource:
      "https://www.shiseido.co.jp/resources/sw/products/img/20240117/SHOHIN_PL_C1_091401.jpg",
    product: {
      name: "베이비 파우더 프레스드 50g",
      brand: "SHISEIDO · 시세이도",
      url: "https://www.shiseido.co.jp/sw/onlinestore/products/091401.html",
      image: "/curation-products/sophy/powder-official.jpg",
      price: null,
      category: "뷰티",
      currency: "KRW",
    },
  },
  {
    sourceSeconds: 1323,
    seller: "슈바이초이 공식몰",
    checkedAt: "2026-11-16",
    imageSource:
      "https://shoebychoi.co.kr/web/product/big/202503/9829582ace49e748e9c2036893b18287.jpg",
    product: {
      name: "크랙 소가죽 스키니 통굽 워커 (7cm)",
      brand: "SHOEBYCHOI · 슈바이초이",
      url: "https://shoebychoi.co.kr/product/%EC%9D%B4%ED%83%9C%EB%A6%AC-%ED%81%AC%EB%9E%99-%EC%86%8C%EA%B0%80%EC%A3%BD-%EC%8A%A4%ED%82%A4%EB%8B%88-%ED%86%B5%EA%B5%BD-%EC%9B%8C%EC%BB%A47m%EB%B8%94%EB%9E%99%EC%95%84%EC%9D%B4%EB%B3%B4%EB%A6%AC/454/",
      image: "/curation-products/sophy/boots-official.jpg",
      price: 328000,
      category: "신발",
      currency: "KRW",
    },
  },
  {
    sourceSeconds: 1806,
    seller: "베리시 공식몰",
    checkedAt: "2026-11-16",
    imageSource:
      "https://cafe24img.poxo.com/verish/web/product/big/202608/d6db978d93537f2d131f936d985db6a0.jpg",
    product: {
      name: "이즈핏 커버업 후디",
      brand: "VERISH · 베리시",
      url: "https://verish.me/product/%EC%9D%B4%EC%A6%88%ED%95%8F-%EC%BB%A4%EB%B2%84%EC%97%85-%ED%9B%84%EB%94%94/1540/",
      image: "/curation-products/sophy/verish-official.jpg",
      price: 72000,
      category: "의류",
      currency: "KRW",
    },
  },
  {
    sourceSeconds: 1902,
    seller: "Ulike 공식몰 · 미국",
    checkedAt: "2026-11-10",
    imageSource:
      "https://www.ulike.com/cdn/shop/files/Air10-Purple_092ee9e9-ff31-400a-a6d9-bf60d8d6ce9a.jpg?v=1784512342&width=870",
    priceLabel: "US$259 · 행사 조건 확인",
    matchNote:
      "Air 10 동일 모델의 미국 판매 옵션입니다. 국가별 색상·구성·배송 조건은 판매 페이지에서 확인해 주세요.",
    product: {
      name: "Air 10 IPL 제모기",
      brand: "ULIKE · 유라이크",
      url: "https://www.ulike.com/products/sapphire-air-10-ipl-hair-removal",
      image: "/curation-products/sophy/ulike.jpg",
      price: null,
      category: "뷰티",
      currency: "KRW",
    },
  },
];
export const SOPHY_LINKED_ITEMS = SOPHY_SALE_PRODUCTS.map((sale) => ({
  ...SOPHY_ITEMS.find((item) => item.seconds === sale.sourceSeconds)!,
  sale,
})).sort((a, b) => a.seconds - b.seconds);
