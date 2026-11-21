"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import styles from "./site-header.module.css";

type Page = "home" | "community" | "creators" | "account";
interface SiteHeaderProps {
  currentPage: Page;
  onAccount?: () => void;
  loggedIn?: boolean;
  busy?: boolean;
  accountLabel?: string;
  accountName?: string;
  accountAvatar?: string;
}
const pages: { page: Page; href: string; label: string; icon: string }[] = [
  { page: "home", href: "/", label: "홈", icon: "home" },
  {
    page: "community",
    href: "/community",
    label: "살말 커뮤니티",
    icon: "community",
  },
  { page: "creators", href: "/creators", label: "큐레이션 룸", icon: "room" },
  { page: "account", href: "/account", label: "마이", icon: "user" },
];
function NavIcon({ name }: { name: string }) {
  const paths: Record<string, React.ReactNode> = {
    home: (
      <>
        <path d="m3 10 9-7 9 7" />
        <path d="M5 9v11h5v-6h4v6h5V9" />
      </>
    ),
    community: (
      <>
        <path d="M20 11.5a8 8 0 0 1-8 8H5l-3 2V12a9 9 0 0 1 18-.5Z" />
        <path d="M7 10h8M7 14h5" />
      </>
    ),
    room: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="2" />
        <rect x="14" y="3" width="7" height="7" rx="2" />
        <rect x="3" y="14" width="7" height="7" rx="2" />
        <rect x="14" y="14" width="7" height="7" rx="2" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),
    search: (
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m16 16 5 5" />
      </>
    ),
    bell: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
      </>
    ),
  };
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
export function SiteHeader({
  currentPage,
  onAccount,
  loggedIn = false,
  busy = false,
}: SiteHeaderProps) {
  const searchForm = useRef<HTMLFormElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const searchButton = useRef<HTMLButtonElement>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  useEffect(() => {
    if (!searchOpen) return;
    searchInput.current?.focus();
    const closeOutside = (event: PointerEvent) => {
      if (!searchForm.current?.contains(event.target as Node))
        setSearchOpen(false);
    };
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [searchOpen]);
  const accountContent = loggedIn ? (
    <span className={styles.avatar}>
      <NavIcon name="user" />
    </span>
  ) : (
    "로그인"
  );
  return (
    <>
      <header className={styles.header}>
        <div className={styles.inner}>
          <Link
            href="/"
            className={styles.logo}
            aria-label="Buy or Not 홈"
            aria-current={currentPage === "home" ? "page" : undefined}
          >
            <span>
              Buy <span className={styles.logoAccent}>or</span> Not
            </span>
            <span className={styles.logoDot} aria-hidden="true" />
          </Link>
          <nav className={styles.nav} aria-label="주 메뉴">
            {pages
              .filter((p) => p.page === "community" || p.page === "creators")
              .map((p) => (
                <Link
                  key={p.page}
                  href={p.href}
                  aria-current={currentPage === p.page ? "page" : undefined}
                >
                  {p.label}
                </Link>
              ))}
          </nav>
          <div className={styles.actions}>
            <form
              ref={searchForm}
              method="get"
              action="/search"
              role="search"
              className={styles.searchForm}
              data-expanded={searchOpen}
              onSubmit={(event) => {
                if (searchInput.current?.value.trim()) return;
                event.preventDefault();
                searchInput.current?.focus();
              }}
              onKeyDown={(event) => {
                if (event.key !== "Escape" || !searchOpen) return;
                event.preventDefault();
                setSearchOpen(false);
                searchButton.current?.focus();
              }}
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget))
                  setSearchOpen(false);
              }}
            >
              <input
                id="site-search"
                ref={searchInput}
                name="q"
                type="search"
                placeholder="상품, 브랜드, 크리에이터 검색"
                aria-label="검색어"
                disabled={!searchOpen}
                maxLength={100}
              />
              <button
                type={searchOpen ? "submit" : "button"}
                className={styles.search}
                ref={searchButton}
                aria-expanded={searchOpen}
                aria-controls="site-search"
                aria-label={searchOpen ? "검색" : "검색 열기"}
                onClick={() => setSearchOpen(true)}
              >
                <NavIcon name="search" />
              </button>
            </form>
            <a
              href={loggedIn ? "/account?section=notifications" : "/login"}
              className={styles.iconButton}
              aria-label="알림"
            >
              <NavIcon name="bell" />
            </a>
            {onAccount ? (
              <button
                type="button"
                className={loggedIn ? styles.profile : styles.login}
                disabled={busy}
                onClick={onAccount}
                aria-label={loggedIn ? "내 계정" : "로그인"}
                aria-current={currentPage === "account" ? "page" : undefined}
              >
                {accountContent}
              </button>
            ) : (
              <Link
                className={loggedIn ? styles.profile : styles.login}
                href={loggedIn ? "/account" : "/login"}
                aria-label={loggedIn ? "내 계정" : "로그인"}
                aria-current={currentPage === "account" ? "page" : undefined}
              >
                {accountContent}
              </Link>
            )}
          </div>
        </div>
      </header>
      <nav className={styles.bottomNav} aria-label="모바일 주 메뉴">
        {pages.map((p) => (
          <Link
            key={p.page}
            href={p.href}
            aria-current={currentPage === p.page ? "page" : undefined}
          >
            <NavIcon name={p.icon} />
            <span>{p.page === "community" ? "커뮤니티" : p.label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
