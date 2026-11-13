"use client";

import { useEffect, useRef, useState } from "react";
import { ROLES, TITLE, sceneAt, lyricAt, type RoleId } from "@/lib/data";
import { useMedia, usePersistent } from "@/lib/store";
import { PlayerControls, PlayerFrame, PlayerProvider, usePlayer, type VideoLayout } from "./Player";
import { NowPanel, OverlayCaption } from "./NowPanel";
import { StructureView } from "./StructureView";
import { RoleView } from "./RoleView";
import { FlowView } from "./FlowView";
import { PropsView } from "./PropsView";
import { LyricsView } from "./LyricsView";
import { CastView } from "./Cast";
import { AdviceView } from "./AdviceView";

const TABS = [
  { id: "structure", name: "전체 구조", short: "구조", icon: "🎬" },
  { id: "role", name: "내 역할", short: "내 역할", icon: "🙋" },
  { id: "flow", name: "전체 흐름", short: "흐름", icon: "🧭" },
  { id: "props", name: "소품", short: "소품", icon: "🎒" },
  { id: "lyrics", name: "가사 외우기", short: "가사", icon: "🎵" },
  { id: "advice", name: "연출 제안", short: "제안", icon: "💡" },
  { id: "cast", name: "배역·사용법", short: "배역", icon: "👥" },
] as const;
type TabId = (typeof TABS)[number]["id"];
/** 오버레이 패널은 '지금'(실시간 가사·동작) 보기를 추가로 가집니다 */
type OverlayView = TabId | "now";

const DEFAULT_TAB: TabId = "structure";
const DEFAULT_ROLE: RoleId = "prince";
const DEFAULT_LAYOUT: VideoLayout = "mini";
const DEFAULT_OV_VIEW: OverlayView = "now";
const DEFAULT_OV_ALPHA = 0.75;

const LAYOUTS: { id: VideoLayout; name: string; icon: string }[] = [
  { id: "top", name: "위 고정", icon: "⬆" },
  { id: "mini", name: "작은 창", icon: "↘" },
  { id: "side", name: "좌우", icon: "◧" },
  { id: "overlay", name: "오버레이", icon: "💬" },
];

/** 좌우 모드를 쓸 수 있는 화면: 넓은 화면 또는 가로로 눕힌 기기 */
const WIDE_QUERY = "(min-width: 900px), (orientation: landscape) and (min-width: 640px)";

export function App() {
  return (
    <PlayerProvider>
      <Shell />
    </PlayerProvider>
  );
}

function LayoutPicker({
  value,
  onChange,
  wide,
  compact,
}: {
  value: VideoLayout;
  onChange: (l: VideoLayout) => void;
  wide: boolean;
  compact?: boolean;
}) {
  return (
    <div className="flex items-center rounded-lg border border-line-strong bg-white p-0.5" role="radiogroup" aria-label="화면 모드">
      {LAYOUTS.map((l) => {
        const active = value === l.id;
        const fallback = l.id === "side" && !wide;
        return (
          <button
            key={l.id}
            role="radio"
            aria-checked={active}
            onClick={() => onChange(l.id)}
            title={fallback ? "좌우 (화면이 좁으면 위 고정으로 보여요)" : l.name}
            className={`rounded-md px-2 py-1 text-xs transition sm:text-sm ${
              active ? "bg-amber-500 font-semibold text-white" : "text-ink-soft hover:bg-stone-100"
            }`}
          >
            <span className={compact ? "" : "mr-1"}>{l.icon}</span>
            {!compact && <span className={active ? "" : "hidden 2xl:inline"}>{l.name}</span>}
          </button>
        );
      })}
    </div>
  );
}

function NowBar() {
  const { time } = usePlayer();
  const sc = sceneAt(time);
  const ly = lyricAt(time);
  if (!sc || time < 0.5) return null;
  return (
    <div className="mt-1.5 truncate text-sm text-ink-soft">
      <span className="font-semibold text-amber-700">{sc.title}</span>
      {ly && <span> · ♪ {ly.text}</span>}
    </div>
  );
}

function DesktopTabs({ tab, setTab }: { tab: TabId; setTab: (t: TabId) => void }) {
  return (
    <div className="hidden gap-1 sm:flex">
      {TABS.map((t) => (
        <button
          key={t.id}
          onClick={() => setTab(t.id)}
          className={`rounded-lg px-3 py-2 text-[15px] transition ${
            tab === t.id ? "bg-amber-100 font-bold text-amber-900" : "text-ink-soft hover:bg-stone-100"
          }`}
        >
          <span className="xl:mr-1.5" title={t.name}>
            {t.icon}
          </span>
          <span className={tab === t.id ? "ml-1 xl:ml-0" : "hidden xl:inline"}>{t.name}</span>
        </button>
      ))}
    </div>
  );
}

