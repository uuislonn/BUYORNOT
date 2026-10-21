# Part B · 크리에이터 큐레이션

## 범위와 실행

이 디렉터리만 Part B가 소유합니다. 공통 레이아웃·전역 스타일·Part A·패키지/잠금파일은 변경하지 않습니다. 공통 UI가 없어 로컬 UI를 사용하며 컴포넌트에 `TODO: replace with UI component`를 표시했습니다.

```bash
npm ci
npm run dev
# /creators → /creators/seoa
npm run check
npm run build
npm start
```

기존 `/`는 초기 프로젝트 안내 화면을 유지합니다. Part A와 합칠 때 내비게이션에 `/creators`를 연결하면 됩니다. `/creators/[creatorId]`는 없는 룸에 404를 반환합니다.

## 구현 흐름

- 프로필: 커버/아바타, #0100FE 인증 체크, 소개, SNS 멀티 링크, 팔로우, 작성 CTA.
- 룸: ING/BUY/NOT/EXPIRED 탭, 카테고리, 최신/오래된순, URL 쿼리 동기화. 30일이 되는 순간 미답변만 만료됩니다. 카드 하단 바는 투표율이 아닌 응답 대기 기간입니다.
- 카드: 와이어프레임 기반 작성자 헤더 → 큰 세로 이미지 → 상품명/가격 칩 → 고민 → 대기 기간 → BUY/Don't buy. 판정은 룸 소유 크리에이터만 가능합니다.
- 작성: URL 입력 후 550ms 자동 Mock 미리보기, 중복 경고, 직접 상품 정보 입력, 150자 카운터, 태그 최대 4개, 신체 항목별 공개 스냅샷. 본인 글만 수정·삭제하며 판정/만료 후 수정은 막습니다.
- 판정: 선택과 코멘트 모달, 즉시 상태 반영, 서버 거부·연결 실패 시 이전 상태로 복구. BUY는 피드·숍에, NOT은 피드에만 반영됩니다.
- 피드/숍: 판정 완료 항목에서 파생됩니다. 삭제 시 연결 항목도 제거됩니다. 외부 쇼핑몰 이동은 비회원도 허용하며 `noopener noreferrer sponsored`를 사용합니다.
- 신청: 활동 정보 → 채널 코드 입력 → 확인/동의 3단계. 500명 + 10개 경계에서 패스트 트랙 여부를 표시하지만 자동 승인하지 않습니다. 정해지지 않은 일반 정량 기준은 임의로 만들지 않고 일반 심사로 접수합니다.
- 검토: 관리자만 신청 조회·승인·사유 포함 반려 가능. 승인하면 해당 프로필의 CREATOR/인증 상태 변경과 새 룸 생성을 함께 수행합니다. 반려 후 재신청 가능합니다.

## Mock 모드와 권한 경계

기본 인증·DB·외부 쇼핑몰 크롤링·어필리에이트 제공자는 **연결되지 않았습니다**. 화면 전체에 MOCK STUDIO를 표시합니다. 개발 서버 상단에서 방문자/일반 회원/크리에이터/관리자를 선택해 흐름을 확인하세요. 이 기능은 실제 로그인이 아닙니다.

서버 발급 임의 토큰을 HttpOnly/SameSite 쿠키에 저장하고, 브라우저별 별도 메모리 DB를 연결합니다. 서로 다른 브라우저의 데모 데이터는 공유되지 않습니다. 역할을 전환하거나 페이지를 새로 열어도 같은 세션에서는 유지되지만, 서버 재시작·HMR 조건·배포 인스턴스 변경 또는 6시간 후에는 사라질 수 있습니다. 사용자 ID/역할을 mutation 입력에서 받지 않고 서버 세션에서 읽습니다. 작성자/룸 소유자/관리자 검증을 모든 쓰기에 적용합니다.

공개 프로덕션 빌드에서는 참여와 데모 역할 전환을 기본 차단합니다. 로컬/제한된 데모 환경에서만 서버 변수 `CREATOR_DEMO_ENABLED=true`로 명시적으로 켤 수 있습니다. 이를 실제 운영 인증으로 사용하지 마세요. 기본 읽기 전용 샘플 화면에는 환경 변수나 키가 필요하지 않습니다.

## 서버 액션 계약

