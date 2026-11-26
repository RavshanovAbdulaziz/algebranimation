import type { ReactNode } from "react";
import { Tex } from "../components/Tex";
import { det2, pick, ri, rnz, tmat, tn, tp } from "./core";

/*
 * Matritsa usuli va Gauss usulining "nima qilyapmiz va nega" tushuntirishli qadamlari.
 * Har bir qadam: maqsad → sabab → hisob (element-element) → natija.
 * Misol ham, mashqdagi tasodifiy misollar ham shu funksiyalardan o'tadi.
 */

const HL = "#58c4dd"; // o'zgargan satr
const GOAL = "#ffd166"; // nolga aylantirilayotgan son

/** a·x + b·y + c·z ko'rinishidagi chap tomon */
export const lhsTex = (cs: number[], vars: string[]) =>
  cs
    .map((k, i) => (k === 0 ? "" : `${k < 0 ? "-" : cs.slice(0, i).some((z) => z !== 0) ? "+" : ""} ${Math.abs(k) === 1 ? "" : Math.abs(k)}${vars[i]}`))
    .join(" ")
    .trim() || "0";
export const sysTex = (A: number[][], b: number[], vars: string[]) =>
  `\\begin{cases} ${A.map((r, i) => `${lhsTex(r, vars)} = ${tn(b[i])}`).join(" \\\\ ")} \\end{cases}`;

/** Kengaytirilgan matritsa: hiRow — o'zgargan satr, marks — nolga aylantiriladigan kataklar */
function aug(M: number[][], opt: { hiRow?: number; marks?: [number, number][] } = {}) {
  const n = M[0].length - 1;
  const body = M.map((r, i) =>
    r
      .map((x, j) => {
        const s = tn(x);
        if (opt.marks?.some(([a, b]) => a === i && b === j)) return `\\boxed{\\color{${GOAL}}{${s}}}`;
        if (opt.hiRow === i) return `\\color{${HL}}{${s}}`;
        return s;
      })
      .join(" & "),
  ).join(" \\\\ ");
  return `\\left(\\begin{array}{${"r".repeat(n)}|r} ${body} \\end{array}\\right)`;
}

/** "R_2 - 3R_1" yozuvi */
function opTex(i: number, k: number, c: number) {
  const a = Math.abs(k);
  const coef = a === 1 ? "" : tn(a);
  return `R_${i + 1} ${k > 0 ? "-" : "+"} ${coef}R_${c + 1}`;
}

/** Tenglamaga ma'lum qiymatlarni qo'yish: 2x + 3·(1) − (−2) */
function substTex(coefs: number[], vals: (number | null)[], vars: string[]) {
  const parts: string[] = [];
  coefs.forEach((k, i) => {
    if (k === 0) return;
    const sign = k < 0 ? "-" : parts.length ? "+" : "";
    const a = Math.abs(k);
    if (vals[i] === null) parts.push(`${sign} ${a === 1 ? "" : a}${vars[i]}`);
    else parts.push(`${sign} ${a === 1 ? "" : `${a}\\cdot`}${tp(vals[i] as number)}`);
  });
  return parts.join(" ").trim();
}

/** Koeffitsiyent + harf: 1·y → y, −1·y → −y, 3·y → 3y */
const cf = (k: number, v: string) => (k === 1 ? v : k === -1 ? `-${v}` : `${tn(k)}${v}`);

const VARS = ["x", "y", "z"];
const ORD = ["birinchi", "ikkinchi", "uchinchi"];

/* ================================================================== */
/* GAUSS USULI (3 noma'lum)                                            */
/* ================================================================== */

