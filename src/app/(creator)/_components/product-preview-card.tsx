import type { Product } from "../_lib/types";
import { ProductPrice } from "./product-price";
import { SamplePhoto } from "./sample-photo";
import s from "./creator.module.css";

export function ProductPreviewCard({
  product,
  image,
  onImageLoad,
  onImageError,
}: {
  product: Product;
  image: string;
  onImageLoad?: () => void;
  onImageError?: () => void;
}) {
  return (
    <a
      className={s.preview}
      href={product.url}
      target="_blank"
      rel="noopener noreferrer"
    >
      <div className={s.previewImage}>
        {image && (
          <SamplePhoto
            key={image}
            source={image}
            alt={product.name || "상품 대표 이미지"}
            onLoad={onImageLoad}
            onError={onImageError}
          />
        )}
      </div>
      <div>
        {product.brand && <span className={s.miniLabel}>{product.brand}</span>}
        <p>{product.name || "상품명을 직접 입력해 주세요"}</p>
        <ProductPrice product={product} />
        <small>상품 상세 페이지에서 최종 가격과 옵션을 확인해 주세요.</small>
      </div>
    </a>
  );
}