`_server/actions.ts`의 쓰기는 `Result<Snapshot>`을 반환합니다. 실패는 `ok: false`, `code`, 사용자용 `error`이고 성공은 `ok: true`, 갱신된 `data`입니다.

| 인터페이스                                                | 용도                                                  |
| --------------------------------------------------------- | ----------------------------------------------------- |
| getRoomSnapshot(creatorId)                                | 프로필, 요청/판정, 현재 사용자, 권한에 맞는 신청 정보 |
| previewProduct(url, creatorId)                            | 허용 URL 검증, 샘플 미리보기, 중복 요청 ID            |
| createCurationRequest(input)                              | 고민 생성                                             |
| updateCurationRequest(id, input)                          | 본인 미답변 고민 수정                                 |
| deleteCurationRequest(id, creatorId)                      | 본인 고민과 연결 데이터 삭제                          |
| evaluateCurationRequest(id, creatorId, decision, comment) | 룸 소유자의 단일 판정                                 |
| toggleRequestHeart / toggleCreatorFollow                  | 로그인 사용자 찜/팔로우 토글                          |
| getApplicationVerificationCode()                          | 세션별 신청 인증 코드                                 |
| submitCreatorApplication(input, creatorId)                | PENDING 신청 접수                                     |
| reviewCreatorApplication(id, creatorId, approve, reason)  | 관리자 검토                                           |
| setDemoIdentity(identity, creatorId)                      | 개발용 역할 전환; 운영 인증 아님                      |
| getAffiliateLink(url) (`_lib/product-url.ts`)             | 검증된 원본 링크 반환; 가짜 제휴 ID 없음              |

상세 화면은 snapshot의 요청 ID를 이용합니다. Part A용 posts/votes/clipboard 모듈은 만들지 않았습니다.

## 보안과 상품 미리보기

`_lib/product-url.ts`는 HTTPS, 정확한 허용 호스트, 기본 포트만 허용합니다. 사용자정보, IP/로컬 주소, 유사 도메인, 잘못된 스킴 등을 거부합니다. 추적 파라미터/프래그먼트/후행 슬래시를 제거해 중복을 확인합니다. **현재는 어떠한 사용자 URL에도 네트워크 요청을 하지 않으므로 서버 측 외부 요청이 발생하지 않습니다.**

실제 크롤링 어댑터를 붙일 때는 이 문자열 검사만으로 SSRF가 완성되지 않습니다. DNS의 모든 A/AAAA 주소와 리디렉션 각 단계를 검증하고 사설/루프백/메타데이터 IP를 차단해야 합니다. DNS 재바인딩 방지, 응답 크기/타임아웃, 콘텐츠 타입, 이미지 URL 프록시 정책도 필요합니다. 상용 크롤링 API 또는 통제된 메타데이터 서비스를 권장합니다.

신체 정보는 체크한 항목의 허용 키만 서버에서 다시 검증해 저장합니다. 가격은 원화 정수 또는 null이고 없는 가격을 만들지 않습니다. 사용자 입력을 HTML로 삽입하지 않습니다. 외부 SNS 링크는 신청 단계의 채널 호스트와 HTTPS를 검증합니다.

## Supabase / Vercel 연결 지점

코드의 `TODO: connect to lib/supabase`를 공통 인증·DB 어댑터로 교체하세요. 현재 환경 변수를 추가하거나 Supabase 프로젝트/유료 서비스에 접속하지 않았습니다. Vercel은 메모리 저장소를 영구 보존하지 않으므로 운영 전에 이 교체가 필수입니다.

- 공통 팀에서 `profiles(user_id, role, nickname, bio_text, social_links, is_verified_creator)` 계약을 확정합니다.
- `_server/supabase-schema.sql`은 **미적용 통합 검토 초안**입니다. 공통 profiles/auth가 준비된 후 합의된 migrations 위치로 옮겨 검토·적용해야 합니다.
- 실제 인증에는 공통 모듈의 `auth.getUser()` 결과를 사용하고, 프로필 역할·채널 검증·승인은 클라이언트 입력으로 신뢰하지 않습니다.
- DB UNIQUE/트랜잭션/RLS로 중복·단일 판정·권한을 보장합니다. 승인과 역할 변경은 검증된 관리자만 실행할 수 있는 DB 트랜잭션/RPC로 작성해야 합니다. 초안은 직접 INSERT/UPDATE를 기본 거부하므로 승인 기능을 바로 운영할 수 없습니다.
- 검토할 변수 이름: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. 실제 값은 배포 환경 설정에 저장하고 공통 인증 팀과 확정합니다. 현재 코드에서는 사용하지 않습니다. 서버 관리자 키를 브라우저에 넣지 마세요.
- 실제 소셜 OAuth, 상품 크롤링, 제휴 링크 제공자, 팔로워·채널 소유권 자동 확인, 업로드/Storage 정책, 공유 데이터 영속성은 추가 연결이 필요합니다.

