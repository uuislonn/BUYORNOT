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
  return Math.min(1120, Math.max(360, Math.abs(angle) * 4));
}

// The lipstick reaches the foundation's original position at +150 degrees.
export const INTRO_DURATION = 1680;
export function introAngle(elapsed: number) {
  const time = Math.max(0, elapsed);
  if (time < 640) {
    const t = time / 640;
    return 150 * (t * t * (3 - 2 * t));
  }
  if (time < 720) return 150;
  const t = Math.min(1, (time - 720) / 960);
  return 150 * Math.pow(1 - t, 3);
}
