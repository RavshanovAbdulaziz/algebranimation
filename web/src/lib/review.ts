import { useSyncExternalStore } from "react";

/**
 * Takrorlash xotirasi (Leitner qutilari).
 * Har bir savol/misol turi uchun: necha marta to'g'ri / xato, hozirgi "quti" va qachon qayta so'rash kerakligi.
 * To'g'ri javob — keyingi qutiga (kechroq so'raladi), xato — 0-qutiga (tez orada yana so'raladi).
 */
export interface Rec { ok: number; bad: number; box: number; due: number; last: number }
type Store = Record<string, Rec>;

const KEY = "algebranimation:review";
const listeners = new Set<() => void>();
// 0-quti: darhol, 1: 10 daqiqa, 2: 1 kun, 3: 3 kun, 4: 7 kun, 5: 16 kun
const GAP = [0, 10 * 60e3, 864e5, 3 * 864e5, 7 * 864e5, 16 * 864e5];

function read(): Store {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Store) : {};
  } catch {
    return {};
  }
}
let cache = read();

export function record(id: string, correct: boolean) {
  const now = Date.now();
  const r = cache[id] ?? { ok: 0, bad: 0, box: 0, due: now, last: now };
  const box = correct ? Math.min(5, r.box + 1) : 0;
  cache = { ...cache, [id]: { ok: r.ok + (correct ? 1 : 0), bad: r.bad + (correct ? 0 : 1), box, due: now + GAP[box], last: now } };
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    /* saqlab bo'lmadi — xotirada qoladi */
  }
  listeners.forEach((l) => l());
}

export function resetReview() {
  cache = {};
  try { localStorage.removeItem(KEY); } catch { /* */ }
  listeners.forEach((l) => l());
}

export function useReview(): Store {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => cache,
  );
}

/** Mavzu bo'yicha statistika: id lar "t3:..." ko'rinishida */
export function topicStats(store: Store, prefix: string) {
  let ok = 0, bad = 0, seen = 0, weak = 0;
  for (const [id, r] of Object.entries(store)) {
    if (!id.startsWith(prefix)) continue;
    seen++;
    ok += r.ok;
    bad += r.bad;
    if (r.box === 0) weak++;
  }
  return { ok, bad, seen, weak, pct: ok + bad ? Math.round((ok / (ok + bad)) * 100) : null };
}

/** Qayta so'rash vaqti kelgan (yoki oxirgi marta xato qilingan) id lar */
export function dueIds(store: Store, now = Date.now()) {
  return Object.entries(store)
    .filter(([, r]) => r.due <= now && (r.box < 3 || r.bad > 0))
    .sort((a, b) => a[1].box - b[1].box || a[1].due - b[1].due)
    .map(([id]) => id);
}
