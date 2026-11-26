import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Tex } from "../components/Tex";
import { tn } from "./core";

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
export interface Tok { id: string; t: string; tex?: boolean; tone?: Tone; from?: string; eat?: string[] }
export interface MatItem { kind: "mat"; id: string; rows: Tok[][]; br?: "v" | "p"; augAt?: number; ext?: Tok[][]; label?: string }
export interface FracItem { kind: "frac"; id: string; num: Tok[]; den: Tok[] }
export type Item = Tok | MatItem | FracItem;
export type Decor =
  | { kind: "line"; a: string; b: string; tone: Tone }
  | { kind: "strike"; a: string; b: string }
  | { kind: "box"; ids: string[]; tone: Tone };
export interface Frame { lines: Item[][]; decor?: Decor[]; cap: ReactNode }

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
interface Snap extends Rect { node: HTMLElement }
type Geo =
  | { key: string; kind: "line" | "strike"; x1: number; y1: number; x2: number; y2: number; tone?: Tone }
  | { key: string; kind: "box"; x: number; y: number; w: number; h: number; tone: Tone };

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

function Stage({ frame, step, minLines, calm }: { frame: Frame; step: number; minLines: number; calm: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  const ghosts = useRef<HTMLDivElement>(null);
  const prev = useRef(new Map<string, Snap>());
  const [geo, setGeo] = useState<Geo[]>([]);

  useLayoutEffect(() => {
    const el = root.current!, gl = ghosts.current!;
    const reduce = calm;
    const base = el.getBoundingClientRect();
    const toks = Array.from(el.querySelectorAll<HTMLElement>(".fx-lines [data-tid]"));
    toks.forEach((t) => t.getAnimations().forEach((a) => a.cancel()));
    gl.replaceChildren();

    const now = new Map<string, { el: HTMLElement; r: Rect }>();
    for (const t of toks) {
      const r = t.getBoundingClientRect();
      now.set(t.dataset.tid!, { el: t, r: { x: r.left - base.left, y: r.top - base.top, w: r.width, h: r.height } });
    }
    const meta = collect(frame.lines);
    const old = prev.current;
    const eaten = new Set<string>();
    const center = (r: Rect) => [r.x + r.w / 2, r.y + r.h / 2];

    const flip = (t: HTMLElement, from: Rect, to: Rect, delay = 0) => {
      const [fx, fy] = center(from), [tx, ty] = center(to);
      if (reduce) { t.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220, fill: "backwards" }); return; }
      t.animate([{ transform: `translate(${fx - tx}px, ${fy - ty}px)` }, { transform: "translate(0, 0)" }], { duration: FLY, delay, easing: EASE, fill: "backwards" });
    };
    const ghost = (s: Snap, to: Rect | null, delay = 0) => {
      const g = document.createElement("div");
      g.className = "fx-ghost";
      g.appendChild(s.node.cloneNode(true));
      g.style.left = `${s.x}px`;
      g.style.top = `${s.y}px`;
      g.style.width = `${s.w}px`;
      g.style.height = `${s.h}px`;
      gl.appendChild(g);
      let kf: Keyframe[] = [{ opacity: 1 }, { opacity: 0 }];
      if (to && !reduce) {
        const [fx, fy] = center(s), [tx, ty] = center(to);
        kf = [
          { transform: "translate(0, 0)", opacity: 1 },
          { transform: `translate(${tx - fx}px, ${ty - fy}px) scale(.7)`, opacity: 0.85, offset: 0.8 },
          { transform: `translate(${tx - fx}px, ${ty - fy}px) scale(.5)`, opacity: 0 },
        ];
      }
      const a = g.animate(kf, { duration: to ? FLY - 80 : 260, delay, easing: to ? EASE : "ease-out", fill: "both" });
      a.onfinish = () => g.remove();
    };

    let copyN = 0, mergeN = 0;
    now.forEach(({ el: t, r }, id) => {
      const m = meta.get(id);
      const o = old.get(id);
      if (o) {
        flip(t, o, r);
      } else if (m?.from && old.get(m.from)) {
        flip(t, old.get(m.from)!, r, reduce ? 0 : copyN++ * STAGGER);
      } else if (m?.eat?.some((e) => old.has(e))) {
        const base = reduce ? 0 : mergeN++ * STAGGER;
        t.animate(
          reduce ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 0, transform: "scale(.4)" }, { opacity: 1, transform: "scale(1.18)", offset: 0.6 }, { opacity: 1, transform: "scale(1)" }],
          { duration: 520, delay: reduce ? 0 : base + FLY - 280, easing: POP, fill: "backwards" },
        );
      } else {
        t.animate([{ opacity: 0, transform: reduce ? "none" : "translateY(6px)" }, { opacity: 1, transform: "none" }], { duration: 380, delay: 160, easing: POP, fill: "backwards" });
      }
    });
    old.forEach((s, id) => { if (!now.has(id) && !eaten.has(id)) ghost(s, null); });

    const snap = new Map<string, Snap>();
    now.forEach(({ el: t, r }, id) => {
      const c = t.cloneNode(true) as HTMLElement;
      c.removeAttribute("data-tid");
      snap.set(id, { ...r, node: c });
    });
    prev.current = snap;

    // bezaklar — sonlarning haqiqiy joyidan
    const g: Geo[] = [];
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
  }, [frame, step, calm]);

  return (
    <div className="fx-stage" ref={root} style={{ minHeight: `${minLines * 64 + 24}px` }}>
      <div className="fx-decor" aria-hidden="true">
        {geo.map((d) => d.kind === "box" && (
          <div key={d.key} className={`fx-box t-${d.tone}`} style={{ transform: `translate(${d.x}px, ${d.y}px)`, width: d.w, height: d.h }} />
        ))}
        <svg className="fx-svg">
          {geo.map((d) => d.kind !== "box" && (
            <line key={d.key} x1={d.x1} y1={d.y1} x2={d.x2} y2={d.y2} pathLength={1} className={d.kind === "strike" ? "fx-strike" : `fx-line t-${d.tone}`} />
          ))}
        </svg>
      </div>
      <div className="fx-lines">
        {frame.lines.map((line, li) => (
          <div key={li} className="fx-line-row">
            {line.map((it) => (isMat(it) ? <MatEl key={it.id} m={it} /> : isFrac(it) ? <FracEl key={it.id} f={it} /> : <TokEl key={it.id} k={it} />))}
          </div>
        ))}
      </div>
      <div className="fx-ghosts" ref={ghosts} aria-hidden="true" />
    </div>
  );
}

