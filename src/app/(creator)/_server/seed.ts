import type { Database, Product, CurationRequest } from "../_lib/types";

export const PRODUCT_FIXTURES: Product[] = [
  {
    url: "https://www.musinsa.com/products/4100101",
    name: "소프트 부클 숏 재킷",
    brand: "SOFT ARCHIVE",
    image: "sample:0",
    price: 129000,
    category: "의류",
    currency: "KRW",
  },
  {
    url: "https://www.29cm.co.kr/products/4100102",
    name: "데일리 레더 숄더백",
    brand: "NOTHING WRITTEN",
    image: "sample:1",
    price: 189000,
    category: "잡화",
    currency: "KRW",
  },
  {
    url: "https://www.musinsa.com/products/4100103",
    name: "빈티지 레더 블루종",
    brand: "ARCHIVE ROOM",
    image: "sample:2",
    price: 159000,
    category: "의류",
    currency: "KRW",
  },
  {
    url: "https://www.wconcept.co.kr/Product/4100104",
    name: "스웨이드 데일리 스니커즈",
    brand: "STEP BY STEP",
    image: "sample:3",
    price: 99000,
    category: "신발",
    currency: "KRW",
  },
  {
    url: "https://www.29cm.co.kr/products/4100105",
    name: "클래식 울 블레이저",
    brand: "OUR STANDARD",
    image: "sample:4",
    price: 178000,
    category: "의류",
    currency: "KRW",
  },
  {
    url: "https://www.wconcept.co.kr/Product/4100106",
    name: "시그니처 컬러 립",
    brand: "COLOR NOTE",
    image: "sample:5",
    price: 28000,
    category: "뷰티",
    currency: "KRW",
  },
];
export function createSeed(now = Date.now()): Database {
  const at = (days: number) => new Date(now - days * 86400000).toISOString();
  const rows: {
    id: string;
    p: number;
    days: number;
    status: CurationRequest["status"];
    concern: string;
    tags: string[];
    author: string;
  }[] = [
    {
      id: "req-1",
      p: 0,
      days: 2,
      status: "ING",
      concern:
        "하체 커버용으로 핀턱 롱스커트 살까 하는데 158cm 키에 발목까지 올까 봐 걱정돼요. 이 재킷이랑 같이 입어도 괜찮을까요?",
      tags: ["하객룩", "체형커버"],
      author: "member",
    },
    {
      id: "req-2",
      p: 1,
      days: 4,
      status: "ING",
      concern:
        "출근할 때 매일 들 가방을 찾고 있어요. 평소 미니멀하게 입는데 브라운 컬러도 잘 어울릴까요?",
      tags: ["출근룩", "데일리"],
      author: "sample-1",
    },
    {
      id: "req-3",
      p: 2,
      days: 8,
      status: "ING",
      concern:
        "첫 레더 재킷인데 너무 오버핏일까요? 오래 입을 수 있는 디자인인지 궁금해요.",
      tags: ["데일리"],
      author: "sample-2",
    },
    {
      id: "req-4",
      p: 3,
      days: 5,
      status: "BUY",
      concern: "여행에서 오래 걸을 때도 신기 좋은 스니커즈를 찾고 있어요!",
      tags: ["여행룩"],
      author: "sample-1",
    },
    {
      id: "req-5",
      p: 4,
      days: 11,
      status: "BUY",
      concern: "면접용으로도, 평소에도 입을 수 있는 재킷일까요?",
      tags: ["출근룩"],
      author: "member",
    },
    {
      id: "req-6",
      p: 5,
      days: 7,
      status: "NOT",
      concern: "봄 웜톤인데 이 색상이 얼굴에 너무 진해 보이지 않을까요?",
      tags: ["퍼스널컬러"],
      author: "sample-2",
    },
    {
      id: "req-7",
      p: 0,
      days: 32,
      status: "ING",
      concern:
        "지난달 남긴 고민이에요. 미답변 요청은 30일 뒤 자동으로 만료돼요.",
      tags: ["데일리"],
      author: "sample-2",
    },
  ];
  return {
    profiles: [
      {
        id: "creator",
        nickname: "서아",
        role: "CREATOR",
        avatar: "sample:avatar",
        verified: true,
      },
      {
        id: "member",
        nickname: "Name123",
        role: "USER",
        avatar: "",
        verified: false,
      },
      {
        id: "admin",
        nickname: "운영팀",
        role: "ADMIN",
        avatar: "",
        verified: false,
      },
      {
        id: "sample-1",
        nickname: "minji",
        role: "USER",
        avatar: "",
        verified: false,
      },
      {
        id: "sample-2",
        nickname: "haneul",
        role: "USER",
        avatar: "",
        verified: false,
      },
    ],
    creators: [
      {
        id: "seoa",
        ownerId: "creator",
        handle: "seoa.archive",
        title: "서아의 취향 기록",
        bio: "유행보다 오래 남을 취향을 골라요. 매일 입는 옷부터 특별한 날의 한 끗까지, 같이 고민해요.",
        cover: "sample:2",
        links: [
          { label: "Instagram", url: "https://www.instagram.com/" },
          { label: "YouTube", url: "https://www.youtube.com/" },
        ],
      },
    ],
    requests: rows.map((r) => ({
      id: r.id,
      creatorId: "seoa",
      authorId: r.author,
      product: { ...PRODUCT_FIXTURES[r.p] },
      concern: r.concern,
      tags: r.tags,
      bodySpec:
        r.id === "req-1" ? { height_cm: 158, body_type: "하체 고민" } : {},
      status: r.status,
      createdAt: at(r.days),
      updatedAt: at(r.days),
    })),
    evaluations: [
      {
        id: "eval-4",
        requestId: "req-4",
        creatorId: "creator",
        decision: "BUY",
        comment: "데님에도 스커트에도 좋아요. 평소 사이즈로 추천해요!",
        createdAt: at(3),
      },
      {
        id: "eval-5",
        requestId: "req-5",
        creatorId: "creator",
        decision: "BUY",
        comment: "기본에 충실한 핏이에요. 어깨선만 꼭 확인해 주세요.",
        createdAt: at(6),
      },
      {
        id: "eval-6",
        requestId: "req-6",
        creatorId: "creator",
        decision: "NOT",
        comment: "조금 더 부드러운 코랄 계열을 추천할게요.",
        createdAt: at(4),
      },
    ],
    applications: [],
    hearts: {},
    follows: {},
  };
}
