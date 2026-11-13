"use client";

import { PROPS, ROLES, SCENES, fmt, type Prop } from "@/lib/data";
import { usePersistent } from "@/lib/store";
import { usePlayer } from "./Player";
import { RoleDot } from "./Cast";

const EMPTY: Record<string, boolean> = {};
const CATS: Prop["category"][] = ["무대", "조명·음향", "의상", "소품"];

export function PropsView() {
  const [checked, setChecked] = usePersistent("props", EMPTY);
  const { seek } = usePlayer();
  const count = PROPS.filter((p) => checked[p.id]).length;

  return (
    <section className="space-y-4">
      <div className="card">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-bold">소품·준비물 체크리스트</h2>
          <span className="text-sm text-ink-soft">
            {count}/{PROPS.length} 준비됨
          </span>
          <button
            className="btn ml-auto text-xs"
            onClick={() => {
              if (confirm("체크 표시를 모두 지울까요?")) setChecked({});
            }}
          >
            체크 초기화
          </button>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-stone-100">
          <div
            className="h-full bg-emerald-500 transition-all"
            style={{ width: `${(count / PROPS.length) * 100}%` }}
          />
        </div>
      </div>

      {CATS.map((cat) => (
        <div key={cat}>
          <h3 className="section-title">{cat}</h3>
          <div className="space-y-2">
            {PROPS.filter((p) => p.category === cat).map((p) => {
              const used = SCENES.filter((s) => s.props.includes(p.id));
              return (
                <label
                  key={p.id}
                  className={`flex cursor-pointer gap-3 rounded-xl border p-3 transition ${
                    checked[p.id]
                      ? "border-emerald-300 bg-emerald-50"
                      : "border-line bg-white"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={!!checked[p.id]}
                    onChange={(e) => setChecked((c) => ({ ...c, [p.id]: e.target.checked }))}
                    className="mt-1 h-5 w-5 shrink-0 accent-emerald-500"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`font-semibold ${checked[p.id] ? "line-through opacity-70" : ""}`}>
                        {p.name}
                      </span>
                      {p.uncertain && (
                        <span className="rounded bg-rose-100 px-1.5 text-[11px] text-rose-700">
                          확인 필요
                        </span>
                      )}
                      <span className="flex flex-wrap gap-2 text-xs text-muted">
                        {p.owner.map((o) => (
                          <span key={o} className="flex items-center gap-1">
                            <RoleDot id={o} /> {ROLES.find((r) => r.id === o)!.short}
                          </span>
                        ))}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-ink-soft">{p.note}</p>
                    {used.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {used.map((s) => (
                          <button
                            key={s.id}
                            onClick={(e) => {
                              e.preventDefault();
                              seek(s.start);
                            }}
                            className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] hover:bg-amber-400 hover:text-black"
                          >
                            {fmt(s.start)} {s.title}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      ))}

      <div className="card text-sm text-ink-soft">
        <h3 className="font-bold text-ink">그림자극 무대 팁</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>배우는 항상 조명과 스크린 사이에 있어야 합니다. 조명 앞(관객 쪽)으로 나가면 그림자가 사라져요.</li>
          <li>스크린에 가까울수록 그림자가 또렷하고, 조명에 가까울수록 크고 흐려집니다.</li>
          <li>정면보다 옆모습이 실루엣으로 잘 읽힙니다. 왕관, 소매, 머리 묶음 같은 윤곽을 살리세요.</li>
          <li>두 사람이 겹치면 한 덩어리로 보입니다. 서로 손이 닿는 장면 말고는 간격을 두세요.</li>
        </ul>
      </div>
    </section>
  );
}
