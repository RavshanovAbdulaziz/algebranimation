// Kursning "skeleti": mavzular va ular orasidagi bog'lanishlar.
// Har bir bog'lanishda "why" — oldingi mavzu bu yerda AYNAN nimaga kerakligi.

export type Group = "vektor" | "matritsa" | "sistema" | "spektr";

export interface Topic {
  id: string;
  title: string;
  ru: string;
  en: string;
  group: Group;
  /** Bir gapda: mavzuning mohiyati */
  idea: string;
  prereqs: { id: string; why: string }[];
  /** manim/ papkasida render qilinadigan video (web/public/videos/<video>.mp4) */
  video?: string;
  /** HEMIS "Amaliy matematika 1" dasturidagi ma'ruza raqamlari */
  hemis: number[];
}

/** HEMIS: Amaliy matematika 1 (AMAT11210) — algebra qismi ma'ruzalari */
export const HEMIS_LECTURES: { n: number; title: string; points: string }[] = [
  { n: 1, title: "Determinantlar va ularning xossalari", points: "2- va 3-tartibli determinant, Sarrus usuli, xossalar, minor, algebraik to'ldiruvchi, Laplas teoremasi" },
  { n: 2, title: "Matritsalar va ular ustida amallar", points: "matritsa turlari, qo'shish, songa ko'paytirish, satrni ustunga ko'paytirish, daraja, transponirlash" },
  { n: 3, title: "Chiziqli tenglamalar sistemasi (CHTS)", points: "birgalikdalik, Kroneker–Kapelli, matritsa usuli, Kramer usuli, Gauss usuli, bir jinsli sistema" },
  { n: 4, title: "Vektorlar va ular ustida amallar", points: "modul, kollinear va komplanar vektorlar, amallar, koordinatalar" },
  { n: 5, title: "Chiziqli fazo va chiziqli operatorlar", points: "bazis, yoyilma, chiziqli bog'liqlik, operator tasviri, xos son va xos vektor" },
  { n: 6, title: "Tekislikda to'g'ri chiziqlar", points: "umumiy, burchak koeffitsiyentli, kesmalardagi, normal, kanonik, parametrik tenglamalar" },
];

export const GROUPS: Record<Group, { name: string; color: string }> = {
  vektor: { name: "Vektorlar", color: "#58c4dd" },
  matritsa: { name: "Matritsalar", color: "#ffd166" },
  sistema: { name: "Tenglamalar sistemasi", color: "#83c167" },
  spektr: { name: "Xos qiymatlar", color: "#c77dff" },
};

