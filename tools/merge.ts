// data/questions/set*.json（人手で執筆したソース）→ 検証 → public/data/（配信用）を生成する。
// 使い方: npm run merge
import { readdirSync, readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import type { ChoiceKey, Domain, Question, SetInfo } from "../src/types.ts";

const ROOT = join(import.meta.dirname, "..");
const SRC = join(ROOT, "data", "questions");
const OUT = join(ROOT, "public", "data");

export type RawQuestion = {
  number: number;
  domain: Domain;
  topic?: string;
  text: string;
  choices: Partial<Record<ChoiceKey, string>>;
  answers: ChoiceKey[];
  explanation: string;
};
export type RawSet = { set: number; label: string; questions: RawQuestion[] };

const KEY_ORDER: ChoiceKey[] = ["A", "B", "C", "D", "E", "F"];

/** ソースの 1 セットを配信用の Question[] に変換する */
export function buildSet(raw: RawSet): Question[] {
  return raw.questions.map((r) => {
    const choices = KEY_ORDER.filter((k) => r.choices[k] !== undefined).map((k) => ({ key: k, text: r.choices[k]! }));
    const answers = [...r.answers].sort();
    return {
      id: `s${raw.set}-${String(r.number).padStart(2, "0")}`,
      set: raw.set,
      number: r.number,
      domain: r.domain,
      ...(r.topic ? { topic: r.topic } : {}),
      text: r.text,
      choices,
      answers,
      select: answers.length,
      explanation: r.explanation,
      source: `セット${raw.set} 問${r.number}`,
    };
  });
}

export function readSources(dir = SRC): RawSet[] {
  return readdirSync(dir)
    .filter((f) => /^set\d+\.json$/.test(f))
    .sort((a, b) => parseInt(a.slice(3)) - parseInt(b.slice(3)))
    .map((f) => JSON.parse(readFileSync(join(dir, f), "utf8")) as RawSet);
}

export function buildAll(): { index: { sets: SetInfo[] }; files: Map<number, { questions: Question[] }> } {
  const sets = readSources();
  const files = new Map<number, { questions: Question[] }>();
  const infos: SetInfo[] = [];
  for (const raw of sets) {
    const questions = buildSet(raw);
    files.set(raw.set, { questions });
    infos.push({ set: raw.set, label: raw.label, count: questions.length });
  }
  return { index: { sets: infos }, files };
}

function main() {
  const { index, files } = buildAll();
  rmSync(join(OUT, "questions"), { recursive: true, force: true });
  mkdirSync(join(OUT, "questions"), { recursive: true });
  for (const [set, body] of files) {
    writeFileSync(join(OUT, "questions", `set${set}.json`), JSON.stringify(body) + "\n");
  }
  writeFileSync(join(OUT, "index.json"), JSON.stringify(index, null, 2) + "\n");
  console.log(`${index.sets.map((s) => `${s.label}: ${s.count}問`).join(" / ")}`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
