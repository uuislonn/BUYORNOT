export default function Home() {
  return (
    <main>
      <p className="eyebrow">BUYORNOT · TEAM WORKSPACE</p>
      <h1>함께 만드는 BUYORNOT</h1>
      <p className="description">
        프로젝트 개발 기반이 준비되었습니다. 제품 화면과 기능은 기획서를
        기준으로 구현합니다.
      </p>
      <section aria-labelledby="start-heading">
        <h2 id="start-heading">개발 시작하기</h2>
        <ol>
          <li>팀 가이드와 AI 작업 규칙을 읽습니다.</li>
          <li>담당 이슈와 기능 브랜치를 만듭니다.</li>
          <li>구현과 검증을 마친 후 PR로 리뷰를 요청합니다.</li>
        </ol>
        <a href="https://github.com/uuislonn/BUYORNOT/blob/main/docs/TEAM_GUIDE.md">
          팀 개발 가이드 보기 <span aria-hidden="true">↗</span>
        </a>
      </section>
    </main>
  );
}
