"use client";

import { fmt, type Cue } from "@/lib/data";
import { usePlayer } from "./Player";

const timeText = (t: number, until?: number) =>
  until != null && until - t >= 1.5 ? `${fmt(t)}–${fmt(until)}` : fmt(t);

const TIME_CLS =
  "shrink-0 rounded-md bg-stone-100 px-2 py-0.5 font-mono text-[13px] tabular-nums text-amber-800";

/** 시간 표시만 (줄 전체가 버튼일 때 안쪽에 씀) */
export function TimeLabel({ t, until }: { t: number; until?: number }) {
  return <span className={TIME_CLS}>{timeText(t, until)}</span>;
}

/** 누르면 영상이 해당 시점으로 이동하는 시간 버튼 */
export function TimeLink({ t, until, lead = 1 }: { t: number; until?: number; lead?: number }) {
  const { seek } = usePlayer();
  return (
    <button
      onClick={() => seek(t - lead)}
      className={`${TIME_CLS} hover:bg-amber-400 hover:text-black`}
      title={`${fmt(t)}로 이동`}
    >
      {timeText(t, until)}
    </button>
  );
}

/**
 * 줄 전체를 누르면 영상이 t 시점으로 이동합니다.
 * 손가락으로 누르기 쉽도록 시간 숫자만이 아니라 줄 전체가 버튼입니다.
 */
export function SeekRow({
  t,
  active,
  className = "",
  children,
}: {
  t: number;
  active?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const { seek } = usePlayer();
  return (
    <li
      role="button"
      tabIndex={0}
      onClick={() => seek(t - 1)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          seek(t - 1);
        }
      }}
      title={`${fmt(t)}로 이동`}
      className={`cursor-pointer rounded-lg transition outline-none hover:ring-2 hover:ring-amber-300 focus-visible:ring-2 focus-visible:ring-amber-500 active:bg-amber-200 ${
        active ? "bg-amber-100 text-amber-900" : ""
      } ${className}`}
    >
      {children}
    </li>
  );
}

const KIND: Record<NonNullable<Cue["kind"]>, { label: string; cls: string }> = {
  enter: { label: "등장", cls: "bg-emerald-100 text-emerald-700" },
  exit: { label: "퇴장", cls: "bg-rose-100 text-rose-700" },
  hold: { label: "정지", cls: "bg-sky-100 text-sky-700" },
  prop: { label: "소품", cls: "bg-amber-100 text-amber-700" },
};

export function KindBadge({ kind }: { kind?: Cue["kind"] }) {
  if (!kind) return null;
  const k = KIND[kind];
  return <span className={`shrink-0 rounded px-1.5 py-0.5 text-[11px] font-semibold ${k.cls}`}>{k.label}</span>;
}

/** 동작 한 줄. 줄 전체를 누르면 그 시점으로 이동하고, 재생 중인 동작은 강조합니다 */
export function CueRow({ cue, time, next }: { cue: Cue; time: number; next?: number }) {
  const end = cue.until ?? next ?? cue.t + 3;
  const active = time >= cue.t - 0.5 && time < end;
  return (
    <SeekRow t={cue.t} active={active} className="flex items-start gap-2 px-2 py-1.5 text-[15px]">
      <TimeLabel t={cue.t} until={cue.until} />
      <KindBadge kind={cue.kind} />
      <span className="leading-snug">{cue.text}</span>
    </SeekRow>
  );
}
