import { Tex } from "../components/Tex";
import { det2, det3, pick, ri, rnz, tmat, tn, tp, type PrepTopic } from "./core";

const B = "#58c4dd"; // "+" diagonal
const O = "#ff9f43"; // "−" diagonal
const c = (col: string, x: number | string) => `\\color{${col}}{${typeof x === "number" ? tn(x) : x}}`;

/** 3×3 Sarrus hadlari: [qiymat, tex] */
function sarrusTerms(m: number[][]) {
  const P: [number, number, number][][] = [
    [[0, 0], [1, 1], [2, 2]].map(([i, j]) => [i, j, m[i][j]]) as [number, number, number][],
    [[0, 1], [1, 2], [2, 0]].map(([i, j]) => [i, j, m[i][j]]) as [number, number, number][],
    [[0, 2], [1, 0], [2, 1]].map(([i, j]) => [i, j, m[i][j]]) as [number, number, number][],
  ];
  const M: [number, number, number][][] = [
    [[0, 2], [1, 1], [2, 0]].map(([i, j]) => [i, j, m[i][j]]) as [number, number, number][],
    [[0, 0], [1, 2], [2, 1]].map(([i, j]) => [i, j, m[i][j]]) as [number, number, number][],
    [[0, 1], [1, 0], [2, 2]].map(([i, j]) => [i, j, m[i][j]]) as [number, number, number][],
  ];
  const prod = (t: [number, number, number][]) => t.reduce((s, x) => s * x[2], 1);
  const tex = (t: [number, number, number][]) => t.map((x) => tp(x[2])).join("\\cdot ");
  return { P, M, prod, tex };
}