export const TOPICS: Topic[] = [
  {
    id: "vektor",
    video: "VektorNima",
    hemis: [4],
    title: "Vektor nima?",
    ru: "Вектор",
    en: "Vector",
    group: "vektor",
    idea: "Vektor — koordinatalar boshidan chiqqan yo'nalishli kesma; uni ikki son (x, y) to'liq ifodalaydi.",
    prereqs: [],
  },
  {
    id: "amallar",
    video: "VektorAmallar",
    hemis: [4],
    title: "Vektorlarni qo'shish va songa ko'paytirish",
    ru: "Сложение векторов, умножение на число",
    en: "Vector addition, scalar multiplication",
    group: "vektor",
    idea: "Qo'shish — ikki harakatni ketma-ket bajarish; songa ko'paytirish — vektorni cho'zish yoki qisish.",
    prereqs: [{ id: "vektor", why: "Vektor = (x, y) juftligi; amallar shu koordinatalar ustida bajariladi." }],
  },
  {
    id: "kombinatsiya",
    video: "Kombinatsiya",
    hemis: [5],
    title: "Chiziqli kombinatsiya, qobiq va bazis",
    ru: "Линейная комбинация, линейная оболочка, базис",
    en: "Linear combination, span, basis",
    group: "vektor",
    idea: "αv + βw ko'rinishidagi barcha vektorlar to'plami — qobiq (span). Koordinatalar aslida bazis vektorlarining koeffitsiyentlari.",
    prereqs: [{ id: "amallar", why: "αv + βw — bu faqat songa ko'paytirish va qo'shishdan tuzilgan ifoda." }],
  },
  {
    id: "boglik",
    video: "ChiziqliBoglik",
    hemis: [4, 5],
    title: "Chiziqli bog'liqlik",
    ru: "Линейная зависимость",
    en: "Linear dependence",
    group: "vektor",
    idea: "Agar vektor qolganlarining kombinatsiyasi bo'lsa, u 'ortiqcha' — qobiqni kengaytirmaydi.",
    prereqs: [{ id: "kombinatsiya", why: "Bog'liqlik = bitta vektor boshqalarining chiziqli kombinatsiyasi bo'lishi." }],
  },
  {
    id: "skalyar",
    video: "SkalyarKopaytma",
    hemis: [4],
    title: "Skalyar ko'paytma",
    ru: "Скалярное произведение",
    en: "Dot product",
    group: "vektor",
    idea: "a·b — bir vektorning ikkinchisiga proyeksiyasi uzunligi × ikkinchisining uzunligi. Ishorasi burchakni bildiradi.",
    prereqs: [{ id: "amallar", why: "Uzunlik va proyeksiya koordinatalar ustidagi amallar orqali hisoblanadi." }],
  },
  {
    id: "chiziq",
    video: "ToGriChiziq",
    title: "To'g'ri chiziq tenglamalari",
    ru: "Уравнения прямой на плоскости",
    en: "Equations of a line",
    group: "vektor",
    hemis: [6],
    idea: "Bitta to'g'ri chiziq — bir nechta tenglama ko'rinishi. Hammasi ikki vektordan kelib chiqadi: yo'naltiruvchi s va normal n.",
    prereqs: [
      { id: "amallar", why: "Parametrik tenglama r = r₀ + t·s — nuqtaga vektorni t marta qo'shish." },
      { id: "skalyar", why: "Ax + By + C = 0 da (A, B) — normal vektor: n · (r − r₀) = 0." },
    ],
  },
  {
    id: "matritsa",
    video: "SatrniUstunga",
    title: "Matritsalar va ular ustida amallar",
    ru: "Матрицы и действия над ними",
    en: "Matrices and matrix operations",
    group: "matritsa",
    hemis: [2],
    idea: "Matritsa — sonlar jadvali. Qo'shish elementma-element, ko'paytirish esa 'satrni ustunga': har bir element — skalyar ko'paytma.",
    prereqs: [
      { id: "amallar", why: "Matritsalarni qo'shish va songa ko'paytirish — vektorlardagi kabi, elementma-element." },
      { id: "skalyar", why: "AB ning (i, j) elementi = A ning i-satri · B ning j-ustuni (skalyar ko'paytma)." },
    ],
  },
  {
    id: "almashtirish",
    hemis: [5],
    title: "Matritsa — chiziqli operator (almashtirish)",
    ru: "Матрица как линейное преобразование",
    en: "Matrix as a linear transformation",
    group: "matritsa",
    idea: "Matritsa ustunlari — bazis vektorlari qayerga borishi. A·v = x·(1-ustun) + y·(2-ustun).",
    prereqs: [
      { id: "kombinatsiya", why: "A·v aslida ustunlarning chiziqli kombinatsiyasi: koeffitsiyentlar — v ning koordinatalari." },
      { id: "matritsa", why: "A·v ni hisoblash — satrni ustunga ko'paytirish qoidasi." },
    ],
    video: "MatritsaAlmashtirish",
  },
  {
    id: "kopaytma",
    video: "Kompozitsiya",
    hemis: [2],
    title: "Matritsalarni ko'paytirish",
    ru: "Умножение матриц",
    en: "Matrix multiplication",
    group: "matritsa",
    idea: "B·A — avval A, keyin B almashtirishini bajarish (kompozitsiya). Tartib muhim: AB ≠ BA.",
    prereqs: [
      { id: "almashtirish", why: "Ko'paytma = ikki almashtirishni ketma-ket bajarish." },
      { id: "matritsa", why: "Hisoblash qoidasi ('satrni ustunga') shu yerda kiritilgan; endi uning ma'nosini ko'ramiz." },
    ],
  },
  {
    id: "determinant",
    hemis: [1],
    title: "Determinant",
    ru: "Определитель",
    en: "Determinant",
    group: "matritsa",
    idea: "det A — almashtirish yuzalarni necha marta kattalashtirishi. det = 0 bo'lsa, tekislik chiziqqa yassilanadi.",
    prereqs: [
      { id: "almashtirish", why: "Determinant almashtirish birlik kvadratni qanday parallelogrammga aylantirishini o'lchaydi." },
      { id: "boglik", why: "det A = 0  ⇔  ustunlar chiziqli bog'liq (parallelogramm yassi)." },
    ],
    video: "Determinant",
  },
  {
    id: "det3",
    video: "Sarrus",
    title: "3-tartibli determinant: Sarrus va Laplas",
    ru: "Определитель 3-го порядка: правило Саррюса, разложение Лапласа",
    en: "3×3 determinant: rule of Sarrus, Laplace expansion",
    group: "matritsa",
    hemis: [1],
    idea: "3×3 determinant — 6 ta ko'paytma yig'indisi (Sarrus) yoki satr bo'yicha yoyilma Σ aᵢⱼ·Aᵢⱼ (Laplas). Geometrik ma'nosi — hajm.",
    prereqs: [
      { id: "determinant", why: "Minorlar — 2×2 determinantlar; xossalarning geometrik sababi shu yerda." },
    ],
  },
  {
    id: "sistema",
    video: "TenglamalarSistemasi",
    hemis: [3],
    title: "Chiziqli tenglamalar sistemasi",
    ru: "Система линейных уравнений (СЛАУ)",
    en: "System of linear equations",
    group: "sistema",
    idea: "Ax = b: qaysi x vektor A almashtirishdan keyin b ga tushadi? Yoki: b ni ustunlarning kombinatsiyasi qilib yozish.",
    prereqs: [
      { id: "kombinatsiya", why: "Ustunlar tasviri: x·(1-ustun) + y·(2-ustun) = b." },
      { id: "almashtirish", why: "Ax = b — A almashtirish b ga olib boradigan vektorni qidirish." },
      { id: "chiziq", why: "Har bir tenglama ax + by = c — to'g'ri chiziq; yechim — chiziqlar kesishgan nuqta." },
    ],
  },
  {
    id: "gauss",
    video: "GaussUsuli",
    hemis: [3],
    title: "Gauss usuli",
    ru: "Метод Гаусса",
    en: "Gaussian elimination",
    group: "sistema",
    idea: "Qator amallari yechimni o'zgartirmaydi, faqat to'g'ri chiziqlarni 'buradi' — oxirida ular o'qlarga parallel bo'ladi.",
    prereqs: [
      { id: "sistema", why: "Gauss usuli — sistemani bosqichma-bosqich soddalashtirish." },
      { id: "kombinatsiya", why: "Yangi tenglama = eski tenglamalarning chiziqli kombinatsiyasi, shuning uchun yechim saqlanadi." },
    ],
  },
  {
    id: "kramer",
    video: "KramerQoidasi",
    hemis: [3],
    title: "Kramer qoidasi",
    ru: "Правило Крамера",
    en: "Cramer's rule",
    group: "sistema",
    idea: "x = det(Aₓ)/det(A): yechim ikki parallelogramm yuzasining nisbati.",
    prereqs: [
      { id: "determinant", why: "Formuladagi har bir son — parallelogramm yuzasi." },
      { id: "sistema", why: "Kramer qoidasi Ax = b ning yechimini to'g'ridan-to'g'ri yozadi." },
      { id: "det3", why: "3 noma'lumli sistemada Δ, Δx, Δy, Δz — 3-tartibli determinantlar." },
    ],
  },
  {
    id: "teskari",
    video: "TeskariMatritsa",
    hemis: [2, 3],
    title: "Teskari matritsa",
    ru: "Обратная матрица",
    en: "Inverse matrix",
    group: "sistema",
    idea: "A⁻¹ — A qilgan ishni bekor qiluvchi almashtirish. Mavjud ⇔ det A ≠ 0.",
    prereqs: [
      { id: "kopaytma", why: "A⁻¹A = I: 'avval A, keyin A⁻¹' hech narsa qilmaslikka teng." },
      { id: "determinant", why: "det A = 0 bo'lsa, tekislik yassilangan — uni qayta tiklab bo'lmaydi." },
      { id: "sistema", why: "Ax = b  ⇒  x = A⁻¹b (matritsa usuli)." },
      { id: "det3", why: "A⁻¹ = (1/|A|)·(algebraik to'ldiruvchilar matritsasi)ᵀ." },
    ],
  },
  {
    id: "rang",
    video: "MatritsaRangi",
    hemis: [3],
    title: "Matritsa rangi",
    ru: "Ранг матрицы",
    en: "Rank",
    group: "sistema",
    idea: "Rang — almashtirish natijasi necha o'lchovli: tekislik (2), chiziq (1) yoki nuqta (0).",
    prereqs: [
      { id: "boglik", why: "Rang = chiziqli erkli ustunlarning maksimal soni." },
      { id: "gauss", why: "Gaussdan keyin nolga teng bo'lmagan qatorlar soni = rang." },
      { id: "almashtirish", why: "Rang = natija fazosining (ustunlar qobig'ining) o'lchami." },
    ],
  },
  {
    id: "xos",
    hemis: [5],
    title: "Xos vektorlar va xos qiymatlar",
    ru: "Собственные векторы и значения",
    en: "Eigenvectors and eigenvalues",
    group: "spektr",
    idea: "Xos vektor almashtirishdan keyin ham o'z chizig'ida qoladi, faqat λ marta cho'ziladi: Av = λv.",
    prereqs: [
      { id: "almashtirish", why: "Xos vektor — almashtirish 'burmaydigan' yo'nalish." },
      { id: "determinant", why: "λ ni topish: det(A − λI) = 0 (A − λI yassilashi kerak)." },
      { id: "rang", why: "A − λI ning rangi 2 dan kichik bo'lgandagina nolmas yechim bor." },
    ],
    video: "XosVektor",
  },
];

