"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SiteHeader } from "../../components/site-header";
import { deletePost, getPost, loadCommunity } from "./actions";
import { categories, type FeedPost, type Viewer } from "./types";
import { ProductImage } from "./product-image";
import { VoteButtons } from "./vote-buttons";
import { ClipboardModal } from "./clipboard-modal";
import { PostForm } from "./post-form";
import { Modal } from "./modal";
import { LoginModal } from "./login-modal";
import { ShareButton } from "./share-button";
import { PostOwnerMenu } from "./post-owner-menu";
import styles from "./community.module.css";
export default function Community() {
  const router = useRouter();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [viewer, setViewer] = useState<Viewer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [category, setCategory] = useState("전체");
  const [sort, setSort] = useState("latest");
  const [login, setLogin] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState<{ url: string; post?: FeedPost } | null>(
    null,
  );
  const [detail, setDetail] = useState<FeedPost | null>(null);
  const [remove, setRemove] = useState<FeedPost | null>(null);
  const [openingPost, setOpeningPost] = useState(false);
  async function refresh() {
    setLoading(true);
    setError("");
    try {
      const r = await loadCommunity();
      if (r.ok) {
        setPosts(r.data.posts);
        setViewer(r.data.viewer);
      } else setError(r.error);
    } catch {
      setError("피드를 불러오지 못했습니다. 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    let active = true;
    let detailRequest = 0;
    loadCommunity()
      .then((r) => {
        if (!active) return;
        if (r.ok) {
          setPosts(r.data.posts);
          setViewer(r.data.viewer);
        } else setError(r.error);
        setLoading(false);
      })
      .catch(() => {
        if (active) {
          setError("피드를 불러오지 못했습니다. 다시 시도해 주세요.");
          setLoading(false);
        }
      });
    function sync() {
      const q = new URLSearchParams(location.search);
      setCategory(
        categories.some((c) => c === q.get("category"))
          ? q.get("category")!
          : "전체",
      );
      setSort(q.get("sort") === "popular" ? "popular" : "latest");
      const request = ++detailRequest;
      const id = q.get("post");
      if (!id) {
        setDetail(null);
        setOpeningPost(false);
        return;
      }
      setOpeningPost(true);
      getPost(id)
        .then((result) => {
          if (!active || request !== detailRequest) return;
          if (result.ok) setDetail(result.data);
          else {
            setDetail(null);
            setError(result.error);
          }
        })
        .catch(() => {
          if (active && request === detailRequest)
            setError(
              "공유된 게시글을 불러오지 못했습니다. 다시 시도해 주세요.",
            );
        })
        .finally(() => {
          if (active && request === detailRequest) setOpeningPost(false);
        });
    }
    queueMicrotask(() => {
      if (active) sync();
    });
    window.addEventListener("popstate", sync);
    return () => {
      active = false;
      window.removeEventListener("popstate", sync);
    };
  }, []);
  function closeDetail() {
    setDetail(null);
    const url = new URL(location.href);
    if (url.searchParams.has("post")) {
      url.searchParams.delete("post");
      history.replaceState(null, "", url);
    }
  }
  function filter(c: string, s: string) {
    setCategory(c);
    setSort(s);
    const url = new URL(location.href);
    if (c === "전체") url.searchParams.delete("category");
    else url.searchParams.set("category", c);
    if (s === "latest") url.searchParams.delete("sort");
    else url.searchParams.set("sort", s);
    history.pushState(null, "", url);
  }
  function write(url = "") {
    if (!viewer) {
      setLogin(true);
      return;
    }
    setForm({ url });
  }
  function update(p: FeedPost) {
    setPosts((prev) => prev.map((x) => (x.id === p.id ? p : x)));
    setDetail((prev) => (prev?.id === p.id ? p : prev));
  }
  async function destroy() {
    if (!remove) return;
    setBusy(true);
    try {
      const r = await deletePost(remove.id);
      if (r.ok) {
        setPosts((p) => p.filter((x) => x.id !== remove.id));
        setRemove(null);
        setDetail(null);
      } else setError(r.error);
    } catch {
      setError("삭제하지 못했습니다.");
    } finally {
      setBusy(false);
    }
  }
  const visible = posts
    .filter((p) => category === "전체" || p.category === category)
    .sort((a, b) =>
      sort === "popular"
        ? b.buy + b.not - (a.buy + a.not) ||
          b.createdAt.localeCompare(a.createdAt)
        : b.createdAt.localeCompare(a.createdAt),
    );
  return (
    <div className={styles.app}>
      <SiteHeader
        currentPage="community"
        loggedIn={!!viewer}
        busy={busy}
        accountLabel={viewer ? "My Page" : undefined}
        onAccount={() => (viewer ? router.push("/account") : setLogin(true))}
      />
      <main className={styles.main}>
        <h1 className={styles.pageTitle}>살말 투표 커뮤니티</h1>
        <div className={styles.toolbar}>
          <div className={styles.filters} role="group" aria-label="카테고리">
            {categories.map((c) => (
              <button
                aria-pressed={category === c}
                key={c}
                onClick={() => filter(c, sort)}
              >
                {c === "전체" ? "ALL" : c}
              </button>
            ))}
          </div>
          <label className={styles.sort}>
            정렬{" "}
            <select
              value={sort}
              onChange={(e) => filter(category, e.target.value)}
            >
              <option value="latest">최신순</option>
              <option value="popular">인기순</option>
            </select>
          </label>
        </div>
        <div className={styles.feedTop}>
          <p>
            <strong>
              {category === "전체" ? "지금, 모두의 고민" : `${category} 고민`}
            </strong>{" "}
            <span>{visible.length}</span>
          </p>
          <div className={styles.feedActions}>
            <ClipboardModal openLink={write} />
            <button className={styles.primary} onClick={() => write()}>
              살말 고민 올리기 ↗
            </button>
          </div>
        </div>
        <p className={styles.demo}>
          DEMO · 실제 상품 링크와 사진을 사용한 예시 게시글·투표입니다. 가격은
          2026년 10–11월 상품 페이지 스냅샷이며 현재 가격·재고는 쇼핑몰에서
          확인해 주세요. 작성 내용은 서버 재시작 시 초기화됩니다.
        </p>
        {error && (
          <div role="alert" className={styles.error}>
            {error} <button onClick={refresh}>다시 불러오기</button>
          </div>
        )}
        {openingPost && <p role="status">공유된 게시글을 불러오는 중…</p>}
        {loading ? (
          <div role="status" className={styles.empty}>
            모두의 고민을 불러오는 중…
          </div>
        ) : visible.length === 0 ? (
          <div className={styles.empty}>
            <h2>아직 올라온 고민이 없어요.</h2>
            <p>첫 번째 살말 고민을 남겨보세요.</p>
            <button onClick={() => write()}>고민 작성하기 ↗</button>
          </div>
        ) : (
          <div className={styles.grid}>
            {visible.map((p, i) => (
              <article className={styles.card} key={p.id}>
                <div className={styles.cardHeader}>
                  <button onClick={() => setDetail(p)}>
                    <span
                      className={styles.avatar}
                      style={{
                        background: ["#e5e2ee", "#e6e9da", "#f0e1da"][i % 3],
                      }}
                    >
                      {p.nickname.slice(0, 1)}
                    </span>
                    {p.nickname}
                  </button>
                  <span>{p.category}</span>
                </div>
                <a
                  className={styles.image}
                  href={p.product.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${p.product.name} 쇼핑몰에서 보기`}
                >
                  <ProductImage post={p} eager={i < 4} />
                  <div className={styles.imageCaption}>
                    <span>{p.product.name}</span>
                    <span>
                      {p.product.price
                        ? `₩${p.product.price.toLocaleString("ko-KR")}`
                        : "가격 확인 필요"}
                    </span>
                  </div>
                  <div className={styles.imageHover}>쇼핑몰에서 보기 ↗</div>
                </a>
                <div className={styles.cardBody}>
                  <button
                    className={styles.concern}
                    onClick={() => setDetail(p)}
                  >
                    {p.concern}
                  </button>
                  <div className={styles.tags}>
                    {Object.entries(p.bodyProfile).map(([k, v]) => (
                      <span key={k}>
                        {v}
                        {k === "height_cm"
                          ? "cm"
                          : k === "weight_kg"
                            ? "kg"
                            : k === "age"
                              ? "세"
                              : ""}
                      </span>
                    ))}
                    {p.visibility !== "PUBLIC" && <span>나만 보이는 Mock</span>}
                  </div>
                  <VoteButtons
                    post={p}
                    loggedIn={!!viewer}
                    login={() => setLogin(true)}
                    update={update}
                  />
                </div>
              </article>
            ))}
          </div>
        )}
        <footer className={styles.footer}>
          <strong>Buy or Not</strong>
          <p>좋은 선택은, 함께.</p>
          <span>© 2026 BUY OR NOT · COMMUNITY</span>
        </footer>
      </main>
      {login && (
        <LoginModal
          close={() => setLogin(false)}
          signedIn={async () => {
            await refresh();
            setLogin(false);
          }}
        />
      )}
      {form && (
        <PostForm
          post={form.post}
          initialUrl={form.url}
          close={() => setForm(null)}
          saved={(p) => {
            setPosts((prev) => [p, ...prev.filter((x) => x.id !== p.id)]);
            setForm(null);
            setDetail(null);
          }}
        />
      )}
      {detail && (
        <Modal
          title="살말 고민"
          close={closeDetail}
          actions={
            <>
              <ShareButton key={detail.id} post={detail} />
              <PostOwnerMenu
                key={`owner-${detail.id}`}
                isOwner={detail.authorId === viewer?.id}
                edit={() => {
                  setForm({ url: detail.product.url, post: detail });
                  setDetail(null);
                }}
                remove={() => {
                  setRemove(detail);
                  setDetail(null);
                }}
              />
            </>
          }
        >
          <p className={styles.eyebrow}>
            {detail.nickname} · {detail.category}
          </p>
          <h3>{detail.product.name}</h3>
          <p>{detail.concern}</p>
          <a
            href={detail.product.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            쇼핑몰에서 상품 보기 ↗
          </a>
          <VoteButtons
            post={detail}
            loggedIn={!!viewer}
            login={() => {
              setDetail(null);
              setLogin(true);
            }}
            update={update}
          />
        </Modal>
      )}
      {remove && (
        <Modal title="고민을 삭제할까요?" close={() => setRemove(null)}>
          <p>삭제한 게시글은 피드에서 사라집니다.</p>
          <button className={styles.primary} disabled={busy} onClick={destroy}>
            삭제하기
          </button>
        </Modal>
      )}
    </div>
  );
}
