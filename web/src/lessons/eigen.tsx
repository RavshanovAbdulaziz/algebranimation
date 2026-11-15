import { useState } from "react";
import { Line, Plot, Point, useMovablePoint, Coordinates } from "mafs";
import { LessonShell, Sec, Recall, Key } from "../components/LessonShell";
import { Arrow, Board, C, Controls, Figure, MatrixEditor, Slider, TransformedGrid, snap, useTimeline } from "../components/viz";
import { Tex } from "../components/Tex";
import { apply, cross, det, eigen, fmt, I, len, lerpM, smooth, type M, type V } from "../lib/la";
import { Mafs } from "mafs";

// 16 ta yo'nalish (22.5° qadam) — namunaviy matritsalarning xos yo'nalishlarini o'z ichiga oladi
const RING: V[] = Array.from({ length: 16 }, (_, k) => {
  const a = (k / 16) * 2 * Math.PI;
  return [2 * Math.cos(a), 2 * Math.sin(a)];
});

const EPRESETS: { name: string; A: M }[] = [
  { name: "Simmetrik [2 1; 1 2]", A: [2, 1, 1, 2] },
  { name: "[3 1; 0 2]", A: [3, 1, 0, 2] },
  { name: "Siljitish [1 1; 0 1]", A: [1, 1, 0, 1] },
  { name: "Burish 90° (haqiqiy λ yo'q)", A: [0, -1, 1, 0] },
  { name: "2E (hamma vektor xos)", A: [2, 0, 0, 2] },
];

