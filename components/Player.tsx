"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { VIDEO_ID, fmt } from "@/lib/data";

// --- YouTube IFrame API 최소 타입 ---
type YTPlayer = {
  seekTo(t: number, allow: boolean): void;
  playVideo(): void;
  pauseVideo(): void;
  getCurrentTime(): number;
  getPlayerState(): number;
  setPlaybackRate(r: number): void;
};
declare global {
  interface Window {
    YT?: { Player: new (el: HTMLElement, opts: unknown) => YTPlayer; PlayerState: { PLAYING: number } };
    onYouTubeIframeAPIReady?: () => void;
  }
}

type Range = { s: number; e: number; loop: boolean; label: string } | null;

type Ctx = {
  time: number;
  playing: boolean;
  ready: boolean;
  range: Range;
  rate: number;
  seek: (t: number) => void;
  playRange: (s: number, e: number, loop: boolean, label: string) => void;
  clearRange: () => void;
  setRate: (r: number) => void;
  toggle: () => void;
};

const PlayerCtx = createContext<Ctx | null>(null);

export function usePlayer() {
  const c = useContext(PlayerCtx);
  if (!c) throw new Error("PlayerProvider가 필요합니다");
  return c;
}

let apiPromise: Promise<void> | null = null;
function loadApi(): Promise<void> {
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve) => {
    if (window.YT?.Player) return resolve();
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
    const s = document.createElement("script");
    s.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(s);
  });
  return apiPromise;
}

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const playerRef = useRef<YTPlayer | null>(null);
  const hostRef = useRef<HTMLDivElement | null>(null);
  const rangeRef = useRef<Range>(null);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [range, setRangeState] = useState<Range>(null);
  const [rate, setRateState] = useState(1);

  const setRange = (r: Range) => {
    rangeRef.current = r;
    setRangeState(r);
  };

  // 플레이어 생성은 PlayerFrame이 마운트될 때 hostRef로 연결
  const attach = useCallback((el: HTMLDivElement | null) => {
    hostRef.current = el;
    if (!el || playerRef.current) return;
    loadApi().then(() => {
      if (!hostRef.current || playerRef.current || !window.YT) return;
      const target = document.createElement("div");
      hostRef.current.appendChild(target);
      playerRef.current = new window.YT.Player(target, {
        videoId: VIDEO_ID,
        width: "100%",
        height: "100%",
        playerVars: { rel: 0, modestbranding: 1, playsinline: 1 },
        events: { onReady: () => setReady(true) },
      });
    });
  }, []);

  // 재생 시간 폴링 + 구간 반복/정지 처리
  useEffect(() => {
    const id = window.setInterval(() => {
      const p = playerRef.current;
      if (!p || typeof p.getCurrentTime !== "function") return;
      const t = p.getCurrentTime();
      setTime(t);
      setPlaying(p.getPlayerState() === 1);
      const r = rangeRef.current;
      if (r && t >= r.e) {
        if (r.loop) p.seekTo(r.s, true);
        else {
          p.pauseVideo();
          rangeRef.current = null;
          setRangeState(null);
        }
      }
    }, 200);
    return () => window.clearInterval(id);
  }, []);

  const seek = useCallback((t: number) => {
    const p = playerRef.current;
    if (!p) return;
    setRange(null);
    p.seekTo(Math.max(0, t), true);
    p.playVideo();
  }, []);

  const playRange = useCallback((s: number, e: number, loop: boolean, label: string) => {
    const p = playerRef.current;
    if (!p) return;
    setRange({ s, e, loop, label });
    p.seekTo(Math.max(0, s), true);
    p.playVideo();
  }, []);

  const clearRange = useCallback(() => setRange(null), []);

  const setRate = useCallback((r: number) => {
    playerRef.current?.setPlaybackRate(r);
    setRateState(r);
  }, []);

  const toggle = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    if (p.getPlayerState() === 1) p.pauseVideo();
    else p.playVideo();
  }, []);

  return (
    <PlayerCtx.Provider
      value={{ time, playing, ready, range, rate, seek, playRange, clearRange, setRate, toggle }}
    >
      <AttachCtx.Provider value={attach}>{children}</AttachCtx.Provider>
    </PlayerCtx.Provider>
  );
}

