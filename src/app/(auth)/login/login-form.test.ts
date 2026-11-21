import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import { LoginForm } from "./login-form";

vi.mock("../actions", () => ({
  submitAuth: vi.fn(),
  kakaoLogin: vi.fn(),
  checkUsername: vi.fn(),
}));

it("인증 설정 전에도 회원가입 정보를 입력할 수 있지만 가입 전송은 비활성화한다", () => {
  const html = renderToStaticMarkup(
    createElement(LoginForm, { mode: "signup", configured: false }),
  );
  expect(html.match(/<fieldset\b[^>]*>/)?.[0]).not.toContain("disabled");
  for (const name of ["nickname", "username", "email", "password", "confirm"]) {
    expect(html).toContain(`name="${name}"`);
  }
  expect(
    html.match(/<button\b[^>]*type="submit"[^>]*disabled[^>]*>/)?.[0],
  ).toContain("disabled");
});