export function XosLesson() {
  const [A, setA] = useState<M>([2, 1, 1, 2]);
  const tl = useTimeline(1, 2.2);
  const Mt = lerpM(I, A, smooth(tl.t));
  const { values, vectors } = eigen(A);
  const pv = useMovablePoint([1.5, 0.5], { color: C.v, constrain: snap(0.5) });
  const v: V = [pv.x, pv.y];
  const Av = apply(A, v);
  const isEig = len(v) > 1e-9 && Math.abs(cross(v, Av)) < 1e-9;
  const lamV = isEig ? (Math.abs(v[0]) > 1e-9 ? Av[0] / v[0] : Av[1] / v[1]) : null;
  const scalarM = A[1] === 0 && A[2] === 0 && A[0] === A[3]; // λE: har qanday vektor xos
  const onEigLine = (p: V) => scalarM || vectors.some((e) => Math.abs(cross(e, p)) < 1e-6);
  // Xos yo'nalishdagi strelkalar (uzunligi aylana radiusi = 2, ikki tomonga)
  const eigArrows: V[] = scalarM ? RING : vectors.flatMap((e) => [[2 * e[0], 2 * e[1]], [-2 * e[0], -2 * e[1]]] as V[]);

  const [lam, setLam] = useState(0);
  const Bl: M = [A[0] - lam, A[1], A[2], A[3] - lam];
  const dl = det(Bl);
  const tr = A[0] + A[3], dA = det(A);
  const flat = Math.abs(dl) < 1e-6;

  return (
    <LessonShell
      id="xos"
      quiz={[
        {
          q: <><Tex>{"\\begin{pmatrix} 3 & 0 \\\\ 0 & 2 \\end{pmatrix}"}</Tex> ning xos qiymatlari?</>,
          options: ["3 va 2", "5 va 6", "0 va 1"],
          correct: 0,
          explain: "Diagonal matritsa x o'qini 3 marta, y o'qini 2 marta cho'zadi — o'qlar o'z chizig'ida qoladi. det(A − λE) = (3 − λ)(2 − λ).",
        },
        {
          q: "Nima uchun xos qiymatni det(A − λE) = 0 tenglamadan topamiz?",
          options: ["Shunchaki ta'rif shunday", "Av = λv ⇔ (A − λE)v = 0; nolmas v bo'lishi uchun A − λE tekislikni yassilashi kerak, ya'ni det = 0", "Chunki det har doim nol"],
          correct: 1,
          explain: "Bu bir jinsli sistema: nolmas yechim faqat det = 0 (rang < n) bo'lganda mavjud.",
        },
        {
          q: "90° ga burish matritsasining haqiqiy xos vektori bormi?",
          options: ["Ha, î va ĵ", "Yo'q — har bir nolmas vektor buriladi", "Ha, faqat nol vektor"],
          correct: 1,
          explain: "Burishda hech bir yo'nalish o'z chizig'ida qolmaydi. Xarakteristik tenglama λ² + 1 = 0 — haqiqiy ildiz yo'q.",
        },
      ]}
    >
      <Sec title="Burilmaydigan yo'nalishlar">
        <p>
          Almashtirishda deyarli barcha vektorlar o'z yo'nalishidan "buriladi". Lekin ayrimlari <b>o'z chizig'ida qoladi</b> — faqat cho'ziladi
          yoki qisqaradi. Ular <b>xos vektorlar</b>, cho'zilish koeffitsiyenti esa <b>xos qiymat</b> λ:
        </p>
        <Tex block>{"A\\vec v = \\lambda\\vec v"}</Tex>
        <p>
          ▶ ni bosing. <span style={{ color: C.muted }}>Kulrang</span> vektorlar almashtirishda buriladi;{" "}
          <b style={{ color: C.res }}>ko'k</b> strelkalar esa o'z punktir chizig'ida qoladi — ular xos vektorlar.
        </p>
        <Figure
          side={
            <>
              <MatrixEditor A={A} onChange={(B) => { setA(B); tl.setT(0); }} presets={EPRESETS} />
              {values.length ? (
                <p>
                  Xos qiymatlar:{" "}
                  {values.map((l, i) => (
                    <b key={i} style={{ color: C.res }}>{i > 0 && ", "}λ{["₁", "₂"][i]} = {fmt(l)}</b>
                  ))}
                </p>
              ) : (
                <div className="status bad">Haqiqiy xos qiymat yo'q</div>
              )}
              <p>
                Sariq <b>v</b> ni sudrang:{" "}
                {isEig ? <b style={{ color: C.v }}>xos vektor! Av = {fmt(lamV!)}·v</b> : <span className="muted">Av boshqa yo'nalishda</span>}
              </p>
            </>
          }
        >
          <Board height={440} x={[-6.5, 6.5]} y={[-6.5, 6.5]}>
            {vectors.map((e, i) => (
              <Line.ThroughPoints key={i} point1={[0, 0]} point2={e} color={C.res} style="dashed" opacity={0.5} />
            ))}
            {/* Oddiy vektorlar — fon: ingichka chiziq + nuqta (strelkasiz, shovqin kam) */}
            {RING.filter((p) => !onEigLine(p)).map((p, k) => {
              const q = apply(Mt, p);
              return (
                <g key={k}>
                  <Line.Segment point1={[0, 0]} point2={q} color={C.muted} weight={1.2} opacity={0.55} />
                  <Point x={q[0]} y={q[1]} color={C.muted} svgCircleProps={{ r: 3 }} />
                </g>
              );
            })}
            {/* Xos yo'nalishlar — diqqat markazi */}
            {eigArrows.map((p, i) => (
              <Arrow key={i} tip={apply(Mt, p)} color={C.res} weight={4} />
            ))}
            {tl.t > 0 && <Arrow tip={v} color={C.v} opacity={0.35} style="dashed" weight={2} />}
            <Arrow tip={apply(Mt, v)} color={C.v} label={tl.t > 0.5 ? "Av" : "v"} weight={4} />
            {tl.t === 0 && pv.element}
          </Board>
          <Controls tl={tl} />
        </Figure>
        <Recall to="almashtirish">
          Xos vektor — almashtirishning "skeleti". Simmetrik matritsada ikki xos yo'nalish perpendikulyar: almashtirish shunchaki shu ikki o'q bo'ylab
          cho'zish.
        </Recall>
      </Sec>

      <Sec title="λ ni qanday topamiz: det(A − λE) = 0">
        <p>
          <Tex>{"A\\vec v = \\lambda\\vec v \\iff (A - \\lambda E)\\vec v = \\vec 0"}</Tex>. Bu — bir jinsli sistema. Nolmas <Tex>{"\\vec v"}</Tex>{" "}
          faqat <Tex>{"A-\\lambda E"}</Tex> tekislikni <b>yassilaganda</b> bor. λ ni suring va kuzating: to'r qachon chiziqqa aylanadi?
        </p>
        <Figure
          side={
            <>
              <Slider label={<Tex>\lambda</Tex>} value={lam} onChange={setLam} min={-2} max={5} step={0.05} color={C.res} />
              <Tex block>{`A - \\lambda E = \\begin{bmatrix} ${fmt(Bl[0])} & ${fmt(Bl[1])} \\\\ ${fmt(Bl[2])} & ${fmt(Bl[3])} \\end{bmatrix}`}</Tex>
              <Tex block>{`p(\\lambda) = \\det(A-\\lambda E) = \\lambda^2 ${tr < 0 ? "+" : "-"} ${fmt(Math.abs(tr))}\\lambda ${dA < 0 ? "-" : "+"} ${fmt(Math.abs(dA))}`}</Tex>
              <p>
                λ = <b>{fmt(lam)}</b> da: <b style={{ color: flat ? C.i : C.orange }}>p(λ) = {fmt(dl)}</b>
              </p>
              <div className={"status " + (flat ? "good" : "neutral")}>
                {flat ? `Yassilandi! λ = ${fmt(lam)} — xos qiymat. Yassilangan yo'nalish — xos vektor.` : "Hali to'liq tekislik (rang 2). λ ni ko'k nuqtalarga suring."}
              </div>
            </>
          }
        >
          <div className="two-boards">
            <div>
              <div className="board-cap">A − λE almashtirishi</div>
              <Board faint height={300} x={[-4, 4]} y={[-3, 3]}>
                <TransformedGrid A={Bl} opacity={flat ? 0.7 : 0.4} color={flat ? C.v : undefined} />
                {vectors.map((e, i) => (
                  <Line.ThroughPoints key={i} point1={[0, 0]} point2={e} color={C.res} style="dashed" opacity={0.4} />
                ))}
              </Board>
            </div>
            <div>
              <div className="board-cap"><span style={{ color: C.orange }}>p(λ)</span> grafigi · <span style={{ color: C.res }}>●</span> ildizlar = xos qiymatlar</div>
              <div className="board">
                <Mafs height={300} viewBox={{ x: [-2, 5], y: [-3, 6], padding: 0 }} pan={false} zoom={false}>
                  <Coordinates.Cartesian subdivisions={false} />
                  <Plot.OfX y={(l) => l * l - tr * l + dA} color={C.orange} />
                  <Line.Segment point1={[lam, 0]} point2={[lam, dl]} color="#fff" style="dashed" opacity={0.5} />
                  {values.map((l, i) => <Point key={i} x={l} y={0} color={C.res} />)}
                  <Point x={lam} y={dl} color="#fff" />
                </Mafs>
              </div>
            </div>
          </div>
        </Figure>
        <Recall to="determinant">det = 0 ⇔ tekislik yassilangan. Chap rasmdagi to'r aynan shu paytda chiziqqa aylanadi.</Recall>
        <Recall to="rang">Xos qiymatda <Tex>{"r(A - \\lambda E) < 2"}</Tex> — shuning uchun bir jinsli sistema cheksiz ko'p (nolmas) yechimga ega.</Recall>
      </Sec>

      <Sec title="Algoritm (HEMIS amaliy mashg'ulotidagidek)">
        <ol>
          <li>Xarakteristik tenglamani tuzing: <Tex>{"\\det(A - \\lambda E) = 0"}</Tex>. 2×2 uchun: <Tex>{"\\lambda^2 - (a_{11}+a_{22})\\lambda + \\det A = 0"}</Tex>.</li>
          <li>Ildizlarini toping — bular xos qiymatlar.</li>
          <li>Har bir λ uchun <Tex>{"(A-\\lambda E)\\vec x = \\vec 0"}</Tex> sistemani yeching (Gauss) — nolmas yechimlar xos vektorlar.</li>
        </ol>
        <p><b>Misol.</b> <Tex>{"A = \\begin{pmatrix} 2 & 1 \\\\ 1 & 2 \\end{pmatrix}"}</Tex>:</p>
        <Tex block>{"\\lambda^2 - 4\\lambda + 3 = 0 \\Rightarrow \\lambda_1 = 3,\\ \\lambda_2 = 1"}</Tex>
        <Tex block>{"\\lambda_1 = 3:\\ \\begin{pmatrix} -1 & 1 \\\\ 1 & -1 \\end{pmatrix}\\vec x = 0 \\Rightarrow \\vec x = t(1, 1);\\qquad \\lambda_2 = 1:\\ \\begin{pmatrix} 1 & 1 \\\\ 1 & 1 \\end{pmatrix}\\vec x = 0 \\Rightarrow \\vec x = t(1, -1)"}</Tex>
        <Key>
          Bu mavzu butun kursni bitta zanjirga bog'laydi: <b>almashtirish</b> → qaysi yo'nalish burilmaydi → <b>bir jinsli sistema</b> →{" "}
          nolmas yechim → <b>rang</b> to'liq emas → <b>determinant</b> = 0 → kvadrat tenglama. Har bir oldingi mavzu shu yerda bir bo'g'in.
        </Key>
      </Sec>
    </LessonShell>
  );
}
