import { useState } from "react";
import { Link } from "react-router-dom";
import { byId, GLOSSARY } from "../data/topics";

export function Glossary() {
  const [q, setQ] = useState("");
  const s = q.trim().toLowerCase();
  const rows = GLOSSARY.filter((g) => !s || [g.uz, g.ru, g.en].some((x) => x.toLowerCase().includes(s)));
  return (
    <div className="page">
      <h1>Atamalar lug'ati</h1>
      <p className="muted">O'zbekcha · ruscha · inglizcha. Atamani bosing — u kiritilgan darsga o'tasiz.</p>
      <input className="search" placeholder="Qidirish: bazis, ранг, eigen…" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="table-scroll">
      <table className="gloss">
        <thead><tr><th>O'zbekcha</th><th>Русский</th><th>English</th><th>Dars</th></tr></thead>
        <tbody>
          {rows.map((g) => (
            <tr key={g.uz}>
              <td>{g.uz}</td><td lang="ru">{g.ru}</td><td lang="en">{g.en}</td>
              <td><Link to={`/dars/${g.topic}`}>{byId[g.topic].title}</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      {rows.length === 0 && <p className="muted">Hech narsa topilmadi. Boshqa so'z bilan qidirib ko'ring.</p>}
    </div>
  );
}
