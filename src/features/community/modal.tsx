"use client";
import { useEffect, useRef } from "react";
import styles from "./community.module.css";
export function Modal({
  title,
  close,
  children,
  actions,
}: {
  title: string;
  close: () => void;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = ref.current;
    el?.showModal();
    return () => el?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className={styles.modal}
      onCancel={close}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <header>
        <h2>{title}</h2>
        <div className={styles.modalHeaderActions}>
          {actions}
          <button aria-label="닫기" onClick={close}>
            ✕
          </button>
        </div>
      </header>
      {children}
    </dialog>
  );
}
