"use client";
import { useState } from "react";
import { Modal } from "./modal";
import styles from "./community.module.css";
export function ClipboardModal({
  openLink,
}: {
  openLink: (url: string) => void;
}) {
  const [url, setUrl] = useState("");
  const [message, setMessage] = useState("");
  async function read() {
    try {
      if (!navigator.clipboard?.readText) throw new Error();
      const value = (await navigator.clipboard.readText()).trim();
      if (!/^https:\/\//.test(value)) {
        setMessage("복사된 HTTPS 상품 링크가 없습니다.");
        return;
      }
      setUrl(value);
      setMessage("");
    } catch {
      setMessage(
        "클립보드를 읽을 수 없습니다. 작성창에 링크를 직접 붙여 넣어 주세요.",
      );
    }
  }
  return (
    <>
      <button className={styles.clipboard} onClick={read}>
        ↗ 복사한 상품 링크로 시작
      </button>
      {message && (
        <p role="status" className={styles.hint}>
          {message}
        </p>
      )}
      {url && (
        <Modal title="이 상품, 살까 말까?" close={() => setUrl("")}>
          <p>클립보드에서 상품 링크를 찾았어요.</p>
          <p className={styles.linkText}>{url}</p>
          <button
            className={styles.primary}
            onClick={() => {
              openLink(url);
              setUrl("");
            }}
          >
            상품 정보 불러오기
          </button>
        </Modal>
      )}
    </>
  );
}
