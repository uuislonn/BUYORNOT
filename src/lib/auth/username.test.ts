import { expect, it } from "vitest";
import { usernameError } from "./username";
it("아이디는 영문·숫자·밑줄 2~15자만 허용한다", () => {
  for (const value of ["a", "한글아이디", "user name", "a".repeat(16)])
    expect(usernameError(value)).toBeTruthy();
  expect(usernameError(" Member_1 ")).toBeNull();
  expect(usernameError("ab")).toBeNull();
  expect(usernameError("a".repeat(15))).toBeNull();
});
