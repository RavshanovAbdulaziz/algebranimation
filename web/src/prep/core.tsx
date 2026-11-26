import { useEffect, useMemo, useState, type ReactNode } from "react";
import { record } from "../lib/review";
import { Tex } from "../components/Tex";

/* ================================================================== */
/* Turlar                                                              */
/* ================================================================== */

/** Javob maydoni: bitta son (kasr ham bo'lishi mumkin) */
export interface Ans { label?: ReactNode; v: number; tol?: number }

/** "Tuzoq" — ko'p uchraydigan xato javob va uning sababi */
export interface Trap { v: number[]; why: ReactNode }

export interface Problem {
  q: ReactNode;
  /** Son kiritiladigan javoblar */
  ans?: Ans[];
  /** Javoblar tartibi muhim emas (masalan, xos sonlar) */
  unordered?: boolean;
  /** Variantli savol (son o'rniga) */
  choice?: { options: ReactNode[]; correct: number };
  steps: ReactNode[];
  traps?: Trap[];
}

export interface Gen {
  id: string;
  title: string;
  make: () => Problem;
}

export interface MCQ {
  id: string;
  q: ReactNode;
  options: ReactNode[];
  correct: number;
  explain: ReactNode;
}

export interface Recipe {
  title: string;
  /** Qisqa qoida (1–2 gap) */
  rule: ReactNode;
  /** Asosiy formula — alohida qatorda, yirik (daftardagidek) */
  formula?: string;
  /** Ishlangan misol qadamlari */
  steps: ReactNode[];
  /** Ixtiyoriy rasm/sxema (qoida yonida) */
  visual?: ReactNode;
}

export interface PrepTopic {
  n: number;
  slug: string;
  title: string;
  short: string;
  /** "1 daqiqada" — oddiy tilda mohiyat */
  minute: ReactNode;
  /** Mavzudagi belgilar: belgi (TeX), qanday o'qiladi, nimani bildiradi */
  symbols: { s: string; read: string; mean: ReactNode }[];
  /** Mohiyatni ko'rsatadigan bitta rasm (ixtiyoriy) */
  picture?: ReactNode;
  uses: { icon: string; title: string; text: ReactNode }[];
  recipes: Recipe[];
  mistakes: { wrong: ReactNode; right: ReactNode }[];
  gens: Gen[];
  tests: MCQ[];
  cheat: { t: string; f: ReactNode }[];
  /** Chuqurroq tushunish uchun interaktiv darslar (id) */
  lessons: string[];
}

/* ================================================================== */
/* Sonlar                                                              */
/* ================================================================== */

export const ri = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1));
export const rnz = (a: number, b: number) => {
  let x = 0;
  while (x === 0) x = ri(a, b);
  return x;
};
export const pick = <T,>(xs: T[]): T => xs[Math.floor(Math.random() * xs.length)];
export const shuffle = <T,>(xs: T[]): T[] => {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : Math.abs(a));

/** Sonni kasr ko'rinishida (agar maxraji kichik bo'lsa) */
export function frac(v: number): [number, number] | null {
  for (let d = 1; d <= 60; d++) {
    const n = Math.round(v * d);
    if (Math.abs(n / d - v) < 1e-9) {
      const g = gcd(n, d) || 1;
      return [n / g, d / g];
    }
  }
  return null;
}
/** Matn: 3, -3/2, 0.71 */
export function num(v: number): string {
  const f = frac(v);
  if (f) return f[1] === 1 ? String(f[0]) : `${f[0]}/${f[1]}`;
  return String(Math.round(v * 100) / 100);
}
/** TeX: 3, -\frac32, 0.71 */
export function tn(v: number): string {
  const f = frac(v);
  if (f) return f[1] === 1 ? String(f[0]) : `${f[0] < 0 ? "-" : ""}\\frac{${Math.abs(f[0])}}{${f[1]}}`;
  return String(Math.round(v * 100) / 100);
}
/** Qavs ichida manfiy: (-3) */
export const tp = (v: number) => (v < 0 ? `(${tn(v)})` : tn(v));
/** Ishorali had: "+ 3", "- 3" */
export const ts = (v: number) => (v < 0 ? `- ${tn(-v)}` : `+ ${tn(v)}`);

