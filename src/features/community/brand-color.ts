export type BrandColor = "#000" | "#fff";

export function brandColorForPixels(pixels: Uint8ClampedArray): BrandColor {
  let brightness = 0;
  let count = 0;
  for (let i = 0; i < pixels.length; i += 4) {
    if (!pixels[i + 3]) continue;
    brightness +=
      pixels[i] * 0.2126 + pixels[i + 1] * 0.7152 + pixels[i + 2] * 0.0722;
    count++;
  }
  return count && brightness / count < 128 ? "#fff" : "#000";
}

export function readBrandColor(image: HTMLImageElement): BrandColor {
  const canvas = document.createElement("canvas");
  canvas.width = 48;
  canvas.height = 8;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return "#000";
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
