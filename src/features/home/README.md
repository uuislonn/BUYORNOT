# 홈 화면

홈과 커뮤니티의 상단바는 `src/components/site-header.tsx`와 전용 CSS 모듈을 함께 사용합니다. 로고는 홈, Curation Room은 홈의 소개 영역, Community는 피드로 연결됩니다. 커뮤니티의 로그인·로그아웃 콜백과 처리 중 버튼 비활성화를 유지합니다.

사용자가 제공한 HTML과 이미지에 맞춰 `/`에 홈을 구성했습니다. 파스텔 히어로, 두 줄 헤드라인, Curation Room·Community 소개, CSS 그래픽 두 종류, 체크 패턴의 About me와 푸터를 제공합니다. 스타일은 `home.module.css` 내부로 한정하며 외부 폰트·Tailwind CDN·새 의존성은 추가하지 않았습니다.

기존 80개 카드 커뮤니티는 `/community`로 연결됩니다. 커뮤니티 상단 로고는 `/`로, 홈의 Explore the Feed와 Community 링크는 `/community`로 이동합니다. Login은 기존 로그인 모달을 재사용하며 성공하면 커뮤니티로 이동합니다.

Curation Room 메뉴는 소개 영역으로 스크롤합니다. 본기능은 아직 없으므로 소개 버튼은 준비 안내를 띄웁니다. 공식 SNS 주소도 제공되지 않아 아이콘은 채널 준비 안내를 띄웁니다. 실제 크리에이터 기능이나 SNS 주소를 임의로 추가하지 않았습니다. 환경 변수·API·DB 계약 변경은 없습니다.

검증: `npm run check`, `npm run build`. `home.test.ts`는 홈·피드 경로 분리와 헤드라인·소개·로고·피드 링크를 확인합니다. 브라우저에서는 로고 왕복 이동, 로그인 모달 열기·닫기, 큐레이션 준비 안내, 작은 화면의 레이아웃을 확인합니다.
