"use client";
import { BODY_FIELDS } from "../_lib/body-profile";
import s from "./body-value-input.module.css";
export function BodyValueInput({
  fieldKey,
  label,
  value,
  onChange,
  onFocus,
  disabled = false,
  required = false,
}: {
  fieldKey: (typeof BODY_FIELDS)[number]["key"];
  label?: string;
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  disabled?: boolean;
  required?: boolean;
}) {
  const field = BODY_FIELDS.find((field) => field.key === fieldKey)!;
  return (
    <span className={s.inputWrap}>
      <input
        aria-label={label ?? field.label}
        type="text"
        inputMode="numeric"
        pattern={required ? "[0-9]*" : undefined}
        maxLength={3}
        placeholder={`${field.min}~${field.max}`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={onFocus}
        disabled={disabled}
        required={required}
      />
      <span aria-hidden="true">{field.unit}</span>
    </span>
  );
}
const COLORS = [
  "봄 웜",
  "봄 웜 라이트",
  "봄 웜 브라이트",
  "여름 쿨",
  "여름 쿨 라이트",
  "여름 쿨 뮤트",
  "가을 웜",
  "가을 웜 뮤트",
  "가을 웜 딥",
  "겨울 쿨",
  "겨울 쿨 브라이트",
  "겨울 쿨 딥",
  "잘 모르겠어요",
];
type ChoiceProps = {
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  disabled?: boolean;
  required?: boolean;
};
function ProfileChoice({
  value,
  onChange,
  onFocus,
  disabled = false,
  required = false,
  label,
  options,
}: ChoiceProps & { label: string; options: readonly string[] }) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onFocus={onFocus}
      disabled={disabled}
      required={required}
    >
      <option value="">선택 안 함</option>
      {value && !options.includes(value) && (
        <option value={value}>{value} (기존 정보)</option>
      )}
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}
export function PersonalColorSelect(props: ChoiceProps) {
  return <ProfileChoice {...props} label="퍼스널컬러" options={COLORS} />;
}
const BODY_TYPES = [
  "전체적으로 균형 있는 편",
  "어깨가 넓은 편",
  "상체에 볼륨이 있는 편",
  "하체에 볼륨이 있는 편",
  "골반이 넓은 편",
  "허리 굴곡이 있는 편",
  "잘 모르겠어요",
];
export function BodyTypeSelect(props: ChoiceProps) {
  return <ProfileChoice {...props} label="체형" options={BODY_TYPES} />;
}
