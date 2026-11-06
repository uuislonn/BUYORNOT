export type AuthMode = "login" | "signup" | "find-id" | "reset-password";
export interface AuthFields {
  identifier: string;
  email: string;
  password: string;
  confirmation: string;
}
export function validateAuthForm(mode: AuthMode, fields: AuthFields): string {
  if (mode === "login") {
    if (!fields.identifier.trim()) return "아이디 또는 이메일을 입력해 주세요.";
    if (!fields.password) return "비밀번호를 입력해 주세요.";
    return "";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim()))
    return "올바른 이메일을 입력해 주세요.";
  if (mode === "signup") {
    if (fields.password.length < 8) return "비밀번호는 8자 이상 입력해 주세요.";
    if (fields.password !== fields.confirmation)
      return "비밀번호가 일치하지 않습니다.";
  }
  return "";
}
