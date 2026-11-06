import { localTestSession } from "../../../lib/auth/local-test";
import { authClient } from "../../../lib/auth/server";
import { memberProfile, readPostDatabase } from "./posts";
import { authConfig } from "../../../lib/auth/config";
import { currentUser } from "../../../lib/auth/server";
import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import type { Database, DemoIdentity } from "../_lib/types";
import { createSeed, CATALOG_VERSION, refreshSeedCatalog } from "./seed";
import { ServiceError, snapshot } from "./service";
import type { Snapshot } from "../_lib/types";
type Session = {
  catalogVersion?: string;
  db: Database;
  actorId: string | null;
  expires: number;
  verificationCode: string;
};
const root = globalThis as typeof globalThis & {
  creatorDemoSessions?: Map<string, Session>;
};
const sessions: Map<string, Session> = (root.creatorDemoSessions ??= new Map<
  string,
  Session
>());
const COOKIE = "buyornot-creator-demo";
export function demoEnabled(): boolean {
  return (
    !authConfig() &&
    (process.env.NODE_ENV !== "production" ||
      process.env.CREATOR_DEMO_ENABLED === "true")
  );
}
export async function readSession(): Promise<Session | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  const session = token ? sessions.get(token) : undefined;
  if (!session || session.expires < Date.now()) {
    if (token) sessions.delete(token);
    return null;
  }
  // Refresh the original demo identity without discarding posts, hearts or decisions.
  const seed = createSeed();
  const room = session.db.creators.find((creator) => creator.id === "seoa");
  const owner = session.db.profiles.find((profile) => profile.id === "creator");
  if (room && ["seoa.archive", "i0cc0i"].includes(room.handle)) {
    Object.assign(room, seed.creators[0]);
    if (owner) Object.assign(owner, seed.profiles[0]);
  }
  if (session.catalogVersion !== CATALOG_VERSION) {
    const previousCount =
      session.catalogVersion === "soal-womens-2026-10-27" ? 18 : 7;
    refreshSeedCatalog(session.db, Date.now(), previousCount);
    session.catalogVersion = CATALOG_VERSION;
  }
  return session;
}
export async function requireSession(): Promise<Session> {
  const local = await localTestSession();
  if (local) return local;
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
      catalogVersion: CATALOG_VERSION,
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
  const local = await localTestSession();
  if (local)
    return {
      ...snapshot(local.db, local.actorId, creatorId, false),
      postsEnabled: true,
      localTest: true,
    };
  if (authConfig()) {
    const client = await authClient();
    const db = await readPostDatabase(creatorId, client);
    const user = await currentUser();
    if (user) {
      db.profiles = db.profiles.filter((p) => p.id !== user.id);
      db.profiles.push(memberProfile(user));
    }
    return {
      ...snapshot(db, user?.id ?? null, creatorId, false),
      postsEnabled: true,
    };
  }
  const session = await readSession();
  return snapshot(
    session?.db ?? publicDatabase(),
    session?.actorId ?? null,
    creatorId,
    demoEnabled(),
  );
}
