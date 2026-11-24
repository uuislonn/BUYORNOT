import { randomBytes, scryptSync } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const directory = new URL(".local-test-accounts/", root);
const configPath = new URL("local-logins.json", directory);
const passwordsPath = new URL("local-passwords.json", directory);
const envPath = new URL(".env.local", root);
await mkdir(directory, { recursive: true, mode: 0o700 });

const accounts = [
  { id: "dlfqksghldnjs1234", nickname: "일반회원 테스트", role: "USER" },
  { id: "zmfldpdlxj1234", nickname: "소올soal", role: "CREATOR" },
];
const passwords = Object.fromEntries(
  accounts.map(({ id }) => [id, randomBytes(18).toString("base64url")]),
);
const config = {
  secret: randomBytes(32).toString("hex"),
  accounts: accounts.map((account) => {
    const salt = randomBytes(16).toString("hex");
    const hash = scryptSync(passwords[account.id], salt, 64).toString("hex");
    return { ...account, salt, hash };
  }),
};

const exists = await readFile(configPath).then(
  () => true,
  (error) => {
    if (error.code !== "ENOENT") throw error;
    return false;
  },
);
if (exists) {
  console.log("기존 로컬 로그인 파일을 유지했습니다.");
} else {
  await writeFile(passwordsPath, JSON.stringify(passwords, null, 2) + "\n", {
    mode: 0o600,
    flag: "wx",
  });
  try {
    await writeFile(configPath, JSON.stringify(config, null, 2) + "\n", {
      mode: 0o600,
      flag: "wx",
    });
  } catch (error) {
    await rm(passwordsPath);
    throw error;
  }
  console.log(
    "이 컴퓨터의 새 로그인 비밀번호는 .local-test-accounts/local-passwords.json에 저장했습니다.",
  );
}

const env = await readFile(envPath, "utf8").catch((error) => {
  if (error.code !== "ENOENT") throw error;
  return "";
});
if (!/^\s*BUYORNOT_LOCAL_TEST_LOGIN\s*=\s*true\s*$/m.test(env)) {
  const updated = env
    .replace(/^\s*BUYORNOT_LOCAL_TEST_LOGIN\s*=.*$/gm, "")
    .trimEnd();
  await writeFile(
    envPath,
    `${updated ? updated + "\n" : ""}BUYORNOT_LOCAL_TEST_LOGIN=true\n`,
    { mode: 0o600 },
  );
}
