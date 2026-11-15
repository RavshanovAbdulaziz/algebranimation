import { Link } from "react-router-dom";
import { HEMIS_LECTURES, TOPICS } from "../data/topics";
import { useDone } from "../lib/progress";

/** HEMIS dasturi (ma'ruzalar tartibi) ↔ bu saytdagi darslar */
export function HemisPage() {
  const done = useDone();
  return (
    <div className="page">
      <h1>HEMIS dasturi bo'yicha</h1>
      <p className="muted">
        "Amaliy matematika 1" (AMAT11210) fanining algebra qismi. Universitetda mavzular boshqa tartibda o'tiladi (avval determinant,
        keyin vektorlar), bu saytda esa tushunish tartibida: har bir mavzu oldingisiga tayanadi. Quyida — har bir ma'ruzani qaysi
        darslar yoritadi.
      </p>
      <div className="hemis-list">
        {HEMIS_LECTURES.map((L) => {
          const ts = TOPICS.filter((t) => t.hemis.includes(L.n));
          return (
            <section key={L.n} className="hemis-row">
              <div className="hemis-n">{L.n}</div>
              <div>
                <h3>{L.title}</h3>
                <p className="muted small">{L.points}</p>
                <div className="hemis-topics">
                  {ts.map((t) => (
                    <Link key={t.id} to={`/dars/${t.id}`} className={"tag" + (done.includes(t.id) ? " done" : "")}>
                      {TOPICS.indexOf(t) + 1}. {t.title}
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
