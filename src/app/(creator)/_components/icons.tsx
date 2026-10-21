import type { CSSProperties } from "react";
export function Icon({
  name,
  size = 20,
  filled = false,
  style,
}: {
  name:
    | "heart"
    | "arrow"
    | "plus"
    | "check"
    | "close"
    | "link"
    | "grid"
    | "bag"
    | "clock";
  size?: number;
  filled?: boolean;
  style?: CSSProperties;
}) {
  const paths = {
    heart:
      "M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z",
    arrow: "M5 12h14M13 6l6 6-6 6",
    plus: "M12 5v14M5 12h14",
    check: "m5 12 4 4L19 6",
    close: "m6 6 12 12M6 18 18 6",
    link: "M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-2 2M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l2-2",
    grid: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
    bag: "M5 7h14l2 14H3L5 7ZM8 7V5a4 4 0 0 1 8 0v2",
    clock: "M12 8v4l3 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z",
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={style}
    >
      <path d={paths[name]} />
    </svg>
  );
}
export function Verified() {
  return (
    <span
      title="공식 인증 크리에이터"
      aria-label="공식 인증 크리에이터"
      style={{
        display: "inline-flex",
        verticalAlign: "middle",
        color: "#0100FE",
      }}
    >
      <svg
        width="23"
        height="23"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="m12 0 3 2 3.6.4 1.2 3.4L22 9l-.5 3 1 3.3-2.8 2.2-1.3 3.3-3.6.3L12 23l-3-1.9-3.5-.3-1.3-3.3L1.4 15l1-3.1L2 9l2.2-3.2 1.2-3.4L9 2Z" />
        <path
          d="m7 12 3 3 7-7"
          stroke="white"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
