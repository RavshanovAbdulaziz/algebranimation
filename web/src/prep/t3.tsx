import { Tex } from "../components/Tex";
import { det2, det3, pick, ri, rnz, tmat, tn, tp, type PrepTopic } from "./core";

/** a·x + b·y ko'rinishidagi had yozuvi */
const lhs = (cs: number[], vars: string[]) =>
  cs
    .map((k, i) => (k === 0 ? "" : `${k < 0 ? "-" : i && cs.slice(0, i).some((z) => z !== 0) ? "+" : ""} ${Math.abs(k) === 1 ? "" : Math.abs(k)}${vars[i]}`))
    .join(" ")
    .trim() || "0";
const sys = (A: number[][], b: number[], vars: string[]) =>
  `\\begin{cases} ${A.map((r, i) => `${lhs(r, vars)} = ${tn(b[i])}`).join(" \\\\ ")} \\end{cases}`;
const withCol = (A: number[][], b: number[], j: number) => A.map((r, i) => r.map((x, k) => (k === j ? b[i] : x)));

function make2(): { A: number[][]; b: number[]; x: number[] } {
  for (;;) {
    const A = [[rnz(-4, 5), rnz(-4, 5)], [rnz(-4, 5), rnz(-4, 5)]];
    if (det2(A) === 0) continue;
    const x = [ri(-4, 5), ri(-4, 5)];
    return { A, b: A.map((r) => r[0] * x[0] + r[1] * x[1]), x };
  }
}
function make3(): { A: number[][]; b: number[]; x: number[] } {
  for (;;) {
    const A = [0, 1, 2].map(() => [0, 1, 2].map(() => ri(-2, 3)));
    const d = det3(A);
    if (d === 0 || Math.abs(d) > 30) continue;
    const x = [ri(-3, 3), ri(-3, 3), ri(-3, 3)];
    return { A, b: A.map((r) => r[0] * x[0] + r[1] * x[1] + r[2] * x[2]), x };
  }
}

function kramer2Steps(A: number[][], b: number[]) {
  const D = det2(A), Dx = det2(withCol(A, b, 0)), Dy = det2(withCol(A, b, 1));
  return [
    <>Asosiy determinant (koeffitsiyentlardan): <Tex>{`\\Delta = ${tmat(A, "v")} = ${tp(A[0][0])}\\cdot${tp(A[1][1])} - ${tp(A[0][1])}\\cdot${tp(A[1][0])} = ${tn(D)}`}</Tex>. <Tex>{"\\Delta\\ne0"}</Tex> — yagona yechim bor.</>,
    <><Tex>{"\\Delta_x"}</Tex>: 1-ustun o'rniga ozod hadlar: <Tex>{`\\Delta_x = ${tmat(withCol(A, b, 0), "v")} = ${tn(Dx)}`}</Tex></>,
    <><Tex>{"\\Delta_y"}</Tex>: 2-ustun o'rniga ozod hadlar: <Tex>{`\\Delta_y = ${tmat(withCol(A, b, 1), "v")} = ${tn(Dy)}`}</Tex></>,
    <><Tex>{`x = \\frac{\\Delta_x}{\\Delta} = \\frac{${tn(Dx)}}{${tn(D)}} = ${tn(Dx / D)},\\quad y = \\frac{\\Delta_y}{\\Delta} = \\frac{${tn(Dy)}}{${tn(D)}} = ${tn(Dy / D)}`}</Tex></>,
  ];
}

const EXA = [[2, 1], [1, -2]];
const EXB = [3, -1];

