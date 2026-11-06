import { localAccountActivity } from "./local-activity";
import { store as communityStore } from "../../../features/community/store";
import {
  localTestProfile,
  localTestDatabase,
} from "../../../lib/auth/local-test";
import { redirect } from "next/navigation";
import { authConfig } from "../../../lib/auth/config";
import { authClient } from "../../../lib/auth/server";
import {
  addPosts,
  memberProfile,
  type PostRow,
} from "../../(creator)/_server/posts";
import type { Database } from "../../(creator)/_lib/types";
import { accountServerTime } from "./server-time";
import { MyPage } from "./my-page";
export const metadata = { title: "마이페이지 · BUYORNOT" };
export default async function AccountPage() {
  const local = await localTestProfile();
  if (local) {
    const db = localTestDatabase();
    const activity = localAccountActivity(local);
    return (
      <MyPage
        activity={activity}
        key={local.id}
        nickname={local.nickname}
        accountRole={local.role}
        email={null}
        provider="로컬 테스트"
        joined="2026-11-06T00:00:00Z"
        creatorRooms={db.creators.map((room) => ({
          ...room,
          nickname:
            db.profiles.find((p) => p.id === room.ownerId)?.nickname ??
            room.title,
          avatar: db.profiles.find((p) => p.id === room.ownerId)?.avatar ?? "",
          fictional: room.id.startsWith("fictional-"),
        }))}
        communityPosts={communityStore
          .list(local)
          .filter((post) => post.authorId === local.id)}
        participatedPosts={communityStore
          .list(local)
          .filter((post) => !!post.myVote)}
        initialFollowing={db.creators
          .filter((room) => db.follows[room.id]?.includes(local.id))
          .map((room) => room.id)}
        initialPosts={db.requests.filter((p) => p.authorId === local.id)}
        loadError={false}
        now={accountServerTime()}
      />
    );
  }
  if (!authConfig()) redirect("/login");
  const client = await authClient();
  const {
    data: { user },
    error: authError,
  } = await client.auth.getUser();
  if (authError || !user) redirect("/login");
  const profile = memberProfile(user);
  const { data, error } = await client
    .from("curation_posts")
    .select("*")
    .eq("author_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1000);
  const db: Database = {
    profiles: [],
    creators: [],
    requests: [],
    evaluations: [],
    applications: [],
    hearts: {},
    follows: {},
  };
  if (!error) addPosts(db, (data ?? []) as PostRow[]);
  const provider = user.app_metadata.provider === "kakao" ? "카카오" : "이메일";
  return (
    <MyPage
      key={user.id}
      nickname={profile.nickname}
      accountRole={profile.role === "CREATOR" ? "CREATOR" : "USER"}
      email={user.email ?? null}
      provider={provider}
      joined={user.created_at}
      communityPosts={communityStore
        .list(profile)
        .filter((post) => post.authorId === profile.id)}
      participatedPosts={communityStore
        .list(profile)
        .filter((post) => !!post.myVote)}
      initialPosts={db.requests}
      loadError={!!error}
      now={accountServerTime()}
    />
  );
}
