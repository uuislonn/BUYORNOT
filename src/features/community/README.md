# Part A · 살말 커뮤니티

브랜치: `feat/part-a-community`. 담당 이슈 번호는 아직 전달되지 않았습니다.
수정 범위: `src/features/community/`, 승인받은 `src/app/page.tsx` 및 `src/app/layout.tsx`. 의존성·공통 스타일·파트 B 변경 없음.

## 메인 연결 (사용자 승인 후 적용 완료)

`src/app/page.tsx`를 아래 코드로 교체합니다.

```tsx
import Community from "@/features/community/community";

export default function Home() {
  return <Community />;
}
```

`layout.tsx`의 description은 `함께 고르는 구매 고민 투표 커뮤니티`로 변경합니다.
사용자 승인에 따라 메인 화면과 메타데이터 연결을 적용했습니다.

## 구현

- 공개 피드 및 본인 게시글, 모바일 1열 / 데스크톱 2열 / 1450px 이상 4열
- 카테고리 6종, 최신/인기 정렬, 쿼리 보존 및 브라우저 뒤로/앞으로 동기화
- 상세 모달, 로그인 필요 모달, 명시적으로 표시한 Mock 데모 로그인/로그아웃
- 작성/수정/삭제, 300자 제한 및 카운터, 공개 범위, 항목별 신체 정보 스냅샷
- BUY/NOT 추가·취소·변경, 낙관적 반영과 오류 복원, 저장 중 중복 클릭 차단
- 클립보드: 명시적 사용자 클릭 후 브라우저 권한 내 읽기, 링크 확인 모달, 직접 붙여넣기 대안
- 서버 작성자 검증, 비공개 데이터 필터, 세션 만료 및 위조 쿠키 거부
- 상품 URL 허용 목록, HTTPS 강제, 인증정보/비표준 포트 차단
- 오류·빈 결과·로딩 처리, 모달 Escape/포커스 제한 및 키보드 레이블

## Mock 인터페이스

`actions.ts`: `loadCommunity`, `getPost`, `savePost(input, id?)`, `deletePost`, `votePost`, `getProductInfo`, `loginDemo`, `logoutDemo`.
각 응답은 `Result<T>` (`{ok:true,data:T}` 또는 `{ok:false,error:string}`)입니다.
타입은 `types.ts`. 로그인 사용자는 클라이언트 인자가 아니라 서버 쿠키의 무작위 세션으로 판별합니다.
`store.ts`는 프로세스 메모리에만 저장합니다. 재시작·서버리스 인스턴스 간 영속성을 보장하지 않습니다.
데모는 실제 인증이 아니며 운영 배포 전 교체해야 합니다. 로그아웃 후 새 데모 세션은 다른 사용자입니다.

`product.ts`는 메타데이터 **Mock**이며 실제 크롤링을 수행하지 않습니다. 샘플 피드의 상품·가격·사진은 예시로 실제 쇼핑몰 상품과 일치하지 않을 수 있습니다.
새 URL은 도메인 기반 플레이스홀더를 반환하며 실제 가격처럼 표시하지 않습니다.
사진은 외부 Unsplash URL을 사용합니다. 로딩 실패 시 product-image.tsx의 로컬 SVG 예시 일러스트를 표시하며 SAMPLE IMAGE로 구분합니다.
`clipboard-modal.tsx`가 로컬 클립보드 모듈이며 공용 `/lib/clipboard`는 추가하지 않았습니다.

## DB 연결 계약

실제 DB와 마이그레이션은 추가하거나 실행하지 않았습니다. 공유 스키마 조율 후 다음 계약으로 연결합니다.

- `posts`: UUID PK, author_id FK, product_url/domain/name/brand/image, price_amount, currency, category CHECK, concern_text CHECK 1~300, visibility CHECK, body_profile_snapshot JSONB, created_at/updated_at/deleted_at, share_token_hash.
- `votes`: UUID PK, post_id FK, user_id FK, choice CHECK BUY/NOT, UNIQUE(post_id,user_id), created_at/updated_at.
- `profiles`: user_id PK, nickname 및 기획의 프로필 필드. OAuth의 사용자 ID와 매핑.
- RLS: 공개·미삭제 또는 본인 게시글만 읽기, 작성/수정/삭제는 auth.uid() 검증, 투표는 접근 가능한 글과 현재 사용자만 허용.
- 집계는 DB 트랜잭션/RPC로 처리. 리얼타임 구독은 권한 필터 후 적용.
- FOLLOWERS는 팔로우 관계, LINK_ONLY는 만료/회수 가능한 해시 토큰 검증 후 열람. 현재 Mock에서는 본인만 조회하도록 제한.

