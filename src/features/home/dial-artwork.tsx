import { useId } from "react";

// Coordinates use the existing 1224×1285 composition, not the hero's CSS size.
export const dialProducts = [
  {
    key: "hat",
    source: [382, 148, 145, 187],
    target: [407, 150, 96, 125],
    center: [458, 206, 75, 78],
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
    center: [841, 285, 78, 78],
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
    target: [138, 461, 125, 70],
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
  },
  {
    key: "lipstick",
    source: [675, 880, 76, 160],
    target: [676, 887, 61, 116],
    center: [705, 950, 73, 76],
  },
] as const;

// Use supplied PNG alpha directly, with only transparent canvas margins excluded.
const cutouts: Partial<
  Record<
    (typeof dialProducts)[number]["key"],
    {
      size: readonly [number, number];
      viewBox: string;
    }
  >
> = {
  foundation: { size: [740, 705], viewBox: "225 20 286 685" },
  blush: { size: [540, 549], viewBox: "44 31 454 492" },
  lipstick: { size: [571, 853], viewBox: "146 101 327 699" },
  bag: { size: [726, 814], viewBox: "63 34 626 736" },
  shoe: { size: [715, 433], viewBox: "50 68 572 313" },
  hat: { size: [900, 929], viewBox: "196 96 648 833" },
  jacket: { size: [793, 774], viewBox: "55 83 675 604" },
};

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
          if (cutouts[product.key]) return null;
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
        const cutout = cutouts[product.key];
        const [cx, cy, rx, ry] = product.center;
        return (
          <g key={product.key} clipPath={`url(#${id}-pocket-${product.key})`}>
            <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#fff" />
            <svg
              x={x}
              y={y}
              width={w}
              height={h}
              viewBox={cutout?.viewBox ?? product.source.join(" ")}
              preserveAspectRatio={cutout ? "xMidYMid meet" : "none"}
              overflow="hidden"
            >
              {cutout ? (
                <image
                  href={`/home/dial/cutouts/${product.key}.png`}
                  width={cutout.size[0]}
                  height={cutout.size[1]}
                />
              ) : (
                <image
                  href="/home/dial/curated-dial-highres.png"
                  width="1224"
                  height="1285"
                  preserveAspectRatio="none"
                  clipPath={`url(#${id}-${product.key})`}
                />
              )}
            </svg>
          </g>
        );
      })}
    </svg>
  );
}
