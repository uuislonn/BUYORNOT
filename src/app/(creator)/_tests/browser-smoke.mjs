import { createRequire } from "node:module";
import { resolve } from "node:path";
const require = createRequire(
  resolve(
    process.env.PLAYWRIGHT_INSTALL_DIR ?? "/tmp/buyornot-browser",
    "package.json",
  ),
);
const { chromium } = require("playwright");
import assert from "node:assert/strict";
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
const origin = process.env.CREATOR_TEST_BASE_URL ?? "http://127.0.0.1:3001";
const check = (name) => console.log("PASS:", name);
async function role(value) {
  await page.getByLabel("데모 역할", { exact: true }).selectOption(value);
  await page.waitForFunction((v) => {
    const e = document.querySelector('select[aria-label="데모 역할"]');
    return e && !e.disabled && e.value === v;
  }, value);
}
async function close() {
  await page
    .getByRole("dialog")
    .last()
    .getByRole("button", { name: "닫기", exact: true })
    .click();
}
async function tab(name) {
  await page.getByRole("tab", { name }).click();
  await page.waitForTimeout(200);
}
try {
  await page.goto(origin + "/creators");
  await page.waitForURL("**/creators/seoa");
  await page.getByRole("button", { name: "살말 고민 작성하기" }).click();
  await page
    .getByRole("dialog", { name: "로그인이 필요한 서비스입니다." })
    .waitFor();
  await close();
  await page
    .getByRole("button", { name: "소프트 부클 숏 재킷 찜하기" })
    .click();
  await page
    .getByRole("dialog", { name: "로그인이 필요한 서비스입니다." })
    .waitFor();
  await close();
  await page.getByRole("button", { name: "취향 팔로우", exact: true }).click();
  await page
    .getByRole("dialog", { name: "로그인이 필요한 서비스입니다." })
    .waitFor();
  await close();
  await page
    .getByRole("button", { name: "소프트 부클 숏 재킷 BUY 판정" })
    .click();
  await page
    .getByRole("dialog", { name: "로그인이 필요한 서비스입니다." })
    .waitFor();
  await close();
  check("guest write/heart/follow/judgment login modal");
  await page.getByLabel("정렬", { exact: true }).selectOption("oldest");
  await page.waitForFunction(
    () =>
      document
        .querySelector("article[data-request-id]")
        ?.getAttribute("data-request-id") === "req-3",
  );
  await page.getByLabel("정렬", { exact: true }).selectOption("latest");
  await page.waitForFunction(
    () =>
      document
        .querySelector("article[data-request-id]")
        ?.getAttribute("data-request-id") === "req-1",
  );
  await page.getByRole("tab", { name: /^큐레이션 룸/, selected: true }).focus();
  await page.keyboard.press("ArrowRight");
  await page
    .getByRole("tab", { name: /^크리에이터 피드/, selected: true })
    .waitFor();
  await page.keyboard.press("ArrowLeft");
  await page
    .getByRole("tab", { name: /^큐레이션 룸/, selected: true })
    .waitFor();
  check("sort order and keyboard tab navigation");

  const external = page.getByRole("link", {
    name: "소프트 부클 숏 재킷 외부 쇼핑몰에서 보기",
  });
  assert.equal(await external.getAttribute("target"), "_blank");
  assert.match(
    await external.getAttribute("href"),
    /^https:\/\/www.musinsa.com/,
  );
  await context.route("https://www.musinsa.com/**", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: "<h1>Mock external shopping destination</h1>",
    }),
  );
  const popupPromise = context.waitForEvent("page");
  await external.click();
  const popup = await popupPromise;
  await popup.waitForLoadState();
  assert.match(popup.url(), /^https:\/\/www.musinsa.com/);
  await popup.close();
  check(
    "guest external link opens independently of login (destination intercepted for test)",
  );
  await role("member");
  await page.getByRole("button", { name: "취향 팔로우", exact: true }).click();
  await page.getByRole("button", { name: "팔로잉", exact: true }).waitFor();
  await page
    .getByRole("button", { name: "소프트 부클 숏 재킷 찜하기" })
    .click();
  await page
    .getByRole("button", { name: "소프트 부클 숏 재킷 찜 취소" })
    .waitFor();
  check("member follow and heart persist");
  await page
    .getByRole("button", { name: "소프트 부클 숏 재킷 BUY 판정" })
    .click();
  await page
    .getByRole("dialog", { name: "크리에이터의 선택을 기다려 주세요" })
    .waitFor();
  await close();
  check("member cannot evaluate");
  await page.getByRole("button", { name: "살말 고민 작성하기" }).click();
  await page
    .getByLabel("상품 URL")
    .fill("https://www.musinsa.com/products/4100101");
  await page
    .getByRole("dialog", { name: "이미 함께 고민 중인 상품이에요" })
    .waitFor();
  await page.getByRole("button", { name: "기존 룸으로 돌아가기" }).click();
  check("duplicate link modal");
  await page.getByRole("button", { name: "살말 고민 작성하기" }).click();
  await page
    .getByLabel("상품 URL")
    .fill("https://www.musinsa.com/products/99001234");
  await page.getByText("MOCK PREVIEW", { exact: true }).waitFor();
  await page.getByLabel("상품명", { exact: true }).fill("브라우저 테스트 코트");
  await page.getByLabel("브랜드", { exact: true }).fill("TEST BRAND");
  await page
    .getByLabel("어떤 점이 고민인가요?")
    .fill("출근할 때 입으려고 해요. 핏이 괜찮을까요?");
  await page.getByRole("button", { name: "#출근룩", exact: true }).click();
  await page.getByLabel("키 (cm) 공개", { exact: true }).check();
  await page.getByLabel("키 (cm)", { exact: true }).fill("158");
  await page
    .getByRole("button", { name: "고민 등록하기", exact: true })
    .click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  const created = page.locator("article[data-request-id]").filter({
    has: page.getByRole("link", {
      name: "브라우저 테스트 코트 외부 쇼핑몰에서 보기",
    }),
  });
  await created.waitFor();
  await created.getByRole("button", { name: "고민 상세" }).click();
  await page.getByRole("dialog").getByText("158", { exact: true }).waitFor();
  assert.equal(
    await page
      .getByRole("dialog")
      .getByText("몸무게 (kg)", { exact: true })
      .count(),
    0,
  );
  await close();
  await created.getByRole("button", { name: "수정", exact: true }).click();
  await page.getByLabel("어떤 점이 고민인가요?").fill("고민 수정 완료");
  await page.getByRole("button", { name: "수정 저장하기" }).click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  await created.getByText("고민 수정 완료", { exact: true }).waitFor();
  check("create/update/details with selected body specs");
  await page.reload();
  await page
    .getByRole("link", { name: "브라우저 테스트 코트 외부 쇼핑몰에서 보기" })
    .waitFor();
  check("session data survives page reload");
  await role("creator");
  await page
    .getByRole("button", { name: "브라우저 테스트 코트 BUY 판정" })
    .click();
  await page.getByLabel("선택의 이유를 한 줄로").fill("출근룩에 잘 어울려요.");
  await page.getByRole("button", { name: "BUY 판정 남기기" }).click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  await page.getByRole("status").filter({ hasText: "BUY 판정이" }).waitFor();
  assert.equal(
    await page
      .getByRole("link", { name: "브라우저 테스트 코트 외부 쇼핑몰에서 보기" })
      .count(),
    0,
  );
  await tab(/^크리에이터 피드/);
  await page.getByText("출근룩에 잘 어울려요.", { exact: true }).waitFor();
  await tab(/^추천 숍/);
  await page
    .getByRole("heading", { name: "브라우저 테스트 코트 ↗", exact: true })
    .waitFor();
  check("BUY immediately leaves ING, appears in feed and shop");
  await tab(/^큐레이션 룸/);
  await page
    .getByRole("button", { name: "빈티지 레더 블루종 NOT 판정" })
    .click();
  await page
    .getByLabel("선택의 이유를 한 줄로")
    .fill("핏을 다시 확인해 주세요.");
  await page.getByRole("button", { name: "NOT 판정 남기기" }).click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  await page.getByRole("status").filter({ hasText: "NOT 판정이" }).waitFor();
  await tab(/^추천 숍/);
  assert.equal(
    await page.getByRole("heading", { name: "빈티지 레더 블루종 ↗" }).count(),
    0,
  );
  check("NOT does not enter shop");
  await tab(/^큐레이션 룸/);
  const failAction = async (route) => {
    if (route.request().method() === "POST") await route.abort("failed");
    else await route.continue();
  };
  await page.route("**/creators/seoa*", failAction);
  await page
    .getByRole("button", { name: "데일리 레더 숄더백 BUY 판정" })
    .click();
  await page.getByRole("button", { name: "BUY 판정 남기기" }).click();
  await page
    .getByRole("alert")
    .filter({ hasText: "변경을 되돌렸습니다" })
    .waitFor();
  await page
    .getByRole("button", { name: "데일리 레더 숄더백 BUY 판정" })
    .waitFor();
  await page.unroute("**/creators/seoa*", failAction);
  check("optimistic judgment rolls back after network failure");
  await tab(/^큐레이션 룸/);
  await page.getByRole("button", { name: "뷰티", exact: true }).click();
  await page.getByText("아직 이곳에 남겨진 고민이 없어요").waitFor();
  assert.equal(await page.locator("article[data-request-id]").count(), 0);
  assert.match(page.url(), /category=/);
  await page.reload();
  await page.getByText("아직 이곳에 남겨진 고민이 없어요").waitFor();
  check("filters and URL survive reload");
  await page.getByRole("button", { name: "전체 고민 보기" }).click();
  await page.getByRole("tab", { name: /만료 \/ 미투표/ }).click();
  await page.locator('article[data-request-id="req-7"]').waitFor();
  assert.equal(
    await page
      .locator('article[data-request-id="req-7"]')
      .getByRole("button", { name: /BUY 판정/ })
      .isDisabled(),
    true,
  );
  check("expired requests remain read-only");
  await role("member");
  await page.getByRole("button", { name: "룸 개설하기", exact: false }).click();
  await page.getByLabel("룸 이름", { exact: true }).fill("브라우저의 취향");
  await page
    .getByLabel("한 줄 소개", { exact: false })
    .fill("검증을 위한 큐레이션 룸입니다.");
  await page.getByLabel("팔로워 수", { exact: true }).fill("500");
  await page.getByLabel("패션·뷰티 게시글 수", { exact: true }).fill("10");
  await page.getByText("✦ 패스트 트랙 기준 충족").waitFor();
  await page.getByRole("button", { name: "다음 단계" }).click();
  await page
    .getByLabel("채널 프로필 URL")
    .fill("https://www.instagram.com/buyornot_demo/");
  const code = await page.getByRole("dialog").locator("strong").innerText();
  await page.getByLabel("위 인증 코드 입력").fill(code);
  await page.getByRole("button", { name: "다음 단계" }).click();
  await page
    .getByLabel("입력한 활동 정보와 채널이 본인의 것임을 확인합니다.")
    .check();
  await page
    .getByRole("button", { name: "개설 신청하기", exact: true })
    .click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  check("three-step application with fast-track threshold");
  await role("admin");
  await tab(/^승인 관리/);
  await page
    .getByRole("heading", { name: "브라우저의 취향", exact: true })
    .waitFor();
  await page.getByRole("button", { name: "데모 승인하기" }).click();
  await page.getByText("APPROVED", { exact: true }).waitFor();
  await role("member");
  await page
    .getByRole("button", { name: "내 개설 신청", exact: false })
    .click();
  await page
    .getByRole("dialog")
    .getByText("APPROVED", { exact: true })
    .waitFor();
  await page.getByRole("link", { name: "내 큐레이션 룸 보기" }).click();
  await page
    .getByRole("heading", { name: "브라우저의 취향", exact: true })
    .waitFor();
  await page.getByLabel("공식 인증 크리에이터", { exact: true }).waitFor();
  check("admin approval creates verified creator room");
  await page.goto(origin + "/creators/seoa?status=BUY");
  await page.getByRole("button", { name: "데모 프로필" }).count();
  const own = page.locator("article[data-request-id]").filter({
    has: page.getByRole("link", {
      name: "브라우저 테스트 코트 외부 쇼핑몰에서 보기",
    }),
  });
  await own.getByRole("button", { name: "삭제", exact: true }).click();
  await page.getByRole("button", { name: "삭제하기", exact: true }).click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  await tab(/^추천 숍/);
  assert.equal(
    await page.getByRole("heading", { name: "브라우저 테스트 코트 ↗" }).count(),
    0,
  );
  check("author deletion removes linked shop entry");
  await page.goto(origin + "/creators/seoa");
  await page
    .locator("article[data-request-id]")
    .first()
    .scrollIntoViewIfNeeded();
  await page.waitForFunction(() =>
    [...document.querySelectorAll("img")].every(
      (i) => i.complete && i.naturalWidth > 0,
    ),
  );
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({
    path: "/tmp/creator-desktop-final.png",
    fullPage: true,
  });
  for (const width of [390, 768, 1440, 1720]) {
    await page.setViewportSize({ width, height: 950 });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
    const cols = await page
      .locator("#request-grid")
      .evaluate(
        (e) => getComputedStyle(e).gridTemplateColumns.split(" ").length,
      );
    assert.equal(
      cols,
      width === 390 ? 1 : width === 768 ? 2 : width === 1440 ? 3 : 4,
    );
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "살말 고민 작성하기" }).click();
  await page.getByRole("dialog").waitFor();
  assert.equal(
    await page
      .getByRole("dialog")
      .evaluate((e) => e.scrollWidth > e.clientWidth),
    false,
  );
  await page.keyboard.press("Escape");
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  await page.screenshot({
    path: "/tmp/creator-mobile-final.png",
    fullPage: true,
  });
  check("responsive 1/2/3/4 columns, mobile dialog and Escape");
  const missing = await page.goto(origin + "/creators/not-existing");
  assert.equal(missing.status(), 404);
  await page
    .getByRole("heading", { name: "크리에이터 룸을 찾을 수 없어요" })
    .waitFor();
  check("unknown room 404");
  assert.deepEqual(errors, []);
  check("no uncaught browser errors");
} finally {
  await browser.close();
}
