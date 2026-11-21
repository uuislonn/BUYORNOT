"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { loadDiscussion, submitDiscussionComment } from "./actions";
import type { CommentTarget, DiscussionComment } from "./types";
import styles from "./discussion.module.css";

export function Discussion({ target }: { target: CommentTarget }) {
  const heading = useId();
  const field = useId();
  const { kind, postId } = target;
  const roomId = kind === "curation" ? target.roomId : "";
  const [comments, setComments] = useState<DiscussionComment[] | null>(null);
  const [canComment, setCanComment] = useState(false);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [body, setBody] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let active = true;
    const target =
      kind === "community" ? { kind, postId } : { kind, postId, roomId };
    loadDiscussion(target)
      .then((result) => {
        if (!active) return;
        if (!result.ok) return setError(result.error);
        setComments(result.data.comments);
        setCanComment(result.data.canComment);
      })
      .catch(() => {
        if (active) setError("댓글을 불러오지 못했어요.");
      });
    return () => {
      active = false;
    };
  }, [kind, postId, roomId, attempt]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || !body.trim()) return;
    setPending(true);
    setError("");
    try {
      const result = await submitDiscussionComment(target, body);
      if (!result.ok) return setError(result.error);
      setComments((previous) => [...(previous ?? []), result.data]);
      setBody("");
    } catch {
      setError("댓글을 등록하지 못했어요. 다시 시도해 주세요.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className={styles.discussion} aria-labelledby={heading}>
      <h3 id={heading}>댓글{comments && ` ${comments.length}`}</h3>
      {error && <p role="alert">{error}</p>}
      {comments === null ? (
        error ? (
          <button
            type="button"
            onClick={() => {
              setError("");
              setAttempt((value) => value + 1);
            }}
          >
            다시 불러오기
          </button>
        ) : (
          <p role="status">댓글을 불러오는 중…</p>
        )
      ) : (
        <>
          {comments.length ? (
            <ul>
              {comments.map((comment) => (
                <li key={comment.id}>
                  <strong>{comment.nickname}</strong>{" "}
                  <time dateTime={comment.createdAt}>
                    {new Date(comment.createdAt).toLocaleDateString("ko-KR", {
                      timeZone: "Asia/Seoul",
                    })}
                  </time>
                  <p>{comment.body}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p>아직 댓글이 없어요.</p>
          )}
          {canComment ? (
            <form onSubmit={submit}>
              <label htmlFor={field}>댓글 작성</label>
              <textarea
                id={field}
                value={body}
                onChange={(event) => setBody(event.target.value)}
                rows={3}
                maxLength={500}
                required
                disabled={pending}
              />
              <button type="submit" disabled={pending || !body.trim()}>
                {pending ? "등록 중…" : "댓글 등록"}
              </button>
            </form>
          ) : (
            <Link href="/login">로그인하고 댓글 달기</Link>
          )}
        </>
      )}
    </section>
  );
}
