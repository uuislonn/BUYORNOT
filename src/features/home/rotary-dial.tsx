"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { angleDelta, inertiaStep, pointerAngle } from "./dial-physics";
import styles from "./rotary-dial.module.css";

const slots = [
  [80.2, 25.2, "knit"],
  [66.4, 14.8, "cap"],
  [50.1, 11, "shoe"],
  [33.4, 15, "knit"],
  [18.8, 25.2, "bag"],
  [10.2, 40, "cap"],
  [10, 56.8, "shoe"],
  [18.4, 73, "bag"],
  [32, 85.5, "knit"],
  [49, 90.5, "cap"],
] as const;

export function RotaryDial({ loggedIn }: { loggedIn: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  const frame = useRef(0);
  const rotation = useRef(-12);
  const reduced = useRef(false);
  const drag = useRef<{
    id: number;
    previous: number;
    time: number;
    velocity: number;
  } | null>(null);
  const [dragging, setDragging] = useState(false);
  function paint(angle: number) {
    rotation.current = angle;
    root.current?.style.setProperty("--dial-angle", `${angle}deg`);
  }
  function stop() {
    cancelAnimationFrame(frame.current);
  }
  function turnTo(target: number, duration = 300) {
    stop();
    if (reduced.current) {
      paint(target);
      return;
    }
    const from = rotation.current;
    const start = performance.now();
    function tick(now: number) {
      const t = Math.min(1, (now - start) / duration);
      paint(from + (target - from) * (1 - Math.pow(1 - t, 3)));
      if (t < 1) frame.current = requestAnimationFrame(tick);
    }
    frame.current = requestAnimationFrame(tick);
  }
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    reduced.current = media.matches;
    if (media.matches) paint(0);
    else {
      const start = performance.now();
      const intro = (now: number) => {
        const t = Math.min(1, (now - start) / 1100);
        paint(-12 * Math.pow(1 - t, 3));
        if (t < 1) frame.current = requestAnimationFrame(intro);
      };
      frame.current = requestAnimationFrame(intro);
    }
    const changed = () => {
      reduced.current = media.matches;
      if (media.matches) cancelAnimationFrame(frame.current);
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
  function release(
    event: React.PointerEvent<SVGCircleElement>,
    cancelled = false,
  ) {
    const held = drag.current;
    if (!held || event.pointerId !== held.id) return;
    drag.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
    if (cancelled || reduced.current || event.timeStamp - held.time > 100)
      return;
    let velocity = held.velocity;
    let last = performance.now();
    function tick(now: number) {
      const step = inertiaStep(velocity, now - last);
      paint(rotation.current + step.delta);
      velocity = step.velocity;
      last = now;
      if (Math.abs(velocity) > 0.006)
        frame.current = requestAnimationFrame(tick);
    }
    frame.current = requestAnimationFrame(tick);
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
          turnTo(event.key === "Home" ? 0 : rotation.current + step);
        }}
      >
        <div className={styles.rotor} aria-hidden="true">
          <Image
            width={974}
            height={1004}
            sizes="(max-width: 767px) 122vw, 76vw"
            className={styles.phone}
            src="/home/figma/phone.png"
            alt=""
            draggable={false}
            fetchPriority="high"
          />
          {slots.map(([left, top, product], index) => (
            <div
              key={index}
              className={styles.pocket}
              style={{ left: `${left}%`, top: `${top}%` }}
            >
              <span className={styles.pocketRim} />
              <Image
                width={144}
                height={144}
                sizes="(max-width: 767px) 18vw, 11vw"
                src={
                  product === "bag"
                    ? "/home/figma/bag.png"
                    : `/home/products/${product}.png`
                }
                alt=""
                draggable={false}
              />
            </div>
          ))}
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
                time: event.timeStamp,
                velocity: 0,
              };
              setDragging(true);
            }}
            onPointerMove={(event) => {
              const held = drag.current;
              if (!held || event.pointerId !== held.id) return;
              const next = currentAngle(event);
              const delta = angleDelta(next, held.previous);
              const dt = Math.max(8, event.timeStamp - held.time);
              held.velocity = Math.max(
                -0.55,
                Math.min(0.55, held.velocity * 0.35 + (delta / dt) * 0.65),
              );
              held.previous = next;
              held.time = event.timeStamp;
              paint(rotation.current + delta);
            }}
            onPointerUp={(event) => release(event)}
            onPointerCancel={(event) => release(event, true)}
            onLostPointerCapture={(event) => {
              if (drag.current?.id === event.pointerId) release(event, true);
            }}
          />
        </svg>
        <div className={styles.center}>
          <div className={styles.centerActions}>
            <Link
              href={loggedIn ? "/account" : "/login"}
              className={styles.primary}
            >
              {loggedIn ? "마이페이지" : "로그인"}
            </Link>
            <Link href="/creators/seoa" className={styles.secondary}>
              큐레이션룸 방문하기
            </Link>
          </div>
        </div>
      </div>
      <div className={styles.controls}>
        <button
          type="button"
          aria-label="다이얼 왼쪽으로 돌리기"
          onClick={() => turnTo(rotation.current - 30)}
        >
          ↶
        </button>
        <p id="dial-help">
          드래그해서 돌려보세요<span> · 방향키로도 돌릴 수 있어요</span>
        </p>
        <button
          type="button"
          aria-label="다이얼 오른쪽으로 돌리기"
          onClick={() => turnTo(rotation.current + 30)}
        >
          ↷
        </button>
      </div>
    </div>
  );
}
