"use client";

import { ALL_LYRICS, ROLES, fmt, lyricAt, sceneAt, type RoleId } from "@/lib/data";
import { usePlayer } from "./Player";
import { RoleDot, useCast } from "./Cast";
import { KindBadge } from "./ui";

/** 지금 재생 중인 장면의 가사와 배역별 현재 동작을 한눈에 보여줍니다 (좌우·전체화면 모드용) */
export function NowPanel({ className = "" }: { className?: string }) {
  const { time } = usePlayer();
  const { label } = useCast();
  const sc = time > 0.5 ? sceneAt(time) : undefined;

  if (!sc)
    return (
      <div className={`rounded-2xl border border-line bg-white p-4 text-sm text-muted ${className}`}>
        재생하면 지금 장면의 가사와 배역별 동작이 여기에 나와요.
      </div>
    );

  const ly = lyricAt(time);
  const next = ALL_LYRICS.find((l) => l.s > time + 0.3 && l.sceneId === sc.id);
  const rows = ROLES.filter((r) => sc.actions[r.id]?.length).map((r) => {
    const cues = sc.actions[r.id as RoleId]!;
    const cur = [...cues].reverse().find((c) => c.t <= time + 0.5);
    const nxt = cues.find((c) => c.t > time + 0.5);
    return { r, cur, nxt };
  });

  return (
    <div className={`rounded-2xl border border-line bg-white p-4 ${className}`}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-bold text-amber-700">{sc.title}</span>
        <span className="font-mono text-xs text-muted">
          {fmt(sc.start)}–{fmt(sc.end)}
        </span>
      </div>
      <p className="mt-2 min-h-[2rem] text-xl font-bold leading-snug">{ly ? `♪ ${ly.text}` : "♪ (간주)"}</p>
      {next && <p className="mt-0.5 text-sm text-muted">다음: {next.text}</p>}

      <ul className="mt-3 space-y-2 border-t border-line pt-3">
        {rows.map(({ r, cur, nxt }) => (
          <li key={r.id} className="text-[15px]">
            <div className="flex items-start gap-2">
              <span className="flex w-24 shrink-0 items-center gap-1.5 pt-0.5 text-sm font-semibold">
                <RoleDot id={r.id} />
                <span className="truncate">{label(r.id)}</span>
              </span>
              <span className="min-w-0 flex-1 leading-snug">
                {cur ? (
                  <span className="flex flex-wrap items-center gap-1.5">
                    <KindBadge kind={cur.kind} />
                    {cur.text}
                  </span>
                ) : (
                  <span className="text-muted">대기</span>
                )}
                {nxt && (
                  <span className="mt-0.5 block text-xs text-muted">
                    {fmt(nxt.t)} 다음: {nxt.text}
                  </span>
                )}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** 전체화면 모드에서 영상 위에 띄우는 큰 가사 자막 */
export function OverlayCaption({ className = "" }: { className?: string }) {
  const { time } = usePlayer();
  const sc = time > 0.5 ? sceneAt(time) : undefined;
  const ly = time > 0.5 ? lyricAt(time) : undefined;
  if (!sc) return null;
  return (
    <div className={`pointer-events-none text-center ${className}`}>
      <div className="inline-block rounded-2xl bg-black/55 px-5 py-3 text-white backdrop-blur-sm">
        <div className="text-xs font-semibold text-amber-300">{sc.title}</div>
        {ly && <div className="mt-1 text-2xl font-bold leading-snug sm:text-3xl">{ly.text}</div>}
      </div>
    </div>
  );
}
