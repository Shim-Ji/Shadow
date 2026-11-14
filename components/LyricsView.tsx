"use client";

import { useEffect, useRef, useState } from "react";
import { ALL_LYRICS, ROLES, SCENES, initials, type RoleId } from "@/lib/data";
import { usePersistent } from "@/lib/store";
import { usePlayer } from "./Player";
import { RoleDot } from "./Cast";
import { TimeLink } from "./ui";

type Mode = "full" | "hint" | "hide";
const EMPTY: Record<string, boolean> = {};
const NONE = "none";

export function LyricsView() {
  const { time, playRange } = usePlayer();
  const [mode, setMode] = useState<Mode>("full");
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});
  const [follow, setFollow] = useState(true);
  const [memorized, setMemorized] = usePersistent("memorized", EMPTY);
  const [withRole, setWithRole] = usePersistent<RoleId | typeof NONE>("lyricsRole", NONE);
  const activeRef = useRef<HTMLLIElement | null>(null);

  const activeS = ALL_LYRICS.find((l) => time >= l.s - 0.3 && time < l.e + 0.5)?.s;
  const memCount = ALL_LYRICS.filter((l) => memorized[l.s]).length;

  useEffect(() => {
    if (follow && activeS != null) activeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [activeS, follow]);

  const changeMode = (m: Mode) => {
    setMode(m);
    setRevealed({});
  };

  return (
    <section className="space-y-4">
      <div className="card space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-bold">가사 외우기</h2>
          <span className="text-sm text-ink-soft">
            외운 줄 {memCount}/{ALL_LYRICS.length}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["full", "전체 보기"],
              ["hint", "초성 힌트"],
              ["hide", "가리기"],
            ] as [Mode, string][]
          ).map(([m, name]) => (
            <button
              key={m}
              onClick={() => changeMode(m)}
              className={`btn ${mode === m ? "btn-primary" : ""}`}
            >
              {name}
            </button>
          ))}
          <label className="btn cursor-pointer">
            <input type="checkbox" checked={follow} onChange={(e) => setFollow(e.target.checked)} className="accent-amber-400" />
            재생 따라가기
          </label>
        </div>
        <label className="flex flex-wrap items-center gap-2 text-sm text-ink-soft">
          가사 아래에 동작 같이 보기
          <select
            value={withRole}
            onChange={(e) => setWithRole(e.target.value as RoleId | typeof NONE)}
            className="rounded bg-stone-100 px-2 py-1 text-ink"
          >
            <option value={NONE} className="bg-white">
              안 보기
            </option>
            {ROLES.map((r) => (
              <option key={r.id} value={r.id} className="bg-white">
                {r.name}
              </option>
            ))}
          </select>
        </label>
        <p className="text-xs text-muted">
          {mode === "hide"
            ? "가려진 줄을 누르면 가사가 보이고, 한 번 더 누르면 그 줄이 재생돼요. 먼저 소리 내어 말해 본 뒤 확인하세요."
            : mode === "hint"
              ? "첫소리(초성)만 보고 가사를 떠올려 보세요. 누르면 전체 가사가 보이고, 한 번 더 누르면 재생돼요."
              : "가사 줄을 누르면 그 줄만 재생돼요. 🔁는 그 줄을 반복합니다. 다 외운 줄은 체크해 두세요."}
        </p>
      </div>

      {SCENES.filter((s) => s.lyrics.length).map((sc) => (
        <div key={sc.id}>
          <h3 className="section-title">{sc.title}</h3>
          <ol className="space-y-1.5">
            {sc.lyrics.map((l, i) => {
              const active = activeS === l.s;
              const show = mode === "full" || revealed[l.s];
              const from = i === 0 ? sc.start : l.s - 1.5;
              const to = sc.lyrics[i + 1] ? sc.lyrics[i + 1].s - 1.5 : sc.end;
              const cues =
                withRole !== NONE
                  ? (sc.actions[withRole] ?? []).filter((c) => c.t < to && (c.until ?? c.t) >= from)
                  : [];
              return (
                <li
                  key={l.s}
                  ref={active ? activeRef : undefined}
                  className={`rounded-xl border px-3 py-2.5 transition ${
                    active ? "border-amber-400 bg-amber-50" : "border-line bg-white"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <TimeLink t={l.s} lead={0.5} />
                    <button
                      onClick={() =>
                        mode === "full" || revealed[l.s]
                          ? playRange(l.s - 0.5, l.e + 0.5, false, l.text)
                          : setRevealed((r) => ({ ...r, [l.s]: true }))
                      }
                      title={mode === "full" || revealed[l.s] ? "누르면 이 줄을 재생해요" : "누르면 가사가 보여요"}
                      className={`min-w-0 flex-1 rounded-md px-1 py-1 text-left text-lg leading-snug hover:bg-amber-50 ${
                        active ? "font-bold text-amber-800" : ""
                      }`}
                    >
                      {show ? (
                        l.text
                      ) : mode === "hint" ? (
                        <span className="tracking-widest text-ink-soft">{initials(l.text)}</span>
                      ) : (
                        <span className="inline-block h-5 w-full max-w-xs rounded bg-stone-200 align-middle" />
                      )}
                    </button>
                    <button
                      className="btn px-2 py-1"
                      onClick={() => playRange(l.s - 0.5, l.e + 0.5, false, l.text)}
                      aria-label="한 줄 재생"
                    >
                      ▶
                    </button>
                    <button
                      className="btn px-2 py-1"
                      onClick={() => playRange(l.s - 0.5, l.e + 0.5, true, l.text)}
                      aria-label="한 줄 반복"
                    >
                      🔁
                    </button>
                    <input
                      type="checkbox"
                      checked={!!memorized[l.s]}
                      onChange={(e) => setMemorized((m) => ({ ...m, [l.s]: e.target.checked }))}
                      className="h-5 w-5 accent-emerald-500"
                      aria-label="외움"
                      title="외웠어요"
                    />
                  </div>
                  {cues.length > 0 && (
                    <ul className="mt-1.5 space-y-0.5 pl-12 text-sm text-ink-soft">
                      {cues.map((c, j) => (
                        <li key={j} className="flex items-start gap-1.5">
                          <RoleDot id={withRole as RoleId} className="mt-1.5" />
                          {c.text}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      ))}
    </section>
  );
}
