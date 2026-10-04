import { useState } from "react";
import type { Question, AnswerLog, SetInfo, QuizMode } from "../types";
import { lastMark } from "../store/progress";
import { DOMAIN_SHORT } from "../data/domains";
import { TopBar } from "../components/TopBar";

type Props = {
  questions: Question[];
  sets: SetInfo[];
  answers: Record<string, AnswerLog>;
  bookmarks: Set<string>;
  onStart: (mode: QuizMode) => void;
  onOpen: (id: string) => void;
  onBack: () => void;
};

/** セット別の通し・一覧。ブラウズして 1 問だけ解くこともできる */
export function Review(p: Props) {
  const [set, setSet] = useState(p.sets[0]?.set ?? 1);
  const list = p.questions.filter((q) => q.set === set).sort((a, b) => a.number - b.number);
  const info = p.sets.find((s) => s.set === set);

  return (
    <>
      <TopBar title="セット別" onBack={p.onBack} />
      <main className="content">
        <div className="chip-list" style={{ marginBottom: 12 }}>
          {p.sets.map((s) => (
            <button key={s.set} className={"chip" + (s.set === set ? " on" : "")} onClick={() => setSet(s.set)}>
              {s.label}
            </button>
          ))}
        </div>

        <section className="card" style={{ marginBottom: 12 }}>
          <div className="row">
            <div>
              <div>{info?.label}</div>
              <div className="small muted">{list.length} 問を問1から順に（時間制限なし）</div>
            </div>
            <div className="spacer" />
            <button className="btn primary" onClick={() => p.onStart({ kind: "set", set })}>
              通しで解く
            </button>
          </div>
        </section>

        <div className="qlist">
          {list.map((q) => {
            const m = lastMark(p.answers[q.id]);
            const cls = m === "o" ? "o" : m === "x" ? "x" : m === "?" ? "u" : "none";
            return (
              <button key={q.id} className="qitem" onClick={() => p.onOpen(q.id)}>
                <span className={"mark " + cls}>{m === "o" ? "○" : m === "x" ? "✕" : m === "?" ? "?" : q.number}</span>
                <span className="body">
                  <div className="src">
                    問{q.number} ・ {DOMAIN_SHORT[q.domain]}
                    {q.select > 1 ? ` ・ ${q.select}つ選択` : ""}
                    {q.topic ? ` ・ ${q.topic}` : ""}
                    {p.bookmarks.has(q.id) ? " ★" : ""}
                  </div>
                  <div className="txt">{q.text}</div>
                </span>
              </button>
            );
          })}
        </div>
      </main>
    </>
  );
}
