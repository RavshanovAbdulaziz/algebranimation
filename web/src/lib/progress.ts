import { useSyncExternalStore } from "react";

const KEY = "algebranimation:done";
const listeners = new Set<() => void>();

function read(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

let cache = read();

function write(ids: string[]) {
  cache = ids;
  try {
    localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    /* saqlash imkoni yo'q — xotirada qoladi */
  }
  listeners.forEach((l) => l());
}

export function toggleDone(id: string) {
  write(cache.includes(id) ? cache.filter((x) => x !== id) : [...cache, id]);
}
export function markDone(id: string) {
  if (!cache.includes(id)) write([...cache, id]);
}

export function useDone(): string[] {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => cache,
  );
}
