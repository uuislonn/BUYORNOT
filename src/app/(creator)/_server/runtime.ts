import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import type { Database, DemoIdentity } from "../_lib/types";
import { createSeed } from "./seed";
import { ServiceError, snapshot } from "./service";
import type { Snapshot } from "../_lib/types";
type Session = {
  db: Database;
  actorId: string | null;
  expires: number;
  verificationCode: string;
};
const root = globalThis as typeof globalThis & {
  creatorDemoSessions?: Map<string, Session>;
};
const sessions = (root.creatorDemoSessions ??= new Map());
const COOKIE = "buyornot-creator-demo";
export function demoEnabled(): boolean {
  return (
    process.env.NODE_ENV !== "production" ||
    process.env.CREATOR_DEMO_ENABLED === "true"
  );
}
export async function readSession(): Promise<Session | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  const session = token ? sessions.get(token) : undefined;
  if (!session || session.expires < Date.now()) {
    if (token) sessions.delete(token);
    return null;
  }
  return session;
}
export async function requireSession(): Promise<Session> {
  if (!demoEnabled())
    throw new ServiceError(
      "DEMO_DISABLED",
      "공개 배포에서는 데모 참여 기능이 비활성화되어 있어요. 실제 인증·DB 연결이 필요합니다.",
    );
  const session = await readSession();
  if (!session?.actorId)
    throw new ServiceError("UNAUTHENTICATED", "로그인이 필요한 서비스입니다.");
  return session;
}
export async function switchIdentity(identity: DemoIdentity): Promise<void> {
  if (!demoEnabled())
    throw new ServiceError(
      "DEMO_DISABLED",
      "데모 역할 전환은 개발 환경에서만 사용할 수 있어요.",
    );
  if (!["guest", "member", "creator", "admin"].includes(identity))
    throw new ServiceError("VALIDATION", "역할을 확인해 주세요.");
  for (const [token, session] of sessions)
    if (session.expires < Date.now()) sessions.delete(token);
  let session = await readSession();
  if (!session) {
    if (sessions.size >= 500)
      throw new ServiceError(
        "CAPACITY",
        "데모 세션이 가득 찼어요. 잠시 후 다시 시도해 주세요.",
      );
    session = {
      db: createSeed(),
      actorId: null,
      expires: Date.now() + 6 * 3600000,
      verificationCode: `BON-${randomUUID().slice(0, 8).toUpperCase()}`,
    };
    const token = randomUUID();
    sessions.set(token, session);
    (await cookies()).set(COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 6 * 3600,
    });
  }
  session.actorId = identity === "guest" ? null : identity;
}
// TODO: connect to lib/supabase — replace session mock with verified auth.getUser() + RLS-backed data access.
export function publicDatabase(): Database {
  return createSeed();
}

export async function readRoomSnapshot(creatorId: string): Promise<Snapshot> {
  const session = await readSession();
  return snapshot(
    session?.db ?? publicDatabase(),
    session?.actorId ?? null,
    creatorId,
    demoEnabled(),
  );
}
