export function pointerAngle(x: number, y: number, cx: number, cy: number) {
  return (Math.atan2(y - cy, x - cx) * 180) / Math.PI;
}
export function angleDelta(next: number, previous: number) {
  return ((((next - previous + 180) % 360) + 360) % 360) - 180;
}
export function inertiaStep(velocity: number, elapsed: number) {
  const dt = Math.min(40, Math.max(0, elapsed));
  const decay = Math.exp(-0.0055 * dt);
  return {
    delta: (velocity * (1 - decay)) / 0.0055,
    velocity: velocity * decay,
  };
}
