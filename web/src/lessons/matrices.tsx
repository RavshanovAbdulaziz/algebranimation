import { useState, type ReactNode } from "react";
import { Line, Polygon, Text, useMovablePoint } from "mafs";
import { LessonShell, Sec, Recall, Key } from "../components/LessonShell";
import { Arrow, Board, C, Controls, Figure, Legend, MatrixEditor, TransformedGrid, UnitSquare, snap, useTimeline } from "../components/viz";
import { MatGrid } from "../components/MatGrid";
import { Tex } from "../components/Tex";
import { add, apply, col1, col2, det, fmt, I, lerpM, pf, term, mul, scale, smooth, texM, type M, type V } from "../lib/la";

export const PRESETS: { name: string; A: M }[] = [
  { name: "Burish 90°", A: [0, -1, 1, 0] },
  { name: "Cho'zish", A: [2, 0, 0, 1.5] },
  { name: "Siljitish (shear)", A: [1, 1, 0, 1] },
  { name: "Aks ettirish", A: [-1, 0, 0, 1] },
  { name: "Yassilash (det=0)", A: [1, 2, 0.5, 1] },
  { name: "Ixtiyoriy", A: [1, -1, 0.5, 1.5] },
];

/* =================================================================== */
/* MATRITSALAR VA AMALLAR (HEMIS 2-ma'ruza)                            */
/* =================================================================== */

const EX_A = [[2, -1, 3], [0, 4, 1]];
const EX_B = [[1, 2], [3, -1], [0, 5]];
const ECO_C = [[90, 110, 80, 100]];
const ECO_A = [[4, 3, 2], [1, 0, 5], [3, 2, 4], [5, 3, 1]];

function matmul(A: number[][], B: number[][]) {
  return A.map((r) => B[0].map((_, j) => r.reduce((s, a, k) => s + a * B[k][j], 0)));
}

