"use client";
import { useState } from "react";
import { getProductInfo, savePost } from "./actions";
import {
  categories,
  type BodyProfile,
  type FeedPost,
  type PostInput,
  type Product,
  type Visibility,
} from "./types";
import { Modal } from "./modal";
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
  const [visibility, setVisibility] = useState<Visibility>(
    post?.visibility ?? "PUBLIC",
  );
  const [spec, setSpec] = useState<BodyProfile>(post?.bodyProfile ?? {});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function preview() {
    setBusy(true);
    setError("");
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
    setBusy(true);
    setError("");
    try {
      const r = await savePost(
        {
          productUrl: url,
          concern,
          category: category as PostInput["category"],
          visibility,
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
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setProduct(null);
            }}
            placeholder="https://www.musinsa.com/products/…"
          />
        </label>
        <button type="button" disabled={busy || !url} onClick={preview}>
          상품 정보 불러오기
        </button>
        {product && (
          <div className={styles.preview}>
            <strong>{product.domain}</strong>
            <p>
              Dummy 상품 미리보기 · 실제 상품명·가격은 쇼핑몰에서 확인해 주세요.
            </p>
          </div>
        )}
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
              ["age", "나이"],
              ["height_cm", "키(cm)"],
              ["weight_kg", "몸무게(kg)"],
              ["body_type", "체형"],
              ["personal_color", "퍼스널 컬러"],
            ] as const
          ).map(([key, label]) => (
            <div className={styles.spec} key={key}>
              <label>
                <input
                  type="checkbox"
                  checked={key in spec}
                  onChange={(e) =>
                    setSpec((prev) => {
                      const next = { ...prev };
                      if (e.target.checked) next[key] = "";
                      else delete next[key];
                      return next;
                    })
                  }
                />
                {label} 공개
              </label>
              {key in spec && (
                <input
                  aria-label={label}
                  maxLength={40}
                  value={spec[key] ?? ""}
                  onChange={(e) => setSpec({ ...spec, [key]: e.target.value })}
                />
              )}
            </div>
          ))}
        </fieldset>
        <label>
          공개 범위
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as Visibility)}
          >
            <option value="PUBLIC">전체 공개</option>
            <option value="FOLLOWERS">팔로워 공개 (Mock: 본인만 조회)</option>
            <option value="LINK_ONLY">링크 공개 (Mock: 본인만 조회)</option>
          </select>
        </label>
        <p className={styles.hint}>
          신체 정보는 작성 시점의 스냅샷으로 저장됩니다. 팔로우 관계와 공유
          토큰은 DB 연결 후 제공됩니다.
        </p>
        {error && (
          <p role="alert" className={styles.error}>
            {error}
          </p>
        )}
        <button className={styles.primary} disabled={busy} type="submit">
          {busy ? "처리 중…" : "고민 올리기 ↗"}
        </button>
      </form>
    </Modal>
  );
}
