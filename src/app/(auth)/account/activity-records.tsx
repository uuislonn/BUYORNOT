import Link from "next/link";
import type { AccountActivity } from "./activity-types";
import { LiveProductPrice } from "../../(creator)/_components/live-product-price";
import { SamplePhoto } from "../../(creator)/_components/sample-photo";
import s from "./mypage.module.css";
export function ActivityRecords({
  activity,
  kind,
}: {
  activity: AccountActivity;
  kind: "글" | "상품" | "작성한 댓글" | "알림";
}) {
  if (kind === "알림")
    return (
      <div>
        {activity.notifications.map((item) => (
          <article className={s.communityRecord} key={item.id}>
            <span className={s.status}>새 소식</span>
            <Link href={item.href}>
              <h3>{item.title}</h3>
            </Link>
            <p>{item.text}</p>
            <small>{new Date(item.date).toLocaleDateString("ko-KR")}</small>
          </article>
        ))}
      </div>
    );
  if (kind === "작성한 댓글")
    return (
      <div>
        {activity.comments.map((item) => (
          <article className={s.communityRecord} key={item.id}>
            <span className={s.status}>
              살말 커뮤니티 · {item.post.category}
            </span>
            <Link href={`/community?post=${encodeURIComponent(item.post.id)}`}>
              <h3>{item.post.product.name}</h3>
            </Link>
            <p>{item.text}</p>
            <small>{new Date(item.date).toLocaleDateString("ko-KR")}</small>
          </article>
        ))}
      </div>
    );
  const posts = kind === "상품" ? activity.savedProducts : activity.savedPosts;
  return (
    <div className={s.savedGrid}>
      {posts.map((post) => (
        <article className={s.savedCard} key={post.id}>
          <div className={s.savedVisual}>
            <SamplePhoto
              source={post.product.image}
              alt={post.product.name}
              fit="cover"
            />
          </div>
          <div className={s.savedBody}>
            <small>
              {post.product.brand} · {post.category}
            </small>
            <h3>{post.product.name}</h3>
            <p>
              {kind === "글" ? (
                post.concern
              ) : (
                <LiveProductPrice
                  key={post.product.url}
                  product={{
                    ...post.product,
                    price: post.product.price || null,
                  }}
                />
              )}
            </p>
            <Link
              href={
                kind === "상품"
                  ? post.product.url
                  : `/community?post=${encodeURIComponent(post.id)}`
              }
            >
              {kind === "상품" ? "상품 보러 가기" : "글 보러 가기"}
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}
