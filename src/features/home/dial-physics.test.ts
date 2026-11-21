import { describe, expect, it } from "vitest";
import {
  angleDelta,
  introAngle,
  INTRO_DURATION,
  returnAngle,
  returnDuration,
  pointerAngle,
} from "./dial-physics";

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
  it("회전 범위를 제한해 여러 바퀴를 감아도 과도한 복귀가 발생하지 않는다", () => {
    expect(returnAngle(140, 40)).toBe(150);
    expect(returnAngle(0, -40)).toBe(-5);
    expect(returnAngle(-5, -40)).toBe(-5);
    expect(returnAngle(45, -20)).toBe(25);
  });
  it("복귀 시간은 회전 거리에 비례하며 짧거나 긴 조작에서도 제한된다", () => {
    expect(returnDuration(0)).toBe(270);
    expect(returnDuration(180)).toBe(540);
    expect(returnDuration(-180)).toBe(540);
    expect(returnDuration(1000)).toBe(840);
  });
  it("진입 회전은 립스틱을 파운데이션 자리로 옮긴 뒤 정확히 복귀한다", () => {
    expect(introAngle(0)).toBe(0);
    expect(introAngle(480)).toBe(150);
    expect(introAngle(540)).toBe(150);
    expect(introAngle(INTRO_DURATION)).toBe(0);
    expect(introAngle(10000)).toBe(0);
    const angle = (introAngle(480) * Math.PI) / 180;
    const x = 60.2 - 50;
    const y = 81.26 - 50;
    expect(50 + x * Math.cos(angle) - y * Math.sin(angle)).toBeCloseTo(
      25.54,
      1,
    );
    expect(50 + x * Math.sin(angle) + y * Math.cos(angle)).toBeCloseTo(
      28.03,
      1,
    );
    for (let t = 0; t <= INTRO_DURATION; t += 10) {
      expect(introAngle(t)).toBeGreaterThanOrEqual(0);
      expect(introAngle(t)).toBeLessThanOrEqual(150);
    }
  });
});
