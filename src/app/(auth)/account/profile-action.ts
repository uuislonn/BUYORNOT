"use server";
import { localTestProfile } from "../../../lib/auth/local-test";
import { revalidatePath } from "next/cache";
import { authClient } from "../../../lib/auth/server";
export async function updateNickname(value: string) {
  if (
    typeof value !== "string" ||
    value.trim().length < 2 ||
    value.trim().length > 20
  )
    return { ok: false as const, message: "닉네임은 2~20자로 입력해 주세요." };
  if (await localTestProfile())
    return {
      ok: false as const,
      message: "이 계정의 이름은 변경할 수 없어요.",
    };
  try {
    const client = await authClient();
    const { data, error } = await client.auth.getUser();
    if (error || !data.user)
      return { ok: false as const, message: "다시 로그인해 주세요." };
    const result = await client.auth.updateUser({
      data: { nickname: value.trim() },
    });
    if (result.error)
      return {
        ok: false as const,
        message: "닉네임을 저장하지 못했어요. 잠시 후 다시 시도해 주세요.",
      };
    revalidatePath("/account");
    return {
      ok: true as const,
      nickname: value.trim(),
      message: "닉네임을 변경했어요. 이전 글에는 작성 당시 이름이 유지됩니다.",
    };
  } catch {
    return {
      ok: false as const,
      message: "연결하지 못했어요. 다시 시도해 주세요.",
    };
  }
}
