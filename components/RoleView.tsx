"use client";

import { PROPS, ROLES, SCENES, VIDEO_DURATION, fmt, lyricAt, type RoleId } from "@/lib/data";
import { usePersistent } from "@/lib/store";
import { usePlayer } from "./Player";
import { RoleDot, useCast } from "./Cast";
import { KindBadge, TimeLink } from "./ui";

const DEFAULT_ROLE: RoleId = "prince";

export function RoleView() {
  const [roleId, setRoleId] = usePersistent<RoleId>("myRole", DEFAULT_ROLE);
  const { time, playRange } = usePlayer();
  const { cast } = useCast();
  const role = ROLES.find((r) => r.id === roleId) ?? ROLES[0];

  const scenes = SCENES.filter((s) => s.actions[role.id]?.length);
  const flat = scenes.flatMap((s) => s.actions[role.id]!.map((c) => ({ ...c, scene: s })));
  const stageSec = role.onstage.reduce((a, [s, e]) => a + (e - s), 0);
  const myProps = PROPS.filter((p) => p.owner.includes(role.id));
  const nextIdx = flat.findIndex((c) => c.t > time);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {ROLES.map((r) => (
          <button
            key={r.id}
            onClick={() => setRoleId(r.id)}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition ${
              r.id === role.id
                ? "border-transparent font-bold text-black"
                : "border-line-strong text-ink hover:bg-stone-100"
            }`}
            style={r.id === role.id ? { background: r.color } : undefined}
          >
            {r.id !== role.id && <RoleDot id={r.id} />}
            {r.short}
            {cast[r.id] && <span className="opacity-70">· {cast[r.id]}</span>}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="flex flex-wrap items-center gap-2">
          <RoleDot id={role.id} className="h-4 w-4" />
          <h2 className="text-xl font-bold">{role.name}</h2>
          {cast[role.id] && <span className="text-ink-soft">담당: {cast[role.id]}</span>}
          <button
            className="btn ml-auto text-xs"
            onClick={async () => {
              const url = `${window.location.origin}/?role=${role.id}`;
              try {
                await navigator.clipboard.writeText(url);
                alert(`${role.short} 전용 링크를 복사했어요.\n${url}`);
              } catch {
                prompt("이 링크를 복사해서 보내세요", url);
              }
            }}
          >
            🔗 이 배역 링크 복사
          </button>
        </div>
        <p className="mt-1 text-sm text-ink-soft">{role.desc}</p>

        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
          <Stat label="나오는 장면" value={`${scenes.length}개`} />
          <Stat label="동작 수" value={`${flat.length}개`} />
          <Stat label="무대 위 시간" value={role.id === "crew" ? "무대 뒤" : fmt(stageSec)} />
        </div>

        {role.onstage.length > 0 && (
          <div className="mt-4">
            <div className="mb-1 text-xs text-muted">무대에 있는 구간</div>
            <div className="relative h-4 overflow-hidden rounded bg-stone-100">
              {role.onstage.map(([s, e]) => (
                <button
                  key={s}
                  onClick={() => playRange(s, e, false, `${role.short} ${fmt(s)}–${fmt(e)}`)}
                  className="absolute inset-y-0 hover:brightness-125"
                  style={{
                    left: `${(s / VIDEO_DURATION) * 100}%`,
                    width: `${((e - s) / VIDEO_DURATION) * 100}%`,
                    background: role.color,
                  }}
                  title={`${fmt(s)}–${fmt(e)}`}
                />
              ))}
              <div
                className="absolute inset-y-0 w-0.5 bg-white"
                style={{ left: `${(time / VIDEO_DURATION) * 100}%` }}
              />
            </div>
          </div>
        )}

        {myProps.length > 0 && (
          <div className="mt-4">
            <div className="mb-1 text-xs text-muted">내가 챙길 소품·의상</div>
            <div className="flex flex-wrap gap-1.5">
              {myProps.map((p) => (
                <span key={p.id} className="rounded-full bg-stone-100 px-2.5 py-1 text-xs">
                  {p.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {nextIdx >= 0 && time > 0 && (
          <div className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
            다음 동작 <b className="font-mono">{fmt(flat[nextIdx].t)}</b>: {flat[nextIdx].text}
          </div>
        )}
      </div>

      <div className="space-y-3">
        {scenes.map((sc) => {
          const cues = sc.actions[role.id]!;
          return (
            <div key={sc.id} className="rounded-xl border border-line bg-white p-4">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <h3 className="font-semibold">{sc.title}</h3>
                <span className="font-mono text-xs text-muted">
                  {fmt(sc.start)}–{fmt(sc.end)}
                </span>
                <button
                  className="btn ml-auto py-0.5 text-xs"
                  onClick={() => playRange(sc.start, sc.end, true, sc.title)}
                >
                  🔁 반복
                </button>
              </div>
              <ol className="space-y-2">
                {cues.map((c, i) => {
                  const end = cues[i + 1]?.t ?? c.t + 3;
                  const active = time >= c.t - 0.5 && time < end;
                  const ly = lyricAt(c.t);
                  return (
                    <li
                      key={i}
                      className={`rounded-lg px-2 py-1.5 ${active ? "bg-amber-100" : "bg-paper"}`}
                    >
                      <div className="flex items-start gap-2">
                        <TimeLink t={c.t} />
                        <KindBadge kind={c.kind} />
                        <span className={`text-[15px] leading-snug ${active ? "text-amber-900" : ""}`}>
                          {c.text}
                        </span>
                      </div>
                      {ly && (
                        <div className="mt-1 pl-12 text-xs text-muted">♪ {ly.text}</div>
                      )}
                    </li>
                  );
                })}
              </ol>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-paper py-2">
      <div className="text-lg font-bold">{value}</div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  );
}
