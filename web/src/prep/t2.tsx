import { Tex } from "../components/Tex";
import { det2, pick, ri, rnz, tmat, tn, tp, type PrepTopic } from "./core";

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
        <><Tex>{tmat([[1, 0, -5], [2, 7, 3]])}</Tex>: 2 ta satr, 3 ta ustun, demak tartibi <b>2×3</b> (3×2 emas!).</>,
        <>Birlik matritsa: <Tex>{"E_2=\\begin{pmatrix}1&0\\\\0&1\\end{pmatrix},\\ E_3=\\begin{pmatrix}1&0&0\\\\0&1&0\\\\0&0&1\\end{pmatrix}"}</Tex>. <Tex>{"\\begin{pmatrix}0&1\\\\1&0\\end{pmatrix}"}</Tex> — birlik EMAS (1 lar yon diagonalda).</>,
        <>Birlik matritsa sonlardagi "1" kabi: <Tex>{"AE = EA = A"}</Tex>.</>,
      ],
    },
    {
      title: "Qo'shish, ayirish, songa ko'paytirish",
      rule: <>Faqat <b>bir xil tartibli</b> matritsalar qo'shiladi: bir xil joyda turgan elementlar qo'shiladi. Songa ko'paytirishda <b>har bir</b> element shu songa ko'paytiriladi.</>,
      formula: "\\begin{pmatrix}a&b\\\\c&d\\end{pmatrix}+\\begin{pmatrix}p&q\\\\r&s\\end{pmatrix}=\\begin{pmatrix}a+p&b+q\\\\c+r&d+s\\end{pmatrix},\\qquad k\\cdot\\begin{pmatrix}a&b\\\\c&d\\end{pmatrix}=\\begin{pmatrix}ka&kb\\\\kc&kd\\end{pmatrix}",
      steps: [
        <><Tex>{"A=\\begin{pmatrix}1&2\\\\3&4\\end{pmatrix},\\ B=\\begin{pmatrix}0&-1\\\\5&2\\end{pmatrix}"}</Tex>. <Tex>{"2A - B"}</Tex> ni topamiz.</>,
        <><Tex>{"2A=\\begin{pmatrix}2&4\\\\6&8\\end{pmatrix}"}</Tex> — har bir element 2 ga.</>,
        <><Tex>{"2A-B=\\begin{pmatrix}2-0&4-(-1)\\\\6-5&8-2\\end{pmatrix}=\\begin{pmatrix}2&5\\\\1&6\\end{pmatrix}"}</Tex></>,
      ],
    },
    {
      title: "Ko'paytirish: satrni ustunga",
      rule: <>Natijaning i-satr, j-ustundagi elementini topish uchun A ning <span style={{ color: Y }}>i-satrini</span> va B ning <span style={{ color: R }}>j-ustunini</span> olamiz, elementlarni juft-juft ko'paytirib, qo'shamiz. Shart: A ning ustunlari soni B ning satrlari soniga teng bo'lishi kerak.</>,
      formula: `\\begin{pmatrix} ${c(Y, "a_1")} & ${c(Y, "a_2")} & ${c(Y, "a_3")} \\end{pmatrix}\\cdot\\begin{pmatrix} ${c(R, "b_1")} \\\\ ${c(R, "b_2")} \\\\ ${c(R, "b_3")} \\end{pmatrix} = ${c(Y, "a_1")}${c(R, "b_1")} + ${c(Y, "a_2")}${c(R, "b_2")} + ${c(Y, "a_3")}${c(R, "b_3")}`,
      steps: [
        <><Tex>{`A=${tmat(EA)}_{2\\times3},\\ B=${tmat(EB)}_{3\\times2}`}</Tex>. Ichki sonlar teng (3 va 3), demak ko'paytirish mumkin. Natija tartibi tashqi sonlardan: <b>2×2</b>.</>,
        <><Tex>{`(AB)_{11}: ${hlRow(EA, 0)}${hlCol(EB, 0)} \\to ${cellTex(EA, EB, 0, 0)}`}</Tex></>,
        <><Tex>{`(AB)_{12}: ${hlRow(EA, 0)}${hlCol(EB, 1)} \\to ${cellTex(EA, EB, 0, 1)}`}</Tex></>,
        <><Tex>{`(AB)_{21}: ${hlRow(EA, 1)}${hlCol(EB, 0)} \\to ${cellTex(EA, EB, 1, 0)}`}</Tex></>,
        <><Tex>{`(AB)_{22}: ${hlRow(EA, 1)}${hlCol(EB, 1)} \\to ${cellTex(EA, EB, 1, 1)}`}</Tex></>,
        <><Tex>{`AB = ${tmat(mul(EA, EB))}`}</Tex>. Diqqat: <Tex>{"BA"}</Tex> 3×3 bo'lardi — umuman <Tex>{"AB\\neq BA"}</Tex>.</>,
      ],
    },
    {
      title: "Transponirlash",
      rule: <>Transponirlash: 1-satr 1-ustun bo'lib yoziladi, 2-satr 2-ustun bo'lib va hokazo. <Tex>{"m\\times n"}</Tex> tartibli matritsa <Tex>{"n\\times m"}</Tex> tartibli bo'ladi.</>,
      formula: "\\begin{pmatrix}a&b&c\\\\d&e&f\\end{pmatrix}^T=\\begin{pmatrix}a&d\\\\b&e\\\\c&f\\end{pmatrix}",
      steps: [
        <><Tex>{`${tmat(EA)}^T = ${tmat(EA[0].map((_, j) => EA.map((r) => r[j])))}`}</Tex> — 1-satr (1, 2, 0) endi 1-ustun.</>,
        <>Xossa: <Tex>{"(AB)^T = B^TA^T"}</Tex> (tartib almashadi!).</>,
      ],
    },
    {
      title: "Teskari matritsa (2×2)",
      rule: <>Teskari matritsa faqat determinant noldan farqli bo'lsa mavjud. 2×2 uchun uch qadam: <b>bosh diagonaldagi sonlarning o'rnini almashtiring</b>, <b>yon diagonaldagi sonlarning ishorasini o'zgartiring</b>, <b>hammasini determinantga bo'ling</b>.</>,
      formula: "\\begin{pmatrix}a&b\\\\c&d\\end{pmatrix}^{-1}=\\frac{1}{ad-bc}\\begin{pmatrix}d&-b\\\\-c&a\\end{pmatrix}",
      steps: [
        <><Tex>{"A=\\begin{pmatrix}3&1\\\\5&2\\end{pmatrix}"}</Tex></>,
        <><Tex>{"\\det A = 3\\cdot2-1\\cdot5 = 1 \\neq 0"}</Tex> ✓ teskarisi bor.</>,
        <>3 va 2 o'rin almashadi, 1 va 5 ishorasi o'zgaradi: <Tex>{"\\begin{pmatrix}2&-1\\\\-5&3\\end{pmatrix}"}</Tex></>,
        <>Determinantga (1 ga) bo'lamiz: <Tex>{"A^{-1}=\\begin{pmatrix}2&-1\\\\-5&3\\end{pmatrix}"}</Tex>. Tekshiruv: <Tex>{"AA^{-1}=E"}</Tex>.</>,
        <>3×3 uchun: <Tex>{"A^{-1}=\\frac{1}{|A|}\\begin{pmatrix}A_{11}&A_{21}&A_{31}\\\\A_{12}&A_{22}&A_{32}\\\\A_{13}&A_{23}&A_{33}\\end{pmatrix}"}</Tex> — algebraik to'ldiruvchilar <b>transponirlangan</b> holda.</>,
      ],
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
          steps: [
            <>Ichki sonlar: A ning ustunlari <b>{n}</b>, B ning satrlari <b>{p}</b>.</>,
            ok ? <>{n} = {p} ✓ — ko'paytirish mumkin. Natija tashqi sonlardan: <b>{m}×{q}</b>.</> : <>{n} ≠ {p} — ko'paytirib <b>bo'lmaydi</b>.</>,
          ],
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
          q: <><Tex>{`A=${tmat(A)},\\ B=${tmat(Bm)}`}</Tex>. <Tex>{`AB`}</Tex> ko'paytmaning <Tex>{`(${i + 1},${j + 1})`}</Tex> elementini toping.</>,
          ans: [{ v }],
          traps: wrong !== v ? [{ v: [wrong], why: "Boshqa ustunni oldingiz: j-element uchun B ning j-ustuni kerak." }] : [],
          steps: [
            <>A ning <b>{i + 1}-satri</b> va B ning <b>{j + 1}-ustuni</b>: <Tex>{`${hlRow(A, i)} ${hlCol(Bm, j)}`}</Tex></>,
            <><Tex>{cellTex(A, Bm, i, j)}</Tex></>,
          ],
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
          steps: [0, 1].flatMap((i) => [0, 1].map((j) => <><Tex>{`c_{${i + 1}${j + 1}}: ${cellTex(A, Bm, i, j)}`}</Tex></>)),
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
          q: <><Tex>{`A=${tmat(A)},\\ B=${tmat(Bm)}`}</Tex>. <Tex>{`${tn(k)}A ${m < 0 ? "-" : "+"} ${tn(Math.abs(m))}B`}</Tex> ni toping.</>,
          ans: [[0, 0], [0, 1], [1, 0], [1, 1]].map(([i, j]) => ({ label: <Tex>{`(${i + 1},${j + 1})`}</Tex>, v: R2[i][j] })),
          steps: [
            <><Tex>{`${tn(k)}A = ${tmat(A.map((r) => r.map((x) => k * x)))},\\quad ${tn(m)}B = ${tmat(Bm.map((r) => r.map((x) => m * x)))}`}</Tex></>,
            <>Mos elementlarni qo'shamiz: <Tex>{tmat(R2)}</Tex></>,
          ],
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
          traps: i <= 2 && j <= 3 && A[i - 1]?.[j - 1] !== v ? [{ v: [A[i - 1][j - 1]], why: "Bu A ning o'zidagi element. $A^T$ ning i-satr, j-ustundagi elementi A ning j-satr, i-ustundagi elementiga teng: $(A^T)_{ij}=a_{ji}$." }] : [],
          steps: [
            <><Tex>{`(A^T)_{${i}${j}} = a_{${j}${i}}`}</Tex> — indekslar almashadi.</>,
            <>A ning {j}-satri, {i}-ustuni: <b>{v}</b>. <Tex>{`A^T=${tmat(A[0].map((_, jj) => A.map((r) => r[jj])))}`}</Tex></>,
          ],
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
          steps: [
            <><Tex>{`\\det A = ${tp(a)}\\cdot${tp(dd)} - ${tp(b)}\\cdot${tp(cc)} = ${tn(d)}`}</Tex></>,
            <>Almashtir va ishorani o'zgartir: <Tex>{`\\begin{pmatrix} ${tn(dd)} & ${tn(-b)} \\\\ ${tn(-cc)} & ${tn(a)} \\end{pmatrix}`}</Tex></>,
            <><Tex>{`${tn(d)}`}</Tex> ga bo'lamiz: <Tex>{tmat(inv)}</Tex></>,
          ],
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
