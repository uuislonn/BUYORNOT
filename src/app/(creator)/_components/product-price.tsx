import type { Ref } from "react";
import type { Product } from "../_lib/types";
import { formatPrice } from "../_lib/product-url";
import { productPricing } from "../_lib/product-price";
import s from "./creator.module.css";
export function ProductPrice({
  product,
  ref,
  checkedAt,
}: {
  product: Pick<Product, "price" | "originalPrice" | "discountRate">;
  ref?: Ref<HTMLSpanElement>;
  checkedAt?: string;
}) {
  const pricing = productPricing(
    product.price,
    product.originalPrice,
    product.discountRate,
  );
  return (
    <span
      ref={ref}
      className={s.productPrice}
      title={
        checkedAt
          ? `최근 확인 ${new Intl.DateTimeFormat("ko-KR", {
              dateStyle: "short",
              timeStyle: "short",
              timeZone: "Asia/Seoul",
            }).format(
              new Date(checkedAt),
            )} · 쿠폰과 옵션에 따라 달라질 수 있어요.`
          : "상품 정보에 저장된 가격이에요. 판매처의 현재 가격은 달라질 수 있어요."
      }
    >
      {pricing.discountRate !== null && (
        <span className={s.discountRate}>{pricing.discountRate}% 할인</span>
      )}
      <strong>{formatPrice(product.price)}</strong>
      {pricing.discountRate !== null && pricing.originalPrice !== null && (
        <del aria-label={`정가 ${formatPrice(pricing.originalPrice)}`}>
          {formatPrice(pricing.originalPrice)}
        </del>
      )}
    </span>
  );
}
