import type { ReactNode } from "react";
import s from "./mypage.module.css";

export function PostActions({
  children,
  busy,
  edit,
  remove,
  editUnavailable,
}: {
  children?: ReactNode;
  busy?: boolean;
  edit: () => void;
  remove: () => void;
  editUnavailable?: string;
}) {
  return (
    <div className={s.postActions}>
      {children}
      <div className={s.postActionButtons}>
        <button
          type="button"
          disabled={busy || !!editUnavailable}
          title={editUnavailable}
          onClick={edit}
        >
          수정
        </button>
        <span aria-hidden="true">|</span>
        <button type="button" disabled={busy} onClick={remove}>
          삭제
        </button>
      </div>
    </div>
  );
}
