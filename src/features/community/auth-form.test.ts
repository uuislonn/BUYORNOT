import { describe, expect, it } from "vitest";
import { validateAuthForm, type AuthFields } from "./auth-form";
const fields: AuthFields = {
  identifier: "user",
  email: "user@example.com",
  password: "password123",
  confirmation: "password123",
};
describe("계정 화면 입력 검증", () => {
  it("아이디 또는 이메일과 비밀번호가 있어야 로그인 요청 가능", () => {
    expect(validateAuthForm("login", { ...fields, identifier: " " })).not.toBe(
      "",
    );
    expect(validateAuthForm("login", { ...fields, password: "" })).not.toBe("");
    expect(validateAuthForm("login", fields)).toBe("");
  });
  it("가입 시 이메일, 비밀번호 길이와 확인 값 검사", () => {
    expect(
      validateAuthForm("signup", { ...fields, email: "invalid" }),
    ).not.toBe("");
    expect(
      validateAuthForm("signup", { ...fields, password: "short" }),
    ).not.toBe("");
    expect(
      validateAuthForm("signup", { ...fields, confirmation: "different" }),
    ).not.toBe("");
    expect(validateAuthForm("signup", fields)).toBe("");
  });
  it.each(["find-id", "reset-password"] as const)(
    "%s는 올바른 이메일만 허용",
    (mode) => {
      expect(validateAuthForm(mode, { ...fields, email: "" })).not.toBe("");
      expect(validateAuthForm(mode, { ...fields, email: "x@" })).not.toBe("");
      expect(validateAuthForm(mode, { ...fields, password: "" })).toBe("");
    },
  );
});
