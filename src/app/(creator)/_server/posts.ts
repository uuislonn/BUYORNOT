import type { User } from "@supabase/supabase-js";
import { authClient } from "../../../lib/auth/server";
import type {
  BodySpec,
  CurationRequest,
  Database,
  Product,
  Profile,
  RequestInput,
} from "../_lib/types";
import { createSeed } from "./seed";
import * as service from "./service";
export type PostRow = {
  id: string;
  author_id: string;
  author_name: string;
  creator_id: string;
  product: Product;
  concern: string;
  tags: string[];
  body_spec: BodySpec;
  status: "ING";
  created_at: string;
  updated_at: string;
};
export function memberProfile(
  user: Pick<User, "id" | "user_metadata"> &
    Partial<Pick<User, "app_metadata">>,
): Profile {
  const metadata = user.user_metadata;
  const name = [
    metadata.nickname,
    metadata.full_name,
    metadata.name,
    metadata.user_name,
  ].find((v) => typeof v === "string" && v.trim());
  return {
    id: user.id,
    nickname: typeof name === "string" ? name.trim().slice(0, 20) : "회원",
    // Only Auth administrator metadata can designate a creator.
    role: user.app_metadata?.buyornot_role === "CREATOR" ? "CREATOR" : "USER",
    avatar: "",
    verified: false,
  };
}
function databaseError(code?: string): never {
  if (code === "23505")
    throw new service.ServiceError(
      "DUPLICATE",
      "같은 상품의 고민을 이미 등록했어요.",
    );
  if (code === "42501")
    throw new service.ServiceError(
      "FORBIDDEN",
      "본인이 작성한 글만 변경할 수 있어요.",
    );
  throw new service.ServiceError(
    "STORAGE",
    "글 저장소에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.",
  );
}
export function addPosts(db: Database, rows: PostRow[]) {
  for (const row of rows) {
    db.requests.push({
      id: row.id,
      authorId: row.author_id,
      creatorId: row.creator_id,
      product: row.product,
      concern: row.concern,
      tags: row.tags,
      bodySpec: row.body_spec,
      status: row.status,
      createdAt: new Date(row.created_at).toISOString(),
      // Keep Postgres microseconds intact for optimistic concurrency checks.
      updatedAt: row.updated_at,
    });
    if (!db.profiles.some((p) => p.id === row.author_id))
      db.profiles.push({
        id: row.author_id,
        nickname: row.author_name,
        role: "USER",
        avatar: "",
        verified: false,
      });
  }
}
export async function readPostDatabase(
  creatorId: string,
  client: Awaited<ReturnType<typeof authClient>>,
) {
  const db = createSeed();
  // Validate the room before any database request.
  service.snapshot(db, null, creatorId, false);
  const { data, error } = await client
    .from("curation_posts")
    .select("*")
    .eq("creator_id", creatorId)
    .order("created_at", { ascending: false })
    .limit(1000);
  if (error) databaseError(error.code);
  addPosts(db, (data ?? []) as PostRow[]);
  return db;
}
export async function requirePostContext(creatorId: string) {
  const client = await authClient();
  const { data, error } = await client.auth.getUser();
  if (error || !data.user)
    throw new service.ServiceError(
      "UNAUTHENTICATED",
      "로그인 후 글을 작성해 주세요.",
    );
  const profile = memberProfile(data.user);
  const db = await readPostDatabase(creatorId, client);
  db.profiles = db.profiles.filter((p) => p.id !== profile.id);
  db.profiles.push(profile);
  return { client, db, profile, actorId: profile.id };
}
function payload(item: CurationRequest) {
  return {
    product: item.product,
    concern: item.concern,
    tags: item.tags,
    body_spec: item.bodySpec,
  };
}
export async function savePost(
  kind: "create" | "update" | "delete",
  creatorId: string,
  input?: RequestInput,
  id?: string,
) {
  const { client, db, actorId, profile } = await requirePostContext(creatorId);
  if (kind === "create") {
    const nextId = service.createRequest(db, actorId, input!);
    const item = db.requests.find((r) => r.id === nextId)!;
    const { error } = await client.from("curation_posts").insert({
      ...payload(item),
      author_id: actorId,
      author_name: profile.nickname,
      creator_id: creatorId,
    });
    if (error) databaseError(error.code);
  } else {
    const previous = db.requests.find(
      (r) => r.id === id && r.creatorId === creatorId,
    );
    if (!previous)
      throw new service.ServiceError("NOT_FOUND", "글을 찾을 수 없어요.");
    if (kind === "update") {
      const version = previous.updatedAt;
      service.updateRequest(db, actorId, id!, input!);
      const { data, error } = await client
        .from("curation_posts")
        .update(payload(previous))
        .eq("id", id!)
        .eq("author_id", actorId)
        .eq("updated_at", version)
        .select("id");
      if (error) databaseError(error.code);
      if (!data?.length)
        throw new service.ServiceError(
          "CONFLICT",
          "글이 변경되었거나 만료됐어요. 새로고침해 주세요.",
        );
    } else {
      service.deleteRequest(db, actorId, id!);
      const { data, error } = await client
        .from("curation_posts")
        .delete()
        .eq("id", id!)
        .eq("author_id", actorId)
        .select("id");
      if (error) databaseError(error.code);
      if (!data?.length)
        throw new service.ServiceError(
          "NOT_FOUND",
          "이미 삭제되었거나 삭제할 수 없는 글이에요.",
        );
    }
  }
}
