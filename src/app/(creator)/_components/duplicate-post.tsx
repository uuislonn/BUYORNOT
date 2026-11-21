"use client";

import { useEffect, useState } from "react";
import { getPost } from "../../../features/community/actions";
import { VoteResults } from "../../../features/community/vote-buttons";
import { Discussion } from "../../../features/community/discussion";
import type { FeedPost } from "../../../features/community/types";
import type { CurationRequest, Evaluation, Product } from "../_lib/types";
import { getRoomSnapshot } from "../_server/actions";
import { Modal } from "./modal";
import { ProductPreviewCard } from "./product-preview-card";
import { ProductCardTags } from "./product-card-layout";
import s from "./creator.module.css";

type Detail =
  | { kind: "community"; post: FeedPost }
  | { kind: "curation"; post: CurationRequest; evaluation?: Evaluation };

export function DuplicatePost({
  creatorId,
  id,
  product,
  image,
  onClose,
}: {
  creatorId: string;
  id: string;
  product: Product;
  image: string;
  onClose: () => void;
}) {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        if (creatorId) {
          const room = await getRoomSnapshot(creatorId);
          const post = room.requests.find((request) => request.id === id);
          if (!post) throw new Error("Post unavailable");
          if (active)
            setDetail({
              kind: "curation",
              post,
              evaluation: room.evaluations.find(
                (evaluation) => evaluation.requestId === id,
              ),
            });
        } else {
          const result = await getPost(id);
          if (!result.ok) throw new Error("Post unavailable");
          if (active) setDetail({ kind: "community", post: result.data });
        }
      } catch {
        if (active) setFailed(true);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [creatorId, id]);

  return (
    <Modal title="이미 함께 고민 중인 상품이에요" onClose={onClose} wide>
      <p className={s.modalIntro}>
        같은 상품의 고민이 있어요. 기존 글에서 받은 의견과 댓글을 확인할 수
        있어요.
      </p>
      <ProductPreviewCard product={product} image={image} />
      <section className={s.duplicatePost} aria-label="기존 고민">
        {failed ? (
          <p role="alert">기존 글을 불러오지 못했어요.</p>
        ) : !detail ? (
          <p role="status">기존 글을 불러오는 중이에요.</p>
        ) : (
          <>
            <h3>{detail.post.product.name}</h3>
            <p>{detail.post.concern}</p>
            <ProductCardTags
              category={
                detail.kind === "curation"
                  ? detail.post.product.category
                  : detail.post.category
              }
              tags={detail.post.tags}
            />
            {detail.kind === "curation" ? (
              detail.evaluation?.comment && (
                <div className={s.evaluation}>
                  <span
                    className={
                      detail.evaluation.decision === "BUY" ? s.blueText : ""
                    }
                  >
                    {detail.evaluation.decision}
                  </span>
                  <p>{detail.evaluation.comment}</p>
                </div>
              )
            ) : (
              <div>
                <VoteResults buy={detail.post.buy} not={detail.post.not} />
              </div>
            )}
            <Discussion
              target={
                creatorId
                  ? { kind: "curation", roomId: creatorId, postId: id }
                  : { kind: "community", postId: id }
              }
            />
          </>
        )}
      </section>
    </Modal>
  );
}
