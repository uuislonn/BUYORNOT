import type { Post } from "./types";

// Public MUSINSA product pages and their official product photos checked on 2026-11-06.
// Prices are snapshots from the source pages, not live offers.
export const additionalProducts: (Pick<Post, "category" | "product"> & {
  concern?: string;
})[] = [
  {
    category: "뷰티",
    product: {
      url: "https://www.musinsa.com/products/7352541",
      domain: "www.musinsa.com",
      name: "글루 글로스 #Fluffy Fang",
      brand: "GLYF",
      image:
        "https://image.msscdn.net/thumbnails/images/goods_img/20260917/7352541/7352541_17917216004036_big.jpg?w=1000",
      price: 18000,
      currency: "KRW",
    },
  },
  {
    category: "뷰티",
    product: {
      url: "https://www.musinsa.com/products/7277406",
      domain: "www.musinsa.com",
      name: "[한정특가] 크리스탈 글램 밤",
      brand: "CLIO",
      image:
        "https://image.msscdn.net/thumbnails/images/goods_img/20260908/7277406/7277406_17920435276538_big.jpg?w=1000",
      price: 7900,
      currency: "KRW",
    },
  },
  {
    category: "뷰티",
    product: {
      url: "https://www.musinsa.com/products/4558061",
      domain: "www.musinsa.com",
      name: "[특가] 피그 클렌징 오일 200ml",
      brand: "IMFROM",
      image:
        "https://image.msscdn.net/thumbnails/images/goods_img/20241025/4558061/4558061_17914454488928_big.jpg?w=1000",
      price: 10900,
      currency: "KRW",
    },
  },
  {
    category: "뷰티",
    product: {
      url: "https://www.musinsa.com/products/7253245",
      domain: "www.musinsa.com",
      name: "[프루티드] 핑크구아바 젤리에센스 80ml",
      brand: "PROOTED",
      image:
        "https://image.msscdn.net/thumbnails/images/goods_img/20260904/7253245/7253245_17932471706213_big.jpg?w=1000",
      price: 21200,
      currency: "KRW",
    },
  },
  {
    category: "뷰티",
    product: {
      url: "https://www.musinsa.com/products/7426046",
      domain: "www.musinsa.com",
      name: "쑥판텐 인텐시브 리페어 진정 캡슐 크림 60ml",
      brand: "HANYUL",
      image:
        "https://image.msscdn.net/thumbnails/images/goods_img/20260930/7426046/7426046_17908285068426_big.jpg?w=1000",
      price: 23600,
      currency: "KRW",
    },
  },
  {
    category: "뷰티",
    product: {
      url: "https://www.musinsa.com/products/7405514",
      domain: "www.musinsa.com",
      name: "세라마이드 아토 로션 564ml 2입 SET+증정+쇼핑백",
      brand: "ILLIYOON",
      image:
        "https://image.msscdn.net/thumbnails/images/goods_img/20260928/7405514/7405514_17908979904939_big.jpg?w=1000",
      price: 41920,
      currency: "KRW",
    },
  },
  {
    category: "뷰티",
    product: {
      url: "https://www.musinsa.com/products/6199288",
      domain: "www.musinsa.com",
      name: "원 바이 제뉴인 마그네틱 아이섀도우 4구 팔레트 (7color)",
      brand: "TOOQ",
      image:
        "https://image.msscdn.net/thumbnails/images/goods_img/20260326/6199288/6199288_17747452047157_big.jpg?w=1000",
      price: 18500,
      currency: "KRW",
    },
  },
  {
    category: "뷰티",
    product: {
      url: "https://www.musinsa.com/products/7402219",
      domain: "www.musinsa.com",
      name: "[2EA] 클라우드 레이어 틴트 2종(+미니 치크,하트 퍼프 증정)",
      brand: "LUNA",
      image:
        "https://image.msscdn.net/thumbnails/images/goods_img/20260927/7402219/7402219_17914446466811_big.jpg?w=1000",
      price: 27200,
      currency: "KRW",
    },
  },
  {
    category: "뷰티",
    product: {
      url: "https://www.musinsa.com/products/7395200",
      domain: "www.musinsa.com",
      name: "더블 글레이즈 락커",
      brand: "MERZY",
      image:
        "https://image.msscdn.net/thumbnails/images/goods_img/20260922/7395200/7395200_17914456887628_big.png?w=1000",
      price: 11900,
      currency: "KRW",
    },
  },
  {
    category: "뷰티",
    product: {
      url: "https://www.musinsa.com/products/7336090",
      domain: "www.musinsa.com",
      name: "[홀리데이] WHITE 케이스 에센셜 스킨 누더 쿠션 (본품+리필) (리프트 파우치 증정)",
      brand: "JUNGSAEMMOOL",
      image:
        "https://image.msscdn.net/thumbnails/images/goods_img/20260915/7336090/7336090_17924874379836_big.jpg?w=1000",
      price: 37920,
      currency: "KRW",
    },
  },
  {
    category: "뷰티",
    product: {
      url: "https://www.musinsa.com/products/6328944",
      domain: "www.musinsa.com",
      name: "아크네 클렌징폼 150ml",
      brand: "BLANCNATURE",
      image:
        "https://image.msscdn.net/thumbnails/images/goods_img/20260417/6328944/6328944_17774387705085_big.jpg?w=1000",
      price: 21400,
      currency: "KRW",
    },
  },
  {
    category: "뷰티",
    product: {
      url: "https://www.musinsa.com/products/7274071",
      domain: "www.musinsa.com",
      name: "타투퍼퓸 2종 택 1 50ml 원우드/코튼헤이즈 (+ 퍼글러 키링 증정)",
      brand: "GRAFEN",
      image:
        "https://image.msscdn.net/thumbnails/images/goods_img/20260908/7274071/7274071_17914522461727_big.jpg?w=1000",
      price: 53100,
      currency: "KRW",
    },
  },
  {
    category: "뷰티",
    product: {
      url: "https://www.musinsa.com/products/4699842",
      domain: "www.musinsa.com",
      name: "플레이 멀티 아이즈(New Color 출시)",
      brand: "ETUDE",
      image:
        "https://image.msscdn.net/thumbnails/images/goods_img/20250106/4699842/4699842_17846109026647_big.jpg?w=1000",
      price: 12000,
      currency: "KRW",
    },
  },
  {
    category: "뷰티",
    product: {
      url: "https://www.musinsa.com/products/7237437",
      domain: "www.musinsa.com",
      name: "비타 민트 립 마스크 듀오 기획 (GIFT 랜덤키링)",
      brand: "TOCOBO",
      image:
        "https://image.msscdn.net/thumbnails/images/goods_img/20260903/7237437/7237437_17914455287269_big.png?w=1000",
      price: 32300,
      currency: "KRW",
    },
  },
  {
    category: "뷰티",
    product: {
      url: "https://www.musinsa.com/products/7024047",
      domain: "www.musinsa.com",
      name: "번트시에나 EDP 50ml",
      brand: "MUSINSA STANDARD BEAUTY",
      image:
        "https://image.msscdn.net/thumbnails/images/goods_img/20260807/7024047/7024047_17924813573493_big.jpg?w=1000",
      price: 49900,
      currency: "KRW",
    },
  },
  {
    category: "뷰티",
    product: {
      url: "https://www.musinsa.com/products/7096908",
      domain: "www.musinsa.com",
      name: "바세린 글루타히야 듀이 래디언스 바디로션 170ML",
      brand: "VASELINE",
      image:
        "https://image.msscdn.net/thumbnails/images/goods_img/20260818/7096908/7096908_17871180234092_big.jpg?w=1000",
      price: 6930,
      currency: "KRW",
    },
  },
  {
    category: "명품",
    product: {
      url: "https://www.musinsa.com/products/4408450",
      domain: "www.musinsa.com",
      name: "브러쉬드 터틀넥 니트 - 블랙 / FKS447KN0056001",
      brand: "AMI",
      image:
        "https://image.msscdn.net/thumbnails/images/goods_img/20240905/4408450/4408450_17267935506655_big.jpg?w=1000",
      price: 151000,
      currency: "KRW",
    },
  },
  {
    category: "명품",
    product: {
      url: "https://www.musinsa.com/products/4281512",
      domain: "www.musinsa.com",
      name: "EKD 캐시미어 니트 - 브리스크 / 8092863",
      brand: "BURBERRY",
      image:
        "https://image.msscdn.net/thumbnails/images/goods_img/20240730/4281512/4281512_17244073095076_big.jpg?w=1000",
      price: 650000,
      currency: "KRW",
    },
  },
  {
    category: "명품",
    product: {
      url: "https://www.musinsa.com/products/5049513",
      domain: "www.musinsa.com",
      name: "베아 크롭 브이넥 니트 - 화이트 / 1803004WY003FA401",
      brand: "VIVIENNE WESTWOOD",
      image:
        "https://image.msscdn.net/thumbnails/images/goods_img/20250422/5049513/5049513_17470187640981_500.jpg",
      price: 168990,
      currency: "KRW",
    },
  },
  {
    category: "명품",
    product: {
      url: "https://www.musinsa.com/products/7357727",
      domain: "www.musinsa.com",
      name: "남성 하이브리드 재킷 올모-Black (26WMPMHYRB12PJ0541)",
      brand: "PARA JUMPERS",
      image:
        "https://image.msscdn.net/thumbnails/images/goods_img/20260917/7357727/7357727_17896307775350_big.jpg?w=1000",
      price: 892050,
      currency: "KRW",
    },
  },
  {
    category: "명품",
    product: {
      url: "https://www.musinsa.com/products/5224986",
      domain: "www.musinsa.com",
      name: "미디움 로고 지갑 - 블랙 / SA2UI0008P7268H8419",
      brand: "MAISON MARGIELA",
      image:
        "https://image.msscdn.net/thumbnails/images/goods_img/20250703/5224986/5224986_17524591468256_big.jpg?w=1000",
      price: 280000,
      currency: "KRW",
    },
  },
  {
    category: "명품",
    product: {
      url: "https://www.musinsa.com/products/4996372",
      domain: "www.musinsa.com",
      name: "플림솔 하이탑 스니커즈 - 블랙 / 75010001WW015BN401",
      brand: "VIVIENNE WESTWOOD",
      image:
        "https://image.msscdn.net/thumbnails/images/goods_img/20250407/4996372/4996372_17459920503181_500.jpg",
      price: 120000,
      currency: "KRW",
    },
  },
  {
    category: "명품",
    product: {
      url: "https://www.musinsa.com/products/4408477",
      domain: "www.musinsa.com",
      name: "이완 후리스 점퍼 - 아이보리 / WVBCAM02855DAB",
      brand: "A.P.C.",
      image:
        "https://image.msscdn.net/thumbnails/images/goods_img/20240905/4408477/4408477_17268253407188_big.jpg?w=1000",
      price: 208990,
      currency: "KRW",
    },
  },
  {
    category: "명품",
    product: {
      url: "https://www.musinsa.com/products/4780577",
      domain: "www.musinsa.com",
      name: "빅하트 인타르시아 로고 울 니트 - 블랙 / BFUKS006018009",
      brand: "AMI",
      image:
        "https://image.msscdn.net/thumbnails/images/goods_img/20250212/4780577/4780577_17400138596848_big.jpg?w=1000",
      price: 317000,
      currency: "KRW",
    },
  },
  {
    category: "명품",
    product: {
      url: "https://www.musinsa.com/products/4493077",
      domain: "www.musinsa.com",
      name: "알파카 코튼 믹스 O넥 니트 - 로즈 바이올렛 / K2318295",
      brand: "GANNI",
      image:
        "https://image.msscdn.net/thumbnails/images/goods_img/20241007/4493077/4493077_17289529019986_big.jpg?w=1000",
      price: 99990,
      currency: "KRW",
    },
  },
  {
    category: "명품",
    product: {
      url: "https://www.musinsa.com/products/7435084",
      domain: "www.musinsa.com",
      name: "남성 롯지 자켓 블랙디스크(Black)_Q266AMDB08BKN",
      brand: "CANADAGOOSE",
      image:
        "https://image.msscdn.net/thumbnails/images/goods_img/20261001/7435084/7435084_17908251197562_big.jpg?w=1000",
      price: 1230000,
      currency: "KRW",
    },
  },
  {
    category: "명품",
    product: {
      url: "https://www.musinsa.com/products/7357688",
      domain: "www.musinsa.com",
      name: "남성 다운 푸퍼 재킷 클라우드-Black (26WMPMPUPP11PJ0541)",
      brand: "PARA JUMPERS",
      image:
        "https://image.msscdn.net/thumbnails/images/goods_img/20260917/7357688/7357688_17896306184960_big.jpg?w=1000",
      price: 1472500,
      currency: "KRW",
    },
  },
  {
    category: "명품",
    product: {
      url: "https://www.musinsa.com/products/4444746",
      domain: "www.musinsa.com",
      name: "볼드 폭스 헤드 엠브로이드 니트 - 베이지 / NM00812KT1112P245",
      brand: "MAISON KITSUNE",
      image:
        "https://image.msscdn.net/thumbnails/images/goods_img/20240919/4444746/4444746_17278360657686_big.jpg?w=1000",
      price: 273990,
      currency: "KRW",
    },
  },
  {
    category: "명품",
    product: {
      url: "https://www.musinsa.com/products/6935866",
      domain: "www.musinsa.com",
      name: "4 스티치 슬림 2 카드 홀더 - 블랙 / SA1VX0011P4455T8013",
      brand: "MAISON MARGIELA",
      image:
        "https://image.msscdn.net/thumbnails/images/goods_img/20260728/6935866/6935866_17860702785247_big.jpg?w=1000",
      price: 500000,
      currency: "KRW",
    },
  },
  {
    category: "명품",
    product: {
      url: "https://www.musinsa.com/products/7471707",
      domain: "www.musinsa.com",
      name: "태비 숄더 백 26 CCX04 LHBLK",
      brand: "COACH",
      image:
        "https://image.msscdn.net/thumbnails/images/goods_img/20261007/7471707/7471707_17914489531766_big.jpg?w=1000",
      price: 790000,
      currency: "KRW",
    },
  },
  {
    category: "명품",
    product: {
      url: "https://www.musinsa.com/products/4435622",
      domain: "www.musinsa.com",
      name: "울 크루넥 반소매 니트 - 그레이 / 800574Y76IY1473",
      brand: "SAINT LAURENT",
      image:
        "https://image.msscdn.net/thumbnails/images/goods_img/20240912/4435622/4435622_17272251448429_big.jpg?w=1000",
      price: 250000,
      currency: "KRW",
    },
  },
  {
    category: "잡화",
    concern:
      "심플한 니트에 포인트로 할 목걸이를 찾고 있어요. 매일 착용하기 괜찮을까요?",
    product: {
      url: "https://www.musinsa.com/products/4414610",
      domain: "www.musinsa.com",
      name: "(실버925) 리플 컬 팬던트 목걸이 NZ2426",
      brand: "TATIANA",
      image:
        "https://image.msscdn.net/thumbnails/images/goods_img/20240906/4414610/4414610_17260430323064_big.jpg?w=1000",
      price: 40500,
      currency: "KRW",
    },
  },
  {
    category: "잡화",
    concern: "베이지 코트에 두를 목도리로 고민 중이에요. 배색이 잘 어울릴까요?",
    product: {
      url: "https://www.musinsa.com/products/453220",
      domain: "www.musinsa.com",
      name: "투 톤 머플러 목도리 베이지&크림",
      brand: "PARTIMENTO",
      image:
        "https://image.msscdn.net/thumbnails/images/goods_img/20161124/453220/453220_2_500.jpg?w=1000",
      price: 19900,
      currency: "KRW",
    },
  },
  {
    category: "잡화",
    concern:
      "평소 실버 반지를 좋아해요. 다른 반지와 함께 레이어드해도 예쁠까요?",
    product: {
      url: "https://www.musinsa.com/products/4331023",
      domain: "www.musinsa.com",
      name: "star two track ring-grey",
      brand: "NFF",
      image:
        "https://image.msscdn.net/thumbnails/images/goods_img/20240814/4331023/4331023_17260355695629_big.jpg?w=1000",
      price: 35700,
      currency: "KRW",
    },
  },
  {
    category: "잡화",
    concern:
      "패딩에 가볍게 둘 퍼 목도리로 고민 중이에요. 겨울 데일리템으로 어때요?",
    product: {
      url: "https://www.musinsa.com/products/2839528",
      domain: "www.musinsa.com",
      name: "WOMEN 데일리 웜 히팅 퍼 목도리 [BLACK] 겨울 머플러 ver.",
      brand: "KOLEAT",
      image:
        "https://image.msscdn.net/thumbnails/images/goods_img/20221005/2839528/2839528_1_big.jpg?w=1000",
      price: 27200,
      currency: "KRW",
    },
  },
  {
    category: "잡화",
    concern:
      "시계 옆에 같이 착용할 팔찌를 찾고 있어요. 너무 과해 보이지 않을까요?",
    product: {
      url: "https://www.musinsa.com/products/6371759",
      domain: "www.musinsa.com",
      name: "공용 우레탄 헤마타이트 원석 팔찌 JSB-027",
      brand: "JULIUS1",
      image:
        "https://image.msscdn.net/thumbnails/images/goods_img/20260424/6371759/6371759_17840964024283_big.jpg?w=1000",
      price: 19900,
      currency: "KRW",
    },
  },
  {
    category: "잡화",
    concern:
      "어두운 아우터에 버터 컬러 목도리로 포인트를 주고 싶어요. 활용도 괜찮을까요?",
    product: {
      url: "https://www.musinsa.com/products/7459279",
      domain: "www.musinsa.com",
      name: "CLASSIC WOOL SCARF SOLID - BUTTER",
      brand: "ROCKFISH WEATHERWEAR",
      image:
        "https://image.msscdn.net/thumbnails/images/goods_img/20261006/7459279/7459279_17927359049407_big.jpg?w=1000",
      price: 52740,
      currency: "KRW",
    },
  },
  {
    category: "잡화",
    concern:
      "나를 위한 선물로 귀걸이를 골랐어요. 출근할 때도 자주 착용할 수 있을까요?",
    product: {
      url: "https://www.musinsa.com/products/4884984",
      domain: "www.musinsa.com",
      name: "러브 듀엣 14K 귀걸이 SA25A47U",
      brand: "STONEHENGE",
      image:
        "https://image.msscdn.net/thumbnails/images/goods_img/20250312/4884984/4884984_17441622673270_big.jpg?w=1000",
      price: 223200,
      currency: "KRW",
    },
  },
  {
    category: "신발",
    product: {
      url: "https://www.musinsa.com/products/7314173",
      domain: "www.musinsa.com",
      name: "에어 맥스 모토 2K W - 블랙:펜슬 포인트:울프 그레이:블랙 / IR1436-001",
      brand: "NIKE",
      image:
        "https://image.msscdn.net/thumbnails/images/goods_img/20260911/7314173/7314173_17914342452717_big.jpg?w=1000",
      price: 159000,
      currency: "KRW",
    },
  },
  {
    category: "신발",
    product: {
      url: "https://www.musinsa.com/products/7476990",
      domain: "www.musinsa.com",
      name: "스트랩 퍼 슬리퍼 블랙",
      brand: "GAP",
      image:
        "https://image.msscdn.net/thumbnails/images/goods_img/20261008/7476990/7476990_17914245510645_big.jpg?w=1000",
      price: 55900,
      currency: "KRW",
    },
  },
  {
    category: "신발",
    product: {
      url: "https://www.musinsa.com/products/7364840",
      domain: "www.musinsa.com",
      name: "CLOUDY LAYERED BOOTS - 3 colors",
      brand: "ROCKFISH WEATHERWEAR",
      image:
        "https://image.msscdn.net/thumbnails/images/prd_img/20260918/7364840/detail_7364840_17918050683032_big.jpg?w=1000",
      price: 198500,
      currency: "KRW",
    },
  },
  {
    category: "신발",
    product: {
      url: "https://www.musinsa.com/products/7160137",
      domain: "www.musinsa.com",
      name: "로우 프로파일 페니로퍼 [블랙]",
      brand: "MUSINSA STANDARD",
      image:
        "https://image.msscdn.net/thumbnails/images/goods_img/20260825/7160137/7160137_17937662499081_big.jpg?w=1000",
      price: 123390,
      currency: "KRW",
    },
  },
  {
    category: "신발",
    product: {
      url: "https://www.musinsa.com/products/6988767",
      domain: "www.musinsa.com",
      name: "재스퍼 여성 스니커즈 SAFARI/AQUIFER",
      brand: "KEEN",
      image:
        "https://image.msscdn.net/thumbnails/images/goods_img/20260804/6988767/6988767_17858213227212_big.jpg?w=1000",
      price: 169000,
      currency: "KRW",
    },
  },
  {
    category: "신발",
    product: {
      url: "https://www.musinsa.com/products/7542966",
      domain: "www.musinsa.com",
      name: "NBPDGF056C / U204L9G0 (CHARCOAL)",
      brand: "NEW BALANCE",
      image:
        "https://image.msscdn.net/thumbnails/images/goods_img/20261016/7542966/7542966_17926320685490_big.jpg?w=1000",
      price: 159000,
      currency: "KRW",
    },
  },
  {
    category: "신발",
    product: {
      url: "https://www.musinsa.com/products/7460361",
      domain: "www.musinsa.com",
      name: "[ONRU x kinchi x 스토커즈] DUAL/WKRS - 808",
      brand: "ONRU",
      image:
        "https://image.msscdn.net/thumbnails/images/goods_img/20261006/7460361/7460361_17923779227501_big.jpg?w=1000",
      price: 146300,
      currency: "KRW",
    },
  },
  {
    category: "신발",
    product: {
      url: "https://www.musinsa.com/products/7171391",
      domain: "www.musinsa.com",
      name: "[YOUHEE X OTZ] FUR PLATFORM CLOGS_BLACK",
      brand: "YOUHEE",
      image:
        "https://image.msscdn.net/thumbnails/images/goods_img/20260826/7171391/7171391_17932370604567_big.png?w=1000",
      price: 76420,
      currency: "KRW",
    },
  },
  {
    category: "명품",
    product: {
      url: "https://www.musinsa.com/products/5314755",
      domain: "www.musinsa.com",
      name: "4 스티치 체인 지갑 - 블랙 / SA1VL0038P4455T8013",
      brand: "MAISON MARGIELA",
      image:
        "https://image.msscdn.net/thumbnails/images/goods_img/20250812/5314755/5314755_17562585291897_big.jpg?w=1000",
      price: 540000,
      currency: "KRW",
    },
  },
  {
    category: "잡화",
    concern: "오래 두를 기본 블랙 머플러를 찾고 있어요. 캐시미어로 장만할까요?",
    product: {
      url: "https://www.musinsa.com/products/5248222",
      domain: "www.musinsa.com",
      name: "캐시미어 100 머플러 [블랙]",
      brand: "MUSINSA STANDARD",
      image:
        "https://image.msscdn.net/thumbnails/images/goods_img/20250715/5248222/5248222_17611154348093_big.jpg?w=1000",
      price: 94890,
      currency: "KRW",
    },
  },
  {
    category: "잡화",
    product: {
      url: "https://www.musinsa.com/products/7156399",
      domain: "www.musinsa.com",
      name: "베를린 그레인 레더 크로스 토트백 [BLACK]",
      brand: "BLAYER",
      image:
        "https://image.msscdn.net/thumbnails/images/prd_img/20260825/7156399/detail_7156399_17887634759347_big.jpg?w=1000",
      price: 118800,
      currency: "KRW",
    },
  },
  {
    category: "잡화",
    product: {
      url: "https://www.musinsa.com/products/7235571",
      domain: "www.musinsa.com",
      name: "Daily Shopper Bag / Navy",
      brand: "SSRL",
      image:
        "https://image.msscdn.net/thumbnails/images/goods_img/20260903/7235571/7235571_17884107703397_big.jpg?w=1000",
      price: 62100,
      currency: "KRW",
    },
  },
];
