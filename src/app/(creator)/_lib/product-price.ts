export function parseWon(value: unknown): number | null {
  if (typeof value !== "number" && typeof value !== "string") return null;
  if (typeof value === "string" && !/^\s*\d[\d,]*(?:\.0+)?\s*$/.test(value))
    return null;
  const amount =
    typeof value === "string"
      ? Number(value.replaceAll(",", "").trim())
      : value;
  return Number.isSafeInteger(amount) && amount > 0 && amount <= 100000000
    ? amount
    : null;
}
export function productPricing(
  price: unknown,
  originalPrice?: unknown,
  rate?: unknown,
) {
  const current = parseWon(price);
  const original = parseWon(originalPrice);
  if (current === null || original === null || original <= current)
    return { price: current, originalPrice: null, discountRate: null };
  const calculated = (1 - current / original) * 100;
  const supplied =
    typeof rate === "number" ||
    (typeof rate === "string" && /^\d+(?:\.\d+)?$/.test(rate))
      ? Number(rate)
      : NaN;
  const discount =
    Number.isFinite(supplied) &&
    supplied > 0 &&
    supplied < 100 &&
    Math.abs(supplied - calculated) <= 1.01
      ? supplied
      : Math.floor(calculated + 1e-8);
  return {
    price: current,
    originalPrice: original,
    discountRate: discount > 0 ? discount : null,
  };
}
