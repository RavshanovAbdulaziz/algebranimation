import { useState } from "react";
import { Line, Point, Polygon, Text, useMovablePoint } from "mafs";
import { LessonShell, Sec, Recall, Key } from "../components/LessonShell";
import { Arrow, Board, C, Controls, Figure, snap, useTimeline } from "../components/viz";
import { Tex } from "../components/Tex";
import { add, dot, fmt, len, lin, scale, sub, type V } from "../lib/la";

const sgn = (x: number) => (x < 0 ? "-" : "+");
const ab = (x: number) => fmt(Math.abs(x));

export function ChiziqLesson() {
  const pm = useMovablePoint([1, 1], { color: C.v, constrain: snap(0.5) });
  const ps = useMovablePoint([3, 2], { color: C.orange, constrain: snap(0.5) });
  const M0: V = [pm.x, pm.y];
  let s: V = sub([ps.x, ps.y], M0);
  if (len(s) < 1e-6) s = [1, 0];
  const [l, m] = s;
  // normal: n = (A, B) = (m, -l)
  const A = m, B = -l, Cc = -(A * M0[0] + B * M0[1]);
  const [form, setForm] = useState<string>("umumiy");

  const tl = useTimeline(1, 3);
  const t = -2 + 4 * tl.t;
  const P = add(M0, scale(s, t));

  const k = Math.abs(l) > 1e-9 ? m / l : null;
  const bInt = k !== null ? M0[1] - k * M0[0] : null;
  const xInt = Math.abs(A) > 1e-9 ? -Cc / A : null;
  const yInt = Math.abs(B) > 1e-9 ? -Cc / B : null;
  const nl = Math.hypot(A, B);
  const nsign = Cc > 0 ? -1 : 1; // normal tenglamada -p ≤ 0 bo'lishi uchun
  const cosA = (nsign * A) / nl, sinA = (nsign * B) / nl, p = (-nsign * Cc) / nl;

  const pq = useMovablePoint([-2, 2], { color: C.res, constrain: snap(0.5) });
  const Q: V = [pq.x, pq.y];
  const val = A * Q[0] + B * Q[1] + Cc;

  const n: V = scale([A, B], 1.5 / nl);
  const show = (f: string) => form === f;

  const forms: { id: string; name: string; tex: string; note: string }[] = [
    { id: "umumiy", name: "Umumiy", tex: `${lin([[A, "x"], [B, "y"]], Cc)} = 0`, note: `Ax + By + C = 0. (A, B) = (${fmt(A)}, ${fmt(B)}) — normal vektor n (pushti).` },
    { id: "burchak", name: "Burchak koeffitsiyentli", tex: k === null ? "x = " + fmt(M0[0]) + "\\;(\\text{vertikal: } k \\text{ yo'q})" : `y = ${lin([[k, "x"]], bInt!)}`, note: k === null ? "Vertikal chiziqning burchak koeffitsiyenti yo'q." : `y = kx + b. k = tg φ = ${fmt(k)}: 1 qadam o'ngga (yashil) yursak, k qadam yuqoriga (qizil). b = ${fmt(bInt!)} — Oy o'qini kesish nuqtasi.` },
    { id: "kesma", name: "Kesmalardagi", tex: xInt !== null && yInt !== null && Math.abs(Cc) > 1e-9 ? `\\frac{x}{${fmt(xInt)}} + \\frac{y}{${fmt(yInt)}} = 1` : "\\text{(chiziq boshdan o'tadi yoki o'qqa parallel)}", note: "x/a + y/b = 1. a, b — o'qlardan kesgan kesmalar (ko'k nuqtalar)." },
    { id: "normal", name: "Normal", tex: `${lin([[cosA, "x"], [sinA, "y"]], -p)} = 0`, note: "x cos α + y sin α − p = 0. Birlik normal va p — boshdan chiziqqacha masofa." },
    { id: "kanonik", name: "Kanonik", tex: `\\frac{x ${sgn(-M0[0])} ${ab(M0[0])}}{${fmt(l)}} = \\frac{y ${sgn(-M0[1])} ${ab(M0[1])}}{${fmt(m)}}`, note: "(x − x₀)/l = (y − y₀)/m. M₀ nuqta va yo'naltiruvchi s = (l, m)." },
    { id: "param", name: "Parametrik", tex: `\\begin{cases} x = ${lin([[l, "t"]], M0[0])} \\\\ y = ${lin([[m, "t"]], M0[1])} \\end{cases}`, note: "r = r₀ + t·s. t — 'vaqt': ▶ ni bosing, nuqta chiziq bo'ylab yuradi." },
  ];

  return (
    <LessonShell
      id="chiziq"
      quiz={[
        {
          q: <><Tex>{"3x - 4y + 5 = 0"}</Tex> chiziqning normal vektori qaysi?</>,
          options: [<Tex>{"(3,\\ -4)"}</Tex>, <Tex>{"(4,\\ 3)"}</Tex>, <Tex>{"(-4,\\ 5)"}</Tex>],
          correct: 0,
          explain: "Umumiy tenglamada x va y oldidagi koeffitsiyentlar — normal vektor: n = (A, B) = (3, −4).",
        },
        {
          q: <><Tex>{"y = 2x + 1"}</Tex> chiziqning yo'naltiruvchi vektori qaysi?</>,
          options: [<Tex>{"(2,\\ 1)"}</Tex>, <Tex>{"(1,\\ 2)"}</Tex>, <Tex>{"(2,\\ -1)"}</Tex>],
          correct: 1,
          explain: "k = 2: 1 qadam o'ngga — 2 qadam yuqoriga. Demak s = (1, 2). (2, −1) esa normal vektor.",
        },
        {
          q: <>Nuqta <Tex>{"(1, 1)"}</Tex> uchun <Tex>{"2x + y - 5"}</Tex> ning qiymati −2. Bu nima degani?</>,
          options: ["Nuqta chiziqda yotadi", "Nuqta chiziqning normal vektorga teskari tomonida", "Chiziq bu nuqtadan o'tmaydi va bu hech narsa bildirmaydi"],
          correct: 1,
          explain: "Ax + By + C — bu n · (r − r₀): ishorasi nuqta chiziqning qaysi tomonida ekanini ko'rsatadi. Manfiy — n ga teskari tomon.",
        },
      ]}
    >
      <Sec title="Bitta chiziq — oltita yozuv">
        <p>
          Chiziqni ikki narsa to'liq aniqlaydi: undagi bitta nuqta <b style={{ color: C.v }}>M₀</b> va yo'nalish{" "}
          <b style={{ color: C.orange }}>s</b> (yo'naltiruvchi vektor). Ikkala nuqtani sudrang — pastdagi oltita tenglama bir vaqtda
          o'zgaradi. Tenglamani tanlang: chizmada uning "manbai" yonadi.
        </p>
        <div className="forms">
          {forms.map((f) => (
            <button key={f.id} className={"form-card" + (show(f.id) ? " on" : "")} onClick={() => setForm(f.id)}>
              <div className="form-name">{f.name}</div>
              <Tex>{f.tex}</Tex>
            </button>
          ))}
        </div>
        <Figure side={<><p>{forms.find((f) => f.id === form)!.note}</p>{show("param") && <p>t = <b>{fmt(t)}</b></p>}</>}>
          <Board>
            <Line.ThroughPoints point1={M0} point2={add(M0, s)} color={C.res} weight={3} />
            {(show("kanonik") || show("param")) && <Arrow tail={M0} tip={add(M0, s)} color={C.orange} label="s" weight={4} />}
            {(show("umumiy") || show("normal")) && <Arrow tail={M0} tip={add(M0, n)} color={C.w} label="n" weight={4} />}
            {show("normal") && (
              <>
                <Line.Segment point1={[0, 0]} point2={[p * cosA, p * sinA]} color={C.w} style="dashed" />
                <Point x={p * cosA} y={p * sinA} color={C.w} />
              </>
            )}
            {show("kesma") && (
              <>
                {xInt !== null && <Point x={xInt} y={0} color={C.res} />}
                {yInt !== null && <Point x={0} y={yInt} color={C.res} />}
              </>
            )}
            {show("burchak") && k !== null && (
              <>
                <Polygon points={[M0, add(M0, [1, 0]), add(M0, [1, k])]} color={C.i} fillOpacity={0.15} />
                <Line.Segment point1={M0} point2={add(M0, [1, 0])} color={C.i} weight={4} />
                <Line.Segment point1={add(M0, [1, 0])} point2={add(M0, [1, k])} color={C.j} weight={4} />
                <Text x={M0[0] + 0.5} y={M0[1]} attach={k >= 0 ? "s" : "n"} color={C.i} size={14}>1</Text>
                <Text x={M0[0] + 1} y={M0[1] + k / 2} attach="e" color={C.j} size={14}>k = {fmt(k)}</Text>
                {bInt !== null && <Point x={0} y={bInt} color={C.res} />}
              </>
            )}
            {show("param") && (
              <>
                <Arrow tail={M0} tip={P} color={C.orange} opacity={0.6} weight={2} />
                <Point x={P[0]} y={P[1]} color="#fff" />
              </>
            )}
            {pm.element}
            {ps.element}
          </Board>
          {show("param") && <Controls tl={tl} />}
        </Figure>
      </Sec>

      <Sec title="Nega (A, B) chiziqqa perpendikulyar?">
        <p>
          Chiziqdagi har qanday nuqta <Tex>{"M(x,y)"}</Tex> uchun <Tex>{"\\overrightarrow{M_0M}"}</Tex> vektori chiziq bo'ylab yo'nalgan.
          Normal <b style={{ color: C.w }}>n</b> unga perpendikulyar, demak skalyar ko'paytma nol:
        </p>
        <Tex block>{"\\vec n\\cdot\\overrightarrow{M_0M} = A(x-x_0) + B(y-y_0) = 0 \\;\\Longrightarrow\\; Ax + By + \\underbrace{(-Ax_0-By_0)}_{C} = 0"}</Tex>
        <p>Ko'k nuqtani chiziqdan tashqariga sudrang: ifoda endi nol emas, ishorasi esa qaysi tomonda ekanini aytadi.</p>
        <Figure
          side={
            <>
              <Tex block>{`A x + B y + C = ${fmt(val)}`}</Tex>
              <div className={"status " + (Math.abs(val) < 1e-9 ? "neutral" : val > 0 ? "good" : "bad")}>
                {Math.abs(val) < 1e-9 ? "Nuqta chiziqda yotadi" : val > 0 ? "n ko'rsatgan tomonda" : "n ga teskari tomonda"}
              </div>
              <p className="muted small">
                Masofa: <Tex>{`d = \\frac{|Ax+By+C|}{\\sqrt{A^2+B^2}} = ${fmt(Math.abs(val) / nl)}`}</Tex> — bu proyeksiya uzunligi.
              </p>
            </>
          }
        >
          <Board>
            <Line.ThroughPoints point1={M0} point2={add(M0, s)} color={C.res} weight={3} />
            <Arrow tail={M0} tip={add(M0, n)} color={C.w} label="n" weight={4} />
            <Arrow tail={M0} tip={Q} color={C.res} opacity={0.7} weight={2} />
            {(() => {
              const foot = sub(Q, scale([A, B], val / (nl * nl)));
              return <Line.Segment point1={Q} point2={foot} color="#fff" style="dashed" opacity={0.6} />;
            })()}
            {pq.element}
          </Board>
        </Figure>
        <Recall to="skalyar">
          <Tex>{"\\vec n\\cdot\\vec v = 0"}</Tex> ⇔ perpendikulyar. Nuqtadan chiziqqacha masofa formulasi — bu n yo'nalishidagi "soya"
          uzunligi.
        </Recall>
        <Key>
          Chiziq tenglamasi — <b>bitta chiziqli tenglama</b>. Ikki tenglama = ikki chiziq, ularning kesishishi esa{" "}
          <b>2 noma'lumli sistema yechimi</b>. Shu sababli bu mavzu tenglamalar sistemasining "qatorlar tasviri"ga to'g'ridan-to'g'ri olib
          boradi.
        </Key>
      </Sec>
    </LessonShell>
  );
}

void dot;
