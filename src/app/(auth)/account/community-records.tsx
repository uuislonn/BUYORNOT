import Link from "next/link";
import { SamplePhoto } from "../../(creator)/_components/sample-photo";
import type { FeedPost } from "../../../features/community/types";
import { PostActions } from "./post-actions";
import s from "./mypage.module.css";
export function CommunityRecords({
  posts,
  onOpen,
  search = "",
  limit,
  busy,
  onEdit,
  onRemove,
}: {
  posts: FeedPost[];
  onOpen?: (post: FeedPost) => void;
  search?: string;
  limit?: number;
  busy?: boolean;
  onEdit?: (post: FeedPost) => void;
  onRemove?: (post: FeedPost) => void;
}) {
  const participation = !!onOpen;
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
        <Link href="/community">커뮤니티 보기</Link>
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
            살말 커뮤니티 둘러보기
          </Link>
        </div>
      ) : (
        <div>
          {visible.slice(0, limit).map((post) => {
            const image = post.product.image ? (
              <SamplePhoto
                source={post.product.image}
                alt={post.product.name}
                fit="cover"
              />
            ) : (
              <span className={s.imagePlaceholder}>이미지 없음</span>
            );
            const content = (
              <>
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
                <p className={s.brand}>{post.product.brand}</p>
                <h3>{post.product.name}</h3>
                <p className={s.concern}>{post.concern}</p>
                <div className={s.postBottom}>
                  <span>
                    BUY {post.buy} · NOT {post.not}
                  </span>
                  {participation && (
                    <span className={s.resultLink}>투표·결과 보기</span>
                  )}
                </div>
              </>
            );
            return (
              <article
                className={onOpen ? `${s.post} ${s.participationPost}` : s.post}
                key={post.id}
              >
                {onOpen ? (
                  <>
                    <div className={s.productImage}>{image}</div>
                    <div className={s.postContent}>{content}</div>
                    <button
                      type="button"
                      className={s.postDetailButton}
                      aria-label={`${post.product.name} 투표·댓글 보기`}
                      onClick={() => onOpen(post)}
                    />
                  </>
                ) : (
                  <>
                    <a
                      className={s.productImage}
                      href={post.product.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${post.product.name} 쇼핑몰에서 보기`}
                    >
                      {image}
                    </a>
                    <Link
                      className={s.postContent}
                      href={`/community?post=${encodeURIComponent(post.id)}`}
                      aria-label={`${post.product.name} 글과 댓글 보기`}
                    >
                      {content}
                    </Link>
                  </>
                )}
                {onEdit && onRemove && (
                  <PostActions
                    busy={busy}
                    edit={() => onEdit(post)}
                    remove={() => onRemove(post)}
                  />
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
