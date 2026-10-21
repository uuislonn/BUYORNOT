"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { previewProduct } from "../_server/actions";
import {
  CATEGORIES,
  type BodySpec,
  type CurationRequest,
  type Product,
  type RequestInput,
} from "../_lib/types";
import { Modal } from "./modal";
import { SamplePhoto } from "./sample-photo";
import s from "./creator.module.css";
const TAGS = [
  "하객룩",
  "출근룩",
  "데일리",
  "여행룩",
  "데이트룩",
  "체형커버",
  "퍼스널컬러",
];
export function RequestForm({
  creatorId,
  edit,
  busy,
  onClose,
  onSubmit,
}: {
  creatorId: string;
  edit?: CurationRequest;
  busy: boolean;
  onClose: () => void;
  onSubmit: (input: RequestInput, editId?: string) => void;
}) {
  const [url, setUrl] = useState(edit?.product.url ?? "");
  const [product, setProduct] = useState<Product | null>(edit?.product ?? null);
  const [concern, setConcern] = useState(edit?.concern ?? "");
  const [tags, setTags] = useState<string[]>(edit?.tags ?? []);
  const [error, setError] = useState("");
  const [duplicate, setDuplicate] = useState<string | null>(null);
  const [previewPending, startPreview] = useTransition();
  const sequence = useRef(0);
  const [spec, setSpec] = useState<Record<string, string>>({
    age: String(edit?.bodySpec.age ?? ""),
    height_cm: String(edit?.bodySpec.height_cm ?? ""),
    weight_kg: String(edit?.bodySpec.weight_kg ?? ""),
    body_type: edit?.bodySpec.body_type ?? "",
    personal_color: edit?.bodySpec.personal_color ?? "",
  });
  const [shared, setShared] = useState<string[]>(
    Object.keys(edit?.bodySpec ?? {}),
  );
  useEffect(() => {
    if (edit) return;
    const current = ++sequence.current;
    let cancelled = false;
    if (!url.trim()) return;
    const timer = window.setTimeout(() => {
      startPreview(async () => {
        try {
          const response = await previewProduct(url, creatorId);
          if (cancelled || current !== sequence.current) return;
          if (response.ok) {
            setProduct(response.data.product);
            setError("");
            if (response.data.duplicateId)
              setDuplicate(response.data.duplicateId);
          } else {
            setProduct(null);
            setError(response.error);
          }
        } catch {
          if (!cancelled && current === sequence.current) {
            setProduct(null);
            setError(
              "미리보기를 불러오지 못했어요. 링크를 다시 확인해 주세요.",
            );
          }
        }
      });
    }, 550);
    return () => {
      window.clearTimeout(timer);
      cancelled = true;
    };
  }, [url, creatorId, edit]);
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!product || previewPending) {
      setError("상품 미리보기가 준비된 후 등록해 주세요.");
      return;
    }
    const values: BodySpec = {};
    for (const key of shared) {
      if (!spec[key]?.trim()) {
        setError("공개를 선택한 신체 정보 값을 입력해 주세요.");
        return;
      }
      if (key === "age" || key === "height_cm" || key === "weight_kg")
        values[key] = Number(spec[key]);
      else if (key === "body_type" || key === "personal_color")
        values[key] = spec[key];
    }
    onSubmit(
      {
        creatorId,
        productUrl: product.url,
        productName: product.name,
        brand: product.brand,
        price: product.price,
        category: product.category,
        concern,
        tags,
        bodySpec: values,
      },
      edit?.id,
    );
  }
  return (
    <>
      <Modal
        title={edit ? "내 고민 수정하기" : "살까, 말까? 고민 남기기"}
        onClose={onClose}
        wide
        busy={busy}
      >
        <p className={s.modalIntro}>
          상품 하나, 고민 하나. 크리에이터에게 취향을 물어보세요.
        </p>
        <form onSubmit={submit} className={s.form}>
          <label>
            상품 URL <span className={s.required}>필수</span>
            <input
              type="url"
              required
              value={url}
              disabled={!!edit || busy}
              placeholder="https://www.musinsa.com/products/..."
              onChange={(e) => {
                setUrl(e.target.value);
                setProduct(null);
                setError("");
              }}
            />
          </label>
          <p className={s.help}>
            무신사 · 29CM · W컨셉 지원. 링크를 입력하면 샘플 미리보기를
            불러옵니다.
          </p>
          {!edit && !url && (
            <button
              type="button"
              className={s.textButton}
              onClick={() => setUrl("https://www.musinsa.com/products/4100101")}
            >
              샘플 링크로 확인하기 ↗
            </button>
          )}
          <div aria-live="polite">
            {previewPending && <p className={s.help}>상품 확인 중…</p>}
            {error && (
              <p role="alert" className={s.error}>
                {error}
              </p>
            )}
          </div>
          {product && (
            <div className={s.preview}>
              <div className={s.previewImage}>
                {product.image ? (
                  <SamplePhoto source={product.image} alt="AI 생성 상품 샘플" />
                ) : (
                  "↗"
                )}
              </div>
              <div>
                <span className={s.miniLabel}>MOCK PREVIEW</span>
                <p>{product.name || "상품명을 직접 입력해 주세요"}</p>
                <small>실제 쇼핑몰 정보·가격 조회 전입니다.</small>
              </div>
            </div>
          )}
          {product && (
            <div className={s.fieldGrid}>
              <label>
                상품명
                <input
                  required
                  maxLength={100}
                  value={product.name}
                  onChange={(e) =>
                    setProduct({ ...product, name: e.target.value })
                  }
                />
              </label>
              <label>
                브랜드
                <input
                  required
                  maxLength={50}
                  value={product.brand}
                  onChange={(e) =>
                    setProduct({ ...product, brand: e.target.value })
                  }
                />
              </label>
              <label>
                가격 (원, 선택)
                <input
                  type="number"
                  min={0}
                  max={100000000}
                  value={product.price ?? ""}
                  onChange={(e) =>
                    setProduct({
                      ...product,
                      price:
                        e.target.value === "" ? null : Number(e.target.value),
                    })
                  }
                />
              </label>
              <label>
                카테고리
                <select
                  value={product.category}
                  onChange={(e) =>
                    setProduct({
                      ...product,
                      category: e.target.value as Product["category"],
                    })
                  }
                >
                  {CATEGORIES.filter((c) => c !== "전체").map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </label>
            </div>
          )}
          <label>
            어떤 점이 고민인가요?
            <textarea
              required
              maxLength={150}
              rows={3}
              value={concern}
              placeholder="핏, 색상, 활용도… 고민을 자유롭게 남겨 주세요."
              onChange={(e) => setConcern(e.target.value)}
            />
            <span className={s.counter} aria-live="polite">
              {concern.length} / 150
            </span>
          </label>
          <fieldset>
            <legend>
              어떤 상황에 필요한가요? <small>최대 4개</small>
            </legend>
            <div className={s.tagOptions}>
              {TAGS.map((tag) => (
                <button
                  type="button"
                  key={tag}
                  aria-pressed={tags.includes(tag)}
                  className={tags.includes(tag) ? s.selectedTag : ""}
                  onClick={() =>
                    setTags(
                      tags.includes(tag)
                        ? tags.filter((t) => t !== tag)
                        : tags.length < 4
                          ? [...tags, tag]
                          : tags,
                    )
                  }
                >
                  #{tag}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>
              신체 정보 공개 <small>선택한 항목만 게시글에 저장됩니다</small>
            </legend>
            <div className={s.specGrid}>
              {[
                ["age", "나이", "number"],
                ["height_cm", "키 (cm)", "number"],
                ["weight_kg", "몸무게 (kg)", "number"],
                ["body_type", "체형", "text"],
                ["personal_color", "퍼스널컬러", "text"],
              ].map(([key, label, type]) => (
                <div key={key}>
                  <label className={s.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={shared.includes(key)}
                      onChange={(e) =>
                        setShared(
                          e.target.checked
                            ? [...shared, key]
                            : shared.filter((k) => k !== key),
                        )
                      }
                    />
                    {label} 공개
                  </label>
                  <input
                    aria-label={label}
                    type={type}
                    disabled={!shared.includes(key)}
                    required={shared.includes(key)}
                    maxLength={30}
                    value={spec[key]}
                    onChange={(e) =>
                      setSpec({ ...spec, [key]: e.target.value })
                    }
                  />
                </div>
              ))}
            </div>
          </fieldset>
          <p className={s.help}>
            공개 룸에 등록됩니다. 개인 연락처나 민감한 정보는 적지 마세요.
            답변이 없으면 30일 후 만료됩니다.
          </p>
          <button
            type="submit"
            className={s.primaryButton}
            disabled={busy || previewPending || !product}
          >
            {busy ? "저장 중…" : edit ? "수정 저장하기" : "고민 등록하기"}
            <span aria-hidden="true">↗</span>
          </button>
        </form>
      </Modal>
      {duplicate && (
        <Modal
          title="이미 함께 고민 중인 상품이에요"
          onClose={() => setDuplicate(null)}
        >
          <p className={s.modalIntro}>
            이 룸에 같은 상품의 고민이 있어요. 중복 등록 대신 기존 고민과 판정을
            확인해 주세요.
          </p>
          <button type="button" className={s.primaryButton} onClick={onClose}>
            기존 룸으로 돌아가기
          </button>
        </Modal>
      )}
    </>
  );
}
