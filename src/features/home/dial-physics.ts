export function pointerAngle(x: number, y: number, cx: number, cy: number) {
  return (Math.atan2(y - cy, x - cx) * 180) / Math.PI;
}
export function angleDelta(next: number, previous: number) {
  return ((((next - previous + 180) % 360) + 360) % 360) - 180;
}
// Mechanical travel is bounded; it never accumulates full turns.
export function returnAngle(current: number, delta: number) {
  return Math.max(-5, Math.min(150, current + delta));
}
export function returnDuration(angle: number) {
  return Math.min(1400, Math.max(450, Math.abs(angle) * 5));
}

// The lipstick reaches the foundation's original position at +150 degrees.
export const INTRO_DURATION = 2100;
export function introAngle(elapsed: number) {
  const time = Math.max(0, elapsed);
  if (time < 800) {
    const t = time / 800;
    return 150 * (t * t * (3 - 2 * t));
  }
  if (time < 900) return 150;
  const t = Math.min(1, (time - 900) / 1200);
  return 150 * Math.pow(1 - t, 3);
}
