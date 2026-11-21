import {
  OFFICIAL_PRODUCTS,
  OFFICIAL_ROOM_SELECTIONS,
} from "../_content/official-products";
import type { Database, Product, CurationRequest } from "../_lib/types";

const roomConcerns: Record<string, Record<string, string>> = {
  seoa: {
    의류: "평소 즐겨 입는 데일리룩에 자연스럽게 섞일까요? 다른 옷과 돌려 입기 좋은지 고민이에요.",
    신발: "단순한 코디에 포인트로 신으려는데, 자주 손이 갈까요?",
    잡화: "데일리 코디에 더하고 싶은데, 활용도에 비해 가격이 괜찮을까요?",
  },
  "fictional-yuri": {
    의류: "장바구니에 담아둔 포인트 아이템이에요. 과하지 않게 평소 옷과 매치할 수 있을까요?",
    신발: "스커트나 데님에 포인트로 신으려는데, 코디하기 어렵지 않을까요?",
    잡화: "작은 포인트를 주고 싶은데, 실제로 자주 쓰게 될지 고민이에요.",
  },
  "fictional-nayun": {
    의류: "출근할 때도 주말에도 입고 싶어요. 단정한 실루엣과 활용도를 생각하면 괜찮을까요?",
    신발: "바지와 스커트에 모두 신을 데일리 슈즈로 어떨까요?",
    잡화: "유행을 덜 타고 오래 사용할 수 있는 데일리 아이템인지 고민돼요.",
  },
  "fictional-rion": {
    의류: "여유 있는 캐주얼 핏을 좋아해요. 데님과 스니커즈 위주인 옷장에 잘 어울릴까요?",
    신발: "와이드 데님과 편하게 신기 좋은 한 켤레로 괜찮을까요?",
    잡화: "캐주얼한 코디에 부담 없이 더할 수 있을까요?",
  },
  "fictional-seowoo": {
    의류: "기본템 위주로 옷장을 정리 중이에요. 셔츠나 니트와 깔끔하게 조합하기 좋을까요?",
    신발: "슬랙스와 데님에 모두 신을 수 있는 기본 신발로 괜찮을까요?",
    잡화: "미니멀한 코디에 튀지 않게 더할 수 있을까요?",
  },
  "fictional-doa": {
    의류: "루즈한 실루엣과 힘 있는 소재를 좋아해요. 스트리트 코디에 잘 어울릴까요?",
    신발: "볼륨 있는 바지 아래에 매치하려는데 균형이 괜찮을까요?",
    잡화: "아우터 위주인 코디에 포인트로 더하기 괜찮을까요?",
  },
  leeyull: {
    의류: "오래 입을 클래식한 한 벌을 찾고 있어요. 소재와 활용도를 생각하면 투자할 만할까요?",
    신발: "유행보다 오래 신을 수 있는 디자인인지 고민이에요.",
    잡화: "오래 곁에 둘 아이템으로 보고 있어요. 수납과 관리까지 생각하면 괜찮은 선택일까요?",
  },
  yuria: {
    의류: "평소 코디에 새로운 분위기를 더하고 싶어요. 일상에서도 활용하기 좋을까요?",
    신발: "포인트 슈즈로 사고 싶은데, 실제 코디에서도 자주 신을 수 있을까요?",
    잡화: "디자인이 마음에 드는데, 특별한 날뿐 아니라 일상에서도 잘 쓰일까요?",
  },
};
function concernFor(roomId: string, product: Product) {
  return (
    roomConcerns[roomId]?.[product.category] ??
    "평소 코디와 활용도를 생각하면 살 만한지 함께 고민하고 싶어요."
  );
}

export function addOfficialRoomProducts(db: Database) {
  for (const [roomId, productIds] of Object.entries(OFFICIAL_ROOM_SELECTIONS)) {
    if (!db.creators.some((room) => room.id === roomId)) continue;
    const authorId = `reader-official-${roomId}`;
    if (!db.profiles.some((profile) => profile.id === authorId))
      db.profiles.push({
        id: authorId,
        nickname: "취향 탐색 중",
        role: "USER",
        avatar: "",
        verified: false,
      });
    const ordered: CurationRequest[] = [];
    for (const productId of productIds) {
      const sale = OFFICIAL_PRODUCTS.find((row) => row.id === productId);
      if (!sale) continue;
      const id = `official-${roomId}-${productId}`;
      let post = db.requests.find((request) => request.id === id);
      if (post) {
        // Only our generated cards are refreshed; member content and reactions stay intact.
        if (post.authorId !== authorId || post.creatorId !== roomId) continue;
        post.product = structuredClone(sale.product);
      } else {
        const timestamp = "2026-11-16T10:00:00.000Z";
        post = {
          id,
          creatorId: roomId,
          authorId,
          product: structuredClone(sale.product),
          concern: concernFor(roomId, sale.product),
          tags: [sale.product.category],
          bodySpec: {},
          status: "ING",
          createdAt: timestamp,
          updatedAt: timestamp,
        };
        db.requests.push(post);
      }
      ordered.push(post);
    }
    // Mix only editorial fixtures, leaving member posts and their dates untouched.
    const legacy = db.requests.filter(
      (post) =>
        post.creatorId === roomId &&
        post.authorId === `reader-${roomId}` &&
        post.id.startsWith(`directory-${roomId}-`),
    );
    const pending = [...ordered, ...legacy];
    let previous: CurationRequest | undefined;
    let index = 0;
    while (pending.length) {
      const score = (post: CurationRequest, position: number) =>
        position +
        (post.product.brand === previous?.product.brand ? 1000 : 0) +
        (post.product.category === previous?.product.category ? 10 : 0);
      const picked = pending.reduce(
        (best, post, i) =>
          score(post, i) < score(pending[best], best) ? i : best,
        0,
      );
      const [post] = pending.splice(picked, 1);
      post.createdAt = new Date(
        Date.parse("2026-11-16T10:00:00.000Z") - index++ * 60000,
      ).toISOString();
      previous = post;
    }
  }
}
