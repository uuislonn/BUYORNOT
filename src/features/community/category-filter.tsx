"use client";
import { useLayoutEffect, useRef, useState } from "react";
import styles from "./category-filter.module.css";

export function CategoryFilter({
  categories,
  value,
  onChange,
}: {
  categories: readonly string[];
  value: string;
  onChange: (category: string) => void;
}) {
  const track = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });
  useLayoutEffect(() => {
    const element = track.current;
    if (!element) return;
    const measure = () => {
      const selected = element.querySelector<HTMLButtonElement>(
        'button[aria-pressed="true"]',
      );
      if (selected)
        setIndicator({
          left: selected.offsetLeft,
          width: selected.offsetWidth,
        });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    for (const button of element.querySelectorAll("button"))
      observer.observe(button);
    return () => observer.disconnect();
  }, [value, categories]);

  return (
    <div className={styles.scroll}>
      <div
        ref={track}
        className={styles.track}
        role="group"
        aria-label="카테고리"
      >
        <span
          aria-hidden="true"
          className={styles.indicator}
          style={{
            width: indicator.width,
            transform: `translateX(${indicator.left}px)`,
          }}
        />
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            aria-pressed={value === category}
            onClick={(event) => {
              onChange(category);
              event.currentTarget.scrollIntoView({
                block: "nearest",
                inline: "nearest",
                behavior: "smooth",
              });
            }}
          >
            {category === "전체" ? "ALL" : category}
          </button>
        ))}
      </div>
    </div>
  );
}
