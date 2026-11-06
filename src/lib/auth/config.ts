export function authConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  return url && key ? { url, key } : null;
}
export function passwordError(password: string): string | null {
  return password.length >= 10 &&
    password.length <= 128 &&
    /[a-zA-Z]/.test(password) &&
    /[0-9]/.test(password)
    ? null
    : "비밀번호는 영문과 숫자를 포함한 10~128자로 입력해 주세요.";
}
export function authError(code?: string): string {
  if (code === "invalid_credentials")
    return "이메일 또는 비밀번호를 확인해 주세요.";
  if (code === "email_not_confirmed")
    return "이메일의 인증 링크를 먼저 눌러 주세요.";
  if (
    code === "over_email_send_rate_limit" ||
    code === "over_request_rate_limit"
  )
    return "요청이 많아요. 잠시 후 다시 시도해 주세요.";
  if (code === "email_address_not_authorized")
    return "현재 인증 메일 발송 설정 중입니다. 가입 가능한 이메일은 관리자에게 문의해 주세요.";
  if (code === "weak_password") return "더 안전한 비밀번호를 입력해 주세요.";
  if (code === "same_password")
    return "현재 비밀번호와 다른 비밀번호를 입력해 주세요.";
  return "요청을 완료하지 못했어요. 입력 내용을 확인하거나 잠시 후 다시 시도해 주세요.";
}

export function kakaoConfigured() {
  return (
    !!authConfig() && process.env.NEXT_PUBLIC_KAKAO_AUTH_ENABLED === "true"
  );
}
