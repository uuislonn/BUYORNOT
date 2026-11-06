"use client";
import { useState } from "react";
import { getProductInfo, savePost } from "./actions";
import {
  categories,
  type BodyProfile,
  type FeedPost,
  type PostInput,
  type Product,
} from "./types";
import { Modal } from "./modal";
import { ProductPreview } from "./product-preview";
import styles from "./community.module.css";
export function PostForm({
  post,
  initialUrl,
  close,
  saved,
}: {
  post?: FeedPost;
  initialUrl: string;
  close: () => void;
  saved: (post: FeedPost) => void;
}) {
  const [url, setUrl] = useState(post?.product.url ?? initialUrl);
  const [product, setProduct] = useState<Product | null>(post?.product ?? null);
  const [concern, setConcern] = useState(post?.concern ?? "");
  const [category, setCategory] = useState(post?.category ?? "");
  const [spec, setSpec] = useState<BodyProfile>(post?.bodyProfile ?? {});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function preview() {
    if (busy) return;
    setBusy(true);
    setError("");
    setProduct(null);
    try {
      const r = await getProductInfo(url);
      if (r.ok) setProduct(r.data);
      else setError(r.error);
    } catch {
      setError("상품 정보를 불러오지 못했습니다.");
    } finally {
      setBusy(false);
    }
  }
  async function submit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    if (!product) {
      setError("상품 정보 불러오기를 먼저 눌러 주세요.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const r = await savePost(
        {
          productUrl: url,
          concern,
          category: category as PostInput["category"],
          visibility: "PUBLIC",
          bodyProfile: spec,
        },
        post?.id,
      );
      if (r.ok) saved(r.data);
      else setError(r.error);
    } catch {
      setError("저장하지 못했습니다. 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title={post ? "살말 고민 수정" : "함께 고민해 봐요"} close={close}>
      <form onSubmit={submit} className={styles.form}>
        <p className={styles.hint}>마음에 둔 상품 링크와 고민을 남겨 주세요.</p>
        <label>
          상품 URL
          <input
            type="url"
            required
            disabled={busy}
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setProduct(null);
            }}
            placeholder="https://www.musinsa.com/products/…"
          />
        </label>
        <button type="button" disabled={busy || !url} onClick={preview}>
          {busy ? "상품 정보 처리 중…" : "상품 정보 불러오기"}
        </button>
        {product && <ProductPreview key={product.url} product={product} />}
        <label>
          카테고리
          <select
            value={category}
            required
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">선택해 주세요</option>
            {categories.slice(1).map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label>
          어떤 점이 고민인가요?
          <textarea
            maxLength={300}
            required
            value={concern}
            onChange={(e) => setConcern(e.target.value)}
            placeholder="가격, 핏, 활용도… 여러분의 의견이 궁금해요."
            rows={4}
          />
        </label>
        <span className={styles.counter}>{concern.length} / 300</span>
        <fieldset>
          <legend>공개할 신체 정보만 선택해 주세요</legend>
          {(
            [
              { label: "나이", keys: ["age"] },
              { label: "퍼스널 컬러", keys: ["personal_color"] },
              { label: "키 및 몸무게", keys: ["height_cm", "weight_kg"] },
            ] as const
          ).map(({ label, keys }) => {
            const selected = keys.some((key) => key in spec);
            return (
              <div className={styles.spec} key={label}>
                <label>
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={(e) =>
                      setSpec((prev) => {
                        const next = { ...prev };
                        for (const key of keys) {
                          if (e.target.checked) next[key] = prev[key] ?? "";
                          else delete next[key];
                        }
                        return next;
                      })
                    }
                  />
                  {label} 공개
                </label>
                {selected &&
                  keys.map((key) => {
                    const fieldLabel =
                      key === "height_cm"
                        ? "키(cm)"
                        : key === "weight_kg"
                          ? "몸무게(kg)"
                          : label;
                    return (
                      <input
                        key={key}
                        aria-label={fieldLabel}
                        placeholder={fieldLabel}
                        maxLength={40}
                        value={spec[key] ?? ""}
                        onChange={(e) =>
                          setSpec({ ...spec, [key]: e.target.value })
                        }
                      />
                    );
                  })}
              </div>
            );
          })}
        </fieldset>
        <p>공개 범위: 전체 공개</p>
        <p className={styles.hint}>선택한 신체 정보만 게시글에 공개됩니다.</p>
        {error && (
          <p role="alert" className={styles.error}>
            {error}
          </p>
        )}
        <button
          className={styles.primary}
          disabled={busy || !product}
          type="submit"
        >
          {busy ? "처리 중…" : "고민 올리기 ↗"}
        </button>
      </form>
    </Modal>
  );
}
