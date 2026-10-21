# BUYORNOT

팀원들이 AI 도구와 함께 기능별로 개발할 수 있는 웹 프로젝트 기반입니다. 제품 요구사항은 추후 기획서에 따라 구현합니다.

## 시작

Node.js **24 LTS**와 npm 11이 필요합니다. nvm 사용자는 `nvm install && nvm use`로 저장소 버전을 적용하세요.

```bash
npm ci
npm run dev
```

개발 서버 기본 포트는 3000입니다. 초기 구성은 외부 서비스와 비밀값 없이 실행됩니다. 환경 변수 설명은 .env.example을 참고하세요.

## 명령

| 명령               | 용도                          |
| ------------------ | ----------------------------- |
| npm run dev        | 개발 서버                     |
| npm run check      | 린트, 타입, 테스트, 포맷 확인 |
| npm run test:watch | 테스트 감시 모드              |
| npm run format     | 포맷 적용                     |
| npm run build      | 프로덕션 빌드                 |
| npm start          | 빌드 결과 실행                |

`GET /api/health`는 `{"status":"ok","service":"buyornot"}`를 반환합니다. 새 기능 테스트는 소스 옆 `*.test.ts`로 작성합니다. 브라우저 전용 UI 테스트와 E2E 도구는 기능 요구사항에 맞춰 추가합니다.

## 팀 문서

- [팀 개발 가이드 및 전달용 안내문](docs/TEAM_GUIDE.md)
- [구조와 공통 계약](docs/ARCHITECTURE.md)
- [AI 작업 규칙](AGENTS.md)

기능별 이슈 → 기능 브랜치 → 검증 → PR 리뷰 → 병합 순서로 작업합니다. 초기 CI는 main 대상 PR과 main push에서 실행됩니다. 브랜치 보호는 자동 설정되지 않으므로 저장소 소유자가 필요에 따라 리뷰·CI 필수 조건을 설정하세요.
