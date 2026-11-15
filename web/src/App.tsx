import { useEffect } from "react";
import { HashRouter, Link, NavLink, Route, Routes, useLocation, useParams } from "react-router-dom";
import { GROUPS, TOPICS } from "./data/topics";
import { LESSONS } from "./lessons";
import { useDone } from "./lib/progress";
import { Home } from "./pages/Home";
import { MapPage } from "./pages/MapPage";
import { Glossary } from "./pages/Glossary";
import { HemisPage } from "./pages/HemisPage";

function ScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function LessonPage() {
  const { id = "" } = useParams();
  const done = useDone();
  const L = LESSONS[id];
  return (
    <div className="lesson-layout">
      <aside className="sidebar">
        {TOPICS.map((t, i) => (
          <NavLink key={t.id} to={`/dars/${t.id}`} className={"side-item" + (done.includes(t.id) ? " done" : "")} style={{ ["--g" as string]: GROUPS[t.group].color }}>
            <span className="side-n">{done.includes(t.id) ? "✓" : i + 1}</span>
            <span>{t.title}</span>
          </NavLink>
        ))}
      </aside>
      <main className="lesson-main">{L ? <L key={id} /> : <p>Dars topilmadi. <Link to="/">Bosh sahifa</Link></p>}</main>
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <ScrollTop />
      <nav className="topnav">
        <Link to="/" className="brand"><span className="logo">λ</span> Algebranimation</Link>
        <div className="navlinks">
          <NavLink to="/dars/vektor">Darslar</NavLink>
          <NavLink to="/xarita">Bilim xaritasi</NavLink>
          <NavLink to="/hemis">HEMIS dasturi</NavLink>
          <NavLink to="/lugat">Lug'at</NavLink>
        </div>
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dars/:id" element={<LessonPage />} />
        <Route path="/xarita" element={<MapPage />} />
        <Route path="/hemis" element={<HemisPage />} />
        <Route path="/lugat" element={<Glossary />} />
      </Routes>
    </HashRouter>
  );
}
