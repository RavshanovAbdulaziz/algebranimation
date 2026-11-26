import { useState } from "react";
import { LaTeX, Line, Point, Polygon } from "mafs";
import { Tex } from "../components/Tex";
import { Arrow, Board, C as COL, Slider } from "../components/viz";
import { pick, ri, rnz, shuffle, tn, tp, type PrepTopic } from "./core";
import { canonAnim, distAnim, interceptsAnim, normalAnim, relAnim, slopeAnim, twoPointAnim } from "./anim";

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
              {xi !== null && Math.abs(xi) < 6 && <><Point x={xi} y={0} color={COL.i} /><LaTeX at={[xi + 0.7, -0.6]} tex={`a=${tn(xi)}`} color={COL.i} /></>}
              {yi !== null && Math.abs(yi) < 5 && <><Point x={0} y={yi} color={COL.j} /><LaTeX at={[-0.9, yi]} tex={`b=${tn(yi)}`} color={COL.j} /></>}
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
        <li><b>Umumiy tenglama:</b> <Tex>{"Ax+By+C=0"}</Tex>. Bu yerda x va y oldidagi sonlardan tuzilgan <Tex>{"\\vec n=(A;\\ B)"}</Tex> vektor chiziqqa perpendikulyar bo'ladi (normal vektor).</li>
        <li><b>Burchak koeffitsiyentli tenglama:</b> <Tex>{"y=kx+b"}</Tex>. k — chiziqning qiyaligi (<Tex>{"k=\\operatorname{tg}\\alpha"}</Tex>), b — chiziq Oy o'qini kesgan nuqta.</li>
        <li><b>Kesmalardagi tenglama:</b> <Tex>{"\\frac xa+\\frac yb=1"}</Tex>. a va b — chiziq Ox va Oy o'qlarini kesgan joylar.</li>
      </ul>
      <p className="muted">Pastdagi rasmda A, B, C ni o'zgartirib ko'ring — har bir son nima qilishini ko'rasiz.</p>
    </>
  ),
  picture: <LinePicture />,
  symbols: [
    { s: "A,\\ B,\\ C", read: "a, be, se", mean: "Umumiy tenglamadagi sonlar: A — x oldidagi, B — y oldidagi, C — ozod had." },
    { s: "\\vec n=(A;\\ B)", read: "normal vektor", mean: "Chiziqqa perpendikulyar vektor. \"Normal\" — matematikada \"perpendikulyar\" degani." },
    { s: "\\vec s=(m;\\ n)", read: "yo'naltiruvchi vektor", mean: "Chiziq bo'ylab (unga parallel) yo'nalgan vektor." },
    { s: "k", read: "burchak koeffitsiyenti", mean: "Qiyalik: x 1 ga oshganda y qanchaga o'zgaradi. $k=\\operatorname{tg}\\alpha$." },
    { s: "\\alpha", read: "alfa", mean: "Chiziq bilan Ox o'qining musbat yo'nalishi orasidagi burchak." },
    { s: "\\operatorname{tg}\\alpha", read: "tangens alfa", mean: "Burchakning tangensi (ba'zi kitoblarda $\\tan\\alpha$)." },
    { s: "M_0(x_0;\\ y_0)", read: "M nol nuqta", mean: "Chiziqdagi (yoki berilgan) ma'lum nuqta. Pastdagi 0 — \"berilgan\" degani." },
    { s: "t", read: "parametr", mean: "Parametrik tenglamada istalgan son; t o'zgarganda nuqta chiziq bo'ylab yuradi." },
    { s: "p", read: "pe", mean: "Normal tenglamada koordinatalar boshidan chiziqqacha masofa." },
    { s: "d", read: "masofa", mean: "Nuqtadan chiziqqacha eng qisqa (perpendikulyar) masofa." },
    { s: "k_1k_2=-1", read: "k bir ko'paytirilgan k ikki", mean: "Pastki raqamlar — birinchi va ikkinchi chiziqqa tegishli degani." },
  ],
  uses: [
    { icon: "💰", title: "Xarajat funksiyasi", text: <><Tex>{"C=500+20q"}</Tex>: b = 500 — doimiy xarajat (ijara), k = 20 — har bir mahsulotga qo'shimcha xarajat. Bu <Tex>{"y=kx+b"}</Tex>.</> },
    { icon: "🛍️", title: "Byudjet chizig'i", text: <>Daromad 100, non 2, sut 5 so'm: <Tex>{"2x+5y=100"}</Tex> — umumiy tenglama. Kesmalari: faqat non — 50 ta, faqat sut — 20 ta.</> },
    { icon: "📈", title: "Zararsizlik nuqtasi", text: <>Tushum <Tex>{"R=50q"}</Tex> va xarajat <Tex>{"C=500+30q"}</Tex> chiziqlari kesishgan nuqta: q = 25 — shundan keyin foyda boshlanadi.</> },
    { icon: "📉", title: "Trend (regressiya)", text: <>Ma'lumotlarga eng yaqin to'g'ri chiziq — sotuv o'sishini bashorat qilishning eng oddiy usuli.</> },
  ],
  recipes: [
    {
      title: "Umumiy tenglamadan burchak koeffitsiyentli tenglamaga",
      anim: slopeAnim(3, 5, 2),
      gens: ["slope", "normal"],
      rule: <>Tenglamadan y ni yolg'izlaymiz (y li hadni bir tomonda qoldirib, qolganini narigi tomonga o'tkazamiz va B ga bo'lamiz).</>,
      formula: "Ax+By+C=0\\quad\\Rightarrow\\quad y=-\\frac{A}{B}x-\\frac{C}{B},\\qquad k=-\\frac{A}{B},\\quad b=-\\frac{C}{B}",
      steps: [
        <><Tex>{"3x+5y+2=0"}</Tex></>,
        <><Tex>{"5y=-3x-2"}</Tex></>,
        <><Tex>{"y=-\\frac35x-\\frac25"}</Tex>, demak <Tex>{"k=-\\frac35,\\ b=-\\frac25"}</Tex>. Normal vektor: <Tex>{"\\vec n=(3;5)"}</Tex>.</>,
      ],
    },
    {
      title: "Kesmalardagi tenglama va o'qlar bilan kesishish nuqtalari",
      anim: interceptsAnim(2, -3, -6),
      gens: ["intercepts"],
      rule: <>Ozod hadni o'ng tomonga o'tkazib, ikki tomonni shu songa bo'lamiz. O'qlar bilan kesishish nuqtalarini topish uchun: Ox bilan — <Tex>{"y=0"}</Tex> qo'yamiz; Oy bilan — <Tex>{"x=0"}</Tex> qo'yamiz.</>,
      formula: "\\frac{x}{a}+\\frac{y}{b}=1,\\qquad a=-\\frac{C}{A},\\quad b=-\\frac{C}{B}",
      steps: [
        <><Tex>{"2x-3y-6=0\\Rightarrow 2x-3y=6"}</Tex></>,
        <>6 ga bo'lamiz: <Tex>{"\\frac{x}{3}+\\frac{y}{-2}=1"}</Tex></>,
        <>Ox ni <Tex>{"(3;0)"}</Tex> da, Oy ni <Tex>{"(0;-2)"}</Tex> da kesadi.</>,
      ],
    },
    {
      title: "Ikki nuqtadan o'tuvchi chiziq",
      anim: twoPointAnim([1, 2], [3, 8]),
      gens: ["two"],
      rule: <>Ikki nuqtadan bitta chiziq o'tadi. Avval qiyalik k topiladi (y lar farqi x lar farqiga bo'linadi), keyin b.</>,
      formula: "\\frac{x-x_1}{x_2-x_1}=\\frac{y-y_1}{y_2-y_1},\\qquad k=\\frac{y_2-y_1}{x_2-x_1}",
      steps: [
        <><Tex>{"M_1(1;2),\\ M_2(3;8)"}</Tex></>,
        <><Tex>{"k=\\frac{8-2}{3-1}=3"}</Tex></>,
        <><Tex>{"y-2=3(x-1)\\Rightarrow y=3x-1"}</Tex></>,
      ],
    },
    {
      title: "Kanonik, parametrik va normal tenglamalar",
      anim: canonAnim(-2, 1, 4, 3),
      gens: ["canon"],
      rule: <><b>Kanonik</b> tenglamada suratda nuqta <Tex>{"M_0(x_0;\\ y_0)"}</Tex>, maxrajda yo'naltiruvchi vektor <Tex>{"\\vec s=(m;\\ n)"}</Tex> turadi. <b>Parametrik</b> tenglama — shuning o'zi, faqat t parametr orqali. <b>Normal</b> tenglamani olish uchun umumiy tenglamani <Tex>{"\\sqrt{A^2+B^2}"}</Tex> ga bo'lamiz; ishorani C ning ishorasiga teskari qilib tanlaymiz.</>,
      formula: "\\frac{x-x_0}{m}=\\frac{y-y_0}{n},\\qquad \\begin{cases}x=x_0+m\\,t\\\\y=y_0+n\\,t\\end{cases},\\qquad x\\cos\\alpha+y\\sin\\alpha-p=0",
      steps: [
        <><Tex>{"3x-4y+10=0"}</Tex>: <Tex>{"\\vec n=(3;-4)"}</Tex>, yo'naltiruvchi <Tex>{"\\vec s=(4;3)"}</Tex> (<Tex>{"\\vec s\\perp\\vec n"}</Tex>: <Tex>{"(B;-A)"}</Tex> yoki <Tex>{"(-B;A)"}</Tex>).</>,
        <>Chiziqdagi biror nuqtani topamiz: <Tex>{"x=-2"}</Tex> desak, <Tex>{"-6-4y+10=0,\\ y=1"}</Tex>, <Tex>{"M_0(-2;1)"}</Tex>. Kanonik: <Tex>{"\\frac{x+2}{4}=\\frac{y-1}{3}"}</Tex></>,
        <>Normal: <Tex>{"\\sqrt{9+16}=5"}</Tex>, C = 10 &gt; 0 bo'lgani uchun <Tex>{"-5"}</Tex> ga bo'lamiz: <Tex>{"-\\frac35x+\\frac45y-2=0"}</Tex>, p = 2 — boshdan chiziqqacha masofa.</>,
      ],
    },
    {
      title: "Parallel, perpendikulyar, masofa",
      anim: distAnim(3, 4, -5, 2, 1),
      gens: ["rel", "dist"],
      rule: <>Ikki chiziq <b>parallel</b> bo'lishi uchun qiyaliklari teng bo'lishi kerak. <b>Perpendikulyar</b> bo'lishi uchun qiyaliklari ko'paytmasi <Tex>{"-1"}</Tex> ga teng bo'lishi kerak. Nuqtadan chiziqqacha masofa: nuqta koordinatalarini tenglamaning chap tomoniga qo'yib, modulini olamiz va <Tex>{"\\sqrt{A^2+B^2}"}</Tex> ga bo'lamiz.</>,
      formula: "\\text{parallel: } k_1=k_2,\\qquad \\text{perpendikulyar: } k_1\\cdot k_2=-1,\\qquad d=\\frac{|Ax_0+By_0+C|}{\\sqrt{A^2+B^2}}",
      steps: [
        <><Tex>{"y=2x+1"}</Tex> va <Tex>{"y=-\\frac12x+3"}</Tex>: <Tex>{"k_1\\cdot k_2=2\\cdot\\left(-\\frac12\\right)=-1"}</Tex>, demak chiziqlar perpendikulyar.</>,
        <><Tex>{"M(2;1)"}</Tex> dan <Tex>{"3x+4y-5=0"}</Tex> gacha: <Tex>{"d=\\frac{|3\\cdot2+4\\cdot1-5|}{\\sqrt{9+16}}=\\frac{5}{5}=1"}</Tex></>,
      ],
    },
  ],
  mistakes: [
    { wrong: <><Tex>{"3x+5y+2=0"}</Tex> da <Tex>{"\\vec n=(3;2)"}</Tex></>, right: <>Normal vektor — <b>x va y oldidagi</b> sonlar: <Tex>{"(3;5)"}</Tex>. C kirmaydi.</> },
    { wrong: <><Tex>{"k=\\frac AB"}</Tex></>, right: <><Tex>{"k=-\\frac AB"}</Tex>: y ni yolg'izlaganda ishora o'zgaradi.</> },
    { wrong: <>Normal vektor chiziqqa parallel</>, right: <>Normal — <b>perpendikulyar</b>. Parallel bo'lgani — yo'naltiruvchi vektor <Tex>{"(-B;A)"}</Tex>.</> },
    { wrong: <>Perpendikulyarlik sharti <Tex>{"k_1=-k_2"}</Tex> deb o'ylash</>, right: <><Tex>{"k_1\\cdot k_2=-1"}</Tex>, ya'ni <Tex>{"k_2=-\\frac1{k_1}"}</Tex>.</> },
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
          traps: [{ v: [A, C], why: "C — ozod had, u normal vektorga kirmaydi: $\\vec n=(A;\\ B)$." }, { v: [B, A], why: "Tartib: avval x oldidagi son (A), keyin y oldidagi son (B)." }, { v: [-B, A], why: "Bu yo'naltiruvchi vektor (chiziqqa parallel). Normal vektor esa $(A;\\ B)$." }],
          anim: normalAnim(A, B, C),
          steps: [<>Umumiy tenglamada <Tex>{"Ax+By+C=0"}</Tex>: <Tex>{`A=${tn(A)},\\ B=${tn(B)}`}</Tex>, demak <Tex>{`\\vec n=(${tn(A)};\\ ${tn(B)})`}</Tex></>],
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
          traps: [{ v: [A / B, C / B], why: "y ni yolg'izlaganda ishora o'zgaradi: $k=-\\dfrac{A}{B},\\ b=-\\dfrac{C}{B}$." }],
          anim: slopeAnim(A, B, C),
          steps: [
            <><Tex>{`${tn(B)}y = ${tn(-A)}x ${-C < 0 ? "-" : "+"} ${Math.abs(C)}`}</Tex></>,
            <><Tex>{`y = ${tn(-A / B)}x ${-C / B < 0 ? "-" : "+"} ${tn(Math.abs(C / B))}`}</Tex>, demak <Tex>{`k=${tn(-A / B)},\\ b=${tn(-C / B)}`}</Tex></>,
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
          traps: [{ v: [b, a], why: "a — Ox o'qidagi kesma ($y=0$ qo'yiladi), b — Oy o'qidagi kesma ($x=0$ qo'yiladi)." }, { v: [-a, -b], why: "Ishorada xato: $a=-\\dfrac{C}{A},\\ b=-\\dfrac{C}{B}$." }],
          anim: interceptsAnim(A, B, C),
          steps: [
            <>Ox o'qi bilan kesishish: <Tex>{"y=0"}</Tex> qo'yamiz: <Tex>{`${tn(A)}x ${C < 0 ? "-" : "+"} ${Math.abs(C)} = 0 \\Rightarrow x = ${tn(a)}`}</Tex></>,
            <>Oy o'qi bilan kesishish: <Tex>{"x=0"}</Tex> qo'yamiz: <Tex>{`${tn(B)}y ${C < 0 ? "-" : "+"} ${Math.abs(C)} = 0 \\Rightarrow y = ${tn(b)}`}</Tex></>,
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
          traps: [{ v: [(x2 - x1) / (P2[1] - P1[1]), P1[1] - ((x2 - x1) / (P2[1] - P1[1])) * x1], why: "Qiyalik $k=\\dfrac{y_2-y_1}{x_2-x_1}$: y lar farqi suratda, x lar farqi maxrajda." }],
          anim: twoPointAnim(P1, P2),
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
          traps: [{ v: [Math.abs(s)], why: "$\\sqrt{A^2+B^2}$ ga bo'lishni unutdingiz." }],
          anim: distAnim(A, B, C, x0, y0),
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
          anim: relAnim(k1, b1, k2, b2),
          steps: [
            <><Tex>{`k_1=${tn(k1)},\\ k_2=${tn(k2)}`}</Tex></>,
            t === "par" ? <><Tex>{"k_1=k_2"}</Tex>, b lar har xil — chiziqlar parallel.</> : t === "perp" ? <><Tex>{`k_1k_2=${tn(k1)}\\cdot${tp(k2)}=-1`}</Tex>, demak chiziqlar perpendikulyar.</> : <><Tex>{`k_1\\ne k_2`}</Tex> va <Tex>{`k_1k_2=${tn(k1 * k2)}\\ne-1`}</Tex>, demak chiziqlar kesishadi, lekin perpendikulyar emas.</>,
          ],
        };
      },
    },
    {
      id: "canon",
      title: "Kanonik tenglamani o'qish",
      make: () => {
        const x0 = ri(-5, 5), y0 = ri(-5, 5), m = rnz(-5, 6), n = rnz(-5, 6);
        const fr = (v: string, a: number) => (a === 0 ? v : `${v} ${a < 0 ? "+" : "-"} ${Math.abs(a)}`);
        return {
          q: <><Tex>{`\\frac{${fr("x", x0)}}{${tn(m)}} = \\frac{${fr("y", y0)}}{${tn(n)}}`}</Tex> chiziq o'tadigan nuqta <Tex>{"M_0(x_0;\\ y_0)"}</Tex> va yo'naltiruvchi vektor <Tex>{"\\vec s=(m;\\ n)"}</Tex> ni toping.</>,
          ans: [{ label: <Tex>{"x_0"}</Tex>, v: x0 }, { label: <Tex>{"y_0"}</Tex>, v: y0 }, { label: <Tex>m</Tex>, v: m }, { label: <Tex>n</Tex>, v: n }],
          traps: [{ v: [-x0, -y0, m, n], why: "Nuqta ishorasi: suratda $x-x_0$ turadi, shuning uchun $x+3$ bo'lsa $x_0=-3$." }],
          anim: canonAnim(x0, y0, m, n),
          steps: [
            <><b>Kanonik tenglama shakli:</b> <Tex>{"\\frac{x-x_0}{m}=\\frac{y-y_0}{n}"}</Tex> — suratda nuqta, maxrajda yo'naltiruvchi vektor.</>,
            <><b>Suratdan nuqtani o'qiymiz</b> (ishoraga e'tibor: <Tex>{"x-x_0"}</Tex> da minus turadi): <Tex>{`${fr("x", x0)} = x - ${tp(x0)},\\ \\ ${fr("y", y0)} = y - ${tp(y0)}\\ \\Rightarrow\\ M_0(${tn(x0)};\\ ${tn(y0)})`}</Tex></>,
            <><b>Maxrajdan vektorni o'qiymiz:</b> <Tex>{`\\vec s = (${tn(m)};\\ ${tn(n)})`}</Tex>.</>,
          ],
        };
      },
    },
  ],
  tests: [
    { id: "t6:test:1", q: "Analitik geometriyada chiziq nima asosida o'rganiladi?", options: ["Tenglamasi", "Chizmasi", "Proyeksiyasi", "Ta'rifi", "To'g'ri javob yo'q"], correct: 0, explain: "Analitik geometriya — chiziqlarni tenglamalar orqali o'rganadi." },
    { id: "t6:test:2", q: <><Tex>{"Ax+By+C=0"}</Tex> da A va B qanday shartni qanoatlantiradi?</>, options: ["$AB>0$", "$A+B=0$", "$A-B<0$", <Tex>{"A^2+B^2\\neq0"}</Tex>, <Tex>{"A^2-B^2\\neq0"}</Tex>], correct: 3, explain: "A va B bir vaqtda nol bo'lmasligi kerak — aks holda tenglamada x ham, y ham qolmaydi." },
    { id: "t6:test:3", q: <><Tex>{"Ax+By+C=0"}</Tex> bo'yicha tuzilgan <Tex>{"\\vec n=(A;B)"}</Tex> vektor chiziqqa…</>, options: ["parallel", "tegishli", "perpendikulyar", "perpendikulyar emas", "og'ma"], correct: 2, explain: "Shuning uchun u 'normal' vektor deyiladi." },
    { id: "t6:test:4", q: <><Tex>{"3x+5y+2=0"}</Tex> ning normal vektori:</>, options: ["$(5;\\ 2)$", "$(3;\\ 5)$", "$(3;\\ 2)$", "$(2;\\ 5)$", "$(5;\\ 3)$"], correct: 1, explain: "x va y oldidagi sonlar: $\\vec n=(3;\\ 5)$." },
    { id: "t6:test:5", q: "Burchak koeffitsiyentli tenglama:", options: [<Tex>{"y=kx+b"}</Tex>, <Tex>{"\\frac xa+\\frac yb=1"}</Tex>, <Tex>{"Ax+By+C=0"}</Tex>, <Tex>{"x\\cos\\alpha+y\\sin\\alpha-p=0"}</Tex>, <Tex>{"\\frac{x-x_0}{m}=\\frac{y-y_0}{n}"}</Tex>], correct: 0, explain: "k — burchak koeffitsiyenti, $k=\\operatorname{tg}\\alpha$. Qolganlari: kesmalardagi, umumiy, normal va kanonik tenglamalar." },
    { id: "t6:test:6", q: "Kesmalardagi tenglama:", options: [<Tex>{"y=kx+b"}</Tex>, <Tex>{"\\frac xa+\\frac yb=1"}</Tex>, <Tex>{"Ax+By+C=0"}</Tex>, <Tex>{"y-y_0=k(x-x_0)"}</Tex>, <Tex>{"\\frac{x-x_0}{m}=\\frac{y-y_0}{n}"}</Tex>], correct: 1, explain: "a va b — o'qlardan ajratilgan kesmalar." },
    { id: "t6:test:7", q: <><Tex>{"y=k_1x+b_1"}</Tex> va <Tex>{"y=k_2x+b_2"}</Tex> perpendikulyarlik sharti:</>, options: [<Tex>{"k_1=k_2"}</Tex>, <Tex>{"k_1=-k_2"}</Tex>, <Tex>{"k_1k_2=-1"}</Tex>, <Tex>{"k_1k_2=1"}</Tex>, <Tex>{"b_1=b_2"}</Tex>], correct: 2, explain: "Perpendikulyarlik: $k_1\\cdot k_2=-1$. Parallellik: $k_1=k_2$." },
    { id: "t6:test:8", q: <><Tex>{"y=3x-2"}</Tex> ga parallel chiziq:</>, options: [<Tex>{"y=-3x+1"}</Tex>, <Tex>{"y=\\frac13x"}</Tex>, <Tex>{"y=3x+5"}</Tex>, <Tex>{"y=-\\frac13x+2"}</Tex>, <Tex>{"y=2x-3"}</Tex>], correct: 2, explain: "Parallel chiziqlarda k bir xil ($k=3$), b esa boshqa." },
    { id: "t6:test:9", q: <><Tex>{"M(0;0)"}</Tex> nuqtadan <Tex>{"3x+4y-10=0"}</Tex> chiziqqacha masofa:</>, options: ["10", "2", "5", "$-2$", "1"], correct: 1, explain: "$d=\\dfrac{|3\\cdot0+4\\cdot0-10|}{\\sqrt{3^2+4^2}}=\\dfrac{10}{5}=2$." },
    { id: "t6:test:10", q: <><Tex>{"\\frac{x-1}{2}=\\frac{y+3}{5}"}</Tex> chiziqning yo'naltiruvchi vektori:</>, options: ["$(1;\\ -3)$", "$(2;\\ 5)$", "$(-1;\\ 3)$", "$(5;\\ 2)$", "$(2;\\ -5)$"], correct: 1, explain: "Kanonik tenglamada maxrajlar — yo'naltiruvchi vektor: $\\vec s=(2;\\ 5)$. Suratdagi sonlar esa chiziqdagi nuqtani beradi: $M_0(1;\\ -3)$." },
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
