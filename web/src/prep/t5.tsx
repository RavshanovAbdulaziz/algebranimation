import { Tex } from "../components/Tex";
import { prodAnim } from "./anim";
import { det2, det3, pick, ri, rnz, tmat, tn, tp, tvec, type PrepTopic } from "./core";

const apply = (A: number[][], x: number[]) => A.map((r) => r.reduce((s, a, k) => s + a * x[k], 0));
const rowTex = (r: number[], x: number[]) => `${r.map((a, k) => `${tp(a)}\\cdot${tp(x[k])}`).join("+")} = ${tn(r.reduce((s, a, k) => s + a * x[k], 0))}`;

export const T5: PrepTopic = {
  n: 5,
  slug: "fazo",
  title: "Chiziqli fazo va chiziqli operatorlar",
  short: "Vektor fazo amallari, bazis va yoyilma, chiziqli bog'liqlik, operator tasviri va aks tasviri, xos son va xos vektor",
  minute: (
    <>
      <p><b>Chiziqli (vektor) fazo</b> — vektorlarni <b>qo'shish</b> va <b>songa ko'paytirish</b> mumkin bo'lgan to'plam (va bu amallar odatdagi qoidalarga bo'ysunadi). Vektorni vektorga "ko'paytirish" yoki "bo'lish" bu ta'rifda yo'q.</p>
      <p><b>Bazis</b> — fazodagi har qanday vektorni yasash mumkin bo'lgan minimal "g'ishtlar" to'plami. Yoyilma — qaysi g'ishtdan nechta olish kerakligi.</p>
      <p><b>Chiziqli operator</b> — vektorni boshqa vektorga aylantiruvchi qoida. U matritsa bilan beriladi: vektorni matritsaga ko'paytiramiz.</p>
      <Tex block>{"y = A\\cdot x"}</Tex>
      <p><b>Xos vektor</b> — operator yo'nalishini o'zgartirmaydigan, faqat bir necha marta cho'zadigan (yoki qisqartiradigan) vektor. Necha marta cho'zilishi — <b>xos son</b> <Tex>{"\\lambda"}</Tex> (lyambda):</p>
      <Tex block>{"A\\cdot x = \\lambda\\cdot x,\\qquad x\\neq0"}</Tex>
    </>
  ),
  symbols: [
    { s: "x,\\ y,\\ e_1,\\ a_1", read: "vektorlar", mean: "Bu mavzuda kichik harflar ko'pincha vektorni bildiradi (strelkasiz yoziladi). $e_1,\\ e_2$ — bazis vektorlari." },
    { s: "\\alpha,\\ \\beta,\\ \\gamma", read: "alfa, beta, gamma", mean: "Sonlar (koeffitsiyentlar). Masalan, $x=\\alpha e_1+\\beta e_2$ — x ni yasash uchun $e_1$ dan $\\alpha$ ta, $e_2$ dan $\\beta$ ta olinadi." },
    { s: "\\lambda,\\ \\mu", read: "lyambda, myu", mean: "Sonlar. Xos sonlar odatda $\\lambda$ bilan belgilanadi." },
    { s: "A\\cdot x", read: "A operatorning x ga ta'siri", mean: "Matritsani vektorga \"satrni ustunga\" ko'paytirish. Natija — x ning tasviri." },
    { s: "A^{-1}", read: "A teskari", mean: "Teskari matritsa. Aks tasvirni topishda kerak: $x=A^{-1}y$." },
    { s: "A-\\lambda E", read: "A minus lyambda E", mean: "A ning faqat diagonal elementlaridan $\\lambda$ ayirilgan matritsa ($E$ — birlik matritsa)." },
    { s: "\\det",  read: "determinant", mean: "$\\det(A-\\lambda E)$ — shu matritsaning determinanti." },
  ],
  uses: [
    { icon: "💼", title: "Investitsiya portfeli", text: <>Har qanday portfel — bazis aktivlar (aksiya, obligatsiya, naqd) kombinatsiyasi. Yoyilma koeffitsiyentlari — har biridan qancha olish.</> },
    { icon: "🔁", title: "Iqtisodiy o'tish modellari", text: <>Bozor ulushlari har yili matritsa bo'yicha o'zgaradi: <Tex>{"x_{t+1}=Ax_t"}</Tex>. Uzoq muddatli holat — <Tex>{"\\lambda=1"}</Tex> ga mos xos vektor.</> },
    { icon: "🔎", title: "Google PageRank", text: <>Sahifalar reytingi — ulanishlar matritsasining asosiy xos vektori.</> },
    { icon: "📉", title: "Ma'lumotlarni siqish (PCA)", text: <>Ko'p ko'rsatkichli iqtisodiy ma'lumotlarning asosiy yo'nalishlari — kovariatsiya matritsasining xos vektorlari.</> },
  ],
  recipes: [
    {
      title: "Vektor fazoda tenglama",
      gens: ["solvex"],
      rule: <>Vektorli tenglamani oddiy sonli tenglamadek yechamiz, faqat har bir koordinata bilan alohida ishlaymiz.</>,
      formula: "3x+y=z\\quad\\Rightarrow\\quad 3x=z-y\\quad\\Rightarrow\\quad x=\\frac{z-y}{3}",
      steps: [
        <><Tex>{"y=(3;-2;1;4),\\ 3x+y=(6;4;1;13)"}</Tex>. x = ?</>,
        <><Tex>{"3x=(6;4;1;13)-(3;-2;1;4)=(3;\\,6;\\,0;\\,9)"}</Tex></>,
        <><Tex>{"x=\\frac13(3;6;0;9)=(1;\\,2;\\,0;\\,3)"}</Tex></>,
      ],
    },
    {
      title: "Bazis bo'yicha yoyilma",
      gens: ["basis"],
      rule: <>Noma'lum koeffitsiyentlarni <Tex>{"\\alpha,\\ \\beta,\\ \\gamma"}</Tex> deb olamiz. Tenglikni koordinatalar bo'yicha yozsak, <b>tenglamalar sistemasi</b> chiqadi. Uni Kramer yoki Gauss usulida yechamiz.</>,
      formula: "x=\\alpha\\cdot e_1+\\beta\\cdot e_2+\\gamma\\cdot e_3",
      steps: [
        <><Tex>{"e_1=(1;1),\\ e_2=(1;-1)"}</Tex> bazisda <Tex>{"x=(5;1)"}</Tex> ning yoyilmasi.</>,
        <><Tex>{"\\alpha(1;1)+\\beta(1;-1)=(5;1)\\Rightarrow\\begin{cases}\\alpha+\\beta=5\\\\\\alpha-\\beta=1\\end{cases}"}</Tex></>,
        <>Qo'shsak: <Tex>{"2\\alpha=6,\\ \\alpha=3,\\ \\beta=2"}</Tex>. Demak <Tex>{"x=3e_1+2e_2"}</Tex>.</>,
      ],
    },
    {
      title: "Chiziqli bog'liqlik (bazis bo'ladimi?)",
      gens: ["dep"],
      rule: <>Vektorlarni determinantning satrlariga yozamiz. Determinant <b>0 ga teng</b> bo'lsa, vektorlar <b>chiziqli bog'liq</b> (bazis bo'la olmaydi). <b>Noldan farqli</b> bo'lsa, <b>chiziqli erkli</b> (bazis bo'ladi).</>,
      steps: [
        <><Tex>{"a_1=(1;2;3),\\ a_2=(0;1;1),\\ a_3=(1;3;4)"}</Tex></>,
        <><Tex>{`${tmat([[1, 2, 3], [0, 1, 1], [1, 3, 4]], "v")} = ${det3([[1, 2, 3], [0, 1, 1], [1, 3, 4]])}`}</Tex></>,
        <>Determinant 0 ga teng, demak vektorlar bog'liq. Haqiqatan <Tex>{"a_3=a_1+a_2"}</Tex> — "ortiqcha" vektor.</>,
      ],
    },
    {
      title: "Operator: tasvir va aks tasvir",
      gens: ["image", "pre"],
      rule: <><b>Tasvir</b>: x berilgan, y ni topish kerak — matritsani vektorga "satrni ustunga" ko'paytiramiz. <b>Aks tasvir</b>: y berilgan, x ni topish kerak — tenglamalar sistemasini yechamiz.</>,
      formula: "\\text{tasvir: } y=A\\cdot x,\\qquad \\text{aks tasvir: } x=A^{-1}\\cdot y",
      steps: [
        <><Tex>{"A=\\begin{pmatrix}1&2&-1\\\\0&1&3\\\\2&0&1\\end{pmatrix},\\ x=(1;\\,-1;\\,2)"}</Tex></>,
        <>1-satr: <Tex>{rowTex([1, 2, -1], [1, -1, 2])}</Tex></>,
        <>2-satr: <Tex>{rowTex([0, 1, 3], [1, -1, 2])}</Tex></>,
        <>3-satr: <Tex>{rowTex([2, 0, 1], [1, -1, 2])}</Tex></>,
        <><Tex>{`y=Ax=${tvec(apply([[1, 2, -1], [0, 1, 3], [2, 0, 1]], [1, -1, 2]))}`}</Tex></>,
      ],
    },
    {
      title: "Xos sonlar va xos vektorlar",
      gens: ["eig"],
      rule: <>Xos sonlar <b>xarakteristik tenglamadan</b> topiladi: matritsaning diagonal elementlaridan <Tex>{"\\lambda"}</Tex> ni ayirib, determinantini nolga tenglaymiz. Keyin har bir topilgan <Tex>{"\\lambda"}</Tex> uchun xos vektorni topamiz.</>,
      formula: "\\begin{vmatrix}a-\\lambda&b\\\\c&d-\\lambda\\end{vmatrix}=0\\quad\\Leftrightarrow\\quad \\lambda^2-(a+d)\\lambda+(ad-bc)=0",
      steps: [
        <><Tex>{"A=\\begin{pmatrix}4&1\\\\2&3\\end{pmatrix}"}</Tex></>,
        <><Tex>{"\\begin{vmatrix}4-\\lambda&1\\\\2&3-\\lambda\\end{vmatrix}=(4-\\lambda)(3-\\lambda)-2=0"}</Tex></>,
        <><Tex>{"\\lambda^2-7\\lambda+10=0\\Rightarrow\\lambda_1=2,\\ \\lambda_2=5"}</Tex></>,
        <><Tex>{"\\lambda=5:\\ (A-5E)x=\\begin{pmatrix}-1&1\\\\2&-2\\end{pmatrix}x=0\\Rightarrow -x_1+x_2=0"}</Tex>, demak xos vektor <Tex>{"(1;\\ 1)"}</Tex>. Tekshiruv: <Tex>{"A(1;1)=(5;5)=5\\cdot(1;1)"}</Tex> ✓</>,
        <>Tezkor tekshiruv: <Tex>{"\\lambda_1+\\lambda_2=a+d"}</Tex> (2+5 = 4+3 ✓), <Tex>{"\\lambda_1\\lambda_2=\\det A"}</Tex> (10 = 12−2 ✓).</>,
      ],
    },
  ],
  mistakes: [
    { wrong: <>Vektor fazoda vektorlarni ko'paytirish amali bor</>, right: <>Ta'rifda faqat <b>qo'shish</b> va <b>songa ko'paytirish</b>.</> },
    { wrong: <><Tex>{"\\lambda"}</Tex> ni hamma elementdan ayirish</>, right: <><Tex>{"A-\\lambda E"}</Tex> da <Tex>{"\\lambda"}</Tex> faqat <b>diagonal</b> elementlardan ayiriladi.</> },
    { wrong: <>Xos vektor nol bo'lishi mumkin</>, right: <>Xos vektor <Tex>{"x\\neq0"}</Tex> (ta'rif bo'yicha).</> },
    { wrong: <>Aks tasvirni topish uchun A ni y ga ko'paytirish</>, right: <>Aks tasvir — <b>teskari</b> masala: <Tex>{"A\\cdot x=y"}</Tex> sistemani yechish kerak.</> },
    { wrong: <>3 o'lchovli fazoda 4 ta erkli vektor</>, right: <>n o'lchovli fazoda erkli vektorlar ko'pi bilan n ta; bazis — aynan n ta.</> },
  ],
  gens: [
    {
      id: "solvex",
      title: "kx + y = z",
      make: () => {
        const k = pick([2, 3, 4, -2]);
        const x = [ri(-3, 4), ri(-3, 4), ri(-3, 4), ri(-3, 4)];
        const y = [ri(-5, 5), ri(-5, 5), ri(-5, 5), ri(-5, 5)];
        const z = x.map((v, i) => k * v + y[i]);
        return {
          q: <><Tex>{`y=${tvec(y)}`}</Tex> va <Tex>{`${tn(k)}x+y=${tvec(z)}`}</Tex>. x vektorni toping.</>,
          ans: x.map((v, i) => ({ label: <Tex>{`x_${i + 1}`}</Tex>, v })),
          traps: [{ v: z.map((v, i) => (v + y[i]) / k), why: "y ni ayirish o'rniga qo'shdingiz: $kx=z-y$." }],
          steps: [
            <><Tex>{`${tn(k)}x = z - y = ${tvec(z.map((v, i) => v - y[i]))}`}</Tex></>,
            <><Tex>{`x = \\frac{1}{${tn(k)}}${tvec(z.map((v, i) => v - y[i]))} = ${tvec(x)}`}</Tex></>,
          ],
        };
      },
    },
    {
      id: "image",
      title: "Tasvir y = Ax",
      make: () => {
        const A = [0, 1, 2].map(() => [0, 1, 2].map(() => ri(-2, 3)));
        const x = [ri(-3, 3), ri(-3, 3), ri(-3, 3)];
        const y = apply(A, x);
        return {
          q: <><Tex>{`A=${tmat(A)}`}</Tex> matritsali operator uchun <Tex>{`x=${tvec(x)}`}</Tex> vektorning tasvirini toping.</>,
          ans: y.map((v, i) => ({ label: <Tex>{`y_${i + 1}`}</Tex>, v })),
          steps: A.map((r, i) => <><b>{i + 1}-satrni ustunga ko'paytiramiz</b> (natijaning {i + 1}-koordinatasi): <Tex>{rowTex(r, x)}</Tex></>),
          anim: prodAnim(A, x.map((v) => [v])),
        };
      },
    },
    {
      id: "pre",
      title: "Aks tasvir (2×2)",
      make: () => {
        let A = [[0, 0], [0, 0]];
        while ((Math.abs(det2(A)) !== 1 && Math.abs(det2(A)) !== 2) || A[0][1] === 0 || A[1][0] === 0) A = [[rnz(-3, 4), ri(-3, 4)], [ri(-3, 4), rnz(-3, 4)]];
        const x = [ri(-4, 4), ri(-4, 4)];
        const y = apply(A, x);
        const d = det2(A);
        const imgWrong = apply(A, y);
        return {
          q: <><Tex>{`A=${tmat(A)}`}</Tex> operator uchun <Tex>{`y=${tvec(y)}`}</Tex> vektorning aks tasvirini (x ni) toping.</>,
          ans: x.map((v, i) => ({ label: <Tex>{`x_${i + 1}`}</Tex>, v })),
          traps: [{ v: imgWrong, why: "Siz y ning tasvirini ($A\\cdot y$) topdingiz. Aks tasvir uchun $A\\cdot x=y$ sistemani yechish kerak." }],
          steps: [
            <>Sistema: <Tex>{`\\begin{cases} ${tn(A[0][0])}x_1 ${A[0][1] < 0 ? "-" : "+"} ${Math.abs(A[0][1])}x_2 = ${tn(y[0])} \\\\ ${tn(A[1][0])}x_1 ${A[1][1] < 0 ? "-" : "+"} ${Math.abs(A[1][1])}x_2 = ${tn(y[1])} \\end{cases}`}</Tex></>,
            <><Tex>{`\\Delta=${tn(d)},\\ \\Delta_1=${tn(det2([[y[0], A[0][1]], [y[1], A[1][1]]]))},\\ \\Delta_2=${tn(det2([[A[0][0], y[0]], [A[1][0], y[1]]]))}`}</Tex></>,
            <><Tex>{`x=${tvec(x)}`}</Tex></>,
          ],
        };
      },
    },
    {
      id: "eig",
      title: "Xos sonlar (2×2)",
      make: () => {
        for (;;) {
          const l1 = ri(-3, 5), l2 = ri(-3, 6);
          const tr = l1 + l2, dt = l1 * l2;
          const a = ri(-2, 5), d = tr - a;
          const bc = a * d - dt;
          const divs = [1, 2, 3, -1, -2, -3, 4, 6].filter((b) => bc % b === 0 && Math.abs(bc / b) <= 8);
          if (!divs.length || bc === 0) continue;
          const b = pick(divs), c = bc / b;
          const A = [[a, b], [c, d]];
          return {
            q: <><Tex>{`A=${tmat(A)}`}</Tex> matritsaning xos sonlarini toping.</>,
            ans: [{ label: <Tex>{"\\lambda_1"}</Tex>, v: l1 }, { label: <Tex>{"\\lambda_2"}</Tex>, v: l2 }],
            unordered: true,
            steps: [
              <><Tex>{`\\begin{vmatrix} ${tn(a)}-\\lambda & ${tn(b)} \\\\ ${tn(c)} & ${tn(d)}-\\lambda \\end{vmatrix} = 0`}</Tex></>,
              <><Tex>{`\\lambda^2 - (${tn(a)}${d < 0 ? "" : "+"}${tn(d)})\\lambda + (${tp(a)}\\cdot${tp(d)} - ${tp(b)}\\cdot${tp(c)}) = 0`}</Tex></>,
              <><Tex>{`\\lambda^2 ${tr < 0 ? "+" : "-"} ${Math.abs(tr)}\\lambda ${dt < 0 ? "-" : "+"} ${Math.abs(dt)} = 0`}</Tex></>,
              <>Viyet: yig'indisi {tr}, ko'paytmasi {dt} → <Tex>{`\\lambda_1=${tn(l1)},\\ \\lambda_2=${tn(l2)}`}</Tex></>,
            ],
          };
        }
      },
    },
    {
      id: "dep",
      title: "Bog'liqmi?",
      make: () => {
        const a1 = [ri(-2, 3), ri(-2, 3), ri(-2, 3)], a2 = [ri(-2, 3), ri(-2, 3), ri(-2, 3)];
        const dep = Math.random() < 0.5;
        const p = rnz(-2, 2), q = rnz(-2, 2);
        const a3 = dep ? a1.map((x, i) => p * x + q * a2[i]) : [ri(-2, 3), ri(-2, 3), ri(-2, 3)];
        const D = det3([a1, a2, a3]);
        return {
          q: <><Tex>{`a_1=${tvec(a1)},\\ a_2=${tvec(a2)},\\ a_3=${tvec(a3)}`}</Tex> vektorlar…</>,
          choice: { options: ["Chiziqli bog'liq", "Chiziqli erkli (bazis tashkil etadi)"], correct: D === 0 ? 0 : 1 },
          steps: [
            <><Tex>{`${tmat([a1, a2, a3], "v")} = ${tn(D)}`}</Tex></>,
            D === 0 ? <>0 ga teng, demak vektorlar <b>bog'liq</b>{dep && <> (<Tex>{`a_3 = ${tn(p)}a_1 ${q < 0 ? "-" : "+"} ${tn(Math.abs(q))}a_2`}</Tex>)</>}.</> : <>0 ga teng emas, demak vektorlar <b>erkli</b> va bazis bo'ladi.</>,
          ],
        };
      },
    },
    {
      id: "basis",
      title: "Bazis bo'yicha yoyilma",
      make: () => {
        let e1 = [1, 0], e2 = [0, 1], d = 0;
        while (![1, -1, 2, -2].includes(d)) { e1 = [rnz(-3, 3), ri(-3, 3)]; e2 = [ri(-3, 3), rnz(-3, 3)]; d = e1[0] * e2[1] - e1[1] * e2[0]; }
        const al = rnz(-3, 3), be = rnz(-3, 3);
        const x = [al * e1[0] + be * e2[0], al * e1[1] + be * e2[1]];
        const dA = x[0] * e2[1] - x[1] * e2[0], dB = e1[0] * x[1] - e1[1] * x[0];
        return {
          q: <><Tex>{`e_1=${tvec(e1)},\\ e_2=${tvec(e2)}`}</Tex> bazisda <Tex>{`x=${tvec(x)}`}</Tex> vektorning yoyilmasini toping: <Tex>{"x=\\alpha e_1+\\beta e_2"}</Tex>.</>,
          ans: [{ label: <Tex>{"\\alpha"}</Tex>, v: al }, { label: <Tex>{"\\beta"}</Tex>, v: be }],
          traps: [{ v: [be, al], why: "$\\alpha$ va $\\beta$ o'rnini almashtirdingiz: $\\alpha$ — $e_1$ oldidagi son." }],
          steps: [
            <><b>Tenglikni koordinatalar bo'yicha yozamiz.</b> Har bir koordinata uchun alohida tenglama chiqadi: <Tex block>{`\\alpha${tvec(e1)} + \\beta${tvec(e2)} = ${tvec(x)}\\quad\\Rightarrow\\quad \\begin{cases} ${tn(e1[0])}\\alpha ${e2[0] < 0 ? "-" : "+"} ${Math.abs(e2[0])}\\beta = ${tn(x[0])} \\\\ ${tn(e1[1])}\\alpha ${e2[1] < 0 ? "-" : "+"} ${Math.abs(e2[1])}\\beta = ${tn(x[1])} \\end{cases}`}</Tex></>,
            <><b>Kramer usuli bilan yechamiz:</b> <Tex>{`\\Delta = ${tmat([[e1[0], e2[0]], [e1[1], e2[1]]], "v")} = ${tn(d)},\\quad \\Delta_\\alpha = ${tmat([[x[0], e2[0]], [x[1], e2[1]]], "v")} = ${tn(dA)},\\quad \\Delta_\\beta = ${tmat([[e1[0], x[0]], [e1[1], x[1]]], "v")} = ${tn(dB)}`}</Tex></>,
            <><b>Bo'lamiz:</b> <Tex>{`\\alpha = \\frac{${tn(dA)}}{${tn(d)}} = ${tn(al)},\\quad \\beta = \\frac{${tn(dB)}}{${tn(d)}} = ${tn(be)}`}</Tex>. Demak <Tex>{`x = ${tn(al)}e_1 ${be < 0 ? "-" : "+"} ${tn(Math.abs(be))}e_2`}</Tex>.</>,
          ],
        };
      },
    },
  ],
  tests: [
    { id: "t5:test:1", q: "Vektor fazoda vektorlar ustida qaysi amal aniqlangan?", options: ["Vektorni vektorga ko'paytirish", "Darajaga oshirish", "Qo'shish", "Bo'lish", "Teskarisini topish"], correct: 2, explain: "Vektor fazoda ikki amal: qo'shish va songa ko'paytirish." },
    { id: "t5:test:2", q: "Vektor fazoda qaysi amalni bajarib bo'lmaydi?", options: ["Qo'shish", "Songa ko'paytirish", "Ayirish", "Vektorni vektorga ko'paytirish", "Songa bo'lish"], correct: 3, explain: "Ayirish — $(-1)$ ga ko'paytirib qo'shish; songa bo'lish — $\\dfrac1k$ ga ko'paytirish. Vektorni vektorga ko'paytirish esa ta'rifda yo'q." },
    { id: "t5:test:3", q: "Vektor fazoda qo'shish amali qaysi xossaga ega emas?", options: ["$x+y=y+x$", "$x+(y+z)=(x+y)+z$", "$x+0=x$", "$x+(-x)=0$", "Barcha xossalarga ega"], correct: 4, explain: "Bularning hammasi vektor fazo aksiomalari." },
    { id: "t5:test:4", q: "Songa ko'paytirish amali qaysi xossaga ega emas?", options: ["$\\lambda(\\mu x)=(\\lambda\\mu)x$", "$(\\lambda+\\mu)x=\\lambda x+\\mu x$", "$1\\cdot x=x$", "$\\lambda(x+y)=\\lambda x+\\lambda y$", "$(\\lambda:\\mu)\\,x=\\lambda x:\\mu x$"], correct: 4, explain: "Vektorni vektorga bo'lish mavjud emas — oxirgi ifoda ma'nosiz." },
    { id: "t5:test:5", q: <><Tex>{"y=(3;-2;1;4)"}</Tex> va <Tex>{"3x+y=(6;4;1;13)"}</Tex> bo'lsa, x = ?</>, options: ["$(1;\\ -3;\\ 1;\\ 0)$", "$(1;\\ 2;\\ 0;\\ 3)$", "$(1;\\ 0;\\ -3;\\ 1)$", "$(2;\\ 1;\\ 1;\\ 0)$", "$(3;\\ 6;\\ 0;\\ 9)$"], correct: 1, explain: "$3x=(6-3;\\ 4+2;\\ 1-1;\\ 13-4)=(3;\\ 6;\\ 0;\\ 9)$, demak $x=(1;\\ 2;\\ 0;\\ 3)$. Oxirgi variantda 3 ga bo'lish unutilgan." },
    { id: "t5:test:6", q: "Bazis deb qanday vektorlar sistemasiga aytiladi?", options: ["Ixtiyoriy n ta vektorga", "Chiziqli erkli va fazoning har qanday vektori ular orqali ifodalanadigan sistemaga", "O'zaro perpendikulyar vektorlarga", "Uzunligi 1 ga teng vektorlarga", "Chiziqli bog'liq vektorlarga"], correct: 1, explain: "Bazis: (1) erkli, (2) butun fazoni 'qoplaydi'." },
    { id: "t5:test:7", q: <>Chiziqli operator xossasi:</>, options: ["$A(x+y)=Ax+Ay$ va $A(\\lambda x)=\\lambda Ax$", "$A(x+y)=Ax\\cdot Ay$", "$A(\\lambda x)=Ax+\\lambda$", "$A(x)=x^2$", "$A(x+y)=A(x)$"], correct: 0, explain: "Chiziqlilik: yig'indini va songa ko'paytmani saqlaydi." },
    { id: "t5:test:8", q: "Xos vektor ta'rifi:", options: ["$Ax=0$", "$Ax=\\lambda x,\\ x\\neq0$", "$Ax=x+\\lambda$", "$\\det A=\\lambda$", "$A^Tx=x$"], correct: 1, explain: "Operator xos vektorni faqat $\\lambda$ marta cho'zadi, yo'nalishi saqlanadi." },
    { id: "t5:test:9", q: "Xos sonlar qaysi tenglamadan topiladi?", options: ["$\\det A=0$", "$\\det(A-\\lambda E)=0$", "$A-\\lambda=0$", "$Ax=b$", "$\\det(A+\\lambda E)=1$"], correct: 1, explain: "Xarakteristik tenglama: $\\det(A-\\lambda E)=0$." },
    { id: "t5:test:10", q: <><Tex>{"A=\\begin{pmatrix}2&0\\\\0&5\\end{pmatrix}"}</Tex> ning xos sonlari:</>, options: ["0 va 0", "2 va 5", "7 va 10", "$-2$ va $-5$", "1 va 1"], correct: 1, explain: "Diagonal (yoki uchburchak) matritsada xos sonlar diagonal elementlarning o'zi bo'ladi." },
  ],
  cheat: [
    { t: "Vektor fazo", f: <>Qo'shish + songa ko'paytirish (8 ta aksioma)</> },
    { t: "Bog'liqlik testi", f: <>Determinant <Tex>{"=0"}</Tex> bo'lsa — bog'liq; <Tex>{"\\neq0"}</Tex> bo'lsa — bazis</> },
    { t: "Yoyilma", f: <><Tex>{"x=\\alpha e_1+\\beta e_2+\\gamma e_3"}</Tex> — koordinatalar bo'yicha sistema tuzib yechiladi</> },
    { t: "Tasvir / aks tasvir", f: <><Tex>{"y=Ax"}</Tex> / <Tex>{"x=A^{-1}y"}</Tex></> },
    { t: "Xos son", f: <Tex>{"\\det(A-\\lambda E)=0;\\ \\lambda^2-(a+d)\\lambda+\\det A=0"}</Tex> },
    { t: "Tekshiruv", f: <Tex>{"\\lambda_1+\\lambda_2=a+d,\\ \\lambda_1\\lambda_2=\\det A"}</Tex> },
  ],
  lessons: ["kombinatsiya", "boglik", "almashtirish", "xos"],
};
