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

export function compareRoomRequests(
  a: CurationRequest,
  b: CurationRequest,
  sort: "latest" | "oldest" | "views",
  date: "createdAt" | "updatedAt",
): number {
  if (sort === "views") {
    const views = (b.views ?? 0) - (a.views ?? 0);
    if (views) return views;
  }
  return sort === "oldest"
    ? a[date].localeCompare(b[date])
    : b[date].localeCompare(a[date]);
}

export type RoomStatus = Status | "HOLD";

export function roomStatus(
  request: CurationRequest,
  owner: boolean,
): RoomStatus {
  return owner && request.status === "ING" && request.held
    ? "HOLD"
    : request.status;
}
