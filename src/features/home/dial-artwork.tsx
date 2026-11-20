import { useId } from "react";

// Coordinates use the existing 1224×1285 composition, not the hero's CSS size.
export const dialProducts = [
  {
    key: "hat",
    source: [382, 148, 145, 187],
    target: [407, 150, 96, 125],
    center: [458, 206, 75, 78],
    path: "M407 153 Q470 136 511 174 L525 207 514 248 489 274 477 333 467 333 479 267 430 249 407 331 396 331 408 244 382 232 397 209Z",
  },
  {
    key: "hoodie",
    source: [588, 127, 146, 171],
    target: [609, 139, 102, 117],
    center: [660, 197, 75, 76],
    path: "M630 139 659 127 682 142 696 180 716 190 734 282 713 294 690 284 690 298 611 298 613 280 588 284 599 205 621 180Z",
  },
  {
    key: "jacket",
    source: [762, 220, 160, 136],
    target: [781, 229, 111, 98],
    center: [841, 285, 70, 74],
    path: "M799 234 824 220 853 226 863 239 889 245 904 282 922 346 897 354 881 319 881 349 787 350 788 316 779 354 762 348 777 271Z",
  },
  {
    key: "foundation",
    source: [261, 248, 60, 152],
    target: [269, 259, 47, 122],
    center: [289, 318, 72, 77],
  },
  {
    key: "shoe",
    source: [134, 460, 130, 70],
    target: [138, 473, 125, 46],
    center: [202, 497, 74, 76],
  },
  {
    key: "blush",
    source: [158, 652, 105, 113],
    target: [165, 654, 92, 101],
    center: [211, 700, 73, 75],
  },
  {
    key: "beanie",
    source: [271, 804, 115, 109],
    target: [279, 818, 98, 91],
    center: [327, 867, 73, 74],
  },
  {
    key: "bag",
    source: [436, 827, 143, 165],
    target: [461, 887, 99, 115],
    center: [502, 958, 75, 76],
    path: "M437 969 443 945 454 927 Q472 810 504 830 Q531 836 560 928 L573 942 579 976 569 990 447 992Z M461 928 552 928 Q527 849 504 841 Q480 824 461 928Z",
  },
  {
    key: "lipstick",
    source: [675, 880, 76, 160],
    target: [676, 887, 61, 116],
    center: [705, 950, 73, 76],
  },
] as const;

export function DialArtwork({ className }: { className: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg className={className} viewBox="0 0 1224 1285" aria-hidden="true">
      <defs>
        <filter id={`${id}-soft`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
        {dialProducts.map(({ key, center: [cx, cy, rx, ry] }) => (
          <clipPath key={key} id={`${id}-pocket-${key}`}>
            <ellipse cx={cx} cy={cy} rx={rx} ry={ry} />
          </clipPath>
        ))}
        <mask
          id={`${id}-base`}
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="1224"
          height="1285"
        >
          <rect width="1224" height="1285" fill="white" />
          {dialProducts.map(({ key, source: [x, y, w, h] }) => (
            <rect
              key={key}
              x={x - 10}
              y={y - 10}
              width={w + 20}
              height={h + 20}
              fill="black"
              filter={`url(#${id}-soft)`}
            />
          ))}
        </mask>
        {dialProducts.map((product) => {
          const [x, y, width, height] = product.source;
          return (
            <clipPath key={product.key} id={`${id}-${product.key}`}>
              {"path" in product ? (
                <path d={product.path} clipRule="evenodd" />
              ) : (
                <rect
                  x={x}
                  y={y}
                  width={width}
                  height={height}
                  rx={Math.min(width, height) * 0.2}
                />
              )}
            </clipPath>
          );
        })}
      </defs>
      <image href="/home/dial/curated-dial.png" width="1224" height="1285" />
      <image
        href="/home/dial/curated-dial-highres.png"
        width="1224"
        height="1285"
        preserveAspectRatio="none"
        mask={`url(#${id}-base)`}
      />
      {dialProducts.map((product) => {
        const [x, y, w, h] = product.target;
        const [cx, cy, rx, ry] = product.center;
        return (
          <g key={product.key} clipPath={`url(#${id}-pocket-${product.key})`}>
            <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#fff" />
            <svg
              x={x}
              y={y}
              width={w}
              height={h}
              viewBox={product.source.join(" ")}
              preserveAspectRatio="none"
              overflow="hidden"
            >
              <image
                href="/home/dial/curated-dial-highres.png"
                width="1224"
                height="1285"
                preserveAspectRatio="none"
                clipPath={`url(#${id}-${product.key})`}
              />
            </svg>
          </g>
        );
      })}
    </svg>
  );
}
