"use client";

import { luxuryProductName } from "../../../lib/product-name";
import Link from "next/link";
import type { ReactNode } from "react";
import { ProductCardBrand } from "./product-card-brand";
import { useProductUpdate } from "./live-product-price";
import { ProductPrice } from "./product-price";
import { SamplePhoto } from "./sample-photo";
import s from "./creator.module.css";

export function ProductCardTags({
  category,
  tags = [],
  children,
}: {
  category: string;
  tags?: readonly string[];
  children?: ReactNode;
}) {
  const categoryLabel = category.trim().replace(/^#+\s*/, "");
  const labels = new Set(tags.map((tag) => tag.trim().replace(/^#+\s*/, "")));
  labels.delete("");
  labels.delete(categoryLabel);
  return (
    <div className={s.cardTags}>
      {categoryLabel && <span className={s.categoryTag}>#{categoryLabel}</span>}
      {[...labels].map((tag) => (
        <span key={tag}>#{tag}</span>
      ))}
      {children}
    </div>
  );
}

export function ProductCardLayout({
  requestId,
  author,
  authorHref,
  product,
  image,
  actions,
  concern,
  category,
  tags,
  tagDetails,
  commentAction,
  children,
}: {
  requestId?: string;
  author?: string;
  authorHref?: string;
  product: {
    name: string;
    brand?: string;
    url: string;
    price: number | null;
    originalPrice?: number | null;
    discountRate?: number | null;
  };
  image: ReactNode;
  actions?: ReactNode;
  concern: ReactNode;
  category: string;
  tags?: readonly string[];
  tagDetails?: ReactNode;
  commentAction?: ReactNode;
  children?: ReactNode;
}) {
  const { ref, latest } = useProductUpdate(product.url);
  const currentName = latest?.product?.name ?? product.name;
  const brand = latest?.product?.brand ?? product.brand;
  const name =
    category === "명품" ? luxuryProductName(currentName) : currentName;
  return (
    <article
      id={requestId && `request-${requestId}`}
      className={s.card}
      data-request-id={requestId}
    >
      {(author || actions) && (
        <div className={s.cardTop}>
          <span className={s.smallAvatar} aria-hidden="true">
            {author?.slice(0, 1)}
          </span>
          {authorHref ? (
            <Link className={s.authorName} href={authorHref}>
              {author}
            </Link>
          ) : (
            <span className={s.authorName}>{author}</span>
          )}
          {actions && <div className={s.cardActions}>{actions}</div>}
        </div>
      )}
      <a
        className={s.productVisual}
        href={product.url}
        target="_blank"
        rel="noopener noreferrer sponsored"
        aria-label={`${name} 쇼핑몰에서 보기`}
      >
        {latest?.product?.image ? (
          <SamplePhoto
            key={latest.product.image}
            source={latest.product.image}
            alt={name}
            fit="cover"
          />
        ) : (
          image
        )}
        <span
          className={`${s.productOverlay} ${category === "명품" ? s.luxuryOverlay : ""}`}
        >
          <span title={name}>{name}</span>
          <ProductPrice
            ref={ref}
            product={latest?.price ?? product}
            checkedAt={latest?.price?.checkedAt}
          />
        </span>
        <span className={s.shoppingHover} aria-hidden="true">
          쇼핑몰에서 보기
        </span>
      </a>
      <div className={s.cardBody}>
        <ProductCardBrand key={brand} brand={brand} />
        {concern && <div className={s.concern}>{concern}</div>}
        <div className={s.cardTagRow}>
          <ProductCardTags category={category} tags={tags}>
            {tagDetails}
          </ProductCardTags>
          {commentAction}
        </div>
        {children}
      </div>
    </article>
  );
}
