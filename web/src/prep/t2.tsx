import type { ReactNode } from "react";
import { Tex } from "../components/Tex";
import { det2, pick, ri, rnz, tmat, tn, tp, type PrepTopic } from "./core";
import { inv2Anim, prodAnim } from "./anim";

const Y = "#ffd166"; // satr
const R = "#fc6255"; // ustun
const c = (col: string, x: number | string) => `\\color{${col}}{${typeof x === "number" ? tn(x) : x}}`;

const mul = (A: number[][], B: number[][]) => A.map((r) => B[0].map((_, j) => r.reduce((s, x, k) => s + x * B[k][j], 0)));
const rnd = (m: number, n: number, a = -3, b = 5) => Array.from({ length: m }, () => Array.from({ length: n }, () => ri(a, b)));

/** (AB)_ij ni ranglab yozish */
function cellTex(A: number[][], B: number[][], i: number, j: number) {
  const terms = A[i].map((x, k) => `${c(Y, tp(x))}\\cdot${c(R, tp(B[k][j]))}`);
  return `${terms.join(" + ")} = ${tn(A[i].reduce((s, x, k) => s + x * B[k][j], 0))}`;
}
const hlRow = (A: number[][], i: number) => `\\begin{pmatrix} ${A.map((r, a) => r.map((x) => (a === i ? c(Y, x) : tn(x))).join(" & ")).join(" \\\\ ")} \\end{pmatrix}`;
const hlCol = (B: number[][], j: number) => `\\begin{pmatrix} ${B.map((r) => r.map((x, b) => (b === j ? c(R, x) : tn(x))).join(" & ")).join(" \\\\ ")} \\end{pmatrix}`;

const EA = [[1, 2, 0], [3, -1, 4]];
const EB = [[2, 1], [0, 3], [-1, 2]];

const GR = "#6b7280";
const T = (A: number[][]) => A[0].map((_, j) => A.map((r) => r[j]));
const minorOf = (m: number[][], i: number, j: number) => m.filter((_, a) => a !== i).map((r) => r.filter((_, b) => b !== j));
const det3 = (m: number[][]) =>
  m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
const d2calc = (q: number[][]) => `${tp(q[0][0])}\\cdot${tp(q[1][1])} - ${tp(q[0][1])}\\cdot${tp(q[1][0])} = ${tn(det2(q))}`;
const grayed = (m: number[][], i: number, j: number) =>
  `\\begin{pmatrix} ${m.map((r, a) => r.map((x, b) => (a === i || b === j ? `\\color{${GR}}{${tn(x)}}` : tn(x))).join(" & ")).join(" \\\\ ")} \\end{pmatrix}`;
/** 1/d ni daftardagidek: −1/5 (1/−5 emas) */
const invFrac = (d: number) => (d === 1 ? "" : d === -1 ? "-" : d < 0 ? `-\\frac{1}{${tn(-d)}}` : `\\frac{1}{${tn(d)}}`);

/* ------------------------------------------------------------------ */
/* Tushuntirishli yechimlar                                            */
/* ------------------------------------------------------------------ */

