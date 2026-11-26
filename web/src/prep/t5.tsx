import { Tex } from "../components/Tex";
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
      <p><b>Chiziqli operator</b> — vektorni boshqa vektorga aylantiruvchi qoida, u matritsa bilan beriladi: <Tex>{"y=Ax"}</Tex>. <b>Xos vektor</b> — operator faqat cho'zadigan (yo'nalishini o'zgartirmaydigan) vektor: <Tex>{"Ax=\\lambda x"}</Tex>; λ — xos son.</p>
    </>
  ),
  uses: [
    { icon: "💼", title: "Investitsiya portfeli", text: <>Har qanday portfel — bazis aktivlar (aksiya, obligatsiya, naqd) kombinatsiyasi. Yoyilma koeffitsiyentlari — har biridan qancha olish.</> },
    { icon: "🔁", title: "Iqtisodiy o'tish modellari", text: <>Bozor ulushlari har yili matritsa bo'yicha o'zgaradi: <Tex>{"x_{t+1}=Ax_t"}</Tex>. Uzoq muddatli holat — <Tex>{"\\lambda=1"}</Tex> ga mos xos vektor.</> },
    { icon: "🔎", title: "Google PageRank", text: <>Sahifalar reytingi — ulanishlar matritsasining asosiy xos vektori.</> },
    { icon: "📉", title: "Ma'lumotlarni siqish (PCA)", text: <>Ko'p ko'rsatkichli iqtisodiy ma'lumotlarning asosiy yo'nalishlari — kovariatsiya matritsasining xos vektorlari.</> },
  ],
  recipes: [
    {
      title: "Vektor fazoda tenglama",
      rule: <>Vektorlar bilan oddiy sonlardek ishlaymiz, faqat har bir koordinata alohida: <Tex>{"3x+y=z\\Rightarrow x=\\frac{z-y}{3}"}</Tex>.</>,
      steps: [
        <><Tex>{"y=(3;-2;1;4),\\ 3x+y=(6;4;1;13)"}</Tex>. x = ?</>,
        <><Tex>{"3x=(6;4;1;13)-(3;-2;1;4)=(3;\\,6;\\,0;\\,9)"}</Tex></>,
        <><Tex>{"x=\\frac13(3;6;0;9)=(1;\\,2;\\,0;\\,3)"}</Tex></>,
      ],
    },
    {
      title: "Bazis bo'yicha yoyilma",
      rule: <><Tex>{"x=\\alpha e_1+\\beta e_2+\\gamma e_3"}</Tex> ni koordinatalar bo'yicha yozsak — <b>tenglamalar sistemasi</b> chiqadi. Uni Kramer yoki Gauss bilan yechamiz.</>,
      steps: [
        <><Tex>{"e_1=(1;1),\\ e_2=(1;-1)"}</Tex> bazisda <Tex>{"x=(5;1)"}</Tex> ning yoyilmasi.</>,
        <><Tex>{"\\alpha(1;1)+\\beta(1;-1)=(5;1)\\Rightarrow\\begin{cases}\\alpha+\\beta=5\\\\\\alpha-\\beta=1\\end{cases}"}</Tex></>,
        <>Qo'shsak: <Tex>{"2\\alpha=6,\\ \\alpha=3,\\ \\beta=2"}</Tex>. Demak <Tex>{"x=3e_1+2e_2"}</Tex>.</>,
      ],
    },
    {
      title: "Chiziqli bog'liqlik (bazis bo'ladimi?)",
      rule: <>n ta n o'lchovli vektor: ulardan tuzilgan determinant <Tex>{"=0"}</Tex> → <b>chiziqli bog'liq</b> (bazis emas); <Tex>{"\\ne0"}</Tex> → <b>erkli</b> (bazis).</>,
      steps: [
        <><Tex>{"a_1=(1;2;3),\\ a_2=(0;1;1),\\ a_3=(1;3;4)"}</Tex></>,
        <><Tex>{`${tmat([[1, 2, 3], [0, 1, 1], [1, 3, 4]], "v")} = ${det3([[1, 2, 3], [0, 1, 1], [1, 3, 4]])}`}</Tex></>,
        <>Determinant 0 → bog'liq. Haqiqatan <Tex>{"a_3=a_1+a_2"}</Tex> — "ortiqcha" vektor.</>,
      ],
    },
    {
      title: "Operator: tasvir va aks tasvir",
      rule: <><b>Tasvir</b>: <Tex>{"y=Ax"}</Tex> — matritsani vektorga "satrni ustunga" ko'paytiramiz. <b>Aks tasvir</b>: y berilgan, x = ? — sistema <Tex>{"Ax=y"}</Tex> ni yechamiz (<Tex>{"x=A^{-1}y"}</Tex>).</>,
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
      rule: <>Xos sonlar <b>xarakteristik tenglamadan</b>: <Tex>{"\\det(A-\\lambda E)=0"}</Tex>. 2×2 uchun: <Tex>{"\\lambda^2-(a+d)\\lambda+(ad-bc)=0"}</Tex>. Keyin har bir λ uchun <Tex>{"(A-\\lambda E)x=0"}</Tex> dan xos vektor.</>,
      steps: [
        <><Tex>{"A=\\begin{pmatrix}4&1\\\\2&3\\end{pmatrix}"}</Tex></>,
        <><Tex>{"\\begin{vmatrix}4-\\lambda&1\\\\2&3-\\lambda\\end{vmatrix}=(4-\\lambda)(3-\\lambda)-2=0"}</Tex></>,
        <><Tex>{"\\lambda^2-7\\lambda+10=0\\Rightarrow\\lambda_1=2,\\ \\lambda_2=5"}</Tex></>,
        <><Tex>{"\\lambda=5:\\ (A-5E)x=\\begin{pmatrix}-1&1\\\\2&-2\\end{pmatrix}x=0\\Rightarrow -x_1+x_2=0"}</Tex> → xos vektor <Tex>{"(1;1)"}</Tex>. Tekshiruv: <Tex>{"A(1;1)=(5;5)=5\\cdot(1;1)"}</Tex> ✓</>,
        <>Tezkor tekshiruv: <Tex>{"\\lambda_1+\\lambda_2=a+d"}</Tex> (2+5 = 4+3 ✓), <Tex>{"\\lambda_1\\lambda_2=\\det A"}</Tex> (10 = 12−2 ✓).</>,
      ],
    },
  ],
  mistakes: [
    { wrong: <>Vektor fazoda vektorlarni ko'paytirish amali bor</>, right: <>Ta'rifda faqat <b>qo'shish</b> va <b>songa ko'paytirish</b>.</> },
    { wrong: <><Tex>{"\\det(A-\\lambda)"}</Tex> — λ ni hamma elementdan ayirish</>, right: <><Tex>{"A-\\lambda E"}</Tex>: λ faqat <b>diagonal</b> elementlardan ayiriladi.</> },
    { wrong: <>Xos vektor nol bo'lishi mumkin</>, right: <>Xos vektor <Tex>{"x\\neq0"}</Tex> (ta'rif bo'yicha).</> },
    { wrong: <>Aks tasvir uchun <Tex>{"y=Ax"}</Tex> hisoblash</>, right: <>Aks tasvir — <b>teskari</b> masala: <Tex>{"Ax=y"}</Tex> sistemani yechish.</> },
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
          traps: [{ v: z.map((v, i) => (v + y[i]) / k), why: "y ni ayirish o'rniga qo'shdingiz: kx = z − y." }],
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
          steps: A.map((r, i) => <>{i + 1}-satr: <Tex>{rowTex(r, x)}</Tex></>),
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
          traps: [{ v: imgWrong, why: "Siz y ning tasvirini (A·y) topdingiz. Aks tasvir — Ax = y sistemani yechish." }],
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
            D === 0 ? <>0 ga teng → <b>bog'liq</b>{dep && <> (<Tex>{`a_3 = ${tn(p)}a_1 ${q < 0 ? "-" : "+"} ${tn(Math.abs(q))}a_2`}</Tex>)</>}.</> : <>0 emas → <b>erkli</b>, bazis bo'ladi.</>,
          ],
        };
      },
    },
  ],
  tests: [
    { id: "t5:test:1", q: "Vektor fazoda vektorlar ustida qaysi amal aniqlangan?", options: ["Vektorni vektorga ko'paytirish", "Darajaga oshirish", "Qo'shish", "Bo'lish", "Teskarisini topish"], correct: 2, explain: "Vektor fazoda ikki amal: qo'shish va songa ko'paytirish." },
    { id: "t5:test:2", q: "Vektor fazoda qaysi amalni bajarib bo'lmaydi?", options: ["Qo'shish", "Songa ko'paytirish", "Ayirish", "Vektorni vektorga ko'paytirish", "Songa bo'lish"], correct: 3, explain: "Ayirish = (−1) ga ko'paytirib qo'shish, songa bo'lish = 1/k ga ko'paytirish. Vektorni vektorga ko'paytirish ta'rifda yo'q." },
    { id: "t5:test:3", q: "Vektor fazoda qo'shish amali qaysi xossaga ega emas?", options: ["x + y = y + x", "x + (y + z) = (x + y) + z", "x + 0 = x", "x + (−x) = 0", "Barcha xossalarga ega"], correct: 4, explain: "Bularning hammasi vektor fazo aksiomalari." },
    { id: "t5:test:4", q: "Songa ko'paytirish amali qaysi xossaga ega emas?", options: ["λ(μx) = (λμ)x", "(λ + μ)x = λx + μx", "1·x = x", "λ(x + y) = λx + λy", "(λ : μ)x = λx : μx"], correct: 4, explain: "Vektorni vektorga bo'lish mavjud emas — oxirgi ifoda ma'nosiz." },
    { id: "t5:test:5", q: <><Tex>{"y=(3;-2;1;4)"}</Tex> va <Tex>{"3x+y=(6;4;1;13)"}</Tex> bo'lsa, x = ?</>, options: ["(1; −3; 1; 0)", "(1; 2; 0; 3)", "(1; 0; −3; 1)", "(2; 1; 1; 0)", "(3; 6; 0; 9)"], correct: 1, explain: "3x = (6−3; 4+2; 1−1; 13−4) = (3; 6; 0; 9), x = (1; 2; 0; 3). Oxirgi variant — 3 ga bo'lish unutilgan." },
    { id: "t5:test:6", q: "Bazis deb qanday vektorlar sistemasiga aytiladi?", options: ["Ixtiyoriy n ta vektorga", "Chiziqli erkli va fazoning har qanday vektori ular orqali ifodalanadigan sistemaga", "O'zaro perpendikulyar vektorlarga", "Uzunligi 1 ga teng vektorlarga", "Chiziqli bog'liq vektorlarga"], correct: 1, explain: "Bazis: (1) erkli, (2) butun fazoni 'qoplaydi'." },
    { id: "t5:test:7", q: <>Chiziqli operator xossasi:</>, options: ["A(x + y) = Ax + Ay va A(λx) = λAx", "A(x + y) = Ax · Ay", "A(λx) = Ax + λ", "A(x) = x²", "A(x + y) = A(x)"], correct: 0, explain: "Chiziqlilik: yig'indini va songa ko'paytmani saqlaydi." },
    { id: "t5:test:8", q: "Xos vektor ta'rifi:", options: ["Ax = 0", "Ax = λx, x ≠ 0", "Ax = x + λ", "det A = λ", "Aᵀx = x"], correct: 1, explain: "Operator xos vektorni faqat λ marta cho'zadi (yo'nalishi saqlanadi)." },
    { id: "t5:test:9", q: "Xos sonlar qaysi tenglamadan topiladi?", options: ["det A = 0", "det(A − λE) = 0", "A − λ = 0", "Ax = b", "det(A + λE) = 1"], correct: 1, explain: "Xarakteristik tenglama: |A − λE| = 0." },
    { id: "t5:test:10", q: <><Tex>{"A=\\begin{pmatrix}2&0\\\\0&5\\end{pmatrix}"}</Tex> ning xos sonlari:</>, options: ["0 va 0", "2 va 5", "7 va 10", "−2 va −5", "1 va 1"], correct: 1, explain: "Diagonal (yoki uchburchak) matritsada xos sonlar = diagonal elementlar." },
  ],
  cheat: [
    { t: "Vektor fazo", f: <>Qo'shish + songa ko'paytirish (8 ta aksioma)</> },
    { t: "Bog'liqlik testi", f: <><Tex>{"\\det(a_1,a_2,a_3)=0"}</Tex> → bog'liq, <Tex>{"\\neq0"}</Tex> → bazis</> },
    { t: "Yoyilma", f: <><Tex>{"x=\\alpha e_1+\\beta e_2+\\gamma e_3"}</Tex> → sistema</> },
    { t: "Tasvir / aks tasvir", f: <><Tex>{"y=Ax"}</Tex> / <Tex>{"x=A^{-1}y"}</Tex></> },
    { t: "Xos son", f: <Tex>{"\\det(A-\\lambda E)=0;\\ \\lambda^2-(a+d)\\lambda+\\det A=0"}</Tex> },
    { t: "Tekshiruv", f: <Tex>{"\\lambda_1+\\lambda_2=a+d,\\ \\lambda_1\\lambda_2=\\det A"}</Tex> },
  ],
  lessons: ["kombinatsiya", "boglik", "almashtirish", "xos"],
};
