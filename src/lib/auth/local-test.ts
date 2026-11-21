import {
  readFileSync,
  writeFileSync,
  renameSync,
  existsSync,
  statSync,
} from "node:fs";
import { join } from "node:path";
import { cookies, headers } from "next/headers";
import type { Database, Profile } from "../../app/(creator)/_lib/types";
import { createSeed } from "../../app/(creator)/_server/seed";
import {
  checkPassword,
  sessionToken,
  sessionIdentity,
} from "./local-test-crypto";
const COOKIE = "buyornot-local-test";
const folder = () => join(process.cwd(), ".local-test-accounts");
type Account = {
  id: string;
  nickname: string;
  role: Profile["role"];
  salt: string;
  hash: string;
};
type Config = { secret: string; accounts: Account[] };
export function localTestEnabled() {
  return (
    process.env.NODE_ENV === "development" &&
    process.env.BUYORNOT_LOCAL_TEST_LOGIN === "true" &&
    existsSync(join(folder(), "local-logins.json"))
  );
}
function config(): Config {
  if (!localTestEnabled()) throw new Error("LOCAL_TEST_DISABLED");
  return JSON.parse(readFileSync(join(folder(), "local-logins.json"), "utf8"));
}
async function localHost() {
  const host = (await headers()).get("host") ?? "";
  return /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host);
}
export async function localTestProfile(): Promise<Profile | null> {
  if (!localTestEnabled() || !(await localHost())) return null;
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const cfg = config();
  const id = sessionIdentity(token, cfg.secret, Date.now());
  const account = cfg.accounts.find((a) => a.id === id);
  if (account?.role === "CREATOR")
    return (
      localTestDatabase().profiles.find(
        (profile) => profile.id === account.id,
      ) ?? null
    );
  return account
    ? {
        id: account.id,
        nickname: account.nickname,
        role: account.role,
        avatar: "",
        verified: false,
      }
    : null;
}
const root = globalThis as typeof globalThis & {
  buyornotLocalTestDb?: Database;
  buyornotLocalTestMtime?: number | null;
};
export function localTestDatabase() {
  if (!localTestEnabled()) throw new Error("LOCAL_TEST_DISABLED");
  const path = join(folder(), "activity.json");
  const mtime = existsSync(path) ? statSync(path).mtimeMs : null;
  if (!root.buyornotLocalTestDb || root.buyornotLocalTestMtime !== mtime) {
    const db: Database = existsSync(path)
      ? JSON.parse(readFileSync(path, "utf8"))
      : createSeed();
    const source = createSeed();
    const soal = source.creators.find((room) => room.id === "seoa")!;
    const soalOwner = source.profiles.find(
      (profile) => profile.id === soal.ownerId,
    )!;
    for (const a of config().accounts) {
      const previous = db.profiles.find((profile) => profile.id === a.id);
      db.profiles = db.profiles.filter((p) => p.id !== a.id);
      db.profiles.push({
        id: a.id,
        nickname:
          a.role === "CREATOR"
            ? previous?.nickname && previous.nickname !== "크리에이터 테스트"
              ? previous.nickname
              : soalOwner.nickname
            : a.nickname,
        role: a.role,
        avatar:
          a.role === "CREATOR"
            ? previous?.avatar || soalOwner.avatar
            : (previous?.avatar ?? ""),
        verified: false,
      });
      if (a.role === "CREATOR") {
        const room = db.creators.find((room) => room.id === "seoa");
        if (room) room.ownerId = a.id;
      }
    }
    root.buyornotLocalTestDb = db;
    root.buyornotLocalTestMtime = mtime;
  }
  return root.buyornotLocalTestDb;
}
export function persistLocalTestDatabase() {
  const temporary = join(folder(), "activity.tmp");
  writeFileSync(temporary, JSON.stringify(localTestDatabase()), {
    mode: 0o600,
  });
  renameSync(temporary, join(folder(), "activity.json"));
  root.buyornotLocalTestMtime = statSync(
    join(folder(), "activity.json"),
  ).mtimeMs;
}
export async function localTestSession() {
  const profile = await localTestProfile();
  if (!profile) return null;
  return {
    db: localTestDatabase(),
    actorId: profile.id,
    expires: Date.now() + 6 * 3600000,
    verificationCode: "LOCAL-TEST",
  };
}
const attempts = new Map<string, { count: number; until: number }>();
export async function loginLocalTest(id: string, password: string) {
  if (!localTestEnabled() || !(await localHost())) return false;
  const now = Date.now();
  const old = attempts.get(id);
  if (old && old.until > now && old.count >= 10) return false;
  const cfg = config();
  const account = cfg.accounts.find((a) => a.id === id);
  if (!account || !checkPassword(password, account.salt, account.hash)) {
    if (attempts.size > 200) attempts.clear();
    attempts.set(id, {
      count: old && old.until > now ? old.count + 1 : 1,
      until: now + 60000,
    });
    return false;
  }
  attempts.delete(id);
  (await cookies()).set(
    COOKIE,
    sessionToken(id, cfg.secret, now + 6 * 3600000),
    { httpOnly: true, sameSite: "strict", path: "/", maxAge: 6 * 3600 },
  );
  return true;
}
export async function logoutLocalTest() {
  (await cookies()).delete(COOKIE);
}
