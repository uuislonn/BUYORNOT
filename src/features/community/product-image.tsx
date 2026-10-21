"use client";
/* eslint-disable @next/next/no-img-element -- External Dummy Data images with local fallback. */
import { useState } from "react";
import type { FeedPost } from "./types";
import styles from "./community.module.css";
export function ProductImage({
  post,
  eager,
}: {
  post: FeedPost;
  eager: boolean;
}) {
  const [failed, setFailed] = useState(false);
  if (post.product.image && !failed)
    return (
      <img
        src={post.product.image}
        alt={post.product.name}
        loading={eager ? "eager" : "lazy"}
        onError={() => setFailed(true)}
      />
    );
  const bag = post.category === "잡화" || post.category === "명품";
  const shoe = post.category === "신발";
  const beauty = post.category === "뷰티";
  const dark = post.id === "sample-3";
  const color = dark
    ? "#343632"
    : bag
      ? "#4a3024"
      : shoe
        ? "#e2d5c0"
        : beauty
          ? "#b8b496"
          : "#c6c0a9";
  return (
    <div
      className={styles.fallbackArt}
      style={{
        background: dark
          ? "#d6d5d1"
          : shoe
            ? "#e6e2da"
            : bag
              ? "#e3dfd7"
              : beauty
                ? "#e8e5dc"
                : "#e1e0d7",
      }}
    >
      <svg
        viewBox="0 0 400 450"
        role="img"
        aria-label={`${post.product.name} · 사진을 불러올 수 없어 표시한 예시 일러스트`}
      >
        <defs>
          <filter
            id={`shadow-${post.id}`}
            x="-30%"
            y="-30%"
            width="160%"
            height="180%"
          >
            <feDropShadow dx="4" dy="15" stdDeviation="12" floodOpacity=".16" />
          </filter>
        </defs>
        <ellipse cx="200" cy="380" rx="115" ry="15" fill="#000" opacity=".05" />
        <g filter={`url(#shadow-${post.id})`}>
          {bag ? (
            <>
              <path
                d="M146 175v-32c0-82 108-82 108 0v32"
                stroke={color}
                strokeWidth="14"
                fill="none"
              />
              <path
                d="M105 169Q200 152 295 169l19 166q-110 34-228 0z"
                fill={color}
              />
              <path
                d="M113 185q85 20 176 0"
                fill="none"
                stroke="#ffffff"
                strokeOpacity=".16"
              />
              <rect
                x="191"
                y="209"
                width="18"
                height="16"
                rx="2"
                fill="#c7af7c"
              />
            </>
          ) : shoe ? (
            <g transform="rotate(-18 200 260)">
              <path
                d="M80 265l30-111q16-14 40 12l27 57 88 32 58 13q28 6 25 37L79 303z"
                fill={color}
              />
              <path d="M81 286q114 26 269-2v27q-152 34-272 0z" fill="#f5f3ec" />
              <path
                d="m179 222 22 39m1-31 22 38m2-30 22 36"
                stroke="#565950"
                strokeWidth="12"
              />
              <path
                d="m132 186 43 45m-51-26 39 40m-45-17 35 30"
                stroke="#f6f5f0"
                strokeWidth="5"
              />
            </g>
          ) : beauty ? (
            <>
              <rect
                x="140"
                y="169"
                width="120"
                height="167"
                rx="12"
                fill={color}
                opacity=".9"
              />
              <rect
                x="173"
                y="116"
                width="54"
                height="54"
                rx="5"
                fill="#38392f"
              />
              <rect x="152" y="225" width="96" height="58" fill="#f4f1e5" />
              <text
                x="200"
                y="251"
                textAnchor="middle"
                fontFamily="serif"
                fontSize="11"
                fill="#3b3d33"
              >
                EAU DE PARFUM
              </text>
              <path
                d="M153 181v136"
                stroke="white"
                strokeOpacity=".3"
                strokeWidth="4"
              />
            </>
          ) : (
            <>
              <path
                d="m145 117 32-17q23 20 46 0l32 17 65 43 32 142-52 15-38-105 9 145H129l9-145-38 105-52-15 32-142z"
                fill={color}
              />
              <path
                d="m177 100 23 68 23-68M200 167v188"
                stroke={dark ? "#232521" : "#a09a82"}
                fill="none"
                strokeWidth="3"
              />
              {[196, 226, 256, 286, 316].map((y) => (
                <circle
                  key={y}
                  cx="207"
                  cy={y}
                  r="3"
                  fill={dark ? "#8f8c72" : "#827e6b"}
                />
              ))}
              <path
                d="M143 277h38v32h-38m76-32h38v32h-38M134 340h132"
                fill="none"
                stroke={dark ? "#262824" : "#aba58f"}
                strokeWidth="2"
              />
            </>
          )}
        </g>
      </svg>
      <span className={styles.fallbackLabel}>SAMPLE IMAGE · 상품 예시</span>
    </div>
  );
}
