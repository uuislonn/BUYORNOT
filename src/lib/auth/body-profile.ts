"use server";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { authClient } from "./server";
import { localTestProfile } from "./local-test";
import { cleanBodyProfile } from "../../app/(creator)/_lib/body-profile";
import type { BodySpec } from "../../app/(creator)/_lib/types";
type BodyResult =
  | { ok: true; profile: BodySpec; message: string }
  | { ok: false; message: string };
function localFile(id: string) {
  return join(
    process.cwd(),
    ".local-test-accounts",
    `body-${encodeURIComponent(id)}.json`,
  );
}
export async function getBodyProfile(): Promise<BodyResult> {
  try {
    const local = await localTestProfile();
    if (local) {
      const path = localFile(local.id);
      return {
        ok: true,
        profile: existsSync(path)
          ? cleanBodyProfile(JSON.parse(readFileSync(path, "utf8")))
          : {},
        message: "",
      };
    }
    const client = await authClient();
    const { data, error } = await client.auth.getUser();
    if (error || !data.user)
      return { ok: false, message: "로그인 후 이용해 주세요." };
    return {
      ok: true,
      profile: cleanBodyProfile(data.user.user_metadata.body_profile ?? {}),
      message: "",
    };
  } catch {
    return {
      ok: false,
      message:
        "저장한 신체 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.",
    };
  }
}
export async function saveBodyProfile(input: unknown): Promise<BodyResult> {
  let profile: BodySpec;
  try {
    profile = cleanBodyProfile(input);
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "입력 값을 확인해 주세요.",
    };
  }
  try {
    const local = await localTestProfile();
    if (local)
      writeFileSync(localFile(local.id), JSON.stringify(profile), {
        mode: 0o600,
      });
    else {
      const client = await authClient();
      const { data, error } = await client.auth.getUser();
      if (error || !data.user)
        return { ok: false, message: "로그인 후 이용해 주세요." };
      const result = await client.auth.updateUser({
        data: { body_profile: profile },
      });
      if (result.error)
        return { ok: false, message: "신체 정보를 저장하지 못했어요." };
    }
    return {
      ok: true,
      profile,
      message: Object.keys(profile).length
        ? "신체 정보를 비공개로 저장했어요. 게시글에 자동 공개되지 않아요."
        : "저장한 신체 정보를 비웠어요. 기존 게시글의 공개 정보는 그대로예요.",
    };
  } catch {
    return {
      ok: false,
      message: "저장하지 못했어요. 잠시 후 다시 시도해 주세요.",
    };
  }
}