export const T3: PrepTopic = {
  n: 3,
  slug: "sistema",
  title: "Chiziqli tenglamalar sistemasi (CHTS)",
  short: "Birgalikda/aniq/aniqmas, Kramer usuli, matritsa usuli, Gauss usuli, Kroneker–Kapelli",
  minute: (
    <>
      <p><b>Sistema — bir vaqtda bajarilishi kerak bo'lgan bir nechta tenglama.</b> Masalan:</p>
      <Tex block>{"\\begin{cases} 2x + y = 3 \\\\ x - 2y = -1 \\end{cases}"}</Tex>
      <p>Chiziqli degani — noma'lumlar faqat birinchi darajada: <Tex>{"x^2"}</Tex>, <Tex>{"\\dfrac{1}{x}"}</Tex>, <Tex>{"x\\cdot y"}</Tex> kabi hadlar yo'q.</p>
      <p>Javob uch xil bo'lishi mumkin:</p>
      <ul className="compact">
        <li><b>yagona yechim</b> — sistema <i>aniq</i>;</li>
        <li><b>cheksiz ko'p yechim</b> — sistema <i>aniqmas</i>;</li>
        <li><b>yechim yo'q</b> — sistema <i>birgalikda emas</i>.</li>
      </ul>
      <p>Kamida bitta yechimi bo'lsa, sistema <b>birgalikda</b> deyiladi.</p>
      <p>Yechishning uchta usuli bor, hammasi bir xil javob beradi:</p>
      <ul className="compact">
        <li><b>Kramer usuli</b> — determinantlar orqali. 2–3 ta noma'lumda eng tez.</li>
        <li><b>Matritsa usuli</b> — teskari matritsa orqali.</li>
        <li><b>Gauss usuli</b> — noma'lumlarni birin-ketin yo'qotib borish. Har qanday sistemaga ishlaydi.</li>
      </ul>
    </>
  ),
  symbols: [
    { s: "\\begin{cases} \\dots \\\\ \\dots \\end{cases}", read: "figurali qavs", mean: "Qavs ichidagi tenglamalar bir vaqtda bajarilishi kerak (sistema)." },
    { s: "x_1,\\ x_2,\\ x_3", read: "x bir, x ikki, x uch", mean: "Noma'lumlar (x, y, z o'rniga). Pastki raqam — tartib raqami." },
    { s: "\\Delta", read: "delta", mean: "Asosiy determinant — noma'lumlar oldidagi sonlardan (koeffitsiyentlardan) tuzilgan." },
    { s: "\\Delta_x,\\ \\Delta_1", read: "delta iks, delta bir", mean: "x ning ustuni o'rniga o'ng tomondagi sonlar (ozod hadlar) qo'yilgan determinant." },
    { s: "A", read: "A matritsa", mean: "Koeffitsiyentlar jadvali." },
    { s: "X,\\ B", read: "iks, be", mean: "X — noma'lumlar ustuni, B — ozod hadlar ustuni. Sistema qisqacha: $AX = B$." },
    { s: "A^{-1}", read: "A teskari", mean: "A ga teskari matritsa ($-1$ daraja emas, belgi!). $A\\cdot A^{-1} = E$." },
    { s: "(A\\,|\\,B)", read: "kengaytirilgan matritsa", mean: "A ning o'ng tomoniga ozod hadlar ustuni yozilgan jadval (Gauss usulida)." },
    { s: "R_2 - 2R_1", read: "R ikki minus ikki R bir", mean: "Gauss usulidagi satr amali: 2-satrdan 1-satrning 2 baravarini ayiramiz. R — satr (inglizcha row)." },
    { s: "\\operatorname{rang} A", read: "A ning rangi", mean: "Jadvalda nechta \"haqiqiy\", bir-birini takrorlamaydigan satr borligi." },
  ],
  uses: [
    { icon: "⚖️", title: "Bozor muvozanati", text: <>Talab <Tex>{"Q=100-2P"}</Tex>, taklif <Tex>{"Q=20+2P"}</Tex>. Muvozanat — ikkalasi teng bo'lgan nuqta: 2 noma'lumli sistema (P = 20, Q = 60).</> },
    { icon: "🏭", title: "Ishlab chiqarish rejasi", text: <>Har bir mahsulot qancha xom ashyo, mehnat, vaqt talab qilishi ma'lum — resurslarni to'liq ishlatadigan reja sistemadan topiladi.</> },
    { icon: "🧪", title: "Aralashma masalasi", text: <>Ozuqa, dori, yoqilg'i aralashmasi: kerakli tarkibni berish uchun har bir xom ashyodan qancha olish kerak.</> },
    { icon: "📒", title: "Buxgalteriya balansi", text: <>Tarmoqlararo balans (Leontyev) — yuzlab tenglamali sistema; kompyuterlar Gauss usuli bilan yechadi.</> },
  ],
  recipes: [
    {
      title: "Kramer usuli (2 noma'lum)",
      rule: <>Uchta determinant hisoblanadi: <Tex>{"\\Delta"}</Tex> (delta) — noma'lumlar oldidagi sonlardan; <Tex>{"\\Delta_x"}</Tex> — x ning ustuni o'rniga o'ng tomondagi sonlar qo'yiladi; <Tex>{"\\Delta_y"}</Tex> — y ning ustuni o'rniga. Keyin bo'lamiz. Faqat <Tex>{"\\Delta\\neq0"}</Tex> (delta noldan farqli) bo'lsa ishlaydi.</>,
      formula: "x = \\frac{\\Delta_x}{\\Delta}, \\qquad y = \\frac{\\Delta_y}{\\Delta}",
      steps: [<>Misol: <Tex>{sys(EXA, EXB, ["x", "y"])}</Tex></>, ...kramer2Steps(EXA, EXB), <>Tekshiruv: <Tex>{"2\\cdot1+1 = 3 ✓,\\ 1-2\\cdot1=-1 ✓"}</Tex></>],
    },
    {
      title: "Kramer usuli (3 noma'lum)",
      rule: <>Xuddi shunday, faqat endi to'rtta 3-tartibli determinant (Sarrus qoidasi bilan) hisoblanadi.</>,
      formula: "x = \\frac{\\Delta_x}{\\Delta}, \\qquad y = \\frac{\\Delta_y}{\\Delta}, \\qquad z = \\frac{\\Delta_z}{\\Delta}",
      steps: [
        <>Misol: <Tex>{sys([[1, 1, 1], [1, -1, 1], [2, 1, -1]], [6, 2, 1], ["x", "y", "z"])}</Tex></>,
        <><Tex>{`\\Delta = ${tmat([[1, 1, 1], [1, -1, 1], [2, 1, -1]], "v")} = ${det3([[1, 1, 1], [1, -1, 1], [2, 1, -1]])}`}</Tex></>,
        <><Tex>{`\\Delta_x = ${tmat([[6, 1, 1], [2, -1, 1], [1, 1, -1]], "v")} = ${det3([[6, 1, 1], [2, -1, 1], [1, 1, -1]])}`}</Tex></>,
        <><Tex>{`\\Delta_y = ${tmat([[1, 6, 1], [1, 2, 1], [2, 1, -1]], "v")} = ${det3([[1, 6, 1], [1, 2, 1], [2, 1, -1]])},\\quad \\Delta_z = ${tmat([[1, 1, 6], [1, -1, 2], [2, 1, 1]], "v")} = ${det3([[1, 1, 6], [1, -1, 2], [2, 1, 1]])}`}</Tex></>,
        <><Tex>{"x = \\frac{6}{6}=1,\\quad y=\\frac{12}{6}=2,\\quad z=\\frac{18}{6}=3"}</Tex></>,
      ],
    },
    {
      title: "Matritsa usuli",
      rule: <>Sistemani qisqacha <Tex>{"A\\cdot X=B"}</Tex> ko'rinishda yozamiz (A — koeffitsiyentlar jadvali, X — noma'lumlar ustuni, B — o'ng tomondagi sonlar). Ikki tomonni chapdan teskari matritsa <Tex>{"A^{-1}"}</Tex> ga ko'paytiramiz.</>,
      formula: "X = A^{-1}\\cdot B",
      steps: [
        <><Tex>{`${sys(EXA, EXB, ["x", "y"])} \\Rightarrow A=${tmat(EXA)},\\ B=${tmat([[3], [-1]])}`}</Tex></>,
        <><Tex>{"\\det A = -5,\\quad A^{-1}=\\frac{1}{-5}\\begin{pmatrix}-2&-1\\\\-1&2\\end{pmatrix}"}</Tex></>,
        <><Tex>{"X=\\frac{1}{-5}\\begin{pmatrix}-2\\cdot3+(-1)(-1)\\\\-1\\cdot3+2\\cdot(-1)\\end{pmatrix}=\\frac{1}{-5}\\begin{pmatrix}-5\\\\-5\\end{pmatrix}=\\begin{pmatrix}1\\\\1\\end{pmatrix}"}</Tex></>,
      ],
    },
    {
      title: "Gauss usuli",
      rule: <>Koeffitsiyentlar va o'ng tomonni bitta jadvalga yozamiz (kengaytirilgan matritsa). Satrlar ustida amallar bajarib, diagonal ostini <b>nolga</b> keltiramiz (zinapoya ko'rinishi), so'ng pastdan yuqoriga yechamiz. Ruxsat etilgan amallar: ikki satrni almashtirish; satrni songa ko'paytirish; bir satrga boshqa satrni biror songa ko'paytirib qo'shish. <Tex>{"R_2-R_1"}</Tex> yozuvi: "2-satrdan 1-satrni ayiramiz".</>,
      steps: [
        <><Tex>{"\\left(\\begin{array}{ccc|c}1&1&1&6\\\\1&-1&1&2\\\\2&1&-1&1\\end{array}\\right)"}</Tex></>,
        <><Tex>{"R_2-R_1,\\ R_3-2R_1:\\ \\left(\\begin{array}{ccc|c}1&1&1&6\\\\0&-2&0&-4\\\\0&-1&-3&-11\\end{array}\\right)"}</Tex></>,
        <>2-satrdan: <Tex>{"-2y=-4\\Rightarrow y=2"}</Tex></>,
        <>3-satrdan: <Tex>{"-2-3z=-11\\Rightarrow z=3"}</Tex>; 1-satrdan: <Tex>{"x=6-2-3=1"}</Tex></>,
      ],
    },
    {
      title: "Yechim bormi? (Kroneker–Kapelli)",
      rule: <>Kroneker–Kapelli teoremasi: sistema yechimga ega bo'lishi uchun asosiy matritsa va kengaytirilgan matritsa ranglari teng bo'lishi kerak. Rang noma'lumlar soniga teng bo'lsa — yechim yagona, kichik bo'lsa — cheksiz ko'p. <b>Tez tekshiruv:</b> <Tex>{"\\Delta\\neq0"}</Tex> bo'lsa, yechim yagona. <Tex>{"\\Delta=0"}</Tex> bo'lsa, yechim yo'q yoki cheksiz ko'p.</>,
      formula: "\\operatorname{rang} A = \\operatorname{rang}(A\\,|\\,B)",
      steps: [
        <><Tex>{"\\begin{cases}x+2y=3\\\\2x+4y=7\\end{cases}"}</Tex>: <Tex>{"\\Delta=4-4=0"}</Tex>.</>,
        <>2-tenglamaning chap tomoni 1-sining 2 baravari, lekin o'ng tomonda <Tex>{"7\\neq2\\cdot3"}</Tex>. Bu <b>ziddiyat</b>, demak yechim yo'q (grafikda ikki to'g'ri chiziq parallel).</>,
        <>Agar o'ng tomonda 6 bo'lganida, ikki tenglama aslida bitta bo'lardi va yechim <b>cheksiz ko'p</b> bo'lardi.</>,
      ],
    },
  ],
  mistakes: [
    { wrong: <><Tex>{"\\Delta_x"}</Tex> ni hisoblashda o'ng tomondagi sonlarni 2-ustunga qo'yish</>, right: <><Tex>{"\\Delta_x"}</Tex> da <b>x ning</b> ustuni (1-ustun) almashtiriladi, <Tex>{"\\Delta_y"}</Tex> da esa 2-ustun.</> },
    { wrong: <><Tex>{"x=\\frac{\\Delta}{\\Delta_x}"}</Tex></>, right: <><Tex>{"x=\\frac{\\Delta_x}{\\Delta}"}</Tex>: asosiy determinant har doim <b>maxrajda</b> turadi.</> },
    { wrong: <>Tenglamada biror noma'lum yo'q bo'lsa, uni tashlab ketish</>, right: <>Yo'q noma'lumning o'rniga <b>0</b> yoziladi. Masalan, <Tex>{"x+z=5"}</Tex> tenglama <Tex>{"x+0\\cdot y+z=5"}</Tex> deb olinadi.</> },
    { wrong: <><Tex>{"\\Delta=0"}</Tex> bo'lsa, "yechim yo'q" deyish</>, right: <><Tex>{"\\Delta=0"}</Tex> bo'lsa, yechim yo'q <b>yoki</b> cheksiz ko'p bo'ladi. Qaysi biri ekanini o'ng tomon hal qiladi.</> },
    { wrong: <>"Birgalikda" — yagona yechimli degani</>, right: <>Birgalikda — <b>kamida bitta</b> yechimi bor degani. Yechim yagona bo'lsa, sistema "aniq" deyiladi.</> },
    { wrong: <>Gauss usulida faqat chap tomonni o'zgartirish</>, right: <>Satr amali <b>butun satrga</b>, o'ng tomondagi son bilan birga qo'llanadi.</> },
  ],
  gens: [
    {
      id: "s2",
      title: "2 noma'lum",
      make: () => {
        const { A, b, x } = make2();
        return {
          q: <>Sistemani yeching: <Tex>{sys(A, b, ["x", "y"])}</Tex></>,
          ans: [{ label: <Tex>x</Tex>, v: x[0] }, { label: <Tex>y</Tex>, v: x[1] }],
          traps: [{ v: [x[1], x[0]], why: "x va y ning o'rni almashib qoldi." }],
          steps: kramer2Steps(A, b),
        };
      },
    },
    {
      id: "sq",
      title: "x₁² + x₂²",
      make: () => {
        const { A, b, x } = make2();
        const v = x[0] ** 2 + x[1] ** 2;
        return {
          q: <>Sistemani yeching va <Tex>{"x_1^2+x_2^2"}</Tex> ni toping: <Tex>{sys(A, b, ["x_1", "x_2"])}</Tex></>,
          ans: [{ v }],
          traps: [{ v: [x[0] + x[1]], why: "Siz $x_1+x_2$ ni topdingiz. Kvadratlar yig'indisi so'ralgan." }, { v: [(x[0] + x[1]) ** 2], why: "Siz $(x_1+x_2)^2$ ni topdingiz. Har birini alohida kvadratga oshirib, keyin qo'shing." }],
          steps: [...kramer2Steps(A, b), <><Tex>{`x_1^2+x_2^2 = ${tp(x[0])}^2 + ${tp(x[1])}^2 = ${v}`}</Tex></>],
        };
      },
    },
    {
      id: "dx",
      title: "Δ va Δₓ",
      make: () => {
        const { A, b } = make2();
        const which = pick(["D", "Dx", "Dy"] as const);
        const D = det2(A), Dx = det2(withCol(A, b, 0)), Dy = det2(withCol(A, b, 1));
        const v = which === "D" ? D : which === "Dx" ? Dx : Dy;
        const name = which === "D" ? "\\Delta" : which === "Dx" ? "\\Delta_x" : "\\Delta_y";
        return {
          q: <><Tex>{sys(A, b, ["x", "y"])}</Tex> sistema uchun <Tex>{name}</Tex> ni hisoblang.</>,
          ans: [{ v }],
          traps: which === "Dx" ? [{ v: [Dy], why: "Siz $\\Delta_y$ ni topdingiz. $\\Delta_x$ da 1-ustun (x oldidagi sonlar) almashtiriladi." }] : which === "Dy" ? [{ v: [Dx], why: "Siz $\\Delta_x$ ni topdingiz. $\\Delta_y$ da 2-ustun almashtiriladi." }] : [],
          steps: [
            which === "D" ? <>Noma'lumlar oldidagi sonlardan: <Tex>{`${tmat(A, "v")} = ${tn(D)}`}</Tex></> : which === "Dx" ? <>1-ustun o'rniga o'ng tomondagi sonlar: <Tex>{`${tmat(withCol(A, b, 0), "v")} = ${tn(Dx)}`}</Tex></> : <>2-ustun o'rniga o'ng tomondagi sonlar: <Tex>{`${tmat(withCol(A, b, 1), "v")} = ${tn(Dy)}`}</Tex></>,
          ],
        };
      },
    },
    {
      id: "s3",
      title: "3 noma'lum",
      make: () => {
        const { A, b, x } = make3();
        const D = det3(A);
        const ds = [0, 1, 2].map((j) => det3(withCol(A, b, j)));
        return {
          q: <>Sistemani yeching: <Tex>{sys(A, b, ["x", "y", "z"])}</Tex></>,
          ans: [{ label: <Tex>x</Tex>, v: x[0] }, { label: <Tex>y</Tex>, v: x[1] }, { label: <Tex>z</Tex>, v: x[2] }],
          steps: [
            <><Tex>{`\\Delta = ${tmat(A, "v")} = ${tn(D)}`}</Tex></>,
            ...["x", "y", "z"].map((n, j) => <><Tex>{`\\Delta_${n} = ${tmat(withCol(A, b, j), "v")} = ${tn(ds[j])}`}</Tex></>),
            <><Tex>{`x=\\frac{${ds[0]}}{${D}}=${tn(x[0])},\\ y=\\frac{${ds[1]}}{${D}}=${tn(x[1])},\\ z=\\frac{${ds[2]}}{${D}}=${tn(x[2])}`}</Tex></>,
          ],
        };
      },
    },
    {
      id: "kind",
      title: "Nechta yechim?",
      make: () => {
        const t = pick(["one", "none", "inf"] as const);
        const a = rnz(-3, 4), bb = rnz(-3, 4), k = pick([2, 3, -2, -1]);
        const c1 = ri(-5, 6);
        let A: number[][], b: number[];
        if (t === "one") { const s = make2(); A = s.A; b = s.b; }
        else { A = [[a, bb], [k * a, k * bb]]; b = [c1, t === "inf" ? k * c1 : k * c1 + pick([1, 2, -1, 3])]; }
        const D = det2(A);
        return {
          q: <><Tex>{sys(A, b, ["x", "y"])}</Tex> sistema nechta yechimga ega?</>,
          choice: { options: ["Yagona yechim", "Yechimi yo'q", "Cheksiz ko'p yechim"], correct: t === "one" ? 0 : t === "none" ? 1 : 2 },
          steps: [
            <><Tex>{`\\Delta = ${tmat(A, "v")} = ${tn(D)}`}</Tex></>,
            t === "one" ? <><Tex>{"\\Delta\\neq0"}</Tex>, demak yechim yagona (aniq sistema).</> : <><Tex>{"\\Delta=0"}</Tex>: 2-tenglamaning chap tomoni 1-sining chap tomonini <Tex>{tp(k)}</Tex> ga ko'paytirganga teng.</>,
            t === "none" ? <>O'ng tomonda esa <Tex>{`${tn(b[1])} \\neq ${tp(k)}\\cdot${tp(b[0])} = ${tn(k * b[0])}`}</Tex>. Ziddiyat — yechim yo'q.</> : t === "inf" ? <>O'ng tomon ham <Tex>{tp(k)}</Tex> baravar. Demak ikki tenglama aslida bitta — yechim cheksiz ko'p.</> : <>Yechimni Kramer usulida topish mumkin.</>,
          ],
        };
      },
    },
  ],
  tests: [
    { id: "t3:test:1", q: "Quyidagilardan qaysi biri chiziqli tenglamalar sistemasi?", options: [<Tex>{"\\begin{cases}x^2+y=2\\\\x+y^2=1\\end{cases}"}</Tex>, <Tex>{"\\begin{cases}\\frac1x+\\frac1y=2\\\\x-y=1\\end{cases}"}</Tex>, <Tex>{"\\begin{cases}xy=2\\\\x+y=3\\end{cases}"}</Tex>, <Tex>{"\\begin{cases}2x-3y=5\\\\x+4y=-1\\end{cases}"}</Tex>, <Tex>{"\\begin{cases}\\sqrt x+y=2\\\\x=1\\end{cases}"}</Tex>], correct: 3, explain: "Chiziqli: noma'lumlar faqat birinchi darajada va bir-biriga ko'paytirilmagan." },
    { id: "t3:test:2", q: <><Tex>{"\\begin{cases}3x_1-2x_2=5\\\\2x_1-3x_2=0\\end{cases}"}</Tex> sistemaning koeffitsiyentlari yig'indisi:</>, options: ["10", "0", "5", "15", "$-5$"], correct: 1, explain: "Koeffitsiyentlar — noma'lumlar oldidagi sonlar: $3+(-2)+2+(-3)=0$. O'ng tomondagi sonlar (5 va 0) kirmaydi." },
    { id: "t3:test:3", q: "Uch noma'lumli sistemaning yechimi deb shunday $(\\alpha;\\ \\beta;\\ \\gamma)$ sonlarga aytiladiki, ular sistemaning … tenglamalarini ayniyatga aylantiradi.", options: ["birinchi", "ikkinchi", "birorta", "kamida bitta", "barcha (uchala)"], correct: 4, explain: "Yechim HAMMA tenglamani bir vaqtda qanoatlantiradi. ($\\alpha,\\ \\beta,\\ \\gamma$ — alfa, beta, gamma: shunchaki sonlarning nomi.)" },
    { id: "t3:test:4", q: "Qachon chiziqli tenglamalar sistemasi birgalikda deyiladi?", options: ["Yechimga ega bo'lmasa", "Kamida bitta yechimga ega bo'lsa", "Faqat yagona yechimga ega bo'lsa", "Faqat cheksiz ko'p yechimga ega bo'lsa", "$\\Delta=0$ bo'lsa"], correct: 1, explain: "Birgalikda — yechimi bor (bitta yoki cheksiz ko'p)." },
    { id: "t3:test:5", q: <>Sistemani yeching va <Tex>{"x_1^2+x_2^2"}</Tex> ni toping: <Tex>{"\\begin{cases}x_1+2x_2=3\\\\2x_1-x_2=1\\end{cases}"}</Tex></>, options: ["5", "1", "4", "2", "3"], correct: 3, explain: <>Kramer usuli: <Tex>{"\\Delta=\\begin{vmatrix}1&2\\\\2&-1\\end{vmatrix}=-1-4=-5"}</Tex>, <Tex>{"\\Delta_1=\\begin{vmatrix}3&2\\\\1&-1\\end{vmatrix}=-5"}</Tex>, <Tex>{"\\Delta_2=\\begin{vmatrix}1&3\\\\2&1\\end{vmatrix}=-5"}</Tex>. Demak <Tex>{"x_1=\\frac{-5}{-5}=1,\\ x_2=1"}</Tex> va <Tex>{"1^2+1^2=2"}</Tex>.</> },
    { id: "t3:test:6", q: "Kramer formulalarini qachon qo'llash mumkin?", options: ["Har doim", "Asosiy determinant $\\Delta\\neq0$ bo'lsa", "$\\Delta=0$ bo'lsa", "Faqat bir jinsli sistemada", "Noma'lumlar soni tenglamalardan ko'p bo'lsa"], correct: 1, explain: "Formulada $\\Delta$ maxrajda turadi, nolga esa bo'lib bo'lmaydi." },
    { id: "t3:test:7", q: "Kroneker–Kapelli teoremasi bo'yicha sistema birgalikda bo'lishi uchun…", options: ["$\\det A\\neq0$", "$\\operatorname{rang}A=\\operatorname{rang}(A\\,|\\,B)$", "$\\operatorname{rang}A<n$", "$B=0$", "$\\operatorname{rang}A=1$"], correct: 1, explain: "Asosiy matritsa va kengaytirilgan matritsa ranglari teng bo'lishi kerak." },
    { id: "t3:test:8", q: "Bir jinsli sistema (o'ng tomondagi barcha sonlar 0) haqida qaysi tasdiq to'g'ri?", options: ["Hech qachon yechimga ega emas", "Har doim birgalikda (kamida nol yechim bor)", "Har doim cheksiz ko'p yechimli", "Faqat $\\Delta=0$ da yechimli", "Faqat Gauss usulida yechiladi"], correct: 1, explain: "$x=y=z=0$ har doim yechim bo'ladi. $\\Delta=0$ bo'lsa, noldan farqli yechimlar ham bor." },
    { id: "t3:test:9", q: "Matritsa usulida yechim qanday topiladi?", options: ["$X=A\\cdot B$", "$X=B\\cdot A^{-1}$", "$X=A^{-1}\\cdot B$", "$X=A^T\\cdot B$", "$X=\\dfrac{B}{A}$"], correct: 2, explain: "$A\\cdot X=B$ tenglikni chapdan $A^{-1}$ ga ko'paytiramiz: $X=A^{-1}\\cdot B$. Ko'paytuvchilar tartibi muhim! Matritsaga bo'lish amali yo'q." },
    { id: "t3:test:10", q: "Gauss usulining mohiyati:", options: ["Determinantlarni hisoblash", "Teskari matritsani topish", "Noma'lumlarni ketma-ket yo'qotish (zinapoya ko'rinishi)", "Grafik usulda yechish", "Tanlash usuli"], correct: 2, explain: "Satr amallari bilan diagonal ostini nolga keltirib, pastdan yuqoriga yechamiz." },
  ],
  cheat: [
    { t: "Kramer", f: <><Tex>{"x=\\frac{\\Delta_x}{\\Delta},\\quad y=\\frac{\\Delta_y}{\\Delta}"}</Tex>, faqat <Tex>{"\\Delta\\neq0"}</Tex> bo'lsa</> },
    { t: "Δₓ qanday tuziladi", f: <>x ning ustuni o'rniga o'ng tomondagi sonlar yoziladi</> },
    { t: "Matritsa usuli", f: <Tex>{"A\\cdot X=B\\quad\\Rightarrow\\quad X=A^{-1}\\cdot B"}</Tex> },
    { t: "Gauss", f: <>Kengaytirilgan matritsa <Tex>{"(A\\,|\\,B)"}</Tex>, so'ng zinapoya ko'rinishi, so'ng pastdan yuqoriga yechish</> },
    { t: "Kroneker–Kapelli", f: <Tex>{"\\operatorname{rang}A=\\operatorname{rang}(A\\,|\\,B)"}</Tex> },
    { t: "Turlar", f: <>Birgalikda (kamida 1 yechim): aniq (1 ta yechim) yoki aniqmas (cheksiz ko'p). Birgalikda emas — yechim yo'q.</> },
  ],
  lessons: ["sistema", "kramer", "gauss", "rang"],
};
