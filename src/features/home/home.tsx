"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loadCommunity } from "../community/actions";
import { SiteHeader } from "../../components/site-header";
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

  return (
    <div className={styles.home}>
      <SiteHeader
        currentPage="home"
        loggedIn={loggedIn}
        accountLabel={loggedIn ? "My Page" : undefined}
        onAccount={() => router.push(loggedIn ? "/account" : "/login")}
      />

      <main className={styles.main}>
        <section className={styles.hero} aria-labelledby="home-title">
          <p>Good choices start together</p>
          <h1 id="home-title">
            <span>살까 말까 망설여질 때,</span>
            <span>모두의 한 표를 만나보세요.</span>
          </h1>
          <div className={styles.heroActions}>
            <Link
              href={loggedIn ? "/account" : "/login"}
              className={styles.button}
            >
              {loggedIn ? "My Page" : "Login"}
            </Link>
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
                onClick={() => router.push("/creators")}
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
    </div>
  );
}
