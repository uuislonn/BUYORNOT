"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import { previewProduct } from "../_server/actions";
import {
  CATEGORIES,
  type CurationRequest,
  type Product,
  type RequestInput,
} from "../_lib/types";
import { SITUATIONS, retainSituationTags } from "../_lib/situations";
import { validateProductImageUrl } from "../_lib/product-url";
import { getBodyProfile } from "../../../lib/auth/body-profile";
import { disclosedBodyProfile } from "../_lib/body-profile";
import {
  BodyValueInput,
  PersonalColorSelect,
  BodyTypeSelect,
} from "./body-value-input";
import { ProductPrice } from "./product-price";
import { Modal } from "./modal";
import { SamplePhoto } from "./sample-photo";
import s from "./creator.module.css";
export function RequestForm({
  creatorId,
  edit,
  busy,
  onClose,
  onSubmit,
  serverError,
}: {
  creatorId: string;
  edit?: CurationRequest;
  busy: boolean;
  serverError?: string;
  onClose: () => void;
  onSubmit: (input: RequestInput, editId?: string) => void;
}) {
  const [url, setUrl] = useState(edit?.product.url ?? "");
  const [product, setProduct] = useState<Product | null>(edit?.product ?? null);
  const [concern, setConcern] = useState(edit?.concern ?? "");
  const [tags, setTags] = useState<string[]>(
    edit ? retainSituationTags(edit.tags, edit.product.category) : [],
  );
  const situation = product ? SITUATIONS[product.category] : null;
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [imageReady, setImageReady] = useState(!!edit?.product.image);
  const [profileNotice, setProfileNotice] = useState("");
  const [profilePending, startProfile] = useTransition();
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
            setTags((current) =>
              retainSituationTags(current, response.data.product.category),
            );
            setImageReady(false);
            setWarning(response.data.warning ?? "");
            setDuplicate(response.data.duplicateId);
            setError("");
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
  let safeImage = "";
  try {
    safeImage = product?.image ? validateProductImageUrl(product.image) : "";
  } catch {
    /* Wait for a complete supported image URL. */
  }
  function activateBodyField(key: string) {
    setShared((current) =>
      current.includes(key) ? current : [...current, key],
    );
  }
  function changeBodyField(key: string, value: string) {
    setSpec((current) => ({ ...current, [key]: value }));
    if (value.trim()) activateBodyField(key);
    else setShared((current) => current.filter((field) => field !== key));
  }
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!product || previewPending || (!edit && !imageReady)) {
      setError("상품 미리보기가 준비된 후 등록해 주세요.");
      return;
    }
    try {
      validateProductImageUrl(product.image);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "상품 이미지를 확인해 주세요.",
      );
      return;
    }
    let values;
    try {
      values = disclosedBodyProfile(spec, shared);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "공개할 정보를 확인해 주세요.",
      );
      return;
    }
    onSubmit(
      {
        creatorId,
        productUrl: product.url,
        productName: product.name,
        productImage: product.image,
        brand: product.brand,
        price: product.price,
        originalPrice: product.originalPrice,
        discountRate: product.discountRate,
        category: product.category,
        concern,
        tags: retainSituationTags(tags, product.category),
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
                setTags([]);
                setImageReady(false);
                setWarning("");
                setDuplicate(null);
                setError("");
              }}
            />
          </label>
          <p className={s.help}>
            무신사 · 29CM · W컨셉 상품 상세 링크를 입력하면 해당 상품의 대표
            이미지를 불러옵니다.
          </p>
          {!edit && !url && (
            <button
              type="button"
              className={s.textButton}
              onClick={() => setUrl("https://www.musinsa.com/products/4443613")}
            >
              상품 링크 예시로 확인하기 ↗
            </button>
          )}
          <div aria-live="polite">
            {previewPending && <p className={s.help}>상품 확인 중…</p>}
            {(error || serverError) && (
              <p role="alert" className={s.error}>
                {error || serverError}
              </p>
            )}
          </div>
          {warning && (
            <p className={s.help} role="status">
              {warning}
            </p>
          )}
          {product && (
            <div className={s.preview}>
              <div className={s.previewImage}>
                {safeImage ? (
                  <SamplePhoto
                    key={product.image}
                    source={safeImage}
                    alt={product.name || "상품 대표 이미지"}
                    onLoad={() => setImageReady(true)}
                    onError={() => setImageReady(false)}
                  />
                ) : (
                  "↗"
                )}
              </div>
              <div>
                <span className={s.miniLabel}>상품 대표 이미지</span>
                <p>{product.name || "상품명을 직접 입력해 주세요"}</p>
                <ProductPrice product={product} />
                <small>
                  클릭 시 입력한 상품 상세 페이지로 이동합니다. 가격과 옵션은
                  쇼핑몰에서 확인해 주세요.
                </small>
              </div>
            </div>
          )}
          {product && (
            <>
              <label>
                상품 대표 이미지 주소
                <input
                  type="url"
                  required
                  value={product.image}
                  placeholder="상품 페이지의 첫 번째 사진 → 이미지 주소 복사"
                  onChange={(e) => {
                    setImageReady(false);
                    setProduct({ ...product, image: e.target.value });
                  }}
                />
              </label>
              <p className={s.help}>
                자동으로 불러오지 못했거나 다른 사진이면, 쇼핑몰 상품의 첫 번째
                사진을 우클릭해 이미지 주소를 복사해 주세요.
              </p>
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
                    onChange={(e) => {
                      const category = e.target.value as Product["category"];
                      setProduct({ ...product, category });
                      setTags((current) =>
                        retainSituationTags(current, category),
                      );
                    }}
                  >
                    {CATEGORIES.filter((c) => c !== "전체").map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </label>
              </div>
            </>
          )}
          <label>
            어떤 점이 고민인가요?
            <textarea
              required
              maxLength={150}
              rows={3}
              value={concern}
              placeholder={
                situation?.placeholder ??
                "상품에 대해 고민되는 점을 자유롭게 남겨 주세요."
              }
              onChange={(e) => setConcern(e.target.value)}
            />
            <span className={s.counter} aria-live="polite">
              {concern.length} / 150
            </span>
          </label>
          <fieldset>
            <legend>
              {situation?.prompt ?? "어떤 상황에 필요한가요?"}{" "}
              <small>선택 · 최대 4개</small>
            </legend>
            <p className={s.help} role="status">
              {product
                ? `${product.category}에 맞는 상황을 골라 주세요. 카테고리를 바꾸면 해당하지 않는 선택은 해제돼요.`
                : "상품 링크를 확인하면 카테고리에 맞는 상황 카드가 나타나요."}
            </p>
            <div className={s.tagOptions}>
              {(situation?.tags ?? []).map((tag) => (
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
              신체 정보 공개{" "}
              <small>
                입력칸을 누르면 공개 체크가 켜져요. 체크를 끄면 공개되지 않아요.
              </small>
            </legend>
            <button
              type="button"
              className={s.textButton}
              disabled={busy || profilePending}
              onClick={() =>
                startProfile(async () => {
                  try {
                    const result = await getBodyProfile();
                    if (!result.ok) {
                      setProfileNotice(result.message);
                      return;
                    }
                    if (!Object.keys(result.profile).length) {
                      setProfileNotice(
                        "저장한 정보가 없어요. 마이페이지 → 계정 설정에서 먼저 저장해 주세요.",
                      );
                      return;
                    }
                    const imported = Object.fromEntries(
                      Object.entries(result.profile).map(([key, value]) => [
                        key,
                        String(value),
                      ]),
                    );
                    setSpec((current) => ({ ...current, ...imported }));
                    setShared([]);
                    setProfileNotice(
                      "내 정보를 불러왔어요. 아래에서 이번 글에 공개할 항목을 직접 선택해 주세요.",
                    );
                  } catch {
                    setProfileNotice(
                      "정보를 불러오지 못했어요. 다시 시도해 주세요.",
                    );
                  }
                })
              }
            >
              {profilePending ? "정보 불러오는 중…" : "내 정보 불러오기 ↙"}
            </button>
            {profileNotice && (
              <p className={s.help} role="status">
                {profileNotice}
              </p>
            )}
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
                  {type === "number" ? (
                    <BodyValueInput
                      fieldKey={key as "age" | "height_cm" | "weight_kg"}
                      label={label}
                      value={spec[key]}
                      disabled={busy}
                      required={shared.includes(key)}
                      onFocus={() => activateBodyField(key)}
                      onChange={(value) => changeBodyField(key, value)}
                    />
                  ) : key === "personal_color" ? (
                    <PersonalColorSelect
                      value={spec[key]}
                      disabled={busy}
                      required={shared.includes(key)}
                      onFocus={() => activateBodyField(key)}
                      onChange={(value) => changeBodyField(key, value)}
                    />
                  ) : (
                    <BodyTypeSelect
                      value={spec[key]}
                      disabled={busy}
                      required={shared.includes(key)}
                      onFocus={() => activateBodyField(key)}
                      onChange={(value) => changeBodyField(key, value)}
                    />
                  )}
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
            disabled={busy || previewPending || !product || !imageReady}
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
