import type { Category } from "./types";
export const SITUATIONS: Record<
  Category,
  { prompt: string; placeholder: string; tags: readonly string[] }
> = {
  의류: {
    prompt: "어떤 코디에 입고 싶나요?",
    placeholder: "핏, 색상, 함께 입을 옷… 고민을 자유롭게 남겨 주세요.",
    tags: [
      "하객룩",
      "출근룩",
      "데일리",
      "여행룩",
      "데이트룩",
      "체형커버",
      "퍼스널컬러",
    ],
  },
  뷰티: {
    prompt: "어떤 메이크업을 원하나요?",
    placeholder:
      "발색, 피부 표현, 지속력, 평소 쓰는 제품과의 조합… 어떤 점이 고민인가요?",
    tags: [
      "데일리메이크업",
      "출근메이크업",
      "데이트메이크업",
      "웨딩메이크업",
      "여행메이크업",
      "지속력",
      "자연스러운발색",
      "퍼스널컬러",
    ],
  },
  신발: {
    prompt: "주로 언제 신을 예정인가요?",
    placeholder: "착화감, 사이즈, 오래 걷기, 코디… 어떤 점이 고민인가요?",
    tags: [
      "데일리",
      "출퇴근",
      "오래걷기",
      "여행",
      "운동",
      "비오는날",
      "편한착화감",
    ],
  },
  잡화: {
    prompt: "어떤 용도로 사용할 예정인가요?",
    placeholder: "수납, 크기, 무게, 코디 포인트… 어떤 점이 고민인가요?",
    tags: [
      "데일리",
      "출근",
      "여행",
      "데이트",
      "수납력",
      "가벼운무게",
      "포인트아이템",
      "선물",
    ],
  },
  명품: {
    prompt: "어떤 기준으로 고르고 있나요?",
    placeholder:
      "사용할 자리, 활용도, 예산, 오래 쓸 디자인… 고민을 자유롭게 남겨 주세요.",
    tags: [
      "데일리",
      "출근",
      "격식있는자리",
      "기념일",
      "선물",
      "첫명품",
      "오래쓸디자인",
      "활용도",
    ],
  },
};
export function retainSituationTags(
  tags: readonly string[],
  category: Category,
): string[] {
  return [...new Set(tags)]
    .filter((tag) => SITUATIONS[category].tags.includes(tag))
    .slice(0, 4);
}
