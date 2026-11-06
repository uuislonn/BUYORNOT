"use client";
import { ActivityRecords } from "./activity-records";
import type { AccountActivity } from "./activity-types";
import type { FeedPost } from "../../../features/community/types";
import { CommunityRecords } from "./community-records";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { AccountCreator } from "./data";
import type { CurationRequest, RequestInput } from "../../(creator)/_lib/types";
import { effectiveStatus, daysRemaining } from "../../(creator)/_lib/policy";
import { RequestForm } from "../../(creator)/_components/request-form";
import { Modal } from "../../(creator)/_components/modal";
import { SamplePhoto } from "../../(creator)/_components/sample-photo";
import { ProductPrice } from "../../(creator)/_components/product-price";
import {
  createCurationRequest,
  updateCurationRequest,
  deleteCurationRequest,
  toggleCreatorFollow,
} from "../../(creator)/_server/actions";
import { BodyProfileForm } from "./body-profile-form";
import { LogoutButton } from "./logout-button";
import { updateNickname } from "./profile-action";
import {
  accountPosts,
  postCounts,
  mergeOwnRoomPosts,
  type PostFilter,
} from "./data";
import s from "./mypage.module.css";
type Section =
  | "overview"
  | "posts"
  | "participation"
  | "saved"
  | "following"
  | "notifications"
  | "settings";
