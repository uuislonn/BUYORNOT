import { localTestEnabled } from "../../../lib/auth/local-test";
import type { Metadata } from "next";
import { LoginForm } from "./login-form";
import { authConfig, kakaoConfigured } from "../../../lib/auth/config";
export const metadata: Metadata = { title: "로그인 · BUYORNOT" };
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  return (
    <LoginForm
      configured={!!authConfig() || localTestEnabled()}
      localTestEnabled={localTestEnabled()}
      kakaoEnabled={kakaoConfigured()}
      initialNotice={
        params.error
          ? "인증 링크가 만료되었거나 유효하지 않아요. 이메일 인증은 요청한 브라우저에서 열고, 필요하면 다시 요청해 주세요."
          : ""
      }
    />
  );
}
