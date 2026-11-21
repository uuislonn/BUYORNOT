"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SiteHeader } from "../../components/site-header";
import { ProductImage } from "../../features/community/product-image";
import { VoteButtons } from "../../features/community/vote-buttons";
import type { FeedPost } from "../../features/community/types";
import { ProductCardLayout } from "../(creator)/_components/product-card-layout";
import { ProductCard } from "../(creator)/_components/product-card";
import type { Snapshot } from "../(creator)/_lib/types";
import { effectiveStatus } from "../(creator)/_lib/policy";
import { toggleRequestHeart } from "../(creator)/_server/actions";
import community from "../../features/community/community.module.css";
import styles from "./search.module.css";
export function SearchResults({
  query,
  initialPosts,
  rooms,
  communityError,
}: {
  query: string;
  initialPosts: FeedPost[];
  rooms: Snapshot[];
  communityError: string;
}) {
  const router = useRouter();
  const [posts, setPosts] = useState(initialPosts);
  const [roomData, setRooms] = useState(rooms);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const viewer = rooms[0]?.viewer;
  const matches = (text: string) =>
    text.toLocaleLowerCase().includes(query.toLocaleLowerCase());
  const votes = query
    ? posts.filter((p) =>
        matches(
          `${p.product.name} ${p.product.brand} ${p.concern} ${p.nickname}`,
        ),
      )
    : [];
  const curations = query
    ? roomData.flatMap((room) =>
        room.requests
          .filter((p) =>
            matches(
              `${p.product.name} ${p.product.brand} ${p.concern} ${room.creator.title}`,
            ),
          )
          .map((request) => ({ room, request })),
      )
    : [];
  const login = () =>
    router.push(`/login?next=${encodeURIComponent(`/search?q=${query}`)}`);
  async function heart(room: Snapshot, id: string) {
    if (!viewer) return login();
    if (busy) return;
    const previous = roomData;
    setBusy(true);
    setError("");
    setRooms((all) =>
      all.map((r) =>
        r.creator.id === room.creator.id
          ? {
              ...r,
              likedIds: r.likedIds.includes(id)
                ? r.likedIds.filter((x) => x !== id)
                : [...r.likedIds, id],
            }
          : r,
      ),
    );
    try {
      const result = await toggleRequestHeart(id, room.creator.id);
      if (!result.ok) throw new Error(result.error);
    } catch (e) {
      setRooms(previous);
      setError(e instanceof Error ? e.message : "마음을 저장하지 못했어요.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <SiteHeader
        currentPage="home"
        loggedIn={!!viewer}
        accountName={viewer?.nickname}
        accountAvatar={viewer?.avatar}
      />
      <main className={styles.main}>
        <h1>검색</h1>
        <form action="/search" className={styles.search} role="search">
          <input
            name="q"
            type="search"
            aria-label="검색어"
            placeholder="상품, 브랜드, 크리에이터 검색"
            defaultValue={query}
            maxLength={100}
            required
          />
          <button type="submit">검색</button>
        </form>
        {query ? (
          <p className={styles.summary}>
            ‘{query}’ 검색 결과 {votes.length + curations.length}개
          </p>
        ) : (
          <p>찾고 싶은 상품이나 브랜드를 검색해 보세요.</p>
        )}
        {error && <p role="alert">{error}</p>}
        <section aria-labelledby="vote-results">
          <h2 id="vote-results">
            살말 투표 <span>{votes.length}</span>
          </h2>
          {communityError && <p role="alert">{communityError}</p>}
          {!votes.length && (
            <p className={styles.empty}>
              {query
                ? "검색어에 맞는 살말 투표가 없어요."
                : "검색하면 살말 투표가 여기에 표시돼요."}
            </p>
          )}
          <div className={styles.grid}>
            {votes.map((p, i) => {
              const href = `/community?post=${encodeURIComponent(p.id)}`;
              return (
                <ProductCardLayout
                  key={p.id}
                  author={p.nickname}
                  authorHref={href}
                  product={{ ...p.product, price: p.product.price || null }}
                  image={<ProductImage post={p} eager={i < 4} />}
                  concern={
                    <Link className={community.cardConcern} href={href}>
                      {p.concern}
                    </Link>
                  }
                  category={p.category}
                  tags={p.tags}
                >
                  <VoteButtons
                    post={p}
                    loggedIn={!!viewer}
                    login={login}
                    update={(next) =>
                      setPosts((all) =>
                        all.map((x) => (x.id === next.id ? next : x)),
                      )
                    }
                  />
                </ProductCardLayout>
              );
            })}
          </div>
        </section>
        <section aria-labelledby="curation-results">
          <h2 id="curation-results">
            큐레이션 룸 <span>{curations.length}</span>
          </h2>
          {!curations.length && (
            <p className={styles.empty}>
              {query
                ? "검색어에 맞는 큐레이션 글이 없어요."
                : "검색하면 큐레이션 글이 여기에 표시돼요."}
            </p>
          )}
          <div className={styles.grid}>
            {curations.map(({ room, request }) => {
              const url = `/creators/${room.creator.id}?status=ALL#request-${request.id}`;
              const open = () => router.push(url);
              return (
                <div key={`${room.creator.id}-${request.id}`}>
                  <Link href={url} className={styles.room}>
                    {room.creator.title}
                  </Link>
                  <ProductCard
                    request={{
                      ...request,
                      status: effectiveStatus(
                        request,
                        new Date(room.serverTime).getTime(),
                      ),
                    }}
                    author={room.profiles.find(
                      (p) => p.id === request.authorId,
                    )}
                    evaluation={room.evaluations.find(
                      (e) => e.requestId === request.id,
                    )}
                    liked={room.likedIds.includes(request.id)}
                    own={false}
                    pending={busy}
                    now={new Date(room.serverTime).getTime()}
                    onHeart={() => heart(room, request.id)}
                    onEvaluate={open}
                    onEdit={open}
                    onDelete={open}
                    onDetail={open}
                  />
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </>
  );
}
