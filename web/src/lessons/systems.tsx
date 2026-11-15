import { useState } from "react";
import { Line, Point, Polygon, Text, useMovablePoint } from "mafs";
import { LessonShell, Sec, Recall, Key } from "../components/LessonShell";
import { Arrow, Board, C, Controls, Figure, Legend, MatrixEditor, TransformedGrid, UnitSquare, snap, useTimeline } from "../components/viz";
import { MatGrid } from "../components/MatGrid";
import { Tex } from "../components/Tex";
import { add, apply, col1, col2, cross, det, fmt, fromCols, I, inv, lerp, lerpM, mul, scale, smooth, texM, texV, type M, type V } from "../lib/la";
import { cofactors3, det3F, fAdd, fMul, fmTex, fr, fDiv, fTex, gaussSteps, rankOf, toFM } from "../lib/frac";

/** ax + by = c to'g'ri chizig'idagi ikki nuqta */
function linePts(a: number, b: number, c: number): [V, V] | null {
  if (Math.abs(a) < 1e-9 && Math.abs(b) < 1e-9) return null;
  if (Math.abs(b) >= Math.abs(a)) return [[-20, (c + 20 * a) / b], [20, (c - 20 * a) / b]];
  return [[(c + 20 * b) / a, -20], [(c - 20 * b) / a, 20]];
}
function RowLine({ r, color, weight = 3 }: { r: [number, number, number]; color: string; weight?: number }) {
  const p = linePts(r[0], r[1], r[2]);
  return p ? <Line.ThroughPoints point1={p[0]} point2={p[1]} color={color} weight={weight} /> : null;
}
/** ax + by = c ni daftardagidek yozish: 1x → x, −1y → −y, 0 koeffitsiyentli had tushiriladi */
const eqTex = (a: number, b: number, c: number) => {
  const k = (v: number) => (Math.abs(Math.abs(v) - 1) < 1e-9 ? "" : fmt(Math.abs(v)));
  const az = Math.abs(a) < 1e-9, bz = Math.abs(b) < 1e-9;
  let s = "";
  if (!az) s += `${a < 0 ? "-" : ""}${k(a)}x`;
  if (!bz) s += `${az ? (b < 0 ? "-" : "") : b < 0 ? " - " : " + "}${k(b)}y`;
  if (az && bz) s = "0";
  return `${s} = ${fmt(c)}`;
};

function classify(A: M, b: V) {
  const d = det(A);
  if (Math.abs(d) > 1e-9) return { kind: "aniq" as const, x: apply(inv(A)!, b) };
  // det = 0: b ustunlar qobig'idami?
  const c = Math.abs(A[0]) + Math.abs(A[2]) > 1e-9 ? col1(A) : col2(A);
  const zero = Math.abs(c[0]) + Math.abs(c[1]) < 1e-9;
  const inSpan = zero ? Math.abs(b[0]) + Math.abs(b[1]) < 1e-9 : Math.abs(cross(c, b)) < 1e-9;
  return { kind: inSpan ? ("aniqmas" as const) : ("emas" as const), x: null };
}

