"use client";
import { useState } from "react";
import { votePost } from "./actions";
import type { Choice, FeedPost } from "./types";
import styles from "./community.module.css";
export function VoteButtons({
  post,
  loggedIn,
  login,
  update,
}: {
  post: FeedPost;
  loggedIn: boolean;
  login: () => void;
  update: (post: FeedPost) => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const total = post.buy + post.not;
  const percent = total ? Math.round((post.buy / total) * 100) : 0;
  async function vote(choice: Choice) {
    if (!loggedIn) return login();
    if (pending) return;
    setPending(true);
    setError("");
    const old = post;
    const next = {
      ...post,
      buy: post.buy - Number(post.myVote === "BUY"),
      not: post.not - Number(post.myVote === "NOT"),
      myVote: post.myVote === choice ? null : choice,
    };
    if (next.myVote === "BUY") next.buy++;
    if (next.myVote === "NOT") next.not++;
    update(next);
    try {
      const r = await votePost(post.id, choice);
      if (!r.ok) throw new Error(r.error);
      update(r.data);
    } catch (e) {
      update(old);
      setError(
        e instanceof Error ? e.message : "투표 저장 실패. 다시 시도해 주세요.",
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <div className={styles.votes}>
      <div className={styles.results}>
        <strong>BUY {percent}%</strong>
        <span>{total.toLocaleString("ko-KR")}명 참여</span>
        <span>NOT {total ? 100 - percent : 0}%</span>
      </div>
      <div
        className={styles.track}
        role="meter"
        aria-label="BUY 투표 비율"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <span style={{ width: `${percent}%` }} />
      </div>
      <div className={styles.voteRow}>
        <button
          disabled={pending}
          aria-pressed={post.myVote === "BUY"}
          onClick={() => vote("BUY")}
        >
          ↗ BUY {post.myVote === "BUY" && "✓"}
        </button>
        <button
          disabled={pending}
          aria-pressed={post.myVote === "NOT"}
          onClick={() => vote("NOT")}
        >
          ✕ NOT {post.myVote === "NOT" && "✓"}
        </button>
      </div>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
