// 採点まわりの純粋関数（テスト対象）
import type { Answer, ChoiceKey, Mark, Question } from "../types.ts";

/** 選択の集合が正答と完全一致するか（順序は無関係） */
export function isCorrect(q: Pick<Question, "answers">, selected: readonly ChoiceKey[]): boolean {
  if (selected.length !== q.answers.length) return false;
  const set = new Set(selected);
  return q.answers.every((a) => set.has(a));
}

export function markOf(q: Pick<Question, "answers">, a: Answer): Mark {
  if (a === "?") return "?";
  return isCorrect(q, a) ? "o" : "x";
}

/** 複数選択のトグル。常に昇順で返す */
export function toggleChoice(sel: readonly ChoiceKey[], key: ChoiceKey): ChoiceKey[] {
  const next = sel.includes(key) ? sel.filter((k) => k !== key) : [...sel, key];
  return next.sort();
}

/** 模擬試験の残り秒数（0 未満にはならない） */
export function remainingSeconds(startedAt: string, limitMinutes: number, now: number): number {
  const end = new Date(startedAt).getTime() + limitMinutes * 60_000;
  return Math.max(0, Math.ceil((end - now) / 1000));
}

export function formatClock(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}
