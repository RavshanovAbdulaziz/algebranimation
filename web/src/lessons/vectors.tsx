import { useMemo, useState } from "react";
import { Line, Point, Polygon, Text, useMovablePoint, Circle } from "mafs";
import { LessonShell, Sec, Recall, Key } from "../components/LessonShell";
import { Arrow, Board, C, Controls, Figure, Slider, TransformedGrid, snap, useTimeline } from "../components/viz";
import { Tex } from "../components/Tex";
import { add, cross, dot, fmt, fromCols, len, lin, pf, term, lerpV, scale, smooth, sub, clamp01, type V } from "../lib/la";

/* =================================================================== */
/* 1. VEKTOR                                                           */
/* =================================================================== */
export function VektorLesson() {
  const p = useMovablePoint([3, 2], { color: C.v, constrain: snap(1) });
  const v: V = [p.x, p.y];
  const tl = useTimeline(2, 1.4);
  // t∈[0,1]: x bo'ylab yuramiz, t∈[1,2]: y bo'ylab
  const walker: V = tl.t <= 1 ? [v[0] * smooth(tl.t), 0] : [v[0], v[1] * smooth(tl.t - 1)];

  const tailP = useMovablePoint([-3, -2], { color: C.w, constrain: snap(1) });
  const tail: V = [tailP.x, tailP.y];

  return (
    <LessonShell
      id="vektor"
      quiz={[
        {
          q: <>Vektor <Tex>{"\\vec v = (-2,\\ 3)"}</Tex> qayerni ko'rsatadi?</>,
          options: ["2 qadam o'ngga, 3 qadam pastga", "2 qadam chapga, 3 qadam yuqoriga", "3 qadam chapga, 2 qadam yuqoriga"],
          correct: 1,
          explain: "Birinchi son — gorizontal siljish (manfiy = chapga), ikkinchisi — vertikal (musbat = yuqoriga).",
        },
        {
          q: <><Tex>{"(3,\\ 4)"}</Tex> vektorning uzunligi nechaga teng?</>,
          options: ["7", "5", "12"],
          correct: 1,
          explain: <>Pifagor teoremasi: <Tex>{"\\sqrt{3^2+4^2}=\\sqrt{25}=5"}</Tex>. Yo'l 3 + 4 = 7, lekin strelka to'g'ri — gipotenuza.</>,
        },
      ]}
    >
      <Sec title="Strelka = ikki son">
        <p>
          Vektorni <b>ko'rsatma</b> deb tasavvur qiling: "boshdan <b>x</b> qadam o'ngga, so'ng <b>y</b> qadam yuqoriga yur".
          Shu ikki son vektorni to'liq aniqlaydi. Sariq nuqtani sudrab ko'ring, so'ng ▶ ni bosing — vektor qanday "yurilishini" ko'rasiz.
        </p>
        <Figure
          side={
            <>
              <Tex block>{`\\vec v = \\begin{bmatrix} ${v[0]} \\\\ ${v[1]} \\end{bmatrix}`}</Tex>
              <p><b style={{ color: C.i }}>{v[0]}</b> — gorizontal (x) qadam</p>
              <p><b style={{ color: C.j }}>{v[1]}</b> — vertikal (y) qadam</p>
              <Tex block>{`|\\vec v| = \\sqrt{${pf(v[0])}^2 + ${pf(v[1])}^2} \\approx ${fmt(len(v))}`}</Tex>
              <p className="muted small">Uzunlik — Pifagor teoremasi: x va y — katetlar, vektor — gipotenuza.</p>
            </>
          }
        >
          <Board>
            <Line.Segment point1={[0, 0]} point2={[v[0], 0]} color={C.i} style="dashed" />
            <Line.Segment point1={[v[0], 0]} point2={v} color={C.j} style="dashed" />
            {tl.t > 0 && (
              <>
                <Line.Segment point1={[0, 0]} point2={tl.t <= 1 ? walker : [v[0], 0]} color={C.i} weight={5} />
                {tl.t > 1 && <Line.Segment point1={[v[0], 0]} point2={walker} color={C.j} weight={5} />}
                <Point x={walker[0]} y={walker[1]} color="#fff" />
              </>
            )}
            <Arrow tip={v} color={C.v} label="v" />
            {p.element}
          </Board>
          <Controls tl={tl} steps={["x qadam o'ngga", "y qadam yuqoriga"]} />
        </Figure>
      </Sec>

      <Sec title="Vektorni ko'chirsak ham — o'sha vektor">
        <p>
          Vektor uchun faqat <b>yo'nalish va uzunlik</b> muhim, qayerdan boshlanishi emas. Pushti nuqta — boshqa boshlang'ich nuqta.
          Uni qayerga qo'ymang, strelka bir xil: "{v[0]} o'ngga, {v[1]} yuqoriga". Odatda vektorni koordinatalar boshidan chizamiz —
          shunda uning uchi aynan <Tex>{"(x, y)"}</Tex> nuqtaga tushadi.
        </p>
        <Board>
          <Arrow tip={v} color={C.v} opacity={0.35} label="v" />
          <Arrow tail={tail} tip={add(tail, v)} color={C.w} label="v (ko'chirilgan)" />
          {tailP.element}
        </Board>
        <Key>
          Asosiy fikr: <b>vektor = sonlar ro'yxati = strelka</b>. Kursning qolgan qismi shu ikki ko'rinish orasida "tarjima" qilishdan iborat:
          algebrani (sonlar) geometriyada (strelkalar) ko'rish va aksincha.
        </Key>
      </Sec>
    </LessonShell>
  );
}

