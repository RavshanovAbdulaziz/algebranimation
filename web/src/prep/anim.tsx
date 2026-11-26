import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Tex } from "../components/Tex";
import { tn, tp } from "./core";

/*
 * Sonlarning sayohati — FLIP dvigateli.
 *
 * Kadr koordinatalar bilan emas, ma'no bilan yoziladi: jadval, formula qatori, kasr — oddiy HTML oqimida.
 * Har bir son (token) o'z id siga ega. Kadr almashganda dvigatel eski va yangi joylarni o'lchaydi va:
 *   • id saqlangan son   → eski joyidan yangi joyiga uchadi (FLIP);
 *   • `from: id`          → nusxa manba sonning joyidan uchib chiqadi (katakdan formulaga);
 *   • `eat: [id…]`        → bu sonlar natija tomon uchib, unga singib ketadi (ko'paytirish, qo'shish);
 *   • yo'qolgan son        → o'z joyida so'nadi.
 * Diagonal chiziq, o'chirish chizig'i va ramka ham sonlarning haqiqiy joyidan hisoblanadi.
 */

export type Tone = "a" | "b" | "c" | "d" | "res" | "dim" | "goal" | "gray";
/**
 * op — birlashish paytida natija ustida qisqa ko'rinadigan amal belgisi (×, +, −, ÷):
 * sonlar birlashganda qaysi amal bajarilgani ko'rinib tursin.
 */
export interface Tok {
  id: string; t: string; tex?: boolean; tone?: Tone; from?: string; eat?: string[]; op?: string;
  /**
   * Ataylab ko'chirish (masalan, o'rin almashish). Qoida: faqat ma'noli harakat harakat bo'ladi —
   * bir qator ichida tasodifan surilgan son uchmaydi, faqat `move` bo'lsa yoki boshqa qatorga o'tsa uchadi.
   */
  move?: boolean;
}
export interface MatItem { kind: "mat"; id: string; rows: Tok[][]; br?: "v" | "p"; augAt?: number; ext?: Tok[][]; label?: string }
export interface FracItem { kind: "frac"; id: string; num: Tok[]; den: Tok[] }
export type Item = Tok | MatItem | FracItem;
export type Decor =
  | { kind: "line"; a: string; b: string; tone: Tone }
  | { kind: "strike"; a: string; b: string }
  | { kind: "box"; ids: string[]; tone: Tone };
/**
 * note — shu qadamda bajarilgan hisob "daftar"ga yoziladi va keyingi qadamlarda ham ko'rinib turadi.
 * Animatsiya ko'zni yo'naltiradi, daftar esa xotirani ushlab turadi (o'tkinchi ma'lumot effektiga qarshi).
 */
export interface Frame { lines: Item[][]; decor?: Decor[]; cap: ReactNode; note?: string }

/** Uchish: ko'z kuzata oladigan yo'l — yumshoq boshlanadi, oxirida sekinlashadi */
const EASE = "cubic-bezier(0.45, 0, 0.2, 1)";
const POP = "cubic-bezier(0.16, 1, 0.3, 1)";
const FLY = 950;
/** bir nechta son birga uchsa — birin-ketin */
const STAGGER = 140;
const isMat = (x: Item): x is MatItem => (x as MatItem).kind === "mat";
const isFrac = (x: Item): x is FracItem => (x as FracItem).kind === "frac";

/* ------------------------------------------------------------------ */
/* Ko'rinish                                                           */
/* ------------------------------------------------------------------ */

function TokEl({ k }: { k: Tok }) {
  return (
    <span className={"fx-tok" + (k.tone ? ` t-${k.tone}` : "")} data-tid={k.id}>
      {k.tex ? <Tex>{k.t}</Tex> : k.t}
    </span>
  );
}

function MatEl({ m }: { m: MatItem }) {
  const n = m.rows[0]?.length ?? 0;
  return (
    <span className="fx-matwrap">
      {m.label !== undefined && m.label !== "" && <span className="fx-lab"><Tex>{m.label}</Tex></span>}
      <span className={`fx-mat br-${m.br ?? "p"}`} style={{ gridTemplateColumns: `repeat(${n}, auto)` }}>
        {m.rows.map((r) => r.map((k, j) => (
          <span key={k.id} className={"fx-cell" + (m.augAt === j ? " aug" : "")}><TokEl k={k} /></span>
        )))}
      </span>
      {m.ext && (
        <span className="fx-mat fx-ext" style={{ gridTemplateColumns: `repeat(${m.ext[0].length}, auto)` }}>
          {m.ext.map((r) => r.map((k) => <span key={k.id} className="fx-cell"><TokEl k={k} /></span>))}
        </span>
      )}
    </span>
  );
}

function FracEl({ f }: { f: FracItem }) {
  return (
    <span className="fx-frac">
      <span className="fx-num">{f.num.map((k) => <TokEl key={k.id} k={k} />)}</span>
      <span className="fx-den">{f.den.map((k) => <TokEl key={k.id} k={k} />)}</span>
    </span>
  );
}

interface Rect { x: number; y: number; w: number; h: number }
interface Snap extends Rect { node: HTMLElement; line: number }
type Geo =
  | { key: string; kind: "line" | "strike"; x1: number; y1: number; x2: number; y2: number; tone?: Tone }
  | { key: string; kind: "box"; x: number; y: number; w: number; h: number; tone: Tone }
  | { key: string; kind: "path"; d: string; tone: Tone; delay: number; dur: number };

/** Tempni sekinlatish (o'quvchi o'zi tanlaydi) */
const SLOW_KEY = "algebranimation:fx-slow";
const readSlow = () => { try { return localStorage.getItem(SLOW_KEY) === "1"; } catch { return false; } };

/**
 * Harakat bu yerda bezak emas — tushuntirishning o'zi va faqat foydalanuvchi bosganda ishlaydi.
 * Shuning uchun tizimning "kamroq harakat" sozlamasi o'rniga o'yinchidagi o'z tugmamiz bor (eslab qolinadi).
 */
const MOTION_KEY = "algebranimation:fx-motion";
const readCalm = () => { try { return localStorage.getItem(MOTION_KEY) === "off"; } catch { return false; } };

function collect(lines: Item[][]) {
  const meta = new Map<string, Tok>();
  const add = (k: Tok) => meta.set(k.id, k);
  for (const line of lines) for (const it of line) {
    if (isMat(it)) { it.rows.flat().forEach(add); it.ext?.flat().forEach(add); }
    else if (isFrac(it)) { it.num.forEach(add); it.den.forEach(add); }
    else add(it);
  }
  return meta;
}

function Stage({ frame, step, minLines, calm, tempo }: { frame: Frame; step: number; minLines: number; calm: boolean; tempo: number }) {
  const root = useRef<HTMLDivElement>(null);
  const ghosts = useRef<HTMLDivElement>(null);
  const prev = useRef(new Map<string, Snap>());
  const [geo, setGeo] = useState<Geo[]>([]);

  useLayoutEffect(() => {
    const el = root.current!, gl = ghosts.current!;
    const reduce = calm;
    const fly = FLY * tempo, stag = STAGGER * tempo;
    const base = el.getBoundingClientRect();
    const toks = Array.from(el.querySelectorAll<HTMLElement>(".fx-lines [data-tid]"));
    toks.forEach((t) => t.getAnimations().forEach((a) => a.cancel()));
    gl.replaceChildren();

    const now = new Map<string, { el: HTMLElement; r: Rect; line: number }>();
    for (const t of toks) {
      const r = t.getBoundingClientRect();
      const line = Number((t.closest(".fx-line-row") as HTMLElement | null)?.dataset.line ?? -1);
      now.set(t.dataset.tid!, { el: t, r: { x: r.left - base.left, y: r.top - base.top, w: r.width, h: r.height }, line });
    }
    const meta = collect(frame.lines);
    const old = prev.current;
    const eaten = new Set<string>();
    const center = (r: Rect) => [r.x + r.w / 2, r.y + r.h / 2];
    const g: Geo[] = [];

    /** Manbadan manzilgacha egri yo'l — uchish paytida chiziladi va qadam davomida xira qolib turadi */
    const trail = (from: Rect, to: Rect, tone: Tone, delay: number, key: string) => {
      const [x1, y1] = center(from), [x2, y2] = center(to);
      const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy);
      if (len < 24) return;
      const bend = Math.min(60, len * 0.22);
      const cx = (x1 + x2) / 2 - (dy / len) * bend, cy = (y1 + y2) / 2 + (dx / len) * bend;
      // strelka uchi son ustiga tushmasin: oxirini biroz qisqartiramiz
      const k = Math.max(0, 1 - 16 / len);
      const ex = cx + (x2 - cx) * k, ey = cy + (y2 - cy) * k;
      g.push({ key: `path-${key}-${step}`, kind: "path", d: `M ${x1} ${y1} Q ${cx} ${cy} ${ex} ${ey}`, tone, delay, dur: fly });
    };

    const flip = (t: HTMLElement, from: Rect, to: Rect, delay = 0) => {
      const [fx, fy] = center(from), [tx, ty] = center(to);
      if (reduce) { t.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220, delay: delay / 3, fill: "backwards" }); return; }
      // egri yo'l bo'ylab: o'rtada yo'ldan biroz chetga chiqadi (iz bilan mos)
      const dx = tx - fx, dy = ty - fy, len = Math.hypot(dx, dy) || 1, bend = Math.min(60, len * 0.22) * 0.5;
      const mx = -dx / 2 - (dy / len) * bend, my = -dy / 2 + (dx / len) * bend;
      t.animate(
        [
          { transform: `translate(${fx - tx}px, ${fy - ty}px) scale(1.12)`, zIndex: 3 },
          { transform: `translate(${mx}px, ${my}px) scale(1.18)`, offset: 0.5 },
          { transform: "translate(0, 0) scale(1)" },
        ],
        { duration: fly, delay, easing: EASE, fill: "backwards" },
      );
    };
    const ghost = (s: Snap, to: Rect | null, delay = 0) => {
      const el2 = document.createElement("div");
      el2.className = "fx-ghost";
      el2.appendChild(s.node.cloneNode(true));
      el2.style.left = `${s.x}px`;
      el2.style.top = `${s.y}px`;
      el2.style.width = `${s.w}px`;
      el2.style.height = `${s.h}px`;
      gl.appendChild(el2);
      let kf: Keyframe[] = [{ opacity: 1 }, { opacity: 0 }];
      if (to && !reduce) {
        const [fx, fy] = center(s), [tx, ty] = center(to);
        kf = [
          { transform: "translate(0, 0)", opacity: 1 },
          { transform: `translate(${(tx - fx) * 0.85}px, ${(ty - fy) * 0.85}px) scale(.85)`, opacity: 1, offset: 0.75 },
          { transform: `translate(${tx - fx}px, ${ty - fy}px) scale(.4)`, opacity: 0 },
        ];
      }
      const a = el2.animate(kf, { duration: to ? fly : 260, delay, easing: to ? EASE : "ease-out", fill: "both" });
      a.onfinish = () => el2.remove();
    };
    const badge = (op: string, r: Rect, delay: number) => {
      const b = document.createElement("div");
      b.className = "fx-op";
      b.textContent = op;
      const [cx] = center(r);
      b.style.left = `${cx}px`;
      b.style.top = `${r.y - 6}px`;
      gl.appendChild(b);
      const a = b.animate(
        [{ opacity: 0, transform: "translate(-50%, -40%) scale(.6)" }, { opacity: 1, transform: "translate(-50%, -100%) scale(1)", offset: 0.25 }, { opacity: 1, transform: "translate(-50%, -100%) scale(1)", offset: 0.8 }, { opacity: 0, transform: "translate(-50%, -130%) scale(.9)" }],
        { duration: 1500 * tempo, delay, easing: POP, fill: "both" },
      );
      a.onfinish = () => b.remove();
    };

    /** Manba katak "shu yerdan olindi" deb bir lahza yonadi — son ko'chmaydi, nusxasi olinadi */
    const pulse = (src: HTMLElement | undefined, delay: number) => {
      if (!src || reduce) return;
      src.animate(
        [{ boxShadow: "0 0 0 0 rgba(255,255,255,0)" }, { boxShadow: "0 0 0 3px rgba(255,255,255,.55)", offset: 0.3 }, { boxShadow: "0 0 0 0 rgba(255,255,255,0)" }],
        { duration: 700 * tempo, delay },
      );
    };

    let copyN = 0, mergeN = 0;
    now.forEach(({ el: t, r, line }, id) => {
      const m = meta.get(id);
      const o = old.get(id);
      if (o) {
        // faqat ma'noli harakat: boshqa qatorga o'tgan yoki ataylab ko'chirilgan son uchadi
        if (m?.move || o.line !== line) flip(t, o, r);
      } else if (m?.from && old.get(m.from)) {
        const delay = reduce ? 0 : copyN++ * stag;
        pulse(now.get(m.from)?.el, delay);
        flip(t, old.get(m.from)!, r, delay);
        trail(old.get(m.from)!, r, m.tone ?? "a", delay, id);
      } else if (m?.eat?.some((e) => old.has(e))) {
        // birlashish: kirish sonlari natija tomon uchib, unga singib ketadi
        const start = reduce ? 0 : mergeN++ * stag;
        m.eat.forEach((e, i) => { const s = old.get(e); if (s) { ghost(s, r, start + i * 40 * tempo); eaten.add(e); } });
        t.animate(
          reduce ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 0, transform: "scale(.4)" }, { opacity: 1, transform: "scale(1.22)", offset: 0.6 }, { opacity: 1, transform: "scale(1)" }],
          { duration: 560 * tempo, delay: reduce ? 0 : start + fly * 0.72, easing: POP, fill: "backwards" },
        );
        if (m.op) badge(m.op, r, reduce ? 0 : start + fly * 0.35);
      } else {
        t.animate([{ opacity: 0, transform: reduce ? "none" : "translateY(6px)" }, { opacity: 1, transform: "none" }], { duration: 380 * tempo, delay: 160 * tempo, easing: POP, fill: "backwards" });
      }
    });
    old.forEach((s, id) => { if (!now.has(id) && !eaten.has(id)) ghost(s, null); });

    const snap = new Map<string, Snap>();
    now.forEach(({ el: t, r, line }, id) => {
      const c = t.cloneNode(true) as HTMLElement;
      c.removeAttribute("data-tid");
      snap.set(id, { ...r, node: c, line });
    });
    prev.current = snap;

    // bezaklar — sonlarning haqiqiy joyidan
    (frame.decor ?? []).forEach((d, i) => {
      if (d.kind === "box") {
        const rs = d.ids.map((id) => now.get(id)?.r).filter(Boolean) as Rect[];
        if (!rs.length) return;
        const x1 = Math.min(...rs.map((r) => r.x)), y1 = Math.min(...rs.map((r) => r.y));
        const x2 = Math.max(...rs.map((r) => r.x + r.w)), y2 = Math.max(...rs.map((r) => r.y + r.h));
        g.push({ key: `box${i}`, kind: "box", x: x1 - 8, y: y1 - 5, w: x2 - x1 + 16, h: y2 - y1 + 10, tone: d.tone });
      } else {
        const A = now.get(d.a)?.r, B = now.get(d.b)?.r;
        if (!A || !B) return;
        const [ax, ay] = center(A), [bx, by] = center(B);
        const len = Math.hypot(bx - ax, by - ay) || 1, ux = (bx - ax) / len, uy = (by - ay) / len, ext = d.kind === "line" ? 16 : 22;
        g.push({ key: `${d.kind}-${d.a}-${d.b}-${step}`, kind: d.kind, x1: ax - ux * ext, y1: ay - uy * ext, x2: bx + ux * ext, y2: by + uy * ext, tone: d.kind === "line" ? d.tone : undefined });
      }
    });
    setGeo(g);
  }, [frame, step, calm, tempo]);

  return (
    <div className="fx-stage" ref={root} style={{ minHeight: `${minLines * 64 + 24}px` }}>
      <div className="fx-decor" aria-hidden="true">
        {geo.map((d) => d.kind === "box" && (
          <div key={d.key} className={`fx-box t-${d.tone}`} style={{ transform: `translate(${d.x}px, ${d.y}px)`, width: d.w, height: d.h }} />
        ))}
        <svg className="fx-svg">
          <defs>
            {(["a", "b", "c", "d", "goal", "res", "gray"] as Tone[]).map((t) => (
              <marker key={t} id={`fx-arrow-${t}`} viewBox="0 0 10 10" refX="7" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M 0 1 L 9 5 L 0 9 z" className={`fx-mk t-${t}`} />
              </marker>
            ))}
          </defs>
          {geo.map((d) => d.kind === "path" ? (
            <path key={d.key} d={d.d} pathLength={1} className={`fx-trail t-${d.tone}`} markerEnd={`url(#fx-arrow-${d.tone})`} style={{ animationDelay: `${d.delay}ms`, animationDuration: `${d.dur}ms` }} />
          ) : d.kind !== "box" && (
            <line key={d.key} x1={d.x1} y1={d.y1} x2={d.x2} y2={d.y2} pathLength={1} className={d.kind === "strike" ? "fx-strike" : `fx-line t-${d.tone}`} />
          ))}
        </svg>
      </div>
      <div className="fx-lines">
        {frame.lines.map((line, li) => (
          <div key={li} className="fx-line-row" data-line={li}>
            {line.map((it) => (isMat(it) ? <MatEl key={it.id} m={it} /> : isFrac(it) ? <FracEl key={it.id} f={it} /> : <TokEl key={it.id} k={it} />))}
          </div>
        ))}
      </div>
      <div className="fx-ghosts" ref={ghosts} aria-hidden="true" />
    </div>
  );
}

