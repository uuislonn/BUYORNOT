"use client";
import { useEffect, useState, useTransition } from "react";
import {
  getBodyProfile,
  saveBodyProfile,
} from "../../../lib/auth/body-profile";
import {
  BODY_FIELDS,
  cleanBodyProfile,
} from "../../(creator)/_lib/body-profile";
import {
  BodyValueInput,
  PersonalColorSelect,
  BodyTypeSelect,
} from "../../(creator)/_components/body-value-input";
import s from "./mypage.module.css";
export function BodyProfileForm() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [pending, startTransition] = useTransition();
  useEffect(() => {
    let cancelled = false;
    getBodyProfile()
      .then((result) => {
        if (cancelled) return;
        if (result.ok)
          setValues(
            Object.fromEntries(
              Object.entries(result.profile).map(([key, value]) => [
                key,
                String(value),
              ]),
            ),
          );
        else setNotice(result.message);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setNotice("정보를 불러오지 못했어요. 다시 열어 주세요.");
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);
  function save(clear = false) {
    startTransition(async () => {
      try {
        const input = clear
          ? {}
          : cleanBodyProfile(
              Object.fromEntries(
                Object.entries(values).map(([key, value]) => [
                  key,
                  BODY_FIELDS.some((field) => field.key === key) && value !== ""
                    ? Number(value)
                    : value,
                ]),
              ),
            );
        const result = await saveBodyProfile(input);
        setNotice(result.message);
        if (result.ok)
          setValues(
            Object.fromEntries(
              Object.entries(result.profile).map(([key, value]) => [
                key,
                String(value),
              ]),
            ),
          );
      } catch (error) {
        setNotice(
          error instanceof Error ? error.message : "저장하지 못했어요.",
        );
      }
    });
  }
  return (
    <div className={s.accountDetails}>
      <h2>나의 신체 정보</h2>
      <p className={s.integrationNote}>
        선택한 정보만 비공개로 저장해요. 고민 작성 시 불러온 후, 공개할 항목은
        글마다 직접 선택합니다.
      </p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          save();
        }}
      >
        <fieldset className={s.bodyFields} disabled={loading || pending}>
          {BODY_FIELDS.map((field) => (
            <label key={field.key}>
              {field.label}
              <BodyValueInput
                fieldKey={field.key}
                value={values[field.key] ?? ""}
                onChange={(value) =>
                  setValues((current) => ({ ...current, [field.key]: value }))
                }
              />
            </label>
          ))}
          {(
            [
              ["body_type", "체형"],
              ["personal_color", "퍼스널컬러"],
            ] as const
          ).map(([key, label]) => (
            <label key={key}>
              {label}
              {key === "personal_color" ? (
                <PersonalColorSelect
                  value={values[key] ?? ""}
                  onChange={(value) =>
                    setValues((current) => ({ ...current, [key]: value }))
                  }
                />
              ) : (
                <BodyTypeSelect
                  value={values[key] ?? ""}
                  onChange={(value) =>
                    setValues((current) => ({ ...current, [key]: value }))
                  }
                />
              )}
            </label>
          ))}
        </fieldset>
        <div className={s.bodyButtons}>
          <button className={s.primary} disabled={loading || pending}>
            {loading ? "불러오는 중…" : pending ? "저장 중…" : "신체 정보 저장"}
          </button>
          <button
            type="button"
            disabled={loading || pending}
            onClick={() => save(true)}
          >
            저장 정보 비우기
          </button>
        </div>
      </form>
      {notice && (
        <p className={s.integrationNote} role="status">
          {notice}
        </p>
      )}
    </div>
  );
}