/** "Satrni ustunga" ko'paytirish animatsiyasi */
export function MatMulAnim({ A, B, names = ["A", "B"], rowNames, colNames }: {
  A: number[][]; B: number[][]; names?: [string, string]; rowNames?: string[]; colNames?: string[];
}) {
  const m = A.length, p = B.length, n = B[0].length;
  const Cm = matmul(A, B);
  const cells = m * n;
  const tl = useTimeline(cells, 1.8);
  const c = Math.min(cells - 1, Math.floor(tl.t));
  const frac = tl.t >= cells ? 1 : tl.t - c;
  const i = Math.floor(c / n), j = c % n;
  const kShown = Math.min(p, Math.floor(frac * (p + 1)));
  const active = tl.t > 0;
  const filled = (a: number, b: number) => a * n + b < c || (a * n + b === c && kShown >= p);
  const pf = (x: number) => (x < 0 ? `(${fmt(x)})` : fmt(x)); // manfiy ko'paytuvchi qavsda
  const terms = Array.from({ length: p }, (_, k) => `${pf(A[i][k])}\\cdot${pf(B[k][j])}`);
  const partial = Array.from({ length: kShown }, (_, k) => A[i][k] * B[k][j]).reduce((s, x) => s + x, 0);
  // hozir ko'paytirilayotgan juftlik: a_{i,kk} va b_{kk,j}
  const kk = kShown < p ? kShown : -1;
  return (
    <div className="matmul">
      <div className="matmul-grid">
        <div />
        <MatGrid M={B} hiCol={active ? j : undefined} hiCells={active && kk >= 0 ? [[kk, j]] : []} label={<>{names[1]} ({p}×{n})</>} />
        <MatGrid M={A} hiRow={active ? i : undefined} hiCells={active && kk >= 0 ? [[i, kk]] : []} label={<>{names[0]} ({m}×{p})</>} />
        <MatGrid M={Cm} hiCells={active ? [[i, j]] : []} hide={(a, b) => !filled(a, b)} label={<>{names[0]}{names[1]} ({m}×{n})</>} />
      </div>
      <div className="matmul-legend">
        <span><span className="hl-row">&nbsp;&nbsp;</span> {names[0]} ning {i + 1}-satri</span>
        <span><span className="hl-col">&nbsp;&nbsp;</span> {names[1]} ning {j + 1}-ustuni</span>
        <span><span className="hl-x">&nbsp;&nbsp;</span> hozir ko'paytirilayotgan juftlik</span>
      </div>
      {!active && <div className="matmul-formula muted small">▶ ni bosing yoki slayderni suring</div>}
      {active && (
        <div className="matmul-formula">
          <Tex>{`c_{${i + 1}${j + 1}} = ${terms.map((t, k) => (k < kShown ? t : `\\color{#666}{${t}}`)).join(" + ")} ${kShown >= p ? `= ${fmt(Cm[i][j])}` : kShown > 0 ? `\\;(\\text{hozircha } ${fmt(partial)})` : ""}`}</Tex>
          {rowNames && colNames && (
            <div className="muted small">{rowNames[i]} × {colNames[j]}</div>
          )}
        </div>
      )}
      <Controls tl={tl} />
    </div>
  );
}

function TransposeAnim() {
  const Mx = [[2, -4, 0], [3, 1, 5]];
  const tl = useTimeline(1, 1.5);
  const s = smooth(tl.t);
  const cell = 52;
  return (
    <div className="transpose">
      <div className="transpose-box" style={{ width: cell * 3, height: cell * 3 }}>
        {Mx.flatMap((row, i) =>
          row.map((x, j) => {
            const r = i + (j - i) * s, cc = j + (i - j) * s;
            return (
              <div key={i + "" + j} className={"tcell" + (i === j ? " diag" : "")} style={{ transform: `translate(${cc * cell}px, ${r * cell}px)`, width: cell, height: cell }}>
                <span>{x}</span>
                <small>a{i + 1}{j + 1}</small>
              </div>
            );
          }),
        )}
      </div>
      <div className="transpose-side">
        <Tex block>{s < 0.5 ? "A = \\begin{pmatrix} 2 & -4 & 0 \\\\ 3 & 1 & 5 \\end{pmatrix}_{2\\times3}" : "A^T = \\begin{pmatrix} 2 & 3 \\\\ -4 & 1 \\\\ 0 & 5 \\end{pmatrix}_{3\\times2}"}</Tex>
        <p>Har bir element <Tex>{"a_{ij}"}</Tex> joyi <Tex>{"(j, i)"}</Tex> ga ko'chadi: satrlar ustunga aylanadi. Diagonal (sariq) joyida qoladi — u "oyna o'qi".</p>
        <Controls tl={tl} />
      </div>
    </div>
  );
}

export function MatritsaLesson() {
  return (
    <LessonShell
      id="matritsa"
      quiz={[
        {
          q: <><Tex>{"A_{2\\times3}"}</Tex> va <Tex>{"B_{3\\times4}"}</Tex> uchun <Tex>{"AB"}</Tex> qanday tartibli?</>,
          options: ["3×3", "2×4", "Ko'paytirib bo'lmaydi"],
          correct: 1,
          explain: "Ichki o'lchamlar (3 va 3) teng bo'lishi shart, natija tashqi o'lchamlardan: 2×4.",
        },
        {
          q: <><Tex>{"AB"}</Tex> ning <Tex>{"c_{21}"}</Tex> elementi qanday topiladi?</>,
          options: ["A ning 2-ustuni · B ning 1-satri", "A ning 2-satri · B ning 1-ustuni", "a₂₁ · b₂₁"],
          correct: 1,
          explain: "Satrni ustunga: i-satr va j-ustunning mos elementlari ko'paytirilib qo'shiladi — bu skalyar ko'paytma.",
        },
        {
          q: <><Tex>{"(AB)^T"}</Tex> = ?</>,
          options: [<Tex>{"A^TB^T"}</Tex>, <Tex>{"B^TA^T"}</Tex>, <Tex>{"AB"}</Tex>],
          correct: 1,
          explain: "Transponirlashda tartib teskari bo'ladi: (AB)ᵀ = BᵀAᵀ (HEMIS 2-ma'ruza, 4-xossa).",
        },
      ]}
    >
      <Sec title="Matritsa — sonlar jadvali">
        <p>
          <Tex>{"m\\times n"}</Tex> tartibli matritsa — <b>m ta satr</b> va <b>n ta ustun</b>dan iborat jadval. Element{" "}
          <Tex>{"a_{ij}"}</Tex>: i — satr raqami, j — ustun raqami. Asosiy turlar:
        </p>
        <div className="types">
          {([
            ["Kvadrat (m = n)", "\\begin{pmatrix} 1 & 2 \\\\ 3 & 4 \\end{pmatrix}"],
            ["Diagonal", "\\begin{pmatrix} 2 & 0 \\\\ 0 & -1 \\end{pmatrix}"],
            ["Birlik E", "\\begin{pmatrix} 1 & 0 \\\\ 0 & 1 \\end{pmatrix}"],
            ["Nol O", "\\begin{pmatrix} 0 & 0 \\\\ 0 & 0 \\end{pmatrix}"],
            ["Satr matritsa", "\\begin{pmatrix} 1 & 5 & 2 \\end{pmatrix}"],
            ["Ustun matritsa", "\\begin{pmatrix} 3 \\\\ 7 \\end{pmatrix}"],
            ["Simmetrik (Aᵀ = A)", "\\begin{pmatrix} 3 & 6 \\\\ 6 & 1 \\end{pmatrix}"],
          ] as [string, string][]).map(([n, t]) => (
            <div key={n} className="type-card"><Tex>{t}</Tex><span>{n}</span></div>
          ))}
        </div>
        <Recall to="amallar">
          Ustun matritsa — bu vektor! Shuning uchun matritsalarni <b>qo'shish</b> va <b>songa ko'paytirish</b> xuddi vektorlardagidek —
          elementma-element: <Tex>{"(A+B)_{ij} = a_{ij}+b_{ij}"}</Tex>, <Tex>{"(\\lambda A)_{ij} = \\lambda a_{ij}"}</Tex>. Faqat bir xil
          tartibli matritsalarni qo'shish mumkin.
        </Recall>
      </Sec>

      <Sec title="Ko'paytirish: satrni ustunga">
        <p>
          <Tex>{"A_{m\\times p}\\cdot B_{p\\times n} = C_{m\\times n}"}</Tex>. Har bir <Tex>{"c_{ij}"}</Tex> — A ning{" "}
          <b className="hl-row">i-satri</b> va B ning <b className="hl-col">j-ustuni</b> skalyar ko'paytmasi. ▶ ni bosing va har bir katak
          qanday to'lishini kuzating:
        </p>
        <MatMulAnim A={EX_A} B={EX_B} />
        <Recall to="skalyar">
          <Tex>{"c_{ij} = a_{i1}b_{1j} + a_{i2}b_{2j} + \\dots"}</Tex> — bu aynan <Tex>{"\\vec a\\cdot\\vec b = a_1b_1 + a_2b_2 + \\dots"}</Tex>{" "}
          formula. Shuning uchun A ning satri uzunligi B ning ustuni uzunligiga teng bo'lishi shart (p = p).
        </Recall>
        <p>
          <b>Muhim:</b> odatda <Tex>{"AB \\ne BA"}</Tex>. Bu nima uchun shunday ekanini "Matritsalarni ko'paytirish" darsida geometrik
          ko'ramiz — u yerda ko'paytma <i>ikki harakatni ketma-ket bajarish</i> ekan.
        </p>
      </Sec>

      <Sec title="Iqtisodiy misol (HEMIS ma'ruzasidan)">
        <p>
          Korxona 4 xil mahsulot (M₁…M₄) ishlab chiqaradi, 3 xil xom ashyo (S₁, S₂, S₃) ishlatadi. Reja{" "}
          <Tex>{"C = (90,\\ 110,\\ 80,\\ 100)"}</Tex> — har bir mahsulotdan nechta. <Tex>{"A_{4\\times3}"}</Tex> — bitta mahsulot uchun
          xom ashyo sarfi. Unda <Tex>{"D = CA"}</Tex> — har bir xom ashyodan jami qancha kerak:
        </p>
        <MatMulAnim A={ECO_C} B={ECO_A} names={["C", "A"]} rowNames={["Reja"]} colNames={["S₁ xom ashyo", "S₂ xom ashyo", "S₃ xom ashyo"]} />
        <p className="muted small">
          Natija: (1210, 730, 1150). Xom ashyo narxlari <Tex>{"B = (7, 4, 5)^T"}</Tex> bo'lsa, jami xarajat{" "}
          <Tex>{"DB = 1210\\cdot7 + 730\\cdot4 + 1150\\cdot5 = 17140"}</Tex>.
        </p>
      </Sec>

      <Sec title="Transponirlash">
        <TransposeAnim />
        <p className="muted small">
          Xossalar: <Tex>{"(A^T)^T = A,\\ (\\lambda A)^T = \\lambda A^T,\\ (A\\pm B)^T = A^T\\pm B^T,\\ (AB)^T = B^TA^T"}</Tex>. Keyinroq:
          determinant transponirlashda o'zgarmaydi — <Tex>{"\\det A^T = \\det A"}</Tex>.
        </p>
        <Key>
          Hozircha matritsa — shunchaki jadval va hisoblash qoidalari. Keyingi darsda eng muhim qadam: matritsa{" "}
          <b>tekislikni o'zgartiruvchi harakat</b> ekanini ko'ramiz. Shunda bu "g'alati" ko'paytirish qoidasi tabiiy bo'lib qoladi.
        </Key>
      </Sec>
    </LessonShell>
  );
}

/* =================================================================== */
/* MATRITSA = CHIZIQLI ALMASHTIRISH                                    */
/* =================================================================== */
export function AlmashtirishLesson() {
  const [A, setA] = useState<M>([1, -1, 0.5, 1.5]);
  const tl = useTimeline(1, 2);
  const Mt = lerpM(I, A, smooth(tl.t));
  const pv = useMovablePoint([2, 1], { color: C.v, constrain: snap(1) });
  const v: V = [pv.x, pv.y];
  const Av = apply(Mt, v);
  const xi = scale(col1(Mt), v[0]);

  return (
    <LessonShell
      id="almashtirish"
      quiz={[
        {
          q: <><Tex>{"\\begin{pmatrix} 3 & 1 \\\\ 1 & 2 \\end{pmatrix}"}</Tex> almashtirishda <Tex>{"\\hat\\imath = (1,0)"}</Tex> qayerga boradi?</>,
          options: [<Tex>{"(3,\\ 1)"}</Tex>, <Tex>{"(3,\\ 1)\\text{ — 1-satr}"}</Tex>, <Tex>{"(1,\\ 2)"}</Tex>],
          correct: 0,
          explain: "î ning tasviri — 1-USTUN: (3, 1). (Bu misolda 1-satr ham (3,1) — simmetrik matritsa; odatda ustun va satr farq qiladi!)",
        },
        {
          q: <><Tex>{"A\\hat\\imath = (2, 0),\\ A\\hat\\jmath = (1, 3)"}</Tex> bo'lsa, <Tex>{"A\\cdot(1, 2)"}</Tex> = ?</>,
          options: [<Tex>{"(4,\\ 6)"}</Tex>, <Tex>{"(3,\\ 3)"}</Tex>, <Tex>{"(2,\\ 6)"}</Tex>],
          correct: 0,
          explain: "1·(2,0) + 2·(1,3) = (2,0) + (2,6) = (4,6). Matritsa ko'paytmasi = ustunlarning chiziqli kombinatsiyasi.",
        },
      ]}
    >
      <Sec title="Matritsa tekislikni qanday o'zgartiradi">
        <p>
          Endi matritsaga boshqacha qaraymiz: u har bir vektorni yangi vektorga o'tkazuvchi <b>funksiya</b> (HEMIS'da —{" "}
          <b>chiziqli operator</b>): <Tex>{"\\vec y = A\\vec x"}</Tex>. <Tex>{"\\vec y"}</Tex> — <i>tasvir</i>,{" "}
          <Tex>{"\\vec x"}</Tex> — <i>aks tasvir</i>. ▶ ni bosing — butun to'r qanday "egilishini" ko'rasiz.
        </p>
        <p>
          <b>Faqat ikki narsani kuzating:</b> <b style={{ color: C.i }}>î</b> va <b style={{ color: C.j }}>ĵ</b> qayerga boradi. Ular boradigan
          joy — aynan matritsaning <b style={{ color: C.i }}>1-ustuni</b> va <b style={{ color: C.j }}>2-ustuni</b>.
        </p>
        <Figure
          side={
            <>
              <MatrixEditor A={A} onChange={(B) => { setA(B); tl.setT(0); }} presets={PRESETS} />
              <Tex block>{`A\\vec v = ${fmt(v[0])}\\textcolor{#83c167}{\\begin{bmatrix} ${fmt(A[0])} \\\\ ${fmt(A[2])} \\end{bmatrix}} ${term(v[1])}\\textcolor{#fc6255}{\\begin{bmatrix} ${fmt(A[1])} \\\\ ${fmt(A[3])} \\end{bmatrix}} = \\begin{bmatrix} ${fmt(apply(A, v)[0])} \\\\ ${fmt(apply(A, v)[1])} \\end{bmatrix}`}</Tex>
              <p className="muted small">
                Sariq <b>v = ({v[0]}, {v[1]})</b> ni sudrang. U "{v[0]} ta î + {v[1]} ta ĵ" edi — almashtirishdan keyin ham "{v[0]} ta yangi î +{" "}
                {v[1]} ta yangi ĵ" bo'lib qoladi. Mana chiziqlilikning butun siri.
              </p>
            </>
          }
        >
          <Board faint height={420}>
            <TransformedGrid A={Mt} />
            <Arrow tip={xi} color={C.i} opacity={0.6} weight={2} />
            <Arrow tail={xi} tip={Av} color={C.j} opacity={0.6} weight={2} />
            <Arrow tip={col1(Mt)} color={C.i} label="î" weight={4} />
            <Arrow tip={col2(Mt)} color={C.j} label="ĵ" weight={4} />
            <Arrow tip={Av} color={C.v} label={tl.t > 0 ? "Av" : "v"} weight={3} />
            {tl.t === 0 && pv.element}
          </Board>
          <Controls tl={tl} />
          <Legend items={[[C.i, "î → 1-ustun"], [C.j, "ĵ → 2-ustun"], [C.v, "v → Av"], [C.res, "o'zgargan to'r"]]} />
        </Figure>
        <Recall to="kombinatsiya">
          <Tex>{"A\\vec v = x\\cdot(\\text{1-ustun}) + y\\cdot(\\text{2-ustun})"}</Tex> — bu chiziqli kombinatsiya. Ya'ni "satrni ustunga"
          qoidasi va "ustunlar kombinatsiyasi" — bitta narsaning ikki ko'rinishi.
        </Recall>
      </Sec>

      <Sec title="'Chiziqli' so'zi nimani anglatadi">
        <ul className="compact">
          <li>To'r chiziqlari <b>to'g'riligicha</b> qoladi (egilmaydi),</li>
          <li>parallel chiziqlar <b>parallel</b> qoladi va bir xil oraliqda,</li>
          <li>koordinatalar boshi <b>joyida</b> qoladi.</li>
        </ul>
        <p>Algebraik tilda bu ikki shart:</p>
        <Tex block>{"A(\\vec u+\\vec v) = A\\vec u + A\\vec v, \\qquad A(\\lambda\\vec v) = \\lambda A\\vec v"}</Tex>
        <Key>
          <b>Butun kursning markaziy g'oyasi:</b> matritsa = bazis vektorlari qayerga borishi haqidagi yozuv. Keyingi mavzular shu savolning
          turli tomonlari: ikki almashtirishni ketma-ket bajarish (ko'paytma), yuza qanchaga o'zgaradi (determinant), orqaga qaytarish
          (teskari), qaysi yo'nalishlar burilmaydi (xos vektorlar).
        </Key>
      </Sec>
    </LessonShell>
  );
}

/* =================================================================== */
/* MATRITSALARNI KO'PAYTIRISH = KOMPOZITSIYA                           */
/* =================================================================== */
export function KopaytmaLesson() {
  const [A, setA] = useState<M>([0, -1, 1, 0]);
  const [B, setB] = useState<M>([1, 1, 0, 1]);
  const [swap, setSwap] = useState(false);
  const first = swap ? B : A, second = swap ? A : B;
  const tl = useTimeline(2, 1.6);
  const s1 = smooth(Math.min(1, tl.t));
  const s2 = smooth(tl.t - 1);
  const Mt = tl.t <= 1 ? lerpM(I, first, s1) : mul(lerpM(I, second, s2), first);
  const BA = mul(B, A), AB = mul(A, B);
  const prod = swap ? AB : BA;
  const other = swap ? BA : AB;

  return (
    <LessonShell
      id="kopaytma"
      quiz={[
        {
          q: <><Tex>{"BA"}</Tex> ko'paytmasida qaysi almashtirish birinchi bajariladi?</>,
          options: ["B", "A", "Farqi yo'q"],
          correct: 1,
          explain: "Vektor o'ngda turadi: (BA)v = B(Av) — avval A ta'sir qiladi, keyin B. Funksiyalar kompozitsiyasi f(g(x)) kabi o'ngdan chapga o'qiladi.",
        },
        {
          q: "Nima uchun odatda AB ≠ BA?",
          options: ["Chunki hisoblash xato", "Chunki 'avval burib, keyin siljitish' va 'avval siljitib, keyin burish' turli natija beradi", "Aslida doim AB = BA"],
          correct: 1,
          explain: "Harakatlar tartibi muhim. Animatsiyada 'tartibni almashtirish' tugmasi bilan solishtiring — to'r boshqa joyga tushadi.",
        },
      ]}
    >
      <Sec title="Ko'paytma — ikki harakatni ketma-ket bajarish">
        <p>
          Avval <b>{swap ? "B" : "A"}</b> almashtirishini, keyin uning natijasiga <b>{swap ? "A" : "B"}</b> ni qo'llaymiz. Natija yana bitta
          almashtirish — uning matritsasi <Tex>{swap ? "AB" : "BA"}</Tex>. ▶ ni bosing: to'r ikki bosqichda o'zgaradi.
        </p>
        <Figure
          side={
            <>
              <div className="two-ed">
                <div><b>A</b><MatrixEditor A={A} onChange={(x) => { setA(x); tl.setT(0); }} /></div>
                <div><b>B</b><MatrixEditor A={B} onChange={(x) => { setB(x); tl.setT(0); }} /></div>
              </div>
              <button className="btn small" onClick={() => { setSwap(!swap); tl.setT(0); }}>Tartibni almashtirish ⇄</button>
              <Tex block>{`${swap ? "AB" : "BA"} = ${texM(prod)}`}</Tex>
              <p className="muted small">
                Animatsiya oxirida punktir strelkalar va oq kvadrat — teskari tartibdagi natija (<Tex>{swap ? "BA" : "AB"}</Tex>). {prod.every((x, i) => Math.abs(x - other[i]) < 1e-9) ? "Bu juftlik uchun tartib farq qilmadi!" : "Ular ustma-ust tushmaydi — AB ≠ BA."}
              </p>
            </>
          }
        >
          <Board faint height={400}>
            {tl.t >= 2 && (
              <>
                <UnitSquare A={other} color="#ffffff" opacity={0.06} />
                <Arrow tip={col1(other)} color={C.i} opacity={0.45} style="dashed" weight={2} />
                <Arrow tip={col2(other)} color={C.j} opacity={0.45} style="dashed" weight={2} />
              </>
            )}
            <TransformedGrid A={Mt} />
            <UnitSquare A={Mt} color={C.v} opacity={0.2} />
            <Arrow tip={col1(Mt)} color={C.i} label="î" weight={4} />
            <Arrow tip={col2(Mt)} color={C.j} label="ĵ" weight={4} />
          </Board>
          <Controls tl={tl} steps={[`avval ${swap ? "B" : "A"}`, `keyin ${swap ? "A" : "B"}`]} />
        </Figure>
        <p>
          Endi "satrni ustunga" qoidasi nega shunday ekani ko'rinadi: <Tex>{"BA"}</Tex> ning 1-ustuni — bu î ning yakuniy joyi, ya'ni{" "}
          <Tex>{"B\\cdot(A \\text{ ning 1-ustuni})"}</Tex>. Har bir ustun — B ning A ustuniga ta'siri:
        </p>
        <Tex block>{`BA = \\Big[\\,B\\,\\textcolor{#83c167}{\\vec a_1}\\;\\Big|\\;B\\,\\textcolor{#fc6255}{\\vec a_2}\\,\\Big]`}</Tex>
        <Recall to="matritsa">
          O'sha darsdagi formula <Tex>{"c_{ij} = \\sum_k a_{ik}b_{kj}"}</Tex> aynan shuni hisoblaydi. Assotsiativlik{" "}
          <Tex>{"A(BC) = (AB)C"}</Tex> ham endi tushunarli: uchta harakatni qanday guruhlamang, ketma-ketlik bir xil.
        </Recall>
        <Key>
          Birlik matritsa <Tex>{"E"}</Tex> — "hech narsa qilmaslik" (î, ĵ joyida). Shuning uchun <Tex>{"AE = EA = A"}</Tex>. Bu fikr
          teskari matritsa ta'rifining asosi: <Tex>{"A^{-1}A = E"}</Tex>.
        </Key>
      </Sec>
    </LessonShell>
  );
}

/* =================================================================== */
/* DETERMINANT (2×2, geometrik)                                        */
/* =================================================================== */
const PROPS: { id: string; name: string; f: (A: M) => M; text: ReactNode }[] = [
  { id: "swap", name: "Ustunlarni almashtirish", f: (A) => [A[1], A[0], A[3], A[2]], text: <>Ikki ustun (satr) o'rni almashsa, determinant <b>ishorasini</b> o'zgartiradi: î va ĵ joy almashadi, parallelogramm "ag'dariladi" (orientatsiya). Animatsiyada yuza 0 orqali o'tishini ko'ring.</> },
  { id: "scale", name: "Ustunni 2 ga ko'paytirish", f: (A) => [2 * A[0], A[1], 2 * A[2], A[3]], text: <>Bir ustun λ ga ko'paytirilsa, determinant ham λ marta o'zgaradi: parallelogramm bir tomoni bo'yicha cho'ziladi. (Umumiy ko'paytuvchini chiqarish xossasi.)</> },
  { id: "shear", name: "1-ustunga 2-ustunni qo'shish", f: (A) => [A[0] + A[1], A[1], A[2] + A[3], A[3]], text: <>Bir ustunga boshqasini k marta qo'shsak, determinant <b>o'zgarmaydi</b>: parallelogramm asosi bo'ylab "suriladi", balandlik o'zgarmaydi. Gauss usuli aynan shu xossaga tayanadi.</> },
  { id: "prop", name: "Proporsional ustunlar", f: (A) => [A[1] * 0.5, A[1], A[3] * 0.5, A[3]], text: <>Ustunlar proporsional bo'lsa (bir chiziqda), parallelogramm yassi — determinant <b>0</b>. Bu chiziqli bog'liqlikning o'zi.</> },
];

export function DeterminantLesson() {
  const [A, setA] = useState<M>([2, 1, 0.5, 1.5]);
  const tl = useTimeline(1, 2);
  const Mt = lerpM(I, A, smooth(tl.t));
  const d = det(Mt);
  // Xossalar bo'limi: o'z rasmi va o'z vaqt chizig'i (A → A')
  const [propId, setPropId] = useState<string>(PROPS[0].id);
  const ptl = useTimeline(1, 2);
  const target = PROPS.find((p) => p.id === propId)!.f(A);
  const Pt = lerpM(A, target, smooth(ptl.t));
  const pd = det(Pt);
  const tri: V[] = [[2.5, -2.5], [3.5, -2.5], [2.5, -1.5]];
  const triT = tri.map((p) => apply(Mt, p));
  const triArea0 = 0.5;
  const col = d >= 0 ? C.res : C.orange;
  const center = apply(Mt, [0.5, 0.5]);

  return (
    <LessonShell
      id="determinant"
      quiz={[
        {
          q: <><Tex>{"\\det\\begin{pmatrix} 3 & 1 \\\\ 2 & 4 \\end{pmatrix}"}</Tex> = ?</>,
          options: ["10", "14", "−2"],
          correct: 0,
          explain: "ad − bc = 3·4 − 1·2 = 10. Birlik kvadrat yuzasi 10 marta kattalashadi.",
        },
        {
          q: "det A = −2 bo'lsa…",
          options: ["Yuza 2 marta kichrayadi", "Yuza 2 marta kattalashadi va tekislik 'ag'dariladi'", "Almashtirish mavjud emas"],
          correct: 1,
          explain: "|det| = 2 — yuza koeffitsiyenti; manfiy ishora — orientatsiya o'zgargan (î va ĵ tartibi teskari).",
        },
        {
          q: <>det A = 3, det B = 2. <Tex>{"\\det(AB)"}</Tex> = ?</>,
          options: ["5", "6", "Aniqlab bo'lmaydi"],
          correct: 1,
          explain: "Avval B yuzani 2 marta, keyin A 3 marta kattalashtiradi: jami 6. det(AB) = det A · det B (13-xossa).",
        },
      ]}
    >
      <Sec title="Determinant — yuza koeffitsiyenti">
        <p>
          Almashtirish birlik kvadratni (yuzasi 1) <b>parallelogramm</b>ga aylantiradi. Uning yuzasi — <b>determinant</b>. ▶ ni bosing:
          kvadrat bilan birga istalgan shakl (<b style={{ color: C.w }}>pushti uchburchak</b>) ham <b>xuddi shuncha marta</b> kattalashadi.
        </p>
        <Figure
          side={
            <>
              <MatrixEditor A={A} onChange={(B) => { setA(B); tl.setT(0); ptl.setT(0); }} presets={PRESETS} />
              <Tex block>{`\\begin{aligned} \\det A &= ad - bc \\\\ &= ${pf(A[0])}\\cdot${pf(A[3])} - ${pf(A[1])}\\cdot${pf(A[2])} \\\\ &= ${fmt(det(A))} \\end{aligned}`}</Tex>
              <p>Hozirgi yuza: <b style={{ color: col }}>{fmt(d)}</b></p>
              <p className="muted small">
                Uchburchak yuzasi: {fmt(triArea0)} → <b>{fmt(Math.abs(d) * triArea0)}</b> (= {fmt(triArea0)} × |det|).{" "}
                {d < -1e-9 && "Manfiy: tekislik ag'darildi — î dan ĵ ga aylanish yo'nalishi teskari bo'ldi (to'q sariq)."}
                {Math.abs(d) < 1e-6 && tl.t > 0.99 && "Nol: tekislik chiziqqa yassilandi!"}
              </p>
            </>
          }
        >
          <Board faint height={400}>
            <TransformedGrid A={Mt} opacity={0.3} />
            <UnitSquare A={Mt} color={col} opacity={0.35} />
            <Polygon points={triT} color={C.w} fillOpacity={0.35} />
            <Arrow tip={col1(Mt)} color={C.i} label="î" weight={4} />
            <Arrow tip={col2(Mt)} color={C.j} label="ĵ" weight={4} />
            <Text x={center[0]} y={center[1]} color="#fff" size={16}>{fmt(d)}</Text>
          </Board>
          <Controls tl={tl} />
        </Figure>
        <p>
          <b>Formula qayerdan?</b> Agar <Tex>{"b = c = 0"}</Tex> bo'lsa, kvadrat <Tex>{"a\\times d"}</Tex> to'g'ri to'rtburchakka aylanadi —
          yuza <Tex>{"ad"}</Tex>. <Tex>{"b, c"}</Tex> qo'shilganda parallelogramm qiyshayadi va yuzadan <Tex>{"bc"}</Tex> "kesiladi":{" "}
          <Tex>{"ad - bc"}</Tex>.
        </p>
      </Sec>

      <Sec title="Xossalar — rasmda">
        <p>
          HEMIS ma'ruzasidagi xossalarni yodlash shart emas — ular parallelogrammga nima bo'lishidan kelib chiqadi. Xossani tanlang va ▶
          ni bosing. Xira parallelogramm — boshlang'ich A, rangli — o'zgarayotgan matritsa.
        </p>
        <div className="presets">
          {PROPS.map((p) => (
            <button key={p.id} className={"chip" + (propId === p.id ? " on" : "")} onClick={() => { setPropId(p.id); ptl.setT(0); setTimeout(ptl.play, 50); }}>
              {p.name}
            </button>
          ))}
        </div>
        <Figure
          side={
            <>
              <div className="prop-text-side">{PROPS.find((p) => p.id === propId)!.text}</div>
              <Tex block>{`${texM(A)} \\to ${texM(target)}`}</Tex>
              <p>
                det: <b>{fmt(det(A))}</b> → <b style={{ color: pd >= 0 ? C.res : C.orange }}>{fmt(pd)}</b>
              </p>
            </>
          }
        >
          <Board height={340} x={[-2, 4.5]} y={[-1.5, 3.5]}>
            <UnitSquare A={A} color={C.muted} opacity={0.12} />
            <UnitSquare A={Pt} color={pd >= 0 ? C.res : C.orange} opacity={0.35} />
            <Arrow tip={col1(Pt)} color={C.i} label="1-ustun" weight={4} />
            <Arrow tip={col2(Pt)} color={C.j} label="2-ustun" weight={4} />
          </Board>
          <Controls tl={ptl} />
        </Figure>
        <Recall to="boglik">
          <Tex>{"\\det A = 0 \\iff"}</Tex> ustunlar chiziqli bog'liq. "Bog'liqlik" darsidagi tekshiruv{" "}
          <Tex>{"v_1w_2 - v_2w_1"}</Tex> aynan determinant edi.
        </Recall>
        <Recall to="kopaytma">
          <Tex>{"\\det(AB) = \\det A\\cdot\\det B"}</Tex>: avval B yuzani <Tex>{"\\det B"}</Tex> marta, keyin A <Tex>{"\\det A"}</Tex> marta
          o'zgartiradi.
        </Recall>
      </Sec>
    </LessonShell>
  );
}

/* =================================================================== */
/* 3-TARTIBLI DETERMINANT: SARRUS VA LAPLAS                            */
/* =================================================================== */
type M3 = number[][];
const det2 = (a: number, b: number, c: number, d: number) => a * d - b * c;
const minor = (A: M3, i: number, j: number) => {
  const r = A.filter((_, k) => k !== i).map((row) => row.filter((_, l) => l !== j));
  return det2(r[0][0], r[0][1], r[1][0], r[1][1]);
};
const det3 = (A: M3) => A[0].reduce((s, a, j) => s + a * (j % 2 ? -1 : 1) * minor(A, 0, j), 0);

const SARRUS: { cells: [number, number][]; sign: 1 | -1 }[] = [
  { cells: [[0, 0], [1, 1], [2, 2]], sign: 1 },
  { cells: [[0, 1], [1, 2], [2, 3]], sign: 1 },
  { cells: [[0, 2], [1, 3], [2, 4]], sign: 1 },
  { cells: [[0, 2], [1, 1], [2, 0]], sign: -1 },
  { cells: [[0, 3], [1, 2], [2, 1]], sign: -1 },
  { cells: [[0, 4], [1, 3], [2, 2]], sign: -1 },
];

function Det3Editor({ A, onChange }: { A: M3; onChange: (A: M3) => void }) {
  return (
    <div className="m3-editor">
      {A.map((row, i) => row.map((x, j) => (
        <input key={i + "" + j} type="number" value={x} onChange={(e) => {
          const n = Number(e.target.value);
          if (Number.isNaN(n)) return;
          onChange(A.map((r, a) => r.map((y, b) => (a === i && b === j ? n : y))));
        }} />
      )))}
    </div>
  );
}

export function Det3Lesson() {
  const [A, setA] = useState<M3>([[2, 6, 2], [1, 5, 4], [3, 1, 0]]);
  const D = det3(A);
  const ext = A.map((r) => [...r, r[0], r[1]]);
  const tl = useTimeline(6, 1.3);
  const k = Math.min(5, Math.floor(tl.t));
  const done = tl.t >= 6 ? 6 : k;
  const prods = SARRUS.map((s) => s.sign * s.cells.reduce((p, [i, j]) => p * ext[i][j], 1));
  const sumSoFar = prods.slice(0, tl.t >= 6 ? 6 : k + 1).reduce((a, b) => a + b, 0);

  const [row, setRow] = useState(0);
  const lt = useTimeline(3, 1.6);
  const lj = Math.min(2, Math.floor(lt.t));
  const terms = [0, 1, 2].map((j) => ({ a: A[row][j], sign: (row + j) % 2 ? -1 : 1, M: minor(A, row, j) }));
  const lsum = terms.slice(0, lt.t >= 3 ? 3 : lj + 1).reduce((s, t) => s + t.a * t.sign * t.M, 0);
  const subM = A.filter((_, a) => a !== row).map((r) => r.filter((_, b) => b !== lj));

  return (
    <LessonShell
      id="det3"
      quiz={[
        {
          q: <><Tex>{"a_{23}"}</Tex> elementining algebraik to'ldiruvchisi <Tex>{"A_{23}"}</Tex> qanday?</>,
          options: [<Tex>{"M_{23}"}</Tex>, <Tex>{"-M_{23}"}</Tex>, <Tex>{"a_{23}M_{23}"}</Tex>],
          correct: 1,
          explain: "A_ij = (−1)^(i+j)·M_ij; 2+3 = 5 — toq, shuning uchun minus. Shaxmat taxtasi: + − + / − + − / + − +.",
        },
        {
          q: "Laplas yoyilmasi uchun qaysi satrni tanlash qulay?",
          options: ["Har doim 1-satrni", "Eng ko'p nol bor satr yoki ustunni", "Eng katta sonlar bor satrni"],
          correct: 1,
          explain: "Nol elementning hadi 0 bo'ladi — uning minorini hisoblash shart emas.",
        },
        {
          q: "Ikki satri bir xil bo'lgan determinant nimaga teng?",
          options: ["1", "0", "Satrlar yig'indisiga"],
          correct: 1,
          explain: "Satrlarni almashtirsak ishora o'zgaradi (Δ → −Δ), lekin determinant o'zi o'zgarmaydi: Δ = −Δ ⇒ Δ = 0. Geometrik: hajm yassi.",
        },
      ]}
    >
      <Sec title="Sarrus usuli — 6 ta diagonal">
        <p>
          3×3 determinantning o'ng tomoniga 1- va 2-ustunlarni qayta yozamiz (3×5 jadval). Bosh diagonalga parallel 3 ta diagonal{" "}
          <b style={{ color: C.res }}>"+"</b> bilan, yordamchi diagonalga parallel 3 tasi <b style={{ color: C.orange }}>"−"</b> bilan olinadi.
          ▶ ni bosing:
        </p>
        <Figure
          side={
            <>
              <Det3Editor A={A} onChange={(x) => { setA(x); tl.setT(0); lt.setT(0); }} />
              <div className="sarrus-terms">
                {prods.map((p, i) => (
                  <div key={i} className={"sterm" + (i < done || (i === k && tl.t > 0) ? " on" : "") + (i === k && tl.t > 0 && tl.t < 6 ? " cur" : "")} style={{ color: SARRUS[i].sign > 0 ? C.res : C.orange }}>
                    {SARRUS[i].sign > 0 ? "+" : "−"} {SARRUS[i].cells.map(([a, b]) => (ext[a][b] < 0 ? `(${fmt(ext[a][b])})` : fmt(ext[a][b]))).join("·")} = {fmt(p)}
                  </div>
                ))}
              </div>
              <p>Yig'indi: <b>{tl.t > 0 ? fmt(sumSoFar) : "—"}</b> {tl.t >= 6 && <>= Δ</>}</p>
            </>
          }
        >
          <div className="sarrus">
            <MatGrid M={ext} bars splitAfter={2} hiCells={tl.t > 0 ? SARRUS[k].cells : []} hiTone={SARRUS[k].sign > 0 ? "accent" : "neg"} dim={(_, j) => j > 2} />
          </div>
          <Controls tl={tl} />
        </Figure>
      </Sec>

      <Sec title="Laplas teoremasi — satr bo'yicha yoyish">
        <p>
          Boshqa yo'l: bitta satrni tanlaymiz. Har bir element <Tex>{"a_{ij}"}</Tex> uchun uning satri va ustunini o'chiramiz — qolgan
          2×2 determinant <b>minor</b> <Tex>{"M_{ij}"}</Tex>. Ishora shaxmat tartibida: <Tex>{"A_{ij} = (-1)^{i+j}M_{ij}"}</Tex> —{" "}
          <b>algebraik to'ldiruvchi</b>.
        </p>
        <Tex block>{"\\Delta = a_{i1}A_{i1} + a_{i2}A_{i2} + a_{i3}A_{i3}"}</Tex>
        <div className="presets">
          {[0, 1, 2].map((i) => (
            <button key={i} className={"chip" + (row === i ? " on" : "")} onClick={() => { setRow(i); lt.setT(0); }}>{i + 1}-satr bo'yicha</button>
          ))}
        </div>
        <Figure
          side={
            <>
              <div className="laplace-step">
                <Tex>{`a_{${row + 1}${lj + 1}} = ${fmt(A[row][lj])},\\quad (-1)^{${row + 1}+${lj + 1}} = ${terms[lj].sign > 0 ? "+1" : "-1"}`}</Tex>
                <MatGrid M={subM} bars label={<Tex>{`M_{${row + 1}${lj + 1}} = ${fmt(terms[lj].M)}`}</Tex>} />
              </div>
              <Tex block>{`\\begin{aligned} \\Delta = ${terms.map((t, j) => `&${j === 0 ? "" : "\\;"}${j <= lj || lt.t >= 3 ? `${t.sign > 0 ? "+" : "-"}\\,${pf(t.a)}\\cdot(${fmt(t.M)})` : `\\color{#555}{\\square}`}`).join(" \\\\ ")} \\end{aligned}`}</Tex>
              <p>Hozircha: <b>{lt.t > 0 ? fmt(lsum) : "—"}</b> {lt.t >= 3 && <>= {fmt(D)} ✓</>}</p>
            </>
          }
        >
          <MatGrid
            M={A}
            bars
            hiCells={lt.t > 0 ? [[row, lj]] : []}
            dim={(i, j) => lt.t > 0 && (i === row || j === lj) && !(i === row && j === lj)}
            label={<span className="chess">ishoralar: <Tex>{"\\begin{smallmatrix} + & - & + \\\\ - & + & - \\\\ + & - & + \\end{smallmatrix}"}</Tex></span>}
          />
          <Controls tl={lt} steps={["1-had", "2-had", "3-had"]} />
        </Figure>
        <p className="muted small">Qaysi satrni tanlamang — natija bir xil ({fmt(D)}). Nol ko'p satrni tanlash hisobni qisqartiradi.</p>
        <Recall to="determinant">
          Geometrik ma'no saqlanadi: 3×3 determinant — uchta ustun-vektordan yasalgan <b>parallelepiped hajmi</b> (ishorasi bilan). Barcha
          xossalar (satr almashsa — ishora, proporsional satrlar — 0, satrga boshqasini qo'shish — o'zgarmaydi) xuddi 2×2 dagi sabab bilan
          bajariladi.
        </Recall>
        <Key>
          4×4 va undan katta determinantlar ham Laplas bilan hisoblanadi: n-tartibli → n ta (n−1)-tartibli. Amalda esa tezroq yo'l —{" "}
          <b>Gauss usuli</b> bilan uchburchak ko'rinishga keltirish: shunda determinant diagonal elementlar ko'paytmasi (8-xossa).
        </Key>
      </Sec>
    </LessonShell>
  );
}

void add; void Line;
