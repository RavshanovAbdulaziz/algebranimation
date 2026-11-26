import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { byId, dependents, GROUPS, HEMIS_LECTURES, TOPICS } from "../data/topics";
import { toggleDone, useDone } from "../lib/progress";
import { Quiz, type Q } from "./Quiz";
import { prepByN } from "../prep";

export function LessonShell({ id, children, quiz }: { id: string; children: ReactNode; quiz?: Q[] }) {
  const t = byId[id];
  const done = useDone();
  const idx = TOPICS.findIndex((x) => x.id === id);
  const prev = TOPICS[idx - 1];
  const next = TOPICS[idx + 1];
  const deps = dependents(id);
  const g = GROUPS[t.group];

  return (
    <article className="lesson" style={{ ["--g" as string]: g.color }}>
      <header className="lesson-head">
        <div className="eyebrow">
          <span className="dot" /> {g.name} · {idx + 1}-mavzu
        </div>
        <h1>{t.title}</h1>
        <div className="terms">
          <span lang="ru">{t.ru}</span> · <span lang="en">{t.en}</span>
        </div>
        <p className="idea">{t.idea}</p>
        <div className="hemis-badges">
          {t.hemis.map((n) => {
            const L = HEMIS_LECTURES.find((l) => l.n === n)!;
            return (
              <Link key={n} to="/hemis" className="hemis-badge" title={L.points}>
                HEMIS · {n}-ma'ruza: {L.title}
              </Link>
            );
          })}
        </div>
      </header>

      {t.hemis.some((n) => prepByN[n]) && (
        <Link to={`/oraliq/${prepByN[t.hemis[0]]?.slug ?? ""}`} className="prep-banner">
          <b>Oraliqqa tayyorlanyapsizmi?</b> Bu yerda — mavzuning geometrik ma'nosi. Imtihon uchun qisqa, oddiy tushuntirish, qadamma-qadam
          yechimlar va mashqlar — <u>{prepByN[t.hemis[0]]?.n}-mavzu: tez tayyorgarlik sahifasida</u> →
        </Link>
      )}

      {t.prereqs.length > 0 && (
        <details className="links links-in">
          <summary>Bu mavzu nimalarga tayanadi ({t.prereqs.length})</summary>
          <ul>
            {t.prereqs.map((p) => (
              <li key={p.id}>
                <Link to={`/dars/${p.id}`} className={"tag" + (done.includes(p.id) ? " done" : "")}>
                  {byId[p.id].title}
                </Link>
                <span>{p.why}</span>
              </li>
            ))}
          </ul>
        </details>
      )}

      <div className="lesson-body">{children}</div>

      {t.video && <Video name={t.video} />}

      {deps.length > 0 && (
        <section className="links links-out">
          <h3>Bu bilim keyin qayerda ishlatiladi</h3>
          <ul>
            {deps.map((d) => (
              <li key={d.topic.id}>
                <Link to={`/dars/${d.topic.id}`} className="tag">
                  {d.topic.title}
                </Link>
                <span>{d.why}</span>
              </li>
            ))}
          </ul>
          <Link to={`/xarita?t=${id}`} className="map-link">Bilim xaritasida ko'rish →</Link>
        </section>
      )}

      {quiz && <Quiz questions={quiz} />}

      <footer className="lesson-foot">
        {prev ? <Link className="btn ghost" to={`/dars/${prev.id}`}>← {prev.title}</Link> : <span />}
        <button className={"btn" + (done.includes(id) ? " done" : "")} onClick={() => toggleDone(id)}>
          {done.includes(id) ? "✓ O'zlashtirildi" : "O'zlashtirdim"}
        </button>
        {next ? <Link className="btn ghost" to={`/dars/${next.id}`}>{next.title} →</Link> : <span />}
      </footer>
    </article>
  );
}

function Video({ name }: { name: string }) {
  const [missing, setMissing] = useState(false);
  const src = `${import.meta.env.BASE_URL}videos/${name}.mp4`;
  return (
    <section className="video">
      <h3>Video-tushuntirish (Manim)</h3>
      {missing ? (
        <p className="muted">
          Video hali render qilinmagan. Loyiha ildizida <code>manim/render.ps1</code> ni ishga tushiring.
        </p>
      ) : (
        <video src={src} controls preload="metadata" onError={() => setMissing(true)} />
      )}
    </section>
  );
}

/** Dars ichidagi bo'lim sarlavhasi */
export function Sec({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="sec">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

/** "Esingizdami?" — oldingi mavzuga ishora, matn ichida */
export function Recall({ to, children }: { to: string; children: ReactNode }) {
  return (
    <aside className="recall">
      <Link to={`/dars/${to}`} className="recall-tag">↩ {byId[to].title}</Link>
      <div>{children}</div>
    </aside>
  );
}

export function Key({ children }: { children: ReactNode }) {
  return <div className="key">{children}</div>;
}
