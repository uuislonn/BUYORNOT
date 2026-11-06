"use client";
import { useState } from "react";
import { loginPreview } from "./actions";
import { Modal } from "./modal";
import { validateAuthForm, type AuthMode } from "./auth-form";
import styles from "./community.module.css";
import auth from "./login-modal.module.css";

const titles: Record<AuthMode, string> = {
  login: "로그인",
  signup: "이메일로 가입하기",
  "find-id": "아이디 찾기",
  "reset-password": "비밀번호 찾기",
};
export function LoginModal({
  close,
  signedIn,
}: {
  close: () => void;
  signedIn: () => Promise<void>;
}) {
  const [pending, setPending] = useState(false);
  const [mode, setMode] = useState<AuthMode>("login");
  const [identifier, setIdentifier] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  function changeMode(next: AuthMode) {
    setMode(next);
    setPassword("");
    setConfirmation("");
    setShowPassword(false);
    setError("");
    setNotice("");
  }
  async function submit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pending) return;
    const problem = validateAuthForm(mode, {
      identifier,
      email,
      password,
      confirmation,
    });
    setError(problem);
    setNotice("");
    if (problem) return;
    if (mode === "login") {
      setPending(true);
      try {
        const response = await loginPreview(identifier, password, remember);
        if (!response.ok) setError(response.error);
        else await signedIn();
      } catch {
        setError("로그인하지 못했습니다. 다시 시도해 주세요.");
      } finally {
        setPending(false);
      }
      return;
    }
    // TODO: connect the agreed authentication provider.
    setNotice(
      `${titles[mode]} 기능은 인증 서비스 연결 후 이용할 수 있습니다. 입력한 정보는 전송하거나 저장하지 않았습니다.`,
    );
  }
  function social(provider: string) {
    setError("");
    setNotice(`${provider} 로그인은 아직 연결되지 않았습니다.`);
  }
  return (
    <Modal title={titles[mode]} close={close}>
      <p className={styles.hint}>로그인하고 함께 취향을 나눠보세요.</p>
      {mode === "login" && <p>로그인이 필요한 서비스입니다.</p>}
      {mode === "find-id" && <p>가입한 이메일을 입력해 주세요.</p>}
      {mode === "reset-password" && (
        <p>비밀번호를 재설정할 계정의 이메일을 입력해 주세요.</p>
      )}
      <form className={styles.form} onSubmit={submit} noValidate>
        {mode === "login" ? (
          <label>
            아이디 또는 이메일
            <input
              name="username"
              autoComplete="username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              maxLength={254}
            />
          </label>
        ) : (
          <label>
            이메일
            <input
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              maxLength={254}
            />
          </label>
        )}
        {(mode === "login" || mode === "signup") && (
          <div className={auth.passwordField}>
            <label htmlFor="login-password">비밀번호</label>
            <div className={auth.passwordInput}>
              <input
                id="login-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                aria-describedby={
                  mode === "signup" ? "password-help" : undefined
                }
              />
              <button
                className={auth.passwordToggle}
                type="button"
                aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 표시"}
                aria-pressed={showPassword}
                aria-controls="login-password"
                onClick={() => setShowPassword((v) => !v)}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                  <circle cx="12" cy="12" r="3" />
                  {showPassword && <path d="m3 3 18 18" />}
                </svg>
              </button>
            </div>
          </div>
        )}
        {mode === "signup" && (
          <>
            <span id="password-help" className={styles.hint}>
              비밀번호는 8자 이상 입력해 주세요.
            </span>
            <label>
              비밀번호 확인
              <input
                name="confirmation"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                required
              />
            </label>
          </>
        )}
        {mode === "login" && (
          <label className={auth.remember}>
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            자동 로그인
          </label>
        )}
        {error && (
          <p role="alert" className={styles.error}>
            {error}
          </p>
        )}
        {notice && (
          <p role="status" className={styles.hint}>
            {notice}
          </p>
        )}
        <button className={styles.primary} type="submit" disabled={pending}>
          {pending
            ? "로그인 중…"
            : mode === "signup"
              ? "가입하기"
              : mode === "reset-password"
                ? "재설정 이메일 요청"
                : mode === "find-id"
                  ? "아이디 찾기"
                  : "로그인"}
        </button>
      </form>
      {mode === "login" ? (
        <div className={auth.options}>
          <button
            className={auth.kakao}
            type="button"
            onClick={() => social("카카오")}
          >
            카카오로 시작하기
          </button>
          <button type="button" onClick={() => social("Apple")}>
            Apple로 시작하기
          </button>
          <button type="button" onClick={() => changeMode("signup")}>
            이메일로 가입하기
          </button>
          <div className={auth.recovery}>
            <button type="button" onClick={() => changeMode("find-id")}>
              아이디 찾기
            </button>
            <button type="button" onClick={() => changeMode("reset-password")}>
              비밀번호 찾기
            </button>
          </div>
        </div>
      ) : (
        <button
          className={auth.back}
          type="button"
          onClick={() => changeMode("login")}
        >
          로그인으로 돌아가기
        </button>
      )}
    </Modal>
  );
}
