"use client";

import { useState } from "react";
import { SCENES, SUGGESTIONS, fmt, type Suggestion } from "@/lib/data";
import { usePlayer } from "./Player";

const KINDS: Suggestion["kind"][] = ["연출", "안전", "소품", "연습", "인원"];
const KIND_CLS: Record<Suggestion["kind"], string> = {
  연출: "bg-violet-100 text-violet-800",
  안전: "bg-rose-100 text-rose-800",
  소품: "bg-amber-100 text-amber-800",
  연습: "bg-sky-100 text-sky-800",
  인원: "bg-emerald-100 text-emerald-800",
};

/** 연출 조언·추가·변경 제안 */
export function AdviceView() {
  const { seek } = usePlayer();
  const [filter, setFilter] = useState<Suggestion["kind"] | "all">("all");
  const list = SUGGESTIONS.filter((s) => filter === "all" || s.kind === filter);

  return (
    <section className="space-y-4">
      <div className="card">
        <h2 className="text-lg font-bold">연출 제안</h2>
        <p className="mt-1 text-[15px] text-ink-soft">
          참고 영상을 보고 정리한 조언과 바꿔 볼 만한 점입니다. 영상에 있는 내용이 아니라 제안이니,
          팀 상황에 맞게 골라 쓰세요.
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {(["all", ...KINDS] as const).map((k) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={`btn py-1 text-xs ${filter === k ? "btn-primary" : ""}`}
            >
              {k === "all" ? `전체 ${SUGGESTIONS.length}` : `${k} ${SUGGESTIONS.filter((s) => s.kind === k).length}`}
            </button>
          ))}
        </div>
      </div>

      <ul className="space-y-3">
        {list.map((s) => {
          const sc = s.sceneId ? SCENES.find((x) => x.id === s.sceneId) : undefined;
          return (
            <li key={s.title} className="rounded-2xl border border-line bg-white p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${KIND_CLS[s.kind]}`}>{s.kind}</span>
                <h3 className="font-bold">{s.title}</h3>
              </div>
              <p className="mt-1.5 text-[15px] leading-relaxed text-ink-soft">{s.body}</p>
              {sc && (
                <button
                  onClick={() => seek(sc.start)}
                  className="mt-2 rounded-full bg-stone-100 px-2.5 py-1 text-xs text-ink-soft hover:bg-amber-400 hover:text-black"
                >
                  ▶ {fmt(sc.start)} {sc.title}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