function sarrusSteps(m: number[][]) {
  const { P, M, prod, tex } = sarrusTerms(m);
  const ps = P.map(prod), ms = M.map(prod);
  const sp = ps.reduce((a, b) => a + b, 0), sm = ms.reduce((a, b) => a + b, 0);
  return [
    <>"+" diagonallar (chapdan pastga o'ngga): <Tex>{P.map((t, i) => `${tex(t)} = ${tn(ps[i])}`).join(",\\quad ")}</Tex></>,
    <>Ularning yig'indisi: <Tex>{`${ps.map(tp).join(" + ")} = ${tn(sp)}`}</Tex></>,
    <>"−" diagonallar (o'ngdan pastga chapga): <Tex>{M.map((t, i) => `${tex(t)} = ${tn(ms[i])}`).join(",\\quad ")}</Tex></>,
    <>Ularning yig'indisi: <Tex>{`${ms.map(tp).join(" + ")} = ${tn(sm)}`}</Tex></>,
    <>Determinant = "+" lar − "−" lar: <Tex>{`${tn(sp)} - ${tp(sm)} = ${tn(sp - sm)}`}</Tex></>,
  ];
}

const minor = (m: number[][], i: number, j: number) => m.filter((_, a) => a !== i).map((r) => r.filter((_, b) => b !== j));

const EX3 = [[2, 1, 3], [0, -1, 4], [1, 2, 1]];

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
      steps: [
        <>Misol: <Tex>{`\\begin{vmatrix} ${c(B, 5)} & ${c(O, 2)} \\\\ ${c(O, -3)} & ${c(B, 4)} \\end{vmatrix}`}</Tex></>,
        <>Bosh diagonal: <Tex>{`${c(B, "5\\cdot 4")} = 20`}</Tex></>,
        <>Yon diagonal: <Tex>{`${c(O, "2\\cdot(-3)")} = -6`}</Tex></>,
        <>Ayiramiz: <Tex>{"20 - (-6) = 20 + 6 = \\boxed{26}"}</Tex>. Manfiyni ayirish — qo'shish!</>,
      ],
    },
    {
      title: "3-tartibli determinant — Sarrus (uchburchak) qoidasi",
      rule: <>Bosh diagonalga parallel uchta "uchburchak" ko'paytma <b>plyus</b> ishora bilan, yon diagonalga parallel uchtasi <b>minus</b> ishora bilan olinadi. Daftarda oson usul: 1- va 2-ustunni jadvalning o'ng tomoniga qayta yozing — shunda 3 ta "+" diagonal (chapdan o'ngga pastga) va 3 ta "−" diagonal (o'ngdan chapga pastga) to'g'ri chiziq bo'lib chiqadi.</>,
      formula: "\\Delta = (a_{11}a_{22}a_{33} + a_{12}a_{23}a_{31} + a_{13}a_{21}a_{32}) - (a_{13}a_{22}a_{31} + a_{11}a_{23}a_{32} + a_{12}a_{21}a_{33})",
      visual: (
        <Tex block>{`\\left|\\begin{matrix} ${c(B, "a_{11}")} & a_{12} & ${c(O, "a_{13}")} \\\\ a_{21} & ${c("#c084fc", "a_{22}")} & a_{23} \\\\ ${c(O, "a_{31}")} & a_{32} & ${c(B, "a_{33}")} \\end{matrix}\\right| \\begin{matrix} a_{11} & a_{12} \\\\ a_{21} & a_{22} \\\\ a_{31} & a_{32} \\end{matrix}`}</Tex>
      ),
      steps: [<>Misol: <Tex>{tmat(EX3, "v")}</Tex></>, ...sarrusSteps(EX3)],
    },
    {
      title: "Minor va algebraik to'ldiruvchi",
      rule: <><b>Minor</b> <Tex>{"M_{ij}"}</Tex> — i-satr va j-ustunni ruchka bilan o'chirib, qolgan kichik determinant. <b>Algebraik to'ldiruvchi</b> <Tex>{"A_{ij}"}</Tex> — shu minorning o'zi, faqat ishorasi shaxmat taxtasidagidek: <Tex>{"\\begin{matrix} + & - & + \\\\ - & + & - \\\\ + & - & + \\end{matrix}"}</Tex></>,
      formula: "A_{ij} = (-1)^{i+j}\\cdot M_{ij}",
      steps: [
        <>Yuqoridagi matritsa uchun <Tex>{"A_{12}"}</Tex> ni topamiz: <Tex>{`${tmat(EX3, "v")}`}</Tex></>,
        <>1-satr va 2-ustunni o'chiramiz, qoladi: <Tex>{`M_{12} = ${tmat(minor(EX3, 0, 1), "v")} = 0\\cdot1 - 4\\cdot1 = -4`}</Tex></>,
        <>Ishora: <Tex>{"(-1)^{1+2} = -1"}</Tex> (shaxmatda 1-satr 2-o'rin "−")</>,
        <><Tex>{"A_{12} = -1\\cdot(-4) = \\boxed{4}"}</Tex></>,
      ],
    },
    {
      title: "Laplas teoremasi (satr yoki ustun bo'yicha yoyish) — 4×4 uchun ham",
      rule: <>Biror satrni (yoki ustunni) tanlaymiz. Uning har bir elementini o'zining <b>algebraik to'ldiruvchisiga</b> ko'paytirib, hammasini qo'shamiz. <b>Eng ko'p nol bor</b> satrni tanlang — nolga ko'paytiriladigan hadlarni hisoblash shart emas.</>,
      formula: "\\Delta = a_{i1}A_{i1} + a_{i2}A_{i2} + \\dots + a_{in}A_{in}",
      steps: [
        <>Misol: <Tex>{`${tmat([[2, 1, 3], [0, -1, 4], [0, 2, 1]], "v")}`}</Tex> — 1-ustunda ikkita nol bor, shuni tanlaymiz.</>,
        <><Tex>{"\\Delta = 2\\cdot A_{11} + 0\\cdot A_{21} + 0\\cdot A_{31} = 2\\cdot A_{11}"}</Tex></>,
        <><Tex>{`A_{11} = (+1)\\cdot${tmat([[-1, 4], [2, 1]], "v")} = -1 - 8 = -9`}</Tex></>,
        <><Tex>{"\\Delta = 2\\cdot(-9) = \\boxed{-18}"}</Tex></>,
        <>Tezkor yo'l: diagonaldan pastda hammasi 0 bo'lsa (uchburchak matritsa), determinant = diagonal ko'paytmasi. Masalan <Tex>{`${tmat([[3, 5, -1, 2], [0, 4, 5, 7], [0, 0, -1, 1], [0, 0, 0, 1]], "v")} = 3\\cdot4\\cdot(-1)\\cdot1 = -12`}</Tex></>,
      ],
    },
    {
      title: "Determinantli tenglama",
      rule: <>Determinantni odatdagidek ochamiz. Natijada oddiy (chiziqli yoki kvadrat) tenglama hosil bo'ladi, uni yechamiz.</>,
      steps: [
        <>Misol: <Tex>{`${tmat([["x", 1], [6, "x+1"]], "v")} = 0`}</Tex></>,
        <>Ochamiz: <Tex>{"x(x+1) - 1\\cdot 6 = 0"}</Tex></>,
        <><Tex>{"x^2 + x - 6 = 0"}</Tex> — kvadrat tenglama.</>,
        <>Viyet teoremasi yoki diskriminant orqali: <Tex>{"x_1 = 2,\\quad x_2 = -3"}</Tex></>,
      ],
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
          steps: [
            <>Bosh diagonal: <Tex>{`${tp(a)}\\cdot${tp(d)} = ${tn(a * d)}`}</Tex></>,
            <>Yon diagonal: <Tex>{`${tp(b)}\\cdot${tp(cc)} = ${tn(b * cc)}`}</Tex></>,
            <><Tex>{`${tn(a * d)} - ${tp(b * cc)} = ${tn(det2(m))}`}</Tex></>,
          ],
        };
      },
    },
    {
      id: "det3",
      title: "3×3 (Sarrus)",
      make: () => {
        const m = [0, 1, 2].map(() => [0, 1, 2].map(() => ri(-3, 4)));
        return {
          q: <>Hisoblang: <Tex>{tmat(m, "v")}</Tex></>,
          ans: [{ v: det3(m) }],
          traps: [{ v: [sarrusTerms(m).P.map(sarrusTerms(m).prod).reduce((a, b) => a + b, 0) + sarrusTerms(m).M.map(sarrusTerms(m).prod).reduce((a, b) => a + b, 0)], why: "'−' diagonallar yig'indisini qo'shib yubordingiz — uni ayirish kerak." }],
          steps: sarrusSteps(m),
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
            <><Tex>{`a_{${i1}${j1}}`}</Tex>: {i1}-satr, {j1}-ustun → <b>{m[i1 - 1][j1 - 1]}</b></>,
            <><Tex>{`a_{${i2}${j2}}`}</Tex>: {i2}-satr, {j2}-ustun → <b>{m[i2 - 1][j2 - 1]}</b></>,
            <><Tex>{`${tn(m[i1 - 1][j1 - 1])} + ${tp(m[i2 - 1][j2 - 1])} = ${tn(v)}`}</Tex></>,
          ],
        };
      },
    },
    {
      id: "cof",
      title: "Algebraik to'ldiruvchi",
      make: () => {
        const m = [0, 1, 2].map(() => [0, 1, 2].map(() => ri(-4, 5)));
        let i = ri(1, 3), j = ri(1, 3);
        if ((i + j) % 2 === 0 && Math.random() < 0.6) j = j === 3 ? 2 : j + 1; // ko'proq "−" holatlar
        const mm = minor(m, i - 1, j - 1);
        const M = det2(mm);
        const s = (i + j) % 2 ? -1 : 1;
        return {
          q: <><Tex>{tmat(m, "v")}</Tex> determinantning <Tex>{`A_{${i}${j}}`}</Tex> algebraik to'ldiruvchisini toping.</>,
          ans: [{ v: s * M }],
          traps: s === -1 && M !== 0 ? [{ v: [M], why: `Ishorani unutdingiz: (−1)^(${i}+${j}) = −1.` }] : [],
          steps: [
            <>{i}-satr va {j}-ustunni o'chiramiz: <Tex>{`M_{${i}${j}} = ${tmat(mm, "v")} = ${tp(mm[0][0])}\\cdot${tp(mm[1][1])} - ${tp(mm[0][1])}\\cdot${tp(mm[1][0])} = ${tn(M)}`}</Tex></>,
            <>Ishora: <Tex>{`(-1)^{${i}+${j}} = ${s}`}</Tex></>,
            <><Tex>{`A_{${i}${j}} = ${s}\\cdot${tp(M)} = ${tn(s * M)}`}</Tex></>,
          ],
        };
      },
    },
    {
      id: "eqx",
      title: "Tenglama (x ni toping)",
      make: () => {
        // |a  b| = r ;  a·x − b·c = r  (x — o'ng pastda)
        // |c  x|
        const a = pick([1, 2, 3, -1, -2]);
        const x = ri(-5, 6);
        const b = rnz(-4, 5), cc = rnz(-4, 5);
        const r = a * x - b * cc;
        const zero = Math.random() < 0.4;
        const rhs = zero ? 0 : r;
        // agar zero bo'lsa, r ni 0 qilish uchun b·c ni moslaymiz
        const bb = zero ? (a * x === 0 ? 0 : b) : b;
        const cc2 = zero ? (bb === 0 ? cc : (a * x) / bb) : cc;
        const okInt = Number.isInteger(cc2);
        const B2 = okInt ? bb : b, C2 = okInt ? cc2 : cc, R2 = okInt ? rhs : r;
        const m = [[a, B2], [C2, "x"]] as (number | string)[][];
        return {
          q: <>Tenglamani yeching: <Tex>{`${tmat(m, "v")} = ${tn(R2)}`}</Tex></>,
          ans: [{ label: <Tex>x</Tex>, v: (R2 + B2 * C2) / a }],
          traps: [{ v: [(R2 - B2 * C2) / a], why: "Ishorada xato: $a\\cdot x - b\\cdot c = r$ dan $a\\cdot x = r + b\\cdot c$ chiqadi (o'ng tomonga o'tganda minus plyusga aylanadi)." }],
          steps: [
            <>Ochamiz: <Tex>{`${tp(a)}\\cdot x - ${tp(B2)}\\cdot${tp(C2 as number)} = ${tn(R2)}`}</Tex></>,
            <><Tex>{`${tn(a)}x ${B2 * C2 >= 0 ? "-" : "+"} ${tn(Math.abs(B2 * C2))} = ${tn(R2)}`}</Tex></>,
            <><Tex>{`${tn(a)}x = ${tn(R2 + B2 * C2)} \\Rightarrow x = ${tn((R2 + B2 * C2) / a)}`}</Tex></>,
          ],
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
        const v = d.reduce((a, b) => a * b, 1);
        return {
          q: <>Hisoblang: <Tex>{tmat(m, "v")}</Tex></>,
          ans: [{ v }],
          traps: [{ v: [d.reduce((a, b) => a + b, 0)], why: "Diagonal elementlarni qo'shdingiz — ularni ko'paytirish kerak." }],
          steps: [
            <>Diagonalning {up ? "pastida" : "ustida"} hamma element 0 — bu <b>uchburchak</b> matritsa.</>,
            <>Bunday determinant = diagonal elementlar <b>ko'paytmasi</b> (Laplasni nolli ustun bo'yicha ketma-ket qo'llash natijasi).</>,
            <><Tex>{`${d.map(tp).join("\\cdot")} = ${tn(v)}`}</Tex></>,
          ],
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
