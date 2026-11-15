import { Link } from "react-router-dom";
import { GROUPS, TOPICS, type Group } from "../data/topics";
import { useDone } from "../lib/progress";
import { Tex } from "../components/Tex";

export function Home() {
  const done = useDone();
  const groups = Object.keys(GROUPS) as Group[];
  const next = TOPICS.find((t) => !done.includes(t.id));
  return (
    <div className="home">
      <section className="hero">
        <h1>Chiziqli algebra — harakatda</h1>
        <p className="lead">
          Har bir mavzu bitta animatsiya atrofida qurilgan: siz vektorni sudraysiz, matritsani o'zgartirasiz — va formula
          nima uchun aynan shunday ekanini <b>ko'rasiz</b>.
        </p>
        <div className="hero-actions">
          {next && <Link className="btn" to={`/dars/${next.id}`}>{done.length ? "Davom etish" : "Boshlash"}: {next.title} →</Link>}
          <Link className="btn ghost" to="/xarita">Bilim xaritasi</Link>
        </div>
        <div className="progress"><div style={{ width: `${(done.length / TOPICS.length) * 100}%` }} /></div>
        <div className="muted small">{done.length} / {TOPICS.length} mavzu o'zlashtirildi</div>
      </section>

      <section className="spine">
        <h2>Butun kursni bog'laydigan bitta g'oya</h2>
        <p>
          Chiziqli algebraning deyarli hamma mavzusi bitta savolga turli tomondan qaraydi:{" "}
          <b>matritsa tekislikni qanday o'zgartiradi?</b>
        </p>
        <ol className="chain">
          <li><span>Vektor</span> — tekislikdagi nuqta/strelka</li>
          <li><span>Kombinatsiya</span> — <Tex>{"\\alpha\\vec v + \\beta\\vec w"}</Tex>: vektorlardan yangi vektor yasash</li>
          <li><span>Matritsa</span> — <Tex>{"A\\vec x = x\\cdot(\\text{1-ustun}) + y\\cdot(\\text{2-ustun})"}</Tex>: kombinatsiya mashinasi</li>
          <li><span>Determinant</span> — bu mashina yuzani necha marta o'zgartiradi</li>
          <li><span>Sistema</span> — <Tex>{"A\\vec x = \\vec b"}</Tex>: mashinaga nima bersak, b chiqadi?</li>
          <li><span>Teskari / rang</span> — mashinani orqaga aylantirish mumkinmi, natija necha o'lchovli?</li>
          <li><span>Xos vektor</span> — mashina burmaydigan yo'nalishlar</li>
        </ol>
        <p className="muted">
          Ranglar ham butun kurs bo'yicha bir xil: <b style={{ color: "var(--i)" }}>yashil</b> — 1-bazis vektori / 1-ustun,{" "}
          <b style={{ color: "var(--j)" }}>qizil</b> — 2-bazis / 2-ustun, <b style={{ color: "var(--v)" }}>sariq</b> — siz boshqaradigan vektor,{" "}
          <b style={{ color: "var(--res)" }}>ko'k</b> — natija.
        </p>
      </section>

      {groups.map((g) => (
        <section key={g} className="group" style={{ ["--g" as string]: GROUPS[g].color }}>
          <h2><span className="dot" />{GROUPS[g].name}</h2>
          <div className="cards">
            {TOPICS.filter((t) => t.group === g).map((t) => (
              <Link key={t.id} to={`/dars/${t.id}`} className={"card" + (done.includes(t.id) ? " done" : "")}>
                <div className="card-n">{TOPICS.indexOf(t) + 1}</div>
                <h3>{t.title}</h3>
                <div className="card-ru">{t.ru}</div>
                <p>{t.idea}</p>
                {t.video && <div className="badge">+ video</div>}
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