/** 모바일 하단 탭바 (backdrop-blur 부모 밖에 있어야 fixed가 화면 기준이 됨) */
function MobileTabs({ tab, setTab, hidden }: { tab: TabId; setTab: (t: TabId) => void; hidden?: boolean }) {
  return (
    <nav
      className={`fixed inset-x-0 bottom-0 z-40 grid grid-cols-7 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden ${
        hidden ? "!hidden" : ""
      }`}
    >
      {TABS.map((t) => (
        <button
          key={t.id}
          onClick={() => setTab(t.id)}
          className={`flex flex-col items-center gap-0.5 py-2 text-[11px] ${
            tab === t.id ? "font-bold text-amber-700" : "text-muted"
          }`}
        >
          <span className={`text-lg leading-none ${tab === t.id ? "" : "opacity-70 grayscale"}`}>{t.icon}</span>
          {t.short}
        </button>
      ))}
    </nav>
  );
}

/** 오버레이 패널 상단: 보기 선택 + 투명도 */
function OverlayHeader({
  view,
  setView,
  alpha,
  setAlpha,
}: {
  view: OverlayView;
  setView: (v: OverlayView) => void;
  alpha: number;
  setAlpha: (a: number) => void;
}) {
  const items: { id: OverlayView; short: string; icon: string }[] = [
    { id: "now", short: "지금", icon: "⏱" },
    ...TABS.map((t) => ({ id: t.id as OverlayView, short: t.short, icon: t.icon })),
  ];
  return (
    <div className="sticky top-0 z-10 -mx-3 -mt-3 mb-3 rounded-t-2xl bg-white/90 px-2 pb-2 pt-2 shadow-sm backdrop-blur">
      <div className="flex gap-1 overflow-x-auto">
        {items.map((it) => (
          <button
            key={it.id}
            onClick={() => setView(it.id)}
            className={`flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs ${
              view === it.id ? "bg-amber-500 font-bold text-white" : "text-ink-soft hover:bg-stone-100"
            }`}
          >
            <span>{it.icon}</span>
            {it.short}
          </button>
        ))}
      </div>
      <label className="mt-1.5 flex items-center gap-2 px-1 text-[11px] text-muted">
        투명도
        <input
          type="range"
          min={0.3}
          max={1}
          step={0.05}
          value={alpha}
          onChange={(e) => setAlpha(Number(e.target.value))}
          className="h-1 flex-1 accent-amber-500"
          aria-label="패널 투명도"
        />
      </label>
    </div>
  );
}

function TabContent({ tab }: { tab: TabId }) {
  return (
    <>
      {tab === "structure" && <StructureView />}
      {tab === "role" && <RoleView />}
      {tab === "flow" && <FlowView />}
      {tab === "props" && <PropsView />}
      {tab === "lyrics" && <LyricsView />}
      {tab === "advice" && <AdviceView />}
      {tab === "cast" && <CastView />}
    </>
  );
}