export function gaussSteps(A: number[][], b: number[]): ReactNode[] {
  let M = A.map((r, i) => [...r, b[i]]);
  const steps: ReactNode[] = [];

  steps.push(
    <>
      <b>Sistemani jadvalga ko'chiramiz.</b> Har bir satr — bitta tenglama. Chiziqdan chapda x, y, z oldidagi sonlar, o'ngda tenglikdan
      keyingi son. Bunday jadval <b>kengaytirilgan matritsa</b> deyiladi — bu shunchaki qisqa yozuv, x, y, z larni har safar
      qayta yozmaslik uchun.
      <Tex block>{`${sysTex(A, b, VARS)}\\quad\\longrightarrow\\quad ${aug(M)}`}</Tex>
    </>,
  );
  steps.push(
    <>
      <b>Maqsad — "zinapoya".</b> Diagonal ostidagi uchta sonni (sariq ramkadagilar) <b>0 ga aylantiramiz</b>. Shunda oxirgi satrda
      faqat z qoladi va uni darhol topamiz, keyin pastdan yuqoriga y va x ni topamiz.
      <Tex block>{aug(M, { marks: [[1, 0], [2, 0], [2, 1]] })}</Tex>
      Buning uchun bitta amaldan foydalanamiz: <b>bir satrdan boshqa satrni biror songa ko'paytirib ayirish</b>. Bu — bir tenglamadan
      boshqa tenglamani ayirish degani, shuning uchun sistemaning yechimi o'zgarmaydi.
    </>,
  );

  for (let c = 0; c < 2; c++) {
    const pivot = M[c][c];
    for (let i = c + 1; i < 3; i++) {
      const target = M[i][c];
      if (target === 0) {
        steps.push(<>{i + 1}-satrning {ORD[c]} soni allaqachon 0 — bu satrga tegmaymiz.</>);
        continue;
      }
      const k = target / pivot;
      const row = M[i].map((x, j) => x - k * M[c][j]);
      const M2 = M.map((r, a) => (a === i ? row : r));
      const calc = M[i].map((x, j) => `${tn(x)} ${k > 0 ? "-" : "+"} ${Math.abs(k) === 1 ? "" : `${tn(Math.abs(k))}\\cdot`}${tp(M[c][j])}`);
      steps.push(
        <>
          <b>{i + 1}-satrdagi {ORD[c]} sonni (<Tex>{tn(target)}</Tex>) 0 ga aylantiramiz.</b> Buning uchun {c + 1}-satrdan
          foydalanamiz — unda shu ustunda <Tex>{tn(pivot)}</Tex> turibdi.{" "}
          {k === 1 ? (
            <>Ikkala satrda bu son bir xil, shuning uchun {i + 1}-satrdan {c + 1}-satrni shunchaki ayiramiz:{" "}
              <Tex>{`${tn(target)} - ${tp(pivot)} = 0`}</Tex>.</>
          ) : (
            <>
              {c + 1}-satrni <Tex>{tn(k)}</Tex> ga ko'paytirsak, shu joyda aynan <Tex>{tn(target)}</Tex> hosil bo'ladi (
              <Tex>{`${tp(pivot)}\\cdot${tp(k)}=${tn(target)}`}</Tex>). Endi uni {i + 1}-satrdan ayirsak, nol chiqadi:{" "}
              <Tex>{`${tn(target)} - ${tp(target)} = 0`}</Tex>.
              {k < 0 && <> Manfiy sonni ayirish — qo'shish bilan bir xil, shuning uchun yozuvda <Tex>{opTex(i, k, c)}</Tex> ko'rinishida chiqadi.</>}
            </>
          )}
          {c === 1 && (
            <> E'tibor bering: buning uchun <b>2-satrdan</b> foydalanamiz, 1-satrdan emas. 2-satrning birinchi soni 0, shuning uchun
              3-satrning birinchi ustunida oldin hosil qilgan nolimiz buzilmaydi.</>
          )}
          <br />Bu amal butun satrga — o'ng tomondagi son bilan birga — qo'llanadi:
          <Tex block>{`${opTex(i, k, c)}:\\quad (${calc.slice(0, 3).join(";\\ \\ ")}\\ \\,|\\ \\,${calc[3]}) = (${row.slice(0, 3).map(tn).join(";\\ ")}\\ |\\ ${tn(row[3])})`}</Tex>
          <Tex block>{aug(M2, { hiRow: i })}</Tex>
        </>,
      );
      M = M2;
    }
  }

  const U = M.map((r) => r.slice(0, 3));
  const r = M.map((row) => row[3]);
  steps.push(
    <>
      <b>Zinapoya tayyor.</b> Endi jadvalni qaytadan tenglamalar ko'rinishiga keltiramiz — har bir satr yana tenglama bo'ladi:
      <Tex block>{sysTex(U, r, VARS)}</Tex>
      Oxirgi tenglamada faqat bitta noma'lum qoldi — endi pastdan yuqoriga yechamiz.
    </>,
  );

  const z = r[2] / U[2][2];
  steps.push(
    <>
      <b>3-tenglamadan z ni topamiz:</b>{" "}
      <Tex>{`${lhsTex(U[2], VARS)} = ${tn(r[2])}${U[2][2] === 1 ? "" : `\\quad\\Rightarrow\\quad z = \\frac{${tn(r[2])}}{${tn(U[2][2])}} = ${tn(z)}`}`}</Tex>
    </>,
  );
  const y = (r[1] - U[1][2] * z) / U[1][1];
  const ry = r[1] - U[1][2] * z;
  steps.push(
    <>
      <b>2-tenglamaga <Tex>{`z=${tn(z)}`}</Tex> ni qo'yamiz</b>, ma'lum sonni o'ng tomonga o'tkazamiz va y ni topamiz:
      <Tex block>{`${substTex(U[1], [null, null, z], VARS)} = ${tn(r[1])}\\quad\\Rightarrow\\quad ${cf(U[1][1], "y")} = ${tn(ry)}${U[1][1] === 1 ? "" : `\\quad\\Rightarrow\\quad y = \\frac{${tn(ry)}}{${tn(U[1][1])}} = ${tn(y)}`}`}</Tex>
    </>,
  );
  const x = (r[0] - U[0][1] * y - U[0][2] * z) / U[0][0];
  const rx = r[0] - U[0][1] * y - U[0][2] * z;
  steps.push(
    <>
      <b>1-tenglamaga <Tex>{`y=${tn(y)}`}</Tex> va <Tex>{`z=${tn(z)}`}</Tex> ni qo'yamiz</b>, ma'lum sonlarni o'ng tomonga o'tkazamiz va x ni topamiz:
      <Tex block>{`${substTex(U[0], [null, y, z], VARS)} = ${tn(r[0])}\\quad\\Rightarrow\\quad ${cf(U[0][0], "x")} = ${tn(rx)}${U[0][0] === 1 ? "" : `\\quad\\Rightarrow\\quad x = \\frac{${tn(rx)}}{${tn(U[0][0])}} = ${tn(x)}`}`}</Tex>
    </>,
  );  const sol = [x, y, z];
  const chk = A[1].reduce((s, a, j) => s + a * sol[j], 0);
  steps.push(
    <>
      <b>Javob:</b> <Tex>{`x=${tn(x)},\\ \\ y=${tn(y)},\\ \\ z=${tn(z)}`}</Tex>. <b>Tekshiruv</b> — dastlabki 2-tenglamaga qo'yamiz:{" "}
      <Tex>{`${substTex(A[1], sol, VARS)} = ${tn(chk)}`}</Tex> {chk === b[1] ? "✓ to'g'ri." : "✗"}
    </>,
  );
  return steps;
}

