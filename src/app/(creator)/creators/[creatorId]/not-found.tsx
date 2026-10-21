import Link from "next/link";
import s from "../../_components/creator.module.css";
export default function NotFound() {
  return (
    <div className={s.shell}>
      <main className={s.main}>
        <div className={s.empty}>
          <span className={s.miniLabel}>404 · BUY OR NOT</span>
          <h2>크리에이터 룸을 찾을 수 없어요</h2>
          <p>주소를 확인하거나 다른 룸을 둘러보세요.</p>
          <Link href="/creators" className={s.primaryButton}>
            큐레이션 룸으로 돌아가기
          </Link>
        </div>
      </main>
    </div>
  );
}
