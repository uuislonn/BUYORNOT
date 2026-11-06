"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loadCommunity } from "../community/actions";
import { SiteHeader } from "../../components/site-header";
import { LoginModal } from "../community/login-modal";
import { Modal } from "../community/modal";
import styles from "./home.module.css";

export default function Home() {
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);
  useEffect(() => {
    let active = true;
    loadCommunity()
      .then((result) => {
        if (active && result.ok) setLoggedIn(!!result.data.viewer);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  const [login, setLogin] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  return (
    <div className={styles.home}>
      <SiteHeader
        currentPage="home"
        loggedIn={loggedIn}
        accountLabel={loggedIn ? "My Page" : undefined}
        onAccount={() => (loggedIn ? router.push("/account") : setLogin(true))}
      />

      <main className={styles.main}>
        <section className={styles.hero} aria-labelledby="home-title">
          <p>Good choices start together</p>
          <h1 id="home-title">
            <span>살까 말까 망설여질 때,</span>
            <span>모두의 한 표를 만나보세요.</span>
          </h1>
          <div className={styles.heroActions}>
            <button className={styles.button} onClick={() => setLogin(true)}>
              Login
            </button>
            <Link href="/community" className={styles.outlineButton}>
              Explore the Feed
            </Link>
          </div>
        </section>

        <div className={styles.features}>
          <section
            className={styles.feature}
            id="curation"
            aria-labelledby="curation-title"
          >
            <div className={styles.copy}>
              <h2 id="curation-title">좋아하는 크리에이터의 선택은?</h2>
              <p>
                눈여겨본 아이템에 대한 구매 고민을 보내고, 크리에이터의 솔직한
                답과 추천을 만나보세요.
              </p>
              <button
                className={styles.button}
                onClick={() => router.push("/creators/seoa")}
              >
                Curation Room
              </button>
            </div>
            <div
              className={`${styles.art} ${styles.stipple}`}
              aria-hidden="true"
            />
          </section>

          <section
            className={`${styles.feature} ${styles.community}`}
            id="community"
            aria-labelledby="community-title"
          >
            <div
              className={`${styles.art} ${styles.wave}`}
              aria-hidden="true"
            />
            <div className={styles.copy}>
              <h2 id="community-title">살까 말까, 함께 골라요</h2>
              <p>
                혼자 결정하기 어려운 구매 고민을 나누고, 다양한 취향과 솔직한 한
                표를 만나보세요.
              </p>
              <Link href="/community" className={styles.button}>
                Community
              </Link>
            </div>
          </section>
        </div>

        <section className={styles.about} aria-labelledby="about-title">
          <div className={styles.content}>
            <h2 id="about-title">About me</h2>
            <div className={styles.feature}>
              <div
                className={`${styles.art} ${styles.checker}`}
                aria-hidden="true"
              />
              <div className={styles.copy}>
                <h3>Introduction</h3>
                <p>
                  BUY OR NOT은 살까 말까 망설이는 순간에서 시작했습니다.
                  커뮤니티의 한 표와 크리에이터의 솔직한 추천으로 구매 고민을
                  나누는 공간입니다. 더 많이 사기보다, 나에게 맞는 선택을 할 수
                  있도록 함께 고민합니다.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.content}>
          <Link href="/" className={styles.footerBrand}>
            Buy or Not
          </Link>
          <p>Your next buy, decided together.</p>
          <div className={styles.socials}>
            <button
              aria-label="Instagram 안내"
              onClick={() => setNotice("Instagram")}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden="true"
              >
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle
                  cx="17.5"
                  cy="6.5"
                  r="1"
                  fill="currentColor"
                  stroke="none"
                />
              </svg>
            </button>
            <button aria-label="X 안내" onClick={() => setNotice("X")}>
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </button>
          </div>
        </div>
      </footer>

      {login && (
        <LoginModal
          close={() => setLogin(false)}
          signedIn={async () => {
            setLogin(false);
            router.push("/community");
          }}
        />
      )}
      {notice && (
        <Modal title={notice} close={() => setNotice(null)}>
          <p>
            {notice === "Curation Room"
              ? "크리에이터 큐레이션 룸을 준비하고 있어요. 곧 만나요!"
              : "공식 SNS 채널을 준비하고 있어요. 곧 만나요!"}
          </p>
          <button className={styles.button} onClick={() => setNotice(null)}>
            확인
          </button>
        </Modal>
      )}
    </div>
  );
}
