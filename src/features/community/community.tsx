"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SiteHeader } from "../../components/site-header";
import {
  deletePost,
  getPost,
  loadCommunity,
  setCommunityProductSaved,
} from "./actions";
import { categories, type FeedPost, type Viewer } from "./types";
import {
  ProductCardLayout,
  ProductCardTags,
} from "../../app/(creator)/_components/product-card-layout";
import { CommentButton } from "../../app/(creator)/_components/comment-button";
import { SaveHeart } from "../../app/(creator)/_components/save-heart";
import { Discussion } from "./discussion";
import { ProductImage } from "./product-image";
import { VoteButtons } from "./vote-buttons";
import { PostForm } from "./post-form";
import { Modal } from "./modal";
import { ShareButton } from "./share-button";
import { PostOwnerMenu } from "./post-owner-menu";
import styles from "./community.module.css";
import { CategoryFilter } from "./category-filter";
import { SortMenu } from "./sort-menu";
import { compareFeedPosts, parseFeedSort, type FeedSort } from "./feed-sort";
export default function Community() {
  const router = useRouter();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [viewer, setViewer] = useState<Viewer | null>(null);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [savingIds, setSavingIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [category, setCategory] = useState("전체");
  const [sort, setSort] = useState<FeedSort>("latest");
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
        setSavedIds(r.data.savedIds);
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
          setSavedIds(r.data.savedIds);
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
      setSort(parseFeedSort(q.get("sort")));
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
          if (result.ok) {
            setDetail(result.data);
            setPosts((previous) =>
              previous.map((post) =>
                post.id === result.data.id ? result.data : post,
              ),
            );
          } else {
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
    setSort(parseFeedSort(s));
    const url = new URL(location.href);
    if (c === "전체") url.searchParams.delete("category");
    else url.searchParams.set("category", c);
    if (s === "latest") url.searchParams.delete("sort");
    else url.searchParams.set("sort", s);
    history.pushState(null, "", url);
  }
  function write() {
    if (!viewer) {
      router.push("/login");
      return;
    }
    setForm({ url: "" });
  }
  function update(p: FeedPost) {
    setPosts((prev) => prev.map((x) => (x.id === p.id ? p : x)));
    setDetail((prev) => (prev?.id === p.id ? p : prev));
  }
  async function toggleSaved(id: string) {
    if (!viewer) return router.push("/login");
    if (savingIds.includes(id)) return;
    const wasSaved = savedIds.includes(id);
    function showSaved(saved: boolean) {
      setSavedIds((previous) =>
        saved
          ? [...new Set([...previous, id])]
          : previous.filter((item) => item !== id),
      );
    }
    setSavingIds((previous) => [...previous, id]);
    setError("");
    showSaved(!wasSaved);
    try {
      const result = await setCommunityProductSaved(id, !wasSaved);
      if (!result.ok) throw new Error(result.error);
      showSaved(result.data);
    } catch (error) {
      showSaved(wasSaved);
      setError(
        error instanceof Error
          ? error.message
          : "저장하지 못했어요. 다시 시도해 주세요.",
      );
    } finally {
      setSavingIds((previous) => previous.filter((item) => item !== id));
    }
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
    .sort((a, b) => compareFeedPosts(a, b, sort));
  async function openDetail(id: string) {
    if (openingPost) return;
    setOpeningPost(true);
    try {
      const result = await getPost(id);
      if (result.ok) {
        update(result.data);
        setDetail(result.data);
      } else setError(result.error);
    } catch {
      setError("게시글을 불러오지 못했습니다. 다시 시도해 주세요.");
    } finally {
      setOpeningPost(false);
    }
  }
  return (
    <>
      <div className={styles.app}>
        <SiteHeader
          currentPage="community"
          loggedIn={!!viewer}
          busy={busy}
          accountLabel={viewer ? "My Page" : undefined}
          onAccount={() => router.push(viewer ? "/account" : "/login")}
        />
        <main className={styles.main}>
          <h1 className={styles.pageTitle}>살말 투표 커뮤니티</h1>
          <div className={styles.toolbar}>
            <CategoryFilter
              categories={categories}
              value={category}
              onChange={(c) => filter(c, sort)}
            />
            <div className={styles.sort}>
              <SortMenu
                value={sort}
                onChange={(value) => filter(category, value)}
              />
            </div>
          </div>
          <div className={styles.feedTop}>
            <p>
              <strong>
                {category === "전체" ? "지금, 모두의 고민" : `${category} 고민`}
              </strong>{" "}
              <span>{visible.length}</span>
            </p>
            <div className={styles.feedActions}>
              <button className={styles.primary} onClick={write}>
                살말 고민 올리기
              </button>
            </div>
          </div>

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
              <button onClick={write}>고민 작성하기</button>
            </div>
          ) : (
            <div className={styles.grid}>
              {visible.map((p, i) => (
                <ProductCardLayout
                  key={p.id}
                  author={p.nickname}
                  product={{ ...p.product, price: p.product.price || null }}
                  image={<ProductImage post={p} eager={i < 4} />}
                  actions={
                    <SaveHeart
                      name={p.product.name}
                      liked={savedIds.includes(p.id)}
                      pending={savingIds.includes(p.id)}
                      onClick={() => toggleSaved(p.id)}
                    />
                  }
                  commentAction={
                    <CommentButton
                      disabled={openingPost}
                      onClick={() => openDetail(p.id)}
                    />
                  }
                  concern={
                    <button
                      className={styles.cardConcern}
                      disabled={openingPost}
                      onClick={() => openDetail(p.id)}
                    >
                      {p.concern}
                    </button>
                  }
                  category={p.category}
                  tags={p.tags}
                  tagDetails={
                    <>
                      {Object.entries(p.bodyProfile).map(([key, value]) => (
                        <span key={key}>
                          #{value}
                          {key === "height_cm"
                            ? "cm"
                            : key === "weight_kg"
                              ? "kg"
                              : key === "age"
                                ? "세"
                                : ""}
                        </span>
                      ))}
                      {p.visibility !== "PUBLIC" && <span>나만 보기</span>}
                    </>
                  }
                >
                  <VoteButtons
                    post={p}
                    loggedIn={!!viewer}
                    login={() => router.push("/login")}
                    update={update}
                  />
                </ProductCardLayout>
              ))}
            </div>
          )}
        </main>
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
            <p className={styles.eyebrow}>{detail.nickname}</p>
            <h3>{detail.product.name}</h3>
            <p>{detail.concern}</p>
            <ProductCardTags category={detail.category} tags={detail.tags} />
            <a
              href={detail.product.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              쇼핑몰에서 상품 보기
            </a>
            <VoteButtons
              post={detail}
              loggedIn={!!viewer}
              login={() => {
                setDetail(null);
                router.push("/login");
              }}
              update={update}
            />
            <Discussion
              key={detail.id}
              target={{ kind: "community", postId: detail.id }}
            />
          </Modal>
        )}
        {remove && (
          <Modal title="고민을 삭제할까요?" close={() => setRemove(null)}>
            <p>삭제한 게시글은 피드에서 사라집니다.</p>
            <button
              className={styles.primary}
              disabled={busy}
              onClick={destroy}
            >
              삭제하기
            </button>
          </Modal>
        )}
      </div>
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
    </>
  );
}
