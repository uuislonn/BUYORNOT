"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { submitAuth, kakaoLogin } from "../actions";
import s from "./login.module.css";

export type AuthMode = "login" | "signup" | "reset" | "update";
export function LoginForm({
  mode = "login",
  localTestEnabled = false,
  previewEnabled = false,
  configured = false,
  kakaoEnabled = false,
  initialNotice = "",
}: {
  mode?: AuthMode;
  localTestEnabled?: boolean;
  previewEnabled?: boolean;
  configured?: boolean;
  kakaoEnabled?: boolean;
  initialNotice?: string;
}) {
  const [visible, setVisible] = useState(false);
  const [notice, setNotice] = useState(initialNotice);
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const acceptsIdentifier =
    mode === "login" && (localTestEnabled || previewEnabled);
  const titles = {
    login: "다시 만나서 반가워요",
    signup: "나만의 취향을 시작해요",
    reset: "비밀번호를 잊으셨나요?",
    update: "새 비밀번호를 정해주세요",
  };
  const subtitles = {
    login: "로그인하고 나만의 취향을 이어가세요.",
    signup: "이메일 인증으로 안전하게 가입하세요.",
    reset: "가입한 이메일로 재설정 링크를 보내드려요.",
    update: "영문과 숫자를 포함한 10자 이상으로 설정하세요.",
  };
  const labels = {
    login: "로그인",
    signup: "인증 메일 받고 가입하기",
    reset: "재설정 메일 받기",
    update: "비밀번호 변경하기",
  };
  return (
    <div className={s.page}>
      <header className={s.header}>
        <Link href="/" className={s.logo} aria-label="BUYORNOT 홈">
          <span>Buy or Not</span>
        </Link>
        <Link href="/creators/seoa" className={s.back}>
          둘러보기 <span aria-hidden="true">↗</span>
        </Link>
      </header>
      <main className={s.main}>
        <aside className={s.story}>
          <p className={s.eyebrow}>LESS GUESSING. BETTER CHOICES.</p>
          <h1>
            살까, 말까.
            <br />
            혼자 고민하지
            <br />
            말아요<span>.</span>
          </h1>
          <p className={s.description}>
            내 취향을 아는 크리에이터와 함께
            <br />
            나에게 맞는 선택을 찾아보세요.
          </p>
          <div className={s.choice} aria-hidden="true">
            <span>마음에 드는데…</span>
            <strong>
              BUY <i>or</i> NOT?
            </strong>
            <span className={s.answer}>같이 골라볼까요? ↗</span>
          </div>
          <p className={s.caption}>YOUR TASTE, YOUR CHOICE.</p>
        </aside>
        <div className={s.formArea}>
          <div className={s.formWrap}>
            <p className={s.step}>WELCOME TO BUYORNOT</p>
            <h2>{titles[mode]}</h2>
            <p className={s.subtitle}>{subtitles[mode]}</p>
            <form
              key={mode}
              action={(form) => {
                setNotice("");
                startTransition(async () => {
                  const result = await submitAuth(mode, form);
                  setNotice(result.message);
                  if (result.ok && mode !== "login") setDone(true);
                });
              }}
            >
              <fieldset
                className={s.fields}
                disabled={pending || done || !configured}
              >
                {mode === "signup" && (
                  <>
                    <label className={s.label} htmlFor="nickname">
                      닉네임
                    </label>
                    <input
                      className={s.input}
                      id="nickname"
                      name="nickname"
                      autoComplete="nickname"
                      minLength={2}
                      maxLength={20}
                      placeholder="2~20자로 입력해 주세요"
                      required
                    />
                  </>
                )}
                {mode !== "update" && (
                  <>
                    <label className={s.label} htmlFor="email">
                      {acceptsIdentifier ? "아이디 또는 이메일" : "이메일"}
                    </label>
                    <input
                      className={s.input}
                      id="email"
                      name="email"
                      type={acceptsIdentifier ? "text" : "email"}
                      autoComplete={mode === "login" ? "username" : "email"}
                      maxLength={254}
                      placeholder={
                        acceptsIdentifier
                          ? "아이디 또는 이메일"
                          : "이메일 주소를 입력해 주세요"
                      }
                      required
                    />
                  </>
                )}
                {mode !== "reset" && (
                  <>
                    <label className={s.label} htmlFor="password">
                      {mode === "update" ? "새 비밀번호" : "비밀번호"}
                    </label>
                    <div className={s.password}>
                      <input
                        className={s.input}
                        id="password"
                        name="password"
                        type={visible ? "text" : "password"}
                        autoComplete={
                          mode === "login" ? "current-password" : "new-password"
                        }
                        minLength={mode === "login" ? 1 : 10}
                        maxLength={128}
                        placeholder={
                          mode === "login"
                            ? "비밀번호를 입력해 주세요"
                            : "영문·숫자 포함 10자 이상"
                        }
                        required
                      />
                      <button
                        type="button"
                        className={s.reveal}
                        onClick={() => setVisible(!visible)}
                        aria-label={
                          visible ? "비밀번호 숨기기" : "비밀번호 보기"
                        }
                        aria-pressed={visible}
                      >
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          aria-hidden="true"
                        >
                          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                          <circle cx="12" cy="12" r="3" />
                          {visible && <path d="m3 3 18 18" />}
                        </svg>
                      </button>
                    </div>
                    {mode !== "login" && (
                      <>
                        <label className={s.label} htmlFor="confirm">
                          비밀번호 확인
                        </label>
                        <input
                          className={s.input}
                          id="confirm"
                          name="confirm"
                          type={visible ? "text" : "password"}
                          autoComplete="new-password"
                          maxLength={128}
                          placeholder="비밀번호를 한 번 더 입력해 주세요"
                          required
                        />
                      </>
                    )}
                  </>
                )}
                <div className={s.options}>
                  {mode === "login" ? (
                    <>
                      <span>안전한 계정으로 취향을 이어가세요</span>
                      <Link href="/forgot-password">비밀번호 찾기</Link>
                    </>
                  ) : (
                    <span>비밀번호는 안전하게 암호화하여 관리합니다.</span>
                  )}
                </div>
                <button className={s.submit} type="submit">
                  {pending ? "처리 중…" : done ? "완료" : labels[mode]}{" "}
                  <span aria-hidden="true">→</span>
                </button>
              </fieldset>
            </form>
            {mode === "login" && previewEnabled && (
              <p className={s.notice}>
                개발용 미리보기는 아이디와 비밀번호에 1111을 입력해 주세요.
              </p>
            )}
            {(mode === "login" || mode === "signup") && (
              <>
                <div className={s.divider}>
                  <span>간편하게 시작하기</span>
                </div>
                <button
                  className={s.kakao}
                  type="button"
                  disabled={pending || !kakaoEnabled}
                  onClick={() => {
                    setNotice("");
                    startTransition(async () => {
                      const result = await kakaoLogin();
                      setNotice(result.message);
                    });
                  }}
                >
                  <svg
                    width="19"
                    height="19"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      fill="currentColor"
                      d="M12 3C6.5 3 2 6.5 2 10.8c0 2.8 1.8 5.2 4.6 6.6l-1 3.6 4.2-2.5 2.2.2c5.5 0 10-3.5 10-7.9S17.5 3 12 3Z"
                    />
                  </svg>
                  {kakaoEnabled ? "카카오로 시작하기" : "카카오 로그인 준비 중"}
                </button>
              </>
            )}
            <p className={s.signup}>
              {mode === "login" ? (
                <>
                  아직 회원이 아니신가요?{" "}
                  <Link href="/signup">이메일로 가입하기 ↗</Link>
                </>
              ) : (
                <Link href="/login">로그인으로 돌아가기 →</Link>
              )}
            </p>
            {notice && (
              <p className={s.notice} role="status">
                {notice}
              </p>
            )}
            {!configured && (
              <p className={s.preview}>
                인증 서비스 연결 전입니다. 서비스 설정이 완료되면 가입할 수
                있어요.
              </p>
            )}
          </div>
        </div>
      </main>
      <footer className={s.footer}>
        © BUYORNOT <span>좋아하는 것을, 더 나답게.</span>
      </footer>
    </div>
  );
}
