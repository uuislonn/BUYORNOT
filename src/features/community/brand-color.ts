export type BrandColor = "#000" | "#fff";

export function brandSampleUrl(source: string): string {
  const url = new URL(source);
  // MUSINSA's thumbnail service omits CORS headers. The same original asset
  // allows canvas reads; preserve the displayed thumbnail for the actual card.
  if (
    url.hostname === "image.msscdn.net" &&
    url.pathname.startsWith("/thumbnails/images/")
  ) {
    url.pathname = url.pathname.replace(/^\/thumbnails/, "");
    url.search = "";
  }
  return url.href;
}

export function brandColorForPixels(pixels: Uint8ClampedArray): BrandColor {
  let whitePixels = 0;
  let count = 0;
  for (let i = 0; i < pixels.length; i += 4) {
    if (!pixels[i + 3]) continue;
    const channels = [pixels[i], pixels[i + 1], pixels[i + 2]];
    // Require a nearly uniform white background, not just a bright photo.
    if (
      Math.min(...channels) >= 235 &&
      Math.max(...channels) - Math.min(...channels) <= 8
    )
      whitePixels++;
    count++;
  }
  return count > 0 && whitePixels / count >= 0.9 ? "#000" : "#fff";
}

export function readBrandColor(image: HTMLImageElement): BrandColor {
  const canvas = document.createElement("canvas");
  canvas.width = 48;
  canvas.height = 8;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return "#fff";
  // Sample the area behind the centered brand label, accounting for object-fit: cover.
  const width = image.width || image.naturalWidth;
  const height = image.height || image.naturalHeight;
  const scale = Math.max(
    width / image.naturalWidth,
    height / image.naturalHeight,
  );
  const cropX = (image.naturalWidth - width / scale) / 2;
  const cropY = (image.naturalHeight - height / scale) / 2;
  context.drawImage(
    image,
    cropX + (width * 0.2) / scale,
    cropY + 12 / scale,
    (width * 0.6) / scale,
    18 / scale,
    0,
    0,
    48,
    8,
  );
  return brandColorForPixels(context.getImageData(0, 0, 48, 8).data);
}
