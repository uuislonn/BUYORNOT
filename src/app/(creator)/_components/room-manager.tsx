"use client";
import { SiteHeader } from "../../../components/site-header";
import Link from "next/link";
import { useState, useTransition } from "react";
import { CATEGORIES, type Snapshot } from "../_lib/types";
import { CategoryFilter } from "../../../features/community/category-filter";
import { effectiveStatus, roomStatus, type RoomStatus } from "../_lib/policy";
import { updateCreatorRoom } from "../_server/actions";
import { SamplePhoto } from "./sample-photo";
import s from "./room-manager.module.css";
export function RoomManager({ initial }: { initial: Snapshot }) {
  const [data, setData] = useState(initial);
  const [tab, setTab] = useState<"questions" | "settings">("questions");
  const [filter, setFilter] = useState<RoomStatus>("ING");
  const [category, setCategory] = useState("전체");
  const [title, setTitle] = useState(initial.creator.title);
  const [bio, setBio] = useState(initial.creator.bio);
  const [notice, setNotice] = useState("");
  const [pending, startTransition] = useTransition();
  const now = Date.parse(initial.serverTime);
  const posts = data.requests.map((post) => ({
    ...post,
    status: effectiveStatus(post, now),
  }));
  const count = (status: RoomStatus) =>
    posts.filter((post) => roomStatus(post, true) === status).length;
  const visible = posts.filter(
    (post) =>
      roomStatus(post, true) === filter &&
      (category === "전체" || post.product.category === category),
  );
  const room = `/creators/${data.creator.id}`;
  return (
    <div className={s.page}>
      <SiteHeader
        currentPage="creators"
        loggedIn={!!data.viewer}
        accountName={data.viewer?.nickname}
        accountAvatar={data.viewer?.avatar}
      />
      <main className={s.main}>
        <p className={s.eyebrow}>
          CREATOR STUDIO · <Link href={room}>공개 룸 보기</Link>
        </p>
        <h1>내 큐레이션 룸 관리</h1>
        <p className={s.intro}>
          {data.viewer?.nickname}님, 회원들의 고민에 나만의 선택을 들려주세요.
        </p>
        <section className={s.stats} aria-label="룸 활동 요약">
          {(
            [
              ["ING", "답변 대기"],
              ["HOLD", "보류"],
              ["BUY", "BUY 판정"],
              ["NOT", "NOT 답변"],
              ["EXPIRED", "기한 만료"],
            ] as const
          ).map(([status, label]) => (
            <button
              key={status}
              onClick={() => {
                setFilter(status);
                setTab("questions");
              }}
            >
              <span>{label}</span>
              <strong>
                {count(status)}
                <small>개</small>
              </strong>
            </button>
          ))}
          <div>
            <span>팔로워</span>
            <strong>
              {data.followerCount}
              <small>명</small>
            </strong>
          </div>
        </section>
        <div className={s.tabs}>
          <button
            aria-pressed={tab === "questions"}
            onClick={() => setTab("questions")}
          >
            받은 고민 관리
          </button>
          <button
            aria-pressed={tab === "settings"}
            onClick={() => setTab("settings")}
          >
            룸 정보 설정
          </button>
          <Link href={`${room}?view=shop`}>추천 숍 확인</Link>
        </div>
        {tab === "questions" ? (
          <section>
            <CategoryFilter
              categories={CATEGORIES}
              value={category}
              onChange={setCategory}
            />
            <div className={s.filters}>
              {(
                [
                  ["ING", "답변 대기"],
                  ["HOLD", "보류"],
                  ["BUY", "BUY"],
                  ["NOT", "NOT"],
                  ["EXPIRED", "만료"],
                ] as const
              ).map(([status, label]) => (
                <button
                  key={status}
                  aria-pressed={filter === status}
                  onClick={() => setFilter(status)}
                >
                  {label} {count(status)}
                </button>
              ))}
            </div>
            <p>
              답변 대기 고민은 룸에서 상품과 회원이 공개한 정보를 확인한 뒤 BUY
              또는 NOT으로 답변할 수 있어요.
            </p>
            <div className={s.list}>
              {visible
                .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
                .map((post) => (
                  <article key={post.id} className={s.card}>
                    <div className={s.photo}>
                      <SamplePhoto
                        source={post.product.image}
                        alt={post.product.name}
                        fit="cover"
                      />
                    </div>
                    <div>
                      <small>
                        {data.profiles.find(
                          (profile) => profile.id === post.authorId,
                        )?.nickname ?? "회원"}{" "}
                        · {post.product.category}
                      </small>
                      <h2>{post.product.name}</h2>
                      <p>{post.concern}</p>
                      <small>
                        {new Date(post.createdAt).toLocaleDateString("ko-KR")} ·{" "}
                        {roomStatus(post, true) === "HOLD"
                          ? "보류"
                          : post.status}
                      </small>
                    </div>
                    <Link
                      href={`${room}?view=room&status=${filter}&category=${encodeURIComponent(post.product.category)}#request-${post.id}`}
                    >
                      {filter === "ING" || filter === "HOLD"
                        ? "고민 확인·답변하기"
                        : "답변 내역 보기"}
                    </Link>
                  </article>
                ))}
            </div>
            {!visible.length && (
              <p className={s.empty}>해당 상태의 고민이 없어요.</p>
            )}
          </section>
        ) : (
          <section className={s.settings}>
            <h2>룸 정보 설정</h2>
            <p>저장한 이름과 소개는 공개 큐레이션 룸에 반영돼요.</p>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                setNotice("");
                startTransition(async () => {
                  try {
                    const result = await updateCreatorRoom(data.creator.id, {
                      title,
                      bio,
                    });
                    if (result.ok) {
                      setData(result.data);
                      setNotice("룸 정보를 저장했어요.");
                    } else setNotice(result.error);
                  } catch {
                    setNotice("저장하지 못했어요. 다시 시도해 주세요.");
                  }
                });
              }}
            >
              <label>
                룸 이름
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  minLength={2}
                  maxLength={60}
                  required
                />
              </label>
              <label>
                룸 소개
                <textarea
                  value={bio}
                  onChange={(event) => setBio(event.target.value)}
                  minLength={2}
                  maxLength={300}
                  rows={5}
                  required
                />
              </label>
              <button disabled={pending}>
                {pending ? "저장 중…" : "변경 내용 저장"}
              </button>
              <p role="status">{notice}</p>
            </form>
          </section>
        )}
      </main>
    </div>
  );
}
