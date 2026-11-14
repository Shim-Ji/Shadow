"use client";

import { useCallback, useSyncExternalStore } from "react";

// localStorage에 저장되는 간단한 상태 저장소 (배역 이름, 소품 체크, 감독 메모 등)
const PREFIX = "shadow-tutorial:";
const listeners = new Set<() => void>();
const cache = new Map<string, { raw: string | null; value: unknown }>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key?.startsWith(PREFIX)) cb();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

function read<T>(key: string, fallback: T): T {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(PREFIX + key);
  } catch {
    return fallback;
  }
  const hit = cache.get(key);
  if (hit && hit.raw === raw) return hit.value as T;
  let value: T = fallback;
  if (raw != null) {
    try {
      value = JSON.parse(raw) as T;
    } catch {
      value = fallback;
    }
  }
  cache.set(key, { raw, value });
  return value;
}

/**
 * @param serverValue 서버 렌더링(첫 화면)에서 쓸 값. 지정하지 않으면 fallback.
 *   예) 처음 방문 안내는 서버에서 "본 것"으로 두어야 재방문자에게 깜빡이지 않습니다.
 */
export function usePersistent<T>(
  key: string,
  fallback: T,
  serverValue?: T,
): [T, (v: T | ((prev: T) => T)) => void] {
  const value = useSyncExternalStore(
    subscribe,
    () => read(key, fallback),
    () => (serverValue === undefined ? fallback : serverValue),
  );
  const set = useCallback(
    (v: T | ((prev: T) => T)) => {
      const prev = read(key, fallback);
      const next = typeof v === "function" ? (v as (p: T) => T)(prev) : v;
      try {
        localStorage.setItem(PREFIX + key, JSON.stringify(next));
      } catch {
        /* 저장 공간이 없으면 무시 */
      }
      listeners.forEach((l) => l());
    },
    [key, fallback],
  );
  return [value, set];
}

/** CSS 미디어 쿼리 결과 (서버 렌더링 때는 fallback) */
export function useMedia(query: string, fallback = false): boolean {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia(query).matches,
    () => fallback,
  );
}
