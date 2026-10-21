// TODO: connect to lib/supabase — replace in-memory operations with auth-scoped transactions and RLS.
import { randomUUID } from "node:crypto";
import { validateProductUrl } from "../_lib/product-url";
import { effectiveStatus } from "../_lib/policy";
import {
  CATEGORIES,
  type ApplicationInput,
  type BodySpec,
  type Database,
  type Decision,
  type Profile,
  type RequestInput,
  type Snapshot,
} from "../_lib/types";
import { PRODUCT_FIXTURES } from "./seed";
export class ServiceError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
  }
}
function fail(code: string, message: string): never {
  throw new ServiceError(code, message);
}
function user(db: Database, actorId: string | null): Profile {
  const actor = db.profiles.find((p) => p.id === actorId);
  return actor ?? fail("UNAUTHENTICATED", "로그인이 필요한 서비스입니다.");
}
function text(value: unknown, max: number, label: string, min = 1): string {
  if (
    typeof value !== "string" ||
    value.trim().length < min ||
    value.trim().length > max
  )
    fail("VALIDATION", `${label}: ${min}~${max}자로 입력해 주세요.`);
  return (value as string).trim();
}
function integer(
  value: unknown,
  min: number,
  max: number,
  label: string,
): number {
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < min ||
    value > max
  )
    fail("VALIDATION", `${label} 값을 확인해 주세요.`);
  return value as number;
}
export function expireRequests(db: Database, now = Date.now()): void {
  for (const request of db.requests) {
    if (
      effectiveStatus(request, now) === "EXPIRED" &&
      request.status === "ING"
    ) {
      request.status = "EXPIRED";
      request.updatedAt = new Date(now).toISOString();
    }
  }
}
function request(db: Database, id: string) {
  return (
    db.requests.find((r) => r.id === id) ??
    fail("NOT_FOUND", "요청을 찾을 수 없어요. 새로고침해 주세요.")
  );
}
function specs(input: BodySpec): BodySpec {
  if (!input || typeof input !== "object" || Array.isArray(input))
    fail("VALIDATION", "공개할 신체 정보를 확인해 주세요.");
  const result: BodySpec = {};
  if (input.age !== undefined) result.age = integer(input.age, 14, 100, "나이");
  if (input.height_cm !== undefined)
    result.height_cm = integer(input.height_cm, 100, 250, "키");
  if (input.weight_kg !== undefined)
    result.weight_kg = integer(input.weight_kg, 25, 300, "몸무게");
  if (input.body_type !== undefined)
    result.body_type = text(input.body_type, 30, "체형");
  if (input.personal_color !== undefined)
    result.personal_color = text(input.personal_color, 30, "퍼스널컬러");
  return result;
}
function validatedInput(input: RequestInput) {
  const url = validateProductUrl(input.productUrl);
  if (!CATEGORIES.some((c) => c !== "전체" && c === input.category))
    fail("VALIDATION", "카테고리를 선택해 주세요.");
  if (!Array.isArray(input.tags) || input.tags.length > 4)
    fail("VALIDATION", "태그는 최대 4개까지 선택할 수 있어요.");
  return {
    product: {
      url,
      name: text(input.productName, 100, "상품명"),
      brand: text(input.brand, 50, "브랜드"),
      price:
        input.price === null
          ? null
          : integer(input.price, 0, 100000000, "가격"),
      category: input.category,
      currency: "KRW" as const,
      image: PRODUCT_FIXTURES.find((p) => p.url === url)?.image ?? "",
    },
    concern: text(input.concern, 150, "고민"),
    tags: [...new Set(input.tags.map((tag) => text(tag, 16, "태그")))],
    bodySpec: specs(input.bodySpec),
  };
}
export function snapshot(
  db: Database,
  actorId: string | null,
  creatorId: string,
  demoEnabled: boolean,
  now = Date.now(),
): Snapshot {
  expireRequests(db, now);
  const creator =
    db.creators.find((r) => r.id === creatorId) ??
    fail("NOT_FOUND", "크리에이터 룸을 찾을 수 없어요.");
  const owner = db.profiles.find((p) => p.id === creator.ownerId)!;
  const viewer = db.profiles.find((p) => p.id === actorId) ?? null;
  return structuredClone({
    creator,
    owner,
    viewer,
    profiles: db.profiles,
    requests: db.requests.filter((r) => r.creatorId === creatorId),
    evaluations: db.evaluations.filter((e) =>
      db.requests.some(
        (r) => r.creatorId === creatorId && r.id === e.requestId,
      ),
    ),
    applications: viewer?.role === "ADMIN" ? db.applications : [],
    ownApplication:
      db.applications.findLast((a) => a.userId === actorId) ?? null,
    following: !!actorId && (db.follows[creatorId] ?? []).includes(actorId),
    followerCount: (db.follows[creatorId] ?? []).length,
    likedIds: Object.entries(db.hearts)
      .filter(([, users]) => !!actorId && users.includes(actorId))
      .map(([id]) => id),
    demoEnabled,
    serverTime: new Date(now).toISOString(),
  });
}
export function createRequest(
  db: Database,
  actorId: string | null,
  input: RequestInput,
  now = Date.now(),
): string {
  const actor = user(db, actorId);
  expireRequests(db, now);
  if (!db.creators.some((c) => c.id === input.creatorId))
    fail("NOT_FOUND", "룸을 찾을 수 없어요.");
  const values = validatedInput(input);
  if (
    db.requests.some(
      (r) =>
        r.creatorId === input.creatorId &&
        r.product.url === values.product.url &&
        r.status !== "EXPIRED",
    )
  )
    fail("DUPLICATE", "이 룸에 같은 상품의 고민이 이미 있어요.");
  const id = randomUUID();
  db.requests.unshift({
    id,
    creatorId: input.creatorId,
    authorId: actor.id,
    ...values,
    status: "ING",
    createdAt: new Date(now).toISOString(),
    updatedAt: new Date(now).toISOString(),
  });
  return id;
}
export function updateRequest(
  db: Database,
  actorId: string | null,
  id: string,
  input: RequestInput,
  now = Date.now(),
): void {
  const actor = user(db, actorId);
  expireRequests(db, now);
  const item = request(db, id);
  if (item.authorId !== actor.id)
    fail("FORBIDDEN", "본인의 고민만 수정할 수 있어요.");
  if (item.status !== "ING")
    fail("CONFLICT", "판정 완료 또는 만료된 고민은 수정할 수 없어요.");
  const values = validatedInput(input);
  if (
    input.creatorId !== item.creatorId ||
    values.product.url !== item.product.url
  )
    fail("VALIDATION", "수정 시 상품 링크는 변경할 수 없어요.");
  Object.assign(item, values, { updatedAt: new Date(now).toISOString() });
}
export function deleteRequest(
  db: Database,
  actorId: string | null,
  id: string,
): void {
  const actor = user(db, actorId);
  const item = request(db, id);
  if (item.authorId !== actor.id)
    fail("FORBIDDEN", "본인의 고민만 삭제할 수 있어요.");
  db.requests = db.requests.filter((r) => r.id !== id);
  db.evaluations = db.evaluations.filter((e) => e.requestId !== id);
  delete db.hearts[id];
}
export function evaluateRequest(
  db: Database,
  actorId: string | null,
  id: string,
  decision: Decision,
  comment: string,
  now = Date.now(),
): void {
  const actor = user(db, actorId);
  expireRequests(db, now);
  const item = request(db, id);
  const room = db.creators.find((c) => c.id === item.creatorId);
  if (actor.role !== "CREATOR" || room?.ownerId !== actor.id)
    fail("FORBIDDEN", "이 룸의 크리에이터만 판정할 수 있어요.");
  if (item.status !== "ING" || db.evaluations.some((e) => e.requestId === id))
    fail("CONFLICT", "이미 판정되었거나 만료된 고민이에요.");
  if (decision !== "BUY" && decision !== "NOT")
    fail("VALIDATION", "BUY 또는 NOT을 선택해 주세요.");
  const safeComment = text(comment, 150, "한 줄 코멘트", 0);
  const timestamp = new Date(now).toISOString();
  db.evaluations.push({
    id: randomUUID(),
    requestId: id,
    creatorId: actor.id,
    decision,
    comment: safeComment,
    createdAt: timestamp,
  });
  item.status = decision;
  item.updatedAt = timestamp;
}
export function toggleHeart(
  db: Database,
  actorId: string | null,
  id: string,
): void {
  const actor = user(db, actorId);
  request(db, id);
  const values = db.hearts[id] ?? [];
  db.hearts[id] = values.includes(actor.id)
    ? values.filter((v) => v !== actor.id)
    : [...values, actor.id];
}
export function toggleFollow(
  db: Database,
  actorId: string | null,
  creatorId: string,
): void {
  const actor = user(db, actorId);
  if (!db.creators.some((c) => c.id === creatorId))
    fail("NOT_FOUND", "룸을 찾을 수 없어요.");
  const values = db.follows[creatorId] ?? [];
  db.follows[creatorId] = values.includes(actor.id)
    ? values.filter((v) => v !== actor.id)
    : [...values, actor.id];
}
export function submitApplication(
  db: Database,
  actorId: string | null,
  input: ApplicationInput,
  verificationCode: string,
  now = Date.now(),
): string {
  const actor = user(db, actorId);
  if (actor.role !== "USER")
    fail("FORBIDDEN", "일반 회원만 룸 개설을 신청할 수 있어요.");
  if (
    db.applications.some((a) => a.userId === actor.id && a.status === "PENDING")
  )
    fail("CONFLICT", "검토 중인 신청이 있어요.");
  if (
    input.consent !== true ||
    input.verificationCode !== verificationCode ||
    !verificationCode
  )
    fail("VALIDATION", "채널 인증 코드와 동의 여부를 확인해 주세요.");
  const hosts: Record<string, string[]> = {
    Instagram: ["www.instagram.com", "instagram.com"],
    YouTube: ["www.youtube.com", "youtube.com", "youtu.be"],
    TikTok: ["www.tiktok.com", "tiktok.com"],
    Blog: ["blog.naver.com", "tistory.com", "www.tistory.com"],
  };
  let url: URL;
  try {
    url = new URL(input.channelUrl);
  } catch {
    return fail("VALIDATION", "채널 URL을 확인해 주세요.");
  }
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.port ||
    !hosts[input.channelType]?.includes(url.hostname) ||
    url.pathname === "/"
  )
    fail("VALIDATION", "선택한 채널의 프로필 HTTPS URL을 입력해 주세요.");
  const id = randomUUID();
  db.applications.push({
    id,
    userId: actor.id,
    roomTitle: text(input.roomTitle, 40, "룸 이름"),
    bio: text(input.bio, 150, "소개"),
    channelType: input.channelType,
    channelUrl: url.href,
    followers: integer(input.followers, 0, 100000000, "팔로워"),
    contentCount: integer(input.contentCount, 0, 1000000, "게시글 수"),
    verificationCode,
    status: "PENDING",
    rejectReason: "",
    createdAt: new Date(now).toISOString(),
  });
  return id;
}
export function reviewApplication(
  db: Database,
  actorId: string | null,
  id: string,
  approve: boolean,
  reason: string,
  now = Date.now(),
): void {
  const actor = user(db, actorId);
  if (actor.role !== "ADMIN") fail("FORBIDDEN", "관리자만 승인할 수 있어요.");
  if (typeof approve !== "boolean")
    fail("VALIDATION", "승인 여부를 확인해 주세요.");
  const application =
    db.applications.find((a) => a.id === id) ??
    fail("NOT_FOUND", "신청을 찾을 수 없어요.");
  if (application.status !== "PENDING")
    fail("CONFLICT", "이미 검토가 완료된 신청이에요.");
  const rejectReason = approve ? "" : text(reason, 300, "반려 사유");
  const applicant = db.profiles.find((p) => p.id === application.userId)!;
  // Metrics are self-reported. Neither fast track nor an unspecified standard threshold auto-approves.
  if (approve) {
    applicant.role = "CREATOR";
    applicant.verified = true;
    db.creators.push({
      id: `room-${application.id}`,
      ownerId: applicant.id,
      handle: applicant.id,
      title: application.roomTitle,
      bio: application.bio,
      cover: "",
      links: [{ label: application.channelType, url: application.channelUrl }],
    });
  }
  application.status = approve ? "APPROVED" : "REJECTED";
  application.rejectReason = rejectReason;
  void now;
}
