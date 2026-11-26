import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { PREP, prepBySlug, prepByN } from "../prep";
import { genToMCQ, Practice, rich, shuffle, StepReveal, TestItem, TestList, type MCQ } from "../prep/core";
import { Tex } from "../components/Tex";
import { dueIds, record, resetReview, topicStats, useReview } from "../lib/review";
import { byId } from "../data/topics";

/* ================================================================== */
/* Bosh sahifa: /oraliq                                                */
/* ================================================================== */

export function PrepHub() {
  const store = useReview();
  const due = dueIds(store);
  return (
    <div className="page prep-hub">
      <header className="prep-hero">
        <div className="eyebrow" style={{ ["--g" as string]: "#ffd166" }}><span className="dot" /> Amaliy matematika 1 · 1–6-mavzular</div>
        <h1>Oraliqqa tayyorgarlik</h1>
        <p className="lead">
          Har bir mavzu: <b>1 daqiqada mohiyat → nimaga kerak → qadam-baqadam yechim → xatolar → cheksiz mashq → test</b>.
          Formulani yodlash emas — misolni o'zingiz yechib, xatoingizni darhol ko'rasiz.
        </p>
        <div className="hero-actions">
          <Link className="btn" to="/oraliq/sinov">Sinov imtihoni (20 savol) →</Link>
          {due.length > 0 && <Link className="btn ghost" to="/oraliq/sinov?takror=1">Xatolar ustida ishlash ({due.length})</Link>}
        </div>
      </header>

      <section className="plan">
        <h2>Bir kechada tayyorlanish rejasi</h2>
        <ol className="plan-list">
          <li><b>Har bir mavzuda</b> "1 daqiqada" va "Qanday hisoblanadi" bo'limini o'qing (≈5 daqiqa).</li>
          <li><b>Mashq</b>: har bir turdan 2 ta misolni o'zingiz yeching. Xato bo'lsa — yechimni o'qing va yana bittasini yeching.</li>
          <li><b>Test</b>: mavzu oxiridagi 10 ta savol.</li>
          <li>Hammasidan keyin <b>sinov imtihoni</b>. Xato qilgan savollaringiz "Xatolar ustida ishlash"ga tushadi — ertalab ularni takrorlang.</li>
          <li>Kirishdan oldin <b>formula kartalarini</b> bir ko'rib chiqing.</li>
        </ol>
      </section>

      <div className="prep-grid">
        {PREP.map((t) => {
          const s = topicStats(store, `t${t.n}:`);
          return (
            <Link key={t.n} to={`/oraliq/${t.slug}`} className="prep-card">
              <div className="prep-n">{t.n}</div>
              <div>
                <h3>{t.title}</h3>
                <p>{t.short}</p>
                <div className="prep-meter">
                  {s.pct === null ? <span className="muted small">hali boshlanmagan</span> : (
                    <>
                      <div className="bar"><div style={{ width: `${s.pct}%`, background: s.pct >= 80 ? "var(--good)" : s.pct >= 50 ? "#ffd166" : "var(--bad)" }} /></div>
                      <span className="small">{s.pct}% to'g'ri · {s.ok + s.bad} urinish{s.weak ? ` · ${s.weak} zaif joy` : ""}</span>
                    </>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <section style={{ marginTop: 36 }}>
        <h2>Umumiy belgilar</h2>
        <p className="muted small">Hamma mavzularda uchraydi. Har bir mavzu sahifasida o'sha mavzuning o'z belgilari ham tushuntirilgan.</p>
        <SymbolTable title="" rows={COMMON_SYMBOLS} />
      </section>

      <section className="cheat-all">
        <h2>Hamma formulalar — bitta varaqda</h2>
        <p className="muted small">Imtihondan oldin 3 daqiqada ko'z yugurtirish uchun. <button className="linklike" onClick={() => window.print()}>Chop etish</button></p>
        {PREP.map((t) => (
          <div key={t.n} className="cheat-block">
            <h3>{t.n}. {t.title}</h3>
            <div className="cheat-grid">
              {t.cheat.map((c, i) => (
                <div key={i} className="cheat-card"><div className="cheat-t">{c.t}</div><div>{c.f}</div></div>
              ))}
            </div>
          </div>
        ))}
      </section>
      {Object.keys(store).length > 0 && (
        <p className="muted small" style={{ marginTop: 30 }}>
          Natijalar faqat shu brauzerda saqlanadi. <button className="linklike" onClick={() => { if (confirm("Barcha natijalar o'chiriladi. Davom etasizmi?")) resetReview(); }}>Natijalarni tozalash</button>
        </p>
      )}
    </div>
  );
}

/* ================================================================== */
/* Belgilar jadvali                                                    */
/* ================================================================== */

/** Butun kurs bo'yicha uchraydigan umumiy belgilar */
const COMMON_SYMBOLS: { s: string; read: string; mean: ReactNode }[] = [
  { s: "\\Rightarrow", read: "kelib chiqadi", mean: "Chapdagidan o'ngdagi kelib chiqadi (\"demak\")." },
  { s: "\\Leftrightarrow", read: "teng kuchli", mean: "Ikkala tomon bir vaqtda to'g'ri yoki bir vaqtda noto'g'ri (\"faqat va faqat shunda\")." },
  { s: "\\neq", read: "teng emas", mean: "Masalan, Δ ≠ 0 — delta noldan farqli." },
  { s: "a_{ij}", read: "a i j", mean: "Jadvaldagi element: i — satr raqami, j — ustun raqami. a₂₃ — 2-satr, 3-ustun." },
  { s: "x_1,\\ x_2", read: "x bir, x ikki", mean: "Pastki raqam — nechanchi noma'lum ekanini bildiradi (daraja emas!)." },
  { s: "x^2", read: "x kvadrat", mean: "Yuqoridagi raqam — daraja." },
  { s: "\\sum", read: "sigma, yig'indi", mean: "Ketma-ket hadlarni qo'shish: ∑ aᵢ = a₁ + a₂ + …" },
  { s: "\\cdot", read: "ko'paytirish", mean: "Ko'paytirish belgisi (× o'rniga)." },
  { s: "(x;\\ y)", read: "koordinatalar", mean: "Nuqta yoki vektor koordinatalari nuqtali vergul bilan ajratiladi." },
  { s: "\\vec a", read: "a vektor", mean: "Ustidagi strelka — bu vektor (son emas)." },
  { s: "|\\,\\cdot\\,|", read: "modul", mean: "Son uchun — absolyut qiymat (|−3| = 3); vektor uchun — uzunlik; matritsa uchun — determinant." },
];

function SymbolTable({ title, rows }: { title: string; rows: { s: string; read: string; mean: ReactNode }[] }) {
  if (!rows.length) return null;
  return (
    <div className="symtab">
      <div className="symtab-title">{title}</div>
      <table>
        <thead><tr><th>Belgi</th><th>O'qilishi</th><th>Ma'nosi</th></tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}><td className="sym"><Tex>{r.s}</Tex></td><td className="read">{r.read}</td><td>{rich(r.mean)}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ================================================================== */
/* Mavzu sahifasi: /oraliq/:slug                                       */
/* ================================================================== */

const SECTIONS = [
  ["mohiyat", "1 daqiqada"],
  ["kerak", "Nimaga kerak"],
  ["hisob", "Qanday hisoblanadi"],
  ["xato", "Xatolar"],
  ["mashq", "Mashq"],
  ["test", "Test"],
  ["formula", "Formulalar"],
] as const;

export function PrepTopicPage() {
  const { slug = "" } = useParams();
  const t = prepBySlug[slug];
  const [active, setActive] = useState("mohiyat");

  useEffect(() => {
    const obs = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: "-30% 0px -60% 0px" },
    );
    SECTIONS.forEach(([id]) => { const el = document.getElementById(id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, [slug]);

  if (!t) return <div className="page"><p>Mavzu topilmadi. <Link to="/oraliq">Orqaga</Link></p></div>;
  const prev = prepByN[t.n - 1], next = prepByN[t.n + 1];

  return (
    <div className="prep-layout">
      <nav className="prep-toc">
        <Link to="/oraliq" className="toc-back">← Barcha mavzular</Link>
        <div className="toc-title">{t.n}. {t.title}</div>
        {SECTIONS.map(([id, name], i) => (
          <a key={id} href={`#${id}`} className={active === id ? "on" : ""} onClick={(e) => { e.preventDefault(); document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }); }}>
            <span>{i + 1}</span>{name}
          </a>
        ))}
      </nav>

      <article className="prep-main">
        <header>
          <div className="eyebrow" style={{ ["--g" as string]: "#ffd166" }}><span className="dot" /> HEMIS · {t.n}-mavzu</div>
          <h1>{t.title}</h1>
        </header>

        <section id="mohiyat" className="psec">
          <h2><span className="pnum">1</span> 1 daqiqada</h2>
          <div className="minute">{t.minute}</div>
          {t.picture}
          <SymbolTable title="Bu mavzudagi belgilar" rows={t.symbols} />
        </section>

        <section id="kerak" className="psec">
          <h2><span className="pnum">2</span> Bu nimaga kerak?</h2>
          <div className="uses">
            {t.uses.map((u, i) => (
              <div key={i} className="use-card"><div className="use-ico">{u.icon}</div><div><b>{u.title}</b><p>{u.text}</p></div></div>
            ))}
          </div>
        </section>

        <section id="hisob" className="psec">
          <h2><span className="pnum">3</span> Qanday hisoblanadi</h2>
          <p className="muted small">Har bir qoidada avval qoidani o'qing, so'ng misolni "Keyingi qadam" bilan ochib boring. Keyingi qadamni ochishdan oldin uni o'zingiz taxmin qilib ko'ring.</p>
          {t.recipes.map((r, i) => (
            <div key={i} className="recipe">
              <h3>{String.fromCharCode(65 + i)}. {r.title}</h3>
              <div className="rule">{rich(r.rule)}</div>
              {r.formula && <div className="formula-box"><Tex block>{r.formula}</Tex></div>}
              {r.visual}
              <StepReveal steps={r.steps} />
            </div>
          ))}
        </section>

        <section id="xato" className="psec">
          <h2><span className="pnum">4</span> Ko'p qilinadigan xatolar</h2>
          <div className="mistakes">
            {t.mistakes.map((m, i) => (
              <div key={i} className="mistake"><div className="mw">✗ {m.wrong}</div><div className="mr">✓ {m.right}</div></div>
            ))}
          </div>
        </section>

        <section id="mashq" className="psec">
          <h2><span className="pnum">5</span> Mashq — cheksiz misollar</h2>
          <p className="muted small">Har safar yangi sonlar. Xato qilsangiz — qaysi xato ekanini aytadi va yechimni ko'rsatadi. Har turdan 2–3 tasini ketma-ket to'g'ri yeching.</p>
          <Practice topic={t.n} gens={t.gens} />
        </section>

        <section id="test" className="psec">
          <h2><span className="pnum">6</span> Test (imtihon uslubida)</h2>
          <TestList items={t.tests} />
        </section>

        <section id="formula" className="psec">
          <h2><span className="pnum">7</span> Formula kartasi</h2>
          <div className="cheat-grid">
            {t.cheat.map((c, i) => (
              <div key={i} className="cheat-card"><div className="cheat-t">{c.t}</div><div>{c.f}</div></div>
            ))}
          </div>
          {t.lessons.length > 0 && (
            <div className="deeper">
              <b>Chuqurroq tushunmoqchimisiz?</b> Interaktiv animatsiyali darslar (oraliqdan keyin o'qish tavsiya etiladi):{" "}
              {t.lessons.map((id) => <Link key={id} className="tag" to={`/dars/${id}`}>{byId[id]?.title ?? id}</Link>)}
            </div>
          )}
        </section>

        <footer className="lesson-foot">
          {prev ? <Link className="btn ghost" to={`/oraliq/${prev.slug}`}>← {prev.n}. {prev.title}</Link> : <span />}
          {next ? <Link className="btn" to={`/oraliq/${next.slug}`}>{next.n}. {next.title} →</Link> : <Link className="btn" to="/oraliq/sinov">Sinov imtihoni →</Link>}
        </footer>
      </article>
    </div>
  );
}

/* ================================================================== */
/* Sinov imtihoni: /oraliq/sinov                                       */
/* ================================================================== */

function buildExam(count: number, topics: number[], onlyIds?: string[]): MCQ[] {
  const pool: MCQ[] = [];
  for (const t of PREP.filter((x) => topics.includes(x.n))) {
    pool.push(...t.tests);
    for (const g of t.gens) {
      const m = genToMCQ(t.n, g);
      if (m) pool.push(m);
    }
  }
  if (onlyIds) {
    const set = new Set(onlyIds);
    const chosen = pool.filter((m) => set.has(m.id));
    return shuffle(chosen).slice(0, count);
  }
  // mavzular bo'yicha teng taqsimlash
  const per = Math.ceil(count / topics.length);
  const out: MCQ[] = [];
  for (const n of topics) out.push(...shuffle(pool.filter((m) => m.id.startsWith(`t${n}:`))).slice(0, per));
  return shuffle(out).slice(0, count);
}

export function MockExam() {
  const store = useReview();
  const [params] = useSearchParams();
  const takror = params.get("takror") === "1";
  const [cfg, setCfg] = useState<{ count: number; topics: number[]; review: boolean } | null>(null);
  const [round, setRound] = useState(0);
  const exam = useMemo(
    () => (cfg ? buildExam(cfg.count, cfg.topics, cfg.review ? dueIds(store) : undefined) : []),
    [cfg, round], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const [i, setI] = useState(0);
  const [picks, setPicks] = useState<(number | null)[]>([]);
  const answers = picks.map((p, k) => (p === null ? null : p === exam[k]?.correct));
  const [t0, setT0] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [sel, setSel] = useState<number[]>([1, 2, 3, 4, 5, 6]);

  useEffect(() => { setI(0); setPicks(exam.map(() => null)); setT0(Date.now()); }, [exam]);
  useEffect(() => {
    if (!cfg) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [cfg]);

  if (!cfg) {
    const due = dueIds(store);
    return (
      <div className="page">
        <Link to="/oraliq" className="toc-back">← Oraliqqa tayyorgarlik</Link>
        <h1>{takror ? "Xatolar ustida ishlash" : "Sinov imtihoni"}</h1>
        {takror ? (
          <>
            <p className="lead">Oldin xato qilgan yoki takrorlash vaqti kelgan savollar: <b>{due.length}</b> ta. Har birida yangi sonlar bo'ladi.</p>
            <button className="btn" disabled={!due.length} onClick={() => setCfg({ count: Math.min(due.length, 20), topics: [1, 2, 3, 4, 5, 6], review: true })}>Boshlash →</button>
          </>
        ) : (
          <>
            <p className="lead">Barcha mavzulardan aralash savollar — xuddi imtihondagidek A–E variantlar. Hisoblash savollarida variantlar orasida <b>ko'p uchraydigan xato javoblar</b> ham bor — ehtiyot bo'ling.</p>
            <div className="exam-cfg">
              <div className="small muted">Mavzular:</div>
              <div className="toggle">
                {PREP.map((t) => (
                  <button key={t.n} className={"chip" + (sel.includes(t.n) ? " on" : "")} onClick={() => setSel(sel.includes(t.n) ? sel.filter((x) => x !== t.n) : [...sel, t.n].sort())}>
                    {t.n}. {t.title}
                  </button>
                ))}
              </div>
              <div className="hero-actions">
                <button className="btn" disabled={!sel.length} onClick={() => setCfg({ count: 20, topics: sel, review: false })}>20 savol →</button>
                <button className="btn ghost" disabled={!sel.length} onClick={() => setCfg({ count: 10, topics: sel, review: false })}>10 savol (tezkor)</button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  const done = answers.length > 0 && answers.every((a) => a !== null);
  const ok = answers.filter((a) => a === true).length;
  const sec = Math.floor((now - t0) / 1000);
  const clock = `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;

  if (done) {
    const byTopic = PREP.map((t) => {
      const idx = exam.map((m, k) => (m.id.startsWith(`t${t.n}:`) ? k : -1)).filter((k) => k >= 0);
      return { t, n: idx.length, ok: idx.filter((k) => answers[k]).length };
    }).filter((x) => x.n > 0);
    const pct = Math.round((ok / exam.length) * 100);
    return (
      <div className="page">
        <h1>Natija: {ok} / {exam.length} ({pct}%)</h1>
        <p className="lead">{pct >= 86 ? "A'lo! Shu holatda imtihonga kiring." : pct >= 71 ? "Yaxshi. Zaif mavzularni yana bir bor mashq qiling." : pct >= 55 ? "Qoniqarli. Quyidagi zaif mavzularni qayta ko'ring." : "Hali tayyor emas — zaif mavzular bo'yicha mashq qiling va sinovni qaytaring."} Vaqt: {clock}.</p>
        <div className="exam-topics">
          {byTopic.map(({ t, n, ok: o }) => (
            <Link key={t.n} to={`/oraliq/${t.slug}#mashq`} className={"exam-topic " + (o / n >= 0.8 ? "good" : o / n >= 0.5 ? "mid" : "bad")}>
              <b>{t.n}. {t.title}</b><span>{o} / {n}</span>
            </Link>
          ))}
        </div>
        <div className="hero-actions">
          <button className="btn" onClick={() => setRound(round + 1)}>Yangi sinov (boshqa savollar)</button>
          <Link className="btn ghost" to="/oraliq/sinov?takror=1" onClick={() => { setCfg(null); setRound(round + 1); }}>Xatolar ustida ishlash</Link>
          <Link className="btn ghost" to="/oraliq">Mavzular</Link>
        </div>
        <h2 style={{ marginTop: 30 }}>Javoblarni ko'rib chiqish</h2>
        {exam.map((m, k) => (
          <details key={k} className={"review-item " + (answers[k] ? "ok" : "no")} open={!answers[k]}>
            <summary>{answers[k] ? "✓" : "✗"} {k + 1}-savol</summary>
            <div className="quiz-q">{rich(m.q)}</div>
            <div className="small">To'g'ri javob: <b>{"ABCDE"[m.correct]}) </b>{rich(m.options[m.correct])}</div>
            <div className="quiz-explain">{rich(m.explain)}</div>
          </details>
        ))}
      </div>
    );
  }

  if (!exam.length) return <div className="page"><p>Savollar topilmadi. <Link to="/oraliq">Orqaga</Link></p></div>;
  const m = exam[i];
  return (
    <div className="page exam">
      <div className="exam-head">
        <span>{i + 1} / {exam.length}</span>
        <div className="bar"><div style={{ width: `${(answers.filter((a) => a !== null).length / exam.length) * 100}%` }} /></div>
        <span className="mono">⏱ {clock}</span>
      </div>
      <TestItem key={m.id + i + round} m={m} n={i + 1} noRecord initial={picks[i]} onAnswer={(c, p) => { record(m.id, c); setPicks((a) => a.map((x, k) => (k === i ? p : x))); }} />
      <div className="hero-actions">
        {i > 0 && <button className="btn ghost" onClick={() => setI(i - 1)}>← Oldingi</button>}
        {answers[i] !== null && i < exam.length - 1 && <button className="btn" onClick={() => setI(i + 1)}>Keyingi →</button>}
      </div>
    </div>
  );
}
