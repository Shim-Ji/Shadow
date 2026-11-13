"use client";

import { ACTORS, ALL_LYRICS, ROLES, SCENES, VIDEO_DURATION, fmt, sceneAt } from "@/lib/data";
import { usePlayer } from "./Player";
import { RoleDot, useCast } from "./Cast";

const pct = (t: number) => `${(t / VIDEO_DURATION) * 100}%`;
const CROSS: [number, number] = [201, 299];

export function FlowView() {
  const { time, seek, playRange } = usePlayer();
  const { label } = useCast();
  const current = time > 0.5 ? sceneAt(time) : undefined;

  const seekFromClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    seek(((e.clientX - rect.left) / rect.width) * VIDEO_DURATION);
  };

  const lanes = [
    ...ACTORS.map((id) => {
      const r = ROLES.find((x) => x.id === id)!;
      return { key: id, name: label(id), color: r.color, bars: r.onstage, dot: id };
    }),
    { key: "cross", name: "십자가", color: "#d6c7a1", bars: [CROSS], dot: "cross" as const },
  ];

  return (
    <section className="space-y-5">
      <div className="card">
        <h2 className="text-lg font-bold">전체 흐름 타임라인</h2>
        <p className="mt-1 text-sm text-ink-soft">
          막대는 그 배역이 무대에 있는 구간입니다. 빈 곳을 누르면 그 시점으로, 막대를 누르면 그
          구간만 재생합니다.
        </p>

        <div className="mt-4 overflow-x-auto pb-2">
          <div className="min-w-[720px]">
            {/* 장면 */}
            <div className="flex">
              <div className="w-24 shrink-0 text-xs text-muted">장면</div>
              <div className="relative h-8 flex-1">
                {SCENES.map((s, i) => (
                  <button
                    key={s.id}
                    onClick={() => playRange(s.start, s.end, false, s.title)}
                    className={`absolute inset-y-0 border-r border-white text-[11px] font-bold ${
                      current?.id === s.id ? "bg-amber-400 text-black" : i % 2 ? "bg-stone-200" : "bg-stone-50"
                    } hover:bg-amber-300 hover:text-black`}
                    style={{ left: pct(s.start), width: pct(s.end - s.start) }}
                    title={`${i}. ${s.title} (${fmt(s.start)}–${fmt(s.end)})`}
                  >
                    {i}
                  </button>
                ))}
              </div>
            </div>

            {/* 가사 */}
            <div className="mt-1 flex">
              <div className="w-24 shrink-0 text-xs text-muted">가사</div>
              <div className="relative h-4 flex-1 rounded bg-stone-50">
                {ALL_LYRICS.map((l) => (
                  <button
                    key={l.s}
                    onClick={() => playRange(l.s - 0.5, l.e + 0.5, false, l.text)}
                    className="absolute inset-y-0.5 rounded-sm bg-stone-400 hover:bg-amber-300"
                    style={{ left: pct(l.s), width: pct(l.e - l.s) }}
                    title={`${fmt(l.s)} ${l.text}`}
                  />
                ))}
              </div>
            </div>

            {/* 배역 */}
            <div className="relative mt-2 space-y-1.5">
              {lanes.map((ln) => (
                <div key={ln.key} className="flex items-center">
                  <div className="flex w-24 shrink-0 items-center gap-1.5 truncate pr-2 text-xs">
                    <RoleDot id={ln.dot} />
                    <span className="truncate">{ln.name}</span>
                  </div>
                  <div className="relative h-6 flex-1 cursor-pointer rounded bg-stone-50" onClick={seekFromClick}>
                    {ln.bars.map(([s, e]) => (
                      <button
                        key={s}
                        onClick={(ev) => {
                          ev.stopPropagation();
                          playRange(s, e, false, `${ln.name} ${fmt(s)}–${fmt(e)}`);
                        }}
                        className="absolute inset-y-0.5 rounded hover:brightness-125"
                        style={{ left: pct(s), width: pct(e - s), background: ln.color }}
                        title={`${fmt(s)}–${fmt(e)}`}
                      />
                    ))}
                  </div>
                </div>
              ))}
              {/* 재생 위치 */}
              <div className="pointer-events-none absolute inset-y-0 left-24 right-0">
                <div className="absolute inset-y-0 w-0.5 bg-white shadow-[0_0_6px_white]" style={{ left: pct(time) }} />
              </div>
            </div>

            {/* 눈금 */}
            <div className="mt-1 flex">
              <div className="w-24 shrink-0" />
              <div className="relative h-4 flex-1 text-[10px] text-muted">
                {[0, 60, 120, 180, 240, 300].map((t) => (
                  <span key={t} className="absolute -translate-x-1/2" style={{ left: pct(t) }}>
                    {fmt(t)}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-bold">한눈에 보는 줄거리</h2>
        <ol className="mt-3 space-y-0">
          {SCENES.map((s, i) => {
            const who = ACTORS.filter((a) => s.actions[a]?.length);
            const isNow = current?.id === s.id;
            return (
              <li key={s.id} className="relative flex gap-3 pb-4 last:pb-0">
                <div className="flex flex-col items-center">
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                      isNow ? "bg-amber-400 text-black" : "bg-stone-100"
                    }`}
                  >
                    {i}
                  </span>
                  {i < SCENES.length - 1 && <span className="mt-1 w-px flex-1 bg-stone-200" />}
                </div>
                <div className="min-w-0 flex-1 pb-1">
                  <button
                    onClick={() => seek(s.start)}
                    className="text-left font-semibold hover:text-amber-700"
                  >
                    {s.title}{" "}
                    <span className="font-mono text-xs font-normal text-muted">{fmt(s.start)}</span>
                  </button>
                  <p className="text-sm text-ink-soft">{s.summary}</p>
                  {who.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted">
                      {who.map((w) => (
                        <span key={w} className="flex items-center gap-1">
                          <RoleDot id={w} /> {ROLES.find((r) => r.id === w)!.short}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
