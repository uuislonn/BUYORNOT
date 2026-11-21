import { Icon } from "./icons";
import s from "./creator.module.css";

export function CommentButton({
  className = "",
  disabled,
  onClick,
}: {
  className?: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`${s.iconButton} ${s.commentButton} ${className}`}
      aria-label="고민 상세 및 댓글 보기"
      disabled={disabled}
      onClick={onClick}
    >
      <Icon name="comment" size={18} />
    </button>
  );
}