/** Foydalanuvchi kiritgan matndan son: "3", "-1.5", "3/2", "−2" */
export function parseNum(s: string): number | null {
  const t = s.trim().replace(/−/g, "-").replace(/,/g, ".").replace(/\s+/g, "");
  if (!t) return null;
  const m = t.match(/^(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)$/);
  if (m) {
    const d = Number(m[2]);
    return d === 0 ? null : Number(m[1]) / d;
  }
  if (/^-?(\d+\.?\d*|\.\d+)$/.test(t)) return Number(t);
  return null;
}

export const eq = (a: number, b: number, tol = 1e-6) => Math.abs(a - b) <= tol;

/**
 * Matn + formula: "Uzunlik $\\sqrt{x^2+y^2}$ ga teng" → oddiy matn va KaTeX formula.
 * Testlar, izohlar va xato sabablari shu orqali chiqadi — formulalar daftardagidek ko'rinadi.
 */
export function rich(node: ReactNode): ReactNode {
  if (typeof node !== "string" || !node.includes("$")) return node;
  return node.split("$").map((part, i) => (i % 2 ? <Tex key={i}>{part}</Tex> : part));
}

/** 2×2 va 3×3 determinantlar */
export const det2 = (m: number[][]) => m[0][0] * m[1][1] - m[0][1] * m[1][0];
export const det3 = (m: number[][]) =>
  m[0][0] * m[1][1] * m[2][2] + m[0][1] * m[1][2] * m[2][0] + m[0][2] * m[1][0] * m[2][1] -
  m[0][2] * m[1][1] * m[2][0] - m[0][0] * m[1][2] * m[2][1] - m[0][1] * m[1][0] * m[2][2];

/** TeX matritsa / determinant */
export const tmat = (m: (number | string)[][], kind: "b" | "v" | "p" = "p") =>
  `\\begin{${kind}matrix} ${m.map((r) => r.map((x) => (typeof x === "number" ? tn(x) : x)).join(" & ")).join(" \\\\ ")} \\end{${kind}matrix}`;
export const tvec = (v: number[]) => `(${v.map(tn).join(";\\ ")})`;

/* ================================================================== */
/* UI: qadamma-qadam ochiladigan yechim                                */
/* ================================================================== */

export function StepReveal({ steps, startOpen = 1 }: { steps: ReactNode[]; startOpen?: number }) {
  const [k, setK] = useState(startOpen);
  return (
    <div className="steprev">
      <ol>
        {steps.slice(0, k).map((s, i) => (
          <li key={i} className={i === k - 1 ? "new" : ""}>{s}</li>
        ))}
      </ol>
      {k < steps.length ? (
        <div className="steprev-ctl">
          <button className="btn small" onClick={() => setK(k + 1)}>Keyingi qadam →</button>
          <button className="btn small ghost" onClick={() => setK(steps.length)}>Hammasini ko'rsatish</button>
          <span className="muted small">{k} / {steps.length}</span>
        </div>
      ) : (
        steps.length > 1 && <button className="btn small ghost" onClick={() => setK(1)}>↺ Boshidan</button>
      )}
    </div>
  );
}

/* ================================================================== */
/* UI: mashq (cheksiz misollar)                                        */
/* ================================================================== */

