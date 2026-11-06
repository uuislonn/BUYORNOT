// Curate fictional local fixtures only; never writes to Supabase or real accounts.
import { readFileSync, writeFileSync, renameSync } from "node:fs";
import { randomUUID } from "node:crypto";
const path = new URL("../.local-test-accounts/activity.json", import.meta.url);
const db = JSON.parse(readFileSync(path, "utf8"));
const styles = {
  nayun: {
    topics: ["MINIMAL", "TONAL", "OFFICE"],
    headline: "덜어낼수록, 나다운 옷장",
    description:
      "단정한 셔츠와 담백한 실루엣. 출근부터 주말까지 차분하게 이어지는 코디를 고민해요.",
    bio: "화이트 셔츠·기본 니트·단정한 슈즈를 중심으로, 차분한 톤과 간결한 실루엣을 좋아해요.",
    buy: "단정한 실루엣을 살리려면 셔츠나 기본 니트와 톤을 맞춰보세요. 구매 전 가지고 있는 옷 세 벌과 조합해 보는 걸 추천해요.",
    not: "미니멀 출근룩만을 위한 선택이라면 지금은 보류할게요. 비슷한 역할의 아이템이 옷장에 있는지 먼저 확인해 보세요.",
  },
  yuri: {
    topics: ["BEAUTY", "COLOR", "TEXTURE"],
    headline: "오늘의 얼굴에 어울리는 한 끗",
    description:
      "립·치크·베이스·아이 메이크업까지. 컬러와 질감을 중심으로 화장품만 함께 골라요.",
    bio: "립과 치크의 컬러 조합, 얇은 베이스와 은은한 눈 화장을 기록해요. 이 룸에서는 뷰티 제품만 다뤄요.",
    buy: "평소 쓰는 베이스와 색조에 겹쳐 쓰는 데일리 메이크업으로 조합해 보세요. 색상은 실제 발색을 확인하고 고르는 걸 추천해요.",
    not: "비슷한 색조를 이미 갖고 있다면 바로 추가하기보다는 보류할게요. 평소 쓰는 제품과 색상·마무리감을 비교해 보세요.",
  },
  rion: {
    topics: ["SNEAKERS", "DENIM", "SPORTY"],
    headline: "룩의 시작은, 오늘 신을 한 켤레",
    description:
      "로우 프로파일 스니커즈와 캐주얼 운동화. 데님 밑단과 신발 실루엣의 조합을 고민해요.",
    bio: "삼바·스피드캣 같은 낮은 실루엣부터 스트랩 스니커즈까지. 데님과 조합할 운동화만 모아요.",
    buy: "와이드 데님 밑단에서 앞코가 살짝 보이도록 코디해 보세요. 같은 계열의 양말로 정리하면 스포티한 포인트를 살리기 좋아요.",
    not: "단정한 출근용 구두를 대신할 한 켤레를 찾는다면 보류할게요. 지금 원하는 용도가 운동화인지부터 다시 확인해 보세요.",
  },
  moa: {
    topics: ["BAGS", "SILVER", "SMALL DETAILS"],
    headline: "작은 디테일이 바꾸는 분위기",
    description:
      "미니백·실버 액세서리·헤어 포인트. 기본 옷에 하나만 더하는 작은 취향을 모아요.",
    bio: "작은 숄더백, 실버 주얼리와 헤어 액세서리를 좋아해요. 옷보다 가방과 작은 디테일에 집중해요.",
    buy: "기본 티나 니트처럼 단순한 옷에 포인트 하나로 더해보세요. 다른 액세서리는 덜어내고 이 아이템의 디테일을 살리는 조합을 추천해요.",
    not: "매일 쓸 기본 아이템 하나를 찾는 목적이라면 잠깐 보류할게요. 소지품이나 평소 착용하는 액세서리와의 조합부터 확인해 보세요.",
  },
  harin: {
    topics: ["ROMANTIC", "FRILL", "MARY JANE"],
    headline: "일상에 살짝, 로맨틱 한 스푼",
    description:
      "플라워 니트·레이스·프릴과 메리제인. 사랑스러운 디테일을 부담 없이 입는 방법을 고민해요.",
    bio: "플라워 니트와 프릴 블라우스, 레이스와 발레 플랫을 좋아해요. 부드러운 질감과 로맨틱한 디테일이 기준이에요.",
    buy: "레이스나 프릴은 한 곳에만 두고, 다른 아이템을 단순하게 맞춰보세요. 부드러운 톤의 니트나 데님으로 일상적인 조합을 만들어보면 좋아요.",
    not: "귀여운 디테일을 줄이고 싶다는 고민이라면 이번에는 보류할게요. 디테일이 적은 아이템부터 시도해 보고 다시 비교해 보세요.",
  },
  seowoo: {
    topics: ["CITY CASUAL", "LOOSE FIT", "DENIM"],
    headline: "힘을 빼도, 선명한 취향",
    description:
      "루즈한 데님과 집업 후디, 레이어드 티와 볼캡. 활동적인 하루를 위한 시티 캐주얼을 모아요.",
    bio: "여유 있는 데님과 후디, 레이어드 티에 볼캡을 더해요. 편안한 실루엣과 캐주얼한 조합을 중심으로 골라요.",
    buy: "루즈한 실루엣을 살리되 상하의 중 한쪽은 길이를 정리해 보세요. 데님이나 후디와 편하게 입을 조합이 떠오른다면 추천해요.",
    not: "격식 있는 자리까지 한 벌로 해결하려는 목적이라면 보류할게요. 일상 캐주얼과 출근·행사 용도를 나눠서 생각해 보세요.",
  },
  doa: {
    topics: ["STRUCTURED BAGS", "LEATHER SHOES", "LONG-TERM"],
    headline: "유행보다, 오래 손이 갈 선택",
    description:
      "형태가 단정한 가방과 가죽 슈즈·부츠. 수납·실측·코디 활용도를 기준으로 신중하게 골라요.",
    bio: "형태가 단정한 블랙·뉴트럴 가방과 가죽 슈즈를 중심으로 봐요. 소재 표기와 수납, 실측을 확인하며 오래 쓸 조합을 고민해요.",
    buy: "가지고 있는 코트나 슬랙스와 먼저 매치해 보세요. 소재 표기·실측·수납을 직접 확인한 뒤 활용할 장면이 여러 개 떠오르면 추천해요.",
    not: "소재나 수납을 확인하지 못한 상태라면 구매를 보류할게요. 비슷한 아이템의 사용 빈도와 실제 필요한 조건을 먼저 비교해 보세요.",
  },
};
const groups = {
  nayun: [
    "웨이스트 핀턱 셔츠",
    "G SLIT SLEEVELESS",
    "스몰 스퀘어 로고",
    "리브레 옥스퍼드",
    "CLASSIC WOOL SCARF",
    "FLUFFY SHORT",
  ],
  harin: [
    "VINTAGE FLOWER",
    "ANGLED LACE",
    "pintuck frill",
    "더블 버튼 드레이프",
    "BELLA QUILTED",
    "스피드캣 발렛",
    "Bliss 0025",
    "SQUARE TOE TWO",
  ],
  seowoo: ["THE MALISSA", "셔츠 레이어드", "Graphic Zip", "WASHED DENIM"],
  moa: [
    "Chubby Bag Tiny",
    "Chubby Half Bag",
    "릴 드롭",
    "더블 레이어드",
    "GLITTER LOGO",
  ],
  doa: [
    "MADELEINE ROUND",
    "Butter bag",
    "belted boat",
    "ORIGINAL WINTER",
    "Buckle Tied",
    "BANDING BALLET",
  ],
};
const managed = db.requests.filter(
  (p) => /^req-\d+$/.test(p.id) || p.id.startsWith("member-example-20261106-"),
);
for (const post of managed) {
  const name = post.product.name;
  const slug =
    post.product.category === "뷰티"
      ? "yuri"
      : post.product.category === "신발" &&
          /삼바 OG|스피드캣 OG|Morrow Square|ZANE X-STRAP/.test(name)
        ? "rion"
        : Object.entries(groups).find(([, needles]) =>
            needles.some((needle) => name.includes(needle)),
          )?.[0];
  post.creatorId = slug ? "fictional-" + slug : "seoa";
  const room = db.creators.find((r) => r.id === post.creatorId);
  if (!room) throw new Error("Missing room");
  const owner = db.profiles.find((p) => p.id === room.ownerId);
  if (slug) {
    post.concern = post.concern.replace(
      /(?:소올|나윤|유리|리온|모아|하린|서우|도아)님/g,
      owner.nickname + "님",
    );
    if (!post.concern.startsWith(owner.nickname + "님"))
      post.concern = (owner.nickname + "님, " + post.concern).slice(0, 150);
    post.tags = styles[slug].topics.slice(0, 2);
  }
}
for (const [slug, style] of Object.entries(styles)) {
  const room = db.creators.find((r) => r.id === "fictional-" + slug);
  room.bio = "[가상 크리에이터] " + style.bio;
  room.topics = style.topics;
  room.editorial = { headline: style.headline, description: style.description };
  const posts = managed.filter((p) => p.creatorId === room.id);
  // Seed distinct BUY/NOT examples in each fictional archive; preserve all non-fixture activity.
  db.evaluations = db.evaluations.filter(
    (e) => !posts.some((p) => p.id === e.requestId),
  );
  for (const [i, post] of posts.entries()) {
    post.status = i === 0 ? "BUY" : i === 1 ? "NOT" : "ING";
    if (i < 2) {
      post.updatedAt = new Date(
        Date.parse(post.createdAt) + 15 * 60000,
      ).toISOString();
      db.evaluations.push({
        id: randomUUID(),
        requestId: post.id,
        creatorId: room.ownerId,
        decision: post.status,
        comment: i === 0 ? style.buy : style.not,
        createdAt: post.updatedAt,
      });
    }
  }
}
// Correct the attribution of retained fixture answers after moving their questions.
for (const e of db.evaluations) {
  const p = db.requests.find((p) => p.id === e.requestId);
  if (p && managed.includes(p))
    e.creatorId = db.creators.find((r) => r.id === p.creatorId).ownerId;
}
const temp = new URL("../.local-test-accounts/activity.tmp", import.meta.url);
writeFileSync(temp, JSON.stringify(db), { mode: 0o600 });
renameSync(temp, path);
console.log(
  JSON.stringify(
    Object.fromEntries(
      db.creators.map((r) => [
        r.id,
        managed
          .filter((p) => p.creatorId === r.id)
          .map((p) => p.product.category),
      ]),
    ),
  ),
);
