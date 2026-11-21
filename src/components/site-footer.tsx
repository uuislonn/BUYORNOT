"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import styles from "./site-footer.module.css";

const guides = {
  about: {
    title: "BUYORNOT 소개",
    sections: [
      {
        title: "좋은 선택은, 함께.",
        text: "BUYORNOT은 살까 말까 망설여지는 순간, 서로의 취향과 의견을 나누는 공간입니다. 모두의 한 표와 크리에이터의 시선을 참고해 나에게 맞는 선택을 찾아보세요.",
      },
      {
        title: "살말 커뮤니티",
        text: "관심 있는 상품과 고민을 올리고 다른 사람들의 투표와 의견을 만나보세요.",
      },
      {
        title: "큐레이션 룸",
        text: "취향이 맞는 크리에이터를 팔로우하고, 각 룸에서 구매 고민을 나눠보세요. 추천숍에서는 크리에이터가 추천한 상품을 모아볼 수 있어요.",
      },
    ],
  },
  guide: {
    title: "처음 이용하시나요?",
    sections: [
      {
        title: "01. 함께 고르기",
        text: "살말 커뮤니티에서 관심 있는 상품을 살펴보고 한 표를 남겨보세요. 직접 고민을 작성할 때는 상품 링크와 고민하는 이유를 함께 적어주세요.",
      },
      {
        title: "02. 취향 발견하기",
        text: "큐레이션 룸 목록에서 관심 있는 크리에이터를 찾아 팔로우하세요. 룸에 고민을 남기고 크리에이터의 선택과 의견을 참고할 수 있어요.",
      },
      {
        title: "03. 내 활동 모아보기",
        text: "마이페이지에서 작성한 글, 참여한 투표, 저장한 글과 상품, 팔로우한 크리에이터를 다시 확인하세요.",
      },
      {
        title: "04. 판매처에서 확인하기",
        text: "상품 카드의 ‘쇼핑몰에서 보기’를 누르면 연결된 판매 페이지로 이동합니다. 최종 가격, 옵션, 재고와 배송 조건은 판매처에서 확인해 주세요.",
      },
    ],
  },
  faq: {
    title: "자주 묻는 질문",
    sections: [
      {
        title: "여기서 바로 구매할 수 있나요?",
        text: "상품 구매와 결제는 연결된 쇼핑몰에서 진행합니다. 주문·배송·교환·환불은 구매한 판매처에 문의해 주세요.",
      },
      {
        title: "커뮤니티와 큐레이션 룸은 어떻게 다른가요?",
        text: "커뮤니티에서는 여러 회원의 투표와 의견을 모읍니다. 큐레이션 룸에서는 취향이 맞는 크리에이터에게 구매 고민을 남기고 그 사람의 시선을 참고할 수 있어요.",
      },
      {
        title: "저장한 상품은 어디서 볼 수 있나요?",
        text: "로그인한 뒤 마이페이지의 저장 항목에서 다시 확인할 수 있습니다.",
      },
      {
        title: "표시된 가격이 판매처와 달라요.",
        text: "할인 행사, 옵션, 회원 혜택이나 재고에 따라 가격이 달라질 수 있습니다. 구매 전 판매 페이지의 정보를 최종 확인해 주세요.",
      },
    ],
  },
  rules: {
    title: "커뮤니티 이용수칙",
    sections: [
      {
        title: "취향을 존중해 주세요",
        text: "서로 다른 선택을 존중하며 상품과 고민에 대한 의견을 나눠주세요. 다른 회원을 향한 비방과 차별, 괴롭힘은 삼가주세요.",
      },
      {
        title: "정확하게 공유해 주세요",
        text: "상품과 일치하는 링크와 이미지를 사용하고, 직접 경험한 내용과 추측을 구분해 주세요. 타인의 사진과 콘텐츠를 올릴 때는 사용할 권한을 확인해 주세요.",
      },
      {
        title: "개인정보를 보호해 주세요",
        text: "게시글과 댓글에 전화번호, 주소, 결제 정보 등 본인이나 다른 사람의 민감한 정보를 올리지 마세요.",
      },
      {
        title: "광고와 의견을 구분해 주세요",
        text: "광고·협찬 등 이해관계가 있는 콘텐츠는 그 사실을 분명히 밝혀주세요. 반복적인 홍보와 상품에 무관한 링크는 삼가주세요.",
      },
    ],
  },
  privacy: {
    title: "개인정보 안내",
    sections: [
      {
        title: "계정과 활동",
        text: "로그인한 계정으로 글과 의견을 남기고, 투표·저장·팔로우 활동을 이용합니다. 공개 게시글에는 닉네임과 프로필이 함께 표시될 수 있어요.",
      },
      {
        title: "선택한 프로필 정보",
        text: "신체 정보와 퍼스널 컬러 등은 구매 고민을 설명할 때 활용하는 선택 정보입니다. 글을 등록하기 전에 함께 공유할 항목을 확인해 주세요.",
      },
      {
        title: "외부 판매 페이지",
        text: "상품 링크를 열면 외부 쇼핑몰로 이동합니다. 이동한 사이트에서의 로그인·결제와 개인정보 처리는 해당 사이트의 안내를 확인해 주세요.",
      },
    ],
  },
} as const;
type Guide = keyof typeof guides;

