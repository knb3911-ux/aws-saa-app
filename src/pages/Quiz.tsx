import { useEffect, useRef, useState } from "react";
import type { Answer, Question, QuizState } from "../types";
import { TopBar } from "../components/TopBar";
import { QuestionCard } from "../components/QuestionCard";
import { EXAM_MINUTES } from "../data/domains";
import { formatClock, remainingSeconds } from "../quiz/grading";

type Props = {
  state: QuizState;
  byId: Map<string, Question>;
  bookmarks: Set<string>;
  onAnswer: (id: string, a: Answer) => void;
  onDraft: (id: string, a: Answer | null) => void;
  onNext: () => void;
  onPrev: () => void;
  onJump: (index: number) => void;
  onFinishExam: () => void;
  onToggleBookmark: (id: string) => void;
  onExit: () => void;
};

export function Quiz(p: Props) {
  const { ids, index, answers } = p.state;
  const id = ids[index];
  const q = p.byId.get(id);
  const answer = answers[id];
  const isLast = index === ids.length - 1;
  const exam = p.state.mode.kind === "exam";
  const live = exam && !p.state.finished; // 模擬試験の解答中
  const answeredCount = ids.filter((i) => answers[i] !== undefined).length;

  // 問題が変わったら先頭へ
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [id]);

  const navRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    navRef.current?.querySelector(".cur")?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [index, live]);

  const [left, setLeft] = useState(() => remainingSeconds(p.state.startedAt, EXAM_MINUTES, Date.now()));
  const { onFinishExam } = p;
  useEffect(() => {
    if (!live) return;
    const tick = () => {
      const s = remainingSeconds(p.state.startedAt, EXAM_MINUTES, Date.now());
      setLeft(s);
      if (s <= 0) onFinishExam();
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [live, p.state.startedAt, onFinishExam]);

  if (!q) {
    return (
      <>
        <TopBar title="問題" onBack={p.onExit} />
        <main className="content">
          <div className="loading">問題データが見つかりません（{id}）</div>
        </main>
      </>
    );
  }

  function finish() {
    const rest = ids.length - answeredCount;
    const msg = rest > 0 ? `未解答が ${rest} 問あります。終了して採点しますか？` : "終了して採点しますか？";
    if (confirm(msg)) p.onFinishExam();
  }

  return (
    <>
      <TopBar
        title={live ? `問${index + 1}` : `問${q.number}`}
        sub={live ? undefined : `${index + 1} / ${ids.length}`}
        onBack={p.onExit}
        right={
          <>
            {live && (
              <span className={"timer num" + (left <= 600 ? " warn" : "")} aria-label="残り時間">
                {formatClock(left)}
              </span>
            )}
            <button
              className={"icon-btn" + (p.bookmarks.has(id) ? " on" : "")}
              onClick={() => p.onToggleBookmark(id)}
              aria-label="ブックマーク"
            >
              {p.bookmarks.has(id) ? "★" : "☆"}
            </button>
          </>
        }
      />
      <main className="content">
        {live && (
          <div className="exam-nav" ref={navRef} aria-label="問題一覧">
            {ids.map((qid, i) => (
              <button
                key={qid}
                className={"dot" + (i === index ? " cur" : "") + (answers[qid] !== undefined ? " done" : "")}
                onClick={() => p.onJump(i)}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
        <QuestionCard
          key={id}
          question={q}
          answer={answer}
          mode={live ? "exam" : "practice"}
          locked={exam && !live}
          onAnswer={(a) => p.onAnswer(id, a)}
          onChange={(a) => p.onDraft(id, a)}
        />
      </main>
      <div className="bottombar">
        <div className="inner">
          <button className="btn" onClick={p.onPrev} disabled={index === 0} aria-label="前の問題">
            ‹ 前
          </button>
          {live && isLast ? (
            <button className="btn primary" style={{ flex: 1 }} onClick={finish}>
              終了して採点（{answeredCount}/{ids.length}）
            </button>
          ) : (
            <button
              className="btn primary"
              style={{ flex: 1 }}
              onClick={p.onNext}
              disabled={!live && !(exam && p.state.finished) && answer === undefined}
            >
              {isLast ? "結果を見る" : "次へ ›"}
            </button>
          )}
          {live && !isLast && (
            <button className="btn" onClick={finish}>
              終了
            </button>
          )}
        </div>
      </div>
    </>
  );
}
