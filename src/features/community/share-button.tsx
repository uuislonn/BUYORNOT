"use client";

import { useState } from "react";
import { createPostShareUrl, sharePost } from "./share";
import type { FeedPost } from "./types";
import styles from "./share-button.module.css";

export function ShareButton({ post }: { post: FeedPost }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [manualUrl, setManualUrl] = useState("");

  async function share() {
    if (busy || post.visibility !== "PUBLIC") return;
    setBusy(true);
    setMessage("");
    setManualUrl("");
    const url = createPostShareUrl(window.location.origin, post.id);
    try {
      const result = await sharePost(
        { title: `${post.product.name} · Buy or Not`, url },
        {
          share: navigator.share?.bind(navigator),
          writeText: navigator.clipboard?.writeText.bind(navigator.clipboard),
        },
      );
      if (result === "copied") setMessage("게시글 링크를 복사했어요.");
      else if (result === "manual") {
        setManualUrl(url);
        setMessage("아래 링크를 직접 복사해 공유해 주세요.");
      }
    } finally {
      setBusy(false);
    }
  }

  if (post.visibility !== "PUBLIC") return null;

  return (
    <div className={styles.share}>
      <button
        type="button"
        className={styles.button}
        aria-label="게시글 공유하기"
        title="게시글 공유하기"
        disabled={busy}
        onClick={share}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 16V3m-5 5 5-5 5 5M4 15v5a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-5" />
        </svg>
      </button>
      {message && (
        <div className={styles.feedback}>
          <p role="status">{message}</p>
          {manualUrl && (
            <input
              aria-label="게시글 공유 링크"
              value={manualUrl}
              readOnly
              onFocus={(event) => event.currentTarget.select()}
            />
          )}
        </div>
      )}
    </div>
  );
}
