import { currentUser } from "../../../lib/auth/server";
import { localTestSession } from "../../../lib/auth/local-test";
import { SOPHY_LINKED_ITEMS } from "../_content/sophy-products";
import { directoryDatabase, addDirectoryRooms } from "../_server/directory";
import { readSession } from "../_server/runtime";
import { CreatorDirectory } from "../_components/creator-directory";
export const metadata = { title: "큐레이션 룸 둘러보기 · BUYORNOT" };
export default async function CreatorsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const local = await localTestSession();
  const user = local ? null : await currentUser();
  const demo = local || user ? null : await readSession();
  const session = local ?? demo;
  const actorId = session?.actorId ?? user?.id;
  const db = session ? addDirectoryRooms(session.db) : directoryDatabase();
  const viewer = db.profiles.find((profile) => profile.id === actorId);
  const ownsRoom = db.creators.some((room) => room.ownerId === actorId);
  const canApply =
    !!actorId &&
    !ownsRoom &&
    (viewer?.role ?? user?.app_metadata.buyornot_role ?? "USER") === "USER";
  return (
    <CreatorDirectory
      key={q}
      initialSearch={q}
      signedIn={!!actorId}
      applicationRoomId={canApply ? db.creators[0]?.id : undefined}
      application={
        canApply
          ? db.applications.findLast(
              (application) => application.userId === actorId,
            )
          : undefined
      }
      accountName={
        db.profiles.find((profile) => profile.id === actorId)?.nickname
      }
      accountAvatar={
        db.profiles.find((profile) => profile.id === actorId)?.avatar
      }
      rooms={db.creators.map((room) => ({
        id: room.id,
        searchTerms: db.requests
          .filter((post) => post.creatorId === room.id)
          .map((post) => `${post.product.name} ${post.product.brand}`)
          .join(" "),
        title: room.title,
        bio: room.bio,
        topics: room.topics ?? [],
        cover: room.cover,
        nickname:
          db.profiles.find((profile) => profile.id === room.ownerId)
            ?.nickname ?? room.title,
        avatar:
          db.profiles.find((profile) => profile.id === room.ownerId)?.avatar ??
          "",
        following: !!actorId && !!db.follows[room.id]?.includes(actorId),
        mine: room.ownerId === actorId,
        categories: [
          ...new Set(
            room.id === "sophy"
              ? SOPHY_LINKED_ITEMS.map((item) => item.sale.product.category)
              : db.requests
                  .filter((post) => post.creatorId === room.id)
                  .map((post) => post.product.category),
          ),
        ],
      }))}
    />
  );
}
