// Oddiy kasrlar: Gauss usuli va teskari matritsani "daftardagidek" aniq ko'rsatish uchun.
export type Fr = { n: number; d: number };

const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : Math.abs(a));
export const fr = (n: number, d = 1): Fr => {
  if (d < 0) { n = -n; d = -d; }
  const g = gcd(n, d) || 1;
  return { n: n / g, d: d / g };
};
export const fAdd = (a: Fr, b: Fr) => fr(a.n * b.d + b.n * a.d, a.d * b.d);
export const fSub = (a: Fr, b: Fr) => fr(a.n * b.d - b.n * a.d, a.d * b.d);
export const fMul = (a: Fr, b: Fr) => fr(a.n * b.n, a.d * b.d);
export const fDiv = (a: Fr, b: Fr) => fr(a.n * b.d, a.d * b.n);
export const isZero = (a: Fr) => a.n === 0;
export const isOne = (a: Fr) => a.n === a.d;
export const fTex = (a: Fr) => (a.d === 1 ? String(a.n) : `${a.n < 0 ? "-" : ""}\\tfrac{${Math.abs(a.n)}}{${a.d}}`);

export type FM = Fr[][];
export const toFM = (A: number[][]): FM => A.map((r) => r.map((x) => fr(x)));

export interface GStep {
  M: FM;
  op: string; // LaTeX
  changed: number[];
  phase: "boshlang'ich" | "to'g'ri yo'l" | "teskari yo'l";
}

/** Gauss (to'g'ri yo'l) va ixtiyoriy ravishda Gauss–Jordan (teskari yo'l) qadamlari */
export function gaussSteps(A0: number[][], jordan = true, cols?: number): GStep[] {
  let M = toFM(A0);
  const rows = M.length;
  const nc = cols ?? M[0].length;
  const steps: GStep[] = [{ M, op: "\\text{Boshlang'ich kengaytirilgan matritsa}", changed: [], phase: "boshlang'ich" }];
  const push = (op: string, changed: number[], phase: GStep["phase"]) => steps.push({ M, op, changed, phase });
  const pivots: [number, number][] = [];
  let r = 0;
  for (let c = 0; c < nc && r < rows; c++) {
    let p = r;
    while (p < rows && isZero(M[p][c])) p++;
    if (p === rows) continue;
    if (p !== r) {
      M = M.map((row, i) => (i === r ? M[p] : i === p ? M[r] : row));
      push(`R_${r + 1} \\leftrightarrow R_${p + 1}`, [r, p], "to'g'ri yo'l");
    }
    const piv = M[r][c];
    if (!isOne(piv)) {
      M = M.map((row, i) => (i === r ? row.map((x) => fDiv(x, piv)) : row));
      push(`R_${r + 1} \\leftarrow R_${r + 1} : (${fTex(piv)})`, [r], "to'g'ri yo'l");
    }
    for (let i = r + 1; i < rows; i++) {
      const k = M[i][c];
      if (isZero(k)) continue;
      const rr = r;
      M = M.map((row, a) => (a === i ? row.map((x, j) => fSub(x, fMul(k, M[rr][j]))) : row));
      push(`R_${i + 1} \\leftarrow R_${i + 1} - (${fTex(k)})\\cdot R_${r + 1}`, [i], "to'g'ri yo'l");
    }
    pivots.push([r, c]);
    r++;
  }
  if (jordan) {
    for (let q = pivots.length - 1; q >= 0; q--) {
      const [pr, pc] = pivots[q];
      for (let i = pr - 1; i >= 0; i--) {
        const k = M[i][pc];
        if (isZero(k)) continue;
        M = M.map((row, a) => (a === i ? row.map((x, j) => fSub(x, fMul(k, M[pr][j]))) : row));
        push(`R_${i + 1} \\leftarrow R_${i + 1} - (${fTex(k)})\\cdot R_${pr + 1}`, [i], "teskari yo'l");
      }
    }
  }
  return steps;
}

export const rankOf = (A: number[][]) => {
  const last = gaussSteps(A, false).at(-1)!.M;
  return last.filter((row) => row.some((x) => !isZero(x))).length;
};

export function det3F(A: FM): Fr {
  const m = (i: number, j: number) => {
    const r = A.filter((_, k) => k !== i).map((row) => row.filter((_, l) => l !== j));
    return fSub(fMul(r[0][0], r[1][1]), fMul(r[0][1], r[1][0]));
  };
  return [0, 1, 2].reduce((s, j) => (j % 2 ? fSub : fAdd)(s, fMul(A[0][j], m(0, j))), fr(0));
}

/** Algebraik to'ldiruvchilar matritsasi (A_ij) */
export function cofactors3(A: FM): FM {
  return A.map((_, i) =>
    A.map((__, j) => {
      const r = A.filter((_, k) => k !== i).map((row) => row.filter((_, l) => l !== j));
      const m = fSub(fMul(r[0][0], r[1][1]), fMul(r[0][1], r[1][0]));
      return (i + j) % 2 ? fr(-m.n, m.d) : m;
    }),
  );
}

export const fmTex = (M: FM, bar?: number) => {
  const n = M[0].length;
  const spec = bar ? "c".repeat(bar) + "|" + "c".repeat(n - bar) : "c".repeat(n);
  return `\\left(\\begin{array}{${spec}} ${M.map((r) => r.map(fTex).join(" & ")).join(" \\\\ ")} \\end{array}\\right)`;
};
