import Link from "next/link";
import type { FeedPost } from "../../../features/community/types";
import s from "./mypage.module.css";
export function CommunityRecords({
  posts,
  participation = false,
  search = "",
  limit,
}: {
  posts: FeedPost[];
  participation?: boolean;
  search?: string;
  limit?: number;
}) {
  const term = search.trim().toLowerCase();
  const visible = posts
    .filter((post) =>
      `${post.product.name} ${post.concern} ${post.category}`
        .toLowerCase()
        .includes(term),
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <div>
      <div className={s.postsHeading}>
        <h2>
          {participation ? "참여한 살말 투표" : "살말 커뮤니티 글"}{" "}
          <span>{visible.length}</span>
        </h2>
        <Link href="/community">커뮤니티 보기 ↗</Link>
      </div>
      {!visible.length ? (
        <div className={s.empty}>
          <h3>
            {search
              ? "검색 결과가 없어요"
              : participation
                ? "아직 참여한 투표가 없어요"
                : "아직 작성한 커뮤니티 글이 없어요"}
          </h3>
          <Link className={s.primary} href="/community">
            살말 커뮤니티 둘러보기 ↗
          </Link>
        </div>
      ) : (
        <div>
          {visible.slice(0, limit).map((post) => (
            <article className={s.communityRecord} key={post.id}>
              <div className={s.postMeta}>
                <span className={s.status}>살말 커뮤니티</span>
                <span>{post.category}</span>
                <span>
                  {new Date(post.createdAt).toLocaleDateString("ko-KR", {
                    timeZone: "Asia/Seoul",
                  })}
                </span>
                {participation && <strong>내 선택 {post.myVote}</strong>}
              </div>
              <Link href={`/community?post=${encodeURIComponent(post.id)}`}>
                <h3>{post.product.name}</h3>
              </Link>
              <p className={s.concern}>{post.concern}</p>
              <div className={s.postBottom}>
                <span>
                  BUY {post.buy} · NOT {post.not}
                </span>
                <Link href={`/community?post=${encodeURIComponent(post.id)}`}>
                  {participation ? "투표·결과 보기" : "상세·수정·삭제 보기"} ↗
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
