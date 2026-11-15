import { Mafs, Coordinates, Line, Vector, Text, Polygon } from "mafs";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { apply, type M, type V } from "../lib/la";

/**
 * Butun kurs davomida ranglar bir xil ma'noga ega — bu ham "sistema"ning bir qismi:
 *  î (1-bazis / 1-ustun) — yashil, ĵ (2-bazis / 2-ustun) — qizil,
 *  asosiy vektor v — sariq, ikkinchi vektor w — pushti, natija — ko'k.
 */
// Hex qiymatlar (Theme.* CSS o'zgaruvchilari faqat Mafs ichida ishlaydi, legenda/matnda esa yo'q)
export const C = {
  i: "#83c167",
  j: "#fc6255",
  v: "#ffe156",
  w: "#f472b6",
  u: "#a78bfa",
  res: "#58c4dd",
  muted: "#7a7f8a",
  orange: "#ff9f43",
};

export function Board({
  children,
  height = 380,
  x = [-5, 5],
  y = [-4, 4],
  grid = true,
  faint = false,
  onClick,
}: {
  children?: ReactNode;
  height?: number;
  x?: V;
  y?: V;
  grid?: boolean;
  /** Fon to'rini xiralashtirish — asosiy figura (masalan, egilgan to'r) ajralib tursin */
  faint?: boolean;
  onClick?: (p: V) => void;
}) {
  return (
    <div className={"board" + (faint ? " faint" : "")}>
      <Mafs height={height} viewBox={{ x, y, padding: 0 }} pan={false} zoom={false} onClick={onClick}>
        {grid && <Coordinates.Cartesian subdivisions={false} />}
        {children}
      </Mafs>
    </div>
  );
}

/** Vektor + uchida yorliq */
export function Arrow({
  tip,
  tail = [0, 0],
  color,
  label,
  opacity = 1,
  weight = 3,
  style,
}: {
  tip: V;
  tail?: V;
  color: string;
  label?: string;
  opacity?: number;
  weight?: number;
  style?: "solid" | "dashed";
}) {
  const near = Math.hypot(tip[0] - tail[0], tip[1] - tail[1]) < 1e-6;
  return (
    <>
      {!near && <Vector tail={tail} tip={tip} color={color} opacity={opacity} weight={weight} style={style} />}
      {label && (
        <Text x={tip[0]} y={tip[1]} attach={tip[1] >= tail[1] ? "ne" : "se"} attachDistance={10} color={color} size={18}>
          {label}
        </Text>
      )}
    </>
  );
}

/** A matritsa ta'sirida deformatsiyalangan to'r. Chiziqli almashtirishda to'g'ri chiziq to'g'ri chiziqqa o'tadi. */
export function TransformedGrid({ A, n = 8, color = C.res, opacity = 0.4 }: { A: M; n?: number; color?: string; opacity?: number }) {
  const lines: ReactNode[] = [];
  for (let k = -n; k <= n; k++) {
    const main = k === 0;
    lines.push(
      <Line.Segment key={"v" + k} point1={apply(A, [k, -n])} point2={apply(A, [k, n])} color={color} opacity={main ? 0.9 : opacity} weight={main ? 2 : 1} />,
      <Line.Segment key={"h" + k} point1={apply(A, [-n, k])} point2={apply(A, [n, k])} color={color} opacity={main ? 0.9 : opacity} weight={main ? 2 : 1} />,
    );
  }
  return <>{lines}</>;
}

/** Birlik kvadratning A dagi tasviri (parallelogramm) */
export function UnitSquare({ A, color, opacity = 0.25 }: { A: M; color: string; opacity?: number }) {
  return <Polygon points={[[0, 0], apply(A, [1, 0]), apply(A, [1, 1]), apply(A, [0, 1])]} color={color} fillOpacity={opacity} weight={1.5} />;
}

/* ------------------------------------------------------------------ */
/* Animatsiya vaqt chizig'i: play / pauza / sudrash                    */
/* ------------------------------------------------------------------ */

