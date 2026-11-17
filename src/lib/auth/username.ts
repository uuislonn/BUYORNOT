export type UsernameResult = {
  status: "available" | "duplicate" | "error";
  message: string;
};

export function usernameError(value: string): string | null {
  return !/^[a-zA-Z0-9_]{2,15}$/.test(value.trim())
    ? "아이디는 영문·숫자·밑줄 2~15자로 입력해 주세요."
    : null;
}
