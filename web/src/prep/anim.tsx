import { useEffect, useRef, useState, type ReactNode } from "react";
import { Tex } from "../components/Tex";
import { tn, tp } from "./core";

/*
 * Animatsiyali yechim: kam matn, ko'proq ko'z.
 * Har bir kadr — jadvallar (kataklari rangli/xira), formula hadlari (birin-ketin paydo bo'ladi) va bitta qisqa izoh.
 * O'zgargan son "sakrab" chiqadi (key qiymatga bog'langan — qayta paydo bo'lish animatsiyasi).
 */

export type Tone = "a" | "b" | "c" | "d" | "res" | "dim" | "goal" | "gray";

export interface MatBlock {
  kind: "mat";
  id: string;
  cells: (number | string)[][];
  br?: "v" | "p" | "aug";
  /** "i,j" → rang */
  tones?: Record<string, Tone>;
  label?: string;
}
export interface TermsBlock { kind: "terms"; id: string; parts: { tex: string; tone?: Tone }[] }
export interface TexBlock { kind: "tex"; id: string; tex: string; tone?: Tone }
export type Block = MatBlock | TermsBlock | TexBlock;
export interface Frame { blocks: Block[]; cap: ReactNode }

const COLORS: Record<Tone, string> = { a: "#58c4dd", b: "#ff9f43", c: "#83c167", d: "#c084fc", res: "#ffd166", dim: "", goal: "#ffd166", gray: "#6b7280" };

function Mat({ b }: { b: MatBlock }) {
  const n = b.cells[0].length;
  const br = b.br ?? "p";
  return (
    <div className="am-wrap">
      {b.label && <div className="am-label"><Tex>{b.label}</Tex></div>}
      <div className={`am-mat br-${br}`} style={{ gridTemplateColumns: `repeat(${n}, auto)` }}>
        {b.cells.map((row, i) =>
          row.map((x, j) => {
            const tone = b.tones?.[`${i},${j}`];
            const isStr = typeof x === "string";
            return (
              <div
                key={`${i}-${j}-${x}`}
                className={["am-cell", tone ? `t-${tone}` : "", br === "aug" && j === n - 1 ? "aug-last" : ""].join(" ")}
                style={tone && COLORS[tone] ? { ["--tc" as string]: COLORS[tone] } : undefined}
              >
                {isStr ? <Tex>{x as string}</Tex> : <Tex>{tn(x as number)}</Tex>}
              </div>
            );
          }),
        )}
      </div>
    </div>
  );
}

function Terms({ b }: { b: TermsBlock }) {
  return (
    <div className="am-terms">
      {b.parts.map((p, i) => (
        <span key={i + p.tex} className={"am-term" + (p.tone ? ` t-${p.tone}` : "")} style={p.tone && COLORS[p.tone] ? { ["--tc" as string]: COLORS[p.tone] } : undefined}>
          <Tex>{p.tex}</Tex>
        </span>
      ))}
    </div>
  );
}

