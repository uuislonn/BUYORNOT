import { ImageResponse } from "next/og";
import { readFileSync } from "node:fs";
import { join } from "node:path";
export const size = { width: 64, height: 64 };
export const contentType = "image/png";
export default function Icon() {
  const source = readFileSync(join(process.cwd(), "public", "brand-icon.png"));
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* The supplied artwork is fitted unchanged into the square browser icon. */}
      <img
        src={`data:image/png;base64,${source.toString("base64")}`}
        alt=""
        width={64}
        height={64}
        style={{ objectFit: "contain" }}
      />
    </div>,
    size,
  );
}
