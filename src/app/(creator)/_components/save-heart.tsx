"use client";
import { Icon } from "./icons";
import s from "./creator.module.css";

export function SaveHeart({
  name,
  liked,
  pending,
  onClick,
}: {
  name: string;
  liked: boolean;
  pending: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`${s.iconButton} ${s.heartButton} ${liked ? s.liked : ""}`}
      aria-label={`${name} ${liked ? "찜 취소" : "찜하기"}`}
      aria-pressed={liked}
      disabled={pending}
      onClick={onClick}
    >
      <span className={s.heartGlyph} aria-hidden="true">
        <Icon name="heart" size={18} />
        <span className={s.heartFill}>
          <Icon name="heart" size={18} filled />
        </span>
      </span>
    </button>
  );
}