export function SiteFooter() {
  const dialog = useRef<HTMLDialogElement>(null);
  const [active, setActive] = useState<Guide>("about");
  function openGuide(key: Guide) {
    setActive(key);
    dialog.current?.showModal();
    dialog.current?.scrollTo(0, 0);
  }
  return (
    <footer className={styles.footer} aria-label="사이트 하단 정보">
      <div className={styles.inner}>
        <div className={styles.top}>
          <div className={styles.brand}>
            <Link href="/" className={styles.logo} aria-label="Buy or Not 홈">
              Buy <span>or</span> Not
              <span className={styles.dot} aria-hidden="true" />
            </Link>
            <p className={styles.tagline}>좋은 선택은, 함께.</p>
            <p className={styles.description}>
              모두의 한 표와 크리에이터의 취향으로
              <br />
              나에게 맞는 선택을 찾아보세요.
            </p>
          </div>
          <nav className={styles.column} aria-label="서비스 둘러보기">
            <h2>둘러보기</h2>
            <Link href="/community">살말 커뮤니티</Link>
            <Link href="/creators">큐레이션 룸</Link>
            <Link href="/account">마이페이지</Link>
          </nav>
          <nav className={styles.column} aria-label="서비스 이용 가이드">
            <h2>이용 가이드</h2>
            <button type="button" onClick={() => openGuide("about")}>
              BUYORNOT 소개
            </button>
            <button type="button" onClick={() => openGuide("guide")}>
              처음 이용하시나요?
            </button>
            <button type="button" onClick={() => openGuide("faq")}>
              자주 묻는 질문
            </button>
          </nav>
          <nav className={styles.column} aria-label="서비스 정책 안내">
            <h2>안내</h2>
            <button type="button" onClick={() => openGuide("rules")}>
              커뮤니티 이용수칙
            </button>
            <button
              type="button"
              className={styles.privacy}
              onClick={() => openGuide("privacy")}
            >
              개인정보 안내
            </button>
          </nav>
        </div>
        <div className={styles.bottom}>
          <p>
            상품 구매는 연결된 판매처에서 진행됩니다.
            <br className={styles.mobileBreak} /> 가격과 재고는 판매처에서 최종
            확인해 주세요.
          </p>
          <small>© {new Date().getFullYear()} BUYORNOT</small>
        </div>
      </div>
      <dialog
        ref={dialog}
        className={styles.dialog}
        aria-labelledby="footer-guide-title"
        onClick={(event) => {
          if (event.target === event.currentTarget) dialog.current?.close();
        }}
      >
        <div className={styles.dialogInner}>
          <div className={styles.dialogHeading}>
            <h2 id="footer-guide-title">{guides[active].title}</h2>
            <button
              type="button"
              aria-label="안내 닫기"
              autoFocus
              onClick={() => dialog.current?.close()}
            >
              ×
            </button>
          </div>
          {guides[active].sections.map((section) => (
            <div className={styles.guideSection} key={section.title}>
              <h3>{section.title}</h3>
              <p>{section.text}</p>
            </div>
          ))}
          <button
            type="button"
            className={styles.confirm}
            onClick={() => dialog.current?.close()}
          >
            확인
          </button>
        </div>
      </dialog>
    </footer>
  );
}
