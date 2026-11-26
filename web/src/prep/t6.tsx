import { useState } from "react";
import { Line, Point, Polygon, Text } from "mafs";
import { Tex } from "../components/Tex";
import { Arrow, Board, C as COL, Slider } from "../components/viz";
import { num, pick, ri, rnz, shuffle, tn, tp, type PrepTopic } from "./core";

/** Ax + By + C = 0 ni chiroyli yozish */
export const gen = (A: number, B: number, C: number) => {
  const t = (k: number, v: string, first: boolean) =>
    k === 0 ? "" : `${k < 0 ? "-" : first ? "" : "+"} ${Math.abs(k) === 1 && v ? "" : Math.abs(k)}${v}`;
  const s = [t(A, "x", true), t(B, "y", A === 0), t(C, "", A === 0 && B === 0)].join(" ").trim();
  return `${s} = 0`;
};

/** Interaktiv: umumiy tenglama → chiziq, normal vektor, o'qlar bilan kesishish */
function LinePicture() {
  const [A, setA] = useState(2);
  const [B, setB] = useState(3);
  const [Cc, setC] = useState(-6);
  const p0: [number, number] = B !== 0 ? [0, -Cc / B] : [-Cc / A, 0];
  const dir: [number, number] = [-B, A];
  const nl = Math.hypot(A, B) || 1;
  const nTip: [number, number] = [p0[0] + (A / nl) * 2.2, p0[1] + (B / nl) * 2.2];
  const q = 0.35, ux = -B / nl, uy = A / nl, nx = A / nl, ny = B / nl;
  const corner: [number, number][] = [p0, [p0[0] + q * ux, p0[1] + q * uy], [p0[0] + q * (ux + nx), p0[1] + q * (uy + ny)], [p0[0] + q * nx, p0[1] + q * ny]];
  const xi = A !== 0 ? -Cc / A : null;
  const yi = B !== 0 ? -Cc / B : null;
  return (
    <div className="figure">
      <div className="figure-main">
        <Board height={340} x={[-6, 6]} y={[-5, 5]}>
          {(A !== 0 || B !== 0) && (
            <>
              <Line.ThroughPoints point1={p0} point2={[p0[0] + dir[0], p0[1] + dir[1]]} color={COL.res} weight={3} />
              <Polygon points={corner} color="#ffffff" fillOpacity={0.08} weight={1.5} />
              <Arrow tail={p0} tip={nTip} color={COL.orange} label="n" weight={3} />
              {xi !== null && Math.abs(xi) < 6 && <><Point x={xi} y={0} color={COL.i} /><Text x={xi} y={0} attach="se" color={COL.i} size={14}>a = {num(xi)}</Text></>}
              {yi !== null && Math.abs(yi) < 5 && <><Point x={0} y={yi} color={COL.j} /><Text x={0} y={yi} attach="w" attachDistance={12} color={COL.j} size={14}>b = {num(yi)}</Text></>}
            </>
          )}
        </Board>
      </div>
      <div className="figure-side">
        <Slider label={<Tex>A</Tex>} value={A} onChange={setA} min={-5} max={5} step={1} color={COL.orange} />
        <Slider label={<Tex>B</Tex>} value={B} onChange={setB} min={-5} max={5} step={1} color={COL.orange} />
        <Slider label={<Tex>C</Tex>} value={Cc} onChange={setC} min={-9} max={9} step={1} color={COL.res} />
        <Tex block>{A === 0 && B === 0 ? "\\text{A va B bir vaqtda 0 bo'lmaydi!}" : gen(A, B, Cc)}</Tex>
        <p><b style={{ color: COL.orange }}>n = ({A}; {B})</b> — normal vektor, chiziqqa <b>perpendikulyar</b>.</p>
        {B !== 0 && <p>Burchak koeffitsiyenti: <Tex>{`k=-\\frac{A}{B}=${tn(-A / B)}`}</Tex></p>}
        <p className="muted small">A, B ni o'zgartirsangiz — chiziq buriladi (n bilan birga). C ni o'zgartirsangiz — chiziq <b>parallel siljiydi</b>, yo'nalishi o'zgarmaydi.</p>
      </div>
    </div>
  );
}

