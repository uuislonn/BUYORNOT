import soalBanner from "../_assets/soal-banner.jpg";
import soalAvatar from "../_assets/soal-avatar.jpg";
import type { Database, Product, CurationRequest } from "../_lib/types";

// Main images, product details and non-member sale prices checked on 2026-10-27.
// Style-based demo selection, not an endorsement or purchase list from the creator.
export const CATALOG_VERSION = "soal-womens-2026-10-27-per-category-v2";
export const PRODUCT_FIXTURES: Product[] = [
  {
    url: "https://www.musinsa.com/products/4443613",
    name: "VINTAGE FLOWER HANDMADE KNIT CARDIGAN OATMEAL",
    brand: "론론",
    image:
      "https://image.msscdn.net/images/goods_img/20240919/4443613/4443613_17696676752080_500.jpg",
    price: 99000,
    originalPrice: 110000,
    discountRate: 10,
    category: "의류",
    currency: "KRW",
  },
  {
    url: "https://www.musinsa.com/products/3733534",
    name: "Chubby Bag Tiny · 츄비백 티니 (마론)",
    brand: "스탠드오일",
    image:
      "https://image.msscdn.net/images/goods_img/20231127/3733534/3733534_17010504385716_500.jpg",
    price: 86000,
    originalPrice: null,
    discountRate: null,
    category: "잡화",
    currency: "KRW",
  },
  {
    url: "https://www.musinsa.com/products/5322195",
    name: "셔츠 레이어드 롱슬리브 (GRAY) F25ZB023",
    brand: "팬시클럽",
    image:
      "https://image.msscdn.net/images/goods_img/20250813/5322195/5322195_17582680577640_500.jpg",
    price: 76000,
    originalPrice: 95000,
    discountRate: 20,
    category: "의류",
    currency: "KRW",
  },
  {
    url: "https://www.musinsa.com/products/4974473",
    name: "Morrow Square Sneakers · 머로우 스퀘어 스니커즈",
    brand: "스탠드오일",
    image:
      "https://image.msscdn.net/images/goods_img/20250401/4974473/4974473_17526287549905_500.jpg",
    price: 91000,
    originalPrice: null,
    discountRate: null,
    category: "신발",
    currency: "KRW",
  },
  {
    url: "https://www.musinsa.com/products/5859121",
    name: "THE MALISSA JEANS (MID BLUE)",
    brand: "글로니",
    image:
      "https://image.msscdn.net/images/goods_img/20251229/5859121/5859121_17742289043434_500.jpg",
    price: 158000,
    originalPrice: null,
    discountRate: null,
    category: "의류",
    currency: "KRW",
  },
  {
    url: "https://www.musinsa.com/products/3882622",
    name: "[이브이Pick] 언씬 벌룬 틴트 18종",
    brand: "오드타입",
    image:
      "https://image.msscdn.net/images/goods_img/20240220/3882622/3882622_17929741017209_500.jpg",
    price: 16500,
    originalPrice: 22000,
    discountRate: 25,
    category: "뷰티",
    currency: "KRW",
  },
  {
    url: "https://www.musinsa.com/products/6237363",
    name: "ANGLED LACE SLEEVELESS BLOUSE, CREAM",
    brand: "썬번프로젝트",
    image:
      "https://image.msscdn.net/images/goods_img/20260401/6237363/6237363_17767614039085_500.jpg",
    price: 69000,
    originalPrice: null,
    discountRate: null,
    category: "의류",
    currency: "KRW",
  },
  {
    url: "https://www.musinsa.com/products/5052512",
    name: "pintuck frill blouse-black",
    brand: "링서울",
    image:
      "https://image.msscdn.net/images/goods_img/20250422/5052512/5052512_17502280252659_500.jpg",
    price: 81230,
    originalPrice: 85500,
    discountRate: 5,
    category: "의류",
    currency: "KRW",
  },
  {
    url: "https://www.musinsa.com/products/5445378",
    name: "Graphic Zip Up Hoodie / Ivory",
    brand: "사일프레이",
    image:
      "https://image.msscdn.net/images/goods_img/20250911/5445378/5445378_17586088969585_500.jpg",
    price: 134100,
    originalPrice: 149000,
    discountRate: 10,
    category: "의류",
    currency: "KRW",
  },
  {
    url: "https://www.musinsa.com/products/3595802",
    name: "MADELEINE ROUND BAG IN BLACK",
    brand: "마뗑킴",
    image:
      "https://image.msscdn.net/images/goods_img/20230926/3595802/3595802_16957104062604_500.jpg",
    price: 158000,
    originalPrice: null,
    discountRate: null,
    category: "잡화",
    currency: "KRW",
  },
  {
    url: "https://www.musinsa.com/products/5626452",
    name: "G SLIT SLEEVELESS TOP (WHITE)",
    brand: "글로니",
    image:
      "https://image.msscdn.net/images/goods_img/20251022/5626452/5626452_17787251060238_500.jpg",
    price: 45000,
    originalPrice: null,
    discountRate: null,
    category: "의류",
    currency: "KRW",
  },
  {
    url: "https://www.musinsa.com/products/5339985",
    name: "(우먼) 스몰 스퀘어 로고 코튼 니트 가디건_올리브",
    brand: "코드그라피",
    image:
      "https://image.msscdn.net/images/goods_img/20250819/5339985/5339985_17718140833488_500.jpg",
    price: 49900,
    originalPrice: 99000,
    discountRate: 50,
    category: "의류",
    currency: "KRW",
  },
  {
    url: "https://www.musinsa.com/products/5979979",
    name: "더블 버튼 드레이프 레이어드 미디 언발란스 플레어 스커트 _2COLOR",
    brand: "플레이스 스튜디오",
    image:
      "https://image.msscdn.net/images/goods_img/20260204/5979979/5979979_17706901728849_500.jpg",
    price: 35200,
    originalPrice: 42000,
    discountRate: 16,
    category: "의류",
    currency: "KRW",
  },
  {
    url: "https://www.musinsa.com/products/1893427",
    name: "베러 댄 팔레트 (+ 미니 브로우카라 #03 모던베이지 증정)",
    brand: "롬앤",
    image:
      "https://image.msscdn.net/images/goods_img/20210412/1893427/1893427_17896925931854_500.jpg",
    price: 28500,
    originalPrice: 30000,
    discountRate: 5,
    category: "뷰티",
    currency: "KRW",
  },
  {
    url: "https://www.musinsa.com/products/4436696",
    name: "Chubby Half Bag · 츄비 하프백",
    brand: "스탠드오일",
    image:
      "https://image.msscdn.net/images/goods_img/20240912/4436696/4436696_17271619612362_500.jpg",
    price: 98000,
    originalPrice: null,
    discountRate: null,
    category: "잡화",
    currency: "KRW",
  },
  {
    url: "https://www.musinsa.com/products/3996167",
    name: "퓌 립앤치크 블러리 푸딩팟 (35 Colors)",
    brand: "퓌",
    image:
      "https://image.msscdn.net/images/goods_img/20240327/3996167/3996167_17566852429625_500.jpg",
    price: 19800,
    originalPrice: 22000,
    discountRate: 10,
    category: "뷰티",
    currency: "KRW",
  },
  {
    url: "https://www.musinsa.com/products/5905138",
    name: "슬릭 미니 스코트-차콜",
    brand: "비터셀즈",
    image:
      "https://image.msscdn.net/images/goods_img/20260116/5905138/5905138_17696786171538_500.jpg",
    price: 64170,
    originalPrice: 69000,
    discountRate: 7,
    category: "의류",
    currency: "KRW",
  },
  {
    url: "https://www.musinsa.com/products/3106187",
    name: "아트클래스 프로타주 펜슬",
    brand: "투쿨포스쿨",
    image:
      "https://image.msscdn.net/images/goods_img/20230224/3106187/3106187_17876223031848_500.jpg",
    price: 11000,
    originalPrice: 13000,
    discountRate: 15,
    category: "뷰티",
    currency: "KRW",
  },
  {
    name: "웨이스트 핀턱 셔츠_화이트",
    brand: "러벤티나",
    image:
      "https://image.msscdn.net/images/goods_img/20250827/5367757/5367757_17562606754263_500.jpg",
    url: "https://www.musinsa.com/products/5367757",
    price: 118000,
    originalPrice: null,
    discountRate: null,
    category: "의류",
    currency: "KRW",
  },
  {
    name: "퓌 쿠션 글래스 내추럴 (5 Colors)",
    brand: "퓌",
    image:
      "https://image.msscdn.net/images/goods_img/20240327/3996135/3996135_17115145899099_500.jpg",
    url: "https://www.musinsa.com/products/3996135",
    price: 25200,
    originalPrice: 28000,
    discountRate: 10,
    category: "뷰티",
    currency: "KRW",
  },
  {
    name: "삼바 OG - 화이트:블랙 / B75806",
    brand: "아디다스",
    image:
      "https://image.msscdn.net/images/goods_img/20190923/1163169/1163169_16896579905804_500.jpg",
    url: "https://www.musinsa.com/products/1163169",
    price: 149000,
    originalPrice: null,
    discountRate: null,
    category: "신발",
    currency: "KRW",
  },
  {
    name: "Butter bag  Classic · 버터백 클래식",
    brand: "스탠드오일",
    image:
      "https://image.msscdn.net/images/goods_img/20220207/2343665/2343665_17575768987968_500.jpg",
    url: "https://www.musinsa.com/products/2343665",
    price: 89000,
    originalPrice: null,
    discountRate: null,
    category: "잡화",
    currency: "KRW",
  },
  {
    name: "스위프츠 언발란스 플리츠 스커트 - 그레이 스트라이프",
    brand: "제뉴즈",
    image:
      "https://image.msscdn.net/images/goods_img/20250220/4811190/4811190_17800231046029_500.png",
    url: "https://www.musinsa.com/products/4811190",
    price: 159000,
    originalPrice: null,
    discountRate: null,
    category: "의류",
    currency: "KRW",
  },
  {
    name: "롱래스팅 팁 컨실러 커버핏 EX",
    brand: "루나",
    image:
      "https://image.msscdn.net/images/goods_img/20200313/1350526/1350526_17879002851254_500.jpg",
    url: "https://www.musinsa.com/products/1350526",
    price: 11500,
    originalPrice: 17000,
    discountRate: 32,
    category: "뷰티",
    currency: "KRW",
  },
  {
    name: "리브레 옥스퍼드 슈즈 412339002 (4cm/1color)",
    brand: "솔트앤초콜릿",
    image:
      "https://image.msscdn.net/images/goods_img/20230919/3575082/3575082_16971747276821_500.jpg",
    url: "https://www.musinsa.com/products/3575082",
    price: 75650,
    originalPrice: 89000,
    discountRate: 15,
    category: "신발",
    currency: "KRW",
  },
  {
    name: "Oblong bag Mini · 오블롱백 미니",
    brand: "스탠드오일",
    image:
      "https://image.msscdn.net/images/goods_img/20220207/2344540/2344540_6_500.jpg",
    url: "https://www.musinsa.com/products/2344540",
    price: 96000,
    originalPrice: null,
    discountRate: null,
    category: "잡화",
    currency: "KRW",
  },
  {
    name: "한올 플랫 브로우",
    brand: "롬앤",
    image:
      "https://image.msscdn.net/images/goods_img/20210218/1800963/1800963_17097002161070_500.jpg",
    url: "https://www.musinsa.com/products/1800963",
    price: 8900,
    originalPrice: 11000,
    discountRate: 19,
    category: "뷰티",
    currency: "KRW",
  },
  {
    name: "스피드캣 OG - 블랙 / 398846-01",
    brand: "푸마",
    image:
      "https://image.msscdn.net/images/goods_img/20240617/4201442/4201442_17188440495026_500.jpg",
    url: "https://www.musinsa.com/products/4201442",
    price: 149000,
    originalPrice: null,
    discountRate: null,
    category: "신발",
    currency: "KRW",
  },
  {
    name: "릴 드롭 네크리스 실버",
    brand: "선데이디스코클럽",
    image:
      "https://image.msscdn.net/images/goods_img/20220804/2697696/2697696_1_500.jpg",
    url: "https://www.musinsa.com/products/2697696",
    price: 44000,
    originalPrice: null,
    discountRate: null,
    category: "잡화",
    currency: "KRW",
  },
  {
    name: "블러 파우더 팩트",
    brand: "어바웃톤",
    image:
      "https://image.msscdn.net/images/goods_img/20220216/2365197/2365197_17841636526107_500.jpg",
    url: "https://www.musinsa.com/products/2365197",
    price: 10500,
    originalPrice: 14000,
    discountRate: 25,
    category: "뷰티",
    currency: "KRW",
  },
  {
    name: "ORIGINAL WINTER BOOTS SHORT(6inch) - 8 colors",
    brand: "락피쉬웨더웨어",
    image:
      "https://image.msscdn.net/images/goods_img/20240924/4457147/4457147_17925429493468_500.jpg",
    url: "https://www.musinsa.com/products/4457147",
    price: 108200,
    originalPrice: 123000,
    discountRate: 12,
    category: "신발",
    currency: "KRW",
  },
  {
    name: "더블 레이어드 이어커프 Double Layered Ear Cuff",
    brand: "노비스도쿄",
    image:
      "https://image.msscdn.net/images/goods_img/20240610/4186137/4186137_17186884930098_500.jpg",
    url: "https://www.musinsa.com/products/4186137",
    price: 29700,
    originalPrice: null,
    discountRate: null,
    category: "잡화",
    currency: "KRW",
  },
  {
    name: "센슈얼 누드 글로스 5g",
    brand: "헤라",
    image:
      "https://image.msscdn.net/images/goods_img/20221226/2996848/2996848_17914351751092_500.jpg",
    url: "https://www.musinsa.com/products/2996848",
    price: 38300,
    originalPrice: 40000,
    discountRate: 4,
    category: "뷰티",
    currency: "KRW",
  },
  {
    name: "BELLA QUILTED MARYJANES - 9 colors",
    brand: "락피쉬웨더웨어",
    image:
      "https://image.msscdn.net/images/goods_img/20250131/4747689/4747689_17893695434456_500.jpg",
    url: "https://www.musinsa.com/products/4747689",
    price: 79800,
    originalPrice: 84000,
    discountRate: 5,
    category: "신발",
    currency: "KRW",
  },
  {
    name: "WASHED DENIM BALL CAP-GRAY/PINK",
    brand: "이미스",
    image:
      "https://image.msscdn.net/images/goods_img/20240908/4418594/4418594_17835033991745_500.jpg",
    url: "https://www.musinsa.com/products/4418594",
    price: 49000,
    originalPrice: null,
    discountRate: null,
    category: "잡화",
    currency: "KRW",
  },
  {
    name: "도트 온 무드 립펜슬",
    brand: "하트퍼센트",
    image:
      "https://image.msscdn.net/images/goods_img/20230302/3117997/3117997_17901447749446_500.jpg",
    url: "https://www.musinsa.com/products/3117997",
    price: 14000,
    originalPrice: null,
    discountRate: null,
    category: "뷰티",
    currency: "KRW",
  },
  {
    name: "스피드캣 발렛 스웨이드 - 블랙:핑크 / 401287-02",
    brand: "푸마",
    image:
      "https://image.msscdn.net/images/goods_img/20250206/4763283/4763283_17392392154382_500.jpg",
    url: "https://www.musinsa.com/products/4763283",
    price: 119000,
    originalPrice: null,
    discountRate: null,
    category: "신발",
    currency: "KRW",
  },
  {
    name: "CLASSIC WOOL SCARF CHECK - 7 colors",
    brand: "락피쉬웨더웨어",
    image:
      "https://image.msscdn.net/images/goods_img/20240924/4456920/4456920_17884895993695_500.jpg",
    url: "https://www.musinsa.com/products/4456920",
    price: 62100,
    originalPrice: 69000,
    discountRate: 10,
    category: "잡화",
    currency: "KRW",
  },
  {
    name: "미니 하이라이터 - 글레이즈드 도넛",
    brand: "오프라 코스메틱",
    image:
      "https://image.msscdn.net/images/goods_img/20250207/4768565/4768565_17772771715199_500.jpg",
    url: "https://www.musinsa.com/products/4768565",
    price: 34200,
    originalPrice: 36000,
    discountRate: 5,
    category: "뷰티",
    currency: "KRW",
  },
  {
    name: "Bliss 0025. Studded Mesh Flat - 5colors",
    brand: "포기무디",
    image:
      "https://image.msscdn.net/images/goods_img/20250515/5117207/5117207_17472989106188_500.jpg",
    url: "https://www.musinsa.com/products/5117207",
    price: 109000,
    originalPrice: null,
    discountRate: null,
    category: "신발",
    currency: "KRW",
  },
  {
    name: "FLUFFY SHORT GLOVES - 8 colors",
    brand: "락피쉬웨더웨어",
    image:
      "https://image.msscdn.net/images/prd_img/20241004/4488529/detail_4488529_17884834658788_500.jpg",
    url: "https://www.musinsa.com/products/4488529",
    price: 25200,
    originalPrice: 28000,
    discountRate: 10,
    category: "잡화",
    currency: "KRW",
  },
  {
    name: "바미 크림 치크 11종",
    brand: "얼터너티브스테레오",
    image:
      "https://image.msscdn.net/images/goods_img/20250109/4706695/4706695_17494282508001_500.jpg",
    url: "https://www.musinsa.com/products/4706695",
    price: 14250,
    originalPrice: 15000,
    discountRate: 5,
    category: "뷰티",
    currency: "KRW",
  },
  {
    name: "SQUARE TOE TWO STRAP MARYJANES(4CM) - 4 colors",
    brand: "락피쉬웨더웨어",
    image:
      "https://image.msscdn.net/images/goods_img/20250808/5303109/5303109_17871351572427_500.jpg",
    url: "https://www.musinsa.com/products/5303109",
    price: 88300,
    originalPrice: 93000,
    discountRate: 5,
    category: "신발",
    currency: "KRW",
  },
  {
    name: "belted boat bag (black)",
    brand: "여밈",
    image:
      "https://image.msscdn.net/images/goods_img/20250228/4846817/4846817_17415981131234_500.jpg",
    url: "https://www.musinsa.com/products/4846817",
    price: 146850,
    originalPrice: 165000,
    discountRate: 11,
    category: "잡화",
    currency: "KRW",
  },
  {
    name: "Buckle Tied Long Boots · 버클 타이드 롱 부츠",
    brand: "스탠드오일",
    image:
      "https://image.msscdn.net/images/goods_img/20250822/5353896/5353896_17580966929843_500.jpg",
    url: "https://www.musinsa.com/products/5353896",
    price: 179000,
    originalPrice: null,
    discountRate: null,
    category: "신발",
    currency: "KRW",
  },
  {
    name: "GLITTER LOGO HAIR CLAW CLIP",
    brand: "이미스",
    image:
      "https://image.msscdn.net/images/goods_img/20260211/6012511/6012511_17707943521950_500.jpg",
    url: "https://www.musinsa.com/products/6012511",
    price: 29000,
    originalPrice: null,
    discountRate: null,
    category: "잡화",
    currency: "KRW",
  },
  {
    name: "ZANE X-STRAP SNEAKERS(SUEDE) - TEAL GREY",
    brand: "락피쉬웨더웨어",
    image:
      "https://image.msscdn.net/images/goods_img/20260820/7115879/7115879_17921180070979_500.jpg",
    url: "https://www.musinsa.com/products/7115879",
    price: 126300,
    originalPrice: 133000,
    discountRate: 5,
    category: "신발",
    currency: "KRW",
  },
  {
    name: "BANDING BALLET FLATS(LEATHER) - 4 colors",
    brand: "락피쉬웨더웨어",
    image:
      "https://image.msscdn.net/images/goods_img/20260909/7285329/7285329_17908146162431_500.jpg",
    url: "https://www.musinsa.com/products/7285329",
    price: 113900,
    originalPrice: 120000,
    discountRate: 5,
    category: "신발",
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
        "플라워 니트에 와이드 데님을 입고 싶은데 너무 귀여워 보일까요? 소올님 룩일기처럼 힘 뺀 주말 코디로 입고 싶어요.",
      tags: ["데일리", "데이트룩"],
      author: "member",
    },
    {
      id: "req-2",
      p: 1,
      days: 4,
      status: "ING",
      concern:
        "가을 데님 코디에 마론색 미니백으로 포인트를 주고 싶어요. 평소 무채색 옷이 많은데 잘 어울릴까요?",
      tags: ["데일리", "데이트룩"],
      author: "sample-1",
    },
    {
      id: "req-3",
      p: 2,
      days: 8,
      status: "ING",
      concern:
        "레이어드 느낌의 회색 롱슬리브가 눈에 들어와요. 미니 스커트랑 입어도 너무 캐주얼하지 않을까요?",
      tags: ["데일리", "데이트룩"],
      author: "sample-2",
    },
    {
      id: "req-4",
      p: 3,
      days: 5,
      status: "BUY",
      concern:
        "발등이 각진 스니커즈가 귀여운데 와이드 데님이랑 미니 스커트 모두에 잘 어울릴까요?",
      tags: ["여행룩", "데일리"],
      author: "sample-1",
    },
    {
      id: "req-5",
      p: 4,
      days: 11,
      status: "BUY",
      concern:
        "워싱이 자연스러운 데님을 찾고 있어요. 키 158cm인데 밑단을 접어서 입어도 비율이 괜찮을까요?",
      tags: ["데일리", "체형커버"],
      author: "member",
    },
    {
      id: "req-6",
      p: 5,
      days: 7,
      status: "NOT",
      concern:
        "립 하나로 가을 분위기를 내고 싶어요. 피부 톤보다 많이 어두운 색을 고르면 얼굴이 칙칙해 보일까요?",
      tags: ["퍼스널컬러", "데이트룩"],
      author: "sample-2",
    },
    {
      id: "req-7",
      p: 6,
      days: 32,
      status: "ING",
      concern:
        "크림 레이스 블라우스를 가디건 안에 레이어드하고 싶어요. 지난달 올린 고민인데 아직 답변을 기다리고 있어요.",
      tags: ["데이트룩", "데일리"],
      author: "sample-2",
    },
    {
      id: "req-8",
      p: 7,
      days: 4.1,
      status: "ING",
      concern:
        "프릴 디테일의 블랙 블라우스에 생지 데님을 입으려고 해요. 데이트룩으로 과하지 않고 예쁠까요?",
      tags: ["데이트룩", "데일리"],
      author: "sample-1",
    },
    {
      id: "req-9",
      p: 8,
      days: 4.35,
      status: "ING",
      concern:
        "아이보리 집업 후디를 코트 안에 입고 싶어요. 주말에도 출근할 때도 활용할 수 있을까요?",
      tags: ["데일리", "출근룩"],
      author: "sample-2",
    },
    {
      id: "req-10",
      p: 9,
      days: 4.6,
      status: "ING",
      concern:
        "미니멀한 블랙 라운드백이 필요해요. 니트와 롱스커트를 자주 입는데 이 가방으로 통일해도 괜찮을까요?",
      tags: ["출근룩", "데일리"],
      author: "member",
    },
    {
      id: "req-11",
      p: 10,
      days: 4.85,
      status: "ING",
      concern:
        "가디건 안에 입을 화이트 슬리브리스를 찾고 있어요. 넥라인이 너무 깊어 보이지 않게 코디하려면 어떻게 입으면 좋을까요?",
      tags: ["데일리", "데이트룩"],
      author: "sample-1",
    },
    {
      id: "req-12",
      p: 11,
      days: 5.1,
      status: "ING",
      concern:
        "올리브색 가디건이 처음인데 데님이랑 입으면 잘 어울릴까요? 가을에 무채색 대신 포인트를 주고 싶어요.",
      tags: ["데일리", "퍼스널컬러"],
      author: "sample-2",
    },
    {
      id: "req-13",
      p: 12,
      days: 5.35,
      status: "ING",
      concern:
        "언밸런스 미디 스커트에 기본 티와 메리제인을 신으려고 해요. 키가 작은 편인데 답답해 보이지 않을까요?",
      tags: ["체형커버", "데이트룩"],
      author: "member",
    },
    {
      id: "req-14",
      p: 13,
      days: 5.6,
      status: "ING",
      concern:
        "데일리 음영 메이크업용 팔레트를 찾고 있어요. 반짝이는 포인트까지 한 팔레트로 끝내도 과하지 않을까요?",
      tags: ["퍼스널컬러", "데일리"],
      author: "sample-1",
    },
    {
      id: "req-15",
      p: 14,
      days: 5.85,
      status: "ING",
      concern:
        "여행 갈 때 크로스로도 들 수 있는 가방을 찾고 있어요. 후디나 셔츠 같은 편한 옷에 잘 맞을까요?",
      tags: ["여행룩", "데일리"],
      author: "sample-2",
    },
    {
      id: "req-16",
      p: 15,
      days: 6.1,
      status: "ING",
      concern:
        "립과 치크를 같은 톤으로 맞춰보고 싶어요. 피부 메이크업을 얇게 할 때도 푸딩 제형이 잘 어울릴까요?",
      tags: ["퍼스널컬러", "데일리"],
      author: "member",
    },
    {
      id: "req-17",
      p: 16,
      days: 6.35,
      status: "ING",
      concern:
        "차콜 미니 스코트에 루즈한 니트와 롱부츠를 코디하고 싶어요. 허벅지가 신경 쓰이는데 비율이 괜찮을까요?",
      tags: ["체형커버", "데이트룩"],
      author: "sample-1",
    },
    {
      id: "req-18",
      p: 17,
      days: 6.6,
      status: "ING",
      concern:
        "눈 밑에 은은하게 포인트를 주고 싶은데 펄 섀도보다 펜슬이 자연스러울까요? 매일 쓰기 좋은 느낌이면 좋겠어요.",
      tags: ["데일리", "퍼스널컬러"],
      author: "sample-2",
    },

    {
      id: "req-19",
      p: 18,
      days: 4.76,
      status: "ING",
      concern:
        "허리 라인이 잡힌 화이트 셔츠를 데님이랑 입고 싶어요. 너무 단정해 보이지 않게 소매를 걷어서 입어도 괜찮을까요?",
      tags: ["출근룩", "데일리"],
      author: "member",
    },
    {
      id: "req-20",
      p: 19,
      days: 4.82,
      status: "ING",
      concern:
        "얇고 촉촉한 베이스를 좋아해서 글래스 쿠션이 궁금해요. 평소 크림 치크를 쓰는데 조합이 괜찮을까요?",
      tags: ["데일리", "퍼스널컬러"],
      author: "sample-1",
    },
    {
      id: "req-21",
      p: 20,
      days: 4.88,
      status: "ING",
      concern:
        "화이트 삼바를 롱스커트와 와이드 데님에 번갈아 신고 싶어요. 평소 옷이 무채색인데 데일리로 무난할까요?",
      tags: ["데일리", "여행룩"],
      author: "sample-2",
    },
    {
      id: "req-22",
      p: 21,
      days: 4.94,
      status: "ING",
      concern:
        "모양이 단정한 버터백을 매일 들고 싶어요. 오버핏 셔츠나 니트에 들었을 때도 충분히 캐주얼할까요?",
      tags: ["출근룩", "데일리"],
      author: "member",
    },
    {
      id: "req-23",
      p: 22,
      days: 5.0,
      status: "ING",
      concern:
        "스트라이프 플리츠 스커트에 루즈한 니트를 매치하고 싶어요. 비대칭 밑단이 작은 키에도 부담스럽지 않을까요?",
      tags: ["체형커버", "데이트룩"],
      author: "sample-1",
    },
    {
      id: "req-24",
      p: 23,
      days: 5.06,
      status: "ING",
      concern:
        "파운데이션을 얇게 바르고 필요한 곳만 커버하고 싶어요. 팁 컨실러를 쓰면 베이스가 두꺼워 보이지 않을까요?",
      tags: ["데일리"],
      author: "sample-2",
    },
    {
      id: "req-25",
      p: 24,
      days: 5.12,
      status: "ING",
      concern:
        "셔츠와 미디 스커트에 매치할 옥스퍼드 슈즈를 찾고 있어요. 4cm 굽이 출근룩에 너무 무거워 보이지 않을까요?",
      tags: ["출근룩", "데일리"],
      author: "member",
    },
    {
      id: "req-26",
      p: 25,
      days: 5.18,
      status: "ING",
      concern:
        "작은 직사각 숄더백을 찾고 있어요. 데님 재킷과 미디 스커트 코디에 함께 들면 비율이 괜찮을까요?",
      tags: ["데이트룩", "데일리"],
      author: "sample-1",
    },
    {
      id: "req-27",
      p: 26,
      days: 5.24,
      status: "ING",
      concern:
        "화장을 연하게 하는 날 자연스러운 눈썹을 그리고 싶어요. 헤어 컬러에 맞춰 너무 진하지 않게 고르면 좋을까요?",
      tags: ["데일리", "퍼스널컬러"],
      author: "sample-2",
    },
    {
      id: "req-28",
      p: 27,
      days: 5.3,
      status: "ING",
      concern:
        "블랙 스피드캣에 루즈한 데님을 입어보고 싶어요. 상의는 니트로 입으면 너무 스포티하지 않을까요?",
      tags: ["데일리", "데이트룩"],
      author: "member",
    },
    {
      id: "req-29",
      p: 28,
      days: 5.36,
      status: "ING",
      concern:
        "기본 티 위에 실버 목걸이 하나로 포인트를 주고 싶어요. 다른 액세서리 없이 이것만 해도 심심하지 않을까요?",
      tags: ["데일리", "데이트룩"],
      author: "sample-1",
    },
    {
      id: "req-30",
      p: 29,
      days: 5.42,
      status: "ING",
      concern:
        "오후에 코 옆만 번들거려서 파우더 팩트를 살까 해요. 전체에 바르지 않고 부분적으로 쓰면 광이 예쁘게 남을까요?",
      tags: ["데일리"],
      author: "sample-2",
    },
    {
      id: "req-31",
      p: 30,
      days: 5.48,
      status: "ING",
      concern:
        "추운 날 니트 스커트에 신을 숏부츠를 찾고 있어요. 양말을 살짝 보이게 신으면 발목이 답답해 보이지 않을까요?",
      tags: ["데일리", "체형커버"],
      author: "member",
    },
    {
      id: "req-32",
      p: 31,
      days: 5.54,
      status: "ING",
      concern:
        "귀를 뚫지 않아서 이어커프로 포인트를 주고 싶어요. 실버 목걸이와 같이 착용하면 너무 많아 보일까요?",
      tags: ["데이트룩", "데일리"],
      author: "sample-1",
    },
    {
      id: "req-33",
      p: 32,
      days: 5.6,
      status: "ING",
      concern:
        "촉촉한 누드 립에 글로스를 얹는 메이크업이 하고 싶어요. 평소 쓰는 로즈 립 위에 겹쳐도 어울릴까요?",
      tags: ["데이트룩", "퍼스널컬러"],
      author: "sample-2",
    },
    {
      id: "req-34",
      p: 33,
      days: 5.66,
      status: "ING",
      concern:
        "퀼팅 메리제인을 데님에도 신어보고 싶어요. 발목 양말과 함께 신으면 너무 귀여운 느낌일까요?",
      tags: ["데이트룩", "데일리"],
      author: "member",
    },
    {
      id: "req-35",
      p: 34,
      days: 5.72,
      status: "ING",
      concern:
        "데님 볼캡에 핑크 로고가 귀여워요. 회색 후디와 트렌치에 같이 매치해도 잘 어울릴까요?",
      tags: ["데일리", "여행룩"],
      author: "sample-1",
    },
    {
      id: "req-36",
      p: 35,
      days: 5.78,
      status: "ING",
      concern:
        "입술 경계를 부드럽게 정리해 보고 싶어요. 립펜슬을 베이스로 쓰면 평소 틴트도 다르게 보일까요?",
      tags: ["데일리", "퍼스널컬러"],
      author: "sample-2",
    },
    {
      id: "req-37",
      p: 36,
      days: 5.84,
      status: "ING",
      concern:
        "발레 슈즈와 스니커즈 느낌이 섞인 신발이 눈에 들어와요. 카고 팬츠나 플리츠 스커트에도 잘 맞을까요?",
      tags: ["데일리", "데이트룩"],
      author: "member",
    },
    {
      id: "req-38",
      p: 37,
      days: 5.9,
      status: "ING",
      concern:
        "무채색 코트에 체크 머플러로 포인트를 주고 싶어요. 매듭을 크게 묶으면 작은 키에도 괜찮아 보일까요?",
      tags: ["체형커버", "데일리"],
      author: "sample-1",
    },
    {
      id: "req-39",
      p: 38,
      days: 5.96,
      status: "ING",
      concern:
        "소올님 화장일기처럼 눈 앞머리와 광대에 빛을 주고 싶어요. 평소 메이크업에 하이라이터를 더하면 과하지 않을까요?",
      tags: ["데이트룩", "데일리"],
      author: "sample-2",
    },
    {
      id: "req-40",
      p: 39,
      days: 6.02,
      status: "ING",
      concern:
        "스터드가 있는 메시 플랫을 포인트로 신고 싶어요. 기본 셔츠와 생지 데님에 매치하면 과하지 않을까요?",
      tags: ["데이트룩", "데일리"],
      author: "member",
    },
    {
      id: "req-41",
      p: 40,
      days: 6.08,
      status: "ING",
      concern:
        "소매 밖으로 살짝 보이는 장갑이 갖고 싶어요. 니트와 코트 색을 비슷하게 맞춰도 밋밋하지 않을까요?",
      tags: ["데일리", "출근룩"],
      author: "sample-1",
    },
    {
      id: "req-42",
      p: 41,
      days: 6.14,
      status: "ING",
      concern:
        "가을에 니트랑 어울리는 부드러운 치크가 필요해요. 크림 치크를 얇은 베이스 위에 올려도 자연스러울까요?",
      tags: ["퍼스널컬러", "데일리"],
      author: "sample-2",
    },
    {
      id: "req-43",
      p: 42,
      days: 6.2,
      status: "ING",
      concern:
        "발등 스트랩이 두 개인 메리제인에 미디 스커트를 입고 싶어요. 4cm 굽이면 종아리 비율이 괜찮아 보일까요?",
      tags: ["체형커버", "데이트룩"],
      author: "member",
    },
    {
      id: "req-44",
      p: 43,
      days: 6.26,
      status: "ING",
      concern:
        "벨트 디테일이 있는 가방이 눈에 들어와요. 평소 셔츠와 데님을 자주 입는데 가방 하나로 포인트가 될까요?",
      tags: ["출근룩", "데이트룩"],
      author: "sample-1",
    },
    {
      id: "req-45",
      p: 44,
      days: 6.32,
      status: "ING",
      concern:
        "버클 롱부츠에 미니 스코트와 넉넉한 니트를 입어보고 싶어요. 키 158cm인데 부츠 기장이 부담스럽지 않을까요?",
      tags: ["체형커버", "데이트룩"],
      author: "sample-2",
    },
    {
      id: "req-46",
      p: 45,
      days: 6.38,
      status: "ING",
      concern:
        "니트 입는 날 머리를 가볍게 올릴 헤어 집게가 필요해요. 반짝이는 로고가 평소 데일리 코디에도 괜찮을까요?",
      tags: ["데일리", "데이트룩"],
      author: "member",
    },
    {
      id: "req-47",
      p: 46,
      days: 6.44,
      status: "ING",
      concern:
        "그레이 계열 스트랩 스니커즈로 룩에 포인트를 주고 싶어요. 평소 블루 데님과 베이지 니트를 자주 입는데 어울릴까요?",
      tags: ["여행룩", "데일리"],
      author: "sample-1",
    },
    {
      id: "req-48",
      p: 47,
      days: 6.5,
      status: "ING",
      concern:
        "가죽 발레 플랫을 출근할 때도 신으려고 해요. 슬랙스 밑단 아래로 살짝 보이게 매치해도 예쁠까요?",
      tags: ["출근룩", "데일리"],
      author: "sample-2",
    },
  ];
  return {
    profiles: [
      {
        id: "creator",
        nickname: "소올soal",
        role: "CREATOR",
        avatar: soalAvatar.src,
        verified: false,
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
        handle: "i0cc0i",
        title: "소올soal",
        bio: "밥친구 🍚 룩일기부터 화장일기까지, 오늘의 살까 말까를 함께 골라봐요.",
        cover: soalBanner.src,
        links: [
          { label: "Instagram", url: "https://www.instagram.com/i0c0i/" },
          { label: "YouTube", url: "https://www.youtube.com/@i0cc0i/videos" },
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
        r.id === "req-1" ? { height_cm: 158, body_type: "코디 비율 고민" } : {},
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
        comment:
          "각진 앞코가 룩에 포인트가 되는 조합이에요. 데님과 스커트 코디를 모두 비교해 보세요.",
        createdAt: at(3),
      },
      {
        id: "eval-5",
        requestId: "req-5",
        creatorId: "creator",
        decision: "BUY",
        comment:
          "자연스러운 중청 데님에 니트나 기본 티를 매치해 보세요. 구매 전 총장과 허리 실측은 꼭 확인해 주세요.",
        createdAt: at(6),
      },
      {
        id: "eval-6",
        requestId: "req-6",
        creatorId: "creator",
        decision: "NOT",
        comment:
          "사진만 보고 너무 어두운 색을 고르기보다, 평소 잘 쓰는 립과 발색을 비교해 보는 쪽을 추천해요.",
        createdAt: at(4),
      },
    ],
    applications: [],
    hearts: {},
    follows: {},
  };
}

// Upgrade authored demo examples once, preserving real user posts, deletions and decisions.
export function refreshSeedCatalog(
  db: Database,
  now = Date.now(),
  previousCount = 7,
): void {
  const fresh = createSeed(now);
  for (const next of fresh.requests) {
    const current = db.requests.find((row) => row.id === next.id);
    if (current) {
      current.product = { ...next.product };
      current.concern = next.concern;
      current.tags = [...next.tags];
      current.bodySpec = { ...next.bodySpec };
    } else if (Number(next.id.slice(4)) > previousCount) {
      db.requests.push(next);
    }
  }
  for (const evaluation of db.evaluations) {
    const next = fresh.evaluations.find((row) => row.id === evaluation.id);
    if (next) evaluation.comment = next.comment;
  }
}
