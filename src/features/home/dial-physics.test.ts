import { describe, expect, it } from "vitest";
import { angleDelta, inertiaStep, pointerAngle } from "./dial-physics";

describe("다이얼 조작 물리", () => {
  it("원의 경계를 지나도 회전 방향이 뒤집히거나 점프하지 않는다", () => {
    expect(angleDelta(-179, 179)).toBe(2);
    expect(angleDelta(179, -179)).toBe(-2);
    expect(angleDelta(50, 20)).toBe(30);
  });
  it("포인터가 실제 중심을 기준으로 각도를 계산한다", () => {
    expect(pointerAngle(200, 100, 100, 100)).toBe(0);
    expect(pointerAngle(100, 200, 100, 100)).toBe(90);
    expect(pointerAngle(100, 0, 100, 100)).toBe(-90);
  });
  it("관성은 양방향에서 부드럽게 감속하고 결국 멈춘다", () => {
    for (const initial of [-0.5, 0.5]) {
      let velocity = initial;
      let total = 0;
      for (let i = 0; i < 120; i++) {
        const step = inertiaStep(velocity, 16);
        expect(Math.abs(step.velocity)).toBeLessThan(Math.abs(velocity));
        total += step.delta;
        velocity = step.velocity;
      }
      expect(Math.abs(velocity)).toBeLessThan(0.006);
      expect(Math.sign(total)).toBe(Math.sign(initial));
      expect(Math.abs(total)).toBeLessThan(100);
    }
  });
  it("프레임 지연이나 정지 속도로 급격하게 회전하지 않는다", () => {
    expect(inertiaStep(0, 16)).toEqual({ delta: 0, velocity: 0 });
    expect(inertiaStep(0.5, 5000)).toEqual(inertiaStep(0.5, 40));
  });
});
