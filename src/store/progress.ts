// localStorage に保存する学習データ。バックエンドは無い。
import type { AnswerLog, Mark, QuizState } from "../types.ts";

const KEY_ANSWERS = "saa:answers";
const KEY_BOOKMARKS = "saa:bookmarks";
const KEY_CURRENT = "saa:current";

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 容量超過・プライベートモードなどは無視（学習は続行できる）
  }
}

export type AnswerMap = Record<string, AnswerLog>;

export function loadAnswers(): AnswerMap {
  return read<AnswerMap>(KEY_ANSWERS, {});
}

/** 履歴に 1 件追加して保存する（履歴は直近 20 件まで） */
export function recordAnswers(map: AnswerMap, marks: Record<string, Mark>): AnswerMap {
  const now = new Date().toISOString();
  const next = { ...map };
  for (const [id, mark] of Object.entries(marks)) {
    const history = [...(next[id]?.history ?? []), mark].slice(-20);
    next[id] = { history, last: now };
  }
  write(KEY_ANSWERS, next);
  return next;
}

export function loadBookmarks(): Set<string> {
  return new Set(read<string[]>(KEY_BOOKMARKS, []));
}

export function toggleBookmark(set: Set<string>, id: string): Set<string> {
  const next = new Set(set);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  write(KEY_BOOKMARKS, [...next]);
  return next;
}

export function loadCurrent(): QuizState | null {
  return read<QuizState | null>(KEY_CURRENT, null);
}

export function saveCurrent(state: QuizState | null): void {
  try {
    if (state) localStorage.setItem(KEY_CURRENT, JSON.stringify(state));
    else localStorage.removeItem(KEY_CURRENT);
  } catch {
    // 保存できなくても続行する
  }
}

export function clearAll(): void {
  try {
    localStorage.removeItem(KEY_ANSWERS);
    localStorage.removeItem(KEY_BOOKMARKS);
    localStorage.removeItem(KEY_CURRENT);
  } catch {
    // 無視
  }
}

/** 直近の結果。未解答なら undefined */
export function lastMark(log: AnswerLog | undefined): Mark | undefined {
  return log?.history[log.history.length - 1];
}

/** 「要復習」= 直近が不正解またはわからない */
export function needsReview(log: AnswerLog | undefined): boolean {
  const m = lastMark(log);
  return m === "x" || m === "?";
}
