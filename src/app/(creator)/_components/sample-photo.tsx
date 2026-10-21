/* eslint-disable @next/next/no-img-element -- Local image atlas; CSS crops keep all assets within Part B. */
"use client";
import { useState } from "react";
import atlas from "../_assets/curation-editorial.png";
import s from "./creator.module.css";
// AI-generated sample photography, not actual merchandise or a real creator.
export function SamplePhoto({
  source,
  alt,
  eager = false,
}: {
  source: string;
  alt: string;
  eager?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  if (failed)
    return (
      <span className={s.photoFallback} role="img" aria-label={alt}>
        이미지 준비 중
      </span>
    );
  const cell = source.startsWith("sample:") ? source.slice(7) : null;
  if (cell === null)
    return (
      <span className={s.photoCrop}>
        <img
          src={source}
          alt={alt}
          loading={eager ? "eager" : "lazy"}
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      </span>
    );
  const index = cell === "avatar" ? 0 : Number(cell);
  const style =
    cell === "avatar"
      ? { width: "900%", height: "600%", left: "-107%", top: "-20%" }
      : {
          width: "300%",
          height: "200%",
          left: `${-(index % 3) * 100}%`,
          top: `${-Math.floor(index / 3) * 100}%`,
        };
  return (
    <span className={s.photoCrop}>
      <img
        src={atlas.src}
        alt={alt}
        loading={eager ? "eager" : "lazy"}
        fetchPriority={eager ? "high" : "auto"}
        style={style}
        onError={() => setFailed(true)}
      />
    </span>
  );
}
