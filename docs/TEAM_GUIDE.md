# 팀 개발 가이드

## 1. 참여

1. GitHub 초대를 수락하고 https://github.com/uuislonn/BUYORNOT 접근을 확인합니다.
2. Git과 Node.js 24 LTS를 설치합니다. npm을 공통 패키지 관리자로 사용합니다.
3. 아래 명령을 실행합니다.

```bash
git clone https://github.com/uuislonn/BUYORNOT.git
cd BUYORNOT
npm ci
npm run dev
```

서버 실행 후 터미널에 표시된 주소로 접속합니다. 기본 주소는 http://localhost:3000 입니다. 초기 화면은 개발 기반 확인용이며 제품 기능은 기획에 따라 구현합니다.

초기 구성에는 계정·DB·유료 API 키가 필요하지 않습니다. .env.example의 설명을 참고하고, 나중에 실제 값이 필요해지면 .env.local에만 저장합니다. 실제 값은 Git이나 AI 대화에 붙여넣지 않습니다.

## 2. 역할 나누기

기획서를 기준으로 기능별 GitHub 이슈를 만듭니다. 각 이슈에는 담당자 한 명, 요구사항, 완료 기준, 수정할 폴더, API/타입 계약을 적습니다. 화면만 나누고 같은 공통 파일을 동시에 고치지 않도록 주의합니다.

담당 예시(실제 배정은 기획 확정 후):

- A: 상품 탐색 기능 → src/features/catalog/
- B: 비교 기능 → src/features/comparison/
- C: 공용 UI와 화면 연결 → src/components/, src/app/

인증·DB·결제 등의 기술 선택은 아직 확정되지 않았습니다. 담당자가 각자 도입하지 말고 계약부터 합의합니다. 공통 타입 변경은 먼저 합의하고 작은 PR로 반영합니다.

## 3. 매 작업 순서

```bash
git switch main
git pull --ff-only origin main
git switch -c feat/12-feature-name
npm ci
# 담당 기능 구현
npm run check
npm run build
git add src/features/내기능/
git commit -m "feat: 기능 설명"
git push -u origin feat/12-feature-name
```

GitHub에서 main을 대상으로 PR을 만들고 팀원 한 명에게 리뷰를 요청합니다. 변경 파일과 diff에 비밀값이나 타인의 작업이 없는지 확인합니다. 리뷰와 CI 통과 후 병합하며, 원격 main을 강제로 덮어쓰지 않습니다.

충돌이 나면 작업을 먼저 커밋한 뒤 `git fetch origin`과 `git merge origin/main`으로 최신 변경을 가져와 해결합니다. 원래 작성자의 의도를 모르면 협의하고 검증을 다시 수행합니다. `reset --hard`나 force push로 해결하지 않습니다.

## 4. AI에 전달할 프롬프트

아래 양식을 복사해 빈칸을 채우세요. 저장소 접근이 가능한 AI 도구에서 사용합니다.

```text
BUYORNOT 저장소의 AGENTS.md, README.md, docs/ARCHITECTURE.md를 먼저 읽어줘.
담당 이슈: #번호 / 제목
기획서의 해당 요구사항: ...
완료 기준: ...
수정 허용 범위: src/features/기능명/ 및 관련 테스트
합의된 데이터/API 계약: ...
수정 전 git status를 확인하고 기존 변경을 보존해줘.
범위 밖 공통 파일이나 의존성 변경이 필요하면 먼저 이유를 알려줘.
기획에 없는 인증·DB·외부 API를 임의로 도입하지 마.
구현 후 npm run check와 npm run build를 실행하고,
변경 요약, 검증 결과, 남은 문제를 보고해줘. 자동 병합·배포는 하지 마.
```

AI가 만든 코드는 담당자가 읽고 실제 동작을 확인한 뒤 PR을 올립니다. AI 사용 여부가 코드 검토를 대체하지 않습니다.

## 5. 팀원에게 보내는 안내문

> BUYORNOT 개발 저장소: https://github.com/uuislonn/BUYORNOT
>
> 초대를 수락한 뒤 README.md와 docs/TEAM_GUIDE.md를 읽어 주세요. Node.js 24 LTS에서 `npm ci`, `npm run dev`로 시작합니다. 각자 담당 이슈와 기능 브랜치를 만들고, AI에는 AGENTS.md와 담당 범위를 먼저 전달해 주세요. 완료 후 `npm run check`, `npm run build`를 통과시키고 main 대상 PR을 보내 주세요. 공통 파일·API·의존성 변경은 먼저 팀과 조율합니다.

## 6. 검증과 운영 범위

- CI는 검증 절차이며 실제 배포나 브랜치 보호를 설정하지 않습니다.
- 기본 테스트는 health API의 응답 계약을 검증합니다. 제품 기능 검증은 기능 구현 시 추가합니다.
- 기능 변경에 따라 테스트 범위를 확장합니다. UI 동작은 렌더링/상호작용 테스트, 핵심 사용자 여정은 E2E 테스트를 추가합니다.
- 운영 도메인, DB, 인증, 배포와 모니터링은 기획 및 서비스 선택 이후 별도로 구성합니다.
