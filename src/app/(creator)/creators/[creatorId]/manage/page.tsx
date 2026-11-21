import { redirect, notFound } from "next/navigation";
import { readRoomSnapshot } from "../../../_server/runtime";
import { ServiceError } from "../../../_server/service";
import { RoomManager } from "../../../_components/room-manager";
export const metadata = { title: "내 큐레이션 룸 관리 · BUYORNOT" };
export default async function ManageRoomPage({
  params,
}: {
  params: Promise<{ creatorId: string }>;
}) {
  const { creatorId } = await params;
  let data;
  try {
    data = await readRoomSnapshot(creatorId);
  } catch (error) {
    if (error instanceof ServiceError && error.code === "NOT_FOUND") notFound();
    throw error;
  }
  if (!data.viewer) redirect("/login");
  if (data.viewer.role !== "CREATOR" || data.viewer.id !== data.creator.ownerId)
    redirect(`/creators/${creatorId}`);
  return <RoomManager initial={data} />;
}