export function AnimPlayer({ frames, speed = 2500 }: { frames: Frame[]; speed?: number }) {
  const [k, setK] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [calm, setCalm] = useState(readCalm);
  const toggleCalm = () => {
    const v = !calm;
    setCalm(v);
    try { localStorage.setItem(MOTION_KEY, v ? "off" : "on"); } catch { /* saqlab bo'lmadi */ }
  };
  const minLines = useMemo(() => Math.max(...frames.map((f) => f.lines.length)), [frames]);
  useEffect(() => {
    if (!playing) return;
    if (k >= frames.length - 1) { setPlaying(false); return; }
    const t = window.setTimeout(() => setK((v) => v + 1), speed);
    return () => window.clearTimeout(t);
  }, [playing, k, frames.length, speed]);
  const f = frames[Math.min(k, frames.length - 1)];
  const go = (i: number) => { setPlaying(false); setK(Math.max(0, Math.min(frames.length - 1, i))); };
  return (
    <div className={"fx" + (calm ? " calm" : "")} onKeyDown={(e) => { if (e.key === "ArrowRight") go(k + 1); if (e.key === "ArrowLeft") go(k - 1); }}>
      <Stage frame={f} step={k} minLines={minLines} calm={calm} />
      <div className="fx-cap" key={k} aria-live="polite">{f.cap}</div>
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
        <button className="fx-motion" onClick={toggleCalm} aria-pressed={!calm} title="Sonlarning uchishini yoqish yoki o'chirish">
          Harakat: {calm ? "o'chirilgan" : "yoqilgan"}
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
const B = ({ children }: { children: ReactNode }) => <b className="fx-em">{children}</b>;
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
    { lines: [head(main)], decor: [{ kind: "line", a: "m00", b: "m11", tone: "a" }], cap: <><B>Bosh diagonal</B> — chapdan o'ngga pastga.</> },
    { lines: [head(main), [P("e1", a, { tone: "a", from: "m00" }), O("o1", "·"), P("e2", d, { tone: "a", from: "m11" })]], decor: [{ kind: "line", a: "m00", b: "m11", tone: "a" }], cap: <>Bosh diagonal sonlari pastga tushadi…</> },
    { lines: [head(main), [T("p1", p1, { tone: "a", eat: ["e1", "o1", "e2"] })]], cap: <>…va ko'paytiriladi: <B>{int(p1)}</B></> },
    { lines: [head(both), [T("p1", p1, { tone: "a" }), O("o2", "-"), P("f1", b, { tone: "b", from: "m01" }), O("o3", "·"), P("f2", c, { tone: "b", from: "m10" })]], decor: [{ kind: "line", a: "m01", b: "m10", tone: "b" }], cap: <><B>Yon diagonal</B> sonlari tushadi — ular <B>ayiriladi</B>.</> },
    { lines: [head(both), [T("p1", p1, { tone: "a" }), O("o2", "-"), P("p2", p2, { tone: "b", eat: ["f1", "o3", "f2"] })]], cap: <>Ko'paytiramiz: <B>{int(p2)}</B></> },
  ];
  let tail = ["p1", "o2", "p2"];
  if (p2 < 0) {
    frames.push({ lines: [head(), [T("p1", p1, { tone: "a" }), O("o4", "+", { eat: ["o2"] }), T("p2b", -p2, { tone: "b", eat: ["p2"] })]], cap: <>Manfiy sonni ayirish — qo'shish.</> });
    tail = ["p1", "o4", "p2b"];
  }
  frames.push({ lines: [head(), [X("lab2", `${label} =`), T("res", r, { tone: "res", eat: tail })]], cap: <>Javob: <B>{int(r)}</B></> });
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
    { lines: [head([], "a", false)], cap: <>3×3 determinant — <B>Sarrus qoidasi</B>: 6 ta ko'paytma.</> },
    { lines: [head()], cap: <>1- va 2-ustun o'ng tomonga ko'chadi — endi har bir uchlik to'g'ri chiziqda.</> },
  ];
  const row2: Tok[] = [];
  plus.forEach((cs, k) => {
    const copies = cs.map(([i, c], t) => P(`pc${k}${t}`, valAt(i, c), { tone: "a", from: idAt(i, c) }));
    const line = (cur: Tok[]) => [O("ps", "+", { tone: "a" }), ...joinOps([...row2, ...cur], "pp")];
    frames.push({ lines: [head(cs, "a"), line(joinOps(copies, `pd${k}`, "·"))], decor: [{ kind: "line", a: idAt(cs[0][0], cs[0][1]), b: idAt(cs[2][0], cs[2][1]), tone: "a" }], cap: <><B>"+" chiziq {k + 1}</B>: uchta son pastga tushadi.</> });
    frames.push({ lines: [head(cs, "a"), line([T(`P${k}`, prod(cs), { tone: "a", eat: [...copies.map((c) => c.id), `pd${k}1`, `pd${k}2`] })])], cap: <>Ko'paytma: <B>{int(prod(cs))}</B></> });
    row2.push(T(`P${k}`, prod(cs), { tone: "a" }));
  });
  const sp = plus.reduce((s, cs) => s + prod(cs), 0);
  frames.push({ lines: [head(), [O("ps", "+", { tone: "a" }), T("SP", sp, { tone: "a", eat: ["P0", "pp1", "P1", "pp2", "P2"] })]], cap: <>"+" lar yig'indisi: <B>{int(sp)}</B></> });
  const row3: Tok[] = [];
  minus.forEach((cs, k) => {
    const copies = cs.map(([i, c], t) => P(`mc${k}${t}`, valAt(i, c), { tone: "b", from: idAt(i, c) }));
    const line = (cur: Tok[]) => [O("ms", "-", { tone: "b" }), ...joinOps([...row3, ...cur], "mp")];
    const top = [O("ps", "+", { tone: "a" }), T("SP", sp, { tone: "a" })];
    frames.push({ lines: [head(cs, "b"), top, line(joinOps(copies, `md${k}`, "·"))], decor: [{ kind: "line", a: idAt(cs[0][0], cs[0][1]), b: idAt(cs[2][0], cs[2][1]), tone: "b" }], cap: <><B>"−" chiziq {k + 1}</B>: o'ngdan chapga pastga.</> });
    frames.push({ lines: [head(cs, "b"), top, line([T(`Q${k}`, prod(cs), { tone: "b", eat: [...copies.map((c) => c.id), `md${k}1`, `md${k}2`] })])], cap: <>Ko'paytma: <B>{int(prod(cs))}</B></> });
    row3.push(T(`Q${k}`, prod(cs), { tone: "b" }));
  });
  const sm = minus.reduce((s, cs) => s + prod(cs), 0);
  frames.push({ lines: [head(), [O("ps", "+", { tone: "a" }), T("SP", sp, { tone: "a" })], [O("ms", "-", { tone: "b" }), T("SM", sm, { tone: "b", eat: ["Q0", "mp1", "Q1", "mp2", "Q2"] })]], cap: <>"−" lar yig'indisi: <B>{int(sm)}</B></> });
  frames.push({ lines: [head(), [T("SP", sp, { tone: "a" }), O("mn", "-"), P("SM", sm, { tone: "b" })]], cap: <>Ikkinchisini birinchisidan ayiramiz.</> });
  frames.push({ lines: [head(), [X("lab2", `${label} =`), T("R", sp - sm, { tone: "res", eat: ["SP", "mn", "SM"] })]], cap: <>Javob: <B>{int(sp - sm)}</B></> });
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
    { lines: [[big(cut)]], decor: strikes, cap: <>{I}-satr va {J}-ustun <B>o'chiriladi</B>.</> },
    { lines: [[big(cut), X("ar", "\\longrightarrow"), minorM()]], decor: strikes, cap: <>Qolgan 4 son <B>minor</B>ga ko'chadi.</> },
    { lines: [[big(cut), X("ar", "\\longrightarrow"), minorM(diagTone)], [P("x1", mm[0][0], { tone: "a", from: "n00" }), O("x2", "·"), P("x3", mm[1][1], { tone: "a", from: "n11" }), O("x4", "-"), P("x5", mm[0][1], { tone: "b", from: "n01" }), O("x6", "·"), P("x7", mm[1][0], { tone: "b", from: "n10" })]], decor: [{ kind: "line", a: "n00", b: "n11", tone: "a" }, { kind: "line", a: "n01", b: "n10", tone: "b" }], cap: <>Minor — oddiy 2×2: bosh diagonal minus yon diagonal.</> },
    { lines: [[big(cut), X("ar", "\\longrightarrow"), minorM()], [X("ml", `M_{${I}${J}} =`), T("Mv", Mv, { tone: "c", eat: ["x1", "x2", "x3", "x4", "x5", "x6", "x7"] })]], cap: <>Minor: <B>{int(Mv)}</B></> },
    { lines: [[big(cut)], [X("sg", `(-1)^{${I}+${J}}`, { tone: "d" }), O("so", "·"), P("Mv", Mv, { tone: "c" })]], cap: <>Ishora: {I} + {J} = {I + J} — {s > 0 ? "juft" : "toq"}.</> },
    { lines: [[big(cut)], [T("sg2", s > 0 ? "+1" : `${MINUS}1`, { tone: "d", eat: ["sg"] }), O("so", "·"), P("Mv", Mv, { tone: "c" })]], cap: <>{s > 0 ? "Juft — ishora o'zgarmaydi." : "Toq — ishora o'zgaradi."}</> },
    { lines: [[big(goal)], [X("al", `A_{${I}${J}} =`), T("A", s * Mv, { tone: "res", eat: ["sg2", "so", "Mv"] })]], cap: <>Javob: <Tex>{`A_{${I}${J}} = ${s * Mv}`}</Tex></> },
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
    { lines: [[big()]], decor: [{ kind: "box", ids: lineIds, tone: "a" }], cap: <>Eng ko'p nol bor {best.row ? "satr" : "ustun"} — <B>{best.k + 1}-{best.row ? "satr" : "ustun"}</B>. Shu bo'yicha yoyamiz.</> },
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
    frames.push({ lines: [[big(cut)], [...rest, ...plusOp, P(`e${t}`, e, { tone: "goal", from: `m${a}${b}` }), O(`ed${t}`, "·"), mini]], decor: [{ kind: "strike", a: `m${a}0`, b: `m${a}2` }, { kind: "strike", a: `m0${b}`, b: `m2${b}` }], cap: <><B>{int(e)}</B> ning satri va ustuni o'chiriladi — qolgan 4 son uning minori{sign < 0 ? " (ishora: −)" : ""}.</> });
    frames.push({ lines: [[big(cut)], [...rest, ...plusOp, P(`e${t}`, e, { tone: "goal" }), O(`ed${t}`, "·"), P(`mv${t}`, A, { tone: "c", eat: [`k${t}00`, `k${t}01`, `k${t}10`, `k${t}11`] })]], cap: <>Algebraik to'ldiruvchi: <B>{int(A)}</B></> });
    frames.push({ lines: [[big()], [...rest, ...plusOp, T(`tm${t}`, e * A, { tone: "a", eat: [`e${t}`, `ed${t}`, `mv${t}`] })]], cap: <>Ko'paytiramiz: <B>{int(e * A)}</B></> });
    terms.push(T(`tm${t}`, e * A, { tone: "a" }));
  });
  const eatAll = joinOps(terms, "lp").map((x) => x.id);
  frames.push({ lines: [[big(() => undefined)], [X("lab", "\\Delta ="), T("R", total, { tone: "res", eat: eatAll })]], cap: <>Qo'shamiz. Javob: <B>{int(total)}</B></> });
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
    { lines: [[big(false)]], cap: <>Diagonalning bir tomonida hammasi 0 — <B>uchburchak</B> ko'rinish.</> },
    { lines: [[big(true)], copies], decor: [{ kind: "line", a: "m00", b: `m${n - 1}${n - 1}`, tone: "a" }], cap: <>Faqat diagonal sonlar kerak — ular pastga tushadi.</> },
    { lines: [[big(true)], [X("lab", "\\Delta ="), T("R", v, { tone: "res", eat: copies.map((x) => x.id) })]], cap: <>Ko'paytiramiz. Javob: <B>{int(v)}</B></> },
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
  const frames: Frame[] = [{ lines: [head()], cap: <>Natija {m}×{q}. Har bir katak: <B>satr × ustun</B>.</> }];
  const cells = only ? [only] : P0.flatMap((r, i) => r.map((_, j) => [i, j] as [number, number]));
  for (const [i, j] of cells) {
    const boxes: Decor[] = [{ kind: "box", ids: A[i].map((_, k) => `a${i}${k}`), tone: "a" }, { kind: "box", ids: Bm.map((_, k) => `b${k}${j}`), tone: "b" }];
    const pairs = A[i].flatMap((_, k) => [
      ...(k ? [O(`up${k}`, "+")] : []),
      P(`u${k}`, A[i][k], { tone: "a", from: `a${i}${k}` }), O(`ud${k}`, "·"), P(`v${k}`, Bm[k][j], { tone: "b", from: `b${k}${j}` }),
    ]);
    frames.push({ lines: [head(i, j), pairs], decor: boxes, cap: <><B>{i + 1}-satr</B> va <B>{j + 1}-ustun</B> sonlari juft-juft tushadi.</> });
    const prods = A[i].flatMap((_, k) => [...(k ? [O(`up${k}`, "+")] : []), T(`w${k}`, A[i][k] * Bm[k][j], { tone: "c", eat: [`u${k}`, `ud${k}`, `v${k}`] })]);
    frames.push({ lines: [head(i, j), prods], decor: boxes, cap: <>Har bir juft ko'paytiriladi.</> });
    frames.push({ lines: [head(i, j), [T(`c${i}${j}`, P0[i][j], { tone: "res", eat: prods.map((t) => t.id) })]], decor: boxes, cap: <>Qo'shiladi: <B>{int(P0[i][j])}</B></> });
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
    { lines: [[X("lab", "A ="), M("M", cells())], [X("dl", "\\det A ="), T("D", D, { tone: "res", eat: ["q1", "q2", "q3", "q4", "q5", "q6", "q7"] })]], cap: <>Determinant <B>{int(D)}</B> — noldan farqli, teskarisi bor.</> },
    { lines: [[X("lab", "A ="), M("M", [[T("m11", d, { tone: "a" }), T("m01", b)], [T("m10", c), T("m00", a, { tone: "a" })]])], [X("dl", "\\det A ="), T("D", D)]], cap: <><B>1)</B> Bosh diagonaldagi sonlar o'rin almashadi.</> },
    { lines: [[X("lab", "A ="), M("M", [[T("m11", d), T("n01", -b, { tone: "b", eat: ["m01"] })], [T("n10", -c, { tone: "b", eat: ["m10"] }), T("m00", a)]])], [X("dl", "\\det A ="), T("D", D)]], cap: <><B>2)</B> Yon diagonaldagi sonlarning ishorasi o'zgaradi.</> },
    { lines: [[X("lab", "A^{-1} ="), X("f", fracTex(D), { tone: "res", from: "D" }), M("M", [[T("m11", d), T("n01", -b)], [T("n10", -c), T("m00", a)]])]], cap: <><B>3)</B> Determinant oldiga kasr bo'lib chiqadi.</> },
  ];
  if (D !== 1) {
    const vals = [[d / D, -b / D], [-c / D, a / D]];
    const src = [["m11", "n01"], ["n10", "m00"]];
    frames.push({ lines: [[X("lab", "A^{-1} ="), M("M", vals.map((r, i) => r.map((v, j) => T(`r${i}${j}`, v, { tone: "res", eat: i === 0 && j === 0 ? [src[i][j], "f"] : [src[i][j]] }))))]], cap: <>Har bir son <B>{int(D)}</B> ga bo'linadi.</> });
  }
  return frames;
}

/* ================================================================== */
/* Kramer usuli                                                        */
/* ================================================================== */

export function kramerAnim(A: number[][], b: number[]): Frame[] {
  const n = A.length;
  const names = ["x", "y", "z"].slice(0, n);
  const dt = (Mx: number[][]) => (n === 2 ? det2(Mx) : det3(Mx));
  const D = dt(A);
  const aug = (hotCol?: number) => M("AUG", A.map((r, i) => [...r.map((v, j) => T(`a${i}${j}`, v, { tone: hotCol === j ? "goal" : undefined })), T(`b${i}`, b[i], { tone: "c" })]), { augAt: n });
  const chips: Tok[] = [];
  const frames: Frame[] = [{ lines: [[aug()]], cap: <>Chapda — noma'lumlar oldidagi sonlar, o'ngda <B>yashil</B> — ozod hadlar.</> }];
  const ws0 = A.map((r, i) => r.map((v, j) => T(`d${i}${j}`, v, { from: `a${i}${j}` })));
  frames.push({ lines: [[aug()], [X("wl", "\\Delta ="), M("W", ws0, { br: "v" })]], cap: <><Tex>{"\\Delta"}</Tex> uchun faqat chap qism ko'chiriladi.</> });
  chips.push(X("cl", "\\Delta ="), T("Dv", D, { tone: "a", eat: ws0.flat().map((t) => t.id) }));
  frames.push({ lines: [[aug()], [], [...chips]], cap: <>Hisoblanadi: <Tex>{`\\Delta = ${D}`}</Tex></> });
  chips[1] = T("Dv", D, { tone: "a" });
  const Ds: number[] = [];
  names.forEach((v, j) => {
    const Mx = A.map((r, i) => r.map((x, k) => (k === j ? b[i] : x)));
    Ds.push(dt(Mx));
    const ws = A.map((r, i) => r.map((x, k) => (k === j ? T(`s${j}${i}${k}`, b[i], { tone: "c", from: `b${i}` }) : T(`s${j}${i}${k}`, x, { from: `a${i}${k}` }))));
    frames.push({ lines: [[aug(j)], [X(`wl${j}`, `\\Delta_${v} =`), M(`W${j}`, ws, { br: "v" })], [...chips]], cap: <><B>{v}</B> ning ustuni o'rniga <B>ozod hadlar</B> ko'chadi.</> });
    chips.push(X(`cl${j}`, `\\Delta_${v} =`), T(`Dv${j}`, Ds[j], { tone: "c", eat: ws.flat().map((t) => t.id) }));
    frames.push({ lines: [[aug()], [], [...chips]], cap: <>Hisoblanadi: <Tex>{`\\Delta_${v} = ${Ds[j]}`}</Tex></> });
    chips[chips.length - 1] = T(`Dv${j}`, Ds[j], { tone: "c" });
  });
  const fracs = names.flatMap((v, j) => [X(`xl${j}`, `${v} =`), F(`fr${j}`, [T(`fn${j}`, Ds[j], { tone: "c", from: `Dv${j}` })], [T(`fd${j}`, D, { tone: "a", from: "Dv" })])]);
  frames.push({ lines: [[aug()], fracs, [...chips]], cap: <>Har birini <Tex>{"\\Delta"}</Tex> ga bo'lamiz.</> });
  const ans = names.flatMap((v, j) => [X(`xl${j}`, `${v} =`), T(`xv${j}`, Ds[j] / D, { tone: "res", eat: [`fn${j}`, `fd${j}`] })]);
  frames.push({ lines: [[aug()], ans, [...chips]], cap: <>Javob: <Tex>{names.map((v, j) => `${v} = ${tn(Ds[j] / D)}`).join(",\\quad ")}</Tex></> });
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
  const frames: Frame[] = [{ lines: [[grid(goalTone)]], cap: <>Maqsad: sariq sonlarni <B>0</B> ga aylantirish (zinapoya).</> }];
  let op = 0;
  for (let c = 0; c < 2; c++) for (let i = c + 1; i < 3; i++) {
    const k = Mx[i][c] / Mx[c][c];
    if (k === 0) continue;
    op++;
    const opTex = `R_${i + 1} ${k > 0 ? "-" : "+"} ${Math.abs(k) === 1 ? "" : tn(Math.abs(k))}R_${c + 1}`;
    const pivTone = (p: number, q: number) => (p === c ? "a" : p === i && q === c ? "goal" : undefined) as Tone | undefined;
    const box: Decor[] = [{ kind: "box", ids: pos[c], tone: "a" }];
    const kl = X(`kl${op}`, `${tn(k)}\\cdot R_${c + 1}:`);
    frames.push({ lines: [[grid(pivTone)], [X("op", opTex, { tone: "a" })]], decor: box, cap: <><B>{int(Mx[i][c])}</B> ni yo'qotamiz — buning uchun {c + 1}-satrdan foydalanamiz.</> });
    const copies = Mx[c].map((v, t) => T(`k${op}${t}`, v, { tone: "a", from: pos[c][t] }));
    frames.push({ lines: [[grid(pivTone)], [X("op", opTex, { tone: "a" })], [kl, M(`K${op}`, [copies], { augAt: 3 })]], decor: box, cap: <>{c + 1}-satrning nusxasi pastga tushadi…</> });
    const scaled = Mx[c].map((v, t) => T(`kk${op}${t}`, k * v, { tone: "a", eat: [`k${op}${t}`] }));
    frames.push({ lines: [[grid(pivTone)], [X("op", opTex, { tone: "a" })], [kl, M(`K${op}`, [scaled], { augAt: 3 })]], decor: box, cap: <>…<Tex>{tn(k)}</Tex> ga ko'payadi.</> });
    const oldRow = [...pos[i]];
    const newRow = Mx[i].map((v, t) => v - k * Mx[c][t]);
    pos[i] = newRow.map((_, t) => `h${op}${t}`);
    Mx = Mx.map((r, a) => (a === i ? newRow : r));
    frames.push({ lines: [[grid((p, q) => (p === i ? (q === c ? "res" : "c") : undefined), (p, q) => (p === i ? [oldRow[q], `kk${op}${q}`] : undefined))], [X("op", opTex, { tone: "a" })]], cap: <>Ko'tarilib, {i + 1}-satrdan <B>ayiriladi</B> — o'sha joyda endi 0.</> });
  }
  frames.push({ lines: [[grid()]], cap: <>Zinapoya tayyor. Endi pastdan yuqoriga.</> });
  const z = Mx[2][3] / Mx[2][2];
  const y = (Mx[1][3] - Mx[1][2] * z) / Mx[1][1];
  const x = (Mx[0][3] - Mx[0][1] * y - Mx[0][2] * z) / Mx[0][0];
  const rowTone = (r: number) => (p: number) => (p === r ? "d" : undefined) as Tone | undefined;
  const res: Tok[] = [];
  frames.push({ lines: [[grid(rowTone(2))], [X("zl", "z ="), F("zf", [T("zn", Mx[2][3], { tone: "d", from: pos[2][3] })], [T("zd", Mx[2][2], { tone: "d", from: pos[2][2] })])]], cap: <>Oxirgi satrda faqat <B>z</B> qoldi.</> });
  res.push(X("rz", "z ="), T("zv", z, { tone: "res", eat: ["zn", "zd"] }));
  frames.push({ lines: [[grid()], [], [...res]], cap: <>z = <N v={z} /></> });
  res[1] = T("zv", z, { tone: "res" });
  frames.push({
    lines: [[grid(rowTone(1))], [X("yl", "y ="), F("yf", [T("yb", Mx[1][3], { tone: "d", from: pos[1][3] }), O("ym", "-"), P("yc", Mx[1][2], { tone: "d", from: pos[1][2] }), O("yx", "·"), P("yz", z, { tone: "res", from: "zv" })], [T("ya", Mx[1][1], { tone: "d", from: pos[1][1] })])], [...res]],
    cap: <>2-satrga <B>z</B> qo'yiladi.</>,
  });
  res.push(X("ry", "y ="), T("yv", y, { tone: "res", eat: ["yb", "ym", "yc", "yx", "yz", "ya"] }));
  frames.push({ lines: [[grid()], [], [...res]], cap: <>y = <N v={y} /></> });
  res[3] = T("yv", y, { tone: "res" });
  frames.push({
    lines: [[grid(rowTone(0))], [X("xl", "x ="), F("xf", [T("xb", Mx[0][3], { tone: "d", from: pos[0][3] }), O("xm1", "-"), P("xc1", Mx[0][1], { tone: "d", from: pos[0][1] }), O("xx1", "·"), P("xy", y, { tone: "res", from: "yv" }), O("xm2", "-"), P("xc2", Mx[0][2], { tone: "d", from: pos[0][2] }), O("xx2", "·"), P("xz", z, { tone: "res", from: "zv" })], [T("xa", Mx[0][0], { tone: "d", from: pos[0][0] })])], [...res]],
    cap: <>1-satrga <B>y</B> va <B>z</B> qo'yiladi.</>,
  });
  res.push(X("rx", "x ="), T("xv", x, { tone: "res", eat: ["xb", "xm1", "xc1", "xx1", "xy", "xm2", "xc2", "xx2", "xz", "xa"] }));
  frames.push({ lines: [[grid()], [], [...res]], cap: <>Javob: <Tex>{`x = ${tn(x)},\\ y = ${tn(y)},\\ z = ${tn(z)}`}</Tex></> });
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
  const Xc = M("X", [[X("xx", "x")], [X("xy", "y")]]);
  const cells = (tone?: (i: number, j: number) => Tone | undefined) => cellsOf("m", A, tone);
  const both = (i: number, j: number) => (i === j ? "a" : "b") as Tone;
  const adjToks = (r?: number) => [[T("m11", d, { tone: r === 0 ? "a" : undefined }), T("n01", -bb, { tone: r === 0 ? "a" : undefined })], [T("n10", -c, { tone: r === 1 ? "a" : undefined }), T("m00", a, { tone: r === 1 ? "a" : undefined })]];
  const adjIds = [["m11", "n01"], ["n10", "m00"]];
  const frames: Frame[] = [
    { lines: [[M("M", cells()), O("dot", "·"), Xc, O("eq", "="), Bc()]], cap: <>Sistema: <Tex>{"A\\cdot X = B"}</Tex>. Javob: <Tex>{"X = A^{-1}\\cdot B"}</Tex>.</> },
    { lines: [[M("M", cells(both)), O("dot", "·"), Xc, O("eq", "="), Bc()], [X("dl", "\\det A ="), P("q1", a, { tone: "a", from: "m00" }), O("q2", "·"), P("q3", d, { tone: "a", from: "m11" }), O("q4", "-"), P("q5", bb, { tone: "b", from: "m01" }), O("q6", "·"), P("q7", c, { tone: "b", from: "m10" })]], decor: [{ kind: "line", a: "m00", b: "m11", tone: "a" }, { kind: "line", a: "m01", b: "m10", tone: "b" }], cap: <>Avval determinant.</> },
    { lines: [[M("M", cells()), O("dot", "·"), Xc, O("eq", "="), Bc()], [X("dl", "\\det A ="), T("D", D, { tone: "res", eat: ["q1", "q2", "q3", "q4", "q5", "q6", "q7"] })]], cap: <>Determinant <B>{int(D)}</B> — noldan farqli, teskari matritsa bor.</> },
    { lines: [[M("M", [[T("m11", d, { tone: "a" }), T("m01", bb)], [T("m10", c), T("m00", a, { tone: "a" })]]), O("dot", "·"), Xc, O("eq", "="), Bc()], [X("dl", "\\det A ="), T("D", D)]], cap: <>Bosh diagonal sonlari o'rin almashadi…</> },
    { lines: [[M("M", [[T("m11", d), T("n01", -bb, { tone: "b", eat: ["m01"] })], [T("n10", -c, { tone: "b", eat: ["m10"] }), T("m00", a)]]), O("dot", "·"), Xc, O("eq", "="), Bc()], [X("dl", "\\det A ="), T("D", D)]], cap: <>…yon diagonal ishorasi o'zgaradi.</> },
    { lines: [[Xc, O("eq", "="), X("f", fracTex(D), { tone: "res", from: "D" }), M("M", adjToks()), O("dot", "·"), Bc()]], cap: <><B>X</B> chap tomonga o'tadi: <Tex>{"X = A^{-1}\\cdot B"}</Tex>.</> },
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
    frames.push({ lines: [head(r), [T(`s${r}`, sums[r], { tone: "c", eat: pairs.map((p) => p.id) })]], decor: box, cap: <>Ko'paytirib qo'shamiz: <B>{int(sums[r])}</B></> });
    landed.push(r);
    frames.push({ lines: [head()], cap: <>Natija o'z joyiga tushadi.</> });
  });
  const final = [0, 1].map((i) => T(`xv${i}`, sums[i] / D, { tone: "res", eat: [i ? "xy" : "xx", `s${i}`, ...(i === 0 ? ["f2"] : [])] }));
  frames.push({ lines: [[M("X", [[final[0]], [final[1]]])]], cap: <>Oxirgi ko'paytirish — javob: <Tex>{`x = ${tn(sums[0] / D)},\\ y = ${tn(sums[1] / D)}`}</Tex></> });
  return frames;
}
