import { loadCommunity } from "../../features/community/actions";
import { directoryDatabase } from "../(creator)/_server/directory";
import { readRoomSnapshot } from "../(creator)/_server/runtime";
import { SearchResults } from "./search-results";
export const metadata = { title: "검색 · BUYORNOT" };
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const [community, rooms] = await Promise.all([
    loadCommunity(),
    Promise.all(
      directoryDatabase().creators.map((room) => readRoomSnapshot(room.id)),
    ),
  ]);
  return (
    <SearchResults
      key={q}
      query={q.trim().slice(0, 100)}
      initialPosts={community.ok ? community.data.posts : []}
      communityError={community.ok ? "" : community.error}
      rooms={rooms}
    />
  );
}