function Shell() {
  const [tab, setTab] = usePersistent<TabId>("tab", DEFAULT_TAB);
  const [, setRole] = usePersistent<RoleId>("myRole", DEFAULT_ROLE);
  const [chosen, setChosen] = usePersistent<VideoLayout>("layout", DEFAULT_LAYOUT);
  const [ovView, setOvView] = usePersistent<OverlayView>("overlayView", DEFAULT_OV_VIEW);
  const [ovAlpha, setOvAlpha] = usePersistent<number>("overlayAlpha", DEFAULT_OV_ALPHA);
  const wide = useMedia(WIDE_QUERY, true);
  const [panelOpen, setPanelOpen] = useState(true);
  const barRef = useRef<HTMLDivElement | null>(null);
  const mainRef = useRef<HTMLElement | null>(null);

  // 좌우 모드는 좁은 세로 화면에서 '위 고정'으로 대신 보여줌
  const layout: VideoLayout = chosen === "side" && !wide ? "top" : chosen;
  const isOverlay = layout === "overlay";
  const isSide = layout === "side";

  // 공유 링크 지원: ?tab=role&role=p2, ?layout=side 처럼 열면 해당 탭·배역·화면으로 바로 이동
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const t = q.get("tab");
    const r = q.get("role");
    if (r && ROLES.some((x) => x.id === r)) {
      setRole(r as RoleId);
      setTab("role");
    }
    if (t && TABS.some((x) => x.id === t)) setTab(t as TabId);
    const l = q.get("layout");
    if (l && LAYOUTS.some((x) => x.id === l)) setChosen(l as VideoLayout);
  }, [setRole, setTab, setChosen]);

  // 상단 바 높이를 CSS 변수로 (위 고정·좌우 모드의 위치 계산용)
  useEffect(() => {
    const el = barRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() =>
      document.documentElement.style.setProperty("--bar-h", `${el.offsetHeight}px`),
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const changeLayout = (l: VideoLayout) => {
    setChosen(l);
    if (l === "overlay") setPanelOpen(true);
  };

  const changeTab = (t: TabId) => {
    setTab(t);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const changeOvView = (v: OverlayView) => {
    setOvView(v);
    if (v !== "now") setTab(v);
    mainRef.current?.scrollTo({ top: 0 });
  };

  const width = isSide ? "max-w-7xl" : "max-w-4xl";

  const videoCol = {
    top: "sticky top-[var(--bar-h)] z-20 mx-auto max-w-4xl bg-paper px-4 py-2",
    mini: "mx-auto max-w-4xl px-4",
    side: "sticky top-[var(--bar-h)] max-h-[calc(100dvh-var(--bar-h))] space-y-4 overflow-y-auto py-4",
    // 오버레이: 영상이 화면을 꽉 채우고, 내용 패널은 그 위에 반투명하게 겹침
    overlay: "fixed inset-0 z-0 bg-black",
  }[layout];

  const mainCls = isOverlay
    ? panelOpen
      ? "ov @container fixed z-20 overflow-y-auto overscroll-contain rounded-2xl p-3 shadow-xl " +
        "inset-x-2 bottom-2 h-[48dvh] " +
        "landscape:inset-x-auto landscape:bottom-16 landscape:right-3 landscape:top-14 landscape:h-auto landscape:w-[min(420px,44vw)]"
      : "hidden"
    : isSide
      ? "@container min-w-0 py-4"
      : "@container mx-auto max-w-4xl px-4 py-6";

  return (
    <div className={isOverlay ? "h-dvh overflow-hidden bg-black" : "min-h-dvh pb-24 sm:pb-10"}>
      <div
        ref={barRef}
        className={`sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur ${isOverlay ? "hidden" : ""}`}
      >
        <div className="mx-auto max-w-7xl px-4 py-2.5">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <PlayerControls />
            <DesktopTabs tab={tab} setTab={changeTab} />
            <div className="ml-auto">
              <LayoutPicker value={chosen} onChange={changeLayout} wide={wide} />
            </div>
          </div>
          {!isSide && <NowBar />}
        </div>
      </div>

      {!isOverlay && (
        <header className={`mx-auto ${width} px-4 pt-6 pb-4`}>
          <p className="text-sm font-semibold text-amber-700">그림자 무언극 연습 도구</p>
          <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">{TITLE}</h1>
          <p className="mt-1.5 text-[15px] text-ink-soft">
            배우, 소품 담당, 감독이 함께 보는 연습장입니다. 시간이나 ▶ 버튼을 누르면 영상이 그 장면으로
            이동해요.
          </p>
        </header>
      )}

      <div
        className={
          isSide
            ? "mx-auto grid max-w-7xl grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] items-start gap-6 px-4"
            : ""
        }
      >
        <div className={videoCol}>
          <PlayerFrame layout={layout} />
          {isSide && <NowPanel />}
          {isOverlay && (
            <OverlayCaption
              className={`absolute inset-x-0 px-4 ${
                panelOpen
                  ? "bottom-[calc(48dvh+16px)] landscape:bottom-16 landscape:right-[min(432px,46vw)]"
                  : "bottom-16"
              }`}
            />
          )}
        </div>

        <main
          ref={mainRef}
          className={mainCls}
          style={isOverlay ? ({ "--ov-a": ovAlpha } as React.CSSProperties) : undefined}
        >
          {isOverlay && (
            <OverlayHeader view={ovView} setView={changeOvView} alpha={ovAlpha} setAlpha={setOvAlpha} />
          )}
          {isOverlay && ovView === "now" ? <NowPanel /> : <TabContent tab={tab} />}
        </main>
      </div>

      <MobileTabs tab={tab} setTab={changeTab} hidden={isOverlay} />

      {/* 오버레이 모드: 왼쪽 위 작은 조작 버튼 */}
      {isOverlay && (
        <div className="fixed left-2 top-2 z-30 flex max-w-[calc(100vw-1rem)] flex-wrap items-center gap-2 rounded-xl bg-white/85 p-1.5 shadow-lg backdrop-blur">
          <PlayerControls />
          <button className="btn px-2.5 text-xs" onClick={() => setPanelOpen((o) => !o)}>
            {panelOpen ? "내용 숨기기" : "내용 보기"}
          </button>
          <LayoutPicker value={chosen} onChange={changeLayout} wide={wide} compact />
        </div>
      )}

      {!isOverlay && (
        <footer className={`mx-auto ${width} px-4 text-xs leading-relaxed text-muted`}>
          참고 영상: 소연모(소통을 위한 연극모임) 에피소드 11 그림자 무언극 &lsquo;세상에서 가장 귀한
          이야기&rsquo;. 동작 설명은 영상을 보고 정리한 것으로, 팀 상황에 맞게 바꿔 쓰세요. 배역 이름,
          체크, 메모는 이 기기의 브라우저에만 저장됩니다.
        </footer>
      )}
    </div>
  );
}