## 확인 순서

1. 비회원으로 작성/하트/팔로우/ING 카드 판정 버튼 클릭 → 로그인 필요 모달. 외부 상품 링크는 새 창 이동 가능.
2. 일반 회원으로 작성 → URL 미리보기 → 150자/태그/공개 항목 → 등록·수정·삭제. 샘플 URL `https://www.musinsa.com/products/4100101`은 중복 경고.
3. 크리에이터로 ING 카드 판정 → 상태 탭·피드 반영, BUY만 숍 반영. 다른 계정은 판정 불가.
4. 일반 회원으로 3단계 개설 신청 → 관리자 역할에서 검토 → 승인 → 일반 회원 역할로 돌아오면 CREATOR와 인증 뱃지, 새 룸 링크 확인.
5. 반려 시 사유 표시·재신청 확인. 카테고리·상태·정렬 후 새로고침하면 URL 필터 유지.
6. 390px 모바일 단일 열, 데스크톱 3열, 1600px 이상 4열 카드 확인. 모달 키보드 탭/ESC와 오류 메시지 확인.
7. `npm run check`, `npm run build`. 기본 프로덕션에서 역할 전환이 없고, 참여가 차단되는지 확인.

## 샘플 이미지

`_assets/curation-editorial.png`는 이 프로젝트의 Mock UI를 위해 생성한 AI 사진입니다. 실제 크리에이터, 브랜드 또는 상품 사진이 아닙니다. 하나의 로컬 이미지 시트를 CSS로 나누어 렌더링하므로 외부 이미지 호스트 허용이나 공통 next.config 변경이 필요하지 않습니다. 실제 제품 연동 시 승인된 상품 이미지로 교체하세요.

## 브라우저 회귀 검사 (선택 도구, 공통 의존성 변경 없음)

Linux에서 시스템 Chromium이 있는 경우 아래 명령으로 검증한 브라우저 흐름을 재현할 수 있습니다. 테스트 전용 프로덕션 데모 서버를 별도 터미널에서 먼저 실행하세요. 테스트는 독립 브라우저 세션에서 Mock 데이터만 변경합니다.

```bash
# 터미널 1: 검증용 서버 (실제 운영용 설정이 아님)
npm run build
CREATOR_DEMO_ENABLED=true npm start -- --port 3001

# 터미널 2: 테스트 도구는 저장소 밖에 설치
npm install --prefix /tmp/buyornot-browser --cache /tmp/buyornot-npm-cache playwright@1.64.1
PLAYWRIGHT_INSTALL_DIR=/tmp/buyornot-browser CHROMIUM_PATH=/usr/bin/chromium node 'src/app/(creator)/_tests/browser-smoke.mjs'
```

기본 주소는 내부 검증용 `http://127.0.0.1:3001`입니다. 다른 주소는 `CREATOR_TEST_BASE_URL`로 지정합니다. 외부 쇼핑몰 응답은 테스트에서 가로채 새 창 열기만 검증하므로 실제 상품 판매/구매 가능 여부를 보장하지 않습니다. 네트워크 실패를 주입해 Optimistic UI 복구도 검증합니다. 스크린샷은 `/tmp/creator-desktop-final.png`, `/tmp/creator-mobile-final.png`에 저장됩니다.

현재 클라우드의 개발 서버 WebSocket/HMR 연결이 브라우저에서 실패하는 현상이 있어, 상호작용 검증은 위 프로덕션 데모 서버에서 수행합니다. 일반 로컬 개발은 `npm run dev`를 사용하고, 이 환경에서 상호작용이 비활성화되면 검증용 서버를 사용하세요.