export function AnimPlayer({ frames, speed = 2200 }: { frames: Frame[]; speed?: number }) {
  const [k, setK] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (!playing) return;
    if (k >= frames.length - 1) { setPlaying(false); return; }
    timer.current = window.setTimeout(() => setK((v) => v + 1), speed);
    return () => window.clearTimeout(timer.current);
  }, [playing, k, frames.length, speed]);
  const f = frames[Math.min(k, frames.length - 1)];
  return (
    <div className="am">
      <div className="am-stage">
        {f.blocks.map((b) =>
          b.kind === "mat" ? <Mat key={b.id} b={b} /> : b.kind === "terms" ? <Terms key={b.id} b={b} /> : (
            <div key={b.id + b.tex} className={"am-tex" + (b.tone ? ` t-${b.tone}` : "")} style={b.tone && COLORS[b.tone] ? { ["--tc" as string]: COLORS[b.tone] } : undefined}><Tex>{b.tex}</Tex></div>
          ),
        )}
      </div>
      <div className="am-cap" key={k}>{f.cap}</div>
      <div className="am-ctl">
        <button className="btn small ghost" disabled={k === 0} onClick={() => { setPlaying(false); setK(k - 1); }} aria-label="Orqaga">◀</button>
        <button className="btn small" onClick={() => { if (k >= frames.length - 1) setK(0); setPlaying(!playing); }}>
          {playing ? "❚❚ To'xtatish" : k >= frames.length - 1 ? "↻ Qaytadan" : "▶ Ko'rsatish"}
        </button>
        <button className="btn small ghost" disabled={k >= frames.length - 1} onClick={() => { setPlaying(false); setK(k + 1); }} aria-label="Keyingi">▶</button>
        <div className="am-dots">
          {frames.map((_, i) => <button key={i} className={"am-dot" + (i === k ? " on" : i < k ? " done" : "")} onClick={() => { setPlaying(false); setK(i); }} aria-label={`${i + 1}-qadam`} />)}
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/* Kadr quruvchilar                                                    */
/* ================================================================== */

const key = (i: number, j: number) => `${i},${j}`;
const tonesOf = (cells: [number, number][], t: Tone, base: Record<string, Tone> = {}) => {
  const o = { ...base };
  cells.forEach(([i, j]) => (o[key(i, j)] = t));
  return o;
};
const dimExcept = (rows: number, cols: number, keep: (i: number, j: number) => boolean) => {
  const o: Record<string, Tone> = {};
  for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) if (!keep(i, j)) o[key(i, j)] = "dim";
  return o;
};
const det2 = (m: number[][]) => m[0][0] * m[1][1] - m[0][1] * m[1][0];
const det3 = (m: number[][]) =>
  m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
const minorOf = (m: number[][], i: number, j: number) => m.filter((_, a) => a !== i).map((r) => r.filter((_, b) => b !== j));

