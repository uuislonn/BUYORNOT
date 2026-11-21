import type { Database, Category } from "./types";

// Older saved posts may still use a brand/price tier as their category.
// Reclassify only that retired category; keep content and all activity intact.
export function itemCategory(name: string): Category {
  if (
    /로퍼|스니커즈|부츠|샌들|펌프스|플랫|슈즈|운동화|구두|슬리퍼|loafer|sneaker|boot|sandal|shoe/i.test(
      name,
    )
  )
    return "신발";
  if (
    /가방|백팩|숄더백|토트백|크로스백|핸드백|미니백|지갑|카드|벨트|목걸이|팔찌|반지|귀걸이|스카프|머플러|bag|wallet|belt|jewel/i.test(
      name,
    )
  )
    return "잡화";
  if (
    /코트|재킷|자켓|셔츠|니트|가디건|팬츠|스커트|원피스|드레스|패딩|블라우스|티셔츠|데님|coat|jacket|shirt|knit|pants|dress/i.test(
      name,
    )
  )
    return "의류";
  if (
    /향수|립스틱|쿠션|크림|세럼|파운데이션|perfume|lipstick|serum/i.test(name)
  )
    return "뷰티";
  return "잡화";
}
export function normalizeProductCategories(db: Database): void {
  for (const post of db.requests) {
    if (String(post.product.category) !== "명품") continue;
    post.product.category = itemCategory(post.product.name);
    post.tags = post.tags.map((tag) =>
      tag === "명품" ? post.product.category : tag,
    );
  }
}
