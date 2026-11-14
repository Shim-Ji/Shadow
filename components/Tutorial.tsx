"use client";

import { useEffect, useState } from "react";

export type TutorialStep = {
  icon: string;
  title: string;
  body: string[];
  /** 이 단계에서 "열어 보기"로 이동할 탭 */
  tab?: string;
};

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    icon: "👋",
    title: "그림자극 연습장에 오신 걸 환영해요",
    body: [
      "'세상에서 가장 귀한 이야기' 그림자 무언극을 연습하는 배우, 소품 담당, 감독이 함께 쓰는 사이트예요.",
      "1분이면 사용법을 다 볼 수 있어요. 언제든 위쪽의 ❓ 버튼으로 다시 열 수 있습니다.",
    ],
  },
  {
    icon: "▶",
    title: "영상 재생과 속도",
    body: [
      "맨 위 바의 ▶ 재생 버튼으로 참고 영상을 재생하고 멈춰요.",
      "속도를 0.5배속, 0.75배속으로 낮추면 빠른 동작을 따라 하기 쉬워요.",
      "구간 재생이나 반복 중일 때는 위쪽에 표시되고, ✕를 누르면 해제돼요.",
    ],
  },
  {
    icon: "👆",
    title: "누르면 그 장면으로 이동",
    body: [
      "동작 줄, 가사 줄, 타임라인 막대를 누르면 영상이 그 시점으로 바로 이동해요.",
      "'1:21–1:38'처럼 구간으로 적힌 동작은 그 시간 동안 계속 이어지거나 반복하는 동작이에요.",
      "지금 재생 중인 동작과 가사는 주황색으로 강조돼요.",
    ],
  },
  {
    icon: "🖥",
    title: "화면 모드 4가지",
    body: [
      "위쪽 오른쪽 아이콘으로 영상 배치를 바꿀 수 있어요.",
      "⬆ 위 고정: 스크롤해도 영상이 위에 붙어 있어요 (휴대폰에서 동작 따라 할 때).",
      "↘ 작은 창: 스크롤하면 영상이 오른쪽 아래 작은 창으로 따라와요.",
      "◧ 좌우: 왼쪽 영상, 오른쪽 내용. 영상 아래에 지금 가사와 배역별 동작이 실시간으로 나와요 (노트북, 감독용).",
      "💬 오버레이: 영상이 화면을 꽉 채우고 내용이 반투명하게 겹쳐요 (가로 화면, 연습실 TV용).",
    ],
  },
  {
    icon: "🎬",
    title: "전체 구조",
    tab: "structure",
    body: [
      "작품을 13개 장면으로 나눠 아코디언으로 보여 줘요.",
      "장면을 펼치면 가사, 무대 배치 그림, 배역별 동작, 소품을 한 번에 볼 수 있어요.",
      "▶ 장면 재생, 🔁 장면 반복으로 한 장면만 집중 연습하고, 연습 완료 체크와 감독 메모도 남길 수 있어요.",
    ],
  },
  {
    icon: "🙋",
    title: "내 역할",
    tab: "role",
    body: [
      "배역을 고르면 그 배역의 등장, 퇴장, 동작만 시간순으로 보여 줘요.",
      "동작마다 그때 불리는 가사가 함께 나와서, 가사를 신호 삼아 외우기 좋아요.",
      "🔗 이 배역 링크 복사를 눌러 단톡방에 보내면, 받은 사람은 자기 배역 화면으로 바로 열려요.",
    ],
  },
  {
    icon: "🧭",
    title: "전체 흐름",
    tab: "flow",
    body: [
      "누가 언제 무대에 있는지 타임라인으로 보여 줘요. 감독이 전체 동선을 볼 때 좋아요.",
      "막대를 누르면 그 구간이 재생되고, 아래에는 장면별 줄거리가 있어요.",
    ],
  },
  {
    icon: "🎒",
    title: "소품",
    tab: "props",
    body: [
      "무대, 조명·음향, 의상, 소품 준비물을 체크리스트로 정리했어요.",
      "소품마다 담당 배역과 쓰이는 장면이 나와 있어요. 체크 상태는 이 기기에 저장돼요.",
    ],
  },
  {
    icon: "🎵",
    title: "가사 외우기",
    tab: "lyrics",
    body: [
      "전체 보기, 초성 힌트, 가리기 모드로 가사를 외워요.",
      "가사 줄을 누르면 그 줄만 재생되고, 🔁로 반복할 수 있어요.",
      "'가사 아래에 동작 같이 보기'에서 내 배역을 고르면 가사와 동작을 함께 익힐 수 있어요.",
    ],
  },
  {
    icon: "💡",
    title: "연출 제안",
    tab: "advice",
    body: [
      "영상을 보고 정리한 조언과 안전 수칙, 바꿔 볼 만한 점이에요.",
      "연출, 안전, 소품, 연습, 인원으로 골라 볼 수 있어요.",
    ],
  },
  {
    icon: "👥",
    title: "배역 배정",
    tab: "cast",
    body: [
      "배역마다 담당자 이름을 적어 두면 사이트 곳곳에 이름이 같이 표시돼요.",
      "처음 한 번 우리 팀 이름으로 채워 두세요.",
    ],
  },
  {
    icon: "💾",
    title: "저장은 내 기기에만",
    body: [
      "배역 이름, 체크, 감독 메모, 외운 가사 표시는 지금 쓰는 기기의 브라우저에만 저장돼요.",
      "다른 사람 화면에는 보이지 않으니, 공유가 필요한 내용은 단톡방에 따로 전해 주세요.",
      "이제 시작해 볼까요? 사용법은 위쪽 ❓ 버튼으로 언제든 다시 볼 수 있어요.",
    ],
  },
];

