import { useState, type ReactNode } from "react";

export interface Q {
  q: ReactNode;
  options: ReactNode[];
  correct: number;
  explain: ReactNode;
}

export function Quiz({ questions }: { questions: Q[] }) {
  return (
    <section className="quiz">
      <h2>O'zingizni tekshiring</h2>
      {questions.map((q, i) => (
        <QuizItem key={i} n={i + 1} q={q} />
      ))}
    </section>
  );
}

function QuizItem({ q, n }: { q: Q; n: number }) {
  const [picked, setPicked] = useState<number | null>(null);
  const answered = picked !== null;
  return (
    <div className="quiz-item">
      <div className="quiz-q">
        <b>{n}.</b> {q.q}
      </div>
      <div className="quiz-opts">
        {q.options.map((o, i) => {
          const cls = !answered ? "" : i === q.correct ? " right" : i === picked ? " wrong" : " dim";
          return (
            <button key={i} className={"quiz-opt" + cls} onClick={() => setPicked(i)}>
              {o}
            </button>
          );
        })}
      </div>
      {answered && (
        <div className={"quiz-explain " + (picked === q.correct ? "ok" : "no")}>
          {picked === q.correct ? "To'g'ri! " : "Unchalik emas. "}
          {q.explain}
        </div>
      )}
    </div>
  );
}
