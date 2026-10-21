"use client";
import { useState, useTransition } from "react";
import { getApplicationVerificationCode } from "../_server/actions";
import type { ApplicationInput } from "../_lib/types";
import { meetsFastTrack } from "../_lib/policy";
import { Modal } from "./modal";
import s from "./creator.module.css";
export function ApplicationForm({
  busy,
  onClose,
  onSubmit,
}: {
  busy: boolean;
  onClose: () => void;
  onSubmit: (input: ApplicationInput) => void;
}) {
  const [step, setStep] = useState(1);
  const [input, setInput] = useState<ApplicationInput>({
    roomTitle: "",
    bio: "",
    channelType: "Instagram",
    channelUrl: "",
    followers: 0,
    contentCount: 0,
    verificationCode: "",
    consent: false,
  });
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, startTransition] = useTransition();
  function next(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (step === 1) {
      startTransition(async () => {
        try {
          const result = await getApplicationVerificationCode();
          if (result.ok) {
            setCode(result.data);
            setStep(2);
          } else setError(result.error);
        } catch {
          setError("인증 코드를 준비하지 못했어요. 다시 시도해 주세요.");
        }
      });
    } else if (step === 2) {
      if (input.verificationCode !== code) {
        setError("발급된 인증 코드를 정확히 입력해 주세요.");
        return;
      }
      let url: URL;
      try {
        url = new URL(input.channelUrl);
      } catch {
        setError("채널 URL을 확인해 주세요.");
        return;
      }
      if (url.protocol !== "https:") {
        setError("HTTPS 채널 링크를 입력해 주세요.");
        return;
      }
      setStep(3);
    } else onSubmit(input);
  }
  return (
    <Modal
      title="나만의 큐레이션 룸 열기"
      onClose={onClose}
      wide
      busy={busy || loading}
    >
      <ol className={s.stepper} aria-label="신청 단계">
        {["활동 정보", "채널 인증", "신청 확인"].map((label, i) => (
          <li
            key={label}
            className={step === i + 1 ? s.activeStep : ""}
            aria-current={step === i + 1 ? "step" : undefined}
          >
            <span>{i + 1}</span>
            {label}
          </li>
        ))}
      </ol>
      <form onSubmit={next} className={s.form}>
        {step === 1 && (
          <>
            <p className={s.modalIntro}>
              당신의 취향이 누군가의 좋은 선택이 될 수 있어요.
            </p>
            <label>
              룸 이름
              <input
                required
                maxLength={40}
                value={input.roomTitle}
                onChange={(e) =>
                  setInput({ ...input, roomTitle: e.target.value })
                }
                placeholder="예: 민지의 취향 노트"
              />
            </label>
            <label>
              한 줄 소개
              <textarea
                required
                maxLength={150}
                value={input.bio}
                onChange={(e) => setInput({ ...input, bio: e.target.value })}
              />
              <span className={s.counter}>{input.bio.length} / 150</span>
            </label>
            <div className={s.fieldGrid}>
              <label>
                팔로워 수
                <input
                  type="number"
                  required
                  min={0}
                  max={100000000}
                  value={input.followers}
                  onChange={(e) =>
                    setInput({ ...input, followers: Number(e.target.value) })
                  }
                />
              </label>
              <label>
                패션·뷰티 게시글 수
                <input
                  type="number"
                  required
                  min={0}
                  max={1000000}
                  value={input.contentCount}
                  onChange={(e) =>
                    setInput({ ...input, contentCount: Number(e.target.value) })
                  }
                />
              </label>
            </div>
            <div className={s.notice}>
              {meetsFastTrack(input)
                ? "✦ 패스트 트랙 기준 충족"
                : "일반 심사로 신청할 수 있어요."}
              <p>
                패스트 트랙: 팔로워 500명 이상 + 패션·뷰티 게시글 10개 이상.
                입력한 수치는 관리자 검토 후 확인됩니다. 일반 정량 기준은 운영
                정책 확정 전입니다.
              </p>
            </div>
          </>
        )}
        {step === 2 && (
          <>
            <p className={s.modalIntro}>신청할 채널과 프로필을 알려주세요.</p>
            <label>
              활동 채널
              <select
                value={input.channelType}
                onChange={(e) =>
                  setInput({
                    ...input,
                    channelType: e.target
                      .value as ApplicationInput["channelType"],
                  })
                }
              >
                {["Instagram", "YouTube", "TikTok", "Blog"].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
            <label>
              채널 프로필 URL
              <input
                type="url"
                required
                value={input.channelUrl}
                placeholder="https://www.instagram.com/your_account/"
                onChange={(e) =>
                  setInput({ ...input, channelUrl: e.target.value })
                }
              />
            </label>
            <div className={s.codeBox}>
              <small>발급된 채널 인증 코드</small>
              <strong>{code}</strong>
              <p>
                실제 서비스에서는 채널 소개에 이 코드를 게시하고 관리자가
                소유권을 확인합니다. 현재는 코드 입력 흐름만 검증하는
                Mock입니다.
              </p>
            </div>
            <label>
              위 인증 코드 입력
              <input
                required
                value={input.verificationCode}
                autoComplete="off"
                onChange={(e) =>
                  setInput({
                    ...input,
                    verificationCode: e.target.value.trim(),
                  })
                }
              />
            </label>
          </>
        )}
        {step === 3 && (
          <>
            <div className={s.applicationSummary}>
              <span className={s.miniLabel}>YOUR NEXT ROOM</span>
              <h3>{input.roomTitle}</h3>
              <p>{input.bio}</p>
              <dl>
                <div>
                  <dt>채널</dt>
                  <dd>{input.channelType}</dd>
                </div>
                <div>
                  <dt>팔로워 / 게시글</dt>
                  <dd>
                    {input.followers.toLocaleString("ko-KR")}명 /{" "}
                    {input.contentCount}개
                  </dd>
                </div>
                <div>
                  <dt>심사 경로</dt>
                  <dd>
                    {meetsFastTrack(input) ? "패스트 트랙 검토" : "일반 심사"}
                  </dd>
                </div>
              </dl>
            </div>
            <label className={s.checkboxLabel}>
              <input
                required
                type="checkbox"
                checked={input.consent}
                onChange={(e) =>
                  setInput({ ...input, consent: e.target.checked })
                }
              />
              입력한 활동 정보와 채널이 본인의 것임을 확인합니다.
            </label>
            <p className={s.help}>
              신청은 PENDING으로 접수되며, 관리자 승인 후 크리에이터 권한과 인증
              뱃지가 부여됩니다. 실제 외부 채널 검증·승인은 아직 연결되지
              않았습니다.
            </p>
          </>
        )}
        {error && (
          <p role="alert" className={s.error}>
            {error}
          </p>
        )}
        <div className={s.modalActions}>
          {step > 1 && (
            <button
              type="button"
              className={s.secondaryButton}
              disabled={busy || loading}
              onClick={() => setStep(step - 1)}
            >
              이전
            </button>
          )}
          <button
            type="submit"
            className={s.primaryButton}
            disabled={busy || loading}
          >
            {busy || loading
              ? "처리 중…"
              : step === 3
                ? "개설 신청하기"
                : "다음 단계"}
            <span aria-hidden="true">↗</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
