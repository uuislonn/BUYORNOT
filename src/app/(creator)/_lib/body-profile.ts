import type { BodySpec } from "./types";
export const BODY_FIELDS = [
  { key: "age", label: "나이", min: 14, max: 100, unit: "세" },
  { key: "height_cm", label: "키", min: 100, max: 250, unit: "cm" },
  { key: "weight_kg", label: "몸무게", min: 25, max: 300, unit: "kg" },
] as const;
export function cleanBodyProfile(input: unknown): BodySpec {
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw new Error("신체 정보를 확인해 주세요.");
  const values = input as Record<string, unknown>;
  const result: BodySpec = {};
  for (const field of BODY_FIELDS) {
    const value = values[field.key];
    if (value === undefined || value === "" || value === null) continue;
    if (
      typeof value !== "number" ||
      !Number.isInteger(value) ||
      value < field.min ||
      value > field.max
    )
      throw new Error(`${field.label} 값을 확인해 주세요.`);
    result[field.key] = value;
  }
  for (const key of ["body_type", "personal_color"] as const) {
    const value = values[key];
    if (value === undefined || value === "" || value === null) continue;
    if (typeof value !== "string" || value.trim().length > 30)
      throw new Error("체형과 퍼스널컬러는 30자 이내로 입력해 주세요.");
    if (value.trim()) result[key] = value.trim();
  }
  return result;
}
export function disclosedBodyProfile(
  profile: Record<string, string>,
  shared: readonly string[],
): BodySpec {
  const values: Record<string, unknown> = {};
  for (const key of shared) {
    if (!profile[key]?.trim())
      throw new Error("공개를 선택한 신체 정보 값을 입력해 주세요.");
    values[key] = BODY_FIELDS.some((field) => field.key === key)
      ? Number(profile[key])
      : profile[key];
  }
  return cleanBodyProfile(values);
}
