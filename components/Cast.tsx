"use client";

import { ROLES, type RoleId } from "@/lib/data";
import { usePersistent } from "@/lib/store";

const EMPTY: Record<string, string> = {};

/** 배역별 담당자 이름 (이 기기에 저장) */
export function useCast() {
  const [cast, setCast] = usePersistent<Record<string, string>>("cast", EMPTY);
  const label = (id: RoleId) => {
    const role = ROLES.find((r) => r.id === id)!;
    const who = cast[id]?.trim();
    return who ? `${role.short} · ${who}` : role.short;
  };
  return { cast, setCast, label };
}

export function RoleDot({ id, className = "" }: { id: RoleId | "cross"; className?: string }) {
  const color = id === "cross" ? "#d6c7a1" : ROLES.find((r) => r.id === id)!.color;
  return (
    <span
      className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${className}`}
      style={{ background: color }}
    />
  );
}

export function CastView() {
  const { cast, setCast } = useCast();
  return (
    <section className="space-y-4">
      <div className="card">
        <h2 className="text-lg font-bold">배역 배정</h2>
        <p className="mt-1 text-sm text-ink-soft">
          배역마다 담당자 이름을 적어 두면 사이트 곳곳에 이름이 같이 표시됩니다. 이름은 이 기기의
          브라우저에만 저장됩니다.
        </p>
        <div className="mt-4 grid gap-3 @lg:grid-cols-2">
          {ROLES.map((r) => (
            <label key={r.id} className="block rounded-lg bg-stone-50 p-3">
              <span className="flex items-center gap-2 font-semibold">
                <RoleDot id={r.id} /> {r.name}
              </span>
              <span className="mt-1 block text-xs text-muted">{r.desc}</span>
              <input
                value={cast[r.id] ?? ""}
                onChange={(e) => setCast((c) => ({ ...c, [r.id]: e.target.value }))}
                placeholder="담당자 이름"
                className="mt-2 w-full rounded-md border border-line bg-white px-3 py-2 text-sm outline-none focus:border-amber-400"
              />
            </label>
          ))}
        </div>
      </div>

      <div className="card text-sm leading-relaxed text-ink">
        <h2 className="text-lg font-bold text-ink">사용법</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            <b>전체 구조</b>: 장면을 펼치면 가사, 무대 배치, 배역별 동작, 소품을 한 번에 봅니다. 감독
            메모도 장면마다 남길 수 있어요.
          </li>
          <li>
            <b>내 역할</b>: 배역을 고르면 그 배역의 등장, 퇴장, 동작만 시간순으로 보여 줍니다.
          </li>
          <li>
            <b>전체 흐름</b>: 누가 언제 무대에 있는지 타임라인으로 봅니다. 막대를 누르면 그 시점으로
            이동합니다.
          </li>
          <li>
            <b>소품</b>: 준비물 체크리스트입니다. 체크 상태는 이 기기에 저장됩니다.
          </li>
          <li>
            <b>연출 제안</b>: 영상을 보고 정리한 조언, 안전 수칙, 바꿔 볼 만한 점입니다.
          </li>
          <li>
            <b>가사 외우기</b>: 가리기, 초성 힌트 모드로 외우고, 줄마다 반복 재생할 수 있어요.
          </li>
          <li>모든 시간(예: 1:23)과 ▶ 버튼은 누르면 영상이 그 시점으로 이동합니다.</li>
          <li>
            동작 설명은 참고 영상을 보고 정리한 것입니다. 팀 상황에 맞게 바꿔서 연습하세요.
          </li>
        </ul>
      </div>
    </section>
  );
}
