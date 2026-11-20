"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  angleDelta,
  introAngle,
  INTRO_DURATION,
  returnAngle,
  returnDuration,
  pointerAngle,
} from "./dial-physics";
import styles from "./rotary-dial.module.css";

export function RotaryDial({ loggedIn }: { loggedIn: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  const frame = useRef(0);
  const rotation = useRef(0);
  const reduced = useRef(false);
  const drag = useRef<{
    id: number;
    previous: number;
  } | null>(null);
  const [dragging, setDragging] = useState(false);
  function paint(angle: number) {
    rotation.current = angle;
    root.current?.style.setProperty("--dial-angle", `${angle}deg`);
  }
  function stop() {
    cancelAnimationFrame(frame.current);
  }
  function turnTo(target: number, duration = 300, returnHome = false) {
    stop();
    if (reduced.current) {
      paint(returnHome ? 0 : target);
      return;
    }
    const from = rotation.current;
    const start = performance.now();
    function tick(now: number) {
      const t = Math.min(1, (now - start) / duration);
      paint(from + (target - from) * (1 - Math.pow(1 - t, 3)));
      if (t < 1) frame.current = requestAnimationFrame(tick);
      else if (returnHome) turnTo(0, returnDuration(target));
    }
    frame.current = requestAnimationFrame(tick);
  }
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    reduced.current = media.matches;
    if (media.matches) paint(0);
    else {
      const start = performance.now();
      function intro(now: number) {
        const elapsed = now - start;
        paint(introAngle(elapsed));
        if (elapsed < INTRO_DURATION)
          frame.current = requestAnimationFrame(intro);
      }
      frame.current = requestAnimationFrame(intro);
    }
    const changed = () => {
      reduced.current = media.matches;
      if (media.matches) {
        cancelAnimationFrame(frame.current);
        paint(0);
      }
    };
    media.addEventListener("change", changed);
    return () => {
      cancelAnimationFrame(frame.current);
      media.removeEventListener("change", changed);
    };
  }, []);
  function currentAngle(event: React.PointerEvent<SVGCircleElement>) {
    const bounds = root.current!.getBoundingClientRect();
    return pointerAngle(
      event.clientX,
      event.clientY,
      bounds.left + bounds.width / 2,
      bounds.top + bounds.height / 2,
    );
  }
  function release(event: React.PointerEvent<SVGCircleElement>) {
    const held = drag.current;
    if (!held || event.pointerId !== held.id) return;
    drag.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
    turnTo(0, returnDuration(rotation.current));
  }

  return (
    <div className={styles.stage}>
      <div
        ref={root}
        className={styles.dial}
        data-dragging={dragging}
        role="group"
        aria-label="직접 돌려보는 상품 다이얼"
        aria-describedby="dial-help"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget) return;
          const step =
            event.key === "ArrowRight"
              ? 15
              : event.key === "ArrowLeft"
                ? -15
                : 0;
          if (!step && event.key !== "Home") return;
          event.preventDefault();
          turnTo(
            event.key === "Home" ? 0 : returnAngle(rotation.current, step),
            250,
            event.key !== "Home",
          );
        }}
      >
        <div className={styles.rotor} aria-hidden="true">
          <Image
            width={974}
            height={974}
            sizes="(max-width: 767px) 130.7vw, 81.4vw"
            className={styles.phone}
            src="/home/dial/original.png"
            alt=""
            draggable={false}
            fetchPriority="high"
          />
          <Image
            className={styles.barRepair}
            src="/home/dial/metal-repair.png"
            width={1329}
            height={1329}
            sizes="(max-width: 767px) 130.7vw, 81.4vw"
            alt=""
            draggable={false}
          />
        </div>
        <svg
          className={styles.hitArea}
          viewBox="0 0 100 100"
          aria-hidden="true"
        >
          <circle
            cx="50"
            cy="50"
            r="34"
            fill="none"
            stroke="transparent"
            strokeWidth="30"
            onPointerDown={(event) => {
              if (
                !event.isPrimary ||
                (event.pointerType === "mouse" && event.button !== 0) ||
                drag.current
              )
                return;
              stop();
              event.currentTarget.setPointerCapture(event.pointerId);
              drag.current = {
                id: event.pointerId,
                previous: currentAngle(event),
              };
              setDragging(true);
            }}
            onPointerMove={(event) => {
              const held = drag.current;
              if (!held || event.pointerId !== held.id) return;
              const next = currentAngle(event);
              const delta = angleDelta(next, held.previous);
              held.previous = next;
              paint(returnAngle(rotation.current, delta));
            }}
            onPointerUp={(event) => release(event)}
            onPointerCancel={(event) => release(event)}
            onLostPointerCapture={(event) => {
              if (drag.current?.id === event.pointerId) release(event);
            }}
          />
        </svg>
        <Image
          className={styles.stop}
          src="/home/dial/stop.png"
          width={291}
          height={274}
          alt=""
          draggable={false}
          aria-hidden="true"
        />
        <div className={styles.center}>
          <div className={styles.centerActions}>
            <Link
              href={loggedIn ? "/account" : "/login"}
              className={styles.primary}
            >
              {loggedIn ? "마이페이지" : "로그인"}
            </Link>
            <Link href="/community" className={styles.secondary}>
              살말 고민 올리기
            </Link>
          </div>
        </div>
      </div>
      <span id="dial-help" className={styles.screenReaderOnly}>
        드래그하거나 좌우 방향키로 돌릴 수 있으며, 놓으면 제자리로 돌아옵니다.
      </span>
      <div className={styles.controls}>
        <button
          type="button"
          aria-label="다이얼 왼쪽으로 돌리기"
          onClick={() => turnTo(returnAngle(rotation.current, -45), 250, true)}
        >
          ↶
        </button>
        <button
          type="button"
          aria-label="다이얼 오른쪽으로 돌리기"
          onClick={() => turnTo(returnAngle(rotation.current, 45), 250, true)}
        >
          ↷
        </button>
      </div>
    </div>
  );
}
