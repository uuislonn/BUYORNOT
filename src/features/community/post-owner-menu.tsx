"use client";
import { useRef } from "react";
import styles from "./post-owner-menu.module.css";

export function PostOwnerMenu({
  isOwner,
  edit,
  remove,
}: {
  isOwner: boolean;
  edit: () => void;
  remove: () => void;
}) {
  const ref = useRef<HTMLDetailsElement>(null);
  if (!isOwner) return null;
  function choose(action: () => void) {
    if (ref.current) ref.current.open = false;
    action();
  }
  return (
    <details ref={ref} className={styles.menu}>
      <summary aria-label="게시글 관리" title="게시글 관리">
        …
      </summary>
      <div className={styles.options}>
        <button type="button" onClick={() => choose(edit)}>
          수정하기
        </button>
        <button type="button" onClick={() => choose(remove)}>
          삭제하기
        </button>
      </div>
    </details>
  );
}