const sections: { id: Section; label: string; icon: string }[] = [
  { id: "overview", label: "마이페이지 홈", icon: "◈" },
  { id: "posts", label: "내가 쓴 글", icon: "▤" },
  { id: "participation", label: "내 참여 내역", icon: "☑" },
  { id: "saved", label: "저장한 글·상품", icon: "♡" },
  { id: "following", label: "팔로우한 크리에이터", icon: "☆" },
  { id: "notifications", label: "알림", icon: "♧" },
  { id: "settings", label: "계정 설정", icon: "⚙" },
];
const filters: [PostFilter, string][] = [
  ["ALL", "전체"],
  ["ING", "답변 대기"],
  ["ANSWERED", "답변 완료"],
  ["BUY", "BUY"],
  ["NOT", "NOT"],
  ["EXPIRED", "만료"],
];
export function MyPage({
  activity,
  nickname,
  accountRole,
  email,
  provider,
  joined,
  communityPosts = [],
  participatedPosts = [],
  initialPosts,
  creatorRooms = [],
  initialFollowing = [],
  loadError,
  now,
}: {
  activity?: AccountActivity;
  nickname: string;
  accountRole: "USER" | "CREATOR" | "ADMIN";
  email: string | null;
  provider: string;
  joined: string;
  communityPosts?: FeedPost[];
  participatedPosts?: FeedPost[];
  initialPosts: CurationRequest[];
  creatorRooms?: AccountCreator[];
  initialFollowing?: string[];
  loadError: boolean;
  now: number;
}) {
  const router = useRouter();
  const [section, setSection] = useState<Section>("overview");
  const [postType, setPostType] = useState<"all" | "community" | "curation">(
    "all",
  );
  const [activityTab, setActivityTab] = useState("참여한 투표");
  const [savedTab, setSavedTab] = useState("글");
  const [choosing, setChoosing] = useState(false);
  function navigate(next: Section) {
    setSection(next);
    setNotice("");
  }
  const [name, setName] = useState(nickname);
  const [draft, setDraft] = useState(nickname);
  const [posts, setPosts] = useState(initialPosts);
  const [following, setFollowing] = useState(initialFollowing);
  const [creatorFilter, setCreatorFilter] = useState("all");
  const [creatorSearch, setCreatorSearch] = useState("");
  const [targetRoom, setTargetRoom] = useState("seoa");
  const followedRooms = creatorRooms.filter(
    (room) =>
      following.includes(room.id) &&
      `${room.nickname} ${room.title} ${room.bio}`
        .toLowerCase()
        .includes(creatorSearch.trim().toLowerCase()),
  );
  function roomLabel(id: string) {
    return (
      creatorRooms.find((room) => room.id === id)?.nickname ??
      (id === "seoa" ? "소올soal" : "크리에이터")
    );
  }
  function followRoom(id: string) {
    startTransition(async () => {
      try {
        const result = await toggleCreatorFollow(id);
        if (!result.ok) {
          setNotice(result.error);
          return;
        }
        setFollowing((current) =>
          result.data.following
            ? [...new Set([...current, id])]
            : current.filter((value) => value !== id),
        );
        setNotice(
          result.data.following
            ? "다시 팔로우했어요."
            : "팔로우를 해제했어요. 작성한 질문은 그대로 유지돼요.",
        );
        router.refresh();
      } catch {
        setNotice("팔로우를 변경하지 못했어요. 다시 시도해 주세요.");
      }
    });
  }
  const [filter, setFilter] = useState<PostFilter>("ALL");
  const [search, setSearch] = useState("");
  const [editor, setEditor] = useState<CurationRequest | "new" | null>(null);
  const [removing, setRemoving] = useState<CurationRequest | null>(null);
  const [notice, setNotice] = useState("");
  const [pending, startTransition] = useTransition();
  const counts = postCounts(posts, now);
  const visible = accountPosts(posts, filter, search, now).filter(
    (post) => creatorFilter === "all" || post.creatorId === creatorFilter,
  );
  function openPosts(next: PostFilter = "ALL") {
    setSection("posts");
    setPostType("curation");
    setFilter(next);
    setSearch("");
    setCreatorFilter("all");
  }
  function save(input: RequestInput, id?: string) {
    startTransition(async () => {
      try {
        const result = id
          ? await updateCurationRequest(id, input)
          : await createCurationRequest(input);
        if (!result.ok) {
          setNotice(result.error);
          return;
        }
        setPosts((current) =>
          mergeOwnRoomPosts(
            current,
            result.data.requests,
            result.data.creator.id,
            result.data.viewer?.id ?? "",
          ),
        );
        setEditor(null);
        setNotice(id ? "고민을 수정했어요." : "내 계정으로 고민을 등록했어요.");
        openPosts();
        router.refresh();
      } catch {
        setNotice("연결이 끊겼어요. 잠시 후 다시 시도해 주세요.");
      }
    });
  }
  function remove() {
    if (!removing) return;
    startTransition(async () => {
      try {
        const result = await deleteCurationRequest(
          removing.id,
          removing.creatorId,
        );
        if (!result.ok) {
          setNotice(result.error);
          return;
        }
        setPosts(posts.filter((p) => p.id !== removing.id));
        setRemoving(null);
        setNotice("고민을 삭제했어요.");
        router.refresh();
      } catch {
        setNotice("삭제하지 못했어요. 다시 시도해 주세요.");
      }
    });
  }
  const title = sections.find((item) => item.id === section)!.label;
  const isRecords = section === "overview" || section === "posts";
  const auxiliary = {
    participation: {
      title:
        activityTab === "참여한 투표"
          ? "내가 고른 선택을 한곳에서"
          : "내가 나눈 이야기를 한곳에서",
      description:
        "살말 커뮤니티가 연결되면 참여한 투표와 댓글 기록을 여기서 확인할 수 있어요.",
    },
    saved: {
      title: `마음에 든 ${savedTab === "글" ? "이야기" : "상품"}를 모아보세요`,
      description:
        "커뮤니티와 큐레이션에서 저장한 글·상품을 함께 모으는 공간이에요. 저장 기능은 연결 준비 중이에요.",
    },
    following: {
      title: "내 취향과 닮은 크리에이터",
      description:
        "팔로우 기능이 연결되면 관심 있는 크리에이터를 이곳에서 다시 만날 수 있어요.",
    },
    notifications: {
      title: "내 활동의 새로운 소식",
      description:
        "댓글·답글, 크리에이터 답변, 투표 종료 소식을 모아드릴 예정이에요. 알림 기능은 연결 준비 중이에요.",
    },
  };
  return (
    <div className={s.page}>
      <header className={s.header}>
        <Link href="/" className={s.logo}>
          <span>Buy or Not</span>
        </Link>
        <Link className={s.roomLink} href="/community">
          살말 커뮤니티 ↗
        </Link>
        <Link href="/creators/seoa">
          큐레이션 룸 <span aria-hidden="true">↗</span>
        </Link>
        <span className={s.headerAvatar} aria-label={`${name}님`}>
          {name.slice(0, 1)}
        </span>
      </header>
      <div className={s.layout}>
        <aside className={s.sidebar}>
          <div className={s.profile}>
            <span className={s.avatar}>
              {name.slice(0, 1)}
              <span className={s.avatarDot} />
            </span>
            <strong>
              {name}
              <span>님</span>
            </strong>
            <span className={s.provider}>
              {accountRole === "ADMIN"
                ? "관리자 계정"
                : accountRole === "CREATOR"
                  ? "크리에이터 계정"
                  : "일반 회원"}{" "}
              · {provider} 로그인
            </span>
            <button type="button" onClick={() => setSection("settings")}>
              프로필 수정 <span aria-hidden="true">↗</span>
            </button>
          </div>
          <nav className={s.sideNav} aria-label="마이페이지 메뉴">
            {sections.map((item) => (
              <button
                key={item.id}
                aria-current={section === item.id ? "page" : undefined}
                onClick={() => {
                  navigate(item.id);
                  if (item.id === "posts") {
                    setPostType("all");
                    setFilter("ALL");
                    setSearch("");
                  }
                }}
              >
                <span aria-hidden="true">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>
          <div className={s.sidebarFoot}>
            <p>
              좋아하는 것을,
              <br />더 나답게.
            </p>
            <LogoutButton className={s.logout} />
          </div>
        </aside>
        <main className={s.main}>
          <p className={s.breadcrumb}>
            MY SPACE <span>/</span> {title}
          </p>
          <div className={s.heading}>
            <div>
              <h1>{title}</h1>
              <p>
                {section === "settings" ? (
                  "나를 표현하는 이름과 계정 정보를 관리해요."
                ) : section === "posts" ? (
                  "내가 남긴 질문과 선택의 기록을 모았어요."
                ) : (
                  <>
                    반가워요, <strong>{name}님.</strong> 오늘도 나다운 선택을
                    해볼까요?
                  </>
                )}
              </p>
            </div>
            {isRecords && (
              <button
                className={s.primary}
                onClick={() => {
                  setNotice("");
                  setChoosing(true);
                }}
              >
                글 작성 <span aria-hidden="true">＋</span>
              </button>
            )}
          </div>
          {loadError && isRecords && (
            <div className={s.error} role="alert">
              내 고민을 불러오지 못했어요.{" "}
              <button onClick={() => window.location.reload()}>
                다시 불러오기
              </button>
            </div>
          )}
          {notice && (
            <div className={s.notice} role="status">
              {notice}
              <button aria-label="안내 닫기" onClick={() => setNotice("")}>
                ×
              </button>
            </div>
          )}
          {section === "settings" ? (
            <div className={s.settings}>
              <div className={s.settingsIntro}>
                <p className={s.eyebrow}>YOUR PROFILE</p>
                <h2>나를 부르는 이름</h2>
                <p>새로 작성하는 고민에 표시되는 닉네임이에요.</p>
              </div>
              <form
                action={() =>
                  startTransition(async () => {
                    try {
                      const result = await updateNickname(draft);
                      setNotice(result.message);
                      if (result.ok) {
                        setName(result.nickname);
                        router.refresh();
                      }
                    } catch {
                      setNotice("닉네임을 저장하지 못했어요.");
                    }
                  })
                }
              >
                <label htmlFor="nickname">닉네임</label>
                <div className={s.nicknameRow}>
                  <input
                    id="nickname"
                    name="nickname"
                    autoComplete="nickname"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    minLength={2}
                    maxLength={20}
                    required
                    disabled={pending}
                  />
                  <button
                    className={s.primary}
                    disabled={pending || draft.trim() === name}
                  >
                    {pending ? "저장 중…" : "변경 저장"}
                  </button>
                </div>
                <small>2~20자 · 이전 글의 작성자 이름은 유지됩니다.</small>
              </form>
              <BodyProfileForm />
              <div className={s.accountDetails}>
                <h2>계정 정보</h2>
                <dl>
                  <div>
                    <dt>로그인 방식</dt>
                    <dd>{provider === "로컬 테스트" ? "아이디" : provider}</dd>
                  </div>
                  <div>
                    <dt>이메일</dt>
                    <dd>
                      {email ??
                        (provider === "로컬 테스트"
                          ? "등록된 이메일이 없어요."
                          : "카카오에서 이메일을 제공받지 않았어요.")}
                    </dd>
                  </div>
                  <div>
                    <dt>가입일</dt>
                    <dd>
                      {new Date(joined).toLocaleDateString("ko-KR", {
                        timeZone: "Asia/Seoul",
                      })}
                    </dd>
                  </div>
                </dl>
                {email && provider === "이메일" && (
                  <Link href="/update-password">비밀번호 변경 →</Link>
                )}
                <LogoutButton className={s.logout} />
              </div>
            </div>
          ) : section === "participation" ? (
            <div>
              <div className={s.typeTabs}>
                {["참여한 투표", "작성한 댓글", "댓글 단 글"].map((tab) => (
                  <button
                    key={tab}
                    aria-pressed={activityTab === tab}
                    onClick={() => setActivityTab(tab)}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              {activityTab === "참여한 투표" ? (
                <CommunityRecords posts={participatedPosts} participation />
              ) : activity ? (
                <ActivityRecords
                  activity={activity}
                  kind={
                    activityTab === "작성한 댓글" ? "작성한 댓글" : "댓글 단 글"
                  }
                />
              ) : (
                <div className={s.empty}>
                  <h3>아직 남긴 댓글이 없어요</h3>
                  <p>현재 커뮤니티에서는 살말 투표에 참여할 수 있어요.</p>
                </div>
              )}
            </div>
          ) : section === "following" && provider === "로컬 테스트" ? (
            <div>
              <div className={s.followingHeading}>
                <h2>
                  함께하는 취향 <span>{following.length}</span>
                </h2>
                <label className={s.search}>
                  <span className={s.srOnly}>팔로우한 크리에이터 검색</span>
                  <input
                    type="search"
                    placeholder="이름, 취향 검색"
                    value={creatorSearch}
                    onChange={(event) => setCreatorSearch(event.target.value)}
                  />
                </label>
              </div>
              <p className={s.integrationNote}>
                팔로우한 크리에이터의 프로필을 눌러 큐레이션 룸을 둘러보세요.
              </p>
              <div className={s.creatorGrid}>
                {followedRooms.map((room) => (
                  <article className={s.creatorCard} key={room.id}>
                    <Link
                      className={s.creatorIdentity}
                      href={`/creators/${room.id}`}
                    >
                      <span className={s.creatorAvatar}>
                        <SamplePhoto
                          source={room.avatar}
                          alt={`${room.nickname} 프로필`}
                        />
                      </span>
                      <span>
                        <small>CREATOR</small>
                        <h3>{room.nickname}</h3>
                        <span>@{room.handle}</span>
                      </span>
                    </Link>
                    <h4>{room.title}</h4>
                    <p>{room.bio}</p>
                    <div className={s.creatorCardActions}>
                      <Link href={`/creators/${room.id}`}>
                        큐레이션 룸 보기 ↗
                      </Link>
                      <button
                        disabled={pending}
                        onClick={() => followRoom(room.id)}
                      >
                        팔로우 해제
                      </button>
                    </div>
                  </article>
                ))}
              </div>
              {!followedRooms.length && (
                <div className={s.empty}>
                  <h3>
                    {creatorSearch
                      ? "검색 결과가 없어요"
                      : "팔로우한 크리에이터가 없어요"}
                  </h3>
                  <p>
                    {creatorSearch
                      ? "다른 이름이나 취향으로 검색해 보세요."
                      : "아래에서 다시 팔로우할 크리에이터를 선택해 보세요."}
                  </p>
                </div>
              )}
              {!!creatorRooms.filter(
                (room) => room.fictional && !following.includes(room.id),
              ).length && (
                <div className={s.refollow}>
                  <h3>다시 만나볼 크리에이터</h3>
                  {creatorRooms
                    .filter(
                      (room) => room.fictional && !following.includes(room.id),
                    )
                    .map((room) => (
                      <button
                        disabled={pending}
                        key={room.id}
                        onClick={() => followRoom(room.id)}
                      >
                        {room.nickname} 팔로우 ＋
                      </button>
                    ))}
                </div>
              )}
            </div>
          ) : !isRecords ? (
            <div className={s.collection}>
              {section === "saved" && (
                <div className={s.typeTabs} aria-label="저장 유형">
                  {["글", "상품"].map((tab) => (
                    <button
                      key={tab}
                      aria-pressed={savedTab === tab}
                      onClick={() => setSavedTab(tab)}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              )}
              {activity &&
              (section === "saved" || section === "notifications") ? (
                <ActivityRecords
                  activity={activity}
                  kind={
                    section === "notifications"
                      ? "알림"
                      : savedTab === "상품"
                        ? "상품"
                        : "글"
                  }
                />
              ) : (
                <div className={s.empty}>
                  <span aria-hidden="true">
                    {sections.find((item) => item.id === section)?.icon}
                  </span>
                  <p className={s.connectionBadge}>연결 준비 중</p>
                  <h2>{auxiliary[section].title}</h2>
                  <p>{auxiliary[section].description}</p>
                  <Link className={s.primary} href="/creators">
                    크리에이터 둘러보기 ↗
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <>
              {section === "overview" && (
                <>
                  {accountRole !== "USER" && (
                    <div className={s.notice}>
                      <strong>
                        {accountRole === "ADMIN" ? "관리자" : "크리에이터"} 활동
                      </strong>
                      <Link
                        href={
                          accountRole === "ADMIN"
                            ? "/creators/seoa?view=admin"
                            : "/creators/seoa"
                        }
                      >
                        {accountRole === "ADMIN"
                          ? "크리에이터 신청 승인 관리 →"
                          : "내 큐레이션 룸에서 질문 답변하기 →"}
                      </Link>
                    </div>
                  )}
                  <div className={s.stats} aria-label="내 전체 활동 요약">
                    <button
                      onClick={() => {
                        navigate("posts");
                        setPostType("all");
                      }}
                    >
                      <span>내가 쓴 글</span>
                      <strong>
                        {loadError ? "—" : counts.ALL + communityPosts.length}
                        <small>개</small>
                      </strong>
                      <em>커뮤니티와 큐레이션 활동 ↗</em>
                    </button>
                    <button onClick={() => navigate("participation")}>
                      <span>참여한 투표</span>
                      <strong>
                        {participatedPosts.length}
                        <small>개</small>
                      </strong>
                      <em>내가 고른 선택의 기록 ↗</em>
                    </button>
                    <button onClick={() => navigate("saved")}>
                      <span>저장한 글·상품</span>
                      <strong>
                        {activity
                          ? activity.savedPosts.length +
                            activity.savedProducts.length
                          : 0}
                        <small>개</small>
                      </strong>
                      <em>다시 보고 싶은 글과 상품 ↗</em>
                    </button>
                  </div>
                  <div className={s.spaces}>
                    <button
                      className={s.spaceCard}
                      onClick={() => {
                        navigate("posts");
                        setPostType("community");
                      }}
                    >
                      <span className={s.spaceIcon} aria-hidden="true">
                        ↔
                      </span>
                      <span>
                        <small>COMMUNITY</small>
                        <strong>살말 커뮤니티</strong>
                        <em>함께 투표하고, 선택을 나누는 곳</em>
                        <b>내 커뮤니티 글 보기 →</b>
                      </span>
                    </button>
                    <button className={s.spaceCard} onClick={() => openPosts()}>
                      <span className={s.spaceIcon} aria-hidden="true">
                        ✳
                      </span>
                      <span>
                        <small>CURATION ROOM</small>
                        <strong>큐레이션 룸</strong>
                        <em>취향이 통하는 크리에이터에게 질문하기</em>
                        <b>
                          {loadError
                            ? "불러오기 실패"
                            : `답변 대기 ${counts.ING} · 답변 완료 ${counts.ANSWERED}`}{" "}
                          →
                        </b>
                      </span>
                    </button>
                  </div>
                  <div className={s.banner}>
                    <div>
                      <span className={s.eyebrow}>
                        A LITTLE HELP, A BETTER CHOICE
                      </span>
                      <h2>장바구니 속 고민, 같이 골라볼까요?</h2>
                      <p>커뮤니티의 다양한 의견부터 크리에이터의 답변까지.</p>
                    </div>
                    <button
                      onClick={() => {
                        setNotice("");
                        setChoosing(true);
                      }}
                    >
                      새로운 글 작성 <span aria-hidden="true">↗</span>
                    </button>
                    <span className={s.bannerArt} aria-hidden="true">
                      BUY<span>or</span>NOT?
                    </span>
                  </div>
                </>
              )}
              <div className={s.postsHeading}>
                <div>
                  <p className={s.eyebrow}>MY ACTIVITY</p>
                  <h2>
                    {section === "overview"
                      ? "최근 작성한 글"
                      : "내가 쓴 글 목록"}{" "}
                    <span>
                      {loadError
                        ? "—"
                        : postType === "community"
                          ? communityPosts.length
                          : postType === "curation"
                            ? counts.ALL
                            : counts.ALL + communityPosts.length}
                    </span>
                  </h2>
                </div>
                {section === "overview" && (
                  <button onClick={() => openPosts()}>전체 보기 ↗</button>
                )}
              </div>
              {postType === "all" && communityPosts.length > 0 && (
                <CommunityRecords
                  posts={communityPosts}
                  limit={section === "overview" ? 4 : undefined}
                />
              )}
              <div className={s.typeTabs} aria-label="글 유형">
                {(
                  [
                    ["all", "전체"],
                    ["community", "살말 커뮤니티"],
                    ["curation", "큐레이션 질문"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    aria-pressed={postType === value}
                    onClick={() => setPostType(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {postType === "community" ? (
                <CommunityRecords posts={communityPosts} search={search} />
              ) : (
                <>
                  {postType === "all" && (
                    <p className={s.integrationNote}>
                      아래 목록은 크리에이터에게 남긴 큐레이션 질문이에요.
                    </p>
                  )}
                  <div className={s.tools}>
                    <label className={s.roomFilter}>
                      질문한 크리에이터{" "}
                      <select
                        value={creatorFilter}
                        onChange={(event) =>
                          setCreatorFilter(event.target.value)
                        }
                      >
                        <option value="all">전체 크리에이터</option>
                        {[...new Set(posts.map((post) => post.creatorId))].map(
                          (id) => (
                            <option key={id} value={id}>
                              {roomLabel(id)}
                            </option>
                          ),
                        )}
                      </select>
                    </label>
                    <div className={s.filters} aria-label="내 고민 상태 필터">
                      {filters.map(([value, label]) => (
                        <button
                          key={value}
                          aria-pressed={filter === value}
                          onClick={() => setFilter(value)}
                        >
                          {label}
                          <span>{loadError ? "—" : counts[value]}</span>
                        </button>
                      ))}
                    </div>
                    <label className={s.search}>
                      <span className={s.srOnly}>내 고민 검색</span>
                      <span aria-hidden="true">⌕</span>
                      <input
                        type="search"
                        placeholder="상품명, 브랜드, 고민 검색"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </label>
                  </div>
                  {visible.length ? (
                    <div className={s.postList}>
                      {(section === "overview"
                        ? visible.slice(0, 12)
                        : visible
                      ).map((post) => {
                        const status = effectiveStatus(post, now);
                        return (
                          <article key={post.id} className={s.post}>
                            <a
                              className={s.productImage}
                              href={post.product.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <SamplePhoto
                                source={post.product.image}
                                alt={post.product.name}
                              />
                            </a>
                            <div className={s.postContent}>
                              <Link
                                className={s.questionRoom}
                                href={`/creators/${post.creatorId}`}
                              >
                                {creatorRooms.find(
                                  (room) => room.id === post.creatorId,
                                )?.avatar && (
                                  <span className={s.questionAvatar}>
                                    <SamplePhoto
                                      source={
                                        creatorRooms.find(
                                          (room) => room.id === post.creatorId,
                                        )!.avatar
                                      }
                                      alt=""
                                    />
                                  </span>
                                )}
                                {roomLabel(post.creatorId)}의 큐레이션 룸{" "}
                                <span aria-hidden="true">↗</span>
                              </Link>
                              <div className={s.postMeta}>
                                <span
                                  className={`${s.status} ${status === "ING" ? s.waiting : status === "BUY" ? s.buy : ""}`}
                                >
                                  {status === "ING"
                                    ? "답변 대기"
                                    : status === "EXPIRED"
                                      ? "만료"
                                      : status}
                                </span>
                                <span>
                                  {new Date(post.createdAt).toLocaleDateString(
                                    "ko-KR",
                                    { timeZone: "Asia/Seoul" },
                                  )}
                                </span>
                                <span>
                                  큐레이션 질문 · {post.product.category}
                                </span>
                              </div>
                              <p className={s.brand}>{post.product.brand}</p>
                              <h3>{post.product.name}</h3>
                              <p className={s.concern}>{post.concern}</p>
                              <div className={s.postBottom}>
                                <ProductPrice product={post.product} />
                                <Link href={`/creators/${post.creatorId}`}>
                                  {roomLabel(post.creatorId)} 룸 보기 ↗
                                </Link>
                              </div>
                            </div>
                            <div className={s.postActions}>
                              {status === "ING" && (
                                <>
                                  <span className={s.days}>
                                    마감 D-{daysRemaining(post, now)}
                                  </span>
                                  <button
                                    disabled={pending}
                                    onClick={() => {
                                      setNotice("");
                                      setEditor(post);
                                    }}
                                  >
                                    수정
                                  </button>
                                </>
                              )}
                              <button
                                disabled={pending}
                                onClick={() => {
                                  setNotice("");
                                  setRemoving(post);
                                }}
                              >
                                삭제
                              </button>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  ) : (
                    !loadError && (
                      <div className={s.empty}>
                        <span aria-hidden="true">?</span>
                        <h3>
                          {search
                            ? "검색 결과가 없어요"
                            : filter === "ALL"
                              ? "아직 남긴 고민이 없어요"
                              : "이 상태의 고민이 아직 없어요"}
                        </h3>
                        <p>
                          {search
                            ? "다른 검색어로 찾아보세요."
                            : "마음에 드는 상품을 발견했다면 크리에이터에게 물어보세요."}
                        </p>
                        {!search && (
                          <button
                            className={s.primary}
                            onClick={() => setEditor("new")}
                          >
                            첫 고민 남기기 ＋
                          </button>
                        )}
                      </div>
                    )
                  )}
                </>
              )}
            </>
          )}
          <footer className={s.footer}>
            © BUYORNOT <span>YOUR TASTE, YOUR CHOICE.</span>
          </footer>
        </main>
      </div>
      {choosing && (
        <Modal title="어떤 고민을 나눌까요?" onClose={() => setChoosing(false)}>
          <div className={s.writeChoices}>
            <div>
              <span className={s.connectionBadge}>COMMUNITY</span>
              <h3>살말 투표 만들기</h3>
              <p>커뮤니티에서 여러 사람의 BUY·NOT 의견을 모아보세요.</p>
              <Link className={s.primary} href="/community">
                살말 투표 작성하러 가기 →
              </Link>
            </div>
            <div>
              <span className={s.connectionBadge}>CURATION ROOM</span>
              <h3>크리에이터에게 질문하기</h3>
              <p>질문할 크리에이터의 룸을 선택해 주세요.</p>
              <label className={s.roomFilter}>
                질문할 큐레이션 룸{" "}
                <select
                  value={targetRoom}
                  onChange={(event) => setTargetRoom(event.target.value)}
                >
                  {creatorRooms.length ? (
                    creatorRooms.map((room) => (
                      <option key={room.id} value={room.id}>
                        {room.nickname} · {room.title}
                      </option>
                    ))
                  ) : (
                    <option value="seoa">소올soal</option>
                  )}
                </select>
              </label>
              <button
                className={s.primary}
                onClick={() => {
                  setChoosing(false);
                  setNotice("");
                  setEditor("new");
                }}
              >
                큐레이션 질문 작성 →
              </button>
            </div>
          </div>
        </Modal>
      )}
      {editor && (
        <RequestForm
          key={editor === "new" ? "new" : editor.id}
          creatorId={editor === "new" ? targetRoom : editor.creatorId}
          edit={editor === "new" ? undefined : editor}
          busy={pending}
          serverError={notice}
          onClose={() => {
            if (!pending) setEditor(null);
          }}
          onSubmit={save}
        />
      )}
      {removing && (
        <Modal
          title="이 고민을 삭제할까요?"
          busy={pending}
          onClose={() => setRemoving(null)}
        >
          {notice && <p role="alert">{notice}</p>}
          <p>삭제한 글은 복구할 수 없어요.</p>
          <p>{removing.product.name}</p>
          <div className={s.deleteActions}>
            <button disabled={pending} onClick={() => setRemoving(null)}>
              취소
            </button>
            <button className={s.primary} disabled={pending} onClick={remove}>
              {pending ? "삭제 중…" : "삭제하기"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
