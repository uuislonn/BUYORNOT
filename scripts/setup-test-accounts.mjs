// Run locally only. Never import this administrator tool into the web app.
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
try {
  process.loadEnvFile(fileURLToPath(new URL(".env.local", root)));
} catch {}
const project = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key =
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!project || !key) {
  console.error(
    "설정 필요: .env.local에 서버 전용 SUPABASE_SECRET_KEY를 추가해 주세요. 키는 채팅이나 Git에 넣지 마세요.",
  );
  process.exit(1);
}
if (new URL(project).hostname !== "pkificlqlouynhsimjjk.supabase.co") {
  throw new Error(
    "대상 프로젝트가 BUYORNOT 프로젝트와 다릅니다. 작업을 중단합니다.",
  );
}
const admin = createClient(project, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const output = new URL(".local-test-accounts/credentials.json", root);
const specs = [
  {
    email: "member.test@buyornot.example.com",
    nickname: "일반회원 테스트",
    role: "USER",
  },
  {
    email: "creator.test@buyornot.example.com",
    nickname: "크리에이터 테스트",
    role: "CREATOR",
  },
];
let saved = [];
try {
  saved = JSON.parse(await readFile(output, "utf8"));
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
// Paginate so existing accounts are never accidentally recreated or reset.
const existing = [];
for (let page = 1; ; page++) {
  const { data, error } = await admin.auth.admin.listUsers({
    page,
    perPage: 100,
  });
  if (error) throw new Error(`계정 조회 실패 (${error.status ?? "unknown"})`);
  existing.push(...data.users);
  if (data.users.length < 100) break;
}
await mkdir(new URL(".local-test-accounts/", root), {
  recursive: true,
  mode: 0o700,
});
for (const spec of specs) {
  const previous = existing.find((user) => user.email === spec.email);
  if (previous) {
    if (
      previous.app_metadata?.buyornot_test !== true ||
      previous.app_metadata?.buyornot_role !== spec.role
    ) {
      throw new Error(
        "동일한 주소의 다른 계정이 존재합니다. 변경 없이 중단합니다.",
      );
    }
    console.log(`${spec.nickname}: 기존 계정 유지`);
    continue;
  }
  const password = `Bon!${randomBytes(24).toString("base64url")}`;
  // Persist privately before the request, allowing recovery if the process exits after creation.
  saved = saved.filter((record) => record.email !== spec.email);
  saved.push({ ...spec, password });
  await writeFile(output, JSON.stringify(saved, null, 2) + "\n", {
    mode: 0o600,
  });
  const { data, error } = await admin.auth.admin.createUser({
    email: spec.email,
    password,
    email_confirm: true,
    user_metadata: { nickname: spec.nickname },
    app_metadata: { buyornot_test: true, buyornot_role: spec.role },
  });
  if (error || !data.user)
    throw new Error(`테스트 계정 생성 실패 (${error?.status ?? "unknown"})`);
  // Verify email/password login using a separate client, without persisting tokens.
  const check = createClient(
    project,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const login = await check.auth.signInWithPassword({
    email: spec.email,
    password,
  });
  if (login.error || login.data.user?.id !== data.user.id)
    throw new Error("계정 생성 후 로그인 검증 실패");
  await check.auth.signOut();
  console.log(`${spec.nickname}: 생성 및 로그인 확인 완료`);
}
if (process.argv.includes("--cleanup-jihye")) {
  const marker =
    "[기능 확인용] 실제 계정 글 등록·새로고침 후 유지·본인 수정까지 확인한 테스트 글입니다.";
  const { data: rows, error } = await admin
    .from("curation_posts")
    .select("id,author_id")
    .eq("author_name", "지혜")
    .eq("concern", marker)
    .eq("creator_id", "seoa");
  if (error) throw new Error("지혜 테스트 글 조회 실패");
  if (rows.length > 1)
    throw new Error("대상이 여러 개입니다. 자동 삭제하지 않습니다.");
  for (const row of rows) {
    const result = await admin
      .from("curation_posts")
      .delete()
      .eq("id", row.id)
      .eq("author_id", row.author_id)
      .eq("concern", marker)
      .select("id");
    if (result.error || result.data.length !== 1)
      throw new Error("테스트 글 삭제 실패");
    console.log("지혜 계정의 확인용 테스트 글 1개 삭제 완료 (계정은 유지)");
  }
  if (!rows.length)
    console.log("확인용 테스트 글이 없습니다. 다른 글은 삭제하지 않았습니다.");
}
console.log(
  "로그인 정보는 Git에서 제외된 .local-test-accounts/credentials.json에 저장했습니다.",
);
