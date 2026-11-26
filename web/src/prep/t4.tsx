import { Tex } from "../components/Tex";
import { pick, ri, rnz, shuffle, tn, tp, tvec, type PrepTopic } from "./core";

const dot = (a: number[], b: number[]) => a.reduce((s, x, i) => s + x * b[i], 0);
const len = (a: number[]) => Math.sqrt(dot(a, a));
const pt = (name: string, p: number[]) => `${name}${tvec(p)}`;

/** Uzunligi butun bo'lgan vektorlar */
const NICE3 = [[1, 2, 2], [2, 3, 6], [1, 4, 8], [4, 4, 7], [2, 6, 9], [3, 4, 12], [2, 10, 11], [6, 6, 7]];
const NICE2 = [[3, 4], [5, 12], [6, 8], [8, 15], [0, 5], [7, 24]];
const niceVec = (dim: 2 | 3) => shuffle(pick(dim === 3 ? NICE3 : NICE2)).map((x) => (Math.random() < 0.5 ? -x : x));

export const T4: PrepTopic = {
  n: 4,
  slug: "vektor",
  title: "Vektorlar va ular ustida amallar",
  short: "Skalyar va vektor, kollinear/komplanar, koordinatalar, uzunlik, skalyar ko'paytma, burchak, kesmani bo'lish",
  minute: (
    <>
      <p><b>Skalyar</b> — faqat son bilan aniqlanadigan kattalik (massa, narx, harorat). <b>Vektor</b> — son <b>va yo'nalish</b> bilan aniqlanadigan kattalik (kuch, tezlik, siljish). Rasmda — strelka.</p>
      <p>Amalda vektor — <b>sonlar ro'yxati</b>: <Tex>{"\\vec a=(2;-5)"}</Tex> degani "x bo'yicha 2, y bo'yicha −5". Shuning uchun hamma amal koordinatalar bilan bajariladi: qo'shish — mos sonlarni qo'shish, uzunlik — Pifagor.</p>
      <p>Eng muhim uchta formula:</p>
      <Tex block>{"\\overrightarrow{AB}=(x_B-x_A;\\ y_B-y_A;\\ z_B-z_A)"}</Tex>
      <Tex block>{"|\\vec a|=\\sqrt{x^2+y^2+z^2}"}</Tex>
      <Tex block>{"\\vec a\\cdot\\vec b = x_1x_2+y_1y_2+z_1z_2"}</Tex>
    </>
  ),
  symbols: [
    { s: "\\vec a,\\ \\overrightarrow{AB}", read: "a vektor, AB vektor", mean: "Ustidagi strelka — bu vektor. $\\overrightarrow{AB}$ — boshi A nuqtada, oxiri B nuqtada." },
    { s: "(x;\\ y;\\ z)", read: "koordinatalar", mean: "Vektor koordinatalari: x — o'ng/chapga, y — oldinga/orqaga, z — yuqoriga/pastga siljish." },
    { s: "A(1;\\ 2)", read: "A nuqta, koordinatalari 1 va 2", mean: "Nuqta koordinatalari. Nuqta harfi oldida, koordinatalar qavsda." },
    { s: "|\\vec a|", read: "a vektorning moduli", mean: "Vektorning uzunligi." },
    { s: "\\vec i,\\ \\vec j,\\ \\vec k", read: "ortlar (i, j, k)", mean: "O'qlar bo'ylab uzunligi 1 ga teng vektorlar: $\\vec i=(1;0;0)$, $\\vec j=(0;1;0)$, $\\vec k=(0;0;1)$." },
    { s: "\\vec a\\cdot\\vec b", read: "a va b ning skalyar ko'paytmasi", mean: "Natija — son (vektor emas)." },
    { s: "\\varphi", read: "fi", mean: "Ikki vektor orasidagi burchak (yunon harfi)." },
    { s: "\\lambda", read: "lyambda", mean: "Biror son (koeffitsiyent). Kesmani bo'lishda — nisbat: $AC:CB=\\lambda$." },
    { s: "\\perp,\\ \\parallel", read: "perpendikulyar, parallel", mean: "$\\vec a\\perp\\vec b$ — o'zaro perpendikulyar; $\\vec a\\parallel\\vec b$ — parallel (kollinear)." },
  ],
  uses: [
    { icon: "🛒", title: "Tovarlar savati", text: <>Xarid: 3 kg non, 2 l sut, 1 kg go'sht — vektor <Tex>{"q=(3;2;1)"}</Tex>. Narxlar <Tex>{"p=(4;12;90)"}</Tex> (ming so'm). Savat qiymati = <b>skalyar ko'paytma</b> <Tex>{"p\\cdot q=12+24+90=126"}</Tex>.</> },
    { icon: "📦", title: "Portfel va resurslar", text: <>Firma ishlatadigan resurslar (mehnat, kapital, xom ashyo) — vektor. Ikki rejani solishtirish — vektorlarni ayirish.</> },
    { icon: "🎯", title: "Tavsiya tizimlari", text: <>Netflix/Spotify foydalanuvchi didini vektor qilib saqlaydi; ikki vektor orasidagi burchak kosinusi — "qanchalik o'xshash".</> },
    { icon: "🧭", title: "Fizika va navigatsiya", text: <>Kuch, tezlik, shamol yo'nalishi — vektorlar; GPS ularni qo'shib joylashuvni hisoblaydi.</> },
  ],
  recipes: [
    {
      title: "Vektor koordinatalari va yoyilmasi",
      gens: ["ab", "ort"],
      rule: <>Vektorning koordinatalarini topish uchun <b>oxirining koordinatalaridan boshining koordinatalarini</b> ayiramiz. Koordinatalarni ortlar orqali ham yozish mumkin: <Tex>{"\\vec a=(2;\\ -5)=2\\vec i-5\\vec j"}</Tex>.</>,
      formula: "\\overrightarrow{AB}=(x_B-x_A;\\ \\ y_B-y_A;\\ \\ z_B-z_A)",
      steps: [
        <><Tex>{"A(1;\\,2;\\,-3),\\ B(4;\\,0;\\,1)"}</Tex></>,
        <><Tex>{"\\vec{AB}=(4-1;\\ 0-2;\\ 1-(-3))=(3;\\,-2;\\,4)"}</Tex></>,
        <>Yoyilma: <Tex>{"\\vec{AB}=3\\vec i-2\\vec j+4\\vec k"}</Tex></>,
      ],
    },
    {
      title: "Qo'shish, ayirish, songa ko'paytirish",
      gens: ["lin"],
      rule: <>Har bir koordinata alohida qo'shiladi; songa ko'paytirishda har bir koordinata shu songa ko'paytiriladi.</>,
      formula: "\\vec a+\\vec b=(x_1+x_2;\\ \\ y_1+y_2;\\ \\ z_1+z_2),\\qquad \\lambda\\cdot\\vec a=(\\lambda x;\\ \\ \\lambda y;\\ \\ \\lambda z)",
      steps: [
        <><Tex>{"\\vec a=(1;-2;3),\\ \\vec b=(0;4;-1)"}</Tex>. <Tex>{"2\\vec a-3\\vec b"}</Tex> = ?</>,
        <><Tex>{"2\\vec a=(2;-4;6),\\quad 3\\vec b=(0;12;-3)"}</Tex></>,
        <><Tex>{"2\\vec a-3\\vec b=(2-0;\\ -4-12;\\ 6-(-3))=(2;\\,-16;\\,9)"}</Tex></>,
      ],
    },
    {
      title: "Uzunlik (modul)",
      gens: ["len"],
      rule: <>Uzunlik Pifagor teoremasidan topiladi: koordinatalar kvadratlari yig'indisidan ildiz chiqariladi. Ikki nuqta orasidagi masofa — <Tex>{"\\overrightarrow{AB}"}</Tex> vektorning uzunligi.</>,
      formula: "|\\vec a|=\\sqrt{x^2+y^2+z^2}",
      steps: [
        <><Tex>{"\\vec a=(2;\\,-3;\\,6)"}</Tex></>,
        <><Tex>{"|\\vec a|=\\sqrt{2^2+(-3)^2+6^2}=\\sqrt{4+9+36}=\\sqrt{49}=7"}</Tex></>,
      ],
    },
    {
      title: "Skalyar ko'paytma va burchak",
      gens: ["dot", "perp"],
      rule: <>Mos koordinatalarni ko'paytirib, qo'shamiz — natija <b>son</b>. Shu son orqali vektorlar orasidagi burchak <Tex>{"\\varphi"}</Tex> (fi) topiladi. Skalyar ko'paytma 0 ga teng bo'lsa, vektorlar <b>perpendikulyar</b>.</>,
      formula: "\\vec a\\cdot\\vec b=x_1x_2+y_1y_2+z_1z_2,\\qquad \\cos\\varphi=\\frac{\\vec a\\cdot\\vec b}{|\\vec a|\\cdot|\\vec b|}",
      steps: [
        <><Tex>{"\\vec a=(1;2;2),\\ \\vec b=(2;-2;1)"}</Tex></>,
        <><Tex>{"\\vec a\\cdot\\vec b=1\\cdot2+2\\cdot(-2)+2\\cdot1=2-4+2=0"}</Tex></>,
        <>Ko'paytma 0 ga teng, demak <Tex>{"\\cos\\varphi=0,\\ \\varphi=90^\\circ"}</Tex>: vektorlar <b>perpendikulyar</b>.</>,
        <>Umumiy holda: <Tex>{"\\cos\\varphi=\\dfrac{\\vec a\\cdot\\vec b}{|\\vec a|\\cdot|\\vec b|}"}</Tex></>,
      ],
    },
    {
      title: "Kollinearlik sharti",
      gens: ["col"],
      rule: <>Ikki vektor kollinear (bir chiziqda yoki parallel) bo'lishi uchun ularning koordinatalari <b>proporsional</b> bo'lishi kerak, ya'ni biri ikkinchisining biror songa ko'paytirilgani bo'ladi.</>,
      formula: "\\frac{x_1}{x_2}=\\frac{y_1}{y_2}=\\frac{z_1}{z_2}",
      steps: [
        <><Tex>{"\\vec a=(2;\\,m;\\,6),\\ \\vec b=(1;\\,3;\\,3)"}</Tex> kollinear bo'lsa, m = ?</>,
        <><Tex>{"\\frac{2}{1}=\\frac{6}{3}=2"}</Tex> — demak <Tex>{"\\vec a=2\\vec b"}</Tex>.</>,
        <><Tex>{"m=2\\cdot3=6"}</Tex></>,
      ],
    },
    {
      title: "Kesmani λ nisbatda bo'lish",
      gens: ["div"],
      rule: <>C nuqta AB kesmani <Tex>{"AC:CB=\\lambda"}</Tex> nisbatda bo'lsa, uning koordinatalari quyidagicha topiladi (y va z uchun ham xuddi shunday). <Tex>{"\\lambda=1"}</Tex> bo'lsa, C — kesmaning o'rtasi: <Tex>{"x_C=\\frac{x_A+x_B}{2}"}</Tex>.</>,
      formula: "x_C=\\frac{x_A+\\lambda\\cdot x_B}{1+\\lambda},\\qquad y_C=\\frac{y_A+\\lambda\\cdot y_B}{1+\\lambda}",
      steps: [
        <><Tex>{"A(1;\\,-2),\\ B(7;\\,4),\\ \\lambda=2"}</Tex></>,
        <><Tex>{"x_C=\\frac{1+2\\cdot7}{1+2}=\\frac{15}{3}=5,\\quad y_C=\\frac{-2+2\\cdot4}{3}=\\frac{6}{3}=2"}</Tex></>,
        <><Tex>{"C(5;\\,2)"}</Tex>. Tekshiruv: C nuqta A dan B gacha bo'lgan yo'lning <Tex>{"\\frac23"}</Tex> qismida turibdi.</>,
      ],
    },
  ],
  mistakes: [
    { wrong: <>Boshidan oxirini ayirish</>, right: <><b>Oxiridan boshini</b> ayiriladi: <Tex>{"x_B-x_A"}</Tex>.</> },
    { wrong: <><Tex>{"|\\vec a|=x+y+z"}</Tex></>, right: <>Kvadratlar yig'indisidan ildiz: <Tex>{"|\\vec a|=\\sqrt{x^2+y^2+z^2}"}</Tex>.</> },
    { wrong: <><Tex>{"(-3)^2=-9"}</Tex></>, right: <><Tex>{"(-3)^2=9"}</Tex> — kvadrat har doim musbat.</> },
    { wrong: <>Skalyar ko'paytma natijasi — vektor</>, right: <>Natija — <b>son</b> (skalyar). Shuning uchun nomi "skalyar".</> },
    { wrong: <>Kollinear = bir xil yo'nalishli</>, right: <>Kollinear — bir chiziqda yoki parallel; yo'nalishi <b>qarama-qarshi</b> ham bo'lishi mumkin.</> },
    { wrong: <>Teng vektorlar = uzunliklari teng</>, right: <>Teng: kollinear, <b>bir xil yo'nalgan</b> va uzunliklari teng.</> },
  ],
  gens: [
    {
      id: "ab",
      title: "AB koordinatalari",
      make: () => {
        const A = [ri(-5, 6), ri(-5, 6), ri(-5, 6)], B = [ri(-5, 6), ri(-5, 6), ri(-5, 6)];
        const v = B.map((x, i) => x - A[i]);
        return {
          q: <>Boshi <Tex>{pt("A", A)}</Tex>, oxiri <Tex>{pt("B", B)}</Tex>. <Tex>{"\\vec{AB}"}</Tex> koordinatalarini toping.</>,
          ans: v.map((x, i) => ({ label: <Tex>{"xyz"[i]}</Tex>, v: x })),
          traps: [{ v: v.map((x) => -x), why: "Boshidan oxirini ayirdingiz. To'g'risi: oxiridan boshini, ya'ni $x_B-x_A$." }],
          steps: [<><Tex>{`\\vec{AB}=(${B.map((x, i) => `${tn(x)}-${tp(A[i])}`).join(";\\ ")})=${tvec(v)}`}</Tex></>],
        };
      },
    },
    {
      id: "len",
      title: "Uzunlik",
      make: () => {
        const d = pick([2, 3, 3]) as 2 | 3;
        const a = niceVec(d);
        const sum = a.reduce((s, x) => s + Math.abs(x), 0);
        return {
          q: <><Tex>{`\\vec a=${tvec(a)}`}</Tex> vektorning uzunligini toping.</>,
          ans: [{ v: len(a) }],
          traps: [{ v: [sum], why: "Koordinatalarni qo'shdingiz. Uzunlik: $|\\vec a|=\\sqrt{x^2+y^2+z^2}$." }, { v: [dot(a, a)], why: "Ildiz chiqarishni unutdingiz." }],
          steps: [<><Tex>{`|\\vec a|=\\sqrt{${a.map((x) => `${tp(x)}^2`).join("+")}}=\\sqrt{${a.map((x) => x * x).join("+")}}=\\sqrt{${dot(a, a)}}=${len(a)}`}</Tex></>],
        };
      },
    },
    {
      id: "dot",
      title: "Skalyar ko'paytma",
      make: () => {
        const a = [rnz(-4, 5), ri(-4, 5), ri(-4, 5)], b = [ri(-4, 5), rnz(-4, 5), ri(-4, 5)];
        return {
          q: <><Tex>{`\\vec a=${tvec(a)},\\ \\vec b=${tvec(b)}`}</Tex>. <Tex>{"\\vec a\\cdot\\vec b"}</Tex> = ?</>,
          ans: [{ v: dot(a, b) }],
          traps: [{ v: [a.reduce((s, x, i) => s + x + b[i], 0)], why: "Koordinatalarni qo'shdingiz. Mos koordinatalar avval KO'PAYTIRILADI, keyin qo'shiladi: $x_1x_2+y_1y_2+z_1z_2$." }],
          steps: [<><Tex>{`${a.map((x, i) => `${tp(x)}\\cdot${tp(b[i])}`).join("+")} = ${a.map((x, i) => tp(x * b[i])).join("+")} = ${dot(a, b)}`}</Tex></>],
        };
      },
    },
    {
      id: "lin",
      title: "λa + μb",
      make: () => {
        const a = [ri(-4, 5), ri(-4, 5), ri(-4, 5)], b = [ri(-4, 5), ri(-4, 5), ri(-4, 5)];
        const l = rnz(-3, 3), m = rnz(-3, 3);
        const r = a.map((x, i) => l * x + m * b[i]);
        return {
          q: <><Tex>{`\\vec a=${tvec(a)},\\ \\vec b=${tvec(b)}`}</Tex>. <Tex>{`${tn(l)}\\vec a ${m < 0 ? "-" : "+"} ${tn(Math.abs(m))}\\vec b`}</Tex> ni toping.</>,
          ans: r.map((x, i) => ({ label: <Tex>{"xyz"[i]}</Tex>, v: x })),
          steps: [
            <><Tex>{`${tn(l)}\\vec a=${tvec(a.map((x) => l * x))},\\quad ${tn(m)}\\vec b=${tvec(b.map((x) => m * x))}`}</Tex></>,
            <>Qo'shamiz: <Tex>{tvec(r)}</Tex></>,
          ],
        };
      },
    },
    {
      id: "perp",
      title: "Perpendikulyarlik (m = ?)",
      make: () => {
        for (;;) {
          const b = [pick([1, 2, -1, -2, 3]), rnz(-3, 4), rnz(-3, 4)];
          const p = rnz(-4, 5), q = ri(-4, 5);
          const num = -(p * b[1] + q * b[2]);
          if (num % b[0] !== 0) continue;
          const m = num / b[0];
          const a = ["m", p, q];
          return {
            q: <><Tex>{`\\vec a=(m;\\ ${tn(p)};\\ ${tn(q)}),\\ \\vec b=${tvec(b)}`}</Tex>. m ning qanday qiymatida vektorlar perpendikulyar?</>,
            ans: [{ label: <Tex>m</Tex>, v: m }],
            traps: [{ v: [-m], why: "Ishorada xato: qolgan hadlarni tenglikning o'ng tomoniga o'tkazganda ishora o'zgaradi." }],
            steps: [
              <>Vektorlar perpendikulyar bo'lishi uchun <Tex>{"\\vec a\\cdot\\vec b=0"}</Tex> bo'lishi kerak: <Tex>{`m\\cdot${tp(b[0])} + ${tp(p)}\\cdot${tp(b[1])} + ${tp(q)}\\cdot${tp(b[2])} = 0`}</Tex></>,
              <><Tex>{`${tn(b[0])}m ${p * b[1] + q * b[2] < 0 ? "-" : "+"} ${Math.abs(p * b[1] + q * b[2])} = 0 \\Rightarrow m = ${tn(m)}`}</Tex></>,
            ].concat(a.length ? [] : []),
          };
        }
      },
    },
    {
      id: "col",
      title: "Kollinearlik (m = ?)",
      make: () => {
        const b = [rnz(-3, 4), rnz(-3, 4), rnz(-3, 4)];
        const k = pick([2, 3, -2, -1, -3]);
        const a = b.map((x) => k * x);
        const h = ri(0, 2);
        return {
          q: <><Tex>{`\\vec a=(${a.map((x, i) => (i === h ? "m" : tn(x))).join(";\\ ")}),\\ \\vec b=${tvec(b)}`}</Tex>. m ning qanday qiymatida vektorlar kollinear?</>,
          ans: [{ label: <Tex>m</Tex>, v: a[h] }],
          steps: [
            <>Kollinear vektorlarning koordinatalari proporsional. Ma'lum koordinatalardan nisbatni topamiz: <Tex>{`\\lambda = \\frac{${tn(a[(h + 1) % 3])}}{${tn(b[(h + 1) % 3])}} = ${tn(k)}`}</Tex></>,
            <><Tex>{`m = \\lambda\\cdot${tp(b[h])} = ${tn(k)}\\cdot${tp(b[h])} = ${tn(a[h])}`}</Tex></>,
          ],
        };
      },
    },
    {
      id: "div",
      title: "Kesmani bo'lish",
      make: () => {
        const l = pick([1, 2, 3]);
        const A = [ri(-5, 5), ri(-5, 5)];
        const s = [rnz(-2, 2), rnz(-2, 2)];
        const B = A.map((x, i) => x + (1 + l) * s[i]);
        const C = A.map((x, i) => x + l * s[i]);
        return {
          q: <><Tex>{`${pt("A", A)},\\ ${pt("B", B)}`}</Tex>. AB kesmani <Tex>{`\\lambda=${l}`}</Tex> nisbatda (AC : CB = {l}) bo'luvchi C nuqtani toping.</>,
          ans: [{ label: <Tex>{"x_C"}</Tex>, v: C[0] }, { label: <Tex>{"y_C"}</Tex>, v: C[1] }],
          traps: [{ v: B.map((x, i) => x + (A[i] - x) * l / (1 + l)), why: "A va B ning o'rnini almashtirdingiz: formulada $\\lambda$ B nuqtaning koordinatasiga ko'paytiriladi." }],
          steps: [
            <><Tex>{`x_C=\\frac{${tn(A[0])}+${l}\\cdot${tp(B[0])}}{1+${l}}=\\frac{${A[0] + l * B[0]}}{${1 + l}}=${tn(C[0])}`}</Tex></>,
            <><Tex>{`y_C=\\frac{${tn(A[1])}+${l}\\cdot${tp(B[1])}}{1+${l}}=\\frac{${A[1] + l * B[1]}}{${1 + l}}=${tn(C[1])}`}</Tex></>,
          ],
        };
      },
    },
    {
      id: "ort",
      title: "Ortlar bo'yicha yoyilma",
      make: () => {
        const a = [rnz(-6, 6), rnz(-6, 6)];
        const f = (x: number, y: number) => `${tn(x)}\\vec i ${y < 0 ? "-" : "+"} ${tn(Math.abs(y))}\\vec j`;
        const cand = [f(a[0], a[1]), f(a[1], a[0]), f(-a[0], -a[1]), f(a[0], -a[1]), f(-a[1], a[0])];
        const opts = shuffle([...new Set(cand)]);
        return {
          q: <><Tex>{`\\vec a=${tvec(a)}`}</Tex> vektorning <Tex>{"\\vec i,\\ \\vec j"}</Tex> ortlar bo'yicha yoyilmasi:</>,
          choice: { options: opts.map((o) => <Tex>{`\\vec a=${o}`}</Tex>), correct: opts.indexOf(cand[0]) },
          steps: [<>1-koordinata — <Tex>{"\\vec i"}</Tex> oldida, 2-si — <Tex>{"\\vec j"}</Tex> oldida: <Tex>{`\\vec a=${cand[0]}`}</Tex></>],
        };
      },
    },
  ],
  tests: [
    { id: "t4:test:1", q: "Skalyar deb nimaga aytiladi?", options: ["Faqat yo'nalishi bilan aniqlanadigan kattalikka", "Faqat son qiymati bilan aniqlanadigan kattalikka", "Ham son qiymati, ham yo'nalishi bilan aniqlanadigan kattalikka", "Yo'nalgan kesmaga", "Har qanday kattalikka"], correct: 1, explain: "Skalyar — faqat son: massa, harorat, narx." },
    { id: "t4:test:2", q: "Vektor kattalik deb nimaga aytiladi?", options: ["Faqat yo'nalishi bilan aniqlanadigan kattalikka", "Faqat son qiymati bilan aniqlanadigan kattalikka", "Ham son qiymati, ham yo'nalishi bilan aniqlanadigan kattalikka", "Har qanday kesmaga", "Har qanday kattalikka"], correct: 2, explain: "Vektor — son (uzunlik) va yo'nalish birgalikda." },
    { id: "t4:test:3", q: "Quyidagilardan qaysi biri vektor kattalik?", options: ["Sirt yuzasi", "Jism hajmi", "Kesma uzunligi", "Kuch", "Harorat"], correct: 3, explain: "Kuchning yo'nalishi bor — u vektor. Qolganlari faqat son." },
    { id: "t4:test:4", q: "Qachon vektorlar kollinear deyiladi?", options: ["Bir xil yo'nalgan bo'lsa", "Har qanday ikki vektor", "Bir xil yo'nalgan va uzunliklari teng bo'lsa", "Bitta to'g'ri chiziqda yoki parallel to'g'ri chiziqlarda yotsa", "Bitta tekislikda yotsa"], correct: 3, explain: "Kollinear — bir chiziqda yoki parallel chiziqlarda (yo'nalishi bir xil yoki qarama-qarshi)." },
    { id: "t4:test:5", q: "Qachon vektorlar teng deyiladi?", options: ["Bir xil yo'nalgan bo'lsa", "Uzunliklari teng bo'lsa", "Bir xil yo'nalgan va uzunliklari teng bo'lsa (kollinear holda)", "Kollinear bo'lsa", "Perpendikulyar bo'lsa"], correct: 2, explain: "Teng vektorlar: kollinear, bir xil yo'nalgan va uzunliklari teng." },
    { id: "t4:test:6", q: "Uchta vektor komplanar deyiladi, agar ular … joylashgan bo'lsa.", options: ["bitta to'g'ri chiziqda", "bitta tekislikda yoki parallel tekisliklarda", "parallel to'g'ri chiziqlarda", "o'zaro perpendikulyar to'g'ri chiziqlarda", "o'zaro perpendikulyar tekisliklarda"], correct: 1, explain: "Komplanar — bir tekislikda (kollinear — bir chiziqda)." },
    { id: "t4:test:7", q: "Fazodagi ort vektorlar (i, j, k) qanday aniqlanadi?", options: ["Ox, Oy, Oz o'qlarida joylashgan, musbat yo'nalishli, uzunligi 1 ga teng vektorlar", "Uzunligi 1 ga teng ixtiyoriy uchta vektor", "O'zaro perpendikulyar ixtiyoriy uchta vektor", "Kollinear uchta birlik vektor", "Komplanar uchta birlik vektor"], correct: 0, explain: "$\\vec i=(1;0;0),\\ \\vec j=(0;1;0),\\ \\vec k=(0;0;1)$." },
    { id: "t4:test:8", q: <><Tex>{"\\vec a=(2;\\,-5)"}</Tex> vektorning yoyilmasi:</>, options: [<Tex>{"2\\vec i-5\\vec j"}</Tex>, <Tex>{"-5\\vec i+2\\vec j"}</Tex>, <Tex>{"-2\\vec i+5\\vec j"}</Tex>, <Tex>{"5\\vec i-2\\vec j"}</Tex>, <Tex>{"2\\vec i+5\\vec j"}</Tex>], correct: 0, explain: "Birinchi koordinata $\\vec i$ oldida, ikkinchisi $\\vec j$ oldida yoziladi." },
    { id: "t4:test:9", q: <><Tex>{"\\vec a\\cdot\\vec b=0"}</Tex> (ikkalasi nolmas) bo'lsa, vektorlar…</>, options: ["kollinear", "teng", "perpendikulyar", "qarama-qarshi", "komplanar emas"], correct: 2, explain: "$\\cos\\varphi=0$, demak $\\varphi=90^\\circ$." },
    { id: "t4:test:10", q: <><Tex>{"\\vec a=(3;\\,-4)"}</Tex> vektorning uzunligi:</>, options: ["$-1$", "7", "5", "25", "1"], correct: 2, explain: "$\\sqrt{3^2+(-4)^2}=\\sqrt{9+16}=\\sqrt{25}=5$." },
  ],
  cheat: [
    { t: "Koordinatalar", f: <Tex>{"\\vec{AB}=(x_B-x_A;\\ y_B-y_A;\\ z_B-z_A)"}</Tex> },
    { t: "Uzunlik", f: <Tex>{"|\\vec a|=\\sqrt{x^2+y^2+z^2}"}</Tex> },
    { t: "Skalyar ko'paytma", f: <Tex>{"\\vec a\\cdot\\vec b=x_1x_2+y_1y_2+z_1z_2=|\\vec a||\\vec b|\\cos\\varphi"}</Tex> },
    { t: "Perpendikulyar / kollinear", f: <><Tex>{"\\vec a\\cdot\\vec b=0"}</Tex> / <Tex>{"\\frac{x_1}{x_2}=\\frac{y_1}{y_2}=\\frac{z_1}{z_2}"}</Tex></> },
    { t: "Kesmani bo'lish", f: <Tex>{"x_C=\\frac{x_A+\\lambda x_B}{1+\\lambda}"}</Tex> },
    { t: "Ortlar", f: <Tex>{"\\vec a=x\\vec i+y\\vec j+z\\vec k"}</Tex> },
  ],
  lessons: ["vektor", "amallar", "skalyar"],
};
