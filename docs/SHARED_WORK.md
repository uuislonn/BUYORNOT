# 통합본에서 함께 작업하기

현재 공유 기준은 `integration/community-curation` 브랜치입니다. 홈·살말 커뮤니티·큐레이션 룸·추천 숍·로그인·마이페이지가 연결되어 있습니다.

## 팀원: 기존 작업을 보존하고 시작

VS Code에서 BUYORNOT 폴더를 연 뒤 터미널에서 실행합니다. 수정 중인 파일이 있다면 먼저 현재 브랜치에 커밋합니다. 기존 폴더를 덮어쓰거나 작업을 삭제하지 않습니다.

```bash
git status
git fetch origin
git switch --track origin/feat/community-next
npm ci
npm run dev
```

이미 해당 브랜치가 로컬에 있다면 `git switch feat/community-next`와 `git pull --ff-only`를 사용합니다. Node.js 24와 npm 11이 필요합니다. 터미널에 표시된 주소를 열면 홈 화면으로 들어갑니다.

지혜의 다음 작업 브랜치는 `feat/curation-next`입니다. 두 브랜치는 같은 통합본에서 시작합니다.

## 담당 범위

- 팀원: `src/features/home/`, `src/features/community/` 중심으로 홈·살말 커뮤니티 수정
- 지혜: `src/app/(creator)/`, `src/app/(auth)/account/` 중심으로 큐레이션 룸·추천 숍·마이페이지 수정
- 공통 상단바 `src/components/site-header.*`, 전역 스타일, 인증, 의존성은 수정 전 서로 조율

## 수정 후 다시 합치기

```bash
npm run check
npm run build
git add 수정한파일경로
git commit -m "feat: 변경한 기능 설명"
git push
```

GitHub에서 **base를 `integration/community-curation`**, compare를 본인 작업 브랜치로 선택해 PR을 만듭니다. 변경 내용을 확인한 뒤 병합합니다. 다른 사람의 변경을 가져올 때는 작업을 먼저 커밋하고 다음 명령을 사용합니다.

```bash
git fetch origin
git merge origin/integration/community-curation
```

충돌이 있으면 양쪽 변경을 확인해 해결하고 검사를 다시 실행합니다. ZIP 폴더 덮어쓰기나 force push는 사용하지 않습니다.

## 로컬 설정과 데이터

소스와 이미지 자산은 공유되지만 `.env.local`, `.local-test-accounts/`, `.data/`는 Git에서 제외됩니다. 계정 비밀번호·서명 키·개인 활동 데이터는 GitHub에 올리지 않습니다. 따라서 다른 컴퓨터에는 지혜의 로컬 로그인 정보와 활동 목록이 자동 복사되지 않습니다. 커뮤니티 기본 상품과 큐레이션 기본 상품은 소스에 포함되어 있습니다.

실제 로그인 연결에는 `.env.example`을 참고해 본인의 `.env.local`을 설정합니다. 카카오 로그인은 Supabase 프로젝트 설정과 등록된 콜백 주소가 맞아야 합니다. 관리자 키는 브라우저 코드에 넣지 않습니다.