/* =================================================================== */
/* CHIZIQLI TENGLAMALAR SISTEMASI — UCH XIL TASVIR                     */
/* =================================================================== */
export function SistemaLesson() {
  const [A, setA] = useState<M>([2, 1, 1, -1]);
  const pb = useMovablePoint([5, 1], { color: C.res, constrain: snap(0.5) });
  const b: V = [pb.x, pb.y];
  const [view, setView] = useState<"qator" | "ustun" | "alm">("qator");
  const tl = useTimeline(2, 1.4);
  const cl = classify(A, b);
  const x = cl.x;
  const s1 = smooth(Math.min(1, tl.t)), s2 = smooth(tl.t - 1);

  const presets: { name: string; A: M; b: V }[] = [
    { name: "Yagona yechim", A: [2, 1, 1, -1], b: [5, 1] },
    { name: "Yechim yo'q", A: [1, 1, 1, 1], b: [1, 0] },
    { name: "Cheksiz ko'p", A: [1, 2, 2, 4], b: [2, 4] },
  ];

  return (
    <LessonShell
      id="sistema"
      quiz={[
        {
          q: <>Qatorlar tasvirida ikkita to'g'ri chiziq parallel (ustma-ust emas). Sistema…</>,
          options: ["aniq (yagona yechim)", "birgalikda emas (yechim yo'q)", "aniqmas (cheksiz ko'p yechim)"],
          correct: 1,
          explain: "Parallel chiziqlar kesishmaydi — ikkala tenglamani bir vaqtda qanoatlantiruvchi nuqta yo'q.",
        },
        {
          q: <>Ustunlar tasvirida: <Tex>{"\\vec b"}</Tex> ustunlar qobig'idan tashqarida bo'lsa…</>,
          options: ["Yechim yagona", "Yechim yo'q", "Yechim cheksiz ko'p"],
          correct: 1,
          explain: "x·(1-ustun) + y·(2-ustun) faqat qobiq ichidagi vektorlarni beradi. b unda bo'lmasa — hech qanday x, y yetkazmaydi.",
        },
        {
          q: <>Bir jinsli sistema <Tex>{"A\\vec x = \\vec 0"}</Tex> qachon nolmas yechimga ega?</>,
          options: ["Har doim", "det A = 0 bo'lganda", "det A ≠ 0 bo'lganda"],
          correct: 1,
          explain: "x = 0 har doim yechim. Boshqa yechim bo'lishi uchun A biror nolmas vektorni 0 ga 'yassilashi' kerak — det A = 0.",
        },
      ]}
    >
      <Sec title="Bitta masala — uch xil ko'rinish">
        <p>
          <Tex>{"\\begin{cases} a_{11}x + a_{12}y = b_1 \\\\ a_{21}x + a_{22}y = b_2 \\end{cases} \\iff A\\vec x = \\vec b"}</Tex>. Bu sistemaga uch
          tomondan qarash mumkin — va har biri oldingi darslardan biriga tayanadi:
        </p>
        <div className="toggle">
          <button className={"chip" + (view === "qator" ? " on" : "")} onClick={() => { setView("qator"); tl.setT(0); }}>1. Qatorlar: chiziqlar kesishishi</button>
          <button className={"chip" + (view === "ustun" ? " on" : "")} onClick={() => { setView("ustun"); tl.setT(0); }}>2. Ustunlar: kombinatsiya</button>
          <button className={"chip" + (view === "alm" ? " on" : "")} onClick={() => { setView("alm"); tl.setT(0); }}>3. Almashtirish: kim b ga tushadi?</button>
        </div>
        <Figure
          side={
            <>
              <MatrixEditor A={A} onChange={(B) => { setA(B); tl.setT(0); }} />
              <Tex block>{`\\begin{cases} ${eqTex(A[0], A[1], b[0])} \\\\ ${eqTex(A[2], A[3], b[1])} \\end{cases}`}</Tex>
              <div className={"status " + (cl.kind === "aniq" ? "good" : cl.kind === "emas" ? "bad" : "neutral")}>
                {cl.kind === "aniq" && <>Aniq: yagona yechim x = {fmt(x![0])}, y = {fmt(x![1])}</>}
                {cl.kind === "emas" && "Birgalikda emas: yechim yo'q"}
                {cl.kind === "aniqmas" && "Aniqmas: cheksiz ko'p yechim"}
              </div>
              <div className="presets">
                {presets.map((p) => (
                  <button key={p.name} className="chip" onClick={() => { setA(p.A); pb.setPoint(p.b); tl.setT(0); }}>{p.name}</button>
                ))}
              </div>
              <p className="muted small">Ko'k nuqta — ozod hadlar <b>b</b>. Uni sudrang.</p>
            </>
          }
        >
          <Board faint={view === "alm"} height={420} x={[-6, 6]} y={[-5, 5]}>
            {view === "qator" && (
              <>
                <RowLine r={[A[0], A[1], b[0]]} color={C.v} />
                <RowLine r={[A[2], A[3], b[1]]} color={C.w} />
                {x && <Point x={x[0]} y={x[1]} color="#fff" />}
                {x && <Text x={x[0]} y={x[1]} attach="ne" color="#fff" size={15}>({fmt(x[0])}, {fmt(x[1])})</Text>}
              </>
            )}
            {view === "ustun" && (
              <>
                {Math.abs(det(A)) < 1e-9 && (col1(A)[0] || col1(A)[1] || col2(A)[0] || col2(A)[1]) && (
                  <Line.ThroughPoints point1={[0, 0]} point2={col1(A)[0] || col1(A)[1] ? col1(A) : col2(A)} color={C.res} weight={6} opacity={0.3} />
                )}
                <Arrow tip={col1(A)} color={C.i} label="1-ustun" />
                <Arrow tip={col2(A)} color={C.j} label="2-ustun" />
                {x && tl.t > 0 && <Arrow tip={scale(col1(A), x[0] * s1)} color={C.i} weight={5} opacity={0.7} />}
                {x && tl.t > 1 && <Arrow tail={scale(col1(A), x[0])} tip={add(scale(col1(A), x[0]), scale(col2(A), x[1] * s2))} color={C.j} weight={5} opacity={0.7} />}
                <Arrow tip={b} color={C.res} label="b" />
              </>
            )}
            {view === "alm" && (
              <>
                <TransformedGrid A={lerpM(I, A, s1)} opacity={0.35} />
                {x && <Arrow tip={apply(lerpM(I, A, s1), x)} color={C.v} label={tl.t > 0.9 ? "Ax = b" : "x"} weight={4} />}
                {!x && <Arrow tip={b} color={C.res} label="b" />}
              </>
            )}
            {pb.element}
          </Board>
          {view !== "qator" && <Controls tl={tl} steps={view === "ustun" ? [`x = ${x ? fmt(x[0]) : "?"} marta 1-ustun`, `+ y = ${x ? fmt(x[1]) : "?"} marta 2-ustun`] : undefined} />}
          {view === "qator" && <Legend items={[[C.v, "1-tenglama"], [C.w, "2-tenglama"], ["#fff", "yechim"]]} />}
        </Figure>
        <Recall to="chiziq">1-tasvir: har bir tenglama — chiziqning umumiy tenglamasi <Tex>{"Ax + By = -C"}</Tex>. Yechim — ikkala chiziqda yotgan nuqta.</Recall>
        <Recall to="kombinatsiya">2-tasvir: <Tex>{"x\\cdot\\vec a_1 + y\\cdot\\vec a_2 = \\vec b"}</Tex> — b ni ustunlarning chiziqli kombinatsiyasi qilib yozish.</Recall>
        <Recall to="almashtirish">3-tasvir: A almashtirish qaysi x vektorni b ga olib boradi? Ya'ni b ning <b>aks tasviri</b>ni qidiramiz.</Recall>
      </Sec>

      <Sec title="Uch holat va ularning sababi">
        <table className="cases">
          <thead><tr><th>Holat</th><th>Qatorlar</th><th>Ustunlar</th><th>det A</th></tr></thead>
          <tbody>
            <tr><td><b>Aniq</b> (yagona)</td><td>Chiziqlar bitta nuqtada kesishadi</td><td>Ustunlar erkli — qobiq butun tekislik</td><td>≠ 0</td></tr>
            <tr><td><b>Aniqmas</b> (cheksiz)</td><td>Chiziqlar ustma-ust</td><td>Ustunlar bog'liq, b ularning chizig'ida</td><td>= 0</td></tr>
            <tr><td><b>Birgalikda emas</b></td><td>Chiziqlar parallel</td><td>Ustunlar bog'liq, b chiziqdan tashqarida</td><td>= 0</td></tr>
          </tbody>
        </table>
        <p>
          <b>Bir jinsli sistema</b> <Tex>{"A\\vec x=\\vec 0"}</Tex>: ikkala chiziq ham boshdan o'tadi, shuning uchun <Tex>{"\\vec x = \\vec 0"}</Tex>{" "}
          doim yechim. Nolmas yechim faqat chiziqlar ustma-ust tushganda, ya'ni <Tex>{"\\det A = 0"}</Tex> da bor. Bu fakt xos vektorlarni
          topishda hal qiluvchi bo'ladi.
        </p>
        <Key>
          Yechish usullari (HEMIS 3-ma'ruza) — keyingi darslar: <b>Gauss</b> (chiziqlarni bosqichma-bosqich burish), <b>Kramer</b>{" "}
          (yuzalar nisbati), <b>matritsa usuli</b> (<Tex>{"\\vec x = A^{-1}\\vec b"}</Tex> — teskari almashtirish). Yechim borligini esa{" "}
          <b>rang</b> (Kroneker–Kapelli) aytadi.
        </Key>
      </Sec>
    </LessonShell>
  );
}

/* =================================================================== */
/* GAUSS USULI                                                         */
/* =================================================================== */
type Row = [number, number, number];
function gauss2Steps(R1: Row, R2: Row): { rows: [Row, Row]; op: string }[] {
  const out: { rows: [Row, Row]; op: string }[] = [{ rows: [R1, R2], op: "Boshlang'ich sistema" }];
  const k1 = R2[0] / R1[0];
  const r2a = R2.map((x, i) => x - k1 * R1[i]) as Row;
  out.push({ rows: [R1, r2a], op: `R_2 \\leftarrow R_2 - (${fmt(k1)})R_1 \\;\\Rightarrow\\; x \\text{ yo'qoldi}` });
  const r2b = r2a.map((x) => x / r2a[1]) as Row;
  out.push({ rows: [R1, r2b], op: `R_2 \\leftarrow R_2 : (${fmt(r2a[1])}) \\;\\Rightarrow\\; y = ${fmt(r2b[2])}` });
  const r1a = R1.map((x, i) => x - R1[1] * r2b[i]) as Row;
  out.push({ rows: [r1a, r2b], op: `R_1 \\leftarrow R_1 - (${fmt(R1[1])})R_2 \\;\\Rightarrow\\; y \\text{ yo'qoldi}` });
  const r1b = r1a.map((x) => x / r1a[0]) as Row;
  out.push({ rows: [r1b, r2b], op: `R_1 \\leftarrow R_1 : (${fmt(r1a[0])}) \\;\\Rightarrow\\; x = ${fmt(r1b[2])}` });
  return out;
}

/** n×(n+1) sistema uchun qadamma-qadam Gauss (kasrlar bilan) */
export function GaussTable({ A, jordan = true }: { A: number[][]; jordan?: boolean }) {
  const steps = gaussSteps(A, jordan, A[0].length - 1);
  const [k, setK] = useState(0);
  const s = steps[Math.min(k, steps.length - 1)];
  const n = A[0].length;
  return (
    <div className="gauss3">
      <div className="gauss3-head">
        <button className="btn small ghost" disabled={k === 0} onClick={() => setK(k - 1)}>← Oldingi</button>
        <span>{k + 1} / {steps.length} · <i>{s.phase}</i></span>
        <button className="btn small" disabled={k >= steps.length - 1} onClick={() => setK(k + 1)}>Keyingi qadam →</button>
      </div>
      <Tex block>{s.op}</Tex>
      <MatGrid
        M={s.M.map((r) => r.map((x) => <Tex>{fTex(x)}</Tex>))}
        bars
        splitAfter={n - 2}
        hiCells={s.changed.flatMap((i) => Array.from({ length: n }, (_, j) => [i, j] as [number, number]))}
      />
      <div className="muted small">Yonib turgan satr — shu qadamda o'zgargan satr. Chiziqdan o'ngda — ozod hadlar.</div>
    </div>
  );
}

const GAUSS_PRESETS: { name: string; R: [Row, Row] }[] = [
  { name: "2x + y = 5,  x − y = 1", R: [[2, 1, 5], [1, -1, 1]] },
  { name: "x + 2y = 4,  3x − y = 5", R: [[1, 2, 4], [3, -1, 5]] },
  { name: "3x + 2y = 7,  x + 4y = 9", R: [[3, 2, 7], [1, 4, 9]] },
];
const HEMIS_SYS = [[2, -3, 4, 20], [3, 4, -2, -11], [4, 2, 3, 9]];

export function GaussLesson() {
  const [pi, setPi] = useState(0);
  const steps = gauss2Steps(...GAUSS_PRESETS[pi].R);
  const tl = useTimeline(4, 1.6);
  const k = Math.min(3, Math.floor(tl.t));
  const f = smooth(tl.t - k);
  const cur = tl.t >= 4 ? steps[4].rows : ([0, 1].map((r) => steps[k].rows[r].map((x, i) => lerp(x, steps[k + 1].rows[r][i], f))) as [Row, Row]);
  // (k, k+1] oralig'ida (k+1)-qadam bajarilmoqda; aniq butun t da — o'sha qadam tugagan
  const label = steps[Math.min(4, Math.ceil(tl.t - 1e-9))].op;
  const sol = steps[4].rows;
  const X: V = [sol[0][2], sol[1][2]];

  return (
    <LessonShell
      id="gauss"
      quiz={[
        {
          q: "Nega qator amallaridan keyin sistemaning yechimi o'zgarmaydi?",
          options: ["Chunki biz faqat sonlarni yaxlitlaymiz", "Chunki yangi tenglama eski tenglamalarning chiziqli kombinatsiyasi — yechim ikkalasini qanoatlantirsa, kombinatsiyani ham qanoatlantiradi", "Aslida o'zgaradi"],
          correct: 1,
          explain: "Agar (x₀, y₀) R₁ va R₂ ni qanoatlantirsa, R₂ − kR₁ ni ham qanoatlantiradi. Shuning uchun animatsiyada chiziq aynan yechim nuqtasi atrofida buriladi.",
        },
        {
          q: "Gaussning 'to'g'ri yo'li' oxirida matritsa qanday ko'rinishga keladi?",
          options: ["Birlik matritsa", "Pog'onasimon (uchburchak) ko'rinish — diagonaldan pastda nollar", "Nol matritsa"],
          correct: 1,
          explain: "To'g'ri yo'l pastdagi elementlarni nolga aylantiradi; 'teskari yo'l' (Gauss–Jordan) yuqoridagilarni ham nolga aylantirib, yechimni to'g'ridan-to'g'ri beradi.",
        },
      ]}
    >
      <Sec title="Qator amallari chiziqlarni yechim atrofida buradi">
        <p>
          Gauss usuli — noma'lumlarni ketma-ket <b>yo'qotish</b>. Har bir qadamda bitta tenglamani boshqasining karralisi bilan
          o'zgartiramiz. ▶ ni bosing va kuzating: chiziqlar <b>oq nuqta atrofida buriladi</b>, oxirida biri vertikal (<Tex>{"x = \\dots"}</Tex>),
          biri gorizontal (<Tex>{"y = \\dots"}</Tex>) bo'lib qoladi — javob tayyor.
        </p>
        <div className="presets">
          {GAUSS_PRESETS.map((p, i) => (
            <button key={p.name} className={"chip" + (pi === i ? " on" : "")} onClick={() => { setPi(i); tl.setT(0); }}>{p.name}</button>
          ))}
        </div>
        <Figure
          side={
            <>
              <div className="gauss-op"><Tex>{label}</Tex></div>
              <MatGrid M={cur.map((r) => r.map((x) => Math.round(x * 100) / 100))} bars colColors={[C.i, C.j, C.res]} />
              <Tex block>{`\\begin{cases} ${eqTex(cur[0][0], cur[0][1], cur[0][2])} \\\\ ${eqTex(cur[1][0], cur[1][1], cur[1][2])} \\end{cases}`}</Tex>
              <p className="muted small">Har bir qadamda oq nuqta <b>({fmt(X[0])}, {fmt(X[1])})</b> ikkala chiziqda qoladi.</p>
            </>
          }
        >
          <Board height={400} x={[-3, 6]} y={[-3, 5]}>
            <RowLine r={cur[0]} color={C.v} />
            <RowLine r={cur[1]} color={C.w} />
            <Point x={X[0]} y={X[1]} color="#fff" />
          </Board>
          <Controls tl={tl} steps={["x ni yo'qotish", "y ni topish", "y ni yo'qotish", "x ni topish"]} />
          <Legend items={[[C.v, "R₁ tenglama"], [C.w, "R₂ tenglama"]]} />
        </Figure>
        <Recall to="kombinatsiya">
          <Tex>{"R_2 - kR_1"}</Tex> — tenglamalarning chiziqli kombinatsiyasi. Yechim <Tex>{"(x_0,y_0)"}</Tex> ikkalasini qanoatlantirgani
          uchun kombinatsiyani ham qanoatlantiradi — shuning uchun chiziq aynan shu nuqta atrofida buriladi.
        </Recall>
        <Recall to="determinant">
          Satrga boshqa satrning karralisini qo'shish determinantni o'zgartirmaydi (siljitish = yuza saqlanadi). Shuning uchun Gauss bilan
          determinantni ham hisoblash mumkin: uchburchak ko'rinishdagi matritsa determinanti — diagonal elementlar ko'paytmasi.
        </Recall>
      </Sec>

      <Sec title="3 noma'lumli sistema — qadamma-qadam (HEMIS misoli)">
        <Tex block>{"\\begin{cases} 2x_1 - 3x_2 + 4x_3 = 20 \\\\ 3x_1 + 4x_2 - 2x_3 = -11 \\\\ 4x_1 + 2x_2 + 3x_3 = 9 \\end{cases}"}</Tex>
        <p>
          Endi chiziqlar o'rniga tekisliklar, lekin g'oya o'sha: avval diagonaldan pastni nolga aylantiramiz (<b>to'g'ri yo'l</b>), keyin
          yuqorisini (<b>teskari yo'l</b>). O'zgargan satr yonadi:
        </p>
        <GaussTable A={HEMIS_SYS} />
        <p className="muted small">Javob: <Tex>{"x_1 = 1,\\ x_2 = -2,\\ x_3 = 3"}</Tex>. Matritsa usuli va Kramer usuli ham aynan shu javobni beradi (keyingi darslar).</p>
        <Key>
          Gauss usuli eng universal: u yechim yo'qligini ham (<Tex>{"0 = c \\ne 0"}</Tex> satr chiqadi), cheksiz ko'pligini ham (nol satr
          chiqadi) ko'rsatadi. Nolmas satrlar soni — <b>rang</b>.
        </Key>
      </Sec>
    </LessonShell>
  );
}

/* =================================================================== */
/* KRAMER QOIDASI                                                      */
/* =================================================================== */
export function KramerLesson() {
  // a₁ = (2, 1), a₂ = (1, 2), b = 1.5·a₁ + 1·a₂ = (4, 3.5) → Δ = 3, Δx = 4.5, Δy = 3
  const [A, setA] = useState<M>([2, 1, 1, 2]);
  const pb = useMovablePoint([4, 3.5], { color: C.res, constrain: snap(0.5) });
  const b: V = [pb.x, pb.y];
  const a1 = col1(A), a2 = col2(A);
  const D = det(A);
  const x = D ? cross(b, a2) / D : 0;
  const y = D ? cross(a1, b) / D : 0;
  const tl = useTimeline(2, 1.5);
  const s1 = smooth(Math.min(1, tl.t)), s2 = smooth(tl.t - 1);
  // 1-qadam: a1 -> x·a1; 2-qadam: x·a1 -> b (a2 bo'ylab siljitish)
  const side = tl.t <= 1 ? scale(a1, lerp(1, x, s1)) : add(scale(a1, x), scale(a2, y * s2));
  const area = cross(side, a2);

  return (
    <LessonShell
      id="kramer"
      quiz={[
        {
          q: <><Tex>{"\\begin{cases} x + y = 3 \\\\ x - y = 1 \\end{cases}"}</Tex>: <Tex>{"\\Delta"}</Tex> va <Tex>{"\\Delta_x"}</Tex> = ?</>,
          options: ["Δ = −2, Δx = −4 ⇒ x = 2", "Δ = 2, Δx = 4 ⇒ x = 2", "Δ = 0 — yechim yo'q"],
          correct: 0,
          explain: "Δ = 1·(−1) − 1·1 = −2; Δx = |3 1; 1 −1| = −3 − 1 = −4; x = Δx/Δ = 2, y = Δy/Δ = (1−3)/(−2) = 1.",
        },
        {
          q: "Kramer qoidasini qachon qo'llab bo'lmaydi?",
          options: ["Δ = 0 bo'lganda", "Ozod hadlar nol bo'lganda", "Noma'lumlar 3 ta bo'lganda"],
          correct: 0,
          explain: "Δ ga bo'lamiz — Δ = 0 bo'lsa formula ishlamaydi (va sistema yagona yechimga ega emas).",
        },
      ]}
    >
      <Sec title="Yechim — ikki yuzaning nisbati">
        <p>
          <Tex>{"x\\,\\vec a_1 + y\\,\\vec a_2 = \\vec b"}</Tex>. Ustunlardan yasalgan parallelogramm yuzasi <Tex>{"\\Delta = \\det A"}</Tex>. Endi
          1-ustun o'rniga <b>b</b> ni qo'yamiz: <Tex>{"\\Delta_x = \\det(\\vec b, \\vec a_2)"}</Tex>. Nima uchun <Tex>{"\\Delta_x = x\\cdot\\Delta"}</Tex>?
          ▶ ni bosing:
        </p>
        <ol className="compact">
          <li><Tex>{"\\vec a_1"}</Tex> ni x marta cho'zamiz — yuza ham <b>x marta</b> o'zgaradi;</li>
          <li>so'ng uchini <Tex>{"\\vec a_2"}</Tex> bo'ylab <Tex>{"y\\vec a_2"}</Tex> ga suramiz — yuza <b>o'zgarmaydi</b> (asos va balandlik bir xil). Uchi aynan b ga keladi!</li>
        </ol>
        <Figure
          side={
            <>
              <MatrixEditor A={A} onChange={(B) => { setA(B); tl.setT(0); }} />
              <Tex block>{`\\Delta = ${fmt(D)},\\quad \\text{hozirgi yuza} = ${fmt(area)}`}</Tex>
              <Tex block>{`x = \\frac{\\Delta_x}{\\Delta} = \\frac{${fmt(cross(b, a2))}}{${fmt(D)}} = ${fmt(x)}`}</Tex>
              <Tex block>{`y = \\frac{\\Delta_y}{\\Delta} = \\frac{${fmt(cross(a1, b))}}{${fmt(D)}} = ${fmt(y)}`}</Tex>
              <p className="muted small">
                <Tex>{"\\Delta_y = \\det(\\vec a_1, \\vec b)"}</Tex> — xuddi shunday, 2-ustun o'rniga b.
              </p>
            </>
          }
        >
          <Board height={400} x={[-1.5, 6.5]} y={[-1, 5.5]}>
            <Polygon points={[[0, 0], a1, add(a1, a2), a2]} color={C.muted} fillOpacity={0.12} weight={1} />
            <Polygon points={[[0, 0], side, add(side, a2), a2]} color={tl.t > 1.95 ? C.res : C.v} fillOpacity={0.28} />
            <Arrow tip={b} color={C.res} label="b" opacity={tl.t > 1.95 ? 0 : 0.6} />
            <Arrow tip={a1} color={C.i} label="a₁" />
            <Arrow tip={a2} color={C.j} label="a₂" />
            <Arrow tip={side} color={tl.t > 1.95 ? C.res : C.v} weight={4} label={tl.t > 1.95 ? "b" : tl.t > 0 ? "x·a₁" : undefined} />
            {tl.t === 0 && pb.element}
          </Board>
          <Controls tl={tl} steps={["a₁ ni x marta cho'zish: yuza × x", "a₂ bo'ylab surish: yuza o'zgarmaydi"]} />
          <Legend items={[[C.muted, "Δ = det(a₁, a₂) — boshlang'ich"], [C.v, "o'zgarayotgan parallelogramm"], [C.res, "Δₓ = det(b, a₂) — oxirgi"]]} />
        </Figure>
        <Recall to="determinant">
          2-qadam — "ustunga boshqa ustunning karralisini qo'shish determinantni o'zgartirmaydi" xossasining aynan o'zi.
        </Recall>
        <p>
          <b>3 noma'lumli sistema</b> uchun ham xuddi shunday: <Tex>{"x_k = \\Delta_k/\\Delta"}</Tex>, bu yerda <Tex>{"\\Delta_k"}</Tex> — k-ustun
          o'rniga ozod hadlar ustuni qo'yilgan 3×3 determinant (hajmlar nisbati). Masalan, HEMIS misolida <Tex>{"\\Delta = 43"}</Tex>,{" "}
          <Tex>{"\\Delta_1 = 43,\\ \\Delta_2 = -86,\\ \\Delta_3 = 129"}</Tex> ⇒ <Tex>{"(1, -2, 3)"}</Tex>.
        </p>
      </Sec>
    </LessonShell>
  );
}

/* =================================================================== */
/* TESKARI MATRITSA                                                    */
/* =================================================================== */
export function TeskariLesson() {
  const [A, setA] = useState<M>([1, 1, -0.5, 1]);
  const tl = useTimeline(2, 1.6);
  const Ai = inv(A);
  const s1 = smooth(Math.min(1, tl.t)), s2 = smooth(tl.t - 1);
  const Mt = tl.t <= 1 ? lerpM(I, A, s1) : Ai ? mul(lerpM(I, Ai, s2), A) : A;
  const pb = useMovablePoint([2, 1], { color: C.res, constrain: snap(0.5) });
  const b: V = [pb.x, pb.y];
  const xs: V | null = Ai ? apply(Ai, b) : null;
  const xt = useTimeline(1, 1.5);

  // Singulyar holatda: bir nechta nuqta bitta nuqtaga tushadi
  const kernel: V | null = !Ai ? (Math.abs(A[0]) + Math.abs(A[1]) > 1e-9 ? [-A[1], A[0]] : [-A[3], A[2]]) : null;

  const A3 = HEMIS_SYS.map((r) => r.slice(0, 3));
  const F3 = toFM(A3);
  const D3 = det3F(F3);
  const cof = cofactors3(F3);
  const adjT = cof[0].map((_, j) => cof.map((r) => r[j]));
  const invF = adjT.map((r) => r.map((x) => fDiv(x, D3)));

  return (
    <LessonShell
      id="teskari"
      quiz={[
        {
          q: <><Tex>{"\\begin{pmatrix} 2 & 1 \\\\ 5 & 3 \\end{pmatrix}^{-1}"}</Tex> = ?</>,
          options: [<Tex>{"\\begin{pmatrix} 3 & -1 \\\\ -5 & 2 \\end{pmatrix}"}</Tex>, <Tex>{"\\begin{pmatrix} 3 & 1 \\\\ 5 & 2 \\end{pmatrix}"}</Tex>, <Tex>{"\\begin{pmatrix} 1/2 & 1 \\\\ 1/5 & 1/3 \\end{pmatrix}"}</Tex>],
          correct: 0,
          explain: "det = 6 − 5 = 1. Diagonal elementlar o'rin almashadi, qolganlari ishorasini o'zgartiradi, so'ng det ga bo'linadi.",
        },
        {
          q: "Nima uchun det A = 0 bo'lsa, teskari matritsa yo'q?",
          options: ["Chunki 0 ga bo'lib bo'lmaydi — boshqa sabab yo'q", "Chunki A tekislikni chiziqqa yassilaydi: ko'p nuqta bitta nuqtaga tushadi va qaysi biri ekanini tiklab bo'lmaydi", "Aslida mavjud, faqat hisoblash qiyin"],
          correct: 1,
          explain: "Formula sababni emas, natijani ko'rsatadi. Sabab — ma'lumot yo'qoladi: almashtirish 'birga-bir' emas.",
        },
      ]}
    >
      <Sec title="A qilgan ishni bekor qilish">
        <p>
          <Tex>{"A^{-1}"}</Tex> — shunday almashtirishki, A dan keyin bajarilsa, hamma narsa joyiga qaytadi: <Tex>{"A^{-1}A = E"}</Tex>. ▶ ni bosing:
          avval A, keyin <Tex>{"A^{-1}"}</Tex>.
        </p>
        <Figure
          side={
            <>
              <MatrixEditor A={A} onChange={(B) => { setA(B); tl.setT(0); xt.setT(0); }} presets={[{ name: "Burish", A: [0, -1, 1, 0] }, { name: "Siljitish", A: [1, 1, 0, 1] }, { name: "Yassilash (det=0)", A: [1, 2, 0.5, 1] }]} />
              {Ai ? (
                <Tex block>{`\\begin{aligned} A^{-1} &= \\frac{1}{${fmt(det(A))}}\\begin{bmatrix} ${fmt(A[3])} & ${fmt(-A[1])} \\\\ ${fmt(-A[2])} & ${fmt(A[0])} \\end{bmatrix} \\\\ &= ${texM(Ai)} \\end{aligned}`}</Tex>
              ) : (
                <div className="status bad">det A = 0 — teskari matritsa mavjud emas (A maxsus / вырожденная)</div>
              )}
              <p className="muted small">
                2×2 uchun qoida: diagonaldagilar o'rin almashadi, qolganlari ishorasini o'zgartiradi, hammasi <Tex>{"\\det A"}</Tex> ga bo'linadi.
              </p>
            </>
          }
        >
          <Board faint height={380}>
            <TransformedGrid A={Mt} opacity={0.35} />
            <UnitSquare A={Mt} color={C.v} opacity={0.25} />
            <Arrow tip={col1(Mt)} color={C.i} label="î" weight={4} />
            <Arrow tip={col2(Mt)} color={C.j} label="ĵ" weight={4} />
            {/* Maxsus holat: bir chiziqda yotgan 5 ta nuqta A ta'sirida bitta nuqtaga yig'iladi */}
            {!Ai && kernel && [-2, -1, 0, 1, 2].map((k) => {
              const p0: V = add([1, 0.5], scale(kernel, k * 0.8 / Math.hypot(...kernel)));
              const img = apply(Mt, p0);
              return <Point key={k} x={img[0]} y={img[1]} color={C.w} svgCircleProps={{ r: 6 }} />;
            })}
          </Board>
          <Controls tl={tl} steps={["A", Ai ? "A⁻¹: joyiga qaytish" : "A⁻¹: imkonsiz!"]} />
          {!Ai && (
            <p className="muted small">
              <b style={{ color: C.w }}>Pushti</b> — 5 ta turli nuqta. ▶ ni bosing: A ularni <b>bitta nuqtaga</b> yig'adi. Endi o'sha nuqtaga
              qarab, qaysi biridan kelganini aniqlab bo'lmaydi — shuning uchun orqaga qaytaruvchi A⁻¹ yo'q.
            </p>
          )}
        </Figure>
      </Sec>

      <Sec title="Matritsa usuli: x = A⁻¹b">
        <p>
          <Tex>{"A\\vec x = \\vec b"}</Tex> ning ikkala tomonini chapdan <Tex>{"A^{-1}"}</Tex> ga ko'paytiramiz: <Tex>{"\\vec x = A^{-1}\\vec b"}</Tex>. Geometrik:
          b nuqtani orqaga "qaytarib", qayerdan kelganini topamiz. ▶ — b dan x ga qaytish:
        </p>
        <Figure side={xs ? <Tex block>{`\\begin{aligned} \\vec x &= A^{-1}\\vec b \\\\ &= ${texM(Ai!)}${texV(b)} \\\\ &= ${texV(xs)} \\end{aligned}`}</Tex> : <div className="status bad">det A = 0: usul ishlamaydi</div>}>
          <Board faint height={340}>
            {xs && <TransformedGrid A={lerpM(A, I, smooth(xt.t))} opacity={0.3} />}
            {xs && <Arrow tip={apply(lerpM(A, I, smooth(xt.t)), xs)} color={C.v} label={xt.t > 0.95 ? "x" : undefined} weight={4} />}
            <Arrow tip={b} color={C.res} label="b" opacity={0.6} />
            {pb.element}
          </Board>
          <Controls tl={xt} />
        </Figure>
      </Sec>

      <Sec title="3×3: algebraik to'ldiruvchilar orqali (HEMIS misoli)">
        <p>Umumiy formula:</p>
        <Tex block>{"A^{-1} = \\frac{1}{|A|}\\begin{pmatrix} A_{11} & A_{21} & A_{31} \\\\ A_{12} & A_{22} & A_{32} \\\\ A_{13} & A_{23} & A_{33} \\end{pmatrix}"}</Tex>
        <p>
          E'tibor bering: algebraik to'ldiruvchilar <b>transponirlangan</b> holda yoziladi (<Tex>{"A_{ij}"}</Tex> — j-satr, i-ustunga). 2×2
          qoidasi ham aynan shu: <Tex>{"A_{11} = d,\\ A_{12} = -c,\\ A_{21} = -b,\\ A_{22} = a"}</Tex>.
        </p>
        <div className="steps3">
          <div><b>1.</b> <Tex>{`A = ${fmTex(F3)},\\ |A| = ${fTex(D3)}`}</Tex></div>
          <div><b>2.</b> Algebraik to'ldiruvchilar: <Tex>{`(A_{ij}) = ${fmTex(cof)}`}</Tex></div>
          <div><b>3.</b> Transponirlash va |A| ga bo'lish: <Tex>{`A^{-1} = \\frac{1}{${fTex(D3)}}${fmTex(adjT)}`}</Tex></div>
          <div><b>4.</b> <Tex>{`X = A^{-1}B = \\frac{1}{${fTex(D3)}}${fmTex(adjT)}\\begin{pmatrix} 20 \\\\ -11 \\\\ 9 \\end{pmatrix} = \\begin{pmatrix} ${invF.map((r) => fTex(r.reduce((s, x, j) => fAdd(s, fMul(x, fr([20, -11, 9][j]))), fr(0)))).join(" \\\\ ")} \\end{pmatrix}`}</Tex></div>
        </div>
        <Recall to="det3">Har bir <Tex>{"A_{ij} = (-1)^{i+j}M_{ij}"}</Tex> — 3-tartibli determinant darsidagi Laplas hadlari.</Recall>
        <Key>
          Teskari matritsa mavjud ⇔ <Tex>{"\\det A \\ne 0"}</Tex> ⇔ ustunlar erkli ⇔ rang to'liq ⇔ <Tex>{"A\\vec x = \\vec b"}</Tex> har qanday b uchun
          yagona yechimga ega. Bu beshta shart — <b>bitta faktning besh xil ko'rinishi</b>.
        </Key>
      </Sec>
    </LessonShell>
  );
}

/* =================================================================== */
/* RANG                                                                */
/* =================================================================== */
export function RangLesson() {
  const [A, setA] = useState<M>([1, 2, 0.5, 1]);
  const tl = useTimeline(1, 1.6);
  const Mt = lerpM(I, A, smooth(tl.t));
  const r = Math.abs(det(A)) > 1e-9 ? 2 : A.some((x) => Math.abs(x) > 1e-9) ? 1 : 0;
  // b ataylab natijalar chizig'idan tashqarida: o'quvchi uni chiziqqa sudrab, farqni o'zi ko'radi
  const pb = useMovablePoint([-2, 2], { color: C.res, constrain: snap(0.5) });
  const b: V = [pb.x, pb.y];
  const rAb = r === 2 ? 2 : r === 0 ? (Math.abs(b[0]) + Math.abs(b[1]) > 1e-9 ? 1 : 0) : (() => {
    const c = Math.abs(A[0]) + Math.abs(A[2]) > 1e-9 ? col1(A) : col2(A);
    return Math.abs(cross(c, b)) > 1e-9 ? 2 : 1;
  })();
  const dir = Math.abs(A[0]) + Math.abs(A[2]) > 1e-9 ? col1(A) : col2(A);

  const [M3, setM3] = useState<number[][]>([[1, 2, 3], [2, 4, 6], [1, 0, 1]]);
  const r3 = rankOf(M3);
  const ech = gaussSteps(M3, false).at(-1)!.M;

  return (
    <LessonShell
      id="rang"
      quiz={[
        {
          q: <><Tex>{"\\begin{pmatrix} 1 & 2 \\\\ 3 & 6 \\end{pmatrix}"}</Tex> ning rangi?</>,
          options: ["0", "1", "2"],
          correct: 1,
          explain: "2-ustun = 2 × 1-ustun: ustunlar bog'liq, tekislik chiziqqa yassilanadi. Natija 1 o'lchovli.",
        },
        {
          q: "Kroneker–Kapelli: sistema birgalikda bo'lishi uchun…",
          options: ["r(A) = n", "r(A) = r(A|b)", "det A ≠ 0"],
          correct: 1,
          explain: "b ni qo'shganda rang oshmasa, b allaqachon ustunlar qobig'ida — demak yechim bor. Oshsa, b 'yangi yo'nalish' — yechim yo'q.",
        },
      ]}
    >
      <Sec title="Rang — natija necha o'lchovli">
        <p>
          Almashtirishdan keyin butun tekislik qayerga tushadi? Ustunlar qobig'iga. Uning o'lchami — <b>rang</b>:
        </p>
        <ul className="compact">
          <li><b>r = 2</b>: tekislik tekislikka o'tadi (det ≠ 0)</li>
          <li><b>r = 1</b>: tekislik chiziqqa yassilanadi (ustunlar bog'liq)</li>
          <li><b>r = 0</b>: hammasi bitta nuqtaga (nol matritsa)</li>
        </ul>
        <Figure
          side={
            <>
              <MatrixEditor A={A} onChange={(B) => { setA(B); tl.setT(0); }} presets={[{ name: "r = 2", A: [1, 1, -0.5, 1] }, { name: "r = 1", A: [1, 2, 0.5, 1] }, { name: "r = 0", A: [0, 0, 0, 0] }]} />
              <div className="status neutral">r(A) = {r}</div>
              <p>
                Ko'k nuqta — ozod hadlar <b>b</b>.{" "}
                {r === 1 && <>▶ ni bosing, keyin b ni <b style={{ color: C.res }}>ko'k chiziq</b> ustiga suring. Kroneker–Kapelli:</>}
                {r !== 1 && "Kroneker–Kapelli:"}
              </p>
              <Tex block>{`r(A) = ${r},\\quad r(A|b) = ${rAb}`}</Tex>
              <div className={"status " + (r === rAb ? "good" : "bad")}>
                {r === rAb ? (r === 2 ? "Teng va = n: yagona yechim" : "Teng, lekin < n: cheksiz ko'p yechim") : "Teng emas: birgalikda emas (b natijalar chizig'idan tashqarida)"}
              </div>
            </>
          }
        >
          <Board faint height={380}>
            <TransformedGrid A={Mt} opacity={0.35} />
            {tl.t > 0.99 && r === 1 && <Line.ThroughPoints point1={[0, 0]} point2={dir} color={C.res} weight={8} opacity={0.35} />}
            <Arrow tip={col1(Mt)} color={C.i} label="1-ustun" weight={4} />
            <Arrow tip={col2(Mt)} color={C.j} label="2-ustun" weight={4} />
            <Arrow tip={b} color={C.res} label="b" />
            {pb.element}
          </Board>
          <Controls tl={tl} />
        </Figure>
        <Recall to="boglik">Rang = erkli ustunlarning maksimal soni (= erkli satrlarning maksimal soni).</Recall>
      </Sec>

      <Sec title="Rangni Gauss bilan topish">
        <p>Matritsani pog'onasimon ko'rinishga keltiramiz — nolga teng bo'lmagan satrlar soni rangga teng. Sonlarni o'zgartirib ko'ring:</p>
        <Figure
          side={
            <>
              <p>Pog'onasimon ko'rinish:</p>
              <Tex block>{fmTex(ech)}</Tex>
              <div className="status neutral">r = {r3}</div>
              <p className="muted small">Bu misolda 2-satr = 2 × 1-satr — Gauss uni nol satrga aylantiradi.</p>
            </>
          }
        >
          <div className="m3-editor">
            {M3.map((row, i) => row.map((x, j) => (
              <input key={i + "" + j} type="number" value={x} onChange={(e) => {
                const n = Number(e.target.value);
                if (Number.isNaN(n)) return;
                setM3(M3.map((rr, a) => rr.map((y, bb) => (a === i && bb === j ? n : y))));
              }} />
            )))}
          </div>
        </Figure>
        <Recall to="gauss">Gauss darsidagi qator amallari rangni o'zgartirmaydi — ular faqat ustunlar qobig'ini boshqacha "yozadi".</Recall>
        <Key>
          <b>Rang — tizimning "haqiqiy" o'lchami.</b> Agar <Tex>{"r(A) < n"}</Tex> bo'lsa, almashtirish nimanidir yo'qotadi: teskari yo'q, det = 0,
          bir jinsli sistema nolmas yechimga ega. Xos vektorlarni qidirishda aynan shu holat kerak bo'ladi: <Tex>{"A - \\lambda E"}</Tex> ning rangi
          to'liq bo'lmasligi.
        </Key>
      </Sec>
    </LessonShell>
  );
}

void fromCols; void Text;
