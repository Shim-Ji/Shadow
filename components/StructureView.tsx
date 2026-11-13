"use client";

import { useState } from "react";
import { ACTORS, PROPS, ROLES, SCENES, fmt, sceneAt, type RoleId } from "@/lib/data";
import { usePersistent } from "@/lib/store";
import { usePlayer } from "./Player";
import { RoleDot, useCast } from "./Cast";
import { StageDiagram } from "./Stage";
import { CueRow, TimeLink } from "./ui";

const EMPTY_NOTES: Record<string, string> = {};
const EMPTY_DONE: Record<string, boolean> = {};

export function StructureView() {
  const { time, playRange } = usePlayer();
  const { label } = useCast();
  const [open, setOpen] = useState<Record<string, boolean>>({ s1: true });
  const [notes, setNotes] = usePersistent("notes", EMPTY_NOTES);
  const [done, setDone] = usePersistent("sceneDone", EMPTY_DONE);
  const current = time > 0.5 ? sceneAt(time) : undefined;
  const allOpen = SCENES.every((s) => open[s.id]);
  const doneCount = SCENES.filter((s) => done[s.id]).length;

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-bold">전체 구조 · {SCENES.length}개 장면</h2>
        <span className="text-sm text-muted">
          연습 완료 {doneCount}/{SCENES.length}
        </span>
        <div className="ml-auto flex gap-2">
          {current && (
            <button
              className="btn"
              onClick={() => {
                setOpen((o) => ({ ...o, [current.id]: true }));
                document.getElementById(current.id)?.scrollIntoView({ behavior: "smooth", block: "center" });
              }}
            >
              지금 장면으로
            </button>
          )}
          <button
            className="btn"
            onClick={() =>
              setOpen(allOpen ? {} : Object.fromEntries(SCENES.map((s) => [s.id, true])))
            }
          >
            {allOpen ? "모두 접기" : "모두 펼치기"}
          </button>
        </div>
      </div>

      {SCENES.map((sc, idx) => {
        const isOpen = !!open[sc.id];
        const isNow = current?.id === sc.id;
        const roles = (Object.keys(sc.actions) as RoleId[]).sort(
          (a, b) => ROLES.findIndex((r) => r.id === a) - ROLES.findIndex((r) => r.id === b),
        );
        const onstage = ACTORS.filter((a) => sc.actions[a]?.length);
        return (
          <article
            key={sc.id}
            id={sc.id}
            className={`overflow-hidden rounded-xl border transition-colors ${
              isNow ? "border-amber-400 bg-amber-50/60" : "border-line bg-white"
            }`}
          >
            <button
              onClick={() => setOpen((o) => ({ ...o, [sc.id]: !o[sc.id] }))}
              className="flex w-full items-center gap-3 px-4 py-3 text-left"
              aria-expanded={isOpen}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-stone-100 text-sm font-bold">
                {idx}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{sc.title}</span>
                  {isNow && (
                    <span className="rounded-full bg-amber-400 px-2 text-xs font-bold text-black">
                      재생 중
                    </span>
                  )}
                  {done[sc.id] && <span className="text-xs text-emerald-600">✓ 연습 완료</span>}
                </span>
                <span className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
                  <span className="font-mono">
                    {fmt(sc.start)}–{fmt(sc.end)}
                  </span>
                  <span>· 가사 {sc.lyrics.length}줄</span>
                  <span className="ml-1 flex gap-0.5">
                    {onstage.map((r) => (
                      <RoleDot key={r} id={r} />
                    ))}
                  </span>
                </span>
              </span>
              <span className={`text-muted transition-transform ${isOpen ? "rotate-180" : ""}`}>
                ▾
              </span>
            </button>

            {isOpen && (
              <div className="space-y-5 border-t border-line px-4 pb-5 pt-4">
                <p className="text-[15px] leading-relaxed text-ink-soft">{sc.summary}</p>

                <div className="flex flex-wrap gap-2">
                  <button
                    className="btn btn-primary"
                    onClick={() => playRange(sc.start, sc.end, false, sc.title)}
                  >
                    ▶ 장면 재생
                  </button>
                  <button
                    className="btn"
                    onClick={() => playRange(sc.start, sc.end, true, sc.title)}
                  >
                    🔁 장면 반복
                  </button>
                  <label className="btn cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!done[sc.id]}
                      onChange={(e) => setDone((d) => ({ ...d, [sc.id]: e.target.checked }))}
                      className="accent-emerald-500"
                    />
                    연습 완료
                  </label>
                </div>

                <div>
                  <h3 className="section-title">무대 배치</h3>
                  <StageDiagram scene={sc} />
                </div>

                {sc.lyrics.length > 0 && (
                  <div>
                    <h3 className="section-title">가사</h3>
                    <ol className="space-y-1">
                      {sc.lyrics.map((l) => {
                        const active = time >= l.s - 0.3 && time < l.e + 0.5;
                        return (
                          <li key={l.s} className="flex items-baseline gap-2">
                            <TimeLink t={l.s} />
                            <span className={active ? "font-semibold text-amber-700" : ""}>
                              {l.text}
                            </span>
                          </li>
                        );
                      })}
                    </ol>
                  </div>
                )}

                <div>
                  <h3 className="section-title">배역별 동작</h3>
                  <div className="grid gap-3 @2xl:grid-cols-2">
                    {roles.map((r) => (
                      <div key={r} className="rounded-lg bg-paper p-3">
                        <div className="mb-1.5 flex items-center gap-2 text-sm font-semibold">
                          <RoleDot id={r} /> {label(r)}
                        </div>
                        <ul className="space-y-1">
                          {sc.actions[r]!.map((c, i) => (
                            <CueRow key={i} cue={c} time={time} />
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>

                {sc.props.length > 0 && (
                  <div>
                    <h3 className="section-title">이 장면의 소품·준비물</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {sc.props.map((id) => {
                        const p = PROPS.find((x) => x.id === id);
                        return (
                          p && (
                            <span key={id} className="rounded-full bg-stone-100 px-2.5 py-1 text-xs">
                              {p.name}
                            </span>
                          )
                        );
                      })}
                    </div>
                  </div>
                )}

                {sc.tip && (
                  <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                    💡 {sc.tip}
                  </p>
                )}

                <div>
                  <h3 className="section-title">감독 메모</h3>
                  <textarea
                    value={notes[sc.id] ?? ""}
                    onChange={(e) => setNotes((n) => ({ ...n, [sc.id]: e.target.value }))}
                    placeholder="이 장면에서 고칠 점, 연습 때 전달할 내용을 적어 두세요. (이 기기에 저장)"
                    rows={3}
                    className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-amber-400"
                  />
                </div>
              </div>
            )}
          </article>
        );
      })}
    </section>
  );
}
