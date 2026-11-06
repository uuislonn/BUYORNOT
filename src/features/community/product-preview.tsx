"use client";
/* eslint-disable @next/next/no-img-element -- Public shopping-site product photo. */
import { useState } from "react";
import type { Product } from "./types";
import styles from "./product-preview.module.css";

export function ProductPreview({ product }: { product: Product }) {
  const [imageFailed, setImageFailed] = useState(false);
  return (
    <div className={styles.preview}>
      {imageFailed ? (
        <button
          type="button"
          className={styles.retry}
          onClick={() => setImageFailed(false)}
        >
          사진 다시 불러오기
        </button>
      ) : (
        <img
          src={product.image}
          alt={product.name}
          referrerPolicy="no-referrer"
          onError={() => setImageFailed(true)}
        />
      )}
      <div className={styles.info}>
        <span>{product.brand || product.domain}</span>
        <strong>{product.name}</strong>
        <p>₩{product.price.toLocaleString("ko-KR")}</p>
        <a href={product.url} target="_blank" rel="noopener noreferrer">
          상품 상세 보기 ↗
        </a>
      </div>
    </div>
  );
}
