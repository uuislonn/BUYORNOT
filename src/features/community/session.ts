import { currentUser } from "../../lib/auth/server";
import { localTestProfile } from "../../lib/auth/local-test";
import { memberProfile } from "../../app/(creator)/_server/posts";
import type { Viewer } from "./types";
export async function communityViewer(): Promise<Viewer | null> {
  const local = await localTestProfile();
  if (local) return { id: local.id, nickname: local.nickname };
  const user = await currentUser();
  if (user) {
    const profile = memberProfile(user);
    return { id: profile.id, nickname: profile.nickname };
  }
  return null;
}