export const T6: PrepTopic = {
  n: 6,
  slug: "chiziq",
  title: "Tekislikda to'g'ri chiziqlar",
  short: "Umumiy, burchak koeffitsiyentli, kesmalardagi, kanonik, normal tenglamalar; parallellik, perpendikulyarlik, masofa",
  minute: (
    <>
      <p><b>To'g'ri chiziq tenglamasi</b> — chiziqdagi <b>har bir</b> nuqtaning (x; y) koordinatalari qanoatlantiradigan tenglik. Bitta chiziqni bir necha xil ko'rinishda yozish mumkin — hammasi bir-biriga aylantiriladi.</p>
      <ul className="compact">
        <li><b>Umumiy</b>: <Tex>{"Ax+By+C=0"}</Tex>, bu yerda <Tex>{"\\vec n=(A;B)"}</Tex> — chiziqqa perpendikulyar (normal) vektor.</li>
        <li><b>Burchak koeffitsiyentli</b>: <Tex>{"y=kx+b"}</Tex>: k — qiyalik (<Tex>{"k=\\tan\\alpha"}</Tex>), b — Oy o'qini kesgan joy.</li>
        <li><b>Kesmalardagi</b>: <Tex>{"\\frac xa+\\frac yb=1"}</Tex>: a, b — o'qlarni kesgan joylar.</li>
      </ul>
      <p className="muted">Pastdagi rasmda A, B, C ni o'zgartirib ko'ring — har bir son nima qilishini ko'rasiz.</p>
    </>
  ),
  picture: <LinePicture />,
  uses: [
    { icon: "💰", title: "Xarajat funksiyasi", text: <><Tex>{"C=500+20q"}</Tex>: b = 500 — doimiy xarajat (ijara), k = 20 — har bir mahsulotga qo'shimcha xarajat. Bu <Tex>{"y=kx+b"}</Tex>.</> },
    { icon: "🛍️", title: "Byudjet chizig'i", text: <>Daromad 100, non 2, sut 5 so'm: <Tex>{"2x+5y=100"}</Tex> — umumiy tenglama. Kesmalari: faqat non — 50 ta, faqat sut — 20 ta.</> },
    { icon: "📈", title: "Zararsizlik nuqtasi", text: <>Tushum <Tex>{"R=50q"}</Tex> va xarajat <Tex>{"C=500+30q"}</Tex> chiziqlari kesishgan nuqta: q = 25 — shundan keyin foyda boshlanadi.</> },
    { icon: "📉", title: "Trend (regressiya)", text: <>Ma'lumotlarga eng yaqin to'g'ri chiziq — sotuv o'sishini bashorat qilishning eng oddiy usuli.</> },
  ],
  recipes: [
    {
      title: "Umumiy → burchak koeffitsiyentli",
      rule: <>y ni yolg'izlaymiz: <Tex>{"y=-\\frac AB x-\\frac CB"}</Tex>, ya'ni <Tex>{"k=-\\frac AB,\\ b=-\\frac CB"}</Tex>.</>,
      steps: [
        <><Tex>{"3x+5y+2=0"}</Tex></>,
        <><Tex>{"5y=-3x-2"}</Tex></>,
        <><Tex>{"y=-\\frac35x-\\frac25"}</Tex> → <Tex>{"k=-\\frac35,\\ b=-\\frac25"}</Tex>. Normal vektor: <Tex>{"\\vec n=(3;5)"}</Tex>.</>,
      ],
    },
    {
      title: "Umumiy → kesmalardagi; o'qlar bilan kesishish",
      rule: <>C ni o'ngga o'tkazib, <Tex>{"-C"}</Tex> ga bo'lamiz: <Tex>{"\\frac{x}{-C/A}+\\frac{y}{-C/B}=1"}</Tex>. Ox bilan kesishish: y = 0 qo'yamiz; Oy bilan: x = 0.</>,
      steps: [
        <><Tex>{"2x-3y-6=0\\Rightarrow 2x-3y=6"}</Tex></>,
        <>6 ga bo'lamiz: <Tex>{"\\frac{x}{3}+\\frac{y}{-2}=1"}</Tex></>,
        <>Ox ni <Tex>{"(3;0)"}</Tex> da, Oy ni <Tex>{"(0;-2)"}</Tex> da kesadi.</>,
      ],
    },
    {
      title: "Ikki nuqtadan o'tuvchi chiziq",
      rule: <><Tex>{"\\frac{x-x_1}{x_2-x_1}=\\frac{y-y_1}{y_2-y_1}"}</Tex>; qiyalik <Tex>{"k=\\frac{y_2-y_1}{x_2-x_1}"}</Tex>.</>,
      steps: [
        <><Tex>{"M_1(1;2),\\ M_2(3;8)"}</Tex></>,
        <><Tex>{"k=\\frac{8-2}{3-1}=3"}</Tex></>,
        <><Tex>{"y-2=3(x-1)\\Rightarrow y=3x-1"}</Tex></>,
      ],
    },
    {
      title: "Kanonik, parametrik va normal tenglamalar",
      rule: <>Kanonik: <Tex>{"\\frac{x-x_0}{m}=\\frac{y-y_0}{n}"}</Tex>, bu yerda <Tex>{"\\vec s=(m;n)"}</Tex> — yo'naltiruvchi vektor. Parametrik: <Tex>{"x=x_0+mt,\\ y=y_0+nt"}</Tex>. Normal: <Tex>{"x\\cos\\alpha+y\\sin\\alpha-p=0"}</Tex> — umumiy tenglamani <Tex>{"\\pm\\sqrt{A^2+B^2}"}</Tex> ga bo'lish (ishora C ga teskari).</>,
      steps: [
        <><Tex>{"3x-4y+10=0"}</Tex>: <Tex>{"\\vec n=(3;-4)"}</Tex>, yo'naltiruvchi <Tex>{"\\vec s=(4;3)"}</Tex> (<Tex>{"\\vec s\\perp\\vec n"}</Tex>: <Tex>{"(B;-A)"}</Tex> yoki <Tex>{"(-B;A)"}</Tex>).</>,
        <>Chiziqdagi nuqta: x = −2 → <Tex>{"-6-4y+10=0,\\ y=1"}</Tex>, <Tex>{"M_0(-2;1)"}</Tex>. Kanonik: <Tex>{"\\frac{x+2}{4}=\\frac{y-1}{3}"}</Tex></>,
        <>Normal: <Tex>{"\\sqrt{9+16}=5"}</Tex>, C = 10 &gt; 0 bo'lgani uchun <Tex>{"-5"}</Tex> ga bo'lamiz: <Tex>{"-\\frac35x+\\frac45y-2=0"}</Tex>, p = 2 — boshdan chiziqqacha masofa.</>,
      ],
    },
    {
      title: "Parallel, perpendikulyar, masofa",
      rule: <>Parallel: <Tex>{"k_1=k_2"}</Tex> (yoki <Tex>{"\\frac{A_1}{A_2}=\\frac{B_1}{B_2}"}</Tex>). Perpendikulyar: <Tex>{"k_1k_2=-1"}</Tex> (yoki <Tex>{"A_1A_2+B_1B_2=0"}</Tex>). Nuqtadan chiziqqacha: <Tex>{"d=\\frac{|Ax_0+By_0+C|}{\\sqrt{A^2+B^2}}"}</Tex>.</>,
      steps: [
        <><Tex>{"y=2x+1"}</Tex> va <Tex>{"y=-\\frac12x+3"}</Tex>: <Tex>{"2\\cdot(-\\frac12)=-1"}</Tex> → perpendikulyar.</>,
        <><Tex>{"M(2;1)"}</Tex> dan <Tex>{"3x+4y-5=0"}</Tex> gacha: <Tex>{"d=\\frac{|3\\cdot2+4\\cdot1-5|}{\\sqrt{9+16}}=\\frac{5}{5}=1"}</Tex></>,
      ],
    },
  ],
  mistakes: [
    { wrong: <><Tex>{"3x+5y+2=0"}</Tex> da <Tex>{"\\vec n=(3;2)"}</Tex></>, right: <>Normal vektor — <b>x va y oldidagi</b> sonlar: <Tex>{"(3;5)"}</Tex>. C kirmaydi.</> },
    { wrong: <><Tex>{"k=\\frac AB"}</Tex></>, right: <><Tex>{"k=-\\frac AB"}</Tex> — y ni yolg'izlaganda ishora o'zgaradi.</> },
    { wrong: <>Normal vektor chiziqqa parallel</>, right: <>Normal — <b>perpendikulyar</b>. Parallel bo'lgani — yo'naltiruvchi vektor <Tex>{"(-B;A)"}</Tex>.</> },
    { wrong: <>Perpendikulyar: <Tex>{"k_1=-k_2"}</Tex></>, right: <><Tex>{"k_1\\cdot k_2=-1"}</Tex>, ya'ni <Tex>{"k_2=-\\frac1{k_1}"}</Tex>.</> },
    { wrong: <>Masofa formulasida modulni unutish</>, right: <>Masofa manfiy bo'lmaydi: <Tex>{"|Ax_0+By_0+C|"}</Tex>.</> },
  ],
  gens: [
    {
      id: "normal",
      title: "Normal vektor",
      make: () => {
        const A = rnz(-7, 8), B = rnz(-7, 8), C = rnz(-9, 9);
        return {
          q: <><Tex>{gen(A, B, C)}</Tex> to'g'ri chiziqning normal vektorini toping.</>,
          ans: [{ label: <Tex>{"n_x"}</Tex>, v: A }, { label: <Tex>{"n_y"}</Tex>, v: B }],
          traps: [{ v: [A, C], why: "C ozod had, u normalga kirmaydi. n = (A; B)." }, { v: [B, A], why: "Tartib: birinchisi x oldidagi son (A), keyin y oldidagi (B)." }, { v: [-B, A], why: "Bu yo'naltiruvchi vektor (chiziqqa parallel). Normal — (A; B)." }],
          steps: [<>Umumiy tenglamada <Tex>{"Ax+By+C=0"}</Tex>: <Tex>{`A=${tn(A)},\\ B=${tn(B)}`}</Tex> → <Tex>{`\\vec n=(${tn(A)};\\ ${tn(B)})`}</Tex></>],
        };
      },
    },
    {
      id: "slope",
      title: "k va b",
      make: () => {
        const B = pick([1, 2, -1, -2, 3, 4, 5]);
        const A = rnz(-6, 6), C = ri(-9, 9);
        return {
          q: <><Tex>{gen(A, B, C)}</Tex> tenglamani <Tex>{"y=kx+b"}</Tex> ko'rinishga keltiring.</>,
          ans: [{ label: <Tex>k</Tex>, v: -A / B }, { label: <Tex>b</Tex>, v: -C / B }],
          traps: [{ v: [A / B, C / B], why: "y ni yolg'izlaganda ishorani o'zgartirish kerak: k = −A/B, b = −C/B." }],
          steps: [
            <><Tex>{`${tn(B)}y = ${tn(-A)}x ${-C < 0 ? "-" : "+"} ${Math.abs(C)}`}</Tex></>,
            <><Tex>{`y = ${tn(-A / B)}x ${-C / B < 0 ? "-" : "+"} ${tn(Math.abs(C / B))}`}</Tex> → <Tex>{`k=${tn(-A / B)},\\ b=${tn(-C / B)}`}</Tex></>,
          ],
        };
      },
    },
    {
      id: "intercepts",
      title: "O'qlar bilan kesishish",
      make: () => {
        const a = rnz(-6, 6), b = rnz(-6, 6), m = pick([1, 1, 2, -1]);
        // x/a + y/b = 1  =>  b x + a y - a b = 0
        const A = b * m, B = a * m, C = -a * b * m;
        return {
          q: <><Tex>{gen(A, B, C)}</Tex> chiziq Ox va Oy o'qlarini qayerda kesadi? (kesmalar a va b)</>,
          ans: [{ label: <Tex>a</Tex>, v: a }, { label: <Tex>b</Tex>, v: b }],
          traps: [{ v: [b, a], why: "a — Ox o'qida (y = 0 qo'yiladi), b — Oy o'qida (x = 0)." }, { v: [-a, -b], why: "Ishora: a = −C/A, b = −C/B." }],
          steps: [
            <>Ox: y = 0 → <Tex>{`${tn(A)}x ${C < 0 ? "-" : "+"} ${Math.abs(C)} = 0 \\Rightarrow x = ${tn(a)}`}</Tex></>,
            <>Oy: x = 0 → <Tex>{`${tn(B)}y ${C < 0 ? "-" : "+"} ${Math.abs(C)} = 0 \\Rightarrow y = ${tn(b)}`}</Tex></>,
            <>Kesmalardagi tenglama: <Tex>{`\\frac{x}{${tn(a)}}+\\frac{y}{${tn(b)}}=1`}</Tex></>,
          ],
        };
      },
    },
    {
      id: "two",
      title: "Ikki nuqtadan",
      make: () => {
        const k = rnz(-3, 3), b = ri(-5, 5);
        const x1 = ri(-4, 1), x2 = x1 + ri(1, 4);
        const P1 = [x1, k * x1 + b], P2 = [x2, k * x2 + b];
        return {
          q: <><Tex>{`M_1(${tn(P1[0])};\\ ${tn(P1[1])}),\\ M_2(${tn(P2[0])};\\ ${tn(P2[1])})`}</Tex> nuqtalardan o'tuvchi chiziqni <Tex>{"y=kx+b"}</Tex> ko'rinishda yozing.</>,
          ans: [{ label: <Tex>k</Tex>, v: k }, { label: <Tex>b</Tex>, v: b }],
          traps: [{ v: [(x2 - x1) / (P2[1] - P1[1]), P1[1] - ((x2 - x1) / (P2[1] - P1[1])) * x1], why: "k = Δy/Δx (y lar farqi surat, x lar farqi maxrajda)." }],
          steps: [
            <><Tex>{`k=\\frac{${tn(P2[1])}-${tp(P1[1])}}{${tn(P2[0])}-${tp(P1[0])}}=\\frac{${P2[1] - P1[1]}}{${x2 - x1}}=${tn(k)}`}</Tex></>,
            <><Tex>{`b = y_1 - kx_1 = ${tn(P1[1])} - ${tp(k)}\\cdot${tp(x1)} = ${tn(b)}`}</Tex></>,
          ],
        };
      },
    },
    {
      id: "dist",
      title: "Nuqtadan masofa",
      make: () => {
        const [A0, B0] = pick([[3, 4], [4, 3], [6, 8], [5, 12], [12, 5], [8, 6]]);
        const A = A0 * pick([1, -1]), B = B0 * pick([1, -1]);
        const n = Math.hypot(A, B);
        const x0 = ri(-4, 4), y0 = ri(-4, 4);
        const d = ri(1, 4);
        // |A x0 + B y0 + C| = d n
        const C = d * n * pick([1, -1]) - A * x0 - B * y0;
        const s = A * x0 + B * y0 + C;
        return {
          q: <><Tex>{`M(${tn(x0)};\\ ${tn(y0)})`}</Tex> nuqtadan <Tex>{gen(A, B, C)}</Tex> chiziqqacha masofani toping.</>,
          ans: [{ v: Math.abs(s) / n }],
          traps: [{ v: [Math.abs(s)], why: "√(A² + B²) ga bo'lishni unutdingiz." }],
          steps: [
            <><Tex>{`d=\\frac{|${tp(A)}\\cdot${tp(x0)} + ${tp(B)}\\cdot${tp(y0)} ${C < 0 ? "-" : "+"} ${Math.abs(C)}|}{\\sqrt{${A}^2+${B}^2}}=\\frac{|${s}|}{${n}}=${tn(Math.abs(s) / n)}`}</Tex></>,
          ],
        };
      },
    },
    {
      id: "rel",
      title: "Parallel / perpendikulyar",
      make: () => {
        const t = pick(["par", "perp", "cross"] as const);
        const k1 = pick([1, 2, 3, -1, -2, 0.5, -3]);
        const k2 = t === "par" ? k1 : t === "perp" ? -1 / k1 : pick([k1 + 1, k1 - 2, 2 * k1 + 1].filter((v) => v !== k1 && v * k1 !== -1));
        const b1 = ri(-5, 5), b2 = t === "par" ? b1 + rnz(-3, 3) : ri(-5, 5);
        const opts = shuffle(["Parallel", "Perpendikulyar", "Kesishadi, lekin perpendikulyar emas", "Ustma-ust tushadi"]);
        const right = t === "par" ? "Parallel" : t === "perp" ? "Perpendikulyar" : "Kesishadi, lekin perpendikulyar emas";
        const ln = (k: number, b: number) => `y = ${tn(k)}x ${b < 0 ? "-" : "+"} ${Math.abs(b)}`;
        return {
          q: <><Tex>{ln(k1, b1)}</Tex> va <Tex>{ln(k2, b2)}</Tex> chiziqlar…</>,
          choice: { options: opts, correct: opts.indexOf(right) },
          steps: [
            <><Tex>{`k_1=${tn(k1)},\\ k_2=${tn(k2)}`}</Tex></>,
            t === "par" ? <><Tex>{"k_1=k_2"}</Tex>, b lar har xil → parallel.</> : t === "perp" ? <><Tex>{`k_1k_2=${tn(k1)}\\cdot${tp(k2)}=-1`}</Tex> → perpendikulyar.</> : <><Tex>{`k_1\\ne k_2`}</Tex> va <Tex>{`k_1k_2=${tn(k1 * k2)}\\ne-1`}</Tex> → shunchaki kesishadi.</>,
          ],
        };
      },
    },
  ],
  tests: [
    { id: "t6:test:1", q: "Analitik geometriyada chiziq nima asosida o'rganiladi?", options: ["Tenglamasi", "Chizmasi", "Proyeksiyasi", "Ta'rifi", "To'g'ri javob yo'q"], correct: 0, explain: "Analitik geometriya — chiziqlarni tenglamalar orqali o'rganadi." },
    { id: "t6:test:2", q: <><Tex>{"Ax+By+C=0"}</Tex> da A va B qanday shartni qanoatlantiradi?</>, options: ["AB > 0", "A + B = 0", "A − B < 0", <Tex>{"A^2+B^2\\neq0"}</Tex>, <Tex>{"A^2-B^2\\neq0"}</Tex>], correct: 3, explain: "A va B bir vaqtda nol bo'lmasligi kerak — aks holda tenglamada x ham, y ham qolmaydi." },
    { id: "t6:test:3", q: <><Tex>{"Ax+By+C=0"}</Tex> bo'yicha tuzilgan <Tex>{"\\vec n=(A;B)"}</Tex> vektor chiziqqa…</>, options: ["parallel", "tegishli", "perpendikulyar", "perpendikulyar emas", "og'ma"], correct: 2, explain: "Shuning uchun u 'normal' vektor deyiladi." },
    { id: "t6:test:4", q: <><Tex>{"3x+5y+2=0"}</Tex> ning normal vektori:</>, options: ["(5; 2)", "(3; 5)", "(3; 2)", "(2; 5)", "(5; 3)"], correct: 1, explain: "x va y oldidagi sonlar: (3; 5)." },
    { id: "t6:test:5", q: "Burchak koeffitsiyentli tenglama:", options: [<Tex>{"y=kx+b"}</Tex>, <Tex>{"\\frac xa+\\frac yb=1"}</Tex>, <Tex>{"Ax+By+C=0"}</Tex>, <Tex>{"x\\cos\\alpha+y\\sin\\alpha-p=0"}</Tex>, <Tex>{"\\frac{x-x_0}{m}=\\frac{y-y_0}{n}"}</Tex>], correct: 0, explain: "k — burchak koeffitsiyenti (k = tg α). Qolganlari: kesmalardagi, umumiy, normal, kanonik." },
    { id: "t6:test:6", q: "Kesmalardagi tenglama:", options: [<Tex>{"y=kx+b"}</Tex>, <Tex>{"\\frac xa+\\frac yb=1"}</Tex>, <Tex>{"Ax+By+C=0"}</Tex>, <Tex>{"y-y_0=k(x-x_0)"}</Tex>, <Tex>{"\\frac{x-x_0}{m}=\\frac{y-y_0}{n}"}</Tex>], correct: 1, explain: "a va b — o'qlardan ajratilgan kesmalar." },
    { id: "t6:test:7", q: <><Tex>{"y=k_1x+b_1"}</Tex> va <Tex>{"y=k_2x+b_2"}</Tex> perpendikulyarlik sharti:</>, options: [<Tex>{"k_1=k_2"}</Tex>, <Tex>{"k_1=-k_2"}</Tex>, <Tex>{"k_1k_2=-1"}</Tex>, <Tex>{"k_1k_2=1"}</Tex>, <Tex>{"b_1=b_2"}</Tex>], correct: 2, explain: "k₁·k₂ = −1. Parallellik — k₁ = k₂." },
    { id: "t6:test:8", q: <><Tex>{"y=3x-2"}</Tex> ga parallel chiziq:</>, options: [<Tex>{"y=-3x+1"}</Tex>, <Tex>{"y=\\frac13x"}</Tex>, <Tex>{"y=3x+5"}</Tex>, <Tex>{"y=-\\frac13x+2"}</Tex>, <Tex>{"y=2x-3"}</Tex>], correct: 2, explain: "Parallel — k bir xil (3), b boshqa." },
    { id: "t6:test:9", q: <><Tex>{"M(0;0)"}</Tex> nuqtadan <Tex>{"3x+4y-10=0"}</Tex> chiziqqacha masofa:</>, options: ["10", "2", "5", "−2", "1"], correct: 1, explain: "|0 + 0 − 10| / √(9 + 16) = 10/5 = 2." },
    { id: "t6:test:10", q: <><Tex>{"\\frac{x-1}{2}=\\frac{y+3}{5}"}</Tex> chiziqning yo'naltiruvchi vektori:</>, options: ["(1; −3)", "(2; 5)", "(−1; 3)", "(5; 2)", "(2; −5)"], correct: 1, explain: "Kanonik tenglamada maxrajlar — yo'naltiruvchi vektor (m; n) = (2; 5). Surat — nuqta (1; −3)." },
  ],
  cheat: [
    { t: "Umumiy", f: <><Tex>{"Ax+By+C=0,\\ \\vec n=(A;B),\\ A^2+B^2\\neq0"}</Tex></> },
    { t: "Burchak koeff.", f: <Tex>{"y=kx+b,\\ k=\\tan\\alpha=-\\frac AB"}</Tex> },
    { t: "Kesmalardagi", f: <Tex>{"\\frac xa+\\frac yb=1"}</Tex> },
    { t: "Ikki nuqtadan", f: <Tex>{"\\frac{x-x_1}{x_2-x_1}=\\frac{y-y_1}{y_2-y_1}"}</Tex> },
    { t: "Kanonik / parametrik", f: <Tex>{"\\frac{x-x_0}{m}=\\frac{y-y_0}{n};\\ x=x_0+mt,\\ y=y_0+nt"}</Tex> },
    { t: "Normal", f: <Tex>{"x\\cos\\alpha+y\\sin\\alpha-p=0"}</Tex> },
    { t: "Parallel / perp.", f: <Tex>{"k_1=k_2\\ /\\ k_1k_2=-1"}</Tex> },
    { t: "Masofa", f: <Tex>{"d=\\frac{|Ax_0+By_0+C|}{\\sqrt{A^2+B^2}}"}</Tex> },
  ],
  lessons: ["chiziq", "skalyar"],
};