export interface Timeline {
  t: number;
  max: number;
  playing: boolean;
  setT: (t: number) => void;
  play: () => void;
  pause: () => void;
}

/** t: 0 dan max gacha. `seconds` — 1 birlik t necha soniyada o'tishi. */
export function useTimeline(max = 1, seconds = 2): Timeline {
  const [t, setTState] = useState(0);
  const [playing, setPlaying] = useState(false);
  const tRef = useRef(0);
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    const step = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      const next = Math.min(max, tRef.current + dt / seconds);
      tRef.current = next;
      setTState(next);
      if (next >= max) setPlaying(false);
      else raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [playing, max, seconds]);
  const setT = (v: number) => {
    tRef.current = v;
    setTState(v);
  };
  return {
    t,
    max,
    playing,
    setT,
    play: () => {
      if (tRef.current >= max) setT(0);
      setPlaying(true);
    },
    pause: () => setPlaying(false),
  };
}

/** Vaqt chizig'i boshqaruvi. steps — har bir butun qadam uchun nom (t = 0..max). */
export function Controls({ tl, steps }: { tl: Timeline; steps?: string[] }) {
  const stepIdx = steps ? Math.min(steps.length - 1, Math.floor(tl.t + 1e-6)) : -1;
  return (
    <div className="controls">
      <button className="btn play" onClick={tl.playing ? tl.pause : tl.play} aria-label={tl.playing ? "Pauza" : "Boshlash"}>
        {tl.playing ? "❚❚" : "▶"}
      </button>
      <input type="range" min={0} max={tl.max} step={0.001} value={tl.t} onChange={(e) => { tl.pause(); tl.setT(+e.target.value); }} />
      {steps && (
        <div className="steps">
          {steps.map((s, i) => (
            <button key={i} className={"step" + (i === stepIdx ? " on" : "")} onClick={() => { tl.pause(); tl.setT(Math.min(tl.max, i + 1)); }}>
              {i + 1}. {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function Slider({ label, value, onChange, min = -3, max = 3, step = 0.1, color }: {
  label: ReactNode; value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; color?: string;
}) {
  return (
    <label className="slider" style={{ ["--c" as string]: color }}>
      <span className="slider-label">{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} />
      <span className="slider-val">{Math.round(value * 100) / 100}</span>
    </label>
  );
}

/** 2x2 matritsa kiritish + tayyor namunalar */
export function MatrixEditor({ A, onChange, presets }: { A: M; onChange: (A: M) => void; presets?: { name: string; A: M }[] }) {
  const set = (i: number, v: string) => {
    const n = Number(v);
    if (Number.isNaN(n)) return;
    const B = [...A] as M;
    B[i] = n;
    onChange(B);
  };
  return (
    <div className="matrix-editor">
      <div className="matrix-input">
        {A.map((x, i) => (
          <input key={i} type="number" step={0.5} value={x}
            style={{ color: i % 2 === 0 ? C.i : C.j }}
            onChange={(e) => set(i, e.target.value)} aria-label={`a${Math.floor(i / 2) + 1}${(i % 2) + 1}`} />
        ))}
      </div>
      {presets && (
        <div className="presets">
          {presets.map((p) => (
            <button key={p.name} className="chip" onClick={() => onChange(p.A)}>{p.name}</button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Rasm + yon panel (formula / izoh) */
export function Figure({ children, side, caption }: { children: ReactNode; side?: ReactNode; caption?: ReactNode }) {
  return (
    <figure className="figure">
      <div className="figure-main">{children}</div>
      {side && <div className="figure-side">{side}</div>}
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

export function Legend({ items }: { items: [string, ReactNode][] }) {
  return (
    <div className="legend">
      {items.map(([c, l], i) => (
        <span key={i}><i style={{ background: c }} />{l}</span>
      ))}
    </div>
  );
}

export const snap = (step: number) => (p: V): V => [Math.round(p[0] / step) * step, Math.round(p[1] / step) * step];
