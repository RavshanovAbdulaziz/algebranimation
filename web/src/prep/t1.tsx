import type { ReactNode } from "react";
import { Tex } from "../components/Tex";
import { det2, det3, pick, ri, rnz, tmat, tn, tp, type PrepTopic } from "./core";
import { cofactorAnim, det2Anim, laplaceAnim, sarrusAnim, triAnim } from "./anim";

const B = "#58c4dd"; // "+" diagonal
const O = "#ff9f43"; // "−" diagonal
const c = (col: string, x: number | string) => `\\color{${col}}{${typeof x === "number" ? tn(x) : x}}`;

const GR = "#6b7280"; // o'chirilgan (kulrang)

/** 3×3 Sarrus hadlari */
const P_IDX = [[[0, 0], [1, 1], [2, 2]], [[0, 1], [1, 2], [2, 0]], [[0, 2], [1, 0], [2, 1]]];
const M_IDX = [[[0, 2], [1, 1], [2, 0]], [[0, 0], [1, 2], [2, 1]], [[0, 1], [1, 0], [2, 2]]];
const prodOf = (m: number[][], t: number[][]) => t.reduce((s, [i, j]) => s * m[i][j], 1);
const texOf = (m: number[][], t: number[][]) => t.map(([i, j]) => tp(m[i][j])).join("\\cdot ");
const sarrusSums = (m: number[][]) => ({
  sp: P_IDX.reduce((s, t) => s + prodOf(m, t), 0),
  sm: M_IDX.reduce((s, t) => s + prodOf(m, t), 0),
});

const minor = (m: number[][], i: number, j: number) => m.filter((_, a) => a !== i).map((r) => r.filter((_, b) => b !== j));
/** i-satr va j-ustuni kulrang (o'chirilgan) determinant */
const grayed = (m: number[][], i: number, j: number) =>
  `\\begin{vmatrix} ${m.map((r, a) => r.map((x, b) => (a === i || b === j ? `\\color{${GR}}{${tn(x)}}` : tn(x))).join(" & ")).join(" \\\\ ")} \\end{vmatrix}`;
/** shaxmat ishoralari, (i,j) katak ramkada */
const chess = (n: number, i: number, j: number) =>
  `\\begin{matrix} ${Array.from({ length: n }, (_, a) => Array.from({ length: n }, (_, b) => {
    const s = (a + b) % 2 ? "-" : "+";
    return a === i && b === j ? `\\boxed{${s}}` : s;
  }).join(" & ")).join(" \\\\ ")} \\end{matrix}`;
/** 2×2 determinant hisobini yozish: a·d − b·c = … */
const d2calc = (q: number[][]) => `${tp(q[0][0])}\\cdot${tp(q[1][1])} - ${tp(q[0][1])}\\cdot${tp(q[1][0])} = ${tn(det2(q))}`;

/* ------------------------------------------------------------------ */
/* Tushuntirishli yechimlar: maqsad → sabab → hisob → natija           */
/* ------------------------------------------------------------------ */

