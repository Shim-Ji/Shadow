"use client";

import { ROLES, type Scene } from "@/lib/data";

/** 장면의 대표 무대 배치를 그림자 무대처럼 보여줍니다 (관객 시점, 왼쪽 → 오른쪽) */
export function StageDiagram({ scene }: { scene: Scene }) {
  if (scene.stage.length === 0)
    return <p className="text-sm text-muted">무대에 배우가 없습니다 (암전 또는 영상 화면).</p>;

  return (
    <div>
      <div className="relative h-36 overflow-hidden rounded-lg border border-line bg-[radial-gradient(ellipse_at_center,_#e9dcc0_0%,_#b9a888_35%,_#5b5040_75%,_#2a251e_100%)]">
        <div className="absolute inset-x-0 bottom-3 h-px bg-black/40" />
        {scene.stage.map((p, i) => {
          if (p.r === "cross") {
            return (
              <div
                key={i}
                className="absolute bottom-3 -translate-x-1/2"
                style={{ left: `${p.x}%` }}
                title="십자가"
              >
                <div className="relative h-28 w-16">
                  <div className="absolute left-1/2 top-0 h-full w-2.5 -translate-x-1/2 bg-black/85" />
                  <div className="absolute left-0 top-6 h-2.5 w-full bg-black/85" />
                </div>
              </div>
            );
          }
          const role = ROLES.find((r) => r.id === p.r)!;
          const tall = p.r === "king" || p.r === "prince";
          const h = p.low ? 44 : tall ? 88 : 80;
          return (
            <div
              key={i}
              className="absolute bottom-3 flex -translate-x-1/2 flex-col items-center"
              style={{ left: `${p.x}%` }}
            >
              <div className="relative flex flex-col items-center">
                {p.r === "king" && <div className="mb-[-2px] h-2 w-4 bg-black/85 [clip-path:polygon(0_100%,0_0,25%_60%,50%_0,75%_60%,100%_0,100%_100%)]" />}
                <div className="h-4 w-4 rounded-full bg-black/85" />
                <div
                  className={`mt-0.5 bg-black/85 ${tall ? "w-7 rounded-t-md" : "w-5 rounded-t-sm"}`}
                  style={{ height: h - 20 }}
                />
                <span
                  className="absolute -top-5 whitespace-nowrap rounded px-1 text-[10px] font-bold text-black"
                  style={{ background: role.color }}
                >
                  {role.short}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-1 text-xs text-muted">
        관객석에서 본 모습입니다. 키가 작게 그려진 사람은 무릎을 꿇거나 몸을 낮춘 자세예요.
      </p>
    </div>
  );
}