/* =================================================================== */
/* 2. AMALLAR                                                          */
/* =================================================================== */
export function AmallarLesson() {
  const pa = useMovablePoint([3, 1], { color: C.v, constrain: snap(1) });
  const pb = useMovablePoint([1, 2], { color: C.w, constrain: snap(1) });
  const a: V = [pa.x, pa.y];
  const b: V = [pb.x, pb.y];
  const s = add(a, b);
  const tl = useTimeline(2, 1.3);
  const bTail = lerpV([0, 0], a, smooth(tl.t));
  const resTip = lerpV([0, 0], s, smooth(tl.t - 1));

  const pv = useMovablePoint([2, 1], { color: C.v, constrain: snap(1) });
  const v: V = [pv.x, pv.y];
  const [k, setK] = useState(2);
  const kv = scale(v, k);

  return (
    <LessonShell
      id="amallar"
      quiz={[
        {
          q: <><Tex>{"(1,2) + (3,-1)"}</Tex> = ?</>,
          options: [<Tex>{"(4,\\ 1)"}</Tex>, <Tex>{"(3,\\ -2)"}</Tex>, <Tex>{"(2,\\ 3)"}</Tex>],
          correct: 0,
          explain: "Koordinatalar alohida qo'shiladi: 1+3 = 4, 2+(−1) = 1. Geometrik: avval (1,2), keyin (3,−1) yurish.",
        },
        {
          q: <>Vektorni <Tex>{"-1"}</Tex> ga ko'paytirsak nima bo'ladi?</>,
          options: ["Uzunligi nolga teng bo'ladi", "Yo'nalishi teskarisiga o'zgaradi, uzunligi o'zgarmaydi", "90° ga buriladi"],
          correct: 1,
          explain: "Manfiy son vektorni teskari tomonga 'aylantiradi', |−1| = 1 bo'lgani uchun uzunlik saqlanadi.",
        },
      ]}
    >
      <Sec title="Qo'shish — ikki harakatni ketma-ket bajarish">
        <p>
          <Tex>{"\\vec a + \\vec b"}</Tex> degani: avval <b style={{ color: C.v }}>a</b> bo'yicha yur, keyin u yerdan{" "}
          <b style={{ color: C.w }}>b</b> bo'yicha yur. Qayerga yetib kelding — o'sha yig'indi. ▶ ni bosing: b vektor a ning uchiga
          ko'chadi, keyin natija <b style={{ color: C.res }}>ko'k</b> strelka bo'lib chiziladi.
        </p>
        <Figure
          side={
            <>
              <Tex block>{`\\begin{bmatrix} ${a[0]} \\\\ ${a[1]} \\end{bmatrix} + \\begin{bmatrix} ${b[0]} \\\\ ${b[1]} \\end{bmatrix} = \\begin{bmatrix} ${s[0]} \\\\ ${s[1]} \\end{bmatrix}`}</Tex>
              <p>Algebrada — koordinatalar alohida qo'shiladi. Geometriyada — "uchiga ulash" qoidasi.</p>
              <p className="muted small">Ikki yo'l (avval a, keyin b yoki aksincha) bir nuqtaga olib keladi — shuning uchun a+b = b+a. Parallelogramm hosil bo'ladi.</p>
            </>
          }
        >
          <Board>
            {tl.t >= 2 && (
              <>
                <Arrow tail={b} tip={s} color={C.v} opacity={0.3} style="dashed" />
                <Arrow tip={b} color={C.w} opacity={0.3} style="dashed" />
              </>
            )}
            <Arrow tip={a} color={C.v} label="a" />
            <Arrow tail={bTail} tip={add(bTail, b)} color={C.w} label={tl.t > 0.2 ? "b" : undefined} />
            {tl.t > 1 && <Arrow tip={resTip} color={C.res} label={tl.t > 1.9 ? "a + b" : undefined} weight={4} />}
            {pa.element}
            {tl.t === 0 && pb.element}
          </Board>
          <Controls tl={tl} steps={["b ni a ning uchiga ko'chirish", "boshdan oxirgacha — yig'indi"]} />
        </Figure>
        <p className="muted small">Pushti nuqtani sudrash uchun animatsiyani boshiga qaytaring (slayderni chapga).</p>
      </Sec>

      <Sec title="Songa ko'paytirish — cho'zish va qisish">
        <p>
          <Tex>{"k\\cdot\\vec v"}</Tex> — vektorni <b>k marta</b> cho'zish. Son (skalyar) vektorning yo'nalishini o'zgartirmaydi —
          faqat masshtabini (inglizcha <i>scale</i>, shuning uchun "skalyar"). Slayderni suring:
        </p>
        <ul className="compact">
          <li><Tex>{"k > 1"}</Tex> — cho'ziladi, <Tex>{"0 < k < 1"}</Tex> — qisqaradi</li>
          <li><Tex>{"k < 0"}</Tex> — teskari tomonga o'giriladi, <Tex>{"k = 0"}</Tex> — nol vektor</li>
        </ul>
        <Figure
          side={
            <>
              <Slider label={<Tex>k</Tex>} value={k} onChange={setK} min={-2} max={2.5} step={0.1} color={C.res} />
              <Tex block>{`${fmt(k)}\\cdot\\begin{bmatrix} ${v[0]} \\\\ ${v[1]} \\end{bmatrix} = \\begin{bmatrix} ${fmt(kv[0])} \\\\ ${fmt(kv[1])} \\end{bmatrix}`}</Tex>
              <p className="muted small">Hamma k·v vektorlar bitta to'g'ri chiziqda yotadi (punktir). Bu kuzatuv keyingi darsda "qobiq" tushunchasiga aylanadi.</p>
            </>
          }
        >
          <Board>
            <Line.ThroughPoints point1={[0, 0]} point2={v[0] || v[1] ? v : [1, 0]} color={C.muted} style="dashed" opacity={0.6} />
            <Arrow tip={kv} color={C.res} weight={5} label="k·v" />
            <Arrow tip={v} color={C.v} label="v" />
            {pv.element}
          </Board>
        </Figure>
        <Key>
          Bu ikki amal — qo'shish va songa ko'paytirish — <b>chiziqli algebraning butun "alifbosi"</b>. Keyingi barcha tushunchalar
          (kombinatsiya, matritsa, sistema) faqat shu ikki amaldan quriladi.
        </Key>
      </Sec>
    </LessonShell>
  );
}