export function det2Explain(m: number[][]): ReactNode[] {
  const [[a, b], [cc, d]] = m;
  const p1 = a * d, p2 = b * cc, r = p1 - p2;
  return [
    <>
      2-tartibli determinantda ikkita diagonal bor: <span style={{ color: B }}>bosh diagonal</span> (chap yuqoridan o'ng pastga) va{" "}
      <span style={{ color: O }}>yon diagonal</span> (o'ng yuqoridan chap pastga). <b>Qoida:</b> bosh diagonal ko'paytmasidan yon
      diagonal ko'paytmasini ayiramiz.
      <Tex block>{`\\begin{vmatrix} ${c(B, a)} & ${c(O, b)} \\\\ ${c(O, cc)} & ${c(B, d)} \\end{vmatrix}`}</Tex>
    </>,
    <><b>Bosh diagonal</b> sonlarini ko'paytiramiz: <Tex>{`${c(B, tp(a))}\\cdot${c(B, tp(d))} = ${tn(p1)}`}</Tex></>,
    <>
      <b>Yon diagonal</b> sonlarini ko'paytiramiz: <Tex>{`${c(O, tp(b))}\\cdot${c(O, tp(cc))} = ${tn(p2)}`}</Tex>
      {(b < 0 || cc < 0) && <>. Manfiy sonlarni qavsga olib yozamiz — ishorada adashmaslik uchun.</>}
    </>,
    <>
      <b>Birinchisidan ikkinchisini ayiramiz:</b> <Tex>{`${tn(p1)} - ${tp(p2)} = ${tn(r)}`}</Tex>
      {p2 < 0 && <> (manfiy sonni ayirish — qo'shish: <Tex>{`${tn(p1)} + ${tn(-p2)}`}</Tex>)</>}. Javob: <Tex>{`\\Delta = ${tn(r)}`}</Tex>.
    </>,
  ];
}

export function sarrusExplain(m: number[][]): ReactNode[] {
  const { sp, sm } = sarrusSums(m);
  const ext = `\\left|\\begin{matrix} ${m.map((r) => r.map(tn).join(" & ")).join(" \\\\ ")} \\end{matrix}\\right|\\begin{matrix} ${m.map((r) => `\\color{${GR}}{${tn(r[0])}} & \\color{${GR}}{${tn(r[1])}}`).join(" \\\\ ")} \\end{matrix}`;
  const line = (T: number[][][], col: string) => T.map((t) => `${c(col, texOf(m, t))} = ${tn(prodOf(m, t))}`).join("\\qquad ");
  return [
    <>
      3-tartibli determinantni <b>Sarrus (uchburchak) qoidasi</b> bilan hisoblaymiz. Bizga <b>6 ta ko'paytma</b> kerak, har biri uchta
      sondan (har satrdan bittadan). Ularni topish oson bo'lishi uchun 1- va 2-ustunni jadvalning o'ng tomoniga qayta yozamiz (kulrang):
      <Tex block>{ext}</Tex>
      Endi har bir kerakli uchlik bitta to'g'ri chiziq bo'ylab turadi.
    </>,
    <>
      <b>"+" ishorali 3 ta ko'paytma</b> — chapdan o'ngga pastga tushuvchi chiziqlar (bosh diagonal va unga parallel ikkitasi):
      <Tex block>{line(P_IDX, B)}</Tex>
      Ularning yig'indisi: <Tex>{`${P_IDX.map((t) => tp(prodOf(m, t))).join(" + ")} = ${tn(sp)}`}</Tex>
    </>,
    <>
      <b>"−" ishorali 3 ta ko'paytma</b> — o'ngdan chapga pastga tushuvchi chiziqlar (yon diagonal va unga parallel ikkitasi):
      <Tex block>{line(M_IDX, O)}</Tex>
      Ularning yig'indisi: <Tex>{`${M_IDX.map((t) => tp(prodOf(m, t))).join(" + ")} = ${tn(sm)}`}</Tex>
    </>,
    <>
      <b>"+" lar yig'indisidan "−" lar yig'indisini ayiramiz:</b> <Tex>{`${tn(sp)} - ${tp(sm)} = ${tn(sp - sm)}`}</Tex>. Javob:{" "}
      <Tex>{`\\Delta = ${tn(sp - sm)}`}</Tex>.
    </>,
  ];
}

export function minorExplain(m: number[][], i: number, j: number): ReactNode[] {
  const mm = minor(m, i, j), M = det2(mm), s = (i + j) % 2 ? -1 : 1;
  const I = i + 1, J = j + 1;
  return [
    <>
      <b>Minor</b> <Tex>{`M_{${I}${J}}`}</Tex> ni topish uchun {I}-satr va {J}-ustunni o'chiramiz (kulrang). Qolgan 4 ta son kichik 2×2
      determinantni hosil qiladi:
      <Tex block>{`${grayed(m, i, j)}\\quad\\longrightarrow\\quad M_{${I}${J}} = ${tmat(mm, "v")}`}</Tex>
    </>,
    <>Bu 2×2 determinantni hisoblaymiz (bosh diagonal minus yon diagonal): <Tex>{`M_{${I}${J}} = ${d2calc(mm)}`}</Tex></>,
    <>
      <b>Ishora.</b> Indekslar yig'indisi <Tex>{`${I}+${J}=${I + J}`}</Tex> — {s > 0 ? "juft, shuning uchun ishora o'zgarmaydi (+)" : "toq, shuning uchun ishora o'zgaradi (−)"}.
      Shaxmat jadvalida ham {I}-satr, {J}-o'rinda "{s > 0 ? "+" : "−"}" turibdi: <Tex>{chess(m.length, i, j)}</Tex>
    </>,
    <>
      <b>Algebraik to'ldiruvchi:</b> <Tex>{`A_{${I}${J}} = (-1)^{${I}+${J}}\\cdot M_{${I}${J}} = ${s > 0 ? "" : "-"}${tp(M)} = ${tn(s * M)}`}</Tex>.
    </>,
  ];
}

export function laplaceExplain(m: number[][]): ReactNode[] {
  // eng ko'p nol bor satr yoki ustunni tanlaymiz
  const cand: { kind: "satr" | "ustun"; k: number; z: number }[] = [];
  for (let k = 0; k < 3; k++) {
    cand.push({ kind: "satr", k, z: m[k].filter((x) => x === 0).length });
    cand.push({ kind: "ustun", k, z: m.filter((r) => r[k] === 0).length });
  }
  const best = cand.reduce((a, b) => (b.z > a.z ? b : a));
  const pos = [0, 1, 2].map((t) => (best.kind === "satr" ? [best.k, t] : [t, best.k]));
  const hl = `\\begin{vmatrix} ${m.map((r, a) => r.map((x, b) => (pos.some(([p, q]) => p === a && q === b) ? c(B, x) : tn(x))).join(" & ")).join(" \\\\ ")} \\end{vmatrix}`;
  const parts = pos.map(([a, b]) => {
    const s = (a + b) % 2 ? -1 : 1;
    const mm = minor(m, a, b);
    return { a, b, e: m[a][b], s, mm, A: s * det2(mm) };
  });
  const total = parts.reduce((t, p) => t + p.e * p.A, 0);
  const steps: ReactNode[] = [
    <>
      <b>Qaysi satr yoki ustun bo'yicha yoyamiz?</b> Eng ko'p nol borini tanlaymiz — bu {best.k + 1}-{best.kind} ({best.z} ta nol).
      Nolga ko'paytirilgan had nolga teng, uni hisoblash shart emas — ish kamayadi.
      <Tex block>{hl}</Tex>
    </>,
    <>
      <b>Laplas formulasi:</b> {best.kind === "satr" ? "satrning" : "ustunning"} har bir elementini o'z algebraik to'ldiruvchisiga
      ko'paytirib qo'shamiz:
      <Tex block>{`\\Delta = ${parts.map((p) => `${tp(p.e)}\\cdot A_{${p.a + 1}${p.b + 1}}`).join(" + ")}`}</Tex>
      {best.z > 0 && <>Nol turgan hadlar tushib qoladi.</>}
    </>,
  ];
  for (const p of parts) {
    if (p.e === 0) continue;
    steps.push(
      <>
        <Tex>{`A_{${p.a + 1}${p.b + 1}}`}</Tex> ni topamiz: {p.a + 1}-satr va {p.b + 1}-ustunni o'chiramiz, ishora{" "}
        <Tex>{`(-1)^{${p.a + 1}+${p.b + 1}} = ${p.s}`}</Tex>:
        <Tex block>{`A_{${p.a + 1}${p.b + 1}} = ${p.s > 0 ? "" : "-"}${tmat(p.mm, "v")} = ${p.s > 0 ? "" : "-"}(${d2calc(p.mm)}) = ${tn(p.A)}`}</Tex>
      </>,
    );
  }
  steps.push(
    <>
      <b>Hammasini qo'shamiz:</b>{" "}
      <Tex>{`\\Delta = ${parts.filter((p) => p.e !== 0).map((p) => `${tp(p.e)}\\cdot${tp(p.A)}`).join(" + ")} = ${tn(total)}`}</Tex>.
    </>,
  );
  return steps;
}

export function triExplain(m: number[][]): ReactNode[] {
  const d = m.map((r, i) => r[i]);
  const up = m.some((r, i) => r.some((x, j) => j > i && x !== 0));
  const v = d.reduce((a, b) => a * b, 1);
  return [
    <>
      <b>Jadvalga qaraymiz:</b> diagonalning {up ? "pastidagi" : "ustidagi"} barcha sonlar 0. Bunday jadval <b>uchburchak</b> ko'rinishda
      deyiladi.
    </>,
    <>
      <b>Nega bu qulay?</b> Laplas yoyilmasini {up ? "1-ustun" : "1-satr"} bo'yicha qo'llasak, unda faqat bitta noldan farqli son —{" "}
      <Tex>{tn(d[0])}</Tex> qoladi. Qolgan kichik determinant ham uchburchak bo'ladi, va hokazo. Natijada determinant shunchaki{" "}
      <b>diagonal elementlar ko'paytmasiga</b> teng bo'ladi.
    </>,
    <><b>Diagonal sonlarni ko'paytiramiz:</b> <Tex>{`\\Delta = ${d.map(tp).join("\\cdot")} = ${tn(v)}`}</Tex>.</>,
  ];
}

export function eqLinExplain(a: number, b: number, cc: number, r: number): ReactNode[] {
  const bc = b * cc, rhs = r + bc, x = rhs / a;
  return [
    <>
      <b>Determinantni odatdagidek ochamiz</b> — x ham oddiy son kabi qatnashadi: bosh diagonal <Tex>{`${tp(a)}\\cdot x`}</Tex>, yon
      diagonal <Tex>{`${tp(b)}\\cdot${tp(cc)} = ${tn(bc)}`}</Tex>:
      <Tex block>{`${tn(a)}x - ${tp(bc)} = ${tn(r)}`}</Tex>
    </>,
    <>
      <b>Ma'lum sonni o'ng tomonga o'tkazamiz</b> (o'tganda ishorasi o'zgaradi): <Tex>{`${a === 1 ? "" : a === -1 ? "-" : tn(a)}x = ${tn(r)} ${bc < 0 ? "-" : "+"} ${tn(Math.abs(bc))} = ${tn(rhs)}`}</Tex>
    </>,
    ...(a === 1 ? [] : [<><b>Ikki tomonni <Tex>{tn(a)}</Tex> ga bo'lamiz:</b> <Tex>{`x = \\frac{${tn(rhs)}}{${tn(a)}} = ${tn(x)}`}</Tex></>]),
    <>
      <b>Tekshiruv:</b> <Tex>{`x=${tn(x)}`}</Tex> ni qo'yamiz: <Tex>{`${tp(a)}\\cdot${tp(x)} - ${tp(bc)} = ${tn(a * x - bc)}`}</Tex>{" "}
      {a * x - bc === r ? "✓" : "✗"}
    </>,
  ];
}

/** |x  a; b  x+c| = 0  →  x² + c·x − a·b = 0 */
export function eqQuadExplain(a: number, b: number, cc: number): ReactNode[] {
  const ab = a * b, D = cc * cc + 4 * ab, sq = Math.sqrt(D);
  const x1 = (-cc + sq) / 2, x2 = (-cc - sq) / 2;
  const xc = cc === 0 ? "x" : `x ${cc < 0 ? "-" : "+"} ${Math.abs(cc)}`;
  const lin = cc === 0 ? "" : ` ${cc < 0 ? "-" : "+"} ${Math.abs(cc) === 1 ? "" : Math.abs(cc)}x`;
  const free = ab === 0 ? "" : ` ${-ab < 0 ? "-" : "+"} ${Math.abs(ab)}`;
  return [
    <>
      <b>Determinantni ochamiz:</b> bosh diagonal <Tex>{`x\\cdot(${xc})`}</Tex>, yon diagonal <Tex>{`${tp(a)}\\cdot${tp(b)} = ${tn(ab)}`}</Tex>:
      <Tex block>{`x\\cdot(${xc}) - ${tp(ab)} = 0`}</Tex>
    </>,
    <><b>Qavsni ochamiz</b> — kvadrat tenglama hosil bo'ladi: <Tex>{`x^2${lin}${free} = 0`}</Tex></>,
    <>
      <b>Diskriminant:</b> <Tex>{`x^2+px+q=0`}</Tex> uchun <Tex>{`D=p^2-4q`}</Tex>. Bizda <Tex>{`p=${tn(cc)},\\ q=${tn(-ab)}`}</Tex>:{" "}
      <Tex>{`D = ${tp(cc)}^2 - 4\\cdot${tp(-ab)} = ${tn(D)},\\quad \\sqrt{D} = ${tn(sq)}`}</Tex>
    </>,
    <>
      <b>Ildizlar:</b> <Tex>{`x_{1,2} = \\frac{-p\\pm\\sqrt D}{2} = \\frac{${tn(-cc)}\\pm${tn(sq)}}{2}`}</Tex>, demak{" "}
      <Tex>{`x_1 = ${tn(x1)},\\ \\ x_2 = ${tn(x2)}`}</Tex>. Viyet bilan tekshiruv: <Tex>{`x_1+x_2=${tn(x1 + x2)}=-p,\\ \\ x_1x_2=${tn(x1 * x2)}=q`}</Tex> ✓
    </>,
  ];
}

const EX3 = [[2, 1, 3], [0, -1, 4], [1, 2, 1]];
const EXL = [[2, 1, 3], [0, -1, 4], [0, 2, 1]];
const xcTex = (cc: number) => (cc === 0 ? "x" : `x ${cc < 0 ? "-" : "+"} ${Math.abs(cc)}`);

export const T1: PrepTopic = {
  n: 1,
  slug: "determinant",
  title: "Determinantlar",
  short: "Kvadrat jadvaldan bitta son: 2×2, 3×3 (Sarrus), minor, Laplas, xossalar",
  minute: (
    <>
      <p>
        <b>Determinant — kvadrat sonlar jadvalidan hisoblanadigan bitta son.</b> Yozilishi: jadval ikki tik chiziq orasida{" "}
        <Tex>{"|A|"}</Tex> yoki <Tex>{"\\det A"}</Tex>.
      </p>
      <p>
        Bu son bitta savolga javob beradi: <b>"jadval 'buzilmaganmi'?"</b> Agar determinant <b>0</b> bo'lsa — satrlar bir-birini
        takrorlaydi, tenglamalar sistemasi yagona yechimga ega emas, teskari matritsa yo'q. Agar <b>0 emas</b> bo'lsa — hammasi joyida.
      </p>
      <p className="muted">Imtihonda asosan hisoblash so'raladi: 2×2, 3×3, element topish, minor va tenglama. Hammasi quyida qadamma-qadam.</p>
    </>
  ),
  picture: (
    <div className="pic-row">
      <Tex block>{`\\begin{vmatrix} ${c(B, 5)} & ${c(O, -2)} \\\\ ${c(O, 3)} & ${c(B, 4)} \\end{vmatrix} = ${c(B, "5\\cdot4")} - ${c(O, "(-2)\\cdot 3")} = 20 + 6 = 26`}</Tex>
      <div className="muted small"><span style={{ color: B }}>■</span> bosh diagonal (+) &nbsp; <span style={{ color: O }}>■</span> yon diagonal (−)</div>
    </div>
  ),
  symbols: [
    { s: "|A|,\\ \\det A,\\ \\Delta", read: "A ning determinanti, delta", mean: "Uchalasi ham bitta narsa — determinant. Jadval ikki tik chiziq orasida yoziladi (qavs emas!)." },
    { s: "\\begin{vmatrix} a&b\\\\c&d \\end{vmatrix}", read: "ikkinchi tartibli determinant", mean: "Tik chiziqlar — \"bu jadvaldan bitta son hisobla\" degani. Qavsli jadval $\\begin{pmatrix}a&b\\\\c&d\\end{pmatrix}$ esa matritsa (son emas)." },
    { s: "a_{ij}", read: "a i j", mean: "i-satr va j-ustundagi element. $a_{12}$ — 1-satr, 2-ustun; $a_{31}$ — 3-satr, 1-ustun." },
    { s: "M_{ij}", read: "minor M i j", mean: "i-satr va j-ustunni o'chirgandan keyin qolgan kichik determinant." },
    { s: "A_{ij}", read: "algebraik to'ldiruvchi", mean: "Minorga ishora qo'yilgani: $A_{ij}=(-1)^{i+j}M_{ij}$." },
    { s: "(-1)^{i+j}", read: "minus bir daraja i plus j", mean: "Faqat ishorani beradi: $i+j$ juft bo'lsa $+1$, toq bo'lsa $-1$." },
    { s: "n", read: "en", mean: "Determinant tartibi: $n\\times n$ jadval (2-tartibli — 2×2, 3-tartibli — 3×3)." },
  ],
  uses: [
    { icon: "⚖️", title: "Sistema yechiladimi?", text: <>Kramer usuli to'liq determinantlardan iborat. <Tex>{"\\Delta \\ne 0"}</Tex> — yagona yechim bor; <Tex>{"\\Delta=0"}</Tex> — yo'q yoki cheksiz ko'p.</> },
    { icon: "🏭", title: "Tarmoqlar balansi (Leontyev)", text: <>Iqtisodiyot tarmoqlari bir-biridan mahsulot oladi: <Tex>{"(E-A)x=y"}</Tex>. Reja tuzish mumkinligi <Tex>{"\\det(E-A)\\neq0"}</Tex> ga bog'liq.</> },
    { icon: "📊", title: "Ekonometrika", text: <>Regressiyada omillar bir-birini takrorlasa (multikollinearlik), determinant 0 ga yaqinlashadi va model "sinadi".</> },
    { icon: "📐", title: "Yuza", text: <>Uchlari berilgan uchburchak yuzasi determinant modulining yarmiga teng: <Tex>{"S=\\frac12|\\Delta|"}</Tex>. Kompyuter grafikasida shakl necha marta kattalashishini ham determinant beradi.</> },
  ],
  recipes: [
    {
      title: "2-tartibli determinant",
      rule: <><span style={{ color: B }}>Bosh diagonal</span> (chap-yuqoridan o'ng-pastga) ko'paytmasidan <span style={{ color: O }}>yon diagonal</span> ko'paytmasini <b>ayiramiz</b>.</>,
      formula: `\\begin{vmatrix} ${c(B, "a")} & ${c(O, "b")} \\\\ ${c(O, "c")} & ${c(B, "d")} \\end{vmatrix} = ${c(B, "a\\cdot d")} - ${c(O, "b\\cdot c")}`,
      steps: [<>Misol: <Tex>{tmat([[5, 2], [-3, 4]], "v")}</Tex> ni hisoblaymiz.</>, ...det2Explain([[5, 2], [-3, 4]])],
      anim: det2Anim([[5, 2], [-3, 4]]),
      gens: ["det2"],
    },
    {
      title: "3-tartibli determinant — Sarrus (uchburchak) qoidasi",
      rule: <>Bosh diagonalga parallel uchta "uchburchak" ko'paytma <b>plyus</b> ishora bilan, yon diagonalga parallel uchtasi <b>minus</b> ishora bilan olinadi. Daftarda oson usul: 1- va 2-ustunni jadvalning o'ng tomoniga qayta yozing — shunda 3 ta "+" diagonal (chapdan o'ngga pastga) va 3 ta "−" diagonal (o'ngdan chapga pastga) to'g'ri chiziq bo'lib chiqadi.</>,
      formula: "\\Delta = (a_{11}a_{22}a_{33} + a_{12}a_{23}a_{31} + a_{13}a_{21}a_{32}) - (a_{13}a_{22}a_{31} + a_{11}a_{23}a_{32} + a_{12}a_{21}a_{33})",
      steps: [<>Misol: <Tex>{tmat(EX3, "v")}</Tex> ni hisoblaymiz.</>, ...sarrusExplain(EX3)],
      anim: sarrusAnim(EX3),
      gens: ["det3"],
    },
    {
      title: "Element, minor va algebraik to'ldiruvchi",
      rule: <><Tex>{"a_{ij}"}</Tex> — i-satr va j-ustundagi son. <b>Minor</b> <Tex>{"M_{ij}"}</Tex> — i-satr va j-ustunni ruchka bilan o'chirib, qolgan kichik determinant. <b>Algebraik to'ldiruvchi</b> <Tex>{"A_{ij}"}</Tex> — shu minorning o'zi, faqat ishorasi shaxmat taxtasidagidek: <Tex>{"\\begin{matrix} + & - & + \\\\ - & + & - \\\\ + & - & + \\end{matrix}"}</Tex></>,
      formula: "A_{ij} = (-1)^{i+j}\\cdot M_{ij}",
      steps: [<>Misol: <Tex>{tmat(EX3, "v")}</Tex> uchun <Tex>{"A_{12}"}</Tex> ni topamiz.</>, ...minorExplain(EX3, 0, 1)],
      anim: cofactorAnim(EX3, 0, 1),
      gens: ["cof", "elem"],
    },
    {
      title: "Laplas teoremasi (satr yoki ustun bo'yicha yoyish)",
      rule: <>Biror satrni (yoki ustunni) tanlaymiz. Uning har bir elementini o'zining <b>algebraik to'ldiruvchisiga</b> ko'paytirib, hammasini qo'shamiz. <b>Eng ko'p nol bor</b> satrni tanlang — nolga ko'paytiriladigan hadlarni hisoblash shart emas. 4×4 determinant ham shu usulda hisoblanadi; uchburchak ko'rinishdagisi esa — diagonal ko'paytmasi.</>,
      formula: "\\Delta = a_{i1}A_{i1} + a_{i2}A_{i2} + \\dots + a_{in}A_{in}",
      steps: [
        <>Misol: <Tex>{tmat(EXL, "v")}</Tex> ni Laplas teoremasi bilan hisoblaymiz.</>,
        ...laplaceExplain(EXL),
        <><b>Qo'shimcha — uchburchak ko'rinish.</b> Diagonaldan pastda hammasi 0 bo'lsa, determinant diagonal ko'paytmasiga teng: <Tex>{`${tmat([[3, 5, -1, 2], [0, 4, 5, 7], [0, 0, -1, 1], [0, 0, 0, 1]], "v")} = 3\\cdot4\\cdot(-1)\\cdot1 = -12`}</Tex></>,
      ],
      anim: laplaceAnim(EXL),
      gens: ["lap", "tri"],
    },
    {
      title: "Determinantli tenglama",
      rule: <>Determinantni odatdagidek ochamiz. Natijada oddiy (chiziqli yoki kvadrat) tenglama hosil bo'ladi, uni yechamiz.</>,
      steps: [<>Misol: <Tex>{`${tmat([["x", 1], [6, "x+1"]], "v")} = 0`}</Tex> tenglamani yechamiz.</>, ...eqQuadExplain(1, 6, 1)],
      gens: ["eqx", "eqx2"],
    },
  ],
  mistakes: [
    { wrong: <><Tex>{"a\\cdot d + b\\cdot c"}</Tex></>, right: <><Tex>{"a\\cdot d - b\\cdot c"}</Tex>: yon diagonal har doim <b>ayiriladi</b>.</> },
    { wrong: <><Tex>{"20 - (-2)\\cdot3 = 20 - 6"}</Tex></>, right: <><Tex>{"20 - (-6) = 26"}</Tex>. Manfiy ko'paytmani qavsga oling.</> },
    { wrong: <><Tex>{"a_{12}"}</Tex> — "1-ustun, 2-satr"</>, right: <>Birinchi indeks — <b>satr</b>, ikkinchisi — <b>ustun</b>: <Tex>{"a_{12}"}</Tex> — 1-satr, 2-ustun.</> },
    { wrong: <><Tex>{"A_{ij} = M_{ij}"}</Tex> (ishora unutilgan)</>, right: <><Tex>{"A_{ij} = (-1)^{i+j}M_{ij}"}</Tex>. <Tex>{"i+j"}</Tex> toq bo'lsa ishora almashadi.</> },
    { wrong: <>4×4 determinantni Sarrus bilan hisoblash</>, right: <>Sarrus <b>faqat 3×3</b> uchun. 4×4 — Laplas (nolli satr bo'yicha) yoki uchburchak ko'rinishga keltirish.</> },
    { wrong: <>2×3 matritsaning determinanti</>, right: <>Determinant <b>faqat kvadrat</b> matritsa uchun mavjud.</> },
  ],
  gens: [
    {
      id: "det2",
      title: "2×2",
      make: () => {
        const m = [[rnz(-6, 7), rnz(-6, 6)], [rnz(-6, 6), rnz(-6, 7)]];
        const [[a, b], [cc, d]] = m;
        return {
          q: <>Hisoblang: <Tex>{tmat(m, "v")}</Tex></>,
          ans: [{ v: det2(m) }],
          traps: [
            { v: [a * d + b * cc], why: "Yon diagonal ko'paytmasini qo'shib yubordingiz — uni ayirish kerak." },
            { v: [b * cc - a * d], why: "Tartib teskari: avval bosh diagonal $a\\cdot d$, undan yon diagonal $b\\cdot c$ ayiriladi." },
          ],
          steps: det2Explain(m),
          anim: det2Anim(m),
        };
      },
    },
    {
      id: "det3",
      title: "3×3 (Sarrus)",
      make: () => {
        const m = [0, 1, 2].map(() => [0, 1, 2].map(() => ri(-3, 4)));
        const { sp, sm } = sarrusSums(m);
        return {
          q: <>Hisoblang: <Tex>{tmat(m, "v")}</Tex></>,
          ans: [{ v: det3(m) }],
          traps: [{ v: [sp + sm], why: "'−' ishorali ko'paytmalar yig'indisini qo'shib yubordingiz — uni ayirish kerak." }],
          steps: sarrusExplain(m),
          anim: sarrusAnim(m),
        };
      },
    },
    {
      id: "elem",
      title: "Elementni topish",
      make: () => {
        const m = [0, 1, 2].map(() => [0, 1, 2].map(() => ri(-7, 9)));
        const [i1, j1, i2, j2] = [ri(1, 3), ri(1, 3), ri(1, 3), ri(1, 3)];
        const same = i1 === j1 && i2 === j2;
        const v = m[i1 - 1][j1 - 1] + m[i2 - 1][j2 - 1];
        const sw = m[j1 - 1][i1 - 1] + m[j2 - 1][i2 - 1];
        return {
          q: <>Determinant: <Tex>{tmat(m, "v")}</Tex>. <Tex>{`a_{${i1}${j1}} + a_{${i2}${j2}}`}</Tex> = ?</>,
          ans: [{ v }],
          traps: same ? [] : [{ v: [sw], why: "Satr va ustunni adashtirdingiz: birinchi indeks — satr, ikkinchisi — ustun." }],
          steps: [
            <><b>Indekslarni o'qiymiz:</b> <Tex>{"a_{ij}"}</Tex> da birinchi raqam (i) — <b>satr</b>, ikkinchisi (j) — <b>ustun</b>. Satrlar yuqoridan pastga, ustunlar chapdan o'ngga sanaladi.</>,
            <><Tex>{`a_{${i1}${j1}}`}</Tex>: {i1}-satrga tushamiz, unda chapdan {j1}-son — <Tex>{tn(m[i1 - 1][j1 - 1])}</Tex>.</>,
            <><Tex>{`a_{${i2}${j2}}`}</Tex>: {i2}-satrga tushamiz, unda chapdan {j2}-son — <Tex>{tn(m[i2 - 1][j2 - 1])}</Tex>.</>,
            <><b>Qo'shamiz:</b> <Tex>{`${tn(m[i1 - 1][j1 - 1])} + ${tp(m[i2 - 1][j2 - 1])} = ${tn(v)}`}</Tex>.</>,
          ],
        };
      },
    },
    {
      id: "cof",
      title: "Algebraik to'ldiruvchi",
      make: () => {
        const m = [0, 1, 2].map(() => [0, 1, 2].map(() => ri(-4, 5)));
        let i = ri(0, 2), j = ri(0, 2);
        if ((i + j) % 2 === 0 && Math.random() < 0.6) j = j === 2 ? 1 : j + 1; // ko'proq "−" holatlar
        const M = det2(minor(m, i, j));
        const s = (i + j) % 2 ? -1 : 1;
        return {
          q: <><Tex>{tmat(m, "v")}</Tex> determinantning <Tex>{`A_{${i + 1}${j + 1}}`}</Tex> algebraik to'ldiruvchisini toping.</>,
          ans: [{ v: s * M }],
          traps: s === -1 && M !== 0 ? [{ v: [M], why: `Ishorani unutdingiz: $(-1)^{${i + 1}+${j + 1}} = -1$.` }] : [],
          steps: minorExplain(m, i, j),
          anim: cofactorAnim(m, i, j),
        };
      },
    },
    {
      id: "lap",
      title: "Laplas (3×3)",
      make: () => {
        const m = [0, 1, 2].map(() => [0, 1, 2].map(() => rnz(-4, 5)));
        // bitta satr yoki ustunda 1–2 ta nol hosil qilamiz
        const k = ri(0, 2), byRow = Math.random() < 0.5, zeros = ri(1, 2);
        const idx = [0, 1, 2].sort(() => Math.random() - 0.5).slice(0, zeros);
        idx.forEach((t) => { if (byRow) m[k][t] = 0; else m[t][k] = 0; });
        return {
          q: <>Laplas teoremasi yordamida hisoblang: <Tex>{tmat(m, "v")}</Tex></>,
          ans: [{ v: det3(m) }],
          steps: laplaceExplain(m),
          anim: laplaceAnim(m),
        };
      },
    },
    {
      id: "tri",
      title: "Uchburchak 4×4",
      make: () => {
        const d = [rnz(-3, 4), rnz(-3, 3), rnz(-2, 3), rnz(-3, 3)];
        const up = Math.random() < 0.5;
        const m = d.map((x, i) => d.map((_, j) => (i === j ? x : (up ? j > i : j < i) ? ri(-5, 9) : 0)));
        return {
          q: <>Hisoblang: <Tex>{tmat(m, "v")}</Tex></>,
          ans: [{ v: d.reduce((a, b) => a * b, 1) }],
          traps: [{ v: [d.reduce((a, b) => a + b, 0)], why: "Diagonal elementlarni qo'shdingiz — ularni ko'paytirish kerak." }],
          steps: triExplain(m),
          anim: triAnim(m),
        };
      },
    },
    {
      id: "eqx",
      title: "Tenglama (chiziqli)",
      make: () => {
        // |a  b| = r   ⇒   a·x − b·c = r
        // |c  x|
        const a = pick([1, 2, 3, -1, -2, 4]);
        const x = ri(-5, 6);
        const b = rnz(-4, 5), cc = rnz(-4, 5);
        const r = a * x - b * cc;
        return {
          q: <>Tenglamani yeching: <Tex>{`${tmat([[a, b], [cc, "x"]], "v")} = ${tn(r)}`}</Tex></>,
          ans: [{ label: <Tex>x</Tex>, v: x }],
          traps: [{ v: [(r - b * cc) / a], why: "Ishorada xato: $a\\cdot x - b\\cdot c = r$ dan $a\\cdot x = r + b\\cdot c$ chiqadi (o'ng tomonga o'tganda minus plyusga aylanadi)." }],
          steps: eqLinExplain(a, b, cc, r),
        };
      },
    },
    {
      id: "eqx2",
      title: "Tenglama (kvadrat)",
      make: () => {
        // |x  a  | = 0  ⇒  x² + c·x − a·b = 0, ildizlari r1, r2
        // |b  x+c|
        let r1 = 0, r2 = 0;
        while (r1 === r2) { r1 = ri(-5, 5); r2 = ri(-5, 5); }
        const cc = -(r1 + r2), P = -r1 * r2; // a·b = −r1·r2
        const divs = [1, 2, 3, -1, -2, -3, 4, 5, 6].filter((d) => P % d === 0);
        const a = P === 0 ? pick([1, 2, 3]) : pick(divs);
        const b = P === 0 ? 0 : P / a;
        return {
          q: <>Tenglamani yeching: <Tex>{`${tmat([["x", a], [b, xcTex(cc)]], "v")} = 0`}</Tex></>,
          ans: [{ label: <Tex>{"x_1"}</Tex>, v: r1 }, { label: <Tex>{"x_2"}</Tex>, v: r2 }],
          unordered: true,
          steps: eqQuadExplain(a, b, cc),
        };
      },
    },
  ],
  tests: [
    { id: "t1:test:1", q: "Determinantning ikki satri o'rni almashtirilsa, uning qiymati qanday o'zgaradi?", options: ["O'zgarmaydi", "Ishorasi qarama-qarshisiga o'zgaradi", "2 marta ortadi", "Nolga teng bo'ladi", "Kvadratga oshadi"], correct: 1, explain: "Ikki satr (yoki ustun) almashsa — determinant ishorasini o'zgartiradi, moduli o'sha qoladi." },
    { id: "t1:test:2", q: "Determinantning ikki satri teng (yoki proporsional) bo'lsa, determinant…", options: ["1 ga teng", "satrlar yig'indisiga teng", "0 ga teng", "manfiy bo'ladi", "aniqlanmagan"], correct: 2, explain: "Proporsional satrlar — 'takrorlanish'. Bunday determinant doim 0." },
    { id: "t1:test:3", q: <>Agar determinantning bitta satri barcha elementlari 0 bo'lsa, determinant…</>, options: ["0 ga teng", "1 ga teng", "diagonal ko'paytmasiga teng", "aniqlanmagan", "$-1$ ga teng"], correct: 0, explain: "Shu satr bo'yicha Laplas yoyilmasida hamma hadlar 0 ga ko'paytiriladi." },
    { id: "t1:test:4", q: <>Transponirlangan matritsaning determinanti <Tex>{"|A^T|"}</Tex> …</>, options: [<Tex>{"-|A|"}</Tex>, <Tex>{"|A|^2"}</Tex>, <Tex>{"|A|"}</Tex>, "0", <Tex>{"\\dfrac{1}{|A|}"}</Tex>], correct: 2, explain: "Satrlarni ustun qilib yozish (transponirlash) determinantni o'zgartirmaydi: $|A^T| = |A|$. ($A^T$ — \"A transponirlangan\", T — daraja emas, belgi.)" },
    { id: "t1:test:5", q: "Determinantning bitta satri k soniga ko'paytirilsa, determinant…", options: ["o'zgarmaydi", "$k^2$ marta ortadi", "$k$ marta ortadi", "$k$ ga qo'shiladi", "ishorasi o'zgaradi"], correct: 2, explain: "Bitta satrdagi umumiy ko'paytuvchi determinant belgisi oldiga chiqariladi." },
    { id: "t1:test:6", q: <>2×2 matritsa uchun <Tex>{"|3A|"}</Tex> = ?</>, options: [<Tex>{"3|A|"}</Tex>, <Tex>{"9|A|"}</Tex>, <Tex>{"6|A|"}</Tex>, <Tex>{"|A|"}</Tex>, <Tex>{"27|A|"}</Tex>], correct: 1, explain: "$3A$ da HAR IKKI satr 3 ga ko'paytirilgan, har biridan 3 tashqariga chiqadi: $3\\cdot3=9$. Umuman, $n\\times n$ jadval uchun $|kA| = k^n\\cdot|A|$." },
    { id: "t1:test:7", q: <>Algebraik to'ldiruvchi <Tex>{"A_{ij}"}</Tex> qanday topiladi?</>, options: [<Tex>{"A_{ij} = M_{ij}"}</Tex>, <Tex>{"A_{ij} = -M_{ij}"}</Tex>, <Tex>{"A_{ij} = (-1)^{i+j}M_{ij}"}</Tex>, <Tex>{"A_{ij} = (-1)^{i\\cdot j}M_{ij}"}</Tex>, <Tex>{"A_{ij} = a_{ij}M_{ij}"}</Tex>], correct: 2, explain: "Minorga shaxmat ishorasi qo'yiladi: $A_{ij}=(-1)^{i+j}\\cdot M_{ij}$." },
    { id: "t1:test:8", q: "Laplas teoremasi bo'yicha determinant nimaga teng?", options: ["Diagonal elementlar yig'indisiga", "Biror satr elementlarining o'z algebraik to'ldiruvchilariga ko'paytmalari yig'indisiga", "Barcha minorlar yig'indisiga", "Barcha elementlar ko'paytmasiga", "Birinchi satr elementlari yig'indisiga"], correct: 1, explain: "$\\Delta = a_{i1}A_{i1} + a_{i2}A_{i2} + \\dots + a_{in}A_{in}$ — ixtiyoriy i-satr (yoki ustun) bo'yicha." },
    { id: "t1:test:9", q: <>Hisoblang: <Tex>{tmat([[1, 3, 2], [2, 2, 4], [3, 1, 6]], "v")}</Tex></>, options: ["1", "0", "$-2$", "4", "12"], correct: 1, explain: <>3-ustun 1-ustunning 2 baravari: <Tex>{"\\begin{pmatrix}2\\\\4\\\\6\\end{pmatrix}=2\\cdot\\begin{pmatrix}1\\\\2\\\\3\\end{pmatrix}"}</Tex>. Proporsional ustunlar bor, demak determinant 0. Buni hisoblamasdan ham ko'rish mumkin!</> },
    { id: "t1:test:10", q: "Determinant qanday matritsa uchun aniqlangan?", options: ["Har qanday matritsa uchun", "Faqat kvadrat matritsa uchun", "Faqat 2×2 va 3×3 uchun", "Faqat simmetrik matritsa uchun", "Faqat nolmas matritsa uchun"], correct: 1, explain: "Satrlar soni ustunlar soniga teng bo'lishi shart." },
  ],
  cheat: [
    { t: "2×2", f: <Tex>{"\\begin{vmatrix} a&b\\\\c&d\\end{vmatrix}=ad-bc"}</Tex> },
    { t: "3×3 (Sarrus)", f: <Tex>{"(a_{11}a_{22}a_{33}+a_{12}a_{23}a_{31}+a_{13}a_{21}a_{32}) - (a_{13}a_{22}a_{31}+a_{11}a_{23}a_{32}+a_{12}a_{21}a_{33})"}</Tex> },
    { t: "Algebraik to'ldiruvchi", f: <Tex>{"A_{ij}=(-1)^{i+j}M_{ij}"}</Tex> },
    { t: "Laplas", f: <Tex>{"\\Delta=a_{i1}A_{i1}+a_{i2}A_{i2}+\\dots+a_{in}A_{in}"}</Tex> },
    { t: "Xossalar", f: <ul className="compact"><li>Ikki satr almashsa — ishora o'zgaradi</li><li>Nol satr yoki teng (proporsional) satrlar bo'lsa — determinant 0</li><li><Tex>{"|A^T|=|A|"}</Tex></li><li>Satrga boshqa satrni biror songa ko'paytirib qo'shsak — o'zgarmaydi</li><li>Uchburchak ko'rinishda — diagonal elementlar ko'paytmasi</li></ul> },
    { t: "Ko'paytuvchi", f: <Tex>{"|kA| = k^n|A|,\\quad |AB|=|A|\\cdot|B|"}</Tex> },
  ],
  lessons: ["determinant", "det3"],
};
