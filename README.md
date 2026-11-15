# Algebranimation — chiziqli algebra animatsiyalarda

"Amaliy matematika 1" (HEMIS, AMAT11210) fanining algebra qismini interaktiv animatsiyalar orqali o'rgatuvchi sayt + Manim video-darslar.

## Ishga tushirish

```powershell
cd web
npm install
npm run dev          # http://localhost:5173
npm run build        # dist/ — statik sayt (istalgan hostingga qo'yiladi)
```

Videolarni qayta yaratish (Python o'rnatish shart emas — `uv` o'zi Python 3.12 olib keladi):

```powershell
cd manim
./render.ps1                 # 720p, videolar web/public/videos ga ko'chiriladi
./render.ps1 -Quality h      # 1080p
```

## Tuzilma

| Papka | Nima bor |
|---|---|
| `web/src/data/topics.ts` | **Kurs skeleti**: 17 mavzu, ular orasidagi bog'lanishlar ("nimaga kerak" izohi bilan), HEMIS ma'ruzalariga moslik, lug'at |
| `web/src/lessons/` | Darslar: `vectors.tsx`, `line.tsx`, `matrices.tsx`, `systems.tsx`, `eigen.tsx` |
| `web/src/components/viz.tsx` | Umumiy grafik qismlar: `Board`, `Arrow`, `TransformedGrid`, vaqt chizig'i (`useTimeline`, `Controls`) |
| `web/src/lib/la.ts` | 2×2 chiziqli algebra + formulalarni chiroyli yozish (`lin`, `pf`, `term`) |
| `web/src/lib/frac.ts` | Kasrlar: Gauss usuli va teskari matritsani daftardagidek aniq ko'rsatish |
| `manim/scenes.py` | 3 ta video sahna: matritsa-almashtirish, determinant, xos vektor |

## Yangi dars qo'shish

1. `topics.ts` ga mavzu qo'shing: `prereqs` ga oldingi mavzular va **nima uchun kerakligi**ni yozing — bilim xaritasi va har darsdagi "bog'lanishlar" bloki avtomatik yangilanadi.
2. `lessons/` da komponent yozing (`LessonShell` ichida), `lessons/index.ts` ga ulang.

## Vizual qoidalar (izchillik uchun)

- Ranglar butun kursda bir xil ma'noda: **yashil** — î / 1-ustun, **qizil** — ĵ / 2-ustun, **sariq** — o'quvchi boshqaradigan vektor, **ko'k** — natija, **to'q sariq** — manfiy (ishora teskari).
- Har bir rasmda bitta diqqat markazi. Almashtirish ko'rsatilsa, fon to'ri xiralashtiriladi (`<Board faint>`).
- Manfiy sonlar ko'paytuvchi bo'lsa qavsda: `(−2)·3`; koeffitsiyent 1 yozilmaydi: `x − y`, `1x − 1y` emas.
- Har bir animatsiyaning yagona boshqaruvi bo'ladi (▶ + slayder + qadam nomlari).

## Ishlatilgan vositalar

- [Mafs](https://mafs.dev) — React uchun interaktiv matematik grafika
- [KaTeX](https://katex.org) — formulalar
- [React Flow](https://reactflow.dev) — bilim xaritasi
- [Manim Community](https://www.manim.community) — video animatsiyalar
- Vite + React + TypeScript
