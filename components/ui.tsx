"use client";

import { fmt, type Cue } from "@/lib/data";
import { usePlayer } from "./Player";

/** 누르면 영상이 해당 시점으로 이동하는 시간 표시 */
export function TimeLink({ t, lead = 1 }: { t: number; lead?: number }) {
  const { seek } = usePlayer();
  return (
    <button
      onClick={() => seek(t - lead)}
      className="shrink-0 rounded bg-stone-100 px-1.5 font-mono text-xs tabular-nums text-amber-800 hover:bg-amber-400 hover:text-black"
      title={`${fmt(t)}로 이동`}
    >
      {fmt(t)}
    </button>
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
  return <span className={`shrink-0 rounded px-1.5 text-[11px] font-semibold ${k.cls}`}>{k.label}</span>;
}

/** 동작 한 줄. 지금 재생 시점과 가까우면 강조합니다 */
export function CueRow({ cue, time, next }: { cue: Cue; time: number; next?: number }) {
  const end = next ?? cue.t + 3;
  const active = time >= cue.t - 0.5 && time < end;
  return (
    <li
      className={`flex items-start gap-2 rounded-md px-1.5 py-1 text-[15px] ${
        active ? "bg-amber-100 text-amber-900" : "text-ink"
      }`}
    >
      <TimeLink t={cue.t} />
      <KindBadge kind={cue.kind} />
      <span className="leading-snug">{cue.text}</span>
    </li>
  );
}
