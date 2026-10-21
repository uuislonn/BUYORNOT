import { notFound } from "next/navigation";
import { readRoomSnapshot } from "../../_server/runtime";
import { ServiceError } from "../../_server/service";
import { CreatorWorkspace } from "../../_components/workspace";
export const metadata = {
  title: "크리에이터 룸 · BUY OR NOT",
  description: "취향을 나누고, 더 나은 선택을 함께. 크리에이터 큐레이션 룸",
};
export default async function CreatorRoomPage({
  params,
}: {
  params: Promise<{ creatorId: string }>;
}) {
  const { creatorId } = await params;
  let initial;
  try {
    initial = await readRoomSnapshot(creatorId);
  } catch (error) {
    if (error instanceof ServiceError && error.code === "NOT_FOUND") notFound();
    throw error;
  }
  return <CreatorWorkspace initial={initial} />;
}