export function Practice({ topic, gens }: { topic: number; gens: Gen[] }) {
  const [gi, setGi] = useState(0);
  const [seed, setSeed] = useState(0);
  const p = useMemo(() => gens[gi].make(), [gi, seed]); // eslint-disable-line react-hooks/exhaustive-deps
  const [vals, setVals] = useState<string[]>([]);
  const [picked, setPicked] = useState<number | null>(null);
  const [res, setRes] = useState<null | { ok: boolean; trap?: ReactNode }>(null);
  const [showSol, setShowSol] = useState(false);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    setVals((p.ans ?? []).map(() => ""));
    setPicked(null);
    setRes(null);
    setShowSol(false);
  }, [p]);

  const id = `t${topic}:gen:${gens[gi].id}`;

  const check = () => {
    let ok = false;
    let trap: ReactNode | undefined;
    if (p.choice) {
      ok = picked === p.choice.correct;
    } else if (p.ans) {
      const got = vals.map(parseNum);
      if (got.some((g) => g === null)) return;
      const g = got as number[];
      if (p.unordered) {
        const want = p.ans.map((a) => a.v).sort((a, b) => a - b);
        const have = [...g].sort((a, b) => a - b);
        ok = want.every((w, i) => eq(w, have[i], p.ans![0].tol));
      } else {
        ok = p.ans.every((a, i) => eq(a.v, g[i], a.tol));
      }
      if (!ok && p.traps) trap = p.traps.find((t) => t.v.length === g.length && t.v.every((v, i) => eq(v, g[i])))?.why;
    }
    record(id, ok);
    setStreak(ok ? streak + 1 : 0);
    setRes({ ok, trap });
    if (!ok) setShowSol(true);
  };

  const next = () => setSeed(seed + 1);
  const ready = p.choice ? picked !== null : vals.length > 0 && vals.every((v) => parseNum(v) !== null);

  return (
    <div className="practice">
      <div className="practice-tabs">
        {gens.map((g, i) => (
          <button key={g.id} className={"chip" + (i === gi ? " on" : "")} onClick={() => { setGi(i); setSeed(seed + 1); }}>
            {g.title}
          </button>
        ))}
      </div>
      <div className="practice-card">
        <div className="practice-q">{p.q}</div>
        {p.choice ? (
          <div className="quiz-opts">
            {p.choice.options.map((o, i) => {
              const cls = !res ? (picked === i ? " sel" : "") : i === p.choice!.correct ? " right" : i === picked ? " wrong" : " dim";
              return (
                <button key={i} className={"quiz-opt" + cls} disabled={!!res} onClick={() => setPicked(i)}>{rich(o)}</button>
              );
            })}
          </div>
        ) : (
          <form className="practice-inputs" onSubmit={(e) => { e.preventDefault(); if (res) next(); else if (ready) check(); }}>
            {p.ans!.map((a, i) => (
              <label key={i} className="ans-field">
                {a.label && <span className="ans-label">{a.label}</span>}
                <input
                  inputMode="decimal"
                  autoComplete="off"
                  value={vals[i] ?? ""}
                  disabled={!!res}
                  placeholder="javob"
                  className={res ? (eq(a.v, parseNum(vals[i]) ?? NaN, a.tol) || (p.unordered && res.ok) ? "ok" : "no") : ""}
                  onChange={(e) => setVals(vals.map((v, j) => (j === i ? e.target.value : v)))}
                />
              </label>
            ))}
            <button type="submit" hidden />
          </form>
        )}
        {!p.choice && !res && <div className="muted small">Javob kasr bo'lsa, klaviaturada <code>3/4</code> deb yozing (bu <Tex>{"\\frac34"}</Tex> degani) yoki o'nli kasr: <code>-1.5</code>. Enter — tekshirish.</div>}

        <div className="practice-ctl">
          {!res ? (
            <>
              <button className="btn" disabled={!ready} onClick={check}>Tekshirish</button>
              <button className="btn ghost" onClick={() => setShowSol(!showSol)}>{showSol ? "Yechimni yashirish" : "Yechimni ko'rish"}</button>
            </>
          ) : (
            <button className="btn" onClick={next}>Yangi misol →</button>
          )}
          {streak >= 2 && <span className="streak">🔥 {streak} ta ketma-ket to'g'ri</span>}
        </div>

        {res && (
          <div className={"verdict " + (res.ok ? "ok" : "no")}>
            {res.ok ? (
              <><b>To'g'ri!</b> {streak >= 3 ? "Bu turni o'zlashtirdingiz — boshqa turga o'ting." : "Yana bittasini yeching — mustahkamlanadi."}</>
            ) : (
              <>
                <b>Xato.</b>{" "}
                {p.ans && <>To'g'ri javob: <Tex>{p.ans.map((a) => tn(a.v)).join(";\\quad ")}</Tex>. </>}
                {res.trap && <span className="trap">⚠ {rich(res.trap)}</span>}
              </>
            )}
          </div>
        )}
        {showSol && (
          <div className="practice-sol">
            <div className="sol-title">Yechim</div>
            <StepReveal key={seed + "-" + gi} steps={p.steps} startOpen={res ? p.steps.length : 1} />
          </div>
        )}
      </div>
    </div>
  );
}