export function AnimPlayer({ frames, speed = 2600 }: { frames: Frame[]; speed?: number }) {
  const [k, setK] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [calm, setCalm] = useState(readCalm);
  const [slow, setSlow] = useState(readSlow);
  const tempo = slow ? 1.7 : 1;
  const toggleCalm = () => {
    const v = !calm;
    setCalm(v);
    try { localStorage.setItem(MOTION_KEY, v ? "off" : "on"); } catch { /* saqlab bo'lmadi */ }
  };
  const toggleSlow = () => {
    const v = !slow;
    setSlow(v);
    try { localStorage.setItem(SLOW_KEY, v ? "1" : "0"); } catch { /* saqlab bo'lmadi */ }
  };
  const minLines = useMemo(() => Math.max(...frames.map((f) => f.lines.length)), [frames]);
  const totalNotes = useMemo(() => frames.filter((f) => f.note).length, [frames]);
  useEffect(() => {
    if (!playing) return;
    if (k >= frames.length - 1) { setPlaying(false); return; }
    const t = window.setTimeout(() => setK((v) => v + 1), speed * tempo);
    return () => window.clearTimeout(t);
  }, [playing, k, frames.length, speed, tempo]);
  const f = frames[Math.min(k, frames.length - 1)];
  const notes = frames.slice(0, k + 1).map((fr, i) => ({ i, note: fr.note })).filter((x) => x.note);
  const go = (i: number) => { setPlaying(false); setK(Math.max(0, Math.min(frames.length - 1, i))); };
  return (
    <div className={"fx" + (calm ? " calm" : "")} onKeyDown={(e) => { if (e.key === "ArrowRight") go(k + 1); if (e.key === "ArrowLeft") go(k - 1); }}>
      <div className="fx-cap" key={k} aria-live="polite"><span className="fx-stepno">{k + 1}</span><span>{f.cap}</span></div>
      <div className={"fx-body" + (totalNotes ? " has-notes" : "")}>
        <Stage frame={f} step={k} minLines={minLines} calm={calm} tempo={tempo} />
        {totalNotes > 0 && (
          <aside className="fx-notes" aria-label="Daftar" style={{ ["--rows" as string]: totalNotes }}>
            <div className="fx-notes-h">Daftar</div>
            {notes.length === 0 && <div className="fx-notes-empty">Hisoblar shu yerga yozib boriladi.</div>}
            <ol>
              {notes.map((x) => (
                <li key={x.i} className={x.i === k ? "new" : ""} onClick={() => go(x.i)}><Tex>{x.note!}</Tex></li>
              ))}
            </ol>
          </aside>
        )}
      </div>
      <div className="fx-ctl">
        <button className="fx-btn" disabled={k === 0} onClick={() => go(k - 1)} aria-label="Oldingi qadam">
          <svg viewBox="0 0 16 16" width="14" height="14"><path d="M10 3 5 8l5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <button className="fx-btn fx-play" onClick={() => { if (k >= frames.length - 1) setK(0); setPlaying(!playing); }}>
          {playing
            ? <><svg viewBox="0 0 16 16" width="13" height="13"><path d="M5 3v10M11 3v10" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" /></svg>To'xtatish</>
            : <><svg viewBox="0 0 16 16" width="13" height="13"><path d="M5 3.2v9.6L13 8z" fill="currentColor" /></svg>{k >= frames.length - 1 ? "Qaytadan" : k === 0 ? "Ko'rsatish" : "Davom ettirish"}</>}
        </button>
        <button className="fx-btn" disabled={k >= frames.length - 1} onClick={() => go(k + 1)} aria-label="Keyingi qadam">
          <svg viewBox="0 0 16 16" width="14" height="14"><path d="m6 3 5 5-5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <div className="fx-track" role="group" aria-label="Qadamlar">
          {frames.map((_, i) => <button key={i} className={"fx-dot" + (i === k ? " on" : i < k ? " done" : "")} onClick={() => go(i)} aria-label={`${i + 1}-qadam`} />)}
        </div>
        <span className="fx-count">{k + 1} / {frames.length}</span>
        <button className="fx-motion" onClick={toggleSlow} aria-pressed={slow} title="Uchishni sekinlatish">
          {slow ? "Sekin" : "Odatiy tezlik"}
        </button>
        <button className="fx-motion" onClick={toggleCalm} aria-pressed={!calm} title="Sonlarning uchishini yoqish yoki o'chirish">
          Harakat: {calm ? "o'chiq" : "yoqiq"}
        </button>
      </div>
    </div>
  );
}

/* ================================================================== */
/* Token yasovchilar                                                   */
/* ================================================================== */

const MINUS = "\u2212";
const int = (v: number) => (v < 0 ? `${MINUS}${-v}` : `${v}`);
/** son → token (kasr bo'lsa KaTeX) */
const T = (id: string, v: number | string, o: Partial<Tok> = {}): Tok =>
  typeof v === "string" ? { id, t: v, ...o } : Number.isInteger(v) ? { id, t: int(v), ...o } : { id, t: tn(v), tex: true, ...o };
/** ko'paytmada manfiy son qavsda */
const P = (id: string, v: number, o: Partial<Tok> = {}): Tok =>
  v < 0 ? (Number.isInteger(v) ? { id, t: `(${int(v)})`, ...o } : { id, t: `\\left(${tn(v)}\\right)`, tex: true, ...o }) : T(id, v, o);
const X = (id: string, tex: string, o: Partial<Tok> = {}): Tok => ({ id, t: tex, tex: true, ...o });
const O = (id: string, s: string, o: Partial<Tok> = {}): Tok => ({ id, t: s === "-" ? MINUS : s, ...o });
const M = (id: string, rows: Tok[][], o: Partial<MatItem> = {}): MatItem => ({ kind: "mat", id, rows, ...o });
const F = (id: string, num: Tok[], den: Tok[]): FracItem => ({ kind: "frac", id, num, den });
const cellsOf = (pre: string, m: number[][], tone?: (i: number, j: number) => Tone | undefined) =>
  m.map((r, i) => r.map((v, j) => T(`${pre}${i}${j}`, v, { tone: tone?.(i, j) })));
const det2 = (m: number[][]) => m[0][0] * m[1][1] - m[0][1] * m[1][0];
const det3 = (m: number[][]) =>
  m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
const minorOf = (m: number[][], i: number, j: number) => m.filter((_, a) => a !== i).map((r) => r.filter((_, b) => b !== j));
const fracTex = (D: number) => (D === 1 ? "1\\cdot" : D === -1 ? "-1\\cdot" : D < 0 ? `-\\frac{1}{${-D}}` : `\\frac{1}{${D}}`);
/** [a, +, b, +, c] — tokenlar orasiga amal belgisi */
const joinOps = (toks: Tok[], pre: string, s = "+") => toks.flatMap((t, i) => (i ? [O(`${pre}${i}`, s), t] : [t]));
const Em = ({ children }: { children: ReactNode }) => <b className="fx-em">{children}</b>;
const N = ({ v }: { v: number }) => <Tex>{tn(v)}</Tex>;

/* ================================================================== */
/* 2×2 determinant                                                     */
/* ================================================================== */