`store.ts`, `product.ts`의 `// TODO: connect to lib/supabase` 지점에서 교체합니다.
현재 필요한 환경 변수는 없습니다. 추후 Supabase 도입 시 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`가 필요하며 인증 방식·키 계약부터 조율합니다. 서버 권한 키는 클라이언트로 전달하지 않습니다.
실제 수집기는 DNS 결과의 모든 IP를 검증하고, 연결 IP를 고정하며, 리다이렉트마다 재검증하고, 타임아웃/응답 크기를 제한해야 합니다. 현재는 네트워크 요청 자체가 없습니다.

## 실행 및 검증

Node 24 / npm 11에서 `npm ci`, `npm run check`, `npm run build`.
메인 연결 후 `npm run dev`로 확인합니다.
`community.test.ts`: URL 공격 차단, 비회원 차단, 투표 취소/변경/집계, 소유자 수정/삭제, 비공개 필터, 스냅샷, 입력 검증, 위조/만료 세션.

수동 확인 순서: 비회원 투표 → 로그인 모달, 쇼핑몰 링크는 이동 허용 → 데모 로그인 → 생성 → BUY 재클릭 취소/NOT 변경 → 수정/삭제 → 필터/정렬/뒤로가기 → 클립보드 허용/거부 → 모바일 배치.
Chromium에서 비회원 투표 차단, 데모 로그인, 투표/취소, 카테고리 및 URL 쿼리, 게시글 작성/수정/삭제를 확인했습니다. 외부 링크 실접속은 미검증이며, 다른 사용자의 투표를 푸시하는 실시간 구독은 미구현입니다.

## PR 초안

제목: `feat: Part A 살말 커뮤니티 Mock 기능 구현`

초기 Next.js 화면에 연결할 살말 커뮤니티 기능 모듈을 추가합니다. 카테고리·정렬, 작성·수정·삭제, 권한 검증, BUY/NOT 낙관적 투표와 클립보드 입력을 제공하며 실제 서비스 연결 전임을 UI에 표시합니다.

사용자 승인 후 page.tsx의 메인 화면 및 layout.tsx의 메타데이터 설명을 연결했습니다. 의존성·전역 스타일·환경 변수·실제 DB 계약 변경은 없습니다. OAuth, 영속 DB/RLS, 팔로워/공유 토큰, 실시간 집계 구독, 상품 수집기는 후속 연동 대상입니다. PR 제출·push·배포·병합은 수행하지 않았습니다.

## 실제 검증 결과 (2026-10-21)

- `npm run check`: 통과. ESLint, Next typegen + tsc, Vitest 22/22, Prettier 통과.
- `git diff --check`: 통과.
- `npm run build`: 통과. 기본 샌드박스에서는 하위 프로세스 실행 제한으로 TypeScript CLI 출력이 비어 파싱 오류가 발생했습니다. 허용된 실행 환경에서 동일한 `npm run build`로 컴파일·타입 검사·정적 페이지 생성·빌드 추적을 완료했습니다. 이 문제를 우회하기 위한 소스·Next 설정·의존성 변경은 없습니다.
- Chromium 브라우저 검증: HTTP 200, 샘플 카드 6개, 비회원 차단, 데모 로그인, 투표/취소, 카테고리 필터 및 쿼리, 작성/수정/삭제 통과. 390px 모바일 가로 넘침 없음. pageerror 없음. 데스크톱·모바일 실제 화면 캡처 완료.
- 외부 Unsplash 이미지는 환경 네트워크 정책에서 HTTP 403으로 차단되어 로컬 예시 일러스트로 대체 표시됨.
- 실제 DB 마이그레이션, OAuth, 외부 상품 수집, 배포: 미실행.
