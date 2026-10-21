"use client";
import s from "../../_components/creator.module.css";
export default function ErrorBoundary({ reset }: { reset: () => void }) {
  return (
    <div className={s.shell}>
      <main className={s.main}>
        <div className={s.empty} role="alert">
          <span className={s.miniLabel}>BUY OR NOT</span>
          <h2>룸을 불러오지 못했어요</h2>
          <p>연결 상태를 확인하고 다시 시도해 주세요.</p>
          <button type="button" className={s.primaryButton} onClick={reset}>
            다시 시도하기
          </button>
        </div>
      </main>
    </div>
  );
}