export function det2Anim(m: number[][], label = "\\Delta"): Frame[] {
  const [[a, b], [c, d]] = m;
  const p1 = a * d, p2 = b * c, r = p1 - p2;
  const head = (tone?: (i: number, j: number) => Tone | undefined) => [X("lab", `${label} =`), M("M", cellsOf("m", m, tone), { br: "v" })];
  const main = (i: number, j: number) => (i === j ? "a" : undefined) as Tone | undefined;
  const both = (i: number, j: number) => (i === j ? "a" : "b") as Tone;
  const frames: Frame[] = [
    { lines: [head()], cap: <>2×2 determinant: ikkita diagonal bor.</> },
    { lines: [head(main)], decor: [{ kind: "line", a: "m00", b: "m11", tone: "a" }], cap: <><Em>Bosh diagonal</Em> — chapdan o'ngga pastga.</> },
    { lines: [head(main), [P("e1", a, { tone: "a", from: "m00" }), O("o1", "·"), P("e2", d, { tone: "a", from: "m11" })]], decor: [{ kind: "line", a: "m00", b: "m11", tone: "a" }], cap: <>Bosh diagonal sonlari pastga tushadi…</> },
    { lines: [head(main), [T("p1", p1, { tone: "a", eat: ["e1", "o1", "e2"], op: "×" })]], note: `${tp(a)}\\cdot${tp(d)} = ${tn(p1)}`, cap: <>…va ko'paytiriladi: <Em>{int(p1)}</Em></> },
    { lines: [head(both), [T("p1", p1, { tone: "a" }), O("o2", "-"), P("f1", b, { tone: "b", from: "m01" }), O("o3", "·"), P("f2", c, { tone: "b", from: "m10" })]], decor: [{ kind: "line", a: "m01", b: "m10", tone: "b" }], cap: <><Em>Yon diagonal</Em> sonlari tushadi — ular <Em>ayiriladi</Em>.</> },
    { lines: [head(both), [T("p1", p1, { tone: "a" }), O("o2", "-"), P("p2", p2, { tone: "b", eat: ["f1", "o3", "f2"], op: "×" })]], note: `${tp(b)}\\cdot${tp(c)} = ${tn(p2)}`, cap: <>Ko'paytiramiz: <Em>{int(p2)}</Em></> },
  ];
  let tail = ["p1", "o2", "p2"];
  if (p2 < 0) {
    frames.push({ lines: [head(), [T("p1", p1, { tone: "a" }), O("o4", "+", { eat: ["o2"] }), T("p2b", -p2, { tone: "b", eat: ["p2"] })]], cap: <>Manfiy sonni ayirish — qo'shish.</> });
    tail = ["p1", "o4", "p2b"];
  }
  frames.push({ lines: [head(), [X("lab2", `${label} =`), T("res", r, { tone: "res", eat: tail, op: "−" })]], note: `${label} = ${tn(p1)} - ${tp(p2)} = ${tn(r)}`, cap: <>Javob: <Em>{int(r)}</Em></> });
  return frames;
}

/* ================================================================== */
/* 3×3 Sarrus                                                          */
/* ================================================================== */

export function sarrusAnim(m: number[][], label = "\\Delta"): Frame[] {
  const idAt = (i: number, col: number) => (col < 3 ? `m${i}${col}` : `e${i}${col - 3}`);
  const valAt = (i: number, col: number) => m[i][col % 3];
  const plus = [0, 1, 2].map((k) => [[0, k], [1, k + 1], [2, k + 2]]);
  const minus = [0, 1, 2].map((k) => [[0, k + 2], [1, k + 1], [2, k]]);
  const prod = (cs: number[][]) => cs.reduce((s, [i, c]) => s * valAt(i, c), 1);
  const head = (on: number[][] = [], tone: Tone = "a", ext = true): Item[] => {
    const hot = new Set(on.map(([i, c]) => idAt(i, c)));
    return [
      X("lab", `${label} =`),
      M("M", m.map((r, i) => r.map((v, j) => T(idAt(i, j), v, { tone: hot.has(idAt(i, j)) ? tone : undefined }))), {
        br: "v",
        ext: ext ? m.map((r, i) => [0, 1].map((j) => T(idAt(i, 3 + j), r[j], { tone: hot.has(idAt(i, 3 + j)) ? tone : "gray", from: `m${i}${j}` }))) : undefined,
      }),
    ];
  };
  const frames: Frame[] = [
    { lines: [head([], "a", false)], cap: <>3×3 determinant — <Em>Sarrus qoidasi</Em>: 6 ta ko'paytma.</> },
    { lines: [head()], cap: <>1- va 2-ustun o'ng tomonga ko'chadi — endi har bir uchlik to'g'ri chiziqda.</> },
  ];
  const row2: Tok[] = [];
  plus.forEach((cs, k) => {
    const copies = cs.map(([i, c], t) => P(`pc${k}${t}`, valAt(i, c), { tone: "a", from: idAt(i, c) }));
    const line = (cur: Tok[]) => [O("ps", "+", { tone: "a" }), ...joinOps([...row2, ...cur], "pp")];
    frames.push({ lines: [head(cs, "a"), line(joinOps(copies, `pd${k}`, "·"))], decor: [{ kind: "line", a: idAt(cs[0][0], cs[0][1]), b: idAt(cs[2][0], cs[2][1]), tone: "a" }], cap: <><Em>"+" chiziq {k + 1}</Em>: uchta son pastga tushadi.</> });
    frames.push({ lines: [head(cs, "a"), line([T(`P${k}`, prod(cs), { tone: "a", eat: [...copies.map((c) => c.id), `pd${k}1`, `pd${k}2`], op: "×" })])], note: `${cs.map(([i, c]) => tp(valAt(i, c))).join("\\cdot ")} = ${tn(prod(cs))}`, cap: <>Ko'paytma: <Em>{int(prod(cs))}</Em></> });
    row2.push(T(`P${k}`, prod(cs), { tone: "a" }));
  });
  const sp = plus.reduce((s, cs) => s + prod(cs), 0);
  frames.push({ lines: [head(), [O("ps", "+", { tone: "a" }), T("SP", sp, { tone: "a", eat: ["P0", "pp1", "P1", "pp2", "P2"], op: "+" })]], note: `${plus.map((cs) => tp(prod(cs))).join(" + ")} = ${tn(sp)}`, cap: <>"+" lar yig'indisi: <Em>{int(sp)}</Em></> });
  const row3: Tok[] = [];
  minus.forEach((cs, k) => {
    const copies = cs.map(([i, c], t) => P(`mc${k}${t}`, valAt(i, c), { tone: "b", from: idAt(i, c) }));
    const line = (cur: Tok[]) => [O("ms", "-", { tone: "b" }), ...joinOps([...row3, ...cur], "mp")];
    const top = [O("ps", "+", { tone: "a" }), T("SP", sp, { tone: "a" })];
    frames.push({ lines: [head(cs, "b"), top, line(joinOps(copies, `md${k}`, "·"))], decor: [{ kind: "line", a: idAt(cs[0][0], cs[0][1]), b: idAt(cs[2][0], cs[2][1]), tone: "b" }], cap: <><Em>"−" chiziq {k + 1}</Em>: o'ngdan chapga pastga.</> });
    frames.push({ lines: [head(cs, "b"), top, line([T(`Q${k}`, prod(cs), { tone: "b", eat: [...copies.map((c) => c.id), `md${k}1`, `md${k}2`], op: "×" })])], note: `${cs.map(([i, c]) => tp(valAt(i, c))).join("\\cdot ")} = ${tn(prod(cs))}`, cap: <>Ko'paytma: <Em>{int(prod(cs))}</Em></> });
    row3.push(T(`Q${k}`, prod(cs), { tone: "b" }));
  });
  const sm = minus.reduce((s, cs) => s + prod(cs), 0);
  frames.push({ lines: [head(), [O("ps", "+", { tone: "a" }), T("SP", sp, { tone: "a" })], [O("ms", "-", { tone: "b" }), T("SM", sm, { tone: "b", eat: ["Q0", "mp1", "Q1", "mp2", "Q2"], op: "+" })]], note: `${minus.map((cs) => tp(prod(cs))).join(" + ")} = ${tn(sm)}`, cap: <>"−" lar yig'indisi: <Em>{int(sm)}</Em></> });
  frames.push({ lines: [head(), [T("SP", sp, { tone: "a" }), O("mn", "-"), P("SM", sm, { tone: "b" })]], cap: <>Ikkinchisini birinchisidan ayiramiz.</> });
  frames.push({ lines: [head(), [X("lab2", `${label} =`), T("R", sp - sm, { tone: "res", eat: ["SP", "mn", "SM"], op: "−" })]], note: `${label} = ${tn(sp)} - ${tp(sm)} = ${tn(sp - sm)}`, cap: <>Javob: <Em>{int(sp - sm)}</Em></> });
  return frames;
}

/* ================================================================== */
/* Minor va algebraik to'ldiruvchi                                     */
/* ================================================================== */

export function cofactorAnim(m: number[][], i: number, j: number): Frame[] {
  const I = i + 1, J = j + 1, n = m.length;
  const mm = minorOf(m, i, j), Mv = det2(mm), s = (i + j) % 2 ? -1 : 1;
  const rem: [number, number][] = [];
  for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) if (a !== i && b !== j) rem.push([a, b]);
  const goal = (a: number, b: number) => (a === i && b === j ? "goal" : undefined) as Tone | undefined;
  const cut = (a: number, b: number) => (a === i && b === j ? "goal" : a === i || b === j ? "dim" : undefined) as Tone | undefined;
  const strikes: Decor[] = [{ kind: "strike", a: `m${i}0`, b: `m${i}${n - 1}` }, { kind: "strike", a: `m0${j}`, b: `m${n - 1}${j}` }];
  const minorM = (tone?: (k: number) => Tone | undefined) =>
    M("N", [0, 1].map((r) => [0, 1].map((c) => { const [a, b] = rem[r * 2 + c]; return T(`n${r}${c}`, m[a][b], { from: `m${a}${b}`, tone: tone?.(r * 2 + c) }); })), { br: "v", label: `M_{${I}${J}} =` });
  const big = (tone: typeof cut) => M("M", cellsOf("m", m, tone), { br: "v" });
  const diagTone = (k: number) => (k === 0 || k === 3 ? "a" : "b") as Tone;
  return [
    { lines: [[big(goal)]], cap: <><Tex>{`A_{${I}${J}}`}</Tex> — {I}-satr, {J}-ustundagi o'rin uchun.</> },
    { lines: [[big(cut)]], decor: strikes, cap: <>{I}-satr va {J}-ustun <Em>o'chiriladi</Em>.</> },
    { lines: [[big(cut), X("ar", "\\longrightarrow"), minorM()]], decor: strikes, cap: <>Qolgan 4 son <Em>minor</Em>ga ko'chadi.</> },
    { lines: [[big(cut), X("ar", "\\longrightarrow"), minorM(diagTone)], [P("x1", mm[0][0], { tone: "a", from: "n00" }), O("x2", "·"), P("x3", mm[1][1], { tone: "a", from: "n11" }), O("x4", "-"), P("x5", mm[0][1], { tone: "b", from: "n01" }), O("x6", "·"), P("x7", mm[1][0], { tone: "b", from: "n10" })]], decor: [{ kind: "line", a: "n00", b: "n11", tone: "a" }, { kind: "line", a: "n01", b: "n10", tone: "b" }], cap: <>Minor — oddiy 2×2: bosh diagonal minus yon diagonal.</> },
    { lines: [[big(cut), X("ar", "\\longrightarrow"), minorM()], [X("ml", `M_{${I}${J}} =`), T("Mv", Mv, { tone: "c", eat: ["x1", "x2", "x3", "x4", "x5", "x6", "x7"], op: "−" })]], note: `M_{${I}${J}} = ${tp(mm[0][0])}\\cdot${tp(mm[1][1])} - ${tp(mm[0][1])}\\cdot${tp(mm[1][0])} = ${tn(Mv)}`, cap: <>Minor: <Em>{int(Mv)}</Em></> },
    { lines: [[big(cut)], [X("sg", `(-1)^{${I}+${J}}`, { tone: "d" }), O("so", "·"), P("Mv", Mv, { tone: "c" })]], cap: <>Ishora: {I} + {J} = {I + J} — {s > 0 ? "juft" : "toq"}.</> },
    { lines: [[big(cut)], [T("sg2", s > 0 ? "+1" : `${MINUS}1`, { tone: "d", eat: ["sg"] }), O("so", "·"), P("Mv", Mv, { tone: "c" })]], cap: <>{s > 0 ? "Juft — ishora o'zgarmaydi." : "Toq — ishora o'zgaradi."}</> },
    { lines: [[big(goal)], [X("al", `A_{${I}${J}} =`), T("A", s * Mv, { tone: "res", eat: ["sg2", "so", "Mv"], op: "×" })]], note: `A_{${I}${J}} = (-1)^{${I}+${J}}\\cdot ${tp(Mv)} = ${tn(s * Mv)}`, cap: <>Javob: <Tex>{`A_{${I}${J}} = ${s * Mv}`}</Tex></> },
  ];
}

/* ================================================================== */
/* Laplas yoyilmasi (3×3)                                              */
/* ================================================================== */

export function laplaceAnim(m: number[][]): Frame[] {
  let best = { row: true, k: 0, z: -1 };
  for (let k = 0; k < 3; k++) {
    const zr = m[k].filter((x) => x === 0).length, zc = m.filter((r) => r[k] === 0).length;
    if (zr > best.z) best = { row: true, k, z: zr };
    if (zc > best.z) best = { row: false, k, z: zc };
  }
  const pos = [0, 1, 2].map((t) => (best.row ? [best.k, t] : [t, best.k]) as [number, number]);
  const lineIds = pos.map(([a, b]) => `m${a}${b}`);
  const onLine = (a: number, b: number) => pos.some(([p, q]) => p === a && q === b);
  const big = (tone?: (a: number, b: number) => Tone | undefined) => M("M", cellsOf("m", m, tone ?? ((a, b) => (onLine(a, b) ? "a" : undefined))), { br: "v" });
  const frames: Frame[] = [
    { lines: [[big()]], decor: [{ kind: "box", ids: lineIds, tone: "a" }], cap: <>Eng ko'p nol bor {best.row ? "satr" : "ustun"} — <Em>{best.k + 1}-{best.row ? "satr" : "ustun"}</Em>. Shu bo'yicha yoyamiz.</> },
  ];
  const terms: Tok[] = [];
  let total = 0;
  pos.forEach(([a, b], t) => {
    const e = m[a][b];
    const sign = (a + b) % 2 ? -1 : 1;
    const mm = minorOf(m, a, b);
    const A = sign * det2(mm);
    total += e * A;
    const rest = joinOps(terms, "lp");
    if (e === 0) {
      frames.push({ lines: [[big()], [...rest, ...(terms.length ? [O(`lz${t}`, "+")] : []), T(`z${t}`, 0, { tone: "gray", from: `m${a}${b}` })]], decor: [{ kind: "box", ids: lineIds, tone: "a" }], cap: <>Bu element 0 — uning hadi ham 0, hisoblamaymiz.</> });
      return;
    }
    const cut = (p: number, q: number) => (p === a && q === b ? "goal" : p === a || q === b ? "dim" : undefined) as Tone | undefined;
    const remIds: [number, number][] = [];
    for (let p = 0; p < 3; p++) for (let q = 0; q < 3; q++) if (p !== a && q !== b) remIds.push([p, q]);
    const mini = M(`mn${t}`, [0, 1].map((r) => [0, 1].map((c) => { const [p, q] = remIds[r * 2 + c]; return T(`k${t}${r}${c}`, m[p][q], { from: `m${p}${q}` }); })), { br: "v", label: sign > 0 ? "" : "-" });
    const plusOp = terms.length ? [O(`lj${t}`, "+")] : [];
    frames.push({ lines: [[big(cut)], [...rest, ...plusOp, P(`e${t}`, e, { tone: "goal", from: `m${a}${b}` }), O(`ed${t}`, "·"), mini]], decor: [{ kind: "strike", a: `m${a}0`, b: `m${a}2` }, { kind: "strike", a: `m0${b}`, b: `m2${b}` }], cap: <><Em>{int(e)}</Em> ning satri va ustuni o'chiriladi — qolgan 4 son uning minori{sign < 0 ? " (ishora: −)" : ""}.</> });
    frames.push({ lines: [[big(cut)], [...rest, ...plusOp, P(`e${t}`, e, { tone: "goal" }), O(`ed${t}`, "·"), P(`mv${t}`, A, { tone: "c", eat: [`k${t}00`, `k${t}01`, `k${t}10`, `k${t}11`], op: "−" })]], note: `A_{${a + 1}${b + 1}} = ${sign > 0 ? "" : "-"}(${tp(mm[0][0])}\\cdot${tp(mm[1][1])} - ${tp(mm[0][1])}\\cdot${tp(mm[1][0])}) = ${tn(A)}`, cap: <>Algebraik to'ldiruvchi: <Em>{int(A)}</Em></> });
    frames.push({ lines: [[big()], [...rest, ...plusOp, T(`tm${t}`, e * A, { tone: "a", eat: [`e${t}`, `ed${t}`, `mv${t}`], op: "×" })]], note: `${tp(e)}\\cdot${tp(A)} = ${tn(e * A)}`, cap: <>Ko'paytiramiz: <Em>{int(e * A)}</Em></> });
    terms.push(T(`tm${t}`, e * A, { tone: "a" }));
  });
  const eatAll = joinOps(terms, "lp").map((x) => x.id);
  frames.push({ lines: [[big(() => undefined)], [X("lab", "\\Delta ="), T("R", total, { tone: "res", eat: eatAll, op: "+" })]], note: `\\Delta = ${terms.map((x) => (x.t.startsWith("\u2212") ? `(${x.t.replace("\u2212", "-")})` : x.t)).join(" + ")} = ${tn(total)}`, cap: <>Qo'shamiz. Javob: <Em>{int(total)}</Em></> });
  return frames;
}

/* ================================================================== */
/* Uchburchak                                                          */
/* ================================================================== */

export function triAnim(m: number[][]): Frame[] {
  const n = m.length;
  const tone = (on: boolean) => (i: number, j: number) => (i === j ? (on ? "a" : undefined) : m[i][j] === 0 ? "gray" : "dim") as Tone | undefined;
  const big = (on: boolean) => M("M", cellsOf("m", m, tone(on)), { br: "v" });
  const copies = joinOps(m.map((r, i) => P(`d${i}`, r[i], { tone: "a", from: `m${i}${i}` })), "dx", "·");
  const v = m.reduce((s, r, i) => s * r[i], 1);
  return [
    { lines: [[big(false)]], cap: <>Diagonalning bir tomonida hammasi 0 — <Em>uchburchak</Em> ko'rinish.</> },
    { lines: [[big(true)], copies], decor: [{ kind: "line", a: "m00", b: `m${n - 1}${n - 1}`, tone: "a" }], cap: <>Faqat diagonal sonlar kerak — ular pastga tushadi.</> },
    { lines: [[big(true)], [X("lab", "\\Delta ="), T("R", v, { tone: "res", eat: copies.map((x) => x.id), op: "×" })]], note: `\\Delta = ${m.map((r, i) => tp(r[i])).join("\\cdot")} = ${tn(v)}`, cap: <>Ko'paytiramiz. Javob: <Em>{int(v)}</Em></> },
  ];
}

/* ================================================================== */
/* Matritsalarni ko'paytirish                                          */
/* ================================================================== */

export function prodAnim(A: number[][], Bm: number[][], only?: [number, number]): Frame[] {
  const m = A.length, q = Bm[0].length;
  const P0 = A.map((r) => Bm[0].map((_, j) => r.reduce((s, x, k) => s + x * Bm[k][j], 0)));
  const filled = new Set<string>();
  const matC = (hot?: [number, number], land?: [number, number]) =>
    M("C", P0.map((r, i) => r.map((v, j) => {
      const key = `${i}${j}`;
      if (land && land[0] === i && land[1] === j) return T(`c${key}`, v, { tone: "res", eat: [`q${key}`] });
      if (filled.has(key)) return T(`c${key}`, v);
      return T(`q${key}`, "?", { tone: hot && hot[0] === i && hot[1] === j ? "goal" : "gray" });
    })));
  const head = (i?: number, j?: number, land?: [number, number]): Item[] => [
    M("A", cellsOf("a", A, (r) => (r === i ? "a" : undefined))),
    O("x", "·"),
    M("B", cellsOf("b", Bm, (_, c) => (c === j ? "b" : undefined))),
    O("eq", "="),
    matC(i !== undefined && j !== undefined ? [i, j] : undefined, land),
  ];
  const frames: Frame[] = [{ lines: [head()], cap: <>Natija {m}×{q}. Har bir katak: <Em>satr × ustun</Em>.</> }];
  const cells = only ? [only] : P0.flatMap((r, i) => r.map((_, j) => [i, j] as [number, number]));
  for (const [i, j] of cells) {
    const boxes: Decor[] = [{ kind: "box", ids: A[i].map((_, k) => `a${i}${k}`), tone: "a" }, { kind: "box", ids: Bm.map((_, k) => `b${k}${j}`), tone: "b" }];
    const pairs = A[i].flatMap((_, k) => [
      ...(k ? [O(`up${k}`, "+")] : []),
      P(`u${k}`, A[i][k], { tone: "a", from: `a${i}${k}` }), O(`ud${k}`, "·"), P(`v${k}`, Bm[k][j], { tone: "b", from: `b${k}${j}` }),
    ]);
    frames.push({ lines: [head(i, j), pairs], decor: boxes, cap: <><Em>{i + 1}-satr</Em> va <Em>{j + 1}-ustun</Em> sonlari juft-juft tushadi.</> });
    const prods = A[i].flatMap((_, k) => [...(k ? [O(`up${k}`, "+")] : []), T(`w${k}`, A[i][k] * Bm[k][j], { tone: "c", eat: [`u${k}`, `ud${k}`, `v${k}`], op: "×" })]);
    frames.push({ lines: [head(i, j), prods], decor: boxes, cap: <>Har bir juft ko'paytiriladi.</> });
    frames.push({ lines: [head(i, j), [T(`c${i}${j}`, P0[i][j], { tone: "res", eat: prods.map((t) => t.id), op: "+" })]], decor: boxes, note: `c_{${i + 1}${j + 1}} = ${A[i].map((x, k) => `${tp(x)}\\cdot${tp(Bm[k][j])}`).join(" + ")} = ${tn(P0[i][j])}`, cap: <>Qo'shiladi: <Em>{int(P0[i][j])}</Em></> });
    frames.push({ lines: [head(undefined, undefined, [i, j])], cap: <>Natija o'z katagiga — ({i + 1}, {j + 1}) — tushadi.</> });
    filled.add(`${i}${j}`);
  }
  return frames;
}

/* ================================================================== */
/* Teskari matritsa (2×2)                                              */
/* ================================================================== */

export function inv2Anim(A: number[][]): Frame[] {
  const [[a, b], [c, d]] = A;
  const D = det2(A);
  const cells = (tone?: (i: number, j: number) => Tone | undefined) => cellsOf("m", A, tone);
  const dl = [X("dl", "\\det A ="), P("q1", a, { tone: "a", from: "m00" }), O("q2", "·"), P("q3", d, { tone: "a", from: "m11" }), O("q4", "-"), P("q5", b, { tone: "b", from: "m01" }), O("q6", "·"), P("q7", c, { tone: "b", from: "m10" })];
  const both = (i: number, j: number) => (i === j ? "a" : "b") as Tone;
  const frames: Frame[] = [
    { lines: [[X("lab", "A ="), M("M", cells())]], cap: <>Teskari matritsa — uch harakat.</> },
    { lines: [[X("lab", "A ="), M("M", cells(both))], dl], decor: [{ kind: "line", a: "m00", b: "m11", tone: "a" }, { kind: "line", a: "m01", b: "m10", tone: "b" }], cap: <>Avval determinant.</> },
    { lines: [[X("lab", "A ="), M("M", cells())], [X("dl", "\\det A ="), T("D", D, { tone: "res", eat: ["q1", "q2", "q3", "q4", "q5", "q6", "q7"], op: "−" })]], note: `\\det A = ${tp(a)}\\cdot${tp(d)} - ${tp(b)}\\cdot${tp(c)} = ${tn(D)}`, cap: <>Determinant <Em>{int(D)}</Em> — noldan farqli, teskarisi bor.</> },
    { lines: [[X("lab", "A ="), M("M", [[T("m11", d, { tone: "a", move: true }), T("m01", b)], [T("m10", c), T("m00", a, { tone: "a", move: true })]])], [X("dl", "\\det A ="), T("D", D)]], cap: <><Em>1)</Em> Bosh diagonaldagi sonlar o'rin almashadi.</> },
    { lines: [[X("lab", "A ="), M("M", [[T("m11", d), T("n01", -b, { tone: "b", eat: ["m01"] })], [T("n10", -c, { tone: "b", eat: ["m10"] }), T("m00", a)]])], [X("dl", "\\det A ="), T("D", D)]], cap: <><Em>2)</Em> Yon diagonaldagi sonlarning ishorasi o'zgaradi.</> },
    { lines: [[X("lab", "A^{-1} ="), X("f", fracTex(D), { tone: "res", from: "D" }), M("M", [[T("m11", d), T("n01", -b)], [T("n10", -c), T("m00", a)]])]], cap: <><Em>3)</Em> Determinant oldiga kasr bo'lib chiqadi.</> },
  ];
  if (D !== 1) {
    const vals = [[d / D, -b / D], [-c / D, a / D]];
    const src = [["m11", "n01"], ["n10", "m00"]];
    frames.push({ note: `A^{-1} = \\begin{pmatrix} ${tn(d / D)} & ${tn(-b / D)} \\\\ ${tn(-c / D)} & ${tn(a / D)} \\end{pmatrix}`, lines: [[X("lab", "A^{-1} ="), M("M", vals.map((r, i) => r.map((v, j) => T(`r${i}${j}`, v, { tone: "res", eat: i === 0 && j === 0 ? [src[i][j], "f"] : [src[i][j]], op: i === 0 && j === 0 ? "÷" : undefined }))))]], cap: <>Har bir son <Em>{int(D)}</Em> ga bo'linadi.</> });
  }
  return frames;
}

/* ================================================================== */
/* Kramer usuli                                                        */
/* ================================================================== */

export function kramerAnim(A: number[][], b: number[], nm?: string[]): Frame[] {
  const n = A.length;
  const names = nm ?? ["x", "y", "z"].slice(0, n);
  const dt = (Mx: number[][]) => (n === 2 ? det2(Mx) : det3(Mx));
  const D = dt(A);
  const aug = (hotCol?: number) => M("AUG", A.map((r, i) => [...r.map((v, j) => T(`a${i}${j}`, v, { tone: hotCol === j ? "goal" : undefined })), T(`b${i}`, b[i], { tone: "c" })]), { augAt: n });
  const chips: Tok[] = [];
  const frames: Frame[] = [{ lines: [[aug()]], cap: <>Chapda — noma'lumlar oldidagi sonlar, o'ngda <Em>yashil</Em> — ozod hadlar.</> }];
  const ws0 = A.map((r, i) => r.map((v, j) => T(`d${i}${j}`, v, { from: `a${i}${j}` })));
  frames.push({ lines: [[aug()], [X("wl", "\\Delta ="), M("W", ws0, { br: "v" })]], cap: <><Tex>{"\\Delta"}</Tex> uchun faqat chap qism ko'chiriladi.</> });
  chips.push(X("cl", "\\Delta ="), T("Dv", D, { tone: "a", eat: ws0.flat().map((t) => t.id) }));
  frames.push({ lines: [[aug()], [], [...chips]], note: `\\Delta = ${tn(D)}`, cap: <>Hisoblanadi: <Tex>{`\\Delta = ${D}`}</Tex></> });
  chips[1] = T("Dv", D, { tone: "a" });
  const Ds: number[] = [];
  names.forEach((v, j) => {
    const Mx = A.map((r, i) => r.map((x, k) => (k === j ? b[i] : x)));
    Ds.push(dt(Mx));
    const ws = A.map((r, i) => r.map((x, k) => (k === j ? T(`s${j}${i}${k}`, b[i], { tone: "c", from: `b${i}` }) : T(`s${j}${i}${k}`, x, { from: `a${i}${k}` }))));
    frames.push({ lines: [[aug(j)], [X(`wl${j}`, `\\Delta_${v} =`), M(`W${j}`, ws, { br: "v" })], [...chips]], cap: <><Em>{v}</Em> ning ustuni o'rniga <Em>ozod hadlar</Em> ko'chadi.</> });
    chips.push(X(`cl${j}`, `\\Delta_${v} =`), T(`Dv${j}`, Ds[j], { tone: "c", eat: ws.flat().map((t) => t.id) }));
    frames.push({ lines: [[aug()], [], [...chips]], note: `\\Delta_${v} = ${tn(Ds[j])}`, cap: <>Hisoblanadi: <Tex>{`\\Delta_${v} = ${Ds[j]}`}</Tex></> });
    chips[chips.length - 1] = T(`Dv${j}`, Ds[j], { tone: "c" });
  });
  const fracs = names.flatMap((v, j) => [X(`xl${j}`, `${v} =`), F(`fr${j}`, [T(`fn${j}`, Ds[j], { tone: "c", from: `Dv${j}` })], [T(`fd${j}`, D, { tone: "a", from: "Dv" })])]);
  frames.push({ lines: [[aug()], fracs, [...chips]], cap: <>Har birini <Tex>{"\\Delta"}</Tex> ga bo'lamiz.</> });
  const ans = names.flatMap((v, j) => [X(`xl${j}`, `${v} =`), T(`xv${j}`, Ds[j] / D, { tone: "res", eat: [`fn${j}`, `fd${j}`], op: "÷" })]);
  frames.push({ lines: [[aug()], ans, [...chips]], note: names.map((v, j) => `${v} = \\frac{${tn(Ds[j])}}{${tn(D)}} = ${tn(Ds[j] / D)}`).join(",\\quad "), cap: <>Javob: <Tex>{names.map((v, j) => `${v} = ${tn(Ds[j] / D)}`).join(",\\quad ")}</Tex></> });
  return frames;
}

/* ================================================================== */
/* Gauss usuli                                                         */
/* ================================================================== */

export function gaussAnim(A: number[][], b: number[]): Frame[] {
  let Mx = A.map((r, i) => [...r, b[i]]);
  const pos = Mx.map((r, i) => r.map((_, j) => `g${i}${j}`));
  const targets: [number, number][] = [[1, 0], [2, 0], [2, 1]];
  const grid = (tone?: (i: number, j: number) => Tone | undefined, eat?: (i: number, j: number) => string[] | undefined) =>
    M("G", Mx.map((r, i) => r.map((v, j) => T(pos[i][j], v, { tone: tone?.(i, j), eat: eat?.(i, j) }))), { augAt: 3 });
  const goalTone = (i: number, j: number) => (targets.some(([p, q]) => p === i && q === j) && Mx[i][j] !== 0 ? "goal" : undefined) as Tone | undefined;
  const frames: Frame[] = [{ lines: [[grid(goalTone)]], cap: <>Maqsad: sariq sonlarni <Em>0</Em> ga aylantirish (zinapoya).</> }];
  let op = 0;
  for (let c = 0; c < 2; c++) for (let i = c + 1; i < 3; i++) {
    const k = Mx[i][c] / Mx[c][c];
    if (k === 0) continue;
    op++;
    const opTex = `R_${i + 1} ${k > 0 ? "-" : "+"} ${Math.abs(k) === 1 ? "" : tn(Math.abs(k))}R_${c + 1}`;
    const pivTone = (p: number, q: number) => (p === c ? "a" : p === i && q === c ? "goal" : undefined) as Tone | undefined;
    const box: Decor[] = [{ kind: "box", ids: pos[c], tone: "a" }];
    const kl = X(`kl${op}`, `${tn(k)}\\cdot R_${c + 1}:`);
    frames.push({ lines: [[grid(pivTone)], [X("op", opTex, { tone: "a" })]], decor: box, cap: <><Em>{int(Mx[i][c])}</Em> ni yo'qotamiz — buning uchun {c + 1}-satrdan foydalanamiz.</> });
    const copies = Mx[c].map((v, t) => T(`k${op}${t}`, v, { tone: "a", from: pos[c][t] }));
    frames.push({ lines: [[grid(pivTone)], [X("op", opTex, { tone: "a" })], [kl, M(`K${op}`, [copies], { augAt: 3 })]], decor: box, cap: <>{c + 1}-satrning nusxasi pastga tushadi…</> });
    const scaled = Mx[c].map((v, t) => T(`kk${op}${t}`, k * v, { tone: "a", eat: [`k${op}${t}`] }));
    frames.push({ lines: [[grid(pivTone)], [X("op", opTex, { tone: "a" })], [kl, M(`K${op}`, [scaled], { augAt: 3 })]], decor: box, cap: <>…<Tex>{tn(k)}</Tex> ga ko'payadi.</> });
    const oldRow = [...pos[i]];
    const newRow = Mx[i].map((v, t) => v - k * Mx[c][t]);
    pos[i] = newRow.map((_, t) => `h${op}${t}`);
    Mx = Mx.map((r, a) => (a === i ? newRow : r));
    frames.push({ lines: [[grid((p, q) => (p === i ? (q === c ? "res" : "c") : undefined), (p, q) => (p === i ? [oldRow[q], `kk${op}${q}`] : undefined))], [X("op", opTex, { tone: "a" })]], note: `${opTex}:\\ (${newRow.slice(0, 3).map(tn).join(";\\ ")}\\,|\\,${tn(newRow[3])})`, cap: <>Ko'tarilib, {i + 1}-satrdan <Em>ayiriladi</Em> — o'sha joyda endi 0.</> });
  }
  frames.push({ lines: [[grid()]], cap: <>Zinapoya tayyor. Endi pastdan yuqoriga.</> });
  const z = Mx[2][3] / Mx[2][2];
  const y = (Mx[1][3] - Mx[1][2] * z) / Mx[1][1];
  const x = (Mx[0][3] - Mx[0][1] * y - Mx[0][2] * z) / Mx[0][0];
  const rowTone = (r: number) => (p: number) => (p === r ? "d" : undefined) as Tone | undefined;
  const res: Tok[] = [];
  frames.push({ lines: [[grid(rowTone(2))], [X("zl", "z ="), F("zf", [T("zn", Mx[2][3], { tone: "d", from: pos[2][3] })], [T("zd", Mx[2][2], { tone: "d", from: pos[2][2] })])]], cap: <>Oxirgi satrda faqat <Em>z</Em> qoldi.</> });
  res.push(X("rz", "z ="), T("zv", z, { tone: "res", eat: ["zn", "zd"], op: "÷" }));
  frames.push({ lines: [[grid()], [], [...res]], note: `z = \\frac{${tn(Mx[2][3])}}{${tn(Mx[2][2])}} = ${tn(z)}`, cap: <>z = <N v={z} /></> });
  res[1] = T("zv", z, { tone: "res" });
  frames.push({
    lines: [[grid(rowTone(1))], [X("yl", "y ="), F("yf", [T("yb", Mx[1][3], { tone: "d", from: pos[1][3] }), O("ym", "-"), P("yc", Mx[1][2], { tone: "d", from: pos[1][2] }), O("yx", "·"), P("yz", z, { tone: "res", from: "zv" })], [T("ya", Mx[1][1], { tone: "d", from: pos[1][1] })])], [...res]],
    cap: <>2-satrga <Em>z</Em> qo'yiladi.</>,
  });
  res.push(X("ry", "y ="), T("yv", y, { tone: "res", eat: ["yb", "ym", "yc", "yx", "yz", "ya"], op: "÷" }));
  frames.push({ lines: [[grid()], [], [...res]], note: `y = \\frac{${tn(Mx[1][3])} - ${tp(Mx[1][2])}\\cdot${tp(z)}}{${tn(Mx[1][1])}} = ${tn(y)}`, cap: <>y = <N v={y} /></> });
  res[3] = T("yv", y, { tone: "res" });
  frames.push({
    lines: [[grid(rowTone(0))], [X("xl", "x ="), F("xf", [T("xb", Mx[0][3], { tone: "d", from: pos[0][3] }), O("xm1", "-"), P("xc1", Mx[0][1], { tone: "d", from: pos[0][1] }), O("xx1", "·"), P("xy", y, { tone: "res", from: "yv" }), O("xm2", "-"), P("xc2", Mx[0][2], { tone: "d", from: pos[0][2] }), O("xx2", "·"), P("xz", z, { tone: "res", from: "zv" })], [T("xa", Mx[0][0], { tone: "d", from: pos[0][0] })])], [...res]],
    cap: <>1-satrga <Em>y</Em> va <Em>z</Em> qo'yiladi.</>,
  });
  res.push(X("rx", "x ="), T("xv", x, { tone: "res", eat: ["xb", "xm1", "xc1", "xx1", "xy", "xm2", "xc2", "xx2", "xz", "xa"], op: "÷" }));
  frames.push({ lines: [[grid()], [], [...res]], note: `x = \\frac{${tn(Mx[0][3])} - ${tp(Mx[0][1])}\\cdot${tp(y)} - ${tp(Mx[0][2])}\\cdot${tp(z)}}{${tn(Mx[0][0])}} = ${tn(x)}`, cap: <>Javob: <Tex>{`x = ${tn(x)},\\ y = ${tn(y)},\\ z = ${tn(z)}`}</Tex></> });
  return frames;
}

/* ================================================================== */
/* Matritsa usuli (2×2)                                                */
/* ================================================================== */

export function matrixAnim(A: number[][], b: number[]): Frame[] {
  const [[a, bb], [c, d]] = A;
  const D = det2(A);
  const adjV = [[d, -bb], [-c, a]];
  const sums = adjV.map((r) => r[0] * b[0] + r[1] * b[1]);
  const Bc = (tone: Tone = "c") => M("Bc", [[T("b0", b[0], { tone })], [T("b1", b[1], { tone })]]);
  const Xc = M("X", [[X("xx", "x", { move: true })], [X("xy", "y", { move: true })]]);
  const cells = (tone?: (i: number, j: number) => Tone | undefined) => cellsOf("m", A, tone);
  const both = (i: number, j: number) => (i === j ? "a" : "b") as Tone;
  const adjToks = (r?: number) => [[T("m11", d, { tone: r === 0 ? "a" : undefined }), T("n01", -bb, { tone: r === 0 ? "a" : undefined })], [T("n10", -c, { tone: r === 1 ? "a" : undefined }), T("m00", a, { tone: r === 1 ? "a" : undefined })]];
  const adjIds = [["m11", "n01"], ["n10", "m00"]];
  const frames: Frame[] = [
    { lines: [[M("M", cells()), O("dot", "·"), Xc, O("eq", "="), Bc()]], cap: <>Sistema: <Tex>{"A\\cdot X = B"}</Tex>. Javob: <Tex>{"X = A^{-1}\\cdot B"}</Tex>.</> },
    { lines: [[M("M", cells(both)), O("dot", "·"), Xc, O("eq", "="), Bc()], [X("dl", "\\det A ="), P("q1", a, { tone: "a", from: "m00" }), O("q2", "·"), P("q3", d, { tone: "a", from: "m11" }), O("q4", "-"), P("q5", bb, { tone: "b", from: "m01" }), O("q6", "·"), P("q7", c, { tone: "b", from: "m10" })]], decor: [{ kind: "line", a: "m00", b: "m11", tone: "a" }, { kind: "line", a: "m01", b: "m10", tone: "b" }], cap: <>Avval determinant.</> },
    { lines: [[M("M", cells()), O("dot", "·"), Xc, O("eq", "="), Bc()], [X("dl", "\\det A ="), T("D", D, { tone: "res", eat: ["q1", "q2", "q3", "q4", "q5", "q6", "q7"], op: "−" })]], note: `\\det A = ${tp(a)}\\cdot${tp(d)} - ${tp(bb)}\\cdot${tp(c)} = ${tn(D)}`, cap: <>Determinant <Em>{int(D)}</Em> — noldan farqli, teskari matritsa bor.</> },
    { lines: [[M("M", [[T("m11", d, { tone: "a", move: true }), T("m01", bb)], [T("m10", c), T("m00", a, { tone: "a", move: true })]]), O("dot", "·"), Xc, O("eq", "="), Bc()], [X("dl", "\\det A ="), T("D", D)]], cap: <>Bosh diagonal sonlari o'rin almashadi…</> },
    { lines: [[M("M", [[T("m11", d), T("n01", -bb, { tone: "b", eat: ["m01"] })], [T("n10", -c, { tone: "b", eat: ["m10"] }), T("m00", a)]]), O("dot", "·"), Xc, O("eq", "="), Bc()], [X("dl", "\\det A ="), T("D", D)]], cap: <>…yon diagonal ishorasi o'zgaradi.</> },
    { lines: [[Xc, O("eq", "="), X("f", fracTex(D), { tone: "res", from: "D" }), M("M", adjToks()), O("dot", "·"), Bc()]], cap: <><Em>X</Em> chap tomonga o'tadi: <Tex>{"X = A^{-1}\\cdot B"}</Tex>.</> },
  ];
  const landed: number[] = [];
  const head = (r?: number): Item[] => [
    Xc, O("eq", "="), X("f", fracTex(D), { tone: "res" }), M("M", adjToks(r)), O("dot", "·"), Bc(r !== undefined ? "b" : "c"),
    ...(landed.length ? [O("eq2", "="), X("f2", fracTex(D)), M("S", [0, 1].map((i) => [landed.includes(i) ? T(`s${i}`, sums[i], { tone: "c" }) : T(`sq${i}`, "?", { tone: "gray" })]))] : []),
  ];
  [0, 1].forEach((r) => {
    const box: Decor[] = [{ kind: "box", ids: adjIds[r], tone: "a" }, { kind: "box", ids: ["b0", "b1"], tone: "b" }];
    const pairs = [P(`u${r}0`, adjV[r][0], { tone: "a", from: adjIds[r][0] }), O(`ud${r}0`, "·"), P(`v${r}0`, b[0], { tone: "b", from: "b0" }), O(`up${r}`, "+"), P(`u${r}1`, adjV[r][1], { tone: "a", from: adjIds[r][1] }), O(`ud${r}1`, "·"), P(`v${r}1`, b[1], { tone: "b", from: "b1" })];
    frames.push({ lines: [head(r), pairs], decor: box, cap: <>{r + 1}-satr × ustun: sonlar juft-juft tushadi.</> });
    frames.push({ lines: [head(r), [T(`s${r}`, sums[r], { tone: "c", eat: pairs.map((p) => p.id), op: "+" })]], decor: box, note: `${tp(adjV[r][0])}\\cdot${tp(b[0])} + ${tp(adjV[r][1])}\\cdot${tp(b[1])} = ${tn(sums[r])}`, cap: <>Ko'paytirib qo'shamiz: <Em>{int(sums[r])}</Em></> });
    landed.push(r);
    frames.push({ lines: [head()], cap: <>Natija o'z joyiga tushadi.</> });
  });
  const final = [0, 1].map((i) => T(`xv${i}`, sums[i] / D, { tone: "res", eat: [i ? "xy" : "xx", `s${i}`, ...(i === 0 ? ["f2"] : [])], op: i === 0 ? "÷" : undefined }));
  frames.push({ lines: [[M("X", [[final[0]], [final[1]]])]], note: `x = ${tn(sums[0] / D)},\\quad y = ${tn(sums[1] / D)}`, cap: <>Oxirgi ko'paytirish — javob: <Tex>{`x = ${tn(sums[0] / D)},\\ y = ${tn(sums[1] / D)}`}</Tex></> });
  return frames;
}

/* ================================================================== */
/* 4–6-MAVZULAR: vektorlar, chiziqli fazo, to'g'ri chiziq              */
/* ================================================================== */

const AX = ["x", "y", "z", "t"];
/** Vektor koordinatalari: ( a ; b ; c ) — har bir son alohida token */
const vecRow = (pre: string, vals: number[], o: (j: number) => Partial<Tok> = () => ({})): Tok[] => [
  O(`${pre}(`, "("),
  ...vals.flatMap((v, j) => [...(j ? [O(`${pre};${j}`, ";")] : []), T(`${pre}${j}`, v, o(j))]),
  O(`${pre})`, ")"),
];
const vt = (vals: number[]) => `(${vals.map(tn).join(";\\ ")})`;

/* ---------- AB = B − A ---------- */
export function vecSubAnim(A: number[], Bv: number[]): Frame[] {
  const n = A.length;
  const head = (j?: number): Item[][] => [
    [X("al", "A"), ...vecRow("A", A, (k) => ({ tone: k === j ? "a" : undefined }))],
    [X("bl", "B"), ...vecRow("B", Bv, (k) => ({ tone: k === j ? "b" : undefined }))],
  ];
  const done: Tok[] = [];
  const row = (cur: Tok[]) => [X("ab", "\\overrightarrow{AB} ="), O("r(", "("), ...[...done, ...cur].flatMap((t, i) => (i ? [O(`r;${i}`, ";"), t] : [t])), O("r)", ")")];
  const frames: Frame[] = [{ lines: head(), cap: <>Vektor koordinatasi: <Em>oxiri minus boshi</Em> — har bir koordinata alohida.</> }];
  for (let j = 0; j < n; j++) {
    const cur = [P(`q${j}b`, Bv[j], { tone: "b", from: `B${j}` }), O(`q${j}m`, "-"), P(`q${j}a`, A[j], { tone: "a", from: `A${j}` })];
    frames.push({ lines: [...head(j), row(cur)], cap: <><Em>{AX[j]}</Em>: B ning {AX[j]} i minus A ning {AX[j]} i.</> });
    const r = T(`r${j}`, Bv[j] - A[j], { tone: "c", eat: [`q${j}b`, `q${j}m`, `q${j}a`], op: "−" });
    frames.push({ lines: [...head(j), row([r])], note: `${AX[j]}: ${tn(Bv[j])} - ${tp(A[j])} = ${tn(Bv[j] - A[j])}`, cap: <><Em>{int(Bv[j] - A[j])}</Em></> });
    done.push(T(`r${j}`, Bv[j] - A[j], { tone: "c" }));
  }
  frames.push({ lines: [...head(), row(done.map((t) => ({ ...t, tone: "res" as Tone })))], note: `\\overrightarrow{AB} = ${vt(Bv.map((v, j) => v - A[j]))}`, cap: <>Javob: <Tex>{`\\overrightarrow{AB} = ${vt(Bv.map((v, j) => v - A[j]))}`}</Tex></> });
  return frames;
}

/* ---------- |a| ---------- */
export function lenAnim(a: number[]): Frame[] {
  const head = (hot = false): Item[] => [X("al", "\\vec a ="), ...vecRow("a", a, () => ({ tone: hot ? "a" : undefined }))];
  const sq = a.map((v, j) => X(`s${j}`, `${tp(v)}^2`, { tone: "a", from: `a${j}` }));
  const S = a.reduce((s, v) => s + v * v, 0), L = Math.sqrt(S);
  const frames: Frame[] = [
    { lines: [head()], cap: <>Uzunlik — Pifagor teoremasi: koordinatalar <Em>kvadratga</Em> oshiriladi, qo'shiladi, <Em>ildiz</Em> olinadi.</> },
    { lines: [head(true), joinOps(sq, "sp")], cap: <>Har bir koordinata kvadrat bo'lib tushadi.</> },
  ];
  const vals = a.map((v, j) => T(`v${j}`, v * v, { tone: "a", eat: [`s${j}`], op: "²" }));
  frames.push({ lines: [head(), joinOps(vals, "sp")], note: `${a.map((v) => `${tp(v)}^2`).join(" + ")} = ${a.map((v) => v * v).join(" + ")}`, cap: <>Kvadratlar: {a.map((v) => v * v).join(", ")}.</> });
  frames.push({ lines: [head(), [X("rt", "\\sqrt{\\phantom{0}}", { tone: "c" }), T("S", S, { tone: "c", eat: joinOps(vals, "sp").map((t) => t.id), op: "+" })]], note: `${a.map((v) => v * v).join(" + ")} = ${S}`, cap: <>Qo'shamiz: <Em>{S}</Em>.</> });
  frames.push({ lines: [head(), [X("ll", "|\\vec a| ="), T("L", L, { tone: "res", eat: ["rt", "S"], op: "√" })]], note: `|\\vec a| = \\sqrt{${S}} = ${tn(L)}`, cap: <>Ildiz: <Tex>{`\\sqrt{${S}} = ${tn(L)}`}</Tex></> });
  return frames;
}

/* ---------- a · b ---------- */
export function dotAnim(a: number[], b: number[]): Frame[] {
  const head = (j?: number): Item[][] => [
    [X("al", "\\vec a ="), ...vecRow("a", a, (k) => ({ tone: k === j ? "a" : undefined }))],
    [X("bl", "\\vec b ="), ...vecRow("b", b, (k) => ({ tone: k === j ? "b" : undefined }))],
  ];
  const frames: Frame[] = [{ lines: head(), cap: <>Skalyar ko'paytma: <Em>mos</Em> koordinatalar juft-juft ko'paytiriladi, keyin qo'shiladi.</> }];
  const pairs: Tok[][] = [];
  a.forEach((_, j) => {
    pairs.push([P(`u${j}`, a[j], { tone: "a", from: `a${j}` }), O(`d${j}`, "·"), P(`v${j}`, b[j], { tone: "b", from: `b${j}` })]);
    frames.push({ lines: [...head(j), pairs.flatMap((p, i) => (i ? [O(`p${i}`, "+"), ...p] : p))], cap: <>{AX[j]} lar jufti tushadi.</> });
  });
  const prods = a.map((v, j) => T(`w${j}`, v * b[j], { tone: "c", eat: [`u${j}`, `d${j}`, `v${j}`], op: "×" }));
  const withPlus = (ts: Tok[]) => ts.flatMap((t, i) => (i ? [O(`p${i}`, "+"), t] : [t]));
  frames.push({ lines: [...head(), withPlus(prods)], note: a.map((v, j) => `${tp(v)}\\cdot${tp(b[j])}`).join(" + ") + ` = ${a.map((v, j) => tp(v * b[j])).join(" + ")}`, cap: <>Har bir juft ko'paytiriladi.</> });
  const s = a.reduce((t, v, j) => t + v * b[j], 0);
  frames.push({ lines: [...head(), [X("dl", "\\vec a\\cdot\\vec b ="), T("S", s, { tone: "res", eat: withPlus(prods).map((t) => t.id), op: "+" })]], note: `\\vec a\\cdot\\vec b = ${tn(s)}`, cap: <>Qo'shamiz. Javob: <Em>{int(s)}</Em>{s === 0 ? " — vektorlar perpendikulyar." : "."}</> });
  return frames;
}

/* ---------- λa + μb ---------- */
export function linCombAnim(a: number[], b: number[], l: number, m: number): Frame[] {
  const head: Item[][] = [[X("al", "\\vec a ="), ...vecRow("a", a)], [X("bl", "\\vec b ="), ...vecRow("b", b)]];
  const la = a.map((v) => l * v), mb = b.map((v) => m * v), r = la.map((v, j) => v + mb[j]);
  const ltex = l === 1 ? "" : l === -1 ? "-" : tn(l), mtex = m === 1 ? "" : m === -1 ? "-" : tn(m);
  const frames: Frame[] = [
    { lines: head, cap: <><Tex>{`${ltex}\\vec a ${m < 0 ? "-" : "+"} ${Math.abs(m) === 1 ? "" : tn(Math.abs(m))}\\vec b`}</Tex>: avval har bir vektor songa ko'paytiriladi.</> },
    { lines: [...head, [X("lal", `${ltex}\\vec a =`), ...vecRow("la", a, (j) => ({ tone: "a", from: `a${j}` }))]], cap: <><Tex>{`\\vec a`}</Tex> ning nusxasi tushadi…</> },
    { lines: [...head, [X("lal", `${ltex}\\vec a =`), ...vecRow("LA", la, (j) => ({ tone: "a", eat: [`la${j}`], op: j === 0 ? `×${int(l)}` : undefined }))]], note: `${ltex}\\vec a = ${vt(la)}`, cap: <>…har bir koordinata <Em>{int(l)}</Em> ga ko'payadi.</> },
    { lines: [...head, [X("lal", `${ltex}\\vec a =`), ...vecRow("LA", la, () => ({ tone: "a" }))], [X("mbl", `${mtex}\\vec b =`), ...vecRow("mb", b, (j) => ({ tone: "b", from: `b${j}` }))]], cap: <><Tex>{`\\vec b`}</Tex> ning nusxasi tushadi…</> },
    { lines: [...head, [X("lal", `${ltex}\\vec a =`), ...vecRow("LA", la, () => ({ tone: "a" }))], [X("mbl", `${mtex}\\vec b =`), ...vecRow("MB", mb, (j) => ({ tone: "b", eat: [`mb${j}`], op: j === 0 ? `×${int(m)}` : undefined }))]], note: `${mtex}\\vec b = ${vt(mb)}`, cap: <>…har bir koordinata <Em>{int(m)}</Em> ga ko'payadi.</> },
    { lines: [...head, [X("lal", `${ltex}\\vec a =`), ...vecRow("LA", la, () => ({ tone: "a" }))], [X("mbl", `${mtex}\\vec b =`), ...vecRow("MB", mb, () => ({ tone: "b" }))], [X("rl", "\\text{yig'indi} ="), ...vecRow("R", r, (j) => ({ tone: "res", eat: [`LA${j}`, `MB${j}`], op: j === 0 ? "+" : undefined }))]], note: `${vt(la)} + ${vt(mb)} = ${vt(r)}`, cap: <>Mos koordinatalar <Em>qo'shiladi</Em>. Javob: <Tex>{vt(r)}</Tex></> },
  ];
  return frames;
}

/* ---------- kesmani λ nisbatda bo'lish ---------- */
export function sectionAnim(A: number[], Bv: number[], l: number): Frame[] {
  const head: Item[][] = [[X("al", "A"), ...vecRow("A", A, () => ({ tone: "a" })), X("bl", "\\quad B"), ...vecRow("B", Bv, () => ({ tone: "b" })), X("ll", `\\quad\\lambda = ${tn(l)}`)]];
  const C = A.map((v, j) => (v + l * Bv[j]) / (1 + l));
  const frames: Frame[] = [{ lines: head, cap: <>Formula: <Tex>{"x_C = \\frac{x_A + \\lambda\\, x_B}{1+\\lambda}"}</Tex> — har bir koordinata uchun.</> }];
  const done: Item[] = [];
  A.forEach((_, j) => {
    const fr = F(`f${j}`, [T(`n${j}a`, A[j], { tone: "a", from: `A${j}` }), O(`n${j}p`, "+"), T(`n${j}l`, l), O(`n${j}d`, "·"), P(`n${j}b`, Bv[j], { tone: "b", from: `B${j}` })], [T(`d${j}`, 1 + l)]);
    frames.push({ lines: [...head, [...done, X(`cl${j}`, `${AX[j]}_C =`), fr]], cap: <>{AX[j]}-koordinata: A va B ning {AX[j]} lari formulaga tushadi.</> });
    const v = T(`c${j}`, C[j], { tone: "res", eat: [`n${j}a`, `n${j}p`, `n${j}l`, `n${j}d`, `n${j}b`, `d${j}`], op: "÷" });
    frames.push({ lines: [...head, [...done, X(`cl${j}`, `${AX[j]}_C =`), v]], note: `${AX[j]}_C = \\frac{${tn(A[j])} + ${tn(l)}\\cdot${tp(Bv[j])}}{${1 + l}} = ${tn(C[j])}`, cap: <>Hisoblanadi: <Tex>{tn(C[j])}</Tex></> });
    done.push(X(`cl${j}`, `${AX[j]}_C =`), T(`c${j}`, C[j], { tone: "res" }), X(`sp${j}`, "\\quad"));
  });
  return frames;
}

/* ---------- perpendikulyarlik: m = ? ---------- */
export function perpAnim(p: number, q: number, b: number[]): Frame[] {
  const head: Item[][] = [
    [X("al", "\\vec a ="), O("a(", "("), X("am", "m", { tone: "d" }), O("a;1", ";"), T("a1", p), O("a;2", ";"), T("a2", q), O("a)", ")")],
    [X("bl", "\\vec b ="), ...vecRow("b", b)],
  ];
  const rest = p * b[1] + q * b[2];
  const m = -rest / b[0];
  const frames: Frame[] = [
    { lines: head, cap: <>Perpendikulyar ⇔ skalyar ko'paytma <Em>0</Em>. Shu tenglamadan m topiladi.</> },
    { lines: [...head, [X("m1", "m", { tone: "d", from: "am" }), O("o1", "·"), P("b0c", b[0], { tone: "b", from: "b0" }), O("p1", "+"), P("u1", p, { tone: "a", from: "a1" }), O("d1", "·"), P("v1", b[1], { tone: "b", from: "b1" }), O("p2", "+"), P("u2", q, { tone: "a", from: "a2" }), O("d2", "·"), P("v2", b[2], { tone: "b", from: "b2" }), O("eq", "="), T("z", 0)]], cap: <>Juftlar tushadi: <Tex>{"\\vec a\\cdot\\vec b = 0"}</Tex>.</> },
    { lines: [...head, [X("m1", "m", { tone: "d" }), O("o1", "·"), P("b0c", b[0], { tone: "b" }), O("p1", "+"), T("R", rest, { tone: "c", eat: ["u1", "d1", "v1", "p2", "u2", "d2", "v2"], op: "×, +" }), O("eq", "="), T("z", 0)]], note: `${b[0]}m + ${tp(p)}\\cdot${tp(b[1])} + ${tp(q)}\\cdot${tp(b[2])} = 0`, cap: <>Ma'lum juftlar ko'paytirilib qo'shiladi: <Em>{int(rest)}</Em>.</> },
    { lines: [...head, [X("m1", "m", { tone: "d" }), O("o1", "·"), P("b0c", b[0], { tone: "b" }), O("eq", "="), T("z", 0), T("Rn", -rest, { tone: "c", eat: ["R", "p1"], op: "ishora ↔" })]], note: `${tn(b[0])}m = ${tn(-rest)}`, cap: <><Em>{int(rest)}</Em> tenglikning narigi tomoniga o'tadi — ishorasi o'zgaradi.</> },
    { lines: [...head, [X("ml", "m ="), T("M", m, { tone: "res", eat: ["m1", "o1", "b0c", "z", "Rn"], op: "÷" })]], note: `m = \\frac{${tn(-rest)}}{${tn(b[0])}} = ${tn(m)}`, cap: <>Ikki tomonni <Em>{int(b[0])}</Em> ga bo'lamiz: <Em>m = {tn(m)}</Em></> },
  ];
  return frames;
}

/* ---------- kollinearlik: m = ? ---------- */
export function colAnim(a: number[], b: number[], h: number): Frame[] {
  const known = (h + 1) % a.length;
  const k = a[known] / b[known];
  const head: Item[][] = [
    [X("al", "\\vec a ="), O("a(", "("), ...a.flatMap((v, j) => [...(j ? [O(`a;${j}`, ";")] : []), j === h ? X("am", "m", { tone: "d" }) : T(`a${j}`, v, { tone: j === known ? "a" : undefined })]), O("a)", ")")],
    [X("bl", "\\vec b ="), ...vecRow("b", b, (j) => ({ tone: j === known ? "b" : j === h ? "d" : undefined }))],
  ];
  return [
    { lines: head, cap: <>Kollinear ⇔ <Em>proporsional</Em>: <Tex>{"\\vec a = \\lambda\\,\\vec b"}</Tex>. Avval λ ni ma'lum juftdan topamiz.</> },
    { lines: [...head, [X("ll", "\\lambda ="), F("f", [T("fn", a[known], { tone: "a", from: `a${known}` })], [T("fd", b[known], { tone: "b", from: `b${known}` })])]], cap: <>{AX[known]} lar nisbati.</> },
    { lines: [...head, [X("ll", "\\lambda ="), T("L", k, { tone: "c", eat: ["fn", "fd"], op: "÷" })]], note: `\\lambda = \\frac{${tn(a[known])}}{${tn(b[known])}} = ${tn(k)}`, cap: <><Tex>{`\\lambda = ${tn(k)}`}</Tex></> },
    { lines: [...head, [X("ll", "\\lambda ="), T("L", k, { tone: "c" })], [X("ml", "m ="), T("L2", k, { tone: "c", from: "L" }), O("d", "·"), P("bh", b[h], { tone: "d", from: `b${h}` })]], cap: <>m — b ning {AX[h]} ini λ ga ko'paytirish.</> },
    { lines: [...head, [X("ll", "\\lambda ="), T("L", k, { tone: "c" })], [X("ml", "m ="), T("M", k * b[h], { tone: "res", eat: ["L2", "d", "bh"], op: "×" })]], note: `m = ${tn(k)}\\cdot${tp(b[h])} = ${tn(k * b[h])}`, cap: <>Javob: <Em>m = {tn(k * b[h])}</Em></> },
  ];
}

/* ---------- vektorli tenglama: k·x + y = z ---------- */
export function solvexAnim(k: number, y: number[], z: number[]): Frame[] {
  const head: Item[][] = [[X("yl", "y ="), ...vecRow("y", y, () => ({ tone: "b" }))], [X("eq", `${tn(k)}x + y =`), ...vecRow("z", z, () => ({ tone: "a" }))]];
  const d = z.map((v, j) => v - y[j]), x = d.map((v) => v / k);
  return [
    { lines: head, cap: <>Oddiy tenglamadek: avval y ni o'ng tomonga o'tkazamiz, keyin <Em>{int(k)}</Em> ga bo'lamiz.</> },
    { lines: [...head, [X("l1", `${tn(k)}x = z - y =`), O("r(", "("), ...z.flatMap((_, j) => [...(j ? [O(`r;${j}`, ";")] : []), P(`zz${j}`, z[j], { tone: "a", from: `z${j}` }), O(`rm${j}`, "-"), P(`yy${j}`, y[j], { tone: "b", from: `y${j}` })]), O("r)", ")")]], cap: <>Har bir koordinatada <Em>z − y</Em>.</> },
    { lines: [...head, [X("l1", `${tn(k)}x =`), ...vecRow("D", d, (j) => ({ tone: "c", eat: [`zz${j}`, `rm${j}`, `yy${j}`], op: j === 0 ? "−" : undefined }))]], note: `${tn(k)}x = ${vt(d)}`, cap: <>Ayirmalar: <Tex>{vt(d)}</Tex></> },
    { lines: [...head, [X("l2", "x ="), ...vecRow("X", x, (j) => ({ tone: "res", eat: [`D${j}`], op: j === 0 ? `÷${int(k)}` : undefined }))]], note: `x = ${vt(x)}`, cap: <>Har bir koordinata <Em>{int(k)}</Em> ga bo'linadi. Javob: <Tex>{vt(x)}</Tex></> },
  ];
}

/* ---------- xos sonlar (2×2) ---------- */
export function eigAnim(A: number[][]): Frame[] {
  const [[a, b], [c, d]] = A;
  const tr = a + d, dt = a * d - b * c;
  const disc = tr * tr - 4 * dt, sq = Math.sqrt(disc);
  const l1 = (tr + sq) / 2, l2 = (tr - sq) / 2;
  const cell = (v: number, lam: boolean, id: string, o: Partial<Tok> = {}) => (lam ? X(id, `${tn(v)}-\\lambda`, o) : T(id, v, o));
  return [
    { lines: [[X("al", "A ="), M("M", cellsOf("m", A))]], cap: <>Xos sonlar: <Tex>{"\\det(A-\\lambda E)=0"}</Tex>. λ faqat <Em>diagonaldan</Em> ayiriladi.</> },
    { lines: [[X("al", "A-\\lambda E ="), M("M", [[cell(a, true, "L00", { tone: "a", eat: ["m00"] }), T("m01", b)], [T("m10", c), cell(d, true, "L11", { tone: "a", eat: ["m11"] })]], { br: "v" }), O("eq", "="), T("z", 0)]], cap: <>Diagonaldagi har bir sondan <Em>λ</Em> ayiriladi.</> },
    { lines: [[X("al", "A-\\lambda E ="), M("M", [[cell(a, true, "L00", { tone: "a" }), T("m01", b, { tone: "b" })], [T("m10", c, { tone: "b" }), cell(d, true, "L11", { tone: "a" })]], { br: "v" }), O("eq", "="), T("z", 0)], [X("e1", `(${tn(a)}-\\lambda)`, { tone: "a", from: "L00" }), X("e2", `(${tn(d)}-\\lambda)`, { tone: "a", from: "L11" }), O("e3", "-"), P("e4", b, { tone: "b", from: "m01" }), O("e5", "·"), P("e6", c, { tone: "b", from: "m10" }), O("e7", "="), T("e8", 0)]], decor: [{ kind: "line", a: "L00", b: "L11", tone: "a" }, { kind: "line", a: "m01", b: "m10", tone: "b" }], cap: <>Odatdagi 2×2 determinant: bosh diagonal minus yon diagonal.</> },
    { lines: [[X("al", "A-\\lambda E ="), M("M", [[cell(a, true, "L00"), T("m01", b)], [T("m10", c), cell(d, true, "L11")]], { br: "v" })], [X("ch", `\\lambda^2 ${tr < 0 ? "+" : "-"} ${Math.abs(tr)}\\lambda ${dt < 0 ? "-" : "+"} ${Math.abs(dt)} = 0`, { tone: "c", eat: ["e1", "e2", "e3", "e4", "e5", "e6", "e7", "e8"], op: "qavs ochiladi" })]], note: `\\lambda^2 - (${tn(a)}+${tp(d)})\\lambda + (${tn(a * d)} - ${tp(b * c)}) = 0`, cap: <>Qavslar ochiladi — <Em>kvadrat tenglama</Em>.</> },
    { lines: [[X("al", "A-\\lambda E ="), M("M", [[cell(a, true, "L00"), T("m01", b)], [T("m10", c), cell(d, true, "L11")]], { br: "v" })], [X("ch", `\\lambda^2 ${tr < 0 ? "+" : "-"} ${Math.abs(tr)}\\lambda ${dt < 0 ? "-" : "+"} ${Math.abs(dt)} = 0`, { tone: "c" })], [X("r1", "\\lambda_1 ="), T("l1", l1, { tone: "res" }), X("r2", "\\quad\\lambda_2 ="), T("l2", l2, { tone: "res" })]], note: `\\lambda_1 = ${tn(l1)},\\ \\lambda_2 = ${tn(l2)}\\ \\ (\\lambda_1+\\lambda_2 = ${tn(tr)},\\ \\lambda_1\\lambda_2 = ${tn(dt)})`, cap: <>Viyet: yig'indisi {int(tr)}, ko'paytmasi {int(dt)} ⇒ <Em>λ₁ = {tn(l1)}, λ₂ = {tn(l2)}</Em></> },
  ];
}

/* ---------- to'g'ri chiziq: umumiy tenglama tokenlari ---------- */
/** Ax + By + C = 0 ni tokenlarga: koeffitsiyent (ishora bilan) + harf */
function lineToks(A: number, B: number, C: number, tone: { A?: Tone; B?: Tone; C?: Tone } = {}): Tok[] {
  const coef = (id: string, v: number, first: boolean, varTex: string, t?: Tone): Tok[] => {
    if (v === 0) return [];
    const mag = Math.abs(v) === 1 && varTex ? "" : String(Math.abs(v));
    // formula ko'rinishida (x, y kursiv) — yuqoridagi formula bloki bilan bir xil
    const texSign = v < 0 ? "-" : first ? "" : "+";
    return [X(id, `${texSign}${first || !texSign ? "" : "\\,"}${mag}${varTex}`, { tone: t })];
  };
  return [...coef("cA", A, true, "x", tone.A), ...coef("cB", B, A === 0, "y", tone.B), ...coef("cC", C, A === 0 && B === 0, "", tone.C), O("ceq", "="), T("c0", 0)];
}

export function normalAnim(A: number, B: number, C: number): Frame[] {
  const eq = (hot: boolean) => lineToks(A, B, C, hot ? { A: "a", B: "b", C: "gray" } : {});
  return [
    { lines: [eq(false)], cap: <>Umumiy tenglama <Tex>{"Ax+By+C=0"}</Tex>: normal vektor — x va y <Em>oldidagi</Em> sonlar.</> },
    { lines: [eq(true)], cap: <><Em>A</Em> = {int(A)}, <Em>B</Em> = {int(B)}; ozod had C (kulrang) kirmaydi.</> },
    { lines: [eq(true), [X("nl", "\\vec n ="), O("n(", "("), T("nA", A, { tone: "a", from: "cA" }), O("n;", ";"), T("nB", B, { tone: "b", from: "cB" }), O("n)", ")")]], note: `\\vec n = (${tn(A)};\\ ${tn(B)})`, cap: <>Ular normal vektorga ko'chadi: <Tex>{`\\vec n = (${tn(A)};\\ ${tn(B)})`}</Tex></> },
  ];
}

export function slopeAnim(A: number, B: number, C: number): Frame[] {
  const k = -A / B, b = -C / B;
  const yb = B === 1 ? "y" : B === -1 ? "-y" : `${tn(B)}y`;
  return [
    { lines: [lineToks(A, B, C)], cap: <>Maqsad: <Tex>{"y = kx + b"}</Tex> — y ni yolg'iz qoldiramiz.</> },
    { lines: [lineToks(A, B, C, { A: "a", C: "c" })], cap: <>x li had va ozod had <Em>o'ng tomonga o'tadi</Em> — o'tganda ishorasi o'zgaradi.</> },
    { lines: [lineToks(A, B, C, { A: "a", C: "c" }), [X("yl", `${yb} =`, { tone: "b" }), T("nA", -A, { tone: "a", from: "cA" }), X("nAx", "x", { tone: "a" }), ...(C ? [T("nC", `${-C < 0 ? MINUS : "+"} ${Math.abs(C)}`, { tone: "c", from: "cC" })] : [])]], note: `${yb} = ${tn(-A)}x ${-C < 0 ? "-" : "+"} ${tn(Math.abs(C))}`, cap: <>O'tdi: <Tex>{`${yb} = ${tn(-A)}x ${-C < 0 ? "-" : "+"} ${tn(Math.abs(C))}`}</Tex></> },
    { lines: [lineToks(A, B, C), [X("yl", "y =", { tone: "b" }), F("fk", [T("nA", -A, { tone: "a" })], [T("dB1", B, { tone: "b", from: "cB" })]), X("nAx", "x", { tone: "a" }), ...(C ? [O("pl", "+"), F("fb", [T("nC", -C, { tone: "c" })], [T("dB2", B, { tone: "b", from: "cB" })])] : [])]], cap: <>Ikki tomon <Em>{int(B)}</Em> ga bo'linadi.</> },
    { lines: [lineToks(A, B, C), [X("yl", "y =", { tone: "b" }), T("K", k, { tone: "res", eat: ["nA", "dB1"], op: "÷" }), X("nAx", "x"), ...(C ? [O("pl2", b < 0 ? "-" : "+", { eat: ["pl"] }), T("Bb", Math.abs(b), { tone: "res", eat: ["nC", "dB2"] })] : [])]], note: `k = ${tn(k)},\\quad b = ${tn(b)}`, cap: <>Javob: <Tex>{`k = ${tn(k)},\\ \\ b = ${tn(b)}`}</Tex></> },
  ];
}

export function interceptsAnim(A: number, B: number, C: number): Frame[] {
  const a = -C / A, b = -C / B;
  return [
    { lines: [lineToks(A, B, C)], cap: <>O'qlar bilan kesishish: Ox da <Em>y = 0</Em>, Oy da <Em>x = 0</Em>.</> },
    { lines: [lineToks(A, B, C, { A: "a", C: "c" }), [X("xl", "y=0:\\quad x ="), F("fa", [T("na", -C, { tone: "c", from: "cC" })], [T("da", A, { tone: "a", from: "cA" })])]], cap: <>y = 0 bo'lsa: <Tex>{"Ax + C = 0"}</Tex>, ya'ni <Tex>{"x = -\\frac{C}{A}"}</Tex>.</> },
    { lines: [lineToks(A, B, C), [X("xl", "y=0:\\quad x ="), T("ra", a, { tone: "res", eat: ["na", "da"], op: "÷" })]], note: `a = \\frac{${tn(-C)}}{${tn(A)}} = ${tn(a)}`, cap: <>Ox ni <Tex>{`(${tn(a)};\\ 0)`}</Tex> da kesadi.</> },
    { lines: [lineToks(A, B, C, { B: "b", C: "c" }), [X("xl", "y=0:\\quad x ="), T("ra", a, { tone: "res" })], [X("yl", "x=0:\\quad y ="), F("fb", [T("nb", -C, { tone: "c", from: "cC" })], [T("db", B, { tone: "b", from: "cB" })])]], cap: <>x = 0 bo'lsa: <Tex>{"y = -\\frac{C}{B}"}</Tex>.</> },
    { lines: [lineToks(A, B, C), [X("xl", "y=0:\\quad x ="), T("ra", a, { tone: "res" })], [X("yl", "x=0:\\quad y ="), T("rb", b, { tone: "res", eat: ["nb", "db"], op: "÷" })]], note: `b = \\frac{${tn(-C)}}{${tn(B)}} = ${tn(b)}`, cap: <>Kesmalardagi tenglama: <Tex>{`\\frac{x}{${tn(a)}} + \\frac{y}{${tn(b)}} = 1`}</Tex></> },
  ];
}

export function twoPointAnim(P1: number[], P2: number[]): Frame[] {
  const k = (P2[1] - P1[1]) / (P2[0] - P1[0]);
  const b = P1[1] - k * P1[0];
  const head: Item[] = [X("m1", "M_1"), ...vecRow("p", P1, () => ({ tone: "a" })), X("sp", "\\quad M_2"), ...vecRow("q", P2, () => ({ tone: "b" }))];
  return [
    { lines: [head], cap: <>Qiyalik <Tex>{"k = \\frac{y_2-y_1}{x_2-x_1}"}</Tex>: y lar farqi suratda, x lar farqi maxrajda.</> },
    { lines: [head, [X("kl", "k ="), F("f", [P("y2", P2[1], { tone: "b", from: "q1" }), O("ym", "-"), P("y1", P1[1], { tone: "a", from: "p1" })], [P("x2", P2[0], { tone: "b", from: "q0" }), O("xm", "-"), P("x1", P1[0], { tone: "a", from: "p0" })])]], cap: <>Koordinatalar formulaga tushadi.</> },
    { lines: [head, [X("kl", "k ="), F("f", [T("dy", P2[1] - P1[1], { tone: "c", eat: ["y2", "ym", "y1"], op: "−" })], [T("dx", P2[0] - P1[0], { tone: "c", eat: ["x2", "xm", "x1"] })])]], note: `k = \\frac{${tn(P2[1])} - ${tp(P1[1])}}{${tn(P2[0])} - ${tp(P1[0])}} = \\frac{${tn(P2[1] - P1[1])}}{${tn(P2[0] - P1[0])}}`, cap: <>Farqlar hisoblanadi.</> },
    { lines: [head, [X("kl", "k ="), T("K", k, { tone: "res", eat: ["dy", "dx"], op: "÷" })]], note: `k = ${tn(k)}`, cap: <><Tex>{`k = ${tn(k)}`}</Tex></> },
    { lines: [head, [X("kl", "k ="), T("K", k, { tone: "res" })], [X("bl", "b = y_1 - k\\,x_1 ="), P("by", P1[1], { tone: "a", from: "p1" }), O("bm", "-"), P("bk", k, { tone: "res", from: "K" }), O("bd", "·"), P("bx", P1[0], { tone: "a", from: "p0" })]], cap: <>b ni 1-nuqtadan topamiz.</> },
    { lines: [head, [X("kl", "k ="), T("K", k, { tone: "res" })], [X("bl", "b ="), T("Bb", b, { tone: "res", eat: ["by", "bm", "bk", "bd", "bx"], op: "−" })]], note: `b = ${tn(P1[1])} - ${tp(k)}\\cdot${tp(P1[0])} = ${tn(b)}`, cap: <>Javob: <Tex>{`y = ${tn(k)}x ${b < 0 ? "-" : "+"} ${tn(Math.abs(b))}`}</Tex></> },
  ];
}

export function distAnim(A: number, B: number, C: number, x0: number, y0: number): Frame[] {
  const s = A * x0 + B * y0 + C, n = Math.sqrt(A * A + B * B), d = Math.abs(s) / n;
  const head: Item[][] = [lineToks(A, B, C, { A: "a", B: "b", C: "c" }), [X("ml", "M"), ...vecRow("M", [x0, y0], () => ({ tone: "d" }))]];
  return [
    { lines: head, cap: <>Masofa: <Tex>{"d = \\frac{|Ax_0 + By_0 + C|}{\\sqrt{A^2+B^2}}"}</Tex> — nuqtani tenglamaga qo'yamiz.</> },
    { lines: [...head, [X("dl", "d ="), F("f", [O("ab1", "|"), P("a1", A, { tone: "a", from: "cA" }), O("o1", "·"), P("x", x0, { tone: "d", from: "M0" }), O("p1", "+"), P("b1", B, { tone: "b", from: "cB" }), O("o2", "·"), P("y", y0, { tone: "d", from: "M1" }), O("p2", "+"), P("c1", C, { tone: "c", from: "cC" }), O("ab2", "|")], [X("sq", `\\sqrt{${tp(A)}^2 + ${tp(B)}^2}`, { tone: "gray" })])]], cap: <>Suratga — nuqta koordinatalari va koeffitsiyentlar.</> },
    { lines: [...head, [X("dl", "d ="), F("f", [T("S", Math.abs(s), { tone: "c", eat: ["ab1", "a1", "o1", "x", "p1", "b1", "o2", "y", "p2", "c1", "ab2"], op: "|…|" })], [T("N", n, { tone: "c", eat: ["sq"], op: "√" })])]], note: `|${tp(A)}\\cdot${tp(x0)} + ${tp(B)}\\cdot${tp(y0)} + ${tp(C)}| = ${tn(Math.abs(s))},\\quad \\sqrt{${A * A} + ${B * B}} = ${tn(n)}`, cap: <>Surat: <Em>{tn(Math.abs(s))}</Em>, maxraj: <Em>{tn(n)}</Em>.</> },
    { lines: [...head, [X("dl", "d ="), T("D", d, { tone: "res", eat: ["S", "N"], op: "÷" })]], note: `d = \\frac{${tn(Math.abs(s))}}{${tn(n)}} = ${tn(d)}`, cap: <>Javob: <Tex>{`d = ${tn(d)}`}</Tex></> },
  ];
}

export function relAnim(k1: number, b1: number, k2: number, b2: number): Frame[] {
  const head: Item[][] = [
    [X("l1", "y ="), T("k1", k1, { tone: "a" }), X("x1", `x ${b1 < 0 ? "-" : "+"} ${Math.abs(b1)}`)],
    [X("l2", "y ="), T("k2", k2, { tone: "b" }), X("x2", `x ${b2 < 0 ? "-" : "+"} ${Math.abs(b2)}`)],
  ];
  const par = k1 === k2, prod = k1 * k2, perp = Math.abs(prod + 1) < 1e-9;
  return [
    { lines: head, cap: <>Faqat <Em>qiyaliklar</Em> (k) muhim: teng bo'lsa — parallel, ko'paytmasi −1 bo'lsa — perpendikulyar.</> },
    { lines: [...head, [X("kl", "k_1 ="), T("c1", k1, { tone: "a", from: "k1" }), X("kl2", "\\quad k_2 ="), T("c2", k2, { tone: "b", from: "k2" })]], cap: <>Qiyaliklar olinadi.</> },
    { lines: [...head, [X("kl", "k_1 ="), T("c1", k1, { tone: "a" }), X("kl2", "\\quad k_2 ="), T("c2", k2, { tone: "b" })], [X("pl", "k_1\\cdot k_2 ="), T("pr", prod, { tone: "c", eat: [], op: "×" }), X("pc", par ? "\\quad k_1 = k_2" : perp ? "\\quad = -1" : "\\quad \\neq -1,\\ k_1\\neq k_2", { tone: par || perp ? "res" : "gray" })]], note: par ? `k_1 = k_2 = ${tn(k1)} \\Rightarrow \\text{parallel}` : perp ? `k_1 k_2 = ${tn(prod)} \\Rightarrow \\text{perpendikulyar}` : `k_1 k_2 = ${tn(prod)} \\neq -1 \\Rightarrow \\text{kesishadi}`, cap: <>{par ? "Qiyaliklar teng — chiziqlar parallel." : perp ? "Ko'paytma −1 — chiziqlar perpendikulyar." : "Teng ham emas, ko'paytmasi −1 ham emas — shunchaki kesishadi."}</> },
  ];
}

export function canonAnim(x0: number, y0: number, m: number, n: number): Frame[] {
  const fr = (v: string, a: number) => (a === 0 ? v : `${v} ${a < 0 ? "+" : "-"} ${Math.abs(a)}`);
  const head: Item[] = [F("F1", [X("u1", fr("x", x0), { tone: "a" })], [T("m", m, { tone: "b" })]), O("eq", "="), F("F2", [X("u2", fr("y", y0), { tone: "a" })], [T("n", n, { tone: "b" })])];
  return [
    { lines: [head], cap: <>Kanonik tenglama: <Em>suratda — nuqta</Em>, <Em>maxrajda — yo'naltiruvchi vektor</Em>.</> },
    { lines: [head, [X("ml", "M_0"), O("M(", "("), T("X0", x0, { tone: "a", from: "u1" }), O("M;", ";"), T("Y0", y0, { tone: "a", from: "u2" }), O("M)", ")")]], note: `M_0(${tn(x0)};\\ ${tn(y0)})`, cap: <>Nuqta: suratda <Tex>{"x - x_0"}</Tex> turadi, shuning uchun ishora <Em>teskari</Em> olinadi.</> },
    { lines: [head, [X("ml", "M_0"), O("M(", "("), T("X0", x0, { tone: "a" }), O("M;", ";"), T("Y0", y0, { tone: "a" }), O("M)", ")")], [X("sl", "\\vec s ="), O("s(", "("), T("S0", m, { tone: "b", from: "m" }), O("s;", ";"), T("S1", n, { tone: "b", from: "n" }), O("s)", ")")]], note: `\\vec s = (${tn(m)};\\ ${tn(n)})`, cap: <>Vektor: maxrajlar o'zgarishsiz ko'chadi.</> },
  ];
}