/* =================================================================== */
/* 3. KOMBINATSIYA, QOBIQ, BAZIS                                       */
/* =================================================================== */

// Qobiqni chizish uchun oldindan tayyorlangan tasodifiy (α, β) juftlari
const SPAN_SAMPLES: V[] = (() => {
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 6 - 3;
  return Array.from({ length: 500 }, () => [rnd(), rnd()] as V);
})();

export function KombinatsiyaLesson() {
  const pv = useMovablePoint([2, 1], { color: C.v, constrain: snap(0.5) });
  const pw = useMovablePoint([-1, 1.5], { color: C.w, constrain: snap(0.5) });
  const v: V = [pv.x, pv.y];
  const w: V = [pw.x, pw.y];
  const [al, setAl] = useState(1.5);
  const [be, setBe] = useState(1);
  const av = scale(v, al);
  const res = add(av, scale(w, be));
  const spanTl = useTimeline(1, 3);
  const shown = Math.floor(spanTl.t * SPAN_SAMPLES.length);
  const dependent = Math.abs(cross(v, w)) < 1e-6;

  // Bazis bo'limi
  const pp = useMovablePoint([3, 2], { color: C.res, constrain: snap(0.5) });
  const p: V = [pp.x, pp.y];
  const [useCustom, setUseCustom] = useState(false);
  const b1: V = useCustom ? [1, 0.5] : [1, 0];
  const b2: V = useCustom ? [-0.5, 1] : [0, 1];
  const d = cross(b1, b2);
  const cx = cross(p, b2) / d;
  const cy = cross(b1, p) / d;
  const bTl = useTimeline(2, 1.2);
  const step1 = scale(b1, cx * smooth(bTl.t));
  const step2 = add(scale(b1, cx * smooth(Math.min(1, bTl.t))), scale(b2, cy * smooth(bTl.t - 1)));

  return (
    <LessonShell
      id="kombinatsiya"
      quiz={[
        {
          q: "Ikki nolmas vektor bitta to'g'ri chiziqda yotsa, ularning qobig'i (span) nima?",
          options: ["Butun tekislik", "O'sha to'g'ri chiziq", "Faqat nol nuqta"],
          correct: 1,
          explain: "Ikkalasi ham bitta chiziqda bo'lsa, ularni qanday cho'zib qo'shmang — o'sha chiziqdan chiqib bo'lmaydi.",
        },
        {
          q: <>Standart bazisda <Tex>{"(3, 2) = 3\\hat\\imath + 2\\hat\\jmath"}</Tex>. Unda 3 va 2 sonlari nima?</>,
          options: ["Vektorning uzunligi", "Bazis vektorlari oldidagi koeffitsiyentlar", "Burchaklar"],
          correct: 1,
          explain: "Koordinatalar — bu bazis vektorlarini qancha cho'zib qo'shish kerakligi. Boshqa bazisda koordinatalar boshqa bo'ladi.",
        },
      ]}
    >
      <Sec title="Chiziqli kombinatsiya — vektorlardan yangi vektor yasash">
        <p>
          Ikki vektor <b style={{ color: C.v }}>v</b> va <b style={{ color: C.w }}>w</b> berilgan. Ularni istalgan sonlarga
          cho'zib qo'shamiz:
        </p>
        <Tex block>{"\\alpha\\,\\vec v + \\beta\\,\\vec w"}</Tex>
        <p>Bu ifoda <b>chiziqli kombinatsiya</b> deyiladi. α va β slayderlarini suring — ko'k natija qayerlarga yeta olishini kuzating.</p>
        <Figure
          side={
            <>
              <Slider label={<Tex>\alpha</Tex>} value={al} onChange={setAl} color={C.v} />
              <Slider label={<Tex>\beta</Tex>} value={be} onChange={setBe} color={C.w} />
              <Tex block>{`${fmt(al)}\\begin{bmatrix} ${v[0]} \\\\ ${v[1]} \\end{bmatrix} ${term(be)}\\begin{bmatrix} ${w[0]} \\\\ ${w[1]} \\end{bmatrix} = \\begin{bmatrix} ${fmt(res[0])} \\\\ ${fmt(res[1])} \\end{bmatrix}`}</Tex>
              <div className="toggle">
                <button className="btn small" onClick={spanTl.playing ? spanTl.pause : spanTl.play}>
                  {spanTl.playing ? "❚❚ To'xtatish" : spanTl.t >= 1 ? "↻ Qayta chizish" : spanTl.t > 0 ? "▶ Davom ettirish" : "▶ Qobiqni chizish"}
                </button>
                {spanTl.t > 0 && !spanTl.playing && (
                  <button className="btn small ghost" onClick={() => spanTl.setT(0)}>Tozalash</button>
                )}
              </div>
              <p className="muted small">
                Tugma yuzlab tasodifiy α, β uchun natijani nuqta qilib qo'yadi. Bu nuqtalar to'plami — <b>qobiq</b> (span).
                {dependent ? " Hozir v va w bir chiziqda — qobiq faqat chiziq!" : " Hozir v va w har xil yo'nalishda — qobiq butun tekislik."}
              </p>
            </>
          }
        >
          <Board>
            {SPAN_SAMPLES.slice(0, shown).map(([a, b], i) => {
              const q = add(scale(v, a), scale(w, b));
              return <Point key={i} x={q[0]} y={q[1]} color={C.res} opacity={0.5} svgCircleProps={{ r: 2.5 }} />;
            })}
            <Arrow tip={av} color={C.v} opacity={0.6} weight={2} />
            <Arrow tail={av} tip={res} color={C.w} opacity={0.6} weight={2} />
            <Arrow tip={res} color={C.res} weight={4} label="αv + βw" />
            <Arrow tip={v} color={C.v} label="v" />
            <Arrow tip={w} color={C.w} label="w" />
            {pv.element}
            {pw.element}
          </Board>
        </Figure>
        <Recall to="amallar">
          Kombinatsiyada yangi narsa yo'q: <Tex>{"\\alpha\\vec v"}</Tex> — cho'zish, keyin "uchiga ulab" qo'shish. Rasmdagi ikki ingichka
          strelka aynan shu ikki qadam.
        </Recall>
      </Sec>

      <Sec title="Bazis: koordinatalar aslida nima?">
        <p>
          Koordinatalar <Tex>{"(3, 2)"}</Tex> aslida qisqa yozuv: <Tex>{"3\\hat\\imath + 2\\hat\\jmath"}</Tex>, bu yerda{" "}
          <b style={{ color: C.i }}>î = (1,0)</b> va <b style={{ color: C.j }}>ĵ = (0,1)</b>. Ya'ni har qanday vektor — bazis vektorlarining
          chiziqli kombinatsiyasi, koordinatalar esa <b>koeffitsiyentlar</b>.
        </p>
        <p>
          Lekin bazisni boshqacha ham tanlash mumkin! Tugmani bosing: to'r boshqa ikki vektorga moslanadi va xuddi o'sha ko'k nuqta
          endi <b>boshqa sonlar</b> bilan ifodalanadi.
        </p>
        <Figure
          side={
            <>
              <div className="toggle">
                <button className={"chip" + (!useCustom ? " on" : "")} onClick={() => { setUseCustom(false); bTl.setT(0); }}>Standart bazis î, ĵ</button>
                <button className={"chip" + (useCustom ? " on" : "")} onClick={() => { setUseCustom(true); bTl.setT(0); }}>Boshqa bazis</button>
              </div>
              <Tex block>{`\\vec p = ${fmt(cx)}\\,\\vec b_1 ${term(cy)}\\,\\vec b_2`}</Tex>
              <p>Bazisda koordinatalar: <b>({fmt(cx)}, {fmt(cy)})</b></p>
              <p className="muted small">
                Bazis — tekislikni "o'lchash" uchun tanlangan ikki chizg'ich. Shart: ular bir chiziqda yotmasligi kerak (aks holda
                qobiq butun tekislik bo'lmaydi). Bu shartning nomi — <b>chiziqli erklilik</b>, keyingi dars.
              </p>
            </>
          }
        >
          <Board faint={useCustom}>
            {useCustom && <TransformedGrid A={fromCols(b1, b2)} color={C.orange} opacity={0.35} />}
            <Arrow tip={step1} color={C.i} weight={2} opacity={bTl.t > 0 ? 0.9 : 0} />
            <Arrow tail={scale(b1, cx * smooth(Math.min(1, bTl.t)))} tip={step2} color={C.j} weight={2} opacity={bTl.t > 1 ? 0.9 : 0} />
            <Arrow tip={b1} color={C.i} label="b₁" weight={4} />
            <Arrow tip={b2} color={C.j} label="b₂" weight={4} />
            <Arrow tip={p} color={C.res} label="p" opacity={0.8} />
            {pp.element}
          </Board>
          <Controls tl={bTl} steps={[`b₁ ni ${fmt(cx)} marta cho'zish`, `b₂ ni ${fmt(cy)} marta qo'shish`]} />
        </Figure>
        <Key>
          <b>Qobiq (span)</b> — berilgan vektorlarning barcha kombinatsiyalari. <b>Bazis</b> — qobig'i butun fazo bo'lgan va "ortiqcha"
          vektori yo'q to'plam. Bu g'oya keyin markaziy bo'ladi: matritsa aslida bazis vektorlarini boshqa joyga ko'chiradi.
        </Key>
      </Sec>
    </LessonShell>
  );
}