/* ---------- 2×2 determinant ---------- */
export function det2Anim(m: number[][], label = "\\Delta"): Frame[] {
  const [[a, b], [c, d]] = m;
  const p1 = a * d, p2 = b * c, r = p1 - p2;
  const D = [[0, 0], [1, 1]] as [number, number][], O = [[0, 1], [1, 0]] as [number, number][];
  const mat = (tones?: Record<string, Tone>): MatBlock => ({ kind: "mat", id: "m", cells: m, br: "v", tones, label: `${label} =` });
  const t1 = { tex: `${tp(a)}\\cdot${tp(d)}`, tone: "a" as Tone };
  const t2 = { tex: `${tp(b)}\\cdot${tp(c)}`, tone: "b" as Tone };
  return [
    { blocks: [mat()], cap: <>2×2 determinant: ikki diagonal bor.</> },
    { blocks: [mat(tonesOf(D, "a")), { kind: "terms", id: "t", parts: [t1] }], cap: <><b style={{ color: COLORS.a }}>Bosh diagonal</b> — ko'paytiramiz.</> },
    { blocks: [mat(tonesOf(O, "b", tonesOf(D, "a"))), { kind: "terms", id: "t", parts: [t1, { tex: "-" }, t2] }], cap: <><b style={{ color: COLORS.b }}>Yon diagonal</b> — ko'paytirib, <b>ayiramiz</b>.</> },
    { blocks: [mat(tonesOf(O, "b", tonesOf(D, "a"))), { kind: "terms", id: "t", parts: [t1, { tex: "-" }, t2, { tex: "=" }, { tex: tn(p1), tone: "a" }, { tex: "-" }, { tex: tp(p2), tone: "b" }] }], cap: <>Ko'paytmalarni hisoblaymiz.</> },
    { blocks: [mat(), { kind: "terms", id: "t", parts: [{ tex: tn(p1), tone: "a" }, { tex: "-" }, { tex: tp(p2), tone: "b" }, { tex: "=" }, { tex: `${label}=${tn(r)}`, tone: "res" }] }], cap: <>{p2 < 0 ? "Manfiy sonni ayirish — qo'shish. " : ""}Javob: <b>{r}</b>.</> },
  ];
}

/* ---------- 3×3 Sarrus ---------- */
export function sarrusAnim(m: number[][], label = "\\Delta"): Frame[] {
  const ext = m.map((r) => [...r, r[0], r[1]]);
  const plus = [0, 1, 2].map((k) => [[0, k], [1, k + 1], [2, k + 2]] as [number, number][]);
  const minus = [0, 1, 2].map((k) => [[0, k + 2], [1, k + 1], [2, k]] as [number, number][]);
  const grayCols = tonesOf([[0, 3], [0, 4], [1, 3], [1, 4], [2, 3], [2, 4]], "gray");
  const val = (cs: [number, number][]) => cs.reduce((s, [i, j]) => s * ext[i][j], 1);
  const tx = (cs: [number, number][]) => cs.map(([i, j]) => tp(ext[i][j])).join("\\cdot");
  const frames: Frame[] = [
    { blocks: [{ kind: "mat", id: "m", cells: m, br: "v", label: `${label} =` }], cap: <>3×3 determinant — Sarrus qoidasi: 6 ta ko'paytma.</> },
    { blocks: [{ kind: "mat", id: "m", cells: ext, br: "v", tones: grayCols }], cap: <>1- va 2-ustunni o'ngga qayta yozamiz (kulrang).</> },
  ];
  const parts: TermsBlock["parts"] = [];
  plus.forEach((cs, i) => {
    parts.push(...(i ? [{ tex: "+" }] : []), { tex: `${tx(cs)}`, tone: "a" });
    frames.push({ blocks: [{ kind: "mat", id: "m", cells: ext, br: "v", tones: tonesOf(cs, "a", grayCols) }, { kind: "terms", id: "t", parts: [...parts] }], cap: <><b style={{ color: COLORS.a }}>"+" chiziq {i + 1}</b>: chapdan o'ngga pastga — ko'paytma <b>{val(cs)}</b>.</> });
  });
  parts.splice(0, parts.length, { tex: `(${plus.map((cs) => tp(val(cs))).join("+")})`, tone: "a" });
  minus.forEach((cs, i) => {
    parts.push({ tex: i ? "+" : "-\\,(" }, { tex: `${tx(cs)}`, tone: "b" });
    frames.push({ blocks: [{ kind: "mat", id: "m", cells: ext, br: "v", tones: tonesOf(cs, "b", grayCols) }, { kind: "terms", id: "t", parts: [...parts, ...(i === 2 ? [{ tex: ")" }] : [])] }], cap: <><b style={{ color: COLORS.b }}>"−" chiziq {i + 1}</b>: o'ngdan chapga pastga — ko'paytma <b>{val(cs)}</b>.</> });
  });
  const sp = plus.reduce((s, cs) => s + val(cs), 0), sm = minus.reduce((s, cs) => s + val(cs), 0);
  frames.push({
    blocks: [{ kind: "mat", id: "m", cells: m, br: "v" }, { kind: "terms", id: "t", parts: [{ tex: tn(sp), tone: "a" }, { tex: "-" }, { tex: tp(sm), tone: "b" }, { tex: "=" }, { tex: `${label}=${tn(sp - sm)}`, tone: "res" }] }],
    cap: <>"+" lar yig'indisidan "−" lar yig'indisini ayiramiz. Javob: <b>{sp - sm}</b>.</>,
  });
  return frames;
}

/* ---------- minor va algebraik to'ldiruvchi ---------- */
export function cofactorAnim(m: number[][], i: number, j: number): Frame[] {
  const n = m.length;
  const mm = minorOf(m, i, j), M = det2(mm), s = (i + j) % 2 ? -1 : 1;
  const cut = dimExcept(n, n, (a, b) => a !== i && b !== j);
  cut[key(i, j)] = "goal";
  const chess = Array.from({ length: n }, (_, a) => Array.from({ length: n }, (_, b) => ((a + b) % 2 ? "-" : "+")));
  const I = i + 1, J = j + 1;
  return [
    { blocks: [{ kind: "mat", id: "m", cells: m, br: "v", tones: { [key(i, j)]: "goal" } }], cap: <><Tex>{`A_{${I}${J}}`}</Tex> ni topamiz: {I}-satr, {J}-ustundagi element.</> },
    { blocks: [{ kind: "mat", id: "m", cells: m, br: "v", tones: cut }, { kind: "mat", id: "mm", cells: mm, br: "v", label: `M_{${I}${J}} =` }], cap: <>{I}-satr va {J}-ustunni o'chiramiz — qolgani minor.</> },
    { blocks: [{ kind: "mat", id: "m", cells: m, br: "v", tones: cut }, { kind: "mat", id: "mm", cells: mm, br: "v", label: `M_{${I}${J}} =`, tones: { "0,0": "a", "1,1": "a", "0,1": "b", "1,0": "b" } }, { kind: "terms", id: "t", parts: [{ tex: `${tp(mm[0][0])}\\cdot${tp(mm[1][1])}`, tone: "a" }, { tex: "-" }, { tex: `${tp(mm[0][1])}\\cdot${tp(mm[1][0])}`, tone: "b" }, { tex: "=" }, { tex: tn(M), tone: "res" }] }], cap: <>Minor — oddiy 2×2 determinant.</> },
    { blocks: [{ kind: "mat", id: "ch", cells: chess, br: "p", tones: { [key(i, j)]: s > 0 ? "c" : "b" }, label: "\\text{ishora:}" }], cap: <>Ishora shaxmatdan: {I}+{J}={I + J} — {s > 0 ? "juft, \"+\"" : "toq, \"−\""}.</> },
    { blocks: [{ kind: "terms", id: "t", parts: [{ tex: `A_{${I}${J}} =` }, { tex: s > 0 ? "+" : "-", tone: s > 0 ? "c" : "b" }, { tex: `(${tn(M)})`, tone: "res" }, { tex: "=" }, { tex: tn(s * M), tone: "res" }] }], cap: <>Javob: <Tex>{`A_{${I}${J}} = ${tn(s * M)}`}</Tex>.</> },
  ];
}

/* ---------- Laplas ---------- */
export function laplaceAnim(m: number[][]): Frame[] {
  let best = { row: true, k: 0, z: -1 };
  for (let k = 0; k < 3; k++) {
    const zr = m[k].filter((x) => x === 0).length, zc = m.filter((r) => r[k] === 0).length;
    if (zr > best.z) best = { row: true, k, z: zr };
    if (zc > best.z) best = { row: false, k, z: zc };
  }
  const pos = [0, 1, 2].map((t) => (best.row ? [best.k, t] : [t, best.k]) as [number, number]);
  const line = tonesOf(pos, "a");
  const frames: Frame[] = [
    { blocks: [{ kind: "mat", id: "m", cells: m, br: "v", tones: line }], cap: <>Eng ko'p nol bor {best.row ? "satr" : "ustun"} — {best.k + 1}-{best.row ? "satr" : "ustun"} ({best.z} ta nol). Shu bo'yicha yoyamiz.</> },
  ];
  const parts: TermsBlock["parts"] = [{ tex: "\\Delta =" }];
  let total = 0;
  pos.forEach(([i, j], t) => {
    const e = m[i][j];
    const s = (i + j) % 2 ? -1 : 1;
    const mm = minorOf(m, i, j), A = s * det2(mm);
    total += e * A;
    if (t) parts.push({ tex: "+" });
    if (e === 0) {
      parts.push({ tex: `0\\cdot A_{${i + 1}${j + 1}}`, tone: "gray" });
      frames.push({ blocks: [{ kind: "mat", id: "m", cells: m, br: "v", tones: tonesOf([[i, j]], "gray", line) }, { kind: "terms", id: "t", parts: [...parts] }], cap: <>Bu element 0 — hadi ham 0, hisoblamaymiz.</> });
      return;
    }
    const cut = dimExcept(3, 3, (a, b) => a !== i && b !== j);
    cut[key(i, j)] = "goal";
    parts.push({ tex: `${tp(e)}\\cdot(${s > 0 ? "" : "-"}${tn(det2(mm))})`, tone: "c" });
    frames.push({
      blocks: [{ kind: "mat", id: "m", cells: m, br: "v", tones: cut }, { kind: "mat", id: "mm" + t, cells: mm, br: "v", label: `${s > 0 ? "+" : "-"}` }, { kind: "terms", id: "t", parts: [...parts] }],
      cap: <><Tex>{tn(e)}</Tex> ning satri va ustunini o'chiramiz; minor <Tex>{tn(det2(mm))}</Tex>, ishora {s > 0 ? "+" : "−"}.</>,
    });
  });
  frames.push({ blocks: [{ kind: "mat", id: "m", cells: m, br: "v" }, { kind: "terms", id: "t", parts: [...parts, { tex: "=" }, { tex: tn(total), tone: "res" }] }], cap: <>Qo'shamiz. Javob: <b>{total}</b>.</> });
  return frames;
}

/* ---------- uchburchak ---------- */
export function triAnim(m: number[][]): Frame[] {
  const n = m.length;
  const diag = Array.from({ length: n }, (_, i) => [i, i] as [number, number]);
  const zeros: [number, number][] = [];
  m.forEach((r, i) => r.forEach((x, j) => { if (i !== j && x === 0) zeros.push([i, j]); }));
  const v = diag.reduce((s, [i]) => s * m[i][i], 1);
  return [
    { blocks: [{ kind: "mat", id: "m", cells: m, br: "v", tones: tonesOf(zeros, "gray") }], cap: <>Diagonalning bir tomonida hammasi 0 — uchburchak ko'rinish.</> },
    { blocks: [{ kind: "mat", id: "m", cells: m, br: "v", tones: tonesOf(diag, "a", tonesOf(zeros, "gray")) }, { kind: "terms", id: "t", parts: [{ tex: diag.map(([i]) => tp(m[i][i])).join("\\cdot"), tone: "a" }] }], cap: <>Faqat diagonal sonlar ko'paytiriladi.</> },
    { blocks: [{ kind: "mat", id: "m", cells: m, br: "v", tones: tonesOf(diag, "a", tonesOf(zeros, "gray")) }, { kind: "terms", id: "t", parts: [{ tex: diag.map(([i]) => tp(m[i][i])).join("\\cdot"), tone: "a" }, { tex: "=" }, { tex: tn(v), tone: "res" }] }], cap: <>Javob: <b>{v}</b>.</> },
  ];
}

/* ---------- matritsalarni ko'paytirish ---------- */
export function prodAnim(A: number[][], B: number[][]): Frame[] {
  const m = A.length, q = B[0].length;
  const P = A.map((r) => B[0].map((_, j) => r.reduce((s, x, k) => s + x * B[k][j], 0)));
  const C: (number | string)[][] = P.map((r) => r.map(() => "?"));
  const frames: Frame[] = [
    { blocks: [{ kind: "mat", id: "A", cells: A }, { kind: "tex", id: "x", tex: "\\cdot" }, { kind: "mat", id: "B", cells: B }, { kind: "tex", id: "eq", tex: "=" }, { kind: "mat", id: "C", cells: C.map((r) => [...r]) }], cap: <>Natija {m}×{q}: har bir katakni "satr × ustun" bilan topamiz.</> },
  ];
  for (let i = 0; i < m; i++) for (let j = 0; j < q; j++) {
    const rowT = tonesOf(A[i].map((_, k) => [i, k] as [number, number]), "a");
    const colT = tonesOf(B.map((_, k) => [k, j] as [number, number]), "b");
    const terms = A[i].map((x, k) => ({ tex: `${tp(x)}\\cdot${tp(B[k][j])}`, tone: "c" as Tone }));
    const before = C.map((r) => [...r]);
    frames.push({
      blocks: [{ kind: "mat", id: "A", cells: A, tones: rowT }, { kind: "tex", id: "x", tex: "\\cdot" }, { kind: "mat", id: "B", cells: B, tones: colT }, { kind: "tex", id: "eq", tex: "=" }, { kind: "mat", id: "C", cells: before, tones: { [key(i, j)]: "goal" } },
        { kind: "terms", id: "t", parts: terms.flatMap((t, k) => (k ? [{ tex: "+" }, t] : [t])) }],
      cap: <><b style={{ color: COLORS.a }}>{i + 1}-satr</b> × <b style={{ color: COLORS.b }}>{j + 1}-ustun</b>: juft-juft ko'paytirib qo'shamiz.</>,
    });
    C[i][j] = P[i][j];
    frames.push({
      blocks: [{ kind: "mat", id: "A", cells: A, tones: rowT }, { kind: "tex", id: "x", tex: "\\cdot" }, { kind: "mat", id: "B", cells: B, tones: colT }, { kind: "tex", id: "eq", tex: "=" }, { kind: "mat", id: "C", cells: C.map((r) => [...r]), tones: { [key(i, j)]: "res" } },
        { kind: "terms", id: "t", parts: [...terms.flatMap((t, k) => (k ? [{ tex: "+" }, t] : [t])), { tex: "=" }, { tex: tn(P[i][j]), tone: "res" }] }],
      cap: <>Natija <b>{P[i][j]}</b> — ({i + 1}, {j + 1}) katakka yoziladi.</>,
    });
  }
  return frames;
}

/* ---------- teskari 2×2 ---------- */
export function inv2Anim(A: number[][]): Frame[] {
  const [[a, b], [c, d]] = A;
  const D = det2(A);
  const sw = [[d, b], [c, a]], adj = [[d, -b], [-c, a]];
  const inv = adj.map((r) => r.map((x) => x / D));
  const fr = D === 1 ? "" : D < 0 ? `-\\frac{1}{${-D}}` : `\\frac{1}{${D}}`;
  return [
    { blocks: [{ kind: "mat", id: "A", cells: A, label: "A =" }], cap: <>Teskari matritsa: 3 ta harakat.</> },
    { blocks: [{ kind: "mat", id: "A", cells: A, br: "v", tones: { "0,0": "a", "1,1": "a", "0,1": "b", "1,0": "b" }, label: "\\det A =" }, { kind: "terms", id: "t", parts: [{ tex: `${tp(a)}\\cdot${tp(d)}`, tone: "a" }, { tex: "-" }, { tex: `${tp(b)}\\cdot${tp(c)}`, tone: "b" }, { tex: "=" }, { tex: tn(D), tone: "res" }] }], cap: <>Avval determinant: {D} ≠ 0, teskarisi bor.</> },
    { blocks: [{ kind: "mat", id: "A", cells: sw, tones: { "0,0": "a", "1,1": "a" } }], cap: <><b style={{ color: COLORS.a }}>1)</b> Bosh diagonaldagi sonlar o'rin almashadi.</> },
    { blocks: [{ kind: "mat", id: "A", cells: adj, tones: { "0,0": "a", "1,1": "a", "0,1": "b", "1,0": "b" } }], cap: <><b style={{ color: COLORS.b }}>2)</b> Yon diagonaldagi sonlarning ishorasi o'zgaradi.</> },
    { blocks: [{ kind: "tex", id: "f", tex: `A^{-1} = ${fr || "1\\cdot"}`, tone: "res" }, { kind: "mat", id: "A", cells: adj }], cap: <><b style={{ color: COLORS.res }}>3)</b> Oldiga <Tex>{`\\frac{1}{\\det A}`}</Tex> yozamiz.</> },
    ...(D === 1 ? [] : [{ blocks: [{ kind: "tex", id: "f", tex: "A^{-1} =" } as Block, { kind: "mat", id: "A", cells: inv, tones: { "0,0": "res", "0,1": "res", "1,0": "res", "1,1": "res" } } as Block], cap: <>Har bir sonni {D} ga bo'lamiz.</> }]),
  ];
}

/* ---------- Kramer ---------- */
export function kramerAnim(A: number[][], b: number[]): Frame[] {
  const n = A.length;
  const names = ["x", "y", "z"].slice(0, n);
  const dt = (M: number[][]) => (n === 2 ? det2(M) : det3(M));
  const D = dt(A);
  const withCol = (j: number) => A.map((r, i) => r.map((x, k) => (k === j ? b[i] : x)));
  const aug = A.map((r, i) => [...r, b[i]]);
  const colT = (j: number, t: Tone) => tonesOf(A.map((_, i) => [i, j] as [number, number]), t);
  const frames: Frame[] = [
    { blocks: [{ kind: "mat", id: "aug", cells: aug, br: "aug", tones: colT(n, "a") }], cap: <>Chapda — noma'lumlar oldidagi sonlar, o'ngda (<b style={{ color: COLORS.a }}>ko'k</b>) — ozod hadlar.</> },
    { blocks: [{ kind: "mat", id: "D", cells: A, br: "v", label: "\\Delta =" }, { kind: "tex", id: "r", tex: `= ${tn(D)}`, tone: "res" }], cap: <>Asosiy determinant <Tex>{"\\Delta"}</Tex> — faqat chap qismdan. {D} ≠ 0.</> },
  ];
  const Ds: number[] = [];
  names.forEach((v, j) => {
    const M = withCol(j);
    Ds.push(dt(M));
    frames.push({ blocks: [{ kind: "mat", id: "D", cells: A, br: "v", tones: colT(j, "goal"), label: `\\Delta_${v} :` }], cap: <>{v} ning ustuni ({j + 1}-ustun)…</> });
    frames.push({ blocks: [{ kind: "mat", id: "D", cells: M, br: "v", tones: colT(j, "a"), label: `\\Delta_${v} =` }, { kind: "tex", id: "r", tex: `= ${tn(Ds[j])}`, tone: "res" }], cap: <>…o'rniga <b style={{ color: COLORS.a }}>ozod hadlar</b> qo'yiladi va hisoblanadi.</> });
  });
  frames.push({
    blocks: [{ kind: "terms", id: "ans", parts: names.flatMap((v, j) => [...(j ? [{ tex: ",\\quad" }] : []), { tex: `${v} = \\frac{${tn(Ds[j])}}{${tn(D)}} = ${tn(Ds[j] / D)}`, tone: "res" as Tone }]) }],
    cap: <>Har birini <Tex>{"\\Delta"}</Tex> ga bo'lamiz.</>,
  });
  return frames;
}

/* ---------- Gauss ---------- */
export function gaussAnim(A: number[][], b: number[]): Frame[] {
  let M = A.map((r, i) => [...r, b[i]]);
  const frames: Frame[] = [
    { blocks: [{ kind: "mat", id: "M", cells: M, br: "aug", tones: tonesOf([[1, 0], [2, 0], [2, 1]], "goal") }], cap: <>Maqsad: sariq kataklarni <b>0</b> qilish (zinapoya).</> },
  ];
  for (let c = 0; c < 2; c++) for (let i = c + 1; i < 3; i++) {
    const k = M[i][c] / M[c][c];
    if (k === 0) continue;
    const pivotRow = tonesOf(M[c].map((_, j) => [c, j] as [number, number]), "a");
    const op = `R_${i + 1} ${k > 0 ? "-" : "+"} ${Math.abs(k) === 1 ? "" : tn(Math.abs(k))}R_${c + 1}`;
    frames.push({
      blocks: [{ kind: "mat", id: "M", cells: M, br: "aug", tones: { ...pivotRow, [key(i, c)]: "goal" } }, { kind: "tex", id: "op", tex: op, tone: "c" }],
      cap: <><Tex>{tn(M[i][c])}</Tex> ni yo'qotamiz: <b style={{ color: COLORS.a }}>{c + 1}-satrni</b> <Tex>{tn(k)}</Tex> ga ko'paytirib, {i + 1}-satrdan ayiramiz.</>,
    });
    const row = M[i].map((x, j) => x - k * M[c][j]);
    M = M.map((r, a) => (a === i ? row : r));
    frames.push({
      blocks: [{ kind: "mat", id: "M", cells: M, br: "aug", tones: { ...tonesOf(row.map((_, j) => [i, j] as [number, number]), "c"), [key(i, c)]: "res" } }, { kind: "tex", id: "op", tex: op, tone: "c" }],
      cap: <>{i + 1}-satr yangilandi — o'sha joyda endi <b>0</b>.</>,
    });
  }
  const z = M[2][3] / M[2][2];
  const y = (M[1][3] - M[1][2] * z) / M[1][1];
  const x = (M[0][3] - M[0][1] * y - M[0][2] * z) / M[0][0];
  const rowT = (i: number) => tonesOf(M[i].map((_, j) => [i, j] as [number, number]), "d");
  frames.push({ blocks: [{ kind: "mat", id: "M", cells: M, br: "aug", tones: rowT(2) }, { kind: "tex", id: "z", tex: `z = \\frac{${tn(M[2][3])}}{${tn(M[2][2])}} = ${tn(z)}`, tone: "res" }], cap: <>Zinapoya tayyor. Pastki satrdan z.</> });
  frames.push({ blocks: [{ kind: "mat", id: "M", cells: M, br: "aug", tones: rowT(1) }, { kind: "tex", id: "z", tex: `z = ${tn(z)}`, tone: "gray" }, { kind: "tex", id: "y", tex: `y = ${tn(y)}`, tone: "res" }], cap: <>z ni 2-satrga qo'yib — y.</> });
  frames.push({ blocks: [{ kind: "mat", id: "M", cells: M, br: "aug", tones: rowT(0) }, { kind: "tex", id: "z", tex: `z = ${tn(z)},\\ y = ${tn(y)}`, tone: "gray" }, { kind: "tex", id: "x", tex: `x = ${tn(x)}`, tone: "res" }], cap: <>y va z ni 1-satrga qo'yib — x.</> });
  return frames;
}

/* ---------- matritsa usuli ---------- */
export function matrixAnim(A: number[][], b: number[]): Frame[] {
  const [[a, bb], [c, d]] = A;
  const D = det2(A);
  const adj = [[d, -bb], [-c, a]];
  const adjB = adj.map((r) => r[0] * b[0] + r[1] * b[1]);
  const X = adjB.map((v) => v / D);
  const fr = D === 1 ? "" : D === -1 ? "-" : D < 0 ? `-\\frac{1}{${-D}}` : `\\frac{1}{${D}}`;
  const Bc = b.map((v) => [v]);
  return [
    { blocks: [{ kind: "mat", id: "A", cells: A, label: "A" }, { kind: "tex", id: "dot", tex: "\\cdot\\begin{pmatrix}x\\\\y\\end{pmatrix} =" }, { kind: "mat", id: "B", cells: Bc, label: "B" }], cap: <>Sistema = <Tex>{"A\\cdot X = B"}</Tex>. Javob: <Tex>{"X = A^{-1}\\cdot B"}</Tex>.</> },
    ...inv2Anim(A).slice(1, 5),
    {
      blocks: [{ kind: "tex", id: "f", tex: fr || " " }, { kind: "mat", id: "adj", cells: adj, tones: { "0,0": "a", "0,1": "a" } }, { kind: "tex", id: "dot", tex: "\\cdot" }, { kind: "mat", id: "B", cells: Bc, tones: { "0,0": "b", "1,0": "b" } },
        { kind: "terms", id: "t", parts: [{ tex: `${tp(adj[0][0])}\\cdot${tp(b[0])}+${tp(adj[0][1])}\\cdot${tp(b[1])} = ${tn(adjB[0])}`, tone: "c" }] }],
      cap: <>1-satr × ustun…</>,
    },
    {
      blocks: [{ kind: "tex", id: "f", tex: fr || " " }, { kind: "mat", id: "adj", cells: adj, tones: { "1,0": "a", "1,1": "a" } }, { kind: "tex", id: "dot", tex: "\\cdot" }, { kind: "mat", id: "B", cells: Bc, tones: { "0,0": "b", "1,0": "b" } },
        { kind: "terms", id: "t", parts: [{ tex: `${tp(adj[1][0])}\\cdot${tp(b[0])}+${tp(adj[1][1])}\\cdot${tp(b[1])} = ${tn(adjB[1])}`, tone: "c" }] }],
      cap: <>2-satr × ustun…</>,
    },
    { blocks: [{ kind: "tex", id: "f", tex: `X = ${fr}` }, { kind: "mat", id: "adjB", cells: adjB.map((v) => [v]) }, { kind: "tex", id: "eq", tex: "=" }, { kind: "mat", id: "X", cells: X.map((v) => [v]), tones: { "0,0": "res", "1,0": "res" } }], cap: <>Oxirida <Tex>{fr ? fr.replace(/^-$/, "-1") : "1"}</Tex> ga ko'paytiramiz: <b>x = {X[0]}, y = {X[1]}</b>.</> },
  ];
}
