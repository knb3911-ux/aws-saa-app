// 出題モードから問題 ID 列を組み立てる純粋関数群（テスト対象）
import type { AnswerLog, Mark, Question, QuizMode } from "../types.ts";
import { DOMAINS, EXAM_QUOTA } from "../data/domains.ts";
import { needsReview } from "../store/progress.ts";

export type Rng = () => number;

export function shuffle<T>(items: T[], rng: Rng = Math.random): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * ランダム出題は「未解答 → 要復習 → 正解済み」の優先順で、同じ優先度内はシャッフル。
 * 通勤中の短い時間で未着手の問題から順に潰していける。
 */
function prioritized(questions: Question[], answers: Record<string, AnswerLog>, rng: Rng): Question[] {
  const unanswered: Question[] = [];
  const review: Question[] = [];
  const done: Question[] = [];
  for (const q of questions) {
    const log = answers[q.id];
    if (!log) unanswered.push(q);
    else if (needsReview(log)) review.push(q);
    else done.push(q);
  }
  return [...shuffle(unanswered, rng), ...shuffle(review, rng), ...shuffle(done, rng)];
}

/**
 * 模擬試験: 試験ガイドの比率（EXAM_QUOTA）で各分野から選び、出題順は全体をシャッフルする。
 * 収録問題が 65 問に満たない分野があれば、ある分だけ出す。
 */
export function selectExam(all: Question[], answers: Record<string, AnswerLog>, rng: Rng = Math.random): string[] {
  const picked: Question[] = [];
  for (const d of DOMAINS) {
    picked.push(...prioritized(all.filter((q) => q.domain === d), answers, rng).slice(0, EXAM_QUOTA[d]));
  }
  return shuffle(picked, rng).map((q) => q.id);
}

export function selectQuestions(
  mode: QuizMode,
  all: Question[],
  answers: Record<string, AnswerLog>,
  bookmarks: Set<string>,
  rng: Rng = Math.random,
): string[] {
  switch (mode.kind) {
    case "random":
      return prioritized(all, answers, rng).slice(0, mode.count).map((q) => q.id);
    case "domain":
      return prioritized(all.filter((q) => q.domain === mode.domain), answers, rng)
        .slice(0, mode.count)
        .map((q) => q.id);
    case "set":
      return all
        .filter((q) => q.set === mode.set)
        .sort((a, b) => a.number - b.number)
        .map((q) => q.id);
    case "wrong":
      return shuffle(all.filter((q) => needsReview(answers[q.id])), rng)
        .slice(0, mode.count)
        .map((q) => q.id);
    case "bookmark":
      return shuffle(all.filter((q) => bookmarks.has(q.id)), rng)
        .slice(0, mode.count)
        .map((q) => q.id);
    case "unanswered":
      return shuffle(all.filter((q) => !answers[q.id]), rng)
        .slice(0, mode.count)
        .map((q) => q.id);
    case "exam":
      return selectExam(all, answers, rng);
    case "single":
      return [mode.id];
  }
}

export type Stats = { total: number; answered: number; correct: number; wrong: number; unknown: number };

/** 直近の結果ベースの集計 */
export function computeStats(questions: Question[], answers: Record<string, AnswerLog>): Stats {
  const s: Stats = { total: questions.length, answered: 0, correct: 0, wrong: 0, unknown: 0 };
  for (const q of questions) {
    const log = answers[q.id];
    const m: Mark | undefined = log?.history[log.history.length - 1];
    if (!m) continue;
    s.answered++;
    if (m === "o") s.correct++;
    else if (m === "x") s.wrong++;
    else s.unknown++;
  }
  return s;
}

export function accuracy(s: Stats): number | null {
  return s.answered ? Math.round((s.correct / s.answered) * 100) : null;
}