/* =================================================================== */
/* 4. CHIZIQLI BOG'LIQLIK                                              */
/* =================================================================== */
export function BoglikLesson() {
  const pv = useMovablePoint([2, 1], { color: C.v, constrain: snap(0.5) });
  const pw = useMovablePoint([1, 2], { color: C.w, constrain: snap(0.5) });
  const v: V = [pv.x, pv.y];
  const w: V = [pw.x, pw.y];
  const cr = cross(v, w);
  const dep = Math.abs(cr) < 1e-6;

  // uchta vektor
  // u = 1.5·v + 1·w — butun/yarim koeffitsiyentlar, hisobni kuzatish oson
  const qv = useMovablePoint([2, 1], { color: C.v, constrain: snap(0.5) });
  const qw = useMovablePoint([-1, 1.5], { color: C.w, constrain: snap(0.5) });
  const qu = useMovablePoint([2, 3], { color: C.u, constrain: snap(0.5) });
  const v3: V = [qv.x, qv.y], w3: V = [qw.x, qw.y], u3: V = [qu.x, qu.y];
  const d3 = cross(v3, w3);
  const al = d3 ? cross(u3, w3) / d3 : 0;
  const be = d3 ? cross(v3, u3) / d3 : 0;
  const tl = useTimeline(3, 1.2);
  const A1 = scale(v3, al * smooth(tl.t));
  const A2 = add(scale(v3, al), scale(w3, be * smooth(tl.t - 1)));
  const back = lerpV(add(scale(v3, al), scale(w3, be)), [0, 0], smooth(tl.t - 2));

  return (
    <LessonShell
      id="boglik"
      quiz={[
        {
          q: "Tekislikda (2 o'lchovda) uchta vektor har doim…",
          options: ["chiziqli erkli", "chiziqli bog'liq", "perpendikulyar"],
          correct: 1,
          explain: "Ikki erkli vektor allaqachon butun tekislikni qoplaydi, uchinchisi albatta ularning kombinatsiyasi bo'ladi.",
        },
        {
          q: <><Tex>{"(1,2)"}</Tex> va <Tex>{"(2,4)"}</Tex> vektorlari…</>,
          options: ["erkli", "bog'liq: (2,4) = 2·(1,2)", "perpendikulyar"],
          correct: 1,
          explain: "Biri ikkinchisining 2 baravari — bir chiziqda yotadi.",
        },
      ]}
    >
      <Sec title="Ortiqcha vektor qobiqni kengaytirmaydi">
        <p>
          Oldingi darsda ko'rdik: ikki vektor bir chiziqda yotsa, qobiq faqat chiziq bo'lib qoladi. Bu holatda{" "}
          <b style={{ color: C.w }}>w</b> hech qanday yangi yo'nalish qo'shmaydi — u <b>ortiqcha</b>, chunki{" "}
          <Tex>{"\\vec w = k\\vec v"}</Tex>. Bunday vektorlar <b>chiziqli bog'liq</b> deyiladi.
        </p>
        <Figure
          side={
            <>
              <div className={"status " + (dep ? "bad" : "good")}>
                {dep ? "Chiziqli BOG'LIQ — qobiq: chiziq" : "Chiziqli ERKLI — qobiq: butun tekislik"}
              </div>
              <p>
                Tekshiruv: <Tex>{`v_1w_2 - v_2w_1 = ${pf(v[0])}\\cdot${pf(w[1])} - ${pf(v[1])}\\cdot${pf(w[0])} = ${fmt(cr)}`}</Tex>
              </p>
              <p className="muted small">
                Bu son nolga teng ⇔ vektorlar bir chiziqda. U aslida <b>determinant</b> — v va w dan yasalgan parallelogramm yuzasi
                (sariq soha). Yuza 0 — demak yassi. Bu bog'lanishni "Determinant" darsida chuqurroq ko'ramiz.
              </p>
              <button className="btn small" onClick={() => {
                const k = dot(w, v) / (dot(v, v) || 1);
                pw.setPoint(snap(0.5)(scale(v, Math.round(k * 2) / 2 || 1)));
              }}>w ni v chizig'iga qo'yish</button>
            </>
          }
        >
          <Board>
            {dep ? (
              <Line.ThroughPoints point1={[0, 0]} point2={v[0] || v[1] ? v : [1, 0]} color={C.res} weight={6} opacity={0.4} />
            ) : (
              <Polygon points={[[-9, -9], [9, -9], [9, 9], [-9, 9]]} color={C.res} fillOpacity={0.08} weight={0} />
            )}
            <Polygon points={[[0, 0], v, add(v, w), w]} color={C.v} fillOpacity={0.18} weight={1} />
            <Arrow tip={v} color={C.v} label="v" />
            <Arrow tip={w} color={C.w} label="w" />
            {pv.element}
            {pw.element}
          </Board>
        </Figure>
      </Sec>

      <Sec title="Uch vektor: biri albatta ortiqcha">
        <p>
          Tekislikda uchta vektor oling. <b style={{ color: C.v }}>v</b> va <b style={{ color: C.w }}>w</b> erkli bo'lsa, ularning
          qobig'i allaqachon butun tekislik — demak <b style={{ color: C.u }}>u</b> ham ularning kombinatsiyasi. ▶ ni bosing:
        </p>
        <Figure
          side={
            <>
              <Tex block>{`\\vec u = ${lin([[al, "\\vec v"], [be, "\\vec w"]])}`}</Tex>
              <p>Uchinchi qadamda u ni ayiramiz va <b>boshga qaytamiz</b>:</p>
              <Tex block>{`${lin([[al, "\\vec v"], [be, "\\vec w"], [-1, "\\vec u"]])} = \\vec 0`}</Tex>
              <p className="muted small">
                Mana rasmiy ta'rif: vektorlar <b>bog'liq</b>, agar koeffitsiyentlari hammasi nol bo'lmagan kombinatsiya nol vektorni
                bersa (yopiq yo'l). <b>Erkli</b> — faqat <Tex>{"0\\vec v + 0\\vec w = \\vec 0"}</Tex> bo'lsa.
              </p>
            </>
          }
        >
          <Board>
            <Arrow tip={v3} color={C.v} label="v" />
            <Arrow tip={w3} color={C.w} label="w" />
            {tl.t >= 3 && <Polygon points={[[0, 0], scale(v3, al), u3]} color={C.u} fillOpacity={0.15} weight={0} />}
            <Arrow tip={u3} color={C.u} label="u" opacity={tl.t > 2 ? 0.25 : 1} />
            {tl.t > 0 && <Arrow tip={A1} color={C.v} weight={5} opacity={0.7} />}
            {tl.t > 1 && <Arrow tail={scale(v3, al)} tip={A2} color={C.w} weight={5} opacity={0.7} />}
            {tl.t > 2 && <Arrow tail={u3} tip={back} color={C.u} weight={5} label={tl.t >= 3 ? "−u" : undefined} />}
            {tl.t === 0 && <>{qv.element}{qw.element}{qu.element}</>}
          </Board>
          <Controls tl={tl} steps={[`${fmt(al)}·v`, `${term(be)}·w — u ga yetdik`, "− u: boshga qaytish"]} />
        </Figure>
        <Key>
          <b>Erkli</b> vektorlar — har biri yangi yo'nalish qo'shadi. <b>Bog'liq</b> — kamida bittasi ortiqcha. Tekislikda ko'pi bilan 2
          ta erkli vektor bo'ladi; shuning uchun tekislik <b>2 o'lchovli</b>. Bu son keyinchalik <b>rang</b> tushunchasiga aylanadi.
        </Key>
      </Sec>
    </LessonShell>
  );
}

/* =================================================================== */
/* 5. SKALYAR KO'PAYTMA                                                */
/* =================================================================== */
export function SkalyarLesson() {
  const pa = useMovablePoint([3, 1], { color: C.v, constrain: snap(0.5) });
  const pb = useMovablePoint([1.5, 2.5], { color: C.w, constrain: snap(0.5) });
  const a: V = [pa.x, pa.y];
  const b: V = [pb.x, pb.y];
  const d = dot(a, b);
  const la = len(a) || 1;
  const proj = scale(a, d / (la * la));
  const tl = useTimeline(2, 1.2);
  const drop = lerpV(b, proj, smooth(tl.t));
  const ang = Math.acos(Math.max(-1, Math.min(1, d / (la * (len(b) || 1))))) * 180 / Math.PI;
  const sign = Math.abs(d) < 1e-6 ? "zero" : d > 0 ? "pos" : "neg";
  const angA = Math.atan2(a[1], a[0]);
  const angB = Math.atan2(b[1], b[0]);

  const arc = useMemo(() => {
    let from = angA, to = angB;
    let diff = to - from;
    while (diff > Math.PI) diff -= 2 * Math.PI;
    while (diff < -Math.PI) diff += 2 * Math.PI;
    return Array.from({ length: 21 }, (_, i) => {
      const t = from + (diff * i) / 20;
      return [0.8 * Math.cos(t), 0.8 * Math.sin(t)] as V;
    });
  }, [angA, angB]);

  return (
    <LessonShell
      id="skalyar"
      quiz={[
        {
          q: <><Tex>{"(1,2)\\cdot(3,-1)"}</Tex> = ?</>,
          options: ["1", "5", "−1"],
          correct: 0,
          explain: "1·3 + 2·(−1) = 3 − 2 = 1. Musbat — burchak o'tkir.",
        },
        {
          q: <><Tex>{"\\vec a\\cdot\\vec b = 0"}</Tex> (ikkalasi nolmas) bo'lsa…</>,
          options: ["a va b parallel", "a va b perpendikulyar", "a = b"],
          correct: 1,
          explain: "Proyeksiya nolga teng — b ning a yo'nalishida hech qanday 'soyasi' yo'q, ya'ni 90°.",
        },
      ]}
    >
      <Sec title="Soyaning uzunligi">
        <p>
          <b style={{ color: C.w }}>b</b> vektorini <b style={{ color: C.v }}>a</b> chizig'iga "yorug'lik tushirib" proyeksiyalaymiz —
          ▶ ni bosing. Skalyar ko'paytma — shu <b>soya uzunligi</b> × <b>a ning uzunligi</b>:
        </p>
        <Tex block>{"\\vec a\\cdot\\vec b = |\\vec a|\\,|\\vec b|\\cos\\theta = a_1b_1 + a_2b_2"}</Tex>
        <Figure
          side={
            <>
              <Tex block>{`${pf(a[0])}\\cdot${pf(b[0])} + ${pf(a[1])}\\cdot${pf(b[1])} = ${fmt(d)}`}</Tex>
              <Tex block>{`|\\vec a|\\cdot\\text{soya} = ${fmt(la)}\\cdot${pf(d / la)} \\approx ${fmt(d)}`}</Tex>
              <p>θ ≈ <b>{fmt(ang, 0)}°</b></p>
              <div className={"status " + (sign === "pos" ? "good" : sign === "neg" ? "bad" : "neutral")}>
                {sign === "pos" && "Musbat: burchak o'tkir, soya a tomonda"}
                {sign === "neg" && "Manfiy: burchak o'tmas, soya teskari tomonda"}
                {sign === "zero" && "Nol: vektorlar perpendikulyar (ortogonal)"}
              </div>
              <p className="muted small">
                Ikki formula bir xil son beradi: biri geometrik (burchak orqali), ikkinchisi algebraik (koordinatalar orqali). Bu
                ikkalasining tengligi — "sonlar ↔ strelkalar" tarjimasining yana bir misoli.
              </p>
            </>
          }
        >
          <Board>
            <Line.ThroughPoints point1={[0, 0]} point2={a[0] || a[1] ? a : [1, 0]} color={C.muted} style="dashed" opacity={0.5} />
            {tl.t > 0 && <Line.Segment point1={b} point2={drop} color="#fff" style="dashed" opacity={0.7} />}
            <Polygon points={[[0, 0], ...arc]} color="#fff" fillOpacity={0.15} weight={1} />
            <Arrow tip={a} color={C.v} label="a" />
            <Arrow tip={b} color={C.w} label="b" />
            {/* Soya — darsning asosiy obyekti: eng ustki qatlamda, qalin */}
            {tl.t > 0.95 && (
              <>
                <Line.Segment point1={[0, 0]} point2={proj} color={sign === "neg" ? C.orange : C.res} weight={10} opacity={0.75} />
                <Text x={proj[0] / 2} y={proj[1] / 2} attach={proj[0] * proj[1] >= 0 ? "se" : "sw"} attachDistance={14} color={sign === "neg" ? C.orange : C.res} size={15}>
                  soya = {fmt((sign === "neg" ? -1 : 1) * len(proj))}
                </Text>
              </>
            )}
            {pa.element}
            {pb.element}
          </Board>
          <Controls tl={tl} steps={["Perpendikulyar tushirish", "Soya"]} />
        </Figure>
        <Key>
          Skalyar ko'paytma "ikki vektor qanchalik bir tomonga qaragan"ini o'lchaydi. U uzunlikni ham beradi:{" "}
          <Tex>{"|\\vec a| = \\sqrt{\\vec a\\cdot\\vec a}"}</Tex>. Matritsa ko'paytirishda har bir element aslida "qator · ustun"
          skalyar ko'paytmasi — keyingi bo'limda shu ko'rinadi.
        </Key>
      </Sec>
    </LessonShell>
  );
}

// eslint
void Circle; void sub; void clamp01;
