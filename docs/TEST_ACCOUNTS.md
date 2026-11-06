# BUYORNOT 테스트 계정

대상 프로젝트: `pkificlqlouynhsimjjk`. 개인 카카오 계정은 삭제하지 않는다.

| 구분       | 로그인 이메일                     | 닉네임            |
| ---------- | --------------------------------- | ----------------- |
| 일반 회원  | member.test@buyornot.example.com  | 일반회원 테스트   |
| 크리에이터 | creator.test@buyornot.example.com | 크리에이터 테스트 |

이 주소는 이메일 발송용이 아닌 테스트 로그인 식별자다. 관리자가 테스트 계정 두 개만 이메일 인증 완료 상태로 만들며, 일반 회원가입의 이메일 인증 설정은 변경하지 않는다.

## 실행

Supabase 프로젝트 관리자 Secret key 또는 service_role 키를 Git에서 제외된 `.env.local`의 `SUPABASE_SECRET_KEY`에 로컬로 설정한다. `NEXT_PUBLIC_` 접두사를 붙이지 않는다. 키를 채팅에 보내지 않는다.

```sh
node scripts/setup-test-accounts.mjs --cleanup-jihye
```

- 서로 다른 무작위 비밀번호로 계정을 생성하고 실제 비밀번호 로그인을 검증한다.
- 비밀번호는 콘솔에 출력하지 않고 Git에서 제외된 `.local-test-accounts/credentials.json`에 소유자 전용 권한으로 저장한다.
- 이미 존재하는 계정의 비밀번호를 초기화하거나 역할을 변경하지 않는다.
- 관리자만 지정 가능한 `app_metadata.buyornot_role`로 일반 회원과 크리에이터를 구분한다. 회원 본인이 변경하는 user_metadata의 역할은 무시한다.
- 정리 옵션은 지혜 이름과 기존 확인용 문구가 정확히 일치하는 seoa 룸의 테스트 글 1개만 삭제한다. 개인 계정과 다른 글은 유지한다. 대상이 여러 개면 중단한다.

## 현재 범위

계정 생성 도구와 계정 유형 표시·서버 역할 판별을 준비했다. 실제 실행에는 관리자 키가 필요하다. 실행 완료 로그를 확인하기 전에는 계정 생성이나 글 삭제가 완료된 것으로 간주하지 않는다.

현재 실제 크리에이터 답변 저장소와 룸 소유권 연결은 구현되지 않아 크리에이터 계정 생성만으로 판정 기능이 활성화되지는 않는다. 개인 계정에는 크리에이터 권한을 부여하지 않는다.

Admin API 문서: https://supabase.com/docs/reference/javascript/auth-admin-createuser

## 로컬 아이디 로그인 추가

사용자가 지정한 관리자·일반회원·크리에이터 아이디는 Supabase 인증과 분리된 로컬 테스트 로그인으로 구성했다. `BUYORNOT_LOCAL_TEST_LOGIN=true`와 `NODE_ENV=development`, loopback 호스트가 모두 필요하다. 운영 빌드에서는 활성화되지 않는다.

설정: `.local-test-accounts/local-logins.json` (salted scrypt 해시와 세션 서명 키). 사용자 지정 비밀번호는 문서나 소스에 저장하지 않는다. 로그인 화면에 아이디를 입력하면 된다. 세션은 HttpOnly 쿠키이며 6시간 후 만료된다.

활동: `.local-test-accounts/activity.json`에 테스트 계정끼리 공유하는 큐레이션 데이터가 저장된다. 실제 개인 계정의 Supabase 글과 분리되어 있으며 서버 재시작 후에도 테스트 활동을 불러온다. 기존 큐레이션 서비스의 소유권 검사를 적용해 일반회원은 본인 글을 관리하고, 크리에이터는 연결된 룸에서 판정하고, 관리자는 신청 승인 관리를 확인할 수 있다. 커뮤니티 기능은 아직 구현 전이다.

이 로컬 계정들은 Supabase에 만들어진 실제 회원이 아니며, 개인 계정의 기존 글을 삭제하지 않는다. 앞의 관리자 API 도구는 별도로 실행하지 않았다.
