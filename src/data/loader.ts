import type { Question, SetInfo } from "../types";

export type QuestionBank = {
  sets: SetInfo[];
  questions: Question[];
  byId: Map<string, Question>;
};

const BASE = import.meta.env.BASE_URL;

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(BASE + path);
  if (!res.ok) throw new Error(`${path}: ${res.status}`);
  return (await res.json()) as T;
}

export async function loadBank(): Promise<QuestionBank> {
  const index = await fetchJson<{ sets: SetInfo[] }>("data/index.json");
  const files = await Promise.all(
    index.sets.map((s) => fetchJson<{ questions: Question[] }>(`data/questions/set${s.set}.json`)),
  );
  const questions = files.flatMap((f) => f.questions);
  return { sets: index.sets, questions, byId: new Map(questions.map((q) => [q.id, q])) };
}