export function sizeExplain(m: number, n: number, p: number, q: number): ReactNode[] {
  const ok = n === p;
  return [
    <>
      <b>Qoida:</b> <Tex>{"A\\cdot B"}</Tex> ko'paytmada A ning har bir <b>satri</b> B ning har bir <b>ustuniga</b> ko'paytiriladi. Buning
      uchun A ning satridagi sonlar soni (ya'ni A ning ustunlari soni) B ning ustunidagi sonlar soniga (B ning satrlari soniga) teng bo'lishi
      kerak — aks holda juftlab bo'lmaydi.
    </>,
    <>
      <b>Ichki sonlarni solishtiramiz:</b> <Tex>{`A_{${m}\\times\\color{#ffd166}{${n}}}\\cdot B_{\\color{#ffd166}{${p}}\\times${q}}`}</Tex> —{" "}
      {ok ? <>teng (<Tex>{`${n}=${p}`}</Tex>), ko'paytirish mumkin.</> : <>teng emas (<Tex>{`${n}\\neq${p}`}</Tex>), ko'paytirib <b>bo'lmaydi</b>.</>}
    </>,
    ...(ok
      ? [<>
          <b>Natija tartibi tashqi sonlardan:</b> A nechta satrga ega bo'lsa, natijada shuncha satr ({m}); B nechta ustunga ega bo'lsa,
          shuncha ustun ({q}). Javob: <b>{m}×{q}</b>.
        </>]
      : []),
  ];
}

export function linExplain(A: number[][], Bm: number[][], k: number, m: number): ReactNode[] {
  const kA = A.map((r) => r.map((x) => k * x)), mB = Bm.map((r) => r.map((x) => m * x));
  const R2 = kA.map((r, i) => r.map((x, j) => x + mB[i][j]));
  const elem = (X: number[][], s: number) => `\\begin{pmatrix} ${X.map((r) => r.map((x) => `${tn(s)}\\cdot${tp(x)}`).join(" & ")).join(" \\\\ ")} \\end{pmatrix}`;
  return [
    <>
      <b>Songa ko'paytirish:</b> <Tex>{`${tn(k)}A`}</Tex> da A ning <b>har bir</b> elementi <Tex>{tn(k)}</Tex> ga ko'paytiriladi:
      <Tex block>{`${tn(k)}A = ${elem(A, k)} = ${tmat(kA)}`}</Tex>
    </>,
    <>
      Xuddi shunday <Tex>{`${tn(m)}B`}</Tex>:
      <Tex block>{`${tn(m)}B = ${elem(Bm, m)} = ${tmat(mB)}`}</Tex>
    </>,
    <>
      <b>Qo'shish:</b> ikkala matritsa bir xil tartibli (2×2), shuning uchun <b>bir xil joyda turgan</b> sonlarni qo'shamiz:
      <Tex block>{`\\begin{pmatrix} ${kA.map((r, i) => r.map((x, j) => `${tn(x)} + ${tp(mB[i][j])}`).join(" & ")).join(" \\\\ ")} \\end{pmatrix} = ${tmat(R2)}`}</Tex>
    </>,
  ];
}

/** Bitta element: (AB)_ij */
function cellStep(A: number[][], Bm: number[][], i: number, j: number) {
  const prods = A[i].map((x, k) => x * Bm[k][j]);
  const s = prods.reduce((a, b) => a + b, 0);
  return (
    <>
      <b>Natijaning {i + 1}-satr, {j + 1}-ustundagi elementi:</b> A ning <span style={{ color: Y }}>{i + 1}-satrini</span> B ning{" "}
      <span style={{ color: R }}>{j + 1}-ustuniga</span> ko'paytiramiz — 1-son 1-son bilan, 2-son 2-son bilan va hokazo, keyin qo'shamiz:
      <Tex block>{`${hlRow(A, i)}${hlCol(Bm, j)}:\\quad ${cellTex(A, Bm, i, j)}`}</Tex>
      {A[i].length > 1 && <>Ya'ni <Tex>{`${prods.map(tp).join(" + ")} = ${tn(s)}`}</Tex>.</>}
    </>
  );
}

export function cellExplain(A: number[][], Bm: number[][], i: number, j: number): ReactNode[] {
  return [
    <>
      <b>Qaysi satr va qaysi ustun kerak?</b> Natijaning <Tex>{`(${i + 1},${j + 1})`}</Tex> elementi uchun A ning <b>{i + 1}-satri</b> va B ning{" "}
      <b>{j + 1}-ustuni</b> olinadi (satr raqami — birinchi matritsadan, ustun raqami — ikkinchisidan).
    </>,
    cellStep(A, Bm, i, j),
  ];
}

export function prodExplain(A: number[][], Bm: number[][]): ReactNode[] {
  const m = A.length, n = A[0].length, q = Bm[0].length;
  const P = mul(A, Bm);
  const steps: ReactNode[] = [
    <>
      <b>Avval ko'paytirish mumkinmi, tekshiramiz.</b> <Tex>{`A_{${m}\\times${n}}\\cdot B_{${Bm.length}\\times${q}}`}</Tex>: ichki sonlar{" "}
      <Tex>{`${n}=${Bm.length}`}</Tex> — mumkin. Natija tartibi tashqi sonlardan: <b>{m}×{q}</b>, ya'ni {m * q} ta element topamiz.
    </>,
  ];
  for (let i = 0; i < m; i++) for (let j = 0; j < q; j++) steps.push(cellStep(A, Bm, i, j));
  steps.push(
    <>
      <b>Topilgan sonlarni o'z joyiga yozamiz:</b> <Tex>{`A\\cdot B = ${tmat(P)}`}</Tex>.
      {m !== q || n !== Bm.length ? <> Diqqat: <Tex>{"B\\cdot A"}</Tex> butunlay boshqa (hatto boshqa tartibli) bo'lardi — matritsalarda <Tex>{"AB\\neq BA"}</Tex>.</> : <> Umuman <Tex>{"AB\\neq BA"}</Tex> — tartib muhim.</>}
    </>,
  );
  return steps;
}

export function trExplain(A: number[][], i: number, j: number): ReactNode[] {
  const At = T(A);
  return [
    <>
      <b>Transponirlash</b> — satrlarni ustun qilib yozish: A ning 1-satri <Tex>{"A^T"}</Tex> ning 1-ustuni bo'ladi, 2-satri — 2-ustuni.
      Shuning uchun indekslar o'rin almashadi: <Tex>{"(A^T)_{ij} = a_{ji}"}</Tex>.
    </>,
    <>
      <b>Butun <Tex>{"A^T"}</Tex> ni yozamiz</b> ({A.length}×{A[0].length} edi, {At.length}×{At[0].length} bo'ldi):
      <Tex block>{`A=${tmat(A)}\\quad\\longrightarrow\\quad A^T=${tmat(At)}`}</Tex>
    </>,
    <>
      <b>Kerakli element:</b> <Tex>{`(A^T)_{${i}${j}} = a_{${j}${i}}`}</Tex> — A ning {j}-satri, {i}-ustunidagi son: <Tex>{tn(A[j - 1][i - 1])}</Tex>.
    </>,
  ];
}

export function inv2Explain(A: number[][]): ReactNode[] {
  const [[a, b], [cc, d]] = A;
  const D = det2(A);
  const adj = [[d, -b], [-cc, a]];
  const inv = adj.map((r) => r.map((x) => x / D));
  const chk = [a * inv[0][0] + b * inv[1][0], a * inv[0][1] + b * inv[1][1]];
  return [
    <>
      <b>1-qadam: determinant.</b> Teskari matritsa faqat determinant 0 bo'lmaganda mavjud (formulada determinantga bo'linadi):
      <Tex block>{`\\det A = ${d2calc(A)}`}</Tex>
      <Tex>{`${tn(D)}\\neq0`}</Tex> — teskarisi bor.
    </>,
    <>
      <b>2-qadam: bosh diagonaldagi sonlarning o'rnini almashtiramiz</b> (<Tex>{tn(a)}</Tex> va <Tex>{tn(d)}</Tex>), <b>yon diagonaldagi sonlarning
      ishorasini o'zgartiramiz</b> (<Tex>{tn(b)}</Tex> va <Tex>{tn(cc)}</Tex>):
      <Tex block>{`${tmat(A)}\\quad\\longrightarrow\\quad ${tmat(adj)}`}</Tex>
    </>,
    <>
      <b>3-qadam: har bir sonni determinantga (<Tex>{tn(D)}</Tex> ga) bo'lamiz:</b>
      <Tex block>{`A^{-1} = ${invFrac(D)}${tmat(adj)}${D === 1 ? "" : ` = ${tmat(inv)}`}`}</Tex>
    </>,
    <>
      <b>Tekshiruv:</b> <Tex>{"A\\cdot A^{-1}"}</Tex> ning 1-satri <Tex>{"(1;\\ 0)"}</Tex> bo'lishi kerak:{" "}
      <Tex>{`${tp(a)}\\cdot${tp(inv[0][0])} + ${tp(b)}\\cdot${tp(inv[1][0])} = ${tn(chk[0])},\\quad ${tp(a)}\\cdot${tp(inv[0][1])} + ${tp(b)}\\cdot${tp(inv[1][1])} = ${tn(chk[1])}`}</Tex>{" "}
      {chk[0] === 1 && chk[1] === 0 ? "✓" : "✗"}
    </>,
  ];
}

/** 3×3 teskari matritsa: to'liq tushuntirish */
export function inv3Explain(A: number[][]): ReactNode[] {
  const D = det3(A);
  const C = A.map((_, i) => A.map((__, j) => ((i + j) % 2 ? -1 : 1) * det2(minorOf(A, i, j))));
  const adj = T(C);
  return [
    <>
      <b>Reja.</b> 3×3 uchun formula: <Tex>{"A^{-1}=\\frac{1}{\\det A}\\,(A_{ij})^T"}</Tex>. Ya'ni: (1) determinantni topamiz, (2) har bir element
      uchun algebraik to'ldiruvchini topamiz (9 ta), (3) ularni jadval qilib <b>transponirlaymiz</b>, (4) determinantga bo'lamiz.
    </>,
    <>
      <b>1-qadam: determinant</b> (1-satr bo'yicha Laplas):
      <Tex block>{`\\det A = ${tp(A[0][0])}\\cdot${tp(C[0][0])} + ${tp(A[0][1])}\\cdot${tp(C[0][1])} + ${tp(A[0][2])}\\cdot${tp(C[0][2])} = ${tn(D)}`}</Tex>
      (bu yerdagi <Tex>{"A_{11}, A_{12}, A_{13}"}</Tex> keyingi qadamda topiladi). <Tex>{`${tn(D)}\\neq0`}</Tex> — teskarisi bor.
    </>,
    <>
      <b>2-qadam: algebraik to'ldiruvchilar.</b> Har biri uchun: o'sha satr va ustunni o'chiramiz, qolgan 2×2 determinantni hisoblaymiz va
      shaxmat ishorasini qo'yamiz <Tex>{"\\begin{smallmatrix}+&-&+\\\\-&+&-\\\\+&-&+\\end{smallmatrix}"}</Tex>:
      <Tex block>{`\\begin{gathered} ${[0, 1, 2].map((i) => [0, 1, 2].map((j) => `A_{${i + 1}${j + 1}} = ${(i + j) % 2 ? "-" : "+"}(${d2calc(minorOf(A, i, j))}) = ${tn(C[i][j])}`).join(",\\quad ")).join(" \\\\ ")} \\end{gathered}`}</Tex>
    </>,
    <>
      <b>3-qadam: jadval tuzib, transponirlaymiz.</b> Algebraik to'ldiruvchilarni o'z joyiga yozamiz va satrlarni ustunga aylantiramiz.
      Nega transponirlash kerak: <Tex>{"A_{ij}"}</Tex> teskari matritsada <Tex>{"(j,\\,i)"}</Tex> o'ringa tushadi — shundagina{" "}
      <Tex>{"A\\cdot A^{-1}=E"}</Tex> bo'ladi.
      <Tex block>{`(A_{ij}) = ${tmat(C)}\\quad\\longrightarrow\\quad (A_{ij})^T = ${tmat(adj)}`}</Tex>
    </>,
    <>
      <b>4-qadam: determinantga bo'lamiz:</b>
      <Tex block>{`A^{-1} = ${invFrac(D)}${tmat(adj)}${Math.abs(D) === 1 ? (D === -1 ? ` = ${tmat(adj.map((r) => r.map((x) => -x)))}` : "") : ` = ${tmat(adj.map((r) => r.map((x) => x / D)))}`}`}</Tex>
    </>,
  ];
}

/** 3×3 teskari matritsaning bitta elementi */
export function inv3CellExplain(A: number[][], i: number, j: number): ReactNode[] {
  const D = det3(A);
  const C = A.map((_, a) => A.map((__, b) => ((a + b) % 2 ? -1 : 1) * det2(minorOf(A, a, b))));
  const s = (i + j) % 2 ? -1 : 1;
  const mm = minorOf(A, j, i);
  const v = C[j][i] / D;
  return [
    <>
      <b>Formula:</b> <Tex>{"A^{-1}=\\frac{1}{\\det A}\\,(A_{ij})^T"}</Tex>. Transponirlangani uchun <Tex>{`A^{-1}`}</Tex> ning{" "}
      <Tex>{`(${i + 1},${j + 1})`}</Tex> o'rnida <Tex>{`A_{${j + 1}${i + 1}}`}</Tex> turadi (indekslar almashgan!). Demak
      <Tex block>{`(A^{-1})_{${i + 1}${j + 1}} = \\frac{A_{${j + 1}${i + 1}}}{\\det A}`}</Tex>
    </>,
    <>
      <b>Determinant</b> (1-satr bo'yicha Laplas):{" "}
      <Tex>{`\\det A = ${tp(A[0][0])}\\cdot${tp(C[0][0])} + ${tp(A[0][1])}\\cdot${tp(C[0][1])} + ${tp(A[0][2])}\\cdot${tp(C[0][2])} = ${tn(D)}`}</Tex>
    </>,
    <>
      <b><Tex>{`A_{${j + 1}${i + 1}}`}</Tex>:</b> {j + 1}-satr va {i + 1}-ustunni o'chiramiz, ishora <Tex>{`(-1)^{${j + 1}+${i + 1}} = ${s}`}</Tex>:
      <Tex block>{`${grayed(A, j, i)}\\quad\\longrightarrow\\quad A_{${j + 1}${i + 1}} = ${s > 0 ? "" : "-"}(${d2calc(mm)}) = ${tn(C[j][i])}`}</Tex>
    </>,
    <><b>Bo'lamiz:</b> <Tex>{`(A^{-1})_{${i + 1}${j + 1}} = \\frac{${tn(C[j][i])}}{${tn(D)}} = ${tn(v)}`}</Tex>.</>,
  ];
}

const EINV3 = [[2, 1, 0], [1, 1, 1], [0, 1, 3]];

export const T2: PrepTopic = {
  n: 2,
  slug: "matritsa",
  title: "Matritsalar va amallar",
  short: "Jadval, tartib, turlar; qo'shish, songa ko'paytirish, satrni ustunga ko'paytirish, transponirlash, teskari matritsa",
  minute: (
    <>
      <p><b>Matritsa — sonlar jadvali.</b> Masalan, 2 ta do'kon × 3 ta mahsulot sotuvi — 2×3 matritsa. Birinchi son — <b>satrlar</b>, ikkinchisi — <b>ustunlar</b> soni (tartib "m×n").</p>
      <p>
        Qo'shish va songa ko'paytirish — <b>element-element</b>, xuddi Excel'dagi kabi. Faqat ko'paytirish boshqacha:{" "}
        <b>satrni ustunga</b> — birinchi matritsaning satrini ikkinchisining ustuniga "ustma-ust qo'yib" ko'paytirib qo'shamiz.
      </p>
      <p>Asosiy qoida — ko'paytirish qachon mumkin:</p>
      <Tex block>{"A_{\\,m\\times \\color{#ffd166}{n}}\\cdot B_{\\,\\color{#ffd166}{n}\\times k} = C_{\\,m\\times k}"}</Tex>
      <p className="muted">O'rtadagi (ichki) sonlar teng bo'lishi shart. Natija tartibi chetdagi (tashqi) sonlardan olinadi.</p>
    </>
  ),
  picture: (
    <div className="pic-row">
      <Tex block>{`${hlRow(EA, 0)} \\cdot ${hlCol(EB, 0)} \\;\\Rightarrow\\; (AB)_{11} = ${cellTex(EA, EB, 0, 0)}`}</Tex>
      <div className="muted small"><span style={{ color: Y }}>■</span> 1-satrni <span style={{ color: R }}>■</span> 1-ustunga ko'paytirsak, natijaning 1-satr, 1-ustundagi elementi chiqadi</div>
    </div>
  ),
  symbols: [
    { s: "A,\\ B,\\ C", read: "A matritsa", mean: "Matritsalar katta lotin harflari bilan belgilanadi." },
    { s: "\\begin{pmatrix} 1&2\\\\3&4 \\end{pmatrix}", read: "matritsa (qavsli jadval)", mean: "Matritsa — jadvalning o'zi, son emas. Tik chiziqli $\\begin{vmatrix}1&2\\\\3&4\\end{vmatrix}$ esa determinant (bitta son)." },
    { s: "m\\times n", read: "m ga n", mean: "Tartib: m ta satr, n ta ustun. $2\\times3$ — 2 satr, 3 ustun." },
    { s: "a_{ij}", read: "a i j", mean: "i-satr, j-ustundagi element." },
    { s: "E", read: "birlik matritsa", mean: "Diagonalda 1, qolgan joyda 0: $E=\\begin{pmatrix}1&0\\\\0&1\\end{pmatrix}$. Sonlardagi 1 ning o'rnini bosadi." },
    { s: "A^T", read: "A transponirlangan", mean: "Satrlari ustunga aylantirilgan matritsa. T — daraja emas, belgi." },
    { s: "A^{-1}", read: "A teskari", mean: "$A\\cdot A^{-1}=E$ bo'ladigan matritsa. $-1$ — daraja emas: $A^{-1}\\neq\\dfrac{1}{A}$ (matritsaga bo'lish yo'q)." },
    { s: "(AB)_{ij}", read: "AB ning i j elementi", mean: "Ko'paytma matritsaning i-satr, j-ustundagi soni." },
  ],
  uses: [
    { icon: "🛒", title: "Tushumni hisoblash", text: <>Do'konlar va mahsulotlar bo'yicha sotuv jadvalini (matritsa) narxlar ustuniga ko'paytirsak, har bir do'konning tushumi chiqadi. Bu aynan "satrni ustunga" ko'paytirish.</> },
    { icon: "📑", title: "Har qanday jadval", text: <>Excel varag'i, ball qaydnomasi, ombor hisoboti — bularning hammasi matritsa. Ularni qo'shish — oylik hisobotlarni jamlash.</> },
    { icon: "🏭", title: "Xarajatlar matritsasi", text: <>Leontyev modelida <Tex>{"a_{ij}"}</Tex> — j-tarmoq 1 birlik mahsulot uchun i-tarmoqdan qancha xom ashyo oladi.</> },
    { icon: "🖼️", title: "Rasm va AI", text: <>Rasm — piksellar matritsasi; neyron tarmoqlar asosan matritsalarni ko'paytirish bilan ishlaydi.</> },
  ],
  recipes: [
    {
      title: "Tartib va turlar",
      rule: <>Tartib — avval satrlar soni, keyin ustunlar soni. <b>Kvadrat</b> matritsa: satrlar soni ustunlar soniga teng. <b>Nol</b> matritsa: hamma element 0. <b>Birlik</b> matritsa <Tex>{"E"}</Tex>: kvadrat, bosh diagonalda 1, qolgan joyda 0. <b>Diagonal</b> matritsa: diagonaldan tashqari hamma element 0.</>,
      steps: [
        <><b>Tartibni aniqlash:</b> <Tex>{tmat([[1, 0, -5], [2, 7, 3]])}</Tex> — gorizontal qatorlarni (satrlarni) sanaymiz: 2 ta; vertikal qatorlarni (ustunlarni): 3 ta. Avval satrlar yoziladi, demak tartibi <b>2×3</b> (3×2 emas!).</>,
        <><b>Birlik matritsani tanish:</b> u kvadrat bo'lishi, <b>bosh diagonalida</b> (chap yuqoridan o'ng pastga) 1, qolgan joyda 0 bo'lishi kerak: <Tex>{"E_2=\\begin{pmatrix}1&0\\\\0&1\\end{pmatrix},\\ E_3=\\begin{pmatrix}1&0&0\\\\0&1&0\\\\0&0&1\\end{pmatrix}"}</Tex>. <Tex>{"\\begin{pmatrix}0&1\\\\1&0\\end{pmatrix}"}</Tex> — birlik EMAS: 1 lar yon diagonalda.</>,
        <><b>Nega "birlik"?</b> U sonlardagi 1 kabi ishlaydi: istalgan matritsani E ga ko'paytirsak, o'zgarmaydi — <Tex>{"A\\cdot E = E\\cdot A = A"}</Tex>.</>,
        <><b>Ko'paytma tartibi:</b> <Tex>{"A_{m\\times n}\\cdot B_{n\\times k}"}</Tex> — ichki sonlar teng bo'lsa ko'paytirish mumkin, natija <Tex>{"m\\times k"}</Tex>.</>,
      ],
      gens: ["size"],
    },
    {
      title: "Qo'shish, ayirish, songa ko'paytirish",
      rule: <>Faqat <b>bir xil tartibli</b> matritsalar qo'shiladi: bir xil joyda turgan elementlar qo'shiladi. Songa ko'paytirishda <b>har bir</b> element shu songa ko'paytiriladi.</>,
      formula: "\\begin{pmatrix}a&b\\\\c&d\\end{pmatrix}+\\begin{pmatrix}p&q\\\\r&s\\end{pmatrix}=\\begin{pmatrix}a+p&b+q\\\\c+r&d+s\\end{pmatrix},\\qquad k\\cdot\\begin{pmatrix}a&b\\\\c&d\\end{pmatrix}=\\begin{pmatrix}ka&kb\\\\kc&kd\\end{pmatrix}",
      steps: [<>Misol: <Tex>{"A=\\begin{pmatrix}1&2\\\\3&4\\end{pmatrix},\\ B=\\begin{pmatrix}0&-1\\\\5&2\\end{pmatrix}"}</Tex> bo'lsa, <Tex>{"2A - B"}</Tex> ni topamiz (<Tex>{"-B"}</Tex> — bu <Tex>{"(-1)\\cdot B"}</Tex>).</>, ...linExplain([[1, 2], [3, 4]], [[0, -1], [5, 2]], 2, -1)],
      gens: ["lin"],
    },
    {
      title: "Ko'paytirish: satrni ustunga",
      rule: <>Natijaning i-satr, j-ustundagi elementini topish uchun A ning <span style={{ color: Y }}>i-satrini</span> va B ning <span style={{ color: R }}>j-ustunini</span> olamiz, elementlarni juft-juft ko'paytirib, qo'shamiz. Shart: A ning ustunlari soni B ning satrlari soniga teng bo'lishi kerak.</>,
      formula: `\\begin{pmatrix} ${c(Y, "a_1")} & ${c(Y, "a_2")} & ${c(Y, "a_3")} \\end{pmatrix}\\cdot\\begin{pmatrix} ${c(R, "b_1")} \\\\ ${c(R, "b_2")} \\\\ ${c(R, "b_3")} \\end{pmatrix} = ${c(Y, "a_1")}${c(R, "b_1")} + ${c(Y, "a_2")}${c(R, "b_2")} + ${c(Y, "a_3")}${c(R, "b_3")}`,
      steps: [<>Misol: <Tex>{`A=${tmat(EA)},\\ B=${tmat(EB)}`}</Tex>. <Tex>{"A\\cdot B"}</Tex> ni topamiz.</>, ...prodExplain(EA, EB)],
      anim: prodAnim(EA, EB),
      gens: ["cell", "prod"],
    },
    {
      title: "Transponirlash",
      rule: <>Transponirlash: 1-satr 1-ustun bo'lib yoziladi, 2-satr 2-ustun bo'lib va hokazo. <Tex>{"m\\times n"}</Tex> tartibli matritsa <Tex>{"n\\times m"}</Tex> tartibli bo'ladi.</>,
      formula: "\\begin{pmatrix}a&b&c\\\\d&e&f\\end{pmatrix}^T=\\begin{pmatrix}a&d\\\\b&e\\\\c&f\\end{pmatrix}",
      steps: [<>Misol: <Tex>{`A=${tmat(EA)}`}</Tex>. <Tex>{"A^T"}</Tex> va uning <Tex>{"(3,2)"}</Tex> elementini topamiz.</>, ...trExplain(EA, 3, 2), <>Foydali xossa: <Tex>{"(AB)^T = B^TA^T"}</Tex> — tartib almashadi!</>],
      gens: ["tr"],
    },
    {
      title: "Teskari matritsa (2×2)",
      rule: <>Teskari matritsa faqat determinant noldan farqli bo'lsa mavjud. 2×2 uchun uch qadam: <b>bosh diagonaldagi sonlarning o'rnini almashtiring</b>, <b>yon diagonaldagi sonlarning ishorasini o'zgartiring</b>, <b>hammasini determinantga bo'ling</b>.</>,
      formula: "\\begin{pmatrix}a&b\\\\c&d\\end{pmatrix}^{-1}=\\frac{1}{ad-bc}\\begin{pmatrix}d&-b\\\\-c&a\\end{pmatrix}",
      steps: [<>Misol: <Tex>{"A=\\begin{pmatrix}3&1\\\\5&2\\end{pmatrix}"}</Tex> ning teskarisini topamiz.</>, ...inv2Explain([[3, 1], [5, 2]])],
      anim: inv2Anim([[3, 1], [5, 2]]),
      gens: ["inv"],
    },
    {
      title: "Teskari matritsa (3×3)",
      rule: <>Determinantni topamiz; har bir element uchun algebraik to'ldiruvchini hisoblaymiz; ularni jadval qilib <b>transponirlaymiz</b>; determinantga bo'lamiz.</>,
      formula: "A^{-1}=\\frac{1}{\\det A}\\begin{pmatrix}A_{11}&A_{21}&A_{31}\\\\A_{12}&A_{22}&A_{32}\\\\A_{13}&A_{23}&A_{33}\\end{pmatrix}",
      steps: [<>Misol: <Tex>{`A=${tmat(EINV3)}`}</Tex> ning teskarisini topamiz.</>, ...inv3Explain(EINV3)],
      gens: ["inv3"],
    },
  ],
  mistakes: [
    { wrong: <>2 satr, 3 ustunli matritsani "3×2" deyish</>, right: <>Avval <b>satrlar</b>, keyin ustunlar: <b>2×3</b>.</> },
    { wrong: <>Matritsalarni element-element ko'paytirish</>, right: <>Ko'paytirish — <b>satrni ustunga</b>; element-element faqat qo'shishda.</> },
    { wrong: <><Tex>{"AB = BA"}</Tex></>, right: <>Umuman <Tex>{"AB\\neq BA"}</Tex>; ba'zan BA umuman mavjud bo'lmaydi.</> },
    { wrong: <><Tex>{"A_{2\\times3}\\cdot B_{2\\times3}"}</Tex> mumkin</>, right: <>Ichki sonlar teng emas (<Tex>{"3\\neq2"}</Tex>), ko'paytirib bo'lmaydi. Shart: A ning <b>ustunlari</b> soni B ning <b>satrlari</b> soniga teng.</> },
    { wrong: <>Teskari 2×2 da hamma ishorani o'zgartirish</>, right: <>Faqat <b>yon diagonal</b> ishorasi o'zgaradi; bosh diagonal elementlari <b>o'rin almashadi</b>.</> },
    { wrong: <><Tex>{"(AB)^T = A^TB^T"}</Tex></>, right: <><Tex>{"(AB)^T = B^TA^T"}</Tex>, <Tex>{"(AB)^{-1}=B^{-1}A^{-1}"}</Tex></> },
  ],
  gens: [
    {
      id: "size",
      title: "Ko'paytma tartibi",
      make: () => {
        const m = ri(1, 4), n = ri(1, 4), q = ri(1, 4);
        const ok = Math.random() < 0.75;
        const p = ok ? n : pick([1, 2, 3, 4].filter((x) => x !== n));
        const opts = [`${m}×${q}`, `${n}×${p}`, `${q}×${m}`, "Ko'paytirib bo'lmaydi", `${m}×${p}`];
        const uniq = [...new Set(opts)];
        const correct = ok ? uniq.indexOf(`${m}×${q}`) : uniq.indexOf("Ko'paytirib bo'lmaydi");
        return {
          q: <><Tex>{`A_{${m}\\times${n}}\\cdot B_{${p}\\times${q}}`}</Tex> ko'paytmaning tartibi qanday?</>,
          choice: { options: uniq, correct },
          steps: sizeExplain(m, n, p, q),
        };
      },
    },
    {
      id: "cell",
      title: "AB ning elementi",
      make: () => {
        const n = pick([2, 3]);
        const A = rnd(2, n), Bm = rnd(n, 2);
        const i = ri(0, 1), j = ri(0, 1);
        const v = mul(A, Bm)[i][j];
        const wrong = A[i].reduce((s, x, k) => s + x * Bm[k][1 - j], 0);
        return {
          q: <><Tex>{`A=${tmat(A)},\\ B=${tmat(Bm)}`}</Tex>. <Tex>{`A\\cdot B`}</Tex> ko'paytmaning <Tex>{`(${i + 1},${j + 1})`}</Tex> elementini toping.</>,
          ans: [{ v }],
          traps: wrong !== v ? [{ v: [wrong], why: "Boshqa ustunni oldingiz: j-element uchun B ning j-ustuni kerak." }] : [],
          steps: cellExplain(A, Bm, i, j),
          anim: (() => { const f = prodAnim(A, Bm); const k = 1 + 2 * (i * 2 + j); return [f[0], f[k], f[k + 1]]; })(),
        };
      },
    },
    {
      id: "prod",
      title: "AB (2×2) to'liq",
      make: () => {
        const A = rnd(2, 2, -3, 4), Bm = rnd(2, 2, -3, 4);
        const P = mul(A, Bm);
        const el = A.map((r, i) => r.map((x, j) => x * Bm[i][j]));
        return {
          q: <><Tex>{`${tmat(A)}\\cdot${tmat(Bm)}`}</Tex> ni hisoblang.</>,
          ans: [[0, 0], [0, 1], [1, 0], [1, 1]].map(([i, j]) => ({ label: <Tex>{`c_{${i + 1}${j + 1}}`}</Tex>, v: P[i][j] })),
          traps: [{ v: el.flat(), why: "Element-element ko'paytirdingiz. Matritsalar 'satrni ustunga' ko'paytiriladi." }],
          steps: prodExplain(A, Bm),
          anim: prodAnim(A, Bm),
        };
      },
    },
    {
      id: "lin",
      title: "kA + mB",
      make: () => {
        const A = rnd(2, 2, -4, 5), Bm = rnd(2, 2, -4, 5);
        const k = rnz(-3, 3), m = rnz(-3, 3);
        const R2 = A.map((r, i) => r.map((x, j) => k * x + m * Bm[i][j]));
        return {
          q: <><Tex>{`A=${tmat(A)},\\ B=${tmat(Bm)}`}</Tex>. <Tex>{`${k === 1 ? "" : k === -1 ? "-" : tn(k)}A ${m < 0 ? "-" : "+"} ${Math.abs(m) === 1 ? "" : tn(Math.abs(m))}B`}</Tex> ni toping.</>,
          ans: [[0, 0], [0, 1], [1, 0], [1, 1]].map(([i, j]) => ({ label: <Tex>{`(${i + 1},${j + 1})`}</Tex>, v: R2[i][j] })),
          steps: linExplain(A, Bm, k, m),
        };
      },
    },
    {
      id: "tr",
      title: "Transponirlash",
      make: () => {
        const A = rnd(2, 3, -6, 9);
        const i = ri(1, 3), j = ri(1, 2);
        const v = A[j - 1][i - 1];
        return {
          q: <><Tex>{`A=${tmat(A)}`}</Tex>. <Tex>{`A^T`}</Tex> ning <Tex>{`(${i},${j})`}</Tex> elementi nechaga teng?</>,
          ans: [{ v }],
          traps: i <= 2 && A[i - 1]?.[j - 1] !== v ? [{ v: [A[i - 1][j - 1]], why: "Bu A ning o'zidagi element. $A^T$ ning i-satr, j-ustundagi elementi A ning j-satr, i-ustundagi elementiga teng: $(A^T)_{ij}=a_{ji}$." }] : [],
          steps: trExplain(A, i, j),
        };
      },
    },
    {
      id: "inv",
      title: "Teskari 2×2",
      make: () => {
        let A = [[0, 0], [0, 0]];
        let d = 0;
        while (![1, -1, 2, -2].includes(d)) {
          A = [[rnz(-4, 5), ri(-4, 5)], [ri(-4, 5), rnz(-4, 5)]];
          d = det2(A);
        }
        const [[a, b], [cc, dd]] = A;
        const inv = [[dd / d, -b / d], [-cc / d, a / d]];
        return {
          q: <><Tex>{`${tmat(A)}^{-1}`}</Tex> ni toping.</>,
          ans: [[0, 0], [0, 1], [1, 0], [1, 1]].map(([i, j]) => ({ label: <Tex>{`(${i + 1},${j + 1})`}</Tex>, v: inv[i][j] })),
          traps: [{ v: [dd, -b, -cc, a], why: "Determinantga bo'lishni unutdingiz." }, { v: [a / d, -b / d, -cc / d, dd / d], why: "Bosh diagonal elementlarini o'rin almashtirish kerak edi." }],
          steps: inv2Explain(A),
          anim: inv2Anim(A),
        };
      },
    },
    {
      id: "inv3",
      title: "Teskari 3×3 (element)",
      make: () => {
        let A = [[0]];
        let D = 0;
        while (![1, -1, 2, -2].includes(D)) {
          A = [0, 1, 2].map(() => [0, 1, 2].map(() => ri(-2, 3)));
          D = det3(A);
        }
        const i = ri(0, 2), j = ri(0, 2);
        const C = (a: number, b: number) => ((a + b) % 2 ? -1 : 1) * det2(minorOf(A, a, b));
        const v = C(j, i) / D;
        const wrong = C(i, j) / D;
        return {
          q: <><Tex>{`A=${tmat(A)}`}</Tex>. <Tex>{"A^{-1}"}</Tex> ning <Tex>{`(${i + 1},${j + 1})`}</Tex> elementini toping.</>,
          ans: [{ v }],
          traps: wrong !== v ? [{ v: [wrong], why: `Transponirlashni unutdingiz: $(A^{-1})_{${i + 1}${j + 1}}$ uchun $A_{${j + 1}${i + 1}}$ olinadi, $A_{${i + 1}${j + 1}}$ emas.` }] : [],
          steps: inv3CellExplain(A, i, j),
        };
      },
    },
  ],
  tests: [
    { id: "t2:test:1", q: "Matritsa deb nimaga aytiladi?", options: ["Sonlar yig'indisiga", "Sonlar ko'paytmasiga", "To'g'ri to'rtburchak shaklidagi sonlar jadvaliga", "Sonlar to'plamiga", "Bitta songa"], correct: 2, explain: "Matritsa — m ta satr va n ta ustundan iborat sonlar jadvali." },
    { id: "t2:test:2", q: <><Tex>{tmat([[1, 0, -5], [2, 7, 3]])}</Tex> matritsaning tartibi:</>, options: ["2×2", "2×3", "3×2", "3×3", "6"], correct: 1, explain: "2 ta satr, 3 ta ustun — demak tartibi 2×3." },
    { id: "t2:test:3", q: "Qachon matritsa nol matritsa deyiladi?", options: ["Elementlari yig'indisi 0 bo'lsa", "Barcha elementlari 0 bo'lsa", "Elementlari ko'paytmasi 0 bo'lsa", "Biror satri 0 bo'lsa", "Determinanti 0 bo'lsa"], correct: 1, explain: "Nol matritsa — HAMMA elementi 0." },
    { id: "t2:test:4", q: "Kvadrat matritsa qachon birlik matritsa deyiladi?", options: ["Hamma elementi 1 bo'lsa", <>Bosh diagonalda 1, qolganlari 0 (<Tex>{"a_{ii}=1,\\ a_{ij}=0,\\ i\\neq j"}</Tex>)</>, "Faqat diagonal elementlari 1 bo'lsa (qolgani ixtiyoriy)", "Biror satri 1 lardan iborat bo'lsa", "Determinanti 1 bo'lsa"], correct: 1, explain: "Birlik matritsa $E$: diagonalda 1, boshqa joyda 0." },
    { id: "t2:test:5", q: "Birlik matritsani ko'rsating:", options: [<Tex>{"\\begin{pmatrix}1&0\\\\0&0\\end{pmatrix}"}</Tex>, <Tex>{"\\begin{pmatrix}1&1\\\\1&1\\end{pmatrix}"}</Tex>, <Tex>{"\\begin{pmatrix}1&0\\\\0&1\\end{pmatrix}"}</Tex>, <Tex>{"\\begin{pmatrix}0&1\\\\1&0\\end{pmatrix}"}</Tex>, <Tex>{"\\begin{pmatrix}1&0&0\\\\0&1&0\\end{pmatrix}"}</Tex>], correct: 2, explain: "Kvadrat, diagonalda 1, qolgani 0. Oxirgisi kvadrat emas — birlik bo'la olmaydi." },
    { id: "t2:test:6", q: <>Qaysi shartda <Tex>{"A_{m\\times n}"}</Tex> va <Tex>{"B_{p\\times q}"}</Tex> ni <Tex>{"A\\cdot B"}</Tex> ko'paytirish mumkin?</>, options: ["$m=p$", "$m=q$", "$n=p$", "$n=q$", "$mq=np$"], correct: 2, explain: "A ning ustunlari soni ($n$) B ning satrlari soniga ($p$) teng bo'lishi kerak." },
    { id: "t2:test:7", q: <><Tex>{"A_{2\\times3}"}</Tex> va <Tex>{"B_{2\\times2}"}</Tex> ustida qaysi amalni bajarish mumkin?</>, options: ["$A-B$", "$A\\cdot B$", "$B\\cdot A$", "$A+B$", "Hech biri"], correct: 2, explain: "$B_{2\\times2}\\cdot A_{2\\times3}$: ichki sonlar $2=2$, natija $2\\times3$. Qo'shish va ayirish uchun tartiblar bir xil bo'lishi kerak edi." },
    { id: "t2:test:8", q: <>Teskari matritsa <Tex>{"A^{-1}"}</Tex> qachon mavjud?</>, options: [<Tex>{"\\det A = 0"}</Tex>, <Tex>{"\\det A \\ne 0"}</Tex>, "A kvadrat bo'lmasa", "A nol matritsa bo'lsa", "Har doim"], correct: 1, explain: "A kvadrat va $\\det A\\neq0$ bo'lsa (bunday matritsa maxsusmas deyiladi)." },
    { id: "t2:test:9", q: <><Tex>{"(AB)^T"}</Tex> nimaga teng?</>, options: [<Tex>{"A^TB^T"}</Tex>, <Tex>{"B^TA^T"}</Tex>, <Tex>{"AB"}</Tex>, <Tex>{"BA"}</Tex>, <Tex>{"A^{-1}B^{-1}"}</Tex>], correct: 1, explain: "Transponirlashda ko'paytuvchilar tartibi teskariga almashadi." },
    { id: "t2:test:10", q: <><Tex>{"\\begin{pmatrix}1&2\\\\0&1\\end{pmatrix}\\cdot\\begin{pmatrix}3\\\\4\\end{pmatrix}"}</Tex> = ?</>, options: [<Tex>{"\\begin{pmatrix}11\\\\4\\end{pmatrix}"}</Tex>, <Tex>{"\\begin{pmatrix}3\\\\8\\end{pmatrix}"}</Tex>, <Tex>{"\\begin{pmatrix}5\\\\4\\end{pmatrix}"}</Tex>, <Tex>{"\\begin{pmatrix}7\\\\4\\end{pmatrix}"}</Tex>, "Ko'paytirib bo'lmaydi"], correct: 0, explain: "1-satr ustunga: $1\\cdot3+2\\cdot4=11$; 2-satr ustunga: $0\\cdot3+1\\cdot4=4$." },
  ],
  cheat: [
    { t: "Tartib", f: <>m×n — m satr, n ustun</> },
    { t: "Ko'paytirish sharti", f: <Tex>{"A_{m\\times n}B_{n\\times k}=C_{m\\times k}"}</Tex> },
    { t: "Element", f: <Tex>{"c_{ij}=a_{i1}b_{1j}+a_{i2}b_{2j}+\\dots"}</Tex> },
    { t: "Teskari 2×2", f: <Tex>{"\\begin{pmatrix}a&b\\\\c&d\\end{pmatrix}^{-1}=\\frac{1}{ad-bc}\\begin{pmatrix}d&-b\\\\-c&a\\end{pmatrix}"}</Tex> },
    { t: "Teskari n×n", f: <Tex>{"A^{-1}=\\frac{1}{|A|}(A_{ij})^T"}</Tex> },
    { t: "Xossalar", f: <><Tex>{"AB\\ne BA,\\ AE=EA=A,\\ (AB)^T=B^TA^T,\\ AA^{-1}=E"}</Tex></> },
  ],
  lessons: ["matritsa", "kopaytma", "teskari"],
};
