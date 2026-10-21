"use client";
import type {
  CurationRequest,
  Decision,
  Evaluation,
  Profile,
} from "../_lib/types";
import { daysRemaining } from "../_lib/policy";
import { formatPrice, getAffiliateLink } from "../_lib/product-url";
import { Icon } from "./icons";
import { SamplePhoto } from "./sample-photo";
import s from "./creator.module.css";
export function ProductCard({
  request,
  author,
  evaluation,
  liked,
  own,
  pending,
  now,
  onHeart,
  onEvaluate,
  onEdit,
  onDelete,
  onDetail,
}: {
  request: CurationRequest;
  author?: Profile;
  evaluation?: Evaluation;
  liked: boolean;
  own: boolean;
  pending: boolean;
  now: number;
  onHeart: () => void;
  onEvaluate: (decision: Decision) => void;
  onEdit: () => void;
  onDelete: () => void;
  onDetail: () => void;
}) {
  const remaining = daysRemaining(request, now);
  return (
    <article className={s.card} data-request-id={request.id}>
      <div className={s.cardTop}>
        <span className={s.smallAvatar}>
          {author?.nickname.slice(0, 1) ?? "?"}
        </span>
        <span className={s.authorName}>{author?.nickname ?? "회원"}</span>
        <span
          className={`${s.statusPill} ${request.status === "BUY" ? s.bluePill : ""}`}
        >
          {request.status === "EXPIRED"
            ? "만료 / 미투표"
            : request.status === "ING"
              ? "답변 기다리는 중"
              : request.status}
        </span>
        <button
          type="button"
          className={`${s.iconButton} ${liked ? s.liked : ""}`}
          aria-label={`${request.product.name} ${liked ? "찜 취소" : "찜하기"}`}
          aria-pressed={liked}
          disabled={pending}
          onClick={onHeart}
        >
          <Icon name="heart" size={18} filled={liked} />
        </button>
      </div>
      <a
        className={s.productVisual}
        href={getAffiliateLink(request.product.url)}
        target="_blank"
        rel="noopener noreferrer sponsored"
        aria-label={`${request.product.name} 외부 쇼핑몰에서 보기`}
      >
        {request.product.image ? (
          <SamplePhoto
            source={request.product.image}
            alt={request.product.name}
          />
        ) : (
          <div className={s.imageFallback}>
            <Icon name="bag" size={48} />
            <span>{request.product.name}</span>
            <small>상품 이미지 준비 중</small>
          </div>
        )}
        <span className={s.imageCategory}>{request.product.category}</span>
        <span className={s.productOverlay}>
          <span>{request.product.name}</span>
          <span>{formatPrice(request.product.price)}</span>
        </span>
        <span className={s.imageArrow} aria-hidden="true">
          ↗
        </span>
      </a>
      <div className={s.cardBody}>
        <p className={s.concern}>{request.concern}</p>
        <div className={s.cardTags}>
          {request.tags.map((tag) => (
            <span key={tag}>#{tag}</span>
          ))}
        </div>
        {evaluation && (
          <div className={s.evaluation}>
            <span className={evaluation.decision === "BUY" ? s.blueText : ""}>
              {evaluation.decision === "BUY" ? "O BUY" : "× NOT"}
            </span>
            <p>{evaluation.comment || "크리에이터가 판정을 남겼어요."}</p>
          </div>
        )}
        <div className={s.cardMeta}>
          <button type="button" className={s.textButton} onClick={onDetail}>
            고민 상세 <span aria-hidden="true">↗</span>
          </button>
          <span>
            {new Intl.DateTimeFormat("ko-KR", {
              month: "numeric",
              day: "numeric",
              timeZone: "Asia/Seoul",
            }).format(new Date(request.createdAt))}
          </span>
          {own && (
            <span className={s.ownActions}>
              {request.status === "ING" && (
                <button type="button" disabled={pending} onClick={onEdit}>
                  수정
                </button>
              )}
              <button type="button" disabled={pending} onClick={onDelete}>
                삭제
              </button>
            </span>
          )}
        </div>
        <div className={s.progress} aria-hidden="true">
          <span
            style={{
              width: `${request.status === "ING" ? ((30 - remaining) / 30) * 100 : 100}%`,
              background:
                request.status === "NOT" || request.status === "EXPIRED"
                  ? "#161616"
                  : "#0100FE",
            }}
          />
        </div>
        <p className={s.progressLabel}>
          {request.status === "ING"
            ? `응답 대기 · ${remaining}일 뒤 만료`
            : request.status === "EXPIRED"
              ? "30일 경과 · 미답변 만료"
              : "크리에이터 판정 완료 · 일반 투표가 아닙니다"}
        </p>
        <div className={s.verdictButtons}>
          <button
            type="button"
            className={`${s.buyButton} ${request.status === "BUY" ? s.chosen : ""}`}
            disabled={pending || request.status !== "ING"}
            onClick={() => onEvaluate("BUY")}
            aria-label={`${request.product.name} BUY 판정`}
          >
            BUY <span aria-hidden="true">O</span>
          </button>
          <button
            type="button"
            className={`${s.notButton} ${request.status === "NOT" ? s.chosen : ""}`}
            disabled={pending || request.status !== "ING"}
            onClick={() => onEvaluate("NOT")}
            aria-label={`${request.product.name} NOT 판정`}
          >
            Don&apos;t buy <span aria-hidden="true">×</span>
          </button>
        </div>
      </div>
    </article>
  );
}