export const byId = Object.fromEntries(TOPICS.map((t) => [t.id, t])) as Record<string, Topic>;

/** Bu mavzuga tayanadigan (keyingi) mavzular */
export const dependents = (id: string) =>
  TOPICS.filter((t) => t.prereqs.some((p) => p.id === id)).map((t) => ({
    topic: t,
    why: t.prereqs.find((p) => p.id === id)!.why,
  }));

/** Barcha oldingi mavzular (tranzitiv) */
export function ancestors(id: string, acc = new Set<string>()): Set<string> {
  for (const p of byId[id].prereqs) {
    if (!acc.has(p.id)) {
      acc.add(p.id);
      ancestors(p.id, acc);
    }
  }
  return acc;
}
export function descendants(id: string, acc = new Set<string>()): Set<string> {
  for (const d of dependents(id)) {
    if (!acc.has(d.topic.id)) {
      acc.add(d.topic.id);
      descendants(d.topic.id, acc);
    }
  }
  return acc;
}

/** Grafdagi qavat: eng uzun oldingi zanjir uzunligi */
export function depth(id: string): number {
  const t = byId[id];
  return t.prereqs.length ? 1 + Math.max(...t.prereqs.map((p) => depth(p.id))) : 0;
}

export const GLOSSARY: { uz: string; ru: string; en: string; topic: string }[] = [
  { uz: "vektor", ru: "вектор", en: "vector", topic: "vektor" },
  { uz: "koordinata", ru: "координата", en: "coordinate", topic: "vektor" },
  { uz: "skalyar (son)", ru: "скаляр", en: "scalar", topic: "amallar" },
  { uz: "chiziqli kombinatsiya", ru: "линейная комбинация", en: "linear combination", topic: "kombinatsiya" },
  { uz: "qobiq (span)", ru: "линейная оболочка", en: "span", topic: "kombinatsiya" },
  { uz: "bazis", ru: "базис", en: "basis", topic: "kombinatsiya" },
  { uz: "chiziqli bog'liq", ru: "линейно зависимые", en: "linearly dependent", topic: "boglik" },
  { uz: "chiziqli erkli", ru: "линейно независимые", en: "linearly independent", topic: "boglik" },
  { uz: "skalyar ko'paytma", ru: "скалярное произведение", en: "dot product", topic: "skalyar" },
  { uz: "proyeksiya", ru: "проекция", en: "projection", topic: "skalyar" },
  { uz: "ortogonal (perpendikulyar)", ru: "ортогональный", en: "orthogonal", topic: "skalyar" },
  { uz: "kollinear vektorlar", ru: "коллинеарные векторы", en: "collinear vectors", topic: "boglik" },
  { uz: "to'g'ri chiziqning umumiy tenglamasi", ru: "общее уравнение прямой", en: "general equation of a line", topic: "chiziq" },
  { uz: "burchak koeffitsiyenti", ru: "угловой коэффициент", en: "slope", topic: "chiziq" },
  { uz: "normal vektor", ru: "нормальный вектор", en: "normal vector", topic: "chiziq" },
  { uz: "yo'naltiruvchi vektor", ru: "направляющий вектор", en: "direction vector", topic: "chiziq" },
  { uz: "transponirlangan matritsa", ru: "транспонированная матрица", en: "transpose", topic: "matritsa" },
  { uz: "kvadrat matritsa", ru: "квадратная матрица", en: "square matrix", topic: "matritsa" },
  { uz: "chiziqli operator", ru: "линейный оператор", en: "linear operator", topic: "almashtirish" },
  { uz: "tasvir / aks tasvir", ru: "образ / прообраз", en: "image / preimage", topic: "almashtirish" },
  { uz: "minor", ru: "минор", en: "minor", topic: "det3" },
  { uz: "algebraik to'ldiruvchi", ru: "алгебраическое дополнение", en: "cofactor", topic: "det3" },
  { uz: "Laplas yoyilmasi", ru: "разложение Лапласа", en: "Laplace (cofactor) expansion", topic: "det3" },
  { uz: "Sarrus qoidasi", ru: "правило Саррюса", en: "rule of Sarrus", topic: "det3" },
  { uz: "birgalikdagi sistema", ru: "совместная система", en: "consistent system", topic: "sistema" },
  { uz: "Kroneker–Kapelli teoremasi", ru: "теорема Кронекера–Капелли", en: "Rouché–Capelli theorem", topic: "rang" },
  { uz: "chiziqli almashtirish", ru: "линейное преобразование", en: "linear transformation", topic: "almashtirish" },
  { uz: "matritsa", ru: "матрица", en: "matrix", topic: "almashtirish" },
  { uz: "kompozitsiya", ru: "композиция", en: "composition", topic: "kopaytma" },
  { uz: "determinant", ru: "определитель", en: "determinant", topic: "determinant" },
  { uz: "orientatsiya", ru: "ориентация", en: "orientation", topic: "determinant" },
  { uz: "tenglamalar sistemasi", ru: "система уравнений (СЛАУ)", en: "system of equations", topic: "sistema" },
  { uz: "kengaytirilgan matritsa", ru: "расширенная матрица", en: "augmented matrix", topic: "gauss" },
  { uz: "qator amali", ru: "элементарное преобразование строк", en: "row operation", topic: "gauss" },
  { uz: "teskari matritsa", ru: "обратная матрица", en: "inverse matrix", topic: "teskari" },
  { uz: "birlik matritsa", ru: "единичная матрица", en: "identity matrix", topic: "teskari" },
  { uz: "maxsus matritsa (det = 0)", ru: "вырожденная матрица", en: "singular matrix", topic: "teskari" },
  { uz: "maxsusmas matritsa (det ≠ 0)", ru: "невырожденная матрица", en: "non-singular matrix", topic: "teskari" },
  { uz: "rang", ru: "ранг", en: "rank", topic: "rang" },
  { uz: "xos vektor", ru: "собственный вектор", en: "eigenvector", topic: "xos" },
  { uz: "xos qiymat", ru: "собственное значение", en: "eigenvalue", topic: "xos" },
  { uz: "xarakteristik tenglama", ru: "характеристическое уравнение", en: "characteristic equation", topic: "xos" },
];