const AttachCtx = createContext<(el: HTMLDivElement | null) => void>(() => {});

export type VideoLayout = "top" | "mini" | "side" | "overlay";

const ANCHOR: Record<VideoLayout, string> = {
  top: "relative mx-auto aspect-video w-full max-w-[min(48rem,calc(36vh*16/9))] overflow-hidden rounded-xl bg-stone-900",
  mini: "relative mx-auto aspect-video w-full max-w-3xl overflow-hidden rounded-2xl bg-stone-900 shadow-sm",
  side: "relative aspect-video w-full overflow-hidden rounded-2xl bg-stone-900 shadow-sm",
  // 가로: 화면을 꽉 채움 / 세로: 위쪽에 붙여서 아래 패널에 덜 가리게
  overlay: "absolute inset-0 bg-black portrait:bottom-auto portrait:top-16 portrait:aspect-video portrait:w-full",
};

/**
 * 유튜브 영상 자리. 화면 모드(layout)에 따라 CSS만 바꿉니다.
 * iframe을 다시 만들지 않으므로 모드를 바꿔도 재생이 끊기지 않습니다.
 * mini 모드: 스크롤해서 화면 밖으로 나가면 오른쪽 아래 작은 플레이어로 떠 있습니다.
 */
export function PlayerFrame({ layout }: { layout: VideoLayout }) {
  const attach = useContext(AttachCtx);
  const { playing, toggle } = usePlayer();
  const anchorRef = useRef<HTMLDivElement | null>(null);
  const [floating, setFloating] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const el = anchorRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        const out = !entry.isIntersecting;
        setFloating(out);
        if (!out) setDismissed(false);
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const isMini = layout === "mini" && floating && !dismissed;
  const isHidden = layout === "mini" && floating && dismissed;

  return (
    <div ref={anchorRef} className={ANCHOR[layout]}>
      <div
        className={
          isMini
            ? "fixed bottom-20 right-3 z-40 aspect-video w-52 overflow-hidden rounded-xl bg-black shadow-2xl ring-1 ring-black/10 sm:bottom-5 sm:right-5 sm:w-80"
            : isHidden
              ? "pointer-events-none fixed -left-[9999px] aspect-video w-80"
              : "absolute inset-0"
        }
      >
        <div ref={attach} className="absolute inset-0 [&>iframe]:h-full [&>iframe]:w-full" />
        {isMini && (
          <button
            onClick={() => {
              if (playing) toggle();
              setDismissed(true);
            }}
            className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-sm text-white hover:bg-black/80"
            aria-label="작은 영상 닫기"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

/** 상단 고정 바에 들어가는 재생 컨트롤 */
export function PlayerControls() {
  const { time, range, clearRange, rate, setRate, playing, toggle, ready } = usePlayer();
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm">
      <button onClick={toggle} disabled={!ready} className="btn btn-primary min-w-[4.5rem] justify-center">
        {playing ? "❚❚ 정지" : "▶ 재생"}
      </button>
      <span className="font-mono text-base font-semibold tabular-nums text-ink">{fmt(time)}</span>
      <select
        value={rate}
        onChange={(e) => setRate(Number(e.target.value))}
        className="rounded-lg border border-line bg-white px-2 py-1 text-sm text-ink"
        aria-label="재생 속도"
      >
        {[0.5, 0.75, 1, 1.25].map((r) => (
          <option key={r} value={r}>
            {r === 1 ? "보통 속도" : `${r}배속`}
          </option>
        ))}
      </select>
      {range && (
        <span className="flex min-w-0 items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-amber-900">
          <span className="shrink-0">{range.loop ? "🔁 반복 중" : "▶ 구간 재생"}</span>
          <span className="truncate font-medium">{range.label}</span>
          <button onClick={clearRange} className="ml-1 shrink-0 font-bold hover:text-black" aria-label="구간 해제">
            ✕
          </button>
        </span>
      )}
    </div>
  );
}
