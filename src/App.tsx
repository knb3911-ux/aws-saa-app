import { useCallback, useEffect, useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import type { Answer, Mark, QuizMode, QuizState } from "./types";
import { loadBank, type QuestionBank } from "./data/loader";
import {
  loadAnswers,
  loadBookmarks,
  loadCurrent,
  recordAnswers,
  saveCurrent,
  toggleBookmark,
  clearAll,
  type AnswerMap,
} from "./store/progress";
import { selectQuestions } from "./quiz/selectors";
import { markOf } from "./quiz/grading";
import { Home } from "./pages/Home";
import { Quiz } from "./pages/Quiz";
import { Result } from "./pages/Result";
import { Stats } from "./pages/Stats";
import { Review } from "./pages/Review";

type View = "home" | "quiz" | "result" | "stats" | "review";

/** 画面遷移。ブラウザの戻る（Android のバックジェスチャ）に追従するため history を使う */
function useView() {
  const [view, setView] = useState<View>("home");
  useEffect(() => {
    const onPop = (e: PopStateEvent) => setView((e.state?.view as View) ?? "home");
    window.addEventListener("popstate", onPop);
    history.replaceState({ view: "home" }, "");
    return () => window.removeEventListener("popstate", onPop);
  }, []);
  const go = useCallback((v: View) => {
    history.pushState({ view: v }, "");
    setView(v);
  }, []);
  const home = useCallback(() => {
    // 履歴を積み上げないよう、ホームへはスタックを畳んで戻る
    history.replaceState({ view: "home" }, "");
    setView("home");
  }, []);
  return { view, go, home };
}

export default function App() {
  const [bank, setBank] = useState<QuestionBank | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<AnswerMap>(() => loadAnswers());
  const [bookmarks, setBookmarks] = useState<Set<string>>(() => loadBookmarks());
  const [current, setCurrent] = useState<QuizState | null>(() => loadCurrent());
  const { view, go, home } = useView();

  const { needRefresh, updateServiceWorker } = useRegisterSW();

  // 画面が変わったら先頭から表示する
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [view]);

  useEffect(() => {
    loadBank().then(setBank).catch((e) => setError(String(e)));
  }, []);

  const updateCurrent = useCallback((s: QuizState | null) => {
    setCurrent(s);
    saveCurrent(s);
  }, []);

  const begin = useCallback(
    (mode: QuizMode, ids: string[]) => {
      if (ids.length === 0) return;
      updateCurrent({ mode, ids, index: 0, answers: {}, startedAt: new Date().toISOString() });
      go("quiz");
    },
    [updateCurrent, go],
  );

  const start = useCallback(
    (mode: QuizMode) => {
      if (!bank) return;
      begin(mode, selectQuestions(mode, bank.questions, answers, bookmarks));
    },
    [bank, answers, bookmarks, begin],
  );

  /** 練習モード: 確定した解答を記録する */
  const answer = useCallback(
    (id: string, a: Answer) => {
      if (!current || !bank) return;
      const q = bank.byId.get(id);
      if (!q) return;
      setAnswers((m) => recordAnswers(m, { [id]: markOf(q, a) }));
      updateCurrent({ ...current, answers: { ...current.answers, [id]: a } });
    },
    [current, bank, updateCurrent],
  );

  /** 模擬試験: 解答中の選択は下書きとして持ち、終了時にまとめて記録する */
  const draft = useCallback(
    (id: string, a: Answer | null) => {
      if (!current) return;
      const rest = { ...current.answers };
      if (a === null) delete rest[id];
      else rest[id] = a;
      updateCurrent({ ...current, answers: rest });
    },
    [current, updateCurrent],
  );

  const finishExam = useCallback(() => {
    if (!current || !bank || current.finished) return;
    const marks: Record<string, Mark> = {};
    for (const id of current.ids) {
      const q = bank.byId.get(id);
      const a = current.answers[id];
      if (q && a !== undefined) marks[id] = markOf(q, a);
    }
    setAnswers((m) => recordAnswers(m, marks));
    updateCurrent({ ...current, finished: true });
    go("result");
  }, [current, bank, updateCurrent, go]);

  const next = useCallback(() => {
    if (!current) return;
    if (current.index >= current.ids.length - 1) {
      go("result");
    } else {
      updateCurrent({ ...current, index: current.index + 1 });
    }
  }, [current, updateCurrent, go]);

  const prev = useCallback(() => {
    if (!current || current.index === 0) return;
    updateCurrent({ ...current, index: current.index - 1 });
  }, [current, updateCurrent]);

  const jump = useCallback(
    (index: number) => {
      if (!current) return;
      updateCurrent({ ...current, index });
    },
    [current, updateCurrent],
  );

  const retryWrong = useCallback(() => {
    if (!current || !bank) return;
    const ids = current.ids.filter((id) => {
      const sel = current.answers[id];
      const q = bank.byId.get(id);
      return !q || sel === undefined || markOf(q, sel) !== "o";
    });
    if (ids.length === 0) return;
    begin({ kind: "wrong", count: ids.length }, ids);
  }, [current, bank, begin]);

  if (error) return <div className="loading">読み込みに失敗しました: {error}</div>;
  if (!bank) return <div className="loading">問題データを読み込み中…</div>;

  const homePage = (
    <Home
      questions={bank.questions}
      sets={bank.sets}
      answers={answers}
      bookmarks={bookmarks}
      current={current}
      onStart={start}
      onResume={() => go("quiz")}
      onDiscard={() => updateCurrent(null)}
      onOpenStats={() => go("stats")}
      onOpenReview={() => go("review")}
    />
  );

  let page;
  switch (view) {
    case "quiz":
      page = current ? (
        <Quiz
          state={current}
          byId={bank.byId}
          bookmarks={bookmarks}
          onAnswer={answer}
          onDraft={draft}
          onNext={next}
          onPrev={prev}
          onJump={jump}
          onFinishExam={finishExam}
          onToggleBookmark={(id) => setBookmarks((b) => toggleBookmark(b, id))}
          onExit={home}
        />
      ) : null;
      break;
    case "result":
      page = current ? (
        <Result
          state={current}
          byId={bank.byId}
          onOpen={(i) => {
            updateCurrent({ ...current, index: i });
            go("quiz");
          }}
          onRetryWrong={retryWrong}
          onHome={() => {
            updateCurrent(null);
            home();
          }}
        />
      ) : null;
      break;
    case "stats":
      page = (
        <Stats
          questions={bank.questions}
          sets={bank.sets}
          answers={answers}
          onBack={home}
          onReset={() => {
            clearAll();
            setAnswers({});
            setBookmarks(new Set());
            setCurrent(null);
          }}
        />
      );
      break;
    case "review":
      page = (
        <Review
          questions={bank.questions}
          sets={bank.sets}
          answers={answers}
          bookmarks={bookmarks}
          onStart={start}
          onOpen={(id) => start({ kind: "single", id })}
          onBack={home}
        />
      );
      break;
    default:
      page = homePage;
  }

  return (
    <div className="app">
      {page ?? homePage}
      {needRefresh[0] && (
        <div className="toast">
          新しいバージョンがあります
          <button onClick={() => updateServiceWorker(true)}>更新</button>
        </div>
      )}
    </div>
  );
}
