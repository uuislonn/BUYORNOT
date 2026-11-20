export function pointerAngle(x: number, y: number, cx: number, cy: number) {
  return (Math.atan2(y - cy, x - cx) * 180) / Math.PI;
}
export function angleDelta(next: number, previous: number) {
  return ((((next - previous + 180) % 360) + 360) % 360) - 180;
}
// Mechanical travel is bounded; it never accumulates full turns.
export function returnAngle(current: number, delta: number) {
  return Math.max(-270, Math.min(270, current + delta));
}
export function returnDuration(angle: number) {
  return Math.min(1400, Math.max(450, Math.abs(angle) * 5));
}
