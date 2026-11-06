"use client";

import Link from "next/link";
import styles from "./site-header.module.css";

interface SiteHeaderProps {
  currentPage: "home" | "community";
  onAccount: () => void;
  loggedIn?: boolean;
  busy?: boolean;
  accountLabel?: string;
}

export function SiteHeader({
  currentPage,
  onAccount,
  loggedIn = false,
  busy = false,
  accountLabel,
}: SiteHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link
          href="/"
          className={styles.logo}
          aria-label="Buy or Not 홈"
          aria-current={currentPage === "home" ? "page" : undefined}
        >
          <span>Buy or Not</span>
        </Link>
        <nav className={styles.nav} aria-label="주 메뉴">
          <Link href="/creators/seoa">Curation Room</Link>
          <Link
            href="/community"
            aria-current={currentPage === "community" ? "page" : undefined}
          >
            Community
          </Link>
        </nav>
        <button className={styles.account} disabled={busy} onClick={onAccount}>
          {accountLabel ?? (loggedIn ? "Logout" : "Login")}
        </button>
      </div>
    </header>
  );
}
