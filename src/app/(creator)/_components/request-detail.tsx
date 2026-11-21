"use client";

import { Discussion } from "../../../features/community/discussion";
import { daysRemaining, effectiveStatus } from "../_lib/policy";
import { getAffiliateLink } from "../_lib/product-url";
import type { CurationRequest, Evaluation } from "../_lib/types";
import { Modal } from "./modal";
import { ProductCardTags } from "./product-card-layout";
import s from "./creator.module.css";

export function RequestDetail({
  request,
  evaluation,
  now,
  onClose,
}: {
  request: CurationRequest;
  evaluation?: Evaluation;
  now: number;
  onClose: () => void;
}) {
  const status = effectiveStatus(request, now);
  return (
    <div className={`${s.shell} ${s.dialogHost}`}>
      <Modal title="살말 고민 자세히 보기" onClose={onClose}>
        <span className={s.miniLabel}>{request.product.brand}</span>
        <h3>{request.product.name}</h3>
        <p className={s.modalIntro}>{request.concern}</p>
        <ProductCardTags
          category={request.product.category}
          tags={request.tags}
        />
        <dl className={s.specDetails}>
          {Object.entries(request.bodySpec).map(([key, value]) => (
            <div key={key}>
              <dt>
                {
                  {
                    age: "나이",
                    height_cm: "키 (cm)",
                    weight_kg: "몸무게 (kg)",
                    body_type: "체형",
                    personal_color: "퍼스널컬러",
                  }[key]
                }
              </dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        {Object.keys(request.bodySpec).length === 0 && (
          <p className={s.help}>작성자가 공개한 신체 정보가 없습니다.</p>
        )}
        <p className={s.help}>
          {status === "ING"
            ? `응답 대기 · ${daysRemaining(request, now)}일 뒤 만료`
            : status === "EXPIRED"
              ? "만료 / 미투표"
              : `${status} 판정 완료`}
        </p>
        {evaluation?.comment && (
          <div className={s.evaluation}>
            <span className={evaluation.decision === "BUY" ? s.blueText : ""}>
              {evaluation.decision}
            </span>
            <p>{evaluation.comment}</p>
          </div>
        )}
        <a
          className={s.primaryButton}
          href={getAffiliateLink(request.product.url)}
          target="_blank"
          rel="noopener noreferrer sponsored"
        >
          쇼핑몰에서 보기
        </a>
        <Discussion
          key={request.id}
          target={{
            kind: "curation",
            roomId: request.creatorId,
            postId: request.id,
          }}
        />
      </Modal>
    </div>
  );
}
