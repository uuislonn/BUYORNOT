"use client";
import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as actions from "../_server/actions";
import {
  CATEGORIES,
  type ApplicationInput,
  type CurationRequest,
  type Decision,
  type DemoIdentity,
  type RequestInput,
  type Result,
  type Snapshot,
  type Status,
} from "../_lib/types";
import { daysRemaining, effectiveStatus, meetsFastTrack } from "../_lib/policy";
import { formatPrice, getAffiliateLink } from "../_lib/product-url";
import { ProductCard } from "./product-card";
import { SamplePhoto } from "./sample-photo";
import { RequestForm } from "./request-form";
import { ApplicationForm } from "./application-form";
import { Modal } from "./modal";
import { Icon, Verified } from "./icons";
import s from "./creator.module.css";

type View = "room" | "feed" | "shop" | "admin";
type OpenModal =
  | { type: "login" }
  | { type: "info"; title: string; text: string }
  | { type: "write"; edit?: CurationRequest }
  | { type: "apply" }
  | { type: "evaluate"; request: CurationRequest; decision: Decision }
  | { type: "delete"; request: CurationRequest }
  | { type: "detail"; request: CurationRequest }
  | { type: "reject"; applicationId: string }
  | { type: "applicationStatus" };
// TODO: replace with UI component — all controls are local to Part B until the shared UI exists.
export function CreatorWorkspace({ initial }: { initial: Snapshot }) {
  const [data, setData] = useState(initial);
  const [modal, setModal] = useState<OpenModal | null>(null);
  const [comment, setComment] = useState("");
  const [toast, setToast] = useState<{ text: string; error: boolean } | null>(
    null,
  );
  const [pending, startTransition] = useTransition();
  const [now, setNow] = useState(new Date(initial.serverTime).getTime());
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const rawView = params.get("view");
  const view: View =
    rawView === "feed" ||
    rawView === "shop" ||
    (rawView === "admin" && data.viewer?.role === "ADMIN")
      ? rawView
      : "room";
  const rawStatus = params.get("status");
  const status: Status =
    rawStatus === "BUY" || rawStatus === "NOT" || rawStatus === "EXPIRED"
      ? rawStatus
      : "ING";
  const category =
    CATEGORIES.find((c) => c === params.get("category")) ?? "전체";
  const sort = params.get("sort") === "oldest" ? "oldest" : "latest";
  const isOwner =
    data.viewer?.id === data.creator.ownerId && data.viewer?.role === "CREATOR";
  const requests = data.requests.map((r) => ({
    ...r,
    status: effectiveStatus(r, now),
  }));
  const counts = (state: Status) =>
    requests.filter((r) => r.status === state).length;
  const evaluated = requests.filter(
    (r) =>
      (r.status === "BUY" || r.status === "NOT") &&
      data.evaluations.some((e) => e.requestId === r.id),
  );
  const shop = evaluated.filter((r) => r.status === "BUY");
  const list = (
    view === "shop"
      ? shop
      : view === "feed"
        ? evaluated
        : requests.filter((r) => r.status === status)
  )
    .filter((r) => category === "전체" || r.product.category === category)
    .sort(
      (a, b) =>
        (sort === "latest" ? -1 : 1) *
        (view === "room" ? a.createdAt : a.updatedAt).localeCompare(
          view === "room" ? b.createdAt : b.updatedAt,
        ),
    );
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 6000);
    return () => window.clearTimeout(timer);
  }, [toast]);
  function tabKeys(event: React.KeyboardEvent<HTMLDivElement>) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    const tabs = [
      ...event.currentTarget.querySelectorAll<HTMLButtonElement>(
        'button[role="tab"]',
      ),
    ];
    const current = tabs.indexOf(document.activeElement as HTMLButtonElement);
    if (current < 0) return;
    event.preventDefault();
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? tabs.length - 1
          : (current + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) %
            tabs.length;
    tabs[next].focus();
    tabs[next].click();
  }
  function query(next: Record<string, string>) {
    const search = new URLSearchParams(params);
    for (const [key, value] of Object.entries(next)) search.set(key, value);
    router.replace(`${pathname}?${search}`, { scroll: false });
  }
  function notify(text: string, error = false) {
    setToast({ text, error });
  }
  function gate(fn: () => void) {
    if (!data.viewer) {
      setModal({ type: "login" });
      return;
    }
    if (!data.demoEnabled) {
      setModal({
        type: "info",
        title: "실제 서비스 연결 전입니다",
        text: "현재 화면은 샘플 데이터입니다. 인증·DB 연동 전에는 공개 배포의 참여 기능이 비활성화됩니다.",
      });
      return;
    }
    fn();
  }
  function run(
    fn: () => Promise<Result<Snapshot>>,
    options?: {
      optimistic?: (snapshot: Snapshot) => Snapshot;
      success?: string;
      close?: boolean;
    },
  ) {
    if (pending) return;
    const before = data;
    if (options?.optimistic) setData(options.optimistic(before));
    startTransition(async () => {
      try {
        const result = await fn();
        if (!result.ok) {
          setData(before);
          if (result.code === "UNAUTHENTICATED") setModal({ type: "login" });
          else notify(result.error, true);
          return;
        }
        setData(result.data);
        setNow(new Date(result.data.serverTime).getTime());
        if (options?.close) setModal(null);
        if (options?.success) notify(options.success);
      } catch {
        setData(before);
        notify(
          "연결이 끊겼어요. 변경을 되돌렸습니다. 다시 시도해 주세요.",
          true,
        );
      }
    });
  }
  function evaluate(item: CurationRequest, decision: Decision) {
    gate(() => {
      if (!isOwner) {
        setModal({
          type: "info",
          title: "크리에이터의 선택을 기다려 주세요",
          text: "이 카드는 커뮤니티 투표가 아닌 크리에이터 큐레이션 요청입니다. 이 룸의 크리에이터만 BUY / NOT 판정을 남길 수 있어요.",
        });
        return;
      }
      setComment("");
      setModal({ type: "evaluate", request: item, decision });
    });
  }
  function submitEvaluation(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (modal?.type !== "evaluate") return;
    const { request, decision } = modal;
    setModal(null);
    run(
      () =>
        actions.evaluateCurationRequest(
          request.id,
          data.creator.id,
          decision,
          comment,
        ),
      {
        optimistic: (before) => ({
          ...before,
          requests: before.requests.map((r) =>
            r.id === request.id
              ? { ...r, status: decision, updatedAt: new Date().toISOString() }
              : r,
          ),
          evaluations: [
            ...before.evaluations,
            {
              id: "optimistic",
              requestId: request.id,
              creatorId: before.creator.ownerId,
              decision,
              comment,
              createdAt: new Date().toISOString(),
            },
          ],
        }),
        success:
          decision === "BUY"
            ? "BUY 판정이 피드와 추천 숍에 반영됐어요."
            : "NOT 판정이 피드에 반영됐어요.",
      },
    );
  }
  function saveRequest(input: RequestInput, editId?: string) {
    run(
      () =>
        editId
          ? actions.updateCurationRequest(editId, input)
          : actions.createCurationRequest(input),
      {
        close: true,
        success: editId
          ? "고민을 수정했어요."
          : "고민이 등록됐어요. 크리에이터의 선택을 기다려 주세요.",
      },
    );
  }
  function apply() {
    gate(() => {
      if (data.ownApplication) {
        setModal({ type: "applicationStatus" });
        return;
      }
      if (data.viewer?.role !== "USER") {
        setModal({
          type: "info",
          title: "일반 회원용 신청입니다",
          text: "이미 크리에이터이거나 관리자 계정입니다. 일반 회원 역할에서 개설 신청을 체험해 주세요.",
        });
        return;
      }
      setModal({ type: "apply" });
    });
  }
  function submitApplication(input: ApplicationInput) {
    run(() => actions.submitCreatorApplication(input, data.creator.id), {
      close: true,
      success: "개설 신청이 접수됐어요. 관리자 검토를 기다려 주세요.",
    });
  }
  const profile = data.owner;
  const viewTitle =
    view === "room"
      ? "함께 고민하는 취향"
      : view === "feed"
        ? `${data.owner.nickname}가 남긴 선택`
        : view === "shop"
          ? "이유 있는 추천"
          : "크리에이터 개설 신청";
  return (
    <div className={s.shell}>
      <header className={s.siteHeader}>
        <Link
          href="/creators"
          className={s.wordmark}
          aria-label="BUY OR NOT 크리에이터 홈"
        >
          BUY<span className={s.logoOr}>OR</span>NOT
          <span className={s.logoDot}>.</span>
        </Link>
        <nav className={s.headerNav} aria-label="주요 메뉴">
          <button
            type="button"
            aria-current={view === "room" ? "page" : undefined}
            onClick={() => query({ view: "room" })}
          >
            큐레이션 룸
          </button>
          <button
            type="button"
            aria-current={view === "feed" ? "page" : undefined}
            onClick={() => query({ view: "feed" })}
          >
            크리에이터 피드
          </button>
          <button
            type="button"
            aria-current={view === "shop" ? "page" : undefined}
            onClick={() => query({ view: "shop" })}
          >
            추천 숍 <span className={s.navDot} />
          </button>
        </nav>
        <div className={s.headerRight}>
          <button type="button" className={s.applyLink} onClick={apply}>
            {data.ownApplication ? "내 개설 신청" : "룸 개설하기"}
            <span aria-hidden="true">↗</span>
          </button>
          <button
            type="button"
            className={s.accountButton}
            onClick={() =>
              setModal(
                data.viewer
                  ? {
                      type: "info",
                      title: "데모 프로필",
                      text: `${data.viewer.nickname} · ${data.viewer.role}. 실제 로그인 계정이 아닙니다. 아래 데모 역할 선택으로 사용자 흐름을 확인하세요.`,
                    }
                  : { type: "login" },
              )
            }
          >
            {data.viewer ? data.viewer.nickname : "로그인"}
          </button>
        </div>
      </header>
      <div className={s.demoBar}>
        <div>
          <span className={s.demoBadge}>MOCK STUDIO</span>
          <span>AI 샘플 사진·상품 데이터 · 실제 인증/DB 연결 전</span>
        </div>
        {data.demoEnabled ? (
          <label>
            데모 역할
            <select
              aria-label="데모 역할"
              value={
                data.viewer?.id === "member"
                  ? "member"
                  : data.viewer?.id === "creator"
                    ? "creator"
                    : data.viewer?.id === "admin"
                      ? "admin"
                      : "guest"
              }
              disabled={pending}
              onChange={(e) =>
                run(
                  () =>
                    actions.setDemoIdentity(
                      e.target.value as DemoIdentity,
                      data.creator.id,
                    ),
                  { close: true },
                )
              }
            >
              <option value="guest">방문자</option>
              <option value="member">일반 회원</option>
              <option value="creator">크리에이터</option>
              <option value="admin">관리자</option>
            </select>
          </label>
        ) : (
          <span>읽기 전용 데모</span>
        )}
      </div>
      <main className={s.main}>
        <div className={s.breadcrumb}>
          CREATOR&apos;S ROOM <span>/</span> {data.creator.handle}
        </div>
        <div className={s.cover}>
          {data.creator.cover && (
            <SamplePhoto
              source={data.creator.cover}
              alt="AI 생성 패션 아카이브 커버"
              eager
            />
          )}
          <div className={s.coverShade} />
          <div className={s.coverContent}>
            <span>GOOD TASTE, BETTER CHOICES.</span>
            <p>
              취향은 나누고,
              <br />
              선택은 가볍게.
            </p>
          </div>
          <span className={s.coverStamp}>
            CURATED
            <br />
            <strong>by {profile.nickname}</strong>
            <span>BUY OR NOT ARCHIVE</span>
          </span>
        </div>
        <div className={s.profilePanel}>
          <div className={s.profilePhoto}>
            {profile.avatar ? (
              <SamplePhoto
                source={profile.avatar}
                alt={`${profile.nickname} 데모 프로필 (AI 생성)`}
                eager
              />
            ) : (
              profile.nickname.slice(0, 1)
            )}
          </div>
          <div className={s.profileCopy}>
            <div className={s.profileTitle}>
              <h1>{data.creator.title}</h1>
              {profile.verified && <Verified />}
            </div>
            <p className={s.handle}>
              @{data.creator.handle} <span>·</span>{" "}
              {data.followerCount.toLocaleString("ko-KR")}명이 함께하는 중
            </p>
            <p className={s.bio}>{data.creator.bio}</p>
            <div className={s.socialLinks}>
              {data.creator.links.map((link) => (
                <a
                  key={link.label}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Icon name="link" size={13} />
                  {link.label}
                  <span>↗</span>
                </a>
              ))}
            </div>
          </div>
          <div className={s.profileActions}>
            <button
              type="button"
              className={s.primaryButton}
              disabled={pending}
              onClick={() => gate(() => setModal({ type: "write" }))}
            >
              <Icon name="plus" size={17} />
              살말 고민 작성하기
            </button>
            <button
              type="button"
              className={`${s.secondaryButton} ${data.following ? s.following : ""}`}
              disabled={pending}
              aria-pressed={data.following}
              onClick={() =>
                gate(() =>
                  run(() => actions.toggleCreatorFollow(data.creator.id), {
                    optimistic: (d) => ({
                      ...d,
                      following: !d.following,
                      followerCount: d.followerCount + (d.following ? -1 : 1),
                    }),
                  }),
                )
              }
            >
              {data.following ? (
                <>
                  <Icon name="check" size={16} />
                  팔로잉
                </>
              ) : (
                "취향 팔로우"
              )}
            </button>
          </div>
        </div>
        <div
          className={s.viewNav}
          role="tablist"
          aria-label="크리에이터 콘텐츠"
          onKeyDown={tabKeys}
        >
          {(
            [
              [
                "room",
                "큐레이션 룸",
                <Icon key="room" name="grid" size={17} />,
                requests.length,
              ],
              [
                "feed",
                "크리에이터 피드",
                <Icon key="feed" name="clock" size={17} />,
                evaluated.length,
              ],
              [
                "shop",
                "추천 숍",
                <Icon key="shop" name="bag" size={17} />,
                shop.length,
              ],
            ] as const
          ).map(([key, label, icon, count]) => (
            <button
              type="button"
              role="tab"
              aria-selected={view === key}
              tabIndex={view === key ? 0 : -1}
              aria-controls="creator-content"
              key={key}
              onClick={() => query({ view: key })}
            >
              {icon}
              {label}
              <span>{count}</span>
            </button>
          ))}
          {data.viewer?.role === "ADMIN" && (
            <button
              type="button"
              role="tab"
              aria-selected={view === "admin"}
              tabIndex={view === "admin" ? 0 : -1}
              aria-controls="creator-content"
              onClick={() => query({ view: "admin" })}
            >
              승인 관리
              <span>
                {data.applications.filter((a) => a.status === "PENDING").length}
              </span>
            </button>
          )}
        </div>
        <div id="creator-content" role="tabpanel" aria-label={viewTitle}>
          <div className={s.sectionHeading}>
            <div>
              <span className={s.miniLabel}>
                {view === "room"
                  ? "THE CURATION ROOM"
                  : view === "feed"
                    ? "THE DECISION ARCHIVE"
                    : view === "shop"
                      ? "THE BUY COLLECTION"
                      : "CREATOR APPLICATIONS"}
              </span>
              <h2>
                {viewTitle}
                <span className={s.blueText}>.</span>
              </h2>
              <p>
                {view === "room"
                  ? "혼자서는 어려운 선택, 취향이 통하는 크리에이터에게 물어보세요."
                  : view === "feed"
                    ? "고민의 끝에 남은 한 줄. BUY와 NOT의 이유를 만나보세요."
                    : view === "shop"
                      ? "크리에이터가 BUY를 선택한 상품만 모았어요. 구매는 원래 쇼핑몰에서."
                      : "채널 소유권과 실제 활동을 확인한 후 승인해 주세요. 데모 승인입니다."}
              </p>
            </div>
            {view === "room" && (
              <span className={s.responseNote}>
                <span className={s.navDot} />
                모든 고민은 30일 동안 유효해요
              </span>
            )}
          </div>
          {view === "admin" ? (
            <div className={s.adminList}>
              {data.applications.length === 0 ? (
                <div className={s.empty}>
                  <Icon name="check" size={32} />
                  <h3>검토할 신청이 없어요</h3>
                  <p>
                    일반 회원으로 개설 신청 후 관리자 역할로 돌아와 확인해
                    보세요.
                  </p>
                </div>
              ) : (
                data.applications.map((a) => (
                  <article className={s.adminCard} key={a.id}>
                    <div className={s.adminCardHeading}>
                      <div>
                        <span className={s.miniLabel}>{a.status}</span>
                        <h3>{a.roomTitle}</h3>
                        <p>{a.bio}</p>
                      </div>
                      <span className={s.statusPill}>
                        {meetsFastTrack(a)
                          ? "패스트 트랙 기준 충족"
                          : "일반 심사"}
                      </span>
                    </div>
                    <dl>
                      <div>
                        <dt>신청자</dt>
                        <dd>
                          {
                            data.profiles.find((p) => p.id === a.userId)
                              ?.nickname
                          }
                        </dd>
                      </div>
                      <div>
                        <dt>채널</dt>
                        <dd>
                          <a
                            href={a.channelUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {a.channelType} 확인 ↗
                          </a>
                        </dd>
                      </div>
                      <div>
                        <dt>팔로워 / 게시글</dt>
                        <dd>
                          {a.followers.toLocaleString("ko-KR")}명 /{" "}
                          {a.contentCount}개 (자가 신고)
                        </dd>
                      </div>
                      <div>
                        <dt>소유권 확인 코드</dt>
                        <dd>{a.verificationCode}</dd>
                      </div>
                    </dl>
                    <p className={s.help}>
                      Mock은 외부 채널을 검증하지 않습니다. 실제 승인 전에는
                      채널 소개의 코드와 수치를 확인해야 합니다.
                    </p>
                    {a.rejectReason && (
                      <p className={s.error}>반려 사유: {a.rejectReason}</p>
                    )}
                    {a.status === "PENDING" && (
                      <div className={s.modalActions}>
                        <button
                          type="button"
                          className={s.secondaryButton}
                          disabled={pending}
                          onClick={() => {
                            setComment("");
                            setModal({ type: "reject", applicationId: a.id });
                          }}
                        >
                          반려
                        </button>
                        <button
                          type="button"
                          className={s.primaryButton}
                          disabled={pending}
                          onClick={() =>
                            run(
                              () =>
                                actions.reviewCreatorApplication(
                                  a.id,
                                  data.creator.id,
                                  true,
                                  "",
                                ),
                              {
                                success:
                                  "승인 완료: CREATOR 권한과 파란 인증 뱃지를 부여했어요.",
                              },
                            )
                          }
                        >
                          데모 승인하기
                        </button>
                      </div>
                    )}
                  </article>
                ))
              )}
            </div>
          ) : (
            <>
              {view === "room" && (
                <div
                  className={s.statusTabs}
                  role="tablist"
                  aria-label="판정 상태"
                  onKeyDown={tabKeys}
                >
                  {(
                    [
                      ["ING", "미답변", "ING"],
                      ["BUY", "사라", "BUY"],
                      ["NOT", "마라", "NOT"],
                      ["EXPIRED", "만료 / 미투표", ""],
                    ] as const
                  ).map(([key, label, english]) => (
                    <button
                      type="button"
                      role="tab"
                      aria-selected={status === key}
                      tabIndex={status === key ? 0 : -1}
                      aria-controls="request-grid"
                      key={key}
                      onClick={() => query({ status: key })}
                    >
                      {label}
                      <span>{english}</span>
                      <b>{counts(key)}</b>
                    </button>
                  ))}
                </div>
              )}
              <div className={s.filters}>
                <div className={s.categoryFilters} aria-label="카테고리">
                  {CATEGORIES.map((c) => (
                    <button
                      type="button"
                      key={c}
                      aria-pressed={category === c}
                      onClick={() => query({ category: c })}
                    >
                      {c}
                    </button>
                  ))}
                </div>
                <label className={s.sortLabel}>
                  <span className={s.resultCount}>
                    {list.length}개의 {view === "shop" ? "추천" : "고민"}
                  </span>
                  <select
                    aria-label="정렬"
                    value={sort}
                    onChange={(e) => query({ sort: e.target.value })}
                  >
                    <option value="latest">최신순</option>
                    <option value="oldest">오래된순</option>
                  </select>
                </label>
              </div>
              {view === "shop" && (
                <p className={s.affiliateNote}>
                  ↗ 쇼핑몰 이동은 비회원도 가능해요. 현재는 제휴 추적 없이 원본
                  상품 링크로 연결됩니다. 샘플 상품 정보는 실제 판매 정보와 다를
                  수 있어요.
                </p>
              )}
              <div
                id="request-grid"
                className={view === "shop" ? s.shopGrid : s.cardGrid}
                aria-busy={pending}
              >
                {list.map((item) =>
                  view === "shop" ? (
                    <ShopCard
                      key={item.id}
                      item={item}
                      liked={data.likedIds.includes(item.id)}
                      pending={pending}
                      onHeart={() =>
                        gate(() =>
                          run(() =>
                            actions.toggleRequestHeart(
                              item.id,
                              data.creator.id,
                            ),
                          ),
                        )
                      }
                      comment={
                        data.evaluations.find((e) => e.requestId === item.id)
                          ?.comment ?? ""
                      }
                    />
                  ) : (
                    <ProductCard
                      key={item.id}
                      request={item}
                      author={data.profiles.find((p) => p.id === item.authorId)}
                      evaluation={data.evaluations.find(
                        (e) => e.requestId === item.id,
                      )}
                      liked={data.likedIds.includes(item.id)}
                      own={data.viewer?.id === item.authorId}
                      now={now}
                      pending={pending}
                      onHeart={() =>
                        gate(() =>
                          run(
                            () =>
                              actions.toggleRequestHeart(
                                item.id,
                                data.creator.id,
                              ),
                            {
                              optimistic: (d) => ({
                                ...d,
                                likedIds: d.likedIds.includes(item.id)
                                  ? d.likedIds.filter((id) => id !== item.id)
                                  : [...d.likedIds, item.id],
                              }),
                            },
                          ),
                        )
                      }
                      onEvaluate={(decision) => evaluate(item, decision)}
                      onEdit={() =>
                        gate(() => setModal({ type: "write", edit: item }))
                      }
                      onDelete={() =>
                        gate(() => setModal({ type: "delete", request: item }))
                      }
                      onDetail={() =>
                        setModal({ type: "detail", request: item })
                      }
                    />
                  ),
                )}
              </div>
              {list.length === 0 && (
                <div className={s.empty}>
                  <Icon name={view === "shop" ? "bag" : "grid"} size={34} />
                  <h3>
                    {view === "shop"
                      ? "아직 추천 상품이 없어요"
                      : "아직 이곳에 남겨진 고민이 없어요"}
                  </h3>
                  <p>
                    {view === "shop"
                      ? "BUY 판정이 완료된 상품이 자동으로 모입니다."
                      : "다른 카테고리를 확인하거나 첫 고민을 남겨 보세요."}
                  </p>
                  <button
                    type="button"
                    className={s.textButton}
                    onClick={() =>
                      query({ category: "전체", status: "ING", view: "room" })
                    }
                  >
                    전체 고민 보기 ↗
                  </button>
                </div>
              )}
            </>
          )}
        </div>
        <div className={s.bottomNote}>
          <span>YOUR TASTE MATTERS.</span>
          <p>좋은 선택은, 좋은 질문에서 시작되니까.</p>
          <button type="button" onClick={apply}>
            당신의 큐레이션 룸을 열어보세요 <Icon name="arrow" size={17} />
          </button>
        </div>
      </main>
      <footer className={s.footer}>
        <span className={s.footerLogo}>BUY OR NOT.</span>
        <span>취향을 나누는 가장 가벼운 방법.</span>
        <span>PART B · MOCK PROTOTYPE</span>
      </footer>
      {toast && (
        <div
          role={toast.error ? "alert" : "status"}
          className={`${s.toast} ${toast.error ? s.errorToast : ""}`}
        >
          {toast.text}
          <button
            type="button"
            aria-label="알림 닫기"
            onClick={() => setToast(null)}
          >
            <Icon name="close" size={16} />
          </button>
        </div>
      )}
      {modal?.type === "login" && (
        <Modal
          title="로그인이 필요한 서비스입니다."
          onClose={() => setModal(null)}
        >
          <p className={s.modalIntro}>
            고민 작성, 판정, 찜, 팔로우는 로그인 후 이용할 수 있어요. 상품
            쇼핑몰 이동은 누구나 가능합니다.
          </p>
          <div className={s.notice}>
            <strong>아직 실제 로그인은 연결되지 않았어요.</strong>
            <p>
              현재는 Mock 데이터로 동작합니다. OAuth와 Supabase 인증은 추후 공통
              인증 모듈에 연결합니다.
            </p>
          </div>
          {data.demoEnabled && (
            <button
              type="button"
              className={s.primaryButton}
              disabled={pending}
              onClick={() =>
                run(() => actions.setDemoIdentity("member", data.creator.id), {
                  close: true,
                  success:
                    "일반 회원 데모로 전환했어요. 실제 로그인이 아닙니다.",
                })
              }
            >
              데모 회원으로 체험하기 <Icon name="arrow" size={17} />
            </button>
          )}
        </Modal>
      )}
      {modal?.type === "info" && (
        <Modal title={modal.title} onClose={() => setModal(null)}>
          <p className={s.modalIntro}>{modal.text}</p>
        </Modal>
      )}
      {modal?.type === "write" && (
        <RequestForm
          creatorId={data.creator.id}
          edit={modal.edit}
          busy={pending}
          onClose={() => setModal(null)}
          onSubmit={saveRequest}
        />
      )}
      {modal?.type === "apply" && (
        <ApplicationForm
          busy={pending}
          onClose={() => setModal(null)}
          onSubmit={submitApplication}
        />
      )}
      {modal?.type === "evaluate" && (
        <Modal
          title={modal.decision === "BUY" ? "이 상품, BUY!" : "이 상품은, NOT."}
          onClose={() => setModal(null)}
          busy={pending}
        >
          <div className={s.decisionSummary}>
            <span className={modal.decision === "BUY" ? s.blueText : ""}>
              {modal.decision === "BUY" ? "O" : "×"}
            </span>
            <div>
              <small>{modal.request.product.brand}</small>
              <h3>{modal.request.product.name}</h3>
            </div>
          </div>
          <p className={s.modalIntro}>{modal.request.concern}</p>
          <form className={s.form} onSubmit={submitEvaluation}>
            <label>
              선택의 이유를 한 줄로 <small>선택</small>
              <textarea
                maxLength={150}
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="핏이나 활용도에 대한 한 줄을 남겨 주세요."
              />
              <span className={s.counter}>{comment.length} / 150</span>
            </label>
            <p className={s.help}>
              판정 후에는 변경할 수 없습니다. BUY는 추천 숍과 피드에, NOT은
              피드에 자동 반영됩니다.
            </p>
            <button
              type="submit"
              className={
                modal.decision === "BUY" ? s.primaryButton : s.blackButton
              }
              disabled={pending}
            >
              {modal.decision} 판정 남기기 <Icon name="check" size={18} />
            </button>
          </form>
        </Modal>
      )}
      {modal?.type === "delete" && (
        <Modal
          title="이 고민을 삭제할까요?"
          onClose={() => setModal(null)}
          busy={pending}
        >
          <p className={s.modalIntro}>
            {modal.request.product.name}에 남긴 고민과 연결된 판정·추천 숍
            항목이 삭제됩니다. 되돌릴 수 없습니다.
          </p>
          <div className={s.modalActions}>
            <button
              type="button"
              className={s.secondaryButton}
              onClick={() => setModal(null)}
              disabled={pending}
            >
              취소
            </button>
            <button
              type="button"
              className={s.blackButton}
              disabled={pending}
              onClick={() =>
                run(
                  () =>
                    actions.deleteCurationRequest(
                      modal.request.id,
                      data.creator.id,
                    ),
                  { close: true, success: "고민을 삭제했어요." },
                )
              }
            >
              삭제하기
            </button>
          </div>
        </Modal>
      )}
      {modal?.type === "detail" && (
        <Modal title="살말 고민 자세히 보기" onClose={() => setModal(null)}>
          <span className={s.miniLabel}>{modal.request.product.brand}</span>
          <h3>{modal.request.product.name}</h3>
          <p className={s.modalIntro}>{modal.request.concern}</p>
          <div className={s.cardTags}>
            {modal.request.tags.map((tag) => (
              <span key={tag}>#{tag}</span>
            ))}
          </div>
          <dl className={s.specDetails}>
            {Object.entries(modal.request.bodySpec).map(([key, value]) => (
              <div key={key}>
                <dt>
                  {
                    {
                      age: "나이",
                      height_cm: "키 (cm)",
                      weight_kg: "몸무게 (kg)",
                      body_type: "체형",
                      personal_color: "퍼스널컬러",
                    }[key]
                  }
                </dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          {Object.keys(modal.request.bodySpec).length === 0 && (
            <p className={s.help}>작성자가 공개한 신체 정보가 없습니다.</p>
          )}
          <p className={s.help}>
            {modal.request.status === "ING"
              ? `응답 대기 · ${daysRemaining(modal.request, now)}일 뒤 만료`
              : modal.request.status === "EXPIRED"
                ? "만료 / 미투표"
                : `${modal.request.status} 판정 완료`}
          </p>
          <a
            className={s.primaryButton}
            href={getAffiliateLink(modal.request.product.url)}
            target="_blank"
            rel="noopener noreferrer sponsored"
          >
            쇼핑몰에서 보기 ↗
          </a>
        </Modal>
      )}
      {modal?.type === "reject" && (
        <Modal
          title="신청 반려 사유"
          onClose={() => setModal(null)}
          busy={pending}
        >
          <form
            className={s.form}
            onSubmit={(e) => {
              e.preventDefault();
              run(
                () =>
                  actions.reviewCreatorApplication(
                    modal.applicationId,
                    data.creator.id,
                    false,
                    comment,
                  ),
                { close: true, success: "반려 사유를 저장했어요." },
              );
            }}
          >
            <label>
              사유
              <textarea
                required
                maxLength={300}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </label>
            <button type="submit" className={s.blackButton} disabled={pending}>
              반려 확정하기
            </button>
          </form>
        </Modal>
      )}
      {modal?.type === "applicationStatus" && data.ownApplication && (
        <Modal title="내 룸 개설 신청" onClose={() => setModal(null)}>
          <span className={s.miniLabel}>{data.ownApplication.status}</span>
          <h3>{data.ownApplication.roomTitle}</h3>
          <p className={s.modalIntro}>
            {data.ownApplication.status === "PENDING"
              ? "신청이 접수되어 검토 중입니다. 데모 관리자 역할에서 승인 흐름을 확인할 수 있어요."
              : data.ownApplication.status === "APPROVED"
                ? "개설이 승인됐어요! 크리에이터 권한과 공식 인증 뱃지가 부여되었습니다."
                : `반려 사유: ${data.ownApplication.rejectReason}`}
          </p>
          {data.ownApplication.status === "APPROVED" && (
            <Link
              className={s.primaryButton}
              href={`/creators/room-${data.ownApplication.id}`}
            >
              내 큐레이션 룸 보기 ↗
            </Link>
          )}
          {data.ownApplication.status === "REJECTED" && (
            <button
              type="button"
              className={s.primaryButton}
              onClick={() => setModal({ type: "apply" })}
            >
              보완 후 다시 신청하기
            </button>
          )}
        </Modal>
      )}
    </div>
  );
}
function ShopCard({
  item,
  comment,
  liked,
  pending,
  onHeart,
}: {
  item: CurationRequest;
  comment: string;
  liked: boolean;
  pending: boolean;
  onHeart: () => void;
}) {
  return (
    <article className={s.shopCard}>
      <div className={s.shopVisual}>
        <a
          href={getAffiliateLink(item.product.url)}
          target="_blank"
          rel="noopener noreferrer sponsored"
          aria-label={`${item.product.name} 외부 쇼핑몰에서 보기`}
        >
          {item.product.image ? (
            <SamplePhoto source={item.product.image} alt={item.product.name} />
          ) : (
            <div className={s.imageFallback}>
              <Icon name="bag" size={40} />
            </div>
          )}
        </a>
        <span className={s.shopBadge}>O BUY PICK</span>
        <button
          type="button"
          className={`${s.shopHeart} ${liked ? s.liked : ""}`}
          aria-label={`${item.product.name} ${liked ? "찜 취소" : "찜하기"}`}
          aria-pressed={liked}
          disabled={pending}
          onClick={onHeart}
        >
          <Icon name="heart" size={18} filled={liked} />
        </button>
      </div>
      <p className={s.shopBrand}>{item.product.brand}</p>
      <h3>
        <a
          href={getAffiliateLink(item.product.url)}
          target="_blank"
          rel="noopener noreferrer sponsored"
        >
          {item.product.name} ↗
        </a>
      </h3>
      <strong>{formatPrice(item.product.price)}</strong>
      <p className={s.shopComment}>
        “{comment || "크리에이터가 추천하는 선택이에요."}”
      </p>
    </article>
  );
}
