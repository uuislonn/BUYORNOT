export function luxuryProductName(name: string): string {
  return name
    .replace(/\s*\/\s*[A-Z0-9-]*\d[A-Z0-9-]*$/i, "")
    .replace(/\s*\([A-Z]+[A-Z0-9]*\d[A-Z0-9]*\)$/i, "")
    .replace(/_[A-Z]+\d[A-Z0-9]*$/i, "")
    .replace(/\s+[A-Z]{2,}\d+[A-Z0-9]*\s+[A-Z]{3,}$/i, "")
    .trim();
}