/** Gauss uchun "qulay" sistema: bosh elementlar 1 va ±1, hamma hisob butun sonlarda */
export function makeGauss(): { A: number[][]; b: number[]; x: number[] } {
  const l21 = rnz(-3, 3), l31 = rnz(-3, 3), l32 = ri(-2, 2);
  const U = [[1, ri(-3, 3), ri(-3, 3)], [0, pick([1, -1]), ri(-3, 3)], [0, 0, rnz(-3, 3)]];
  const A = [U[0], U[0].map((u, j) => l21 * u + U[1][j]), U[0].map((u, j) => l31 * u + l32 * U[1][j] + U[2][j])];
  const x = [ri(-3, 4), ri(-3, 4), ri(-3, 4)];
  return { A, b: A.map((r) => r.reduce((s, a, j) => s + a * x[j], 0)), x };
}

/* ================================================================== */
/* MATRITSA USULI (2 noma'lum)                                         */
/* ================================================================== */

export function matrixSteps(A: number[][], b: number[]): ReactNode[] {
  const [[a, bb], [c, d]] = A;
  const D = det2(A);
  const adj = [[d, -bb], [-c, a]];
  const adjB = adj.map((r) => r[0] * b[0] + r[1] * b[1]);
  const x = adjB.map((v) => v / D);
  const B = tmat(b.map((v) => [v]));
  // 1/det: daftardagidek, minus kasr oldida (−1/5, 1/−5 emas)
  const frac = D === 1 ? "" : D === -1 ? "-" : D < 0 ? `-\\frac{1}{${tn(-D)}}` : `\\frac{1}{${tn(D)}}`;
  const chk = a * x[0] + bb * x[1];
  return [
    <>
      <b>Sistemani matritsalar ko'rinishida yozamiz.</b> <b>A</b> — x va y oldidagi sonlar jadvali, <b>X</b> — noma'lumlar ustuni,{" "}
      <b>B</b> — o'ng tomondagi sonlar ustuni:
      <Tex block>{`${sysTex(A, b, ["x", "y"])}\\quad\\longrightarrow\\quad ${tmat(A)}\\cdot\\begin{pmatrix}x\\\\y\\end{pmatrix} = ${B}`}</Tex>
      Tekshirib ko'ring: chapdagi ko'paytmani "satrni ustunga" bajarsak, aynan sistemadagi tenglamalar chiqadi. Demak sistema qisqacha{" "}
      <Tex>{"A\\cdot X=B"}</Tex>.
    </>,
    <>
      <b>Nima uchun teskari matritsa kerak?</b> Oddiy tenglamada, masalan <Tex>{"3x=6"}</Tex> bo'lsa, ikki tomonni 3 ga bo'lamiz
      (ya'ni <Tex>{"\\frac13"}</Tex> ga ko'paytiramiz). Matritsaga bo'lish amali yo'q. Uning o'rniga ikki tomonni chapdan{" "}
      <Tex>{"A^{-1}"}</Tex> ga ko'paytiramiz. <Tex>{"A^{-1}\\cdot A=E"}</Tex> — birlik matritsa (sonlardagi 1 kabi), shuning uchun
      chapda faqat X qoladi:
      <Tex block>{"A^{-1}\\cdot A\\cdot X=A^{-1}\\cdot B\\quad\\Rightarrow\\quad E\\cdot X=A^{-1}\\cdot B\\quad\\Rightarrow\\quad X=A^{-1}\\cdot B"}</Tex>
      Demak ish uch qadamdan iborat: determinantni tekshirish, <Tex>{"A^{-1}"}</Tex> ni topish, uni B ga ko'paytirish.
    </>,
    <>
      <b>1-qadam: determinant.</b> Teskari matritsa faqat determinant 0 bo'lmaganda mavjud, shuning uchun avval uni hisoblaymiz:
      <Tex block>{`\\det A = ${tmat(A, "v")} = ${tp(a)}\\cdot${tp(d)} - ${tp(bb)}\\cdot${tp(c)} = ${tn(D)}`}</Tex>
      <Tex>{`${tn(D)}\\neq0`}</Tex> — teskari matritsa bor, davom etamiz.
    </>,
    <>
      <b>2-qadam: teskari matritsa.</b> 2×2 uchun qoida: bosh diagonaldagi <Tex>{tn(a)}</Tex> va <Tex>{tn(d)}</Tex> ning
      o'rni almashadi, yon diagonaldagi <Tex>{tn(bb)}</Tex> va <Tex>{tn(c)}</Tex> ning ishorasi o'zgaradi, oldiga{" "}
      <Tex>{"\\frac{1}{\\det A}"}</Tex> yoziladi:
      <Tex block>{`A^{-1} = \\frac{1}{${tn(D)}}${tmat(adj)}${D < 0 ? ` = ${frac}${tmat(adj)}` : ""}`}</Tex>
      {Math.abs(D) !== 1 && <>Kasrlar bilan ovora bo'lmaslik uchun <Tex>{frac}</Tex> ni hozircha oldida qoldiramiz va eng oxirida ko'paytiramiz.</>}
    </>,
    <>
      <b>3-qadam: <Tex>{"A^{-1}"}</Tex> ni B ga ko'paytiramiz</b> — "satrni ustunga": 1-satr natijasi x ni, 2-satr natijasi y ni beradi.
      <Tex block>{`X = ${frac}${tmat(adj)}\\cdot${B} = ${frac}\\begin{pmatrix} ${tp(adj[0][0])}\\cdot${tp(b[0])} + ${tp(adj[0][1])}\\cdot${tp(b[1])} \\\\ ${tp(adj[1][0])}\\cdot${tp(b[0])} + ${tp(adj[1][1])}\\cdot${tp(b[1])} \\end{pmatrix} = ${frac}${tmat(adjB.map((v) => [v]))}${D === 1 ? "" : ` = ${tmat(x.map((v) => [v]))}`}`}</Tex>
    </>,
    <>
      <b>Javob:</b> <Tex>{`x=${tn(x[0])},\\ \\ y=${tn(x[1])}`}</Tex>. <b>Tekshiruv</b> — 1-tenglamaga qo'yamiz:{" "}
      <Tex>{`${substTex(A[0], x, ["x", "y"])} = ${tn(chk)}`}</Tex> {chk === b[0] ? "✓ to'g'ri." : "✗"}
    </>,
  ];
}
