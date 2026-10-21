# BUYORNOT AI 작업 규칙

## 시작 전

- README.md, docs/TEAM_GUIDE.md, docs/ARCHITECTURE.md를 읽는다.
- git status와 담당 이슈의 요구사항·완료 기준을 확인한다. 다른 사람의 변경을 덮어쓰거나 되돌리지 않는다.
- 클라우드 작업은 이미 격리되어 있다. 기존 체크아웃을 사용하고, 명시적으로 요청받지 않으면 worktree를 만들지 않는다.
- 기획에 없는 기능, 데이터베이스, 인증, 외부 API를 임의로 추가하지 않는다. 불명확한 제품 요구사항은 질문한다.

## 작업 범위

- 한 브랜치와 한 PR에는 하나의 목적만 담는다.
- 이슈에 담당 파일·폴더를 명시한다. 공용 컴포넌트, 전역 스타일, 의존성, 스키마, API 계약 변경은 팀과 먼저 조율한다.
- 실제 비밀값을 코드, 문서, 로그, 테스트에 넣지 않는다. 환경 변수 이름과 설명만 .env.example에 기록한다.
- 새 라이브러리는 기존 도구로 해결되지 않는 이유를 설명하고 최소한으로 추가한다.
- API 응답과 화면 데이터는 명시적인 타입을 사용한다. 서버 전용 비밀은 브라우저로 전달하지 않는다.
- 구현한 동작의 오류·빈 데이터·로딩 상태를 고려하고 키보드 접근성과 레이블을 유지한다.

## 검증 및 전달

- npm run check와 npm run build를 실행한다. 동작 변경에는 의미 있는 테스트를 추가한다.
- 통과·실패·미실행을 구분해 보고한다. 테스트를 건너뛰거나 약화해 통과시키지 않는다.
- PR에 목적, 범위, 검증 결과, 환경 변수/계약 변경, 남은 문제를 적는다.
- main에 직접 push하거나 force push하지 않는다. 게시·배포·병합은 명시적인 요청 없이 수행하지 않는다.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
