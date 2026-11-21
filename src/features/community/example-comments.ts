import type { CommentTarget, DiscussionComment } from "./types";

const communityExamples: Record<string, readonly string[]> = {
  "sample-0": [
    "네이비에 연청 와이드 데님이면 주말에 자주 입을 조합 같아요. 안에는 흰 티 한 장만 입어도 예쁠 듯해요.",
    "이미 네이비 후디가 있다면 잠깐 보류요. 단추를 열어 가디건으로 입는 코디가 두세 개 떠오르면 살 것 같아요.",
    "기장이 길면 와이드 데님이랑 같이 입었을 때 부해 보일 수 있으니 총장만 확인해 보세요!",
  ],
  "sample-1": [
    "베이지 바탕이라 연청에도 검정 슬랙스에도 무난해 보여요. 새하얀 운동화보다 색이 부드러워서 저는 살 쪽이에요.",
    "매일 오래 걷는 용도라면 색보다 발볼이 편한지가 먼저일 것 같아요. 매장에서 양말 신고 신어볼 듯해요.",
  ],
  "sample-2": [
    "검정 슬랙스에 단추를 잠가 니트처럼 입으면 출근할 때도 잘 어울릴 것 같아요.",
    "밝은 가디건은 안에 입는 이너가 비칠 수 있어서, 사진에서 두께랑 짜임을 한 번 더 볼 것 같아요.",
  ],
  "sample-3": [
    "무지 티와 진청 데님에 재킷만 걸쳐도 코디가 끝나는 패턴이라 기본템이 많으면 활용하기 좋아 보여요.",
    "평일에 패턴 옷에 손이 잘 안 간다면 말! 갖고 있는 바지 세 벌에 매치해 보고 결정할래요.",
  ],
  "sample-4": [
    "가볍게 걸칠 용도라면 셔츠 목이 살짝 보이게 입어도 예쁠 것 같아요. 자주 입는 하의에 맞춰 색을 고르면 좋겠어요.",
    "기본템으로는 살인데, 이미 비슷한 가디건이 있다면 이번엔 소재나 두께가 다른 걸 보고 싶어요.",
  ],
  "sample-5": [
    "발등이 보이게 밑단이 살짝 짧은 스트레이트 데님을 입으면 리본이 포인트가 될 것 같아요.",
    "평소 바지 밑단이 신발을 덮는 편이라면 리본이 가려질 수 있어요. 자주 입는 청바지랑 먼저 맞춰 보세요.",
  ],
};

const curationExamples: Record<string, Record<string, readonly string[]>> = {
  seoa: {
    "req-1": [
      "꽃무늬가 포인트라 워싱이 덜한 와이드 진에 단색 가방을 들면 힘 뺀 주말 코디로 딱일 것 같아요.",
      "귀여운 느낌을 줄이고 싶으면 신발은 리본 없이 앞코가 깔끔한 로퍼로 맞춰볼래요.",
    ],
    "req-2": [
      "검정 상의에 진청 데님이면 마론색 가방이 은근히 눈에 띌 것 같아요. 신발까지 같은 색으로 맞출 필요는 없어 보여요.",
      "미니백은 휴대폰이랑 카드지갑이 같이 들어가는지 확인하고 싶어요. 둘 다 들어가면 데일리로 찬성이에요.",
    ],
    "official-seoa-tht-10381398802516": [
      "핑크 가디건을 회색 슬랙스에 입으면 색은 포인트가 되고 전체는 차분해 보여요.",
      "흰 티에 중청 데님 조합도 바로 떠오르네요. 옷장에 무채색이 많다면 돌려 입기 괜찮을 듯해요.",
    ],
    "official-seoa-nw-5535": [
      "검정 벨벳이라 평소 입는 데님에 들어도 소재가 달라 포인트가 될 것 같아요.",
      "데일리용이면 어깨에 걸었을 때 두꺼운 코트 위로도 스트랩이 여유 있는지 볼래요.",
    ],
    "official-seoa-amo-4296": [
      "카키 코듀로이에 아이보리 니트면 부드러운 가을 코디가 될 것 같아요. 네이비 셔츠랑도 잘 어울릴 듯해요.",
      "코듀로이는 밑단이 신발 위에 많이 쌓이면 무거워 보일 수 있어서 총장을 먼저 비교해 볼래요.",
    ],
  },
  "fictional-yuri": {
    "official-fictional-yuri-deinet-2667": [
      "빨간 플랫 하나면 흰 티와 데님만 입어도 코디가 심심하지 않을 것 같아요.",
      "신발이 눈에 띄는 만큼 스커트는 차콜이나 검정으로 두고 양말은 얇은 회색으로 맞춰 보고 싶어요.",
    ],
  },
  "fictional-nayun": {
    "official-fictional-nayun-nw-5637": [
      "웜 아이보리 브이넥은 출근할 땐 셔츠, 주말엔 흰 티를 받쳐 입으면 활용도가 있어 보여요.",
      "브이넥이 깊다면 단독으로 입는 날이 줄 수 있으니 평소 편하게 입는 니트의 목 깊이랑 비교해 보세요.",
    ],
  },
};

export function exampleComments(target: CommentTarget): DiscussionComment[] {
  const bodies =
    target.kind === "community"
      ? communityExamples[target.postId]
      : curationExamples[target.roomId]?.[target.postId];
  if (!Array.isArray(bodies)) return [];
  return bodies.map((body, index) => ({
    id: `example-${target.kind}-${target.postId}-${index}`,
    nickname: ["유진", "다은", "지민"][index],
    body,
    createdAt: new Date(Date.UTC(2026, 10, 17, 2, index * 12)).toISOString(),
  }));
}
