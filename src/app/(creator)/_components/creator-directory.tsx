"use client";
import { SortMenu } from "../../../features/community/sort-menu";
import { CategoryFilter } from "../../../features/community/category-filter";
import {
  CATEGORIES,
  type Application,
  type ApplicationInput,
} from "../_lib/types";
import { SiteHeader } from "../../../components/site-header";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  submitCreatorApplication,
  toggleCreatorFollow,
} from "../_server/actions";
import { ApplicationForm } from "./application-form";
import { Modal } from "./modal";
import roomStyles from "./creator.module.css";
import { SamplePhoto } from "./sample-photo";
import s from "./creator-directory.module.css";
export type DirectoryRoom = {
  id: string;
  title: string;
  bio: string;
  topics: string[];
  cover: string;
  nickname: string;
  avatar: string;
  following: boolean;
  mine: boolean;
  categories: string[];
  searchTerms?: string;
};
export function CreatorDirectory({
  rooms,
  signedIn = false,
  accountName,
  accountAvatar,
  initialSearch = "",
  applicationRoomId,
  application: initialApplication,
}: {
  rooms: DirectoryRoom[];
  signedIn?: boolean;
  accountName?: string;
  accountAvatar?: string;
  initialSearch?: string;
  applicationRoomId?: string;
  application?: Application;
}) {
  const router = useRouter();
  const [followStates, setFollowStates] = useState<Record<string, boolean>>({});
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [application, setApplication] = useState(initialApplication);
  const [applicationView, setApplicationView] = useState<
    "form" | "status" | null
  >(null);
  const [applicationError, setApplicationError] = useState("");
  const [applying, startApplication] = useTransition();
  function submitApplication(input: ApplicationInput) {
    if (!applicationRoomId || applying) return;
    setApplicationError("");
    startApplication(async () => {
      try {
        const result = await submitCreatorApplication(input, applicationRoomId);
        if (!result.ok) {
          setApplicationError(result.error);
          return;
        }
        setApplication(result.data.ownApplication ?? undefined);
        setApplicationView("status");
      } catch {
        setApplicationError(
          "개설 신청을 접수하지 못했어요. 다시 시도해 주세요.",
        );
      }
    });
  }
  function followRoom(id: string) {
    if (!signedIn) {
      router.push("/login");
      return;
    }
    if (pending) return;
    setMessage("");
    startTransition(async () => {
      try {
        const result = await toggleCreatorFollow(id);
        if (!result.ok) {
          if (result.code === "UNAUTHENTICATED") {
            router.push("/login");
            return;
          }
          setMessage(result.error);
          return;
        }
        setFollowStates((previous) => ({
          ...previous,
          [id]: result.data.following,
        }));
      } catch {
        setMessage("팔로우를 변경하지 못했어요. 다시 시도해 주세요.");
      }
    });
  }
  const currentRooms = rooms.map((room) => ({
    ...room,
    following: followStates[room.id] ?? room.following,
  }));
  const [search, setSearch] = useState(initialSearch);
  const [category, setCategory] = useState("전체");
  const [following, setFollowing] = useState(false);
  const [sort, setSort] = useState("recommended");
  const ownRooms = currentRooms.filter((room) => room.mine);
  const filteredRooms = currentRooms.filter(
    (room) =>
      !room.mine &&
      (!following || room.following) &&
      (category === "전체" || room.categories.includes(category)) &&
      `${room.nickname} ${room.title} ${room.bio} ${room.topics.join(" ")} ${room.searchTerms ?? ""}`
        .toLowerCase()
        .includes(search.trim().toLowerCase()),
  );
  const visible =
    sort === "name"
      ? [...filteredRooms].sort((a, b) =>
          a.nickname.localeCompare(b.nickname, "ko"),
        )
      : filteredRooms;
  function renderRoom(room: DirectoryRoom) {
    return (
      <article className={s.card} key={room.id}>
        <div className={s.identity}>
          <Link
            href={`/creators/${room.id}`}
            className={s.cardLink}
            aria-label={`${room.nickname}의 ${room.title} 열기`}
          />
          <div className={s.cover}>
            {room.cover && (
              <SamplePhoto
                source={room.cover}
                alt={`${room.nickname} 룸 배너`}
                fit="cover"
              />
            )}
          </div>
          <div className={s.details}>
            <div className={s.profile}>
              <div className={s.avatar}>
                {room.avatar ? (
                  <SamplePhoto source={room.avatar} alt="" fit="cover" />
                ) : (
                  room.nickname.slice(0, 1)
                )}
              </div>
              <span>
                <small>CREATOR</small>
                <strong>{room.nickname}</strong>
              </span>
              {!room.mine && (
                <button
                  type="button"
                  className={s.followButton}
                  aria-label={`${room.nickname} ${room.following ? "팔로우 취소" : "팔로우"}`}
                  aria-pressed={room.following}
                  disabled={pending}
                  onClick={() => followRoom(room.id)}
                >
                  {room.following ? "✓ 팔로잉" : "+ 팔로우"}
                </button>
              )}
            </div>
            <h3>{room.title}</h3>
            <p>{room.bio}</p>
            <div className={s.tags}>
              {room.topics.map((topic) => (
                <span key={topic}>#{topic}</span>
              ))}
            </div>
          </div>
        </div>
      </article>
    );
  }
  return (
    <div className={s.page}>
      <SiteHeader
        currentPage="creators"
        loggedIn={signedIn}
        accountName={accountName}
        accountAvatar={accountAvatar}
      />
      <main className={s.main}>
        <p className={s.eyebrow}>FIND YOUR TASTE</p>
        <h1>어떤 취향과 함께 골라볼까요?</h1>
        <p className={s.intro}>
          마음에 드는 크리에이터의 룸을 둘러보고, 고민 중인 상품을 물어보세요.
        </p>
        <div className={s.tools}>
          <label className={s.search}>
            <span>크리에이터 검색</span>
            <input
              type="search"
              placeholder="크리에이터 이름, 스타일, 관심사 검색"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <button
            className={s.following}
            aria-pressed={following}
            onClick={() => setFollowing(!following)}
          >
            팔로우한 크리에이터
          </button>
        </div>
        <div className={s.categories}>
          <CategoryFilter
            categories={CATEGORIES}
            value={category}
            onChange={setCategory}
          />
        </div>
        {ownRooms.length > 0 && (
          <section className={s.ownRooms} aria-labelledby="own-curation-rooms">
            <div className={s.heading}>
              <h2 id="own-curation-rooms">나의 큐레이션룸</h2>
              {ownRooms.length === 1 && (
                <Link
                  className={s.manageRoom}
                  href={`/creators/${ownRooms[0].id}/manage`}
                >
                  내 큐레이션 룸 관리
                </Link>
              )}
            </div>
            <div className={s.grid}>{ownRooms.map(renderRoom)}</div>
          </section>
        )}
        <div className={s.heading}>
          <h2>{following ? "팔로우한 큐레이션 룸" : "취향별 큐레이션 룸"}</h2>
          <div className={s.sortTools}>
            <span>{visible.length}개의 룸</span>
            <SortMenu
              value={sort}
              label="룸 정렬"
              options={[
                { value: "recommended", label: "추천순" },
                { value: "name", label: "이름순" },
              ]}
              onChange={setSort}
            />
          </div>
        </div>
        {message && (
          <p className={s.feedback} role="alert">
            {message}
          </p>
        )}
        <div className={s.grid}>{visible.map(renderRoom)}</div>
        {!visible.length && (
          <div className={s.empty}>
            <h2>
              {following
                ? "조건에 맞는 팔로우한 룸이 없어요"
                : "검색 결과가 없어요"}
            </h2>
            <p>다른 검색어나 관심 카테고리로 둘러보세요.</p>
            <button
              onClick={() => {
                setSearch("");
                setCategory("전체");
                setFollowing(false);
              }}
            >
              전체 룸 보기
            </button>
          </div>
        )}
        {applicationRoomId && !ownRooms.length && (
          <div className={s.applyRoom}>
            <button
              type="button"
              onClick={() => {
                setApplicationError("");
                setApplicationView(application ? "status" : "form");
              }}
            >
              {application ? "내 개설 신청" : "큐레이션룸 만들기"}
            </button>
          </div>
        )}
      </main>
      {applicationView && (
        <div className={`${roomStyles.shell} ${roomStyles.dialogHost}`}>
          {applicationView === "form" ? (
            <ApplicationForm
              busy={applying}
              onClose={() => setApplicationView(null)}
              onSubmit={submitApplication}
              serverError={applicationError}
            />
          ) : (
            application && (
              <Modal
                title="내 룸 개설 신청"
                onClose={() => setApplicationView(null)}
              >
                <h3>{application.roomTitle}</h3>
                <p className={roomStyles.modalIntro}>
                  {application.status === "PENDING"
                    ? "신청이 접수되어 검토 중입니다."
                    : application.status === "APPROVED"
                      ? "개설이 승인됐어요."
                      : `반려 사유: ${application.rejectReason}`}
                </p>
                {application.status === "REJECTED" && (
                  <button
                    type="button"
                    className={roomStyles.primaryButton}
                    onClick={() => setApplicationView("form")}
                  >
                    보완 후 다시 신청하기
                  </button>
                )}
              </Modal>
            )
          )}
        </div>
      )}
    </div>
  );
}
