"use server";
import {
  loginLocalTest,
  logoutLocalTest,
  localTestEnabled,
  localTestProfile,
} from "../../lib/auth/local-test";
import { headers, cookies } from "next/headers";
import { redirect } from "next/navigation";
import { authClient, currentUser } from "../../lib/auth/server";
import {
  authConfig,
  passwordError,
  authError,
  kakaoConfigured,
} from "../../lib/auth/config";
export type AuthResult = { message: string; ok?: boolean };
async function callback(reset = false) {
  // Use a configured canonical origin in production, never an arbitrary forwarded host.
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  const origin =
    configured ||
    (process.env.NODE_ENV === "production"
      ? ""
      : (await headers()).get("origin"));
  if (!origin) throw new Error("SITE_URL_REQUIRED");
  const url = new URL("/auth/callback", origin);
  if (reset) url.searchParams.set("flow", "recovery");
  return url.toString();
}
export async function submitAuth(
  mode: string,
  form: FormData,
): Promise<AuthResult> {
  if (
    mode === "login" &&
    (await loginLocalTest(
      String(form.get("email") || "").trim(),
      String(form.get("password") || ""),
    ))
  )
    redirect("/account");
  if (
    mode === "login" &&
    localTestEnabled() &&
    !String(form.get("email") || "").includes("@")
  )
    return { message: "아이디 또는 비밀번호를 확인해 주세요." };
  if (!authConfig())
    return {
      message: "로그인 서비스 연결 설정이 필요해요. 관리자에게 문의해 주세요.",
    };
  const email = String(form.get("email") || "")
    .trim()
    .toLowerCase();
  const password = String(form.get("password") || "");
  if (!["login", "signup", "reset", "update"].includes(mode))
    return { message: "잘못된 요청입니다." };
  if (
    mode !== "update" &&
    (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254)
  )
    return { message: "이메일 주소를 확인해 주세요." };
  if ((mode === "signup" || mode === "update") && passwordError(password))
    return { message: passwordError(password)! };
  if (mode === "login" && (!password || password.length > 128))
    return { message: "비밀번호를 확인해 주세요." };
  if (
    (mode === "signup" || mode === "update") &&
    password !== form.get("confirm")
  )
    return { message: "비밀번호가 일치하지 않아요." };
  const nickname = String(form.get("nickname") || "").trim();
  if (mode === "signup" && (nickname.length < 2 || nickname.length > 20))
    return { message: "닉네임은 2~20자로 입력해 주세요." };
  let success = false;
  try {
    const client = await authClient();
    if (mode === "signup") {
      const { error, data } = await client.auth.signUp({
        email,
        password,
        options: { data: { nickname }, emailRedirectTo: await callback() },
      });
      if (error) return { message: authError(error.code) };
      if (!data.session)
        return {
          ok: true,
          message:
            "가입 가능한 이메일이라면 인증 메일을 보냈어요. 메일의 링크를 누른 뒤 로그인해 주세요. 스팸함도 확인해 주세요.",
        };
      success = true;
    } else if (mode === "reset") {
      const { error } = await client.auth.resetPasswordForEmail(email, {
        redirectTo: await callback(true),
      });
      if (error) return { message: authError(error.code) };
      return {
        ok: true,
        message:
          "가입된 이메일이라면 재설정 링크를 보냈어요. 메일을 요청한 브라우저에서 링크를 열어 주세요.",
      };
    } else if (mode === "update") {
      if (!(await currentUser()))
        return {
          message: "재설정 링크가 만료되었어요. 이메일을 다시 요청해 주세요.",
        };
      const { error } = await client.auth.updateUser({ password });
      if (error) return { message: authError(error.code) };
      return {
        ok: true,
        message:
          "비밀번호를 변경했어요. 이제 새 비밀번호로 로그인할 수 있습니다.",
      };
    } else {
      const { error } = await client.auth.signInWithPassword({
        email,
        password,
      });
      if (error) return { message: authError(error.code) };
      success = true;
    }
  } catch {
    return {
      message: "인증 서비스에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.",
    };
  }
  if (success) {
    (await cookies()).delete("buyornot-creator-demo");
    redirect("/account");
  }
  return { message: "다시 시도해 주세요." };
}
export async function kakaoLogin(): Promise<AuthResult> {
  if (!kakaoConfigured())
    return { message: "카카오 로그인 서비스 연결 설정이 필요해요." };
  let destination: string | undefined;
  try {
    const client = await authClient();
    const { data, error } = await client.auth.signInWithOAuth({
      provider: "kakao",
      options: {
        redirectTo: await callback(),
        queryParams: { scope: "profile_nickname" },
      },
    });
    if (error)
      return {
        message:
          "카카오 로그인 설정을 확인해 주세요. 잠시 후 다시 시도해 주세요.",
      };
    destination = data.url;
  } catch {
    return { message: "카카오 로그인에 연결하지 못했어요." };
  }
  if (destination) redirect(destination);
  return { message: "카카오 로그인에 연결하지 못했어요." };
}
export async function logout(): Promise<AuthResult> {
  if (await localTestProfile()) {
    await logoutLocalTest();
    redirect("/login");
  }
  if (authConfig()) {
    try {
      const client = await authClient();
      const { error } = await client.auth.signOut();
      if (error)
        return { message: "로그아웃하지 못했어요. 다시 시도해 주세요." };
    } catch {
      return { message: "로그아웃하지 못했어요. 다시 시도해 주세요." };
    }
  }
  await logoutLocalTest();
  (await cookies()).delete("buyornot-creator-demo");
  redirect("/login");
}