export function Tutorial({
  open,
  onClose,
  onOpenTab,
}: {
  open: boolean;
  onClose: () => void;
  onOpenTab: (tab: string) => void;
}) {
  const [i, setI] = useState(0);
  const step = TUTORIAL_STEPS[i];
  const last = i === TUTORIAL_STEPS.length - 1;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setI((x) => Math.min(x + 1, TUTORIAL_STEPS.length - 1));
      if (e.key === "ArrowLeft") setI((x) => Math.max(x - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const close = () => {
    setI(0);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 p-3 backdrop-blur-[2px] sm:items-center"
      onClick={close}
      role="dialog"
      aria-modal="true"
      aria-label="사용법 안내"
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between text-xs text-muted">
          <span>
            사용법 {i + 1} / {TUTORIAL_STEPS.length}
          </span>
          <button onClick={close} className="rounded px-2 py-1 hover:bg-stone-100" aria-label="닫기">
            건너뛰기 ✕
          </button>
        </div>

        <div className="mt-3 text-4xl">{step.icon}</div>
        <h2 className="mt-2 text-xl font-bold">{step.title}</h2>
        <ul className="mt-3 space-y-2 text-[15px] leading-relaxed text-ink-soft">
          {step.body.map((b) => (
            <li key={b} className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
              <span>{b}</span>
            </li>
          ))}
        </ul>

        {step.tab && (
          <button
            onClick={() => {
              onOpenTab(step.tab!);
              close();
            }}
            className="mt-4 text-sm font-semibold text-amber-700 underline-offset-2 hover:underline"
          >
            이 탭 바로 열어 보기 →
          </button>
        )}

        <div className="mt-5 flex justify-center gap-1.5">
          {TUTORIAL_STEPS.map((s, k) => (
            <button
              key={s.title}
              onClick={() => setI(k)}
              className={`h-2 rounded-full transition-all ${k === i ? "w-5 bg-amber-500" : "w-2 bg-stone-300"}`}
              aria-label={`${k + 1}단계`}
            />
          ))}
        </div>

        <div className="mt-5 flex gap-2">
          <button className="btn flex-1 justify-center" onClick={() => setI((x) => x - 1)} disabled={i === 0}>
            이전
          </button>
          <button
            className="btn btn-primary flex-1 justify-center"
            onClick={() => (last ? close() : setI((x) => x + 1))}
          >
            {last ? "시작하기" : "다음"}
          </button>
        </div>
      </div>
    </div>
  );
}
