"use client";
import { useState } from "react";
import styles from "./product-folder.module.css";

export function ProductFolder({ className }: { className: string }) {
  const [open, setOpen] = useState(false);
  return (
    <button
      type="button"
      className={`${className} ${styles.folder}`}
      aria-label="폴더 속 안경, 신발, 티셔츠 살펴보기"
      aria-pressed={open}
      data-open={open}
      onClick={() => setOpen((value) => !value)}
    >
      <svg
        className={styles.scene}
        viewBox="380 0 2100 2220"
        aria-hidden="true"
      >
        <image
          href="/home/folder/back.png"
          x="421"
          y="520"
          width="2039"
          height="1655"
        />
        <g className={`${styles.item} ${styles.glasses}`}>
          <svg
            x="733"
            y="347"
            width="556"
            height="663"
            viewBox="178 99 556 663"
            overflow="visible"
          >
            <image href="/home/folder/glasses.png" width="853" height="941" />
          </svg>
        </g>
        <g className={`${styles.item} ${styles.shirt}`}>
          <svg
            x="1560"
            y="555"
            width="760"
            height="708"
            viewBox="163 262 1044 972"
            overflow="visible"
          >
            <image href="/home/folder/shirt.png" width="1477" height="1410" />
          </svg>
        </g>
        <g className={`${styles.item} ${styles.shoe}`}>
          <svg
            x="1125"
            y="80"
            width="680"
            height="1037"
            viewBox="259 228 717 1093"
            overflow="visible"
          >
            <image href="/home/folder/shoe.png" width="1154" height="1425" />
          </svg>
        </g>
        <svg
          x="460"
          y="840"
          width="1940"
          height="1280"
          viewBox="76 73 2445 1615"
          overflow="visible"
        >
          <image href="/home/folder/front.png" width="2611" height="1781" />
        </svg>
      </svg>
    </button>
  );
}
