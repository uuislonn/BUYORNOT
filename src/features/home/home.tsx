"use client";
/* eslint-disable @next/next/no-img-element -- Figma's local decorative images and replaceable content slots. */
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loadCommunity } from "../community/actions";
import { SiteHeader } from "../../components/site-header";
import { RotaryDial } from "./rotary-dial";
import { experiences, featureCards, homeImages } from "./home-content";
import styles from "./home.module.css";

function ImageSlot({
  src,
  className,
}: {
  src: string | null;
  className?: string;
}) {
  return (
    <div
      className={`${styles.imageSlot} ${className ?? ""}`}
      aria-hidden="true"
    >
      {src && <img src={src} alt="" loading="lazy" />}
    </div>
  );
}
export default function Home() {
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);
  const [activeExperience, setActiveExperience] = useState(1);
  const home = useRef<HTMLDivElement>(null);
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
  useEffect(() => {
    const root = home.current;
    const header = root?.querySelector("header");
    if (!root || !header) return;
    const measure = () =>
      root.style.setProperty(
        "--home-header-height",
        `${header.getBoundingClientRect().height}px`,
      );
    measure();
    if (!window.ResizeObserver) return;
    const observer = new ResizeObserver(measure);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const root = home.current;
    if (
      !root ||
      !window.IntersectionObserver ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    root.dataset.motion = "ready";
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).dataset.visible = "true";
            observer.unobserve(entry.target);
          }
      },
      { threshold: 0.12 },
    );
    root
      .querySelectorAll("[data-reveal]")
      .forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={home} className={styles.home}>
      <SiteHeader
        currentPage="home"
        loggedIn={loggedIn}
        accountLabel={loggedIn ? "My Page" : undefined}
        onAccount={() => router.push(loggedIn ? "/account" : "/login")}
      />
      <main>
        <section className={styles.hero} aria-labelledby="home-title">
          <div className={styles.heroCopy}>
            <p>Good choices start together</p>
            <h1 id="home-title">
              <span>살까 말까 망설여질 때,</span>
              <span>모두의 한 표를 만나보세요.</span>
            </h1>
          </div>
          <RotaryDial loggedIn={loggedIn} />
        </section>

        <section
          className={styles.story}
          id="about"
          aria-labelledby="story-title"
        >
          <div className={styles.storyCopy} data-reveal>
            <h2 id="story-title">
              혼자 고민하던 당신에게
              <span className={styles.headingRule} aria-hidden="true" />
            </h2>
            <p>
              마음에 드는 것을 발견하는 건 설레지만,
              <br />
              구매를 결정하는 순간에는 늘 고민이 남습니다.
              <br />
              BUY OR NOT은 그 고민을 함께 나누는 데서 시작했습니다.
            </p>
          </div>
          <div
            className={styles.collage}
            data-reveal
            onPointerMove={(event) => {
              if (
                event.pointerType !== "mouse" ||
                window.matchMedia("(prefers-reduced-motion: reduce)").matches
              )
                return;
              const box = event.currentTarget.getBoundingClientRect();
              event.currentTarget.style.setProperty(
                "--tilt",
                `${((event.clientX - box.left) / box.width - 0.5) * 2}deg`,
              );
            }}
            onPointerLeave={(event) =>
              event.currentTarget.style.setProperty("--tilt", "0deg")
            }
          >
            <ImageSlot src={homeImages.story} className={styles.storyImage} />
            <ImageSlot
              src={homeImages.storyDetail}
              className={styles.detailImage}
            />
          </div>
        </section>

        <section
          className={styles.experiences}
          aria-labelledby="experience-title"
        >
          <div className={styles.experienceContent}>
            <h2 id="experience-title" data-reveal>
              갖고 싶은 건 많지만,
              <br />
              선택은 생각보다 쉽지 않으니까요.
            </h2>
            <ol className={styles.experienceList}>
              {experiences.map((experience, index) => (
                <li
                  data-active={activeExperience === index}
                  key={experience}
                  data-reveal
                  style={
                    {
                      "--reveal-delay": `${index * 65}ms`,
                    } as React.CSSProperties
                  }
                >
                  <button
                    type="button"
                    aria-pressed={activeExperience === index}
                    onClick={() => setActiveExperience(index)}
                  >
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <span>{experience}</span>
                  </button>
                </li>
              ))}
            </ol>
            <p className={styles.experienceNote} data-reveal>
              누군가의 솔직한 한마디가 내 마음을 더 분명하게 해줄 때가 있습니다.
              <br />
              BUY OR NOT에서 고민을 나누고, 확신이 드는 선택을 해보세요.
            </p>
          </div>
        </section>

        <div className={styles.panorama} data-reveal>
          <ImageSlot src={homeImages.panorama} />
        </div>

        <section
          className={styles.features}
          id="features"
          aria-labelledby="features-title"
        >
          <header className={styles.featureHeading} data-reveal>
            <h2 id="features-title">
              <sup>03</sup>고민을 나누고, 취향을 발견하는 방법
            </h2>
            <p>
              구매가 망설여질 때도, 새로운 발견이 필요할 때도.
              <br />
              BUY OR NOT에서 나에게 맞는 선택을 찾아보세요.
            </p>
          </header>
          <ul className={styles.cards}>
            {featureCards.map((card, index) => (
              <li
                key={card.title}
                data-reveal
                style={
                  {
                    "--reveal-delay": `${index * 100}ms`,
                  } as React.CSSProperties
                }
              >
                <div className={styles.cardImage}>
                  <img src={card.image} alt="" loading="lazy" />
                </div>
                <h3>{card.title}</h3>
                <p>{card.description}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className={styles.visit} aria-label="BUY OR NOT 시작하기">
          <div className={styles.visitPanel} data-reveal>
            <p className={styles.visitEyebrow}>Community</p>
            <h2>
              살까 말까,
              <br />
              함께 골라요.
            </h2>
            <Link href="/community" className={styles.visitLink}>
              피드 구경하기 <span aria-hidden="true">↗</span>
            </Link>
          </div>
          <div className={styles.visitPanel} data-reveal>
            <p className={styles.visitEyebrow}>Curation Room</p>
            <h2>
              좋아하는
              <br />
              크리에이터의 선택은?
            </h2>
            <Link href="/creators/seoa" className={styles.visitLink}>
              큐레이션룸 방문하기 <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </section>
      </main>
      <footer className={styles.footer}>
        <Link href="/">Buy or Not</Link>
        <span>Your next buy, decided together.</span>
      </footer>
    </div>
  );
}
