"use client";
import type {
  CurationRequest,
  Decision,
  Evaluation,
  Profile,
} from "../_lib/types";
import { daysRemaining } from "../_lib/policy";
import { getAffiliateLink } from "../_lib/product-url";
import { ProductCardLayout } from "./product-card-layout";
import { CommentButton } from "./comment-button";
import { SaveHeart } from "./save-heart";
import { Icon } from "./icons";
import { SamplePhoto } from "./sample-photo";
import s from "./creator.module.css";
export function ProductCard({
  canEvaluate = false,
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
  canEvaluate?: boolean;
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
    <ProductCardLayout
      requestId={request.id}
      author={author?.nickname ?? "회원"}
      product={{
        ...request.product,
        url: getAffiliateLink(request.product.url),
      }}
      image={
        request.product.image ? (
          <SamplePhoto
            key={request.product.image}
            source={request.product.image}
            fit="cover"
            alt={request.product.name}
          />
        ) : (
          <div className={s.imageFallback}>
            <Icon name="bag" size={48} />
            <small>상품 이미지 준비 중</small>
          </div>
        )
      }
      actions={
        <SaveHeart
          name={request.product.name}
          liked={liked}
          pending={pending}
          onClick={onHeart}
        />
      }
      commentAction={<CommentButton onClick={onDetail} />}
      concern={request.concern}
      category={request.product.category}
      tags={request.tags}
    >
      {evaluation && (
        <div className={s.evaluation}>
          <span className={evaluation.decision === "BUY" ? s.blueText : ""}>
            {evaluation.decision === "BUY" ? "O BUY" : "× NOT"}
          </span>
          <p>{evaluation.comment || "크리에이터가 판정을 남겼어요."}</p>
        </div>
      )}
      <div className={s.cardMeta}>
        <span
          className={`${s.statusPill} ${request.status === "BUY" ? s.bluePill : ""}`}
        >
          {request.status === "EXPIRED"
            ? "만료 / 미투표"
            : request.status === "ING"
              ? canEvaluate && request.held
                ? "보류"
                : "답변 기다리는 중"
              : request.status}
        </span>
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
      <p className={s.requestStatus}>
        {request.status === "ING"
          ? `응답 대기 · ${remaining}일 뒤 만료`
          : request.status === "EXPIRED"
            ? "30일 경과 · 미답변 만료"
            : "크리에이터 판정 완료 · 일반 투표가 아닙니다"}
      </p>
      {canEvaluate && (
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
      )}
    </ProductCardLayout>
  );
}
