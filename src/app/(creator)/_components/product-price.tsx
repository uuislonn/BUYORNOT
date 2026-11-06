import type { Product } from "../_lib/types";
import { formatPrice } from "../_lib/product-url";
import { productPricing } from "../_lib/product-price";
import s from "./creator.module.css";
export function ProductPrice({ product }: { product: Product }) {
  const pricing = productPricing(
    product.price,
    product.originalPrice,
    product.discountRate,
  );
  return (
    <span
      className={s.productPrice}
      title="조회 시점의 판매가이며 쿠폰·옵션에 따라 달라질 수 있어요."
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
