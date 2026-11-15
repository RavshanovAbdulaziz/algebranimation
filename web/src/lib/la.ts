// 2D chiziqli algebra yordamchi funksiyalari.
// Matritsa qator bo'yicha yoziladi: [a, b, c, d]  =>  | a  b |
//                                                       | c  d |
export type V = [number, number];
export type M = [number, number, number, number];

export const I: M = [1, 0, 0, 1];

export const add = (u: V, v: V): V => [u[0] + v[0], u[1] + v[1]];
export const sub = (u: V, v: V): V => [u[0] - v[0], u[1] - v[1]];
export const scale = (v: V, k: number): V => [v[0] * k, v[1] * k];
export const dot = (u: V, v: V) => u[0] * v[0] + u[1] * v[1];
export const cross = (u: V, v: V) => u[0] * v[1] - u[1] * v[0];
export const len = (v: V) => Math.hypot(v[0], v[1]);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const lerpV = (u: V, v: V, t: number): V => [lerp(u[0], v[0], t), lerp(u[1], v[1], t)];
export const lerpM = (A: M, B: M, t: number): M => [
  lerp(A[0], B[0], t),
  lerp(A[1], B[1], t),
  lerp(A[2], B[2], t),
  lerp(A[3], B[3], t),
];

export const apply = (A: M, v: V): V => [A[0] * v[0] + A[1] * v[1], A[2] * v[0] + A[3] * v[1]];
/** A·B — avval B, keyin A bajariladi */
export const mul = (A: M, B: M): M => [
  A[0] * B[0] + A[1] * B[2],
  A[0] * B[1] + A[1] * B[3],
  A[2] * B[0] + A[3] * B[2],
  A[2] * B[1] + A[3] * B[3],
];
export const det = (A: M) => A[0] * A[3] - A[1] * A[2];
export const inv = (A: M): M | null => {
  const d = det(A);
  if (Math.abs(d) < 1e-9) return null;
  return [A[3] / d, -A[1] / d, -A[2] / d, A[0] / d];
};
export const col1 = (A: M): V => [A[0], A[2]];
export const col2 = (A: M): V => [A[1], A[3]];
export const fromCols = (c1: V, c2: V): M => [c1[0], c2[0], c1[1], c2[1]];

/** Haqiqiy xos qiymatlar (agar mavjud bo'lsa) */
export function eigen(A: M): { values: number[]; vectors: V[] } {
  const tr = A[0] + A[3];
  const d = det(A);
  const disc = tr * tr - 4 * d;
  if (disc < -1e-9) return { values: [], vectors: [] };
  const s = Math.sqrt(Math.max(0, disc));
  const ls = disc < 1e-9 ? [tr / 2] : [(tr + s) / 2, (tr - s) / 2];
  const vectors: V[] = [];
  const values: number[] = [];
  for (const l of ls) {
    // (A - lI) v = 0
    const a = A[0] - l, b = A[1], c = A[2], dd = A[3] - l;
    let v: V;
    if (Math.abs(b) > 1e-9 || Math.abs(a) > 1e-9) v = [-b, a];
    else if (Math.abs(c) > 1e-9 || Math.abs(dd) > 1e-9) v = [-dd, c];
    else {
      // A = lI: har qanday vektor xos vektor
      values.push(l, l);
      vectors.push([1, 0], [0, 1]);
      continue;
    }
    if (Math.abs(v[0]) < 1e-9 && Math.abs(v[1]) < 1e-9) continue;
    const n = len(v);
    values.push(l);
    vectors.push([v[0] / n, v[1] / n]);
  }
  return { values, vectors };
}

/** Sonni chiroyli ko'rsatish: 2.000 -> 2, 0.5 -> 0.5 */
export const fmt = (x: number, digits = 2) => {
  const r = Math.round(x * 10 ** digits) / 10 ** digits;
  return Object.is(r, -0) ? "0" : String(r);
};
/** Ko'paytuvchi/daraja asosi sifatida: manfiy bo'lsa qavsda — (−2)·3, (−2)² */
export const pf = (x: number, d = 2) => (x < 0 ? `(${fmt(x, d)})` : fmt(x, d));
/** Yig'indidagi had: "+ 3" yoki "- 3" (hech qachon "+ -3") */
export const term = (x: number, d = 2) => (x < 0 ? `- ${fmt(-x, d)}` : `+ ${fmt(x, d)}`);
/**
 * Chiziqli ifodani daftardagidek yozish (LaTeX):
 * lin([[1,"x"],[-2,"y"]], 1) → "x - 2y + 1";  1·x → x, −1·y → −y, 0 koeffitsiyentli had tushiriladi.
 */
export function lin(terms: [number, string][], c = 0, d = 2): string {
  let s = "";
  const push = (v: number, name: string) => {
    if (Math.abs(v) < 1e-9) return;
    const a = Math.abs(v);
    const coef = name && Math.abs(a - 1) < 1e-9 ? "" : fmt(a, d);
    s += s ? (v < 0 ? " - " : " + ") : v < 0 ? "-" : "";
    s += coef + name;
  };
  terms.forEach(([v, n]) => push(v, n));
  push(c, "");
  return s || "0";
}
export const fmtV = (v: V, d = 2) => `(${fmt(v[0], d)}, ${fmt(v[1], d)})`;

export const smooth = (t: number) => {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
};
export const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

/** LaTeX ko'rinishidagi 2x2 matritsa */
export const texM = (A: M, d = 2) =>
  `\\begin{bmatrix} ${fmt(A[0], d)} & ${fmt(A[1], d)} \\\\ ${fmt(A[2], d)} & ${fmt(A[3], d)} \\end{bmatrix}`;
export const texV = (v: V, d = 2) => `\\begin{bmatrix} ${fmt(v[0], d)} \\\\ ${fmt(v[1], d)} \\end{bmatrix}`;
