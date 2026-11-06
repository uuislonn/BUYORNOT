import type { Application, CurationRequest, Status } from "./types";
export const REQUEST_TTL = 30 * 24 * 60 * 60 * 1000;
export function effectiveStatus(
  request: CurationRequest,
  now = Date.now(),
): Status {
  return request.status === "ING" &&
    now - new Date(request.createdAt).getTime() >= REQUEST_TTL
    ? "EXPIRED"
    : request.status;
}
export function daysRemaining(
  request: CurationRequest,
  now = Date.now(),
): number {
  return Math.max(
    0,
    Math.ceil(
      (new Date(request.createdAt).getTime() + REQUEST_TTL - now) / 86400000,
    ),
  );
}
export function meetsFastTrack(
  application: Pick<Application, "followers" | "contentCount">,
): boolean {
  return application.followers >= 500 && application.contentCount >= 10;
}