/* ================================================================== */
/* UI: test savollari (imtihon uslubida)                               */
/* ================================================================== */

export function TestList({ items }: { items: MCQ[] }) {
  const [round, setRound] = useState(0);
  const [score, setScore] = useState<Record<string, boolean>>({});
  const n = Object.keys(score).length;
  const ok = Object.values(score).filter(Boolean).length;
  return (
    <div className="testlist" key={round}>
      {items.map((m, i) => (
        <TestItem key={m.id + round} m={m} n={i + 1} onAnswer={(c) => setScore((s) => ({ ...s, [m.id]: c }))} />
      ))}
      <div className="test-score">
        {n > 0 && <span>Natija: <b>{ok}</b> / {n} {n === items.length && (ok === n ? "— a'lo!" : ok >= n * 0.7 ? "— yaxshi" : "— xatolarni qayta o'qing")}</span>}
        {n > 0 && <button className="btn small ghost" onClick={() => { setScore({}); setRound(round + 1); }}>↺ Qaytadan</button>}
      </div>
    </div>
  );
}

export function TestItem({ m, n, onAnswer, noRecord, initial = null }: { m: MCQ; n?: number; onAnswer?: (ok: boolean, picked: number) => void; noRecord?: boolean; initial?: number | null }) {
  const [picked, setPicked] = useState<number | null>(initial);
  const answered = picked !== null;
  const letters = "ABCDE";
  return (
    <div className="quiz-item">
      <div className="quiz-q">{n !== undefined && <b>{n}. </b>}{rich(m.q)}</div>
      <div className="quiz-opts col">
        {m.options.map((o, i) => {
          const cls = !answered ? "" : i === m.correct ? " right" : i === picked ? " wrong" : " dim";
          return (
            <button key={i} className={"quiz-opt" + cls} disabled={answered} onClick={() => {
              setPicked(i);
              const ok = i === m.correct;
              if (!noRecord) record(m.id, ok);
              onAnswer?.(ok, i);
            }}>
              <span className="opt-l">{letters[i]})</span> {rich(o)}
            </button>
          );
        })}
      </div>
      {answered && (
        <div className={"quiz-explain " + (picked === m.correct ? "ok" : "no")}>
          {picked === m.correct ? "To'g'ri! " : "Xato. "}
          {rich(m.explain)}
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/* Generator misolini variantli savolga aylantirish (sinov imtihoni)  */
/* ================================================================== */

export function genToMCQ(topic: number, g: Gen): MCQ | null {
  const p = g.make();
  const id = `t${topic}:gen:${g.id}`;
  if (p.choice) return { id, q: p.q, options: p.choice.options, correct: p.choice.correct, explain: <StepReveal steps={p.steps} startOpen={p.steps.length} /> };
  if (!p.ans) return null;
  const show = (vs: number[]) => <Tex>{vs.length > 1 ? `(${vs.map(tn).join(";\\ ")})` : tn(vs[0])}</Tex>;
  const right = p.ans.map((a) => a.v);
  const key = (vs: number[]) => vs.map((v) => Math.round(v * 1000)).join(",");
  const seen = new Set([key(right)]);
  const wrong: number[][] = [];
  for (const t of p.traps ?? []) {
    if (t.v.length === right.length && !seen.has(key(t.v))) { seen.add(key(t.v)); wrong.push(t.v); }
  }
  let guard = 0;
  while (wrong.length < 4 && guard++ < 50) {
    const w = right.map((v) => {
      const d = pick([-3, -2, -1, 1, 2, 3, 4, -4]);
      return Number.isInteger(v) ? v + d : v + d / 2;
    });
    if (!seen.has(key(w))) { seen.add(key(w)); wrong.push(w); }
  }
  const opts = shuffle([right, ...wrong.slice(0, 4)]);
  return {
    id,
    q: <>{p.q}{p.ans.length > 1 && <span className="muted small"> (javob: {p.ans.map((a, i) => <span key={i}>{i ? "; " : ""}{a.label}</span>)})</span>}</>,
    options: opts.map(show),
    correct: opts.indexOf(right),
    explain: <StepReveal steps={p.steps} startOpen={p.steps.length} />,
  };
}
