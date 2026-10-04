import { test } from "node:test";
import assert from "node:assert/strict";
import { selectQuestions, selectExam, computeStats, accuracy, shuffle } from "../src/quiz/selectors.ts";
import { EXAM_QUOTA, DOMAINS } from "../src/data/domains.ts";
import type { Question, AnswerLog, Domain } from "../src/types.ts";

function q(id: string, number: number, domain: Domain = "secure", set = 1): Question {
  return {
    id,
    set,
    number,
    domain,
    text: "t",
    choices: [
      { key: "A", text: "a" },
      { key: "B", text: "b" },
      { key: "C", text: "c" },
      { key: "D", text: "d" },
    ],
    answers: ["A"],
    select: 1,
    explanation: "e",
    source: "s",
  };
}

const all = [q("a-1", 1), q("a-2", 2, "cost"), q("a-3", 3, "resilient"), q("a-4", 4, "performance"), q("b-1", 1, "secure", 2)];
const log = (m: ("o" | "x" | "?")[]): AnswerLog => ({ history: m, last: "2026-01-01" });
const seq = () => 0.5; // 決定的な乱数

test("ランダム: 未解答 → 要復習 → 正解済み の順", () => {
  const answers = { "a-1": log(["o"]), "a-2": log(["x"]) };
  const ids = selectQuestions({ kind: "random", count: 5 }, all, answers, new Set(), seq);
  assert.equal(ids.indexOf("a-1"), 4);
  assert.equal(ids.indexOf("a-2"), 3);
  assert.equal(ids.length, 5);
});

test("分野別は該当分野のみ", () => {
  const ids = selectQuestions({ kind: "domain", domain: "secure", count: 10 }, all, {}, new Set(), seq);
  assert.deepEqual(ids.sort(), ["a-1", "b-1"]);
});

test("セット通しは問番号順", () => {
  const ids = selectQuestions({ kind: "set", set: 1 }, [all[2], all[0], all[1]], {}, new Set());
  assert.deepEqual(ids, ["a-1", "a-2", "a-3"]);
});

test("要復習 = 直近が x か ?", () => {
  const answers = { "a-1": log(["x", "o"]), "a-2": log(["o", "x"]), "a-3": log(["?"]) };
  const ids = selectQuestions({ kind: "wrong", count: 10 }, all, answers, new Set(), seq);
  assert.deepEqual(ids.sort(), ["a-2", "a-3"]);
});

test("未解答・ブックマーク・single", () => {
  const answers = { "a-1": log(["o"]) };
  assert.equal(selectQuestions({ kind: "unanswered", count: 10 }, all, answers, new Set(), seq).includes("a-1"), false);
  assert.deepEqual(selectQuestions({ kind: "bookmark", count: 10 }, all, answers, new Set(["a-3"]), seq), ["a-3"]);
  assert.deepEqual(selectQuestions({ kind: "single", id: "x" }, all, answers, new Set()), ["x"]);
});

test("模擬試験: 分野ごとの出題数が比率どおり", () => {
  const bank: Question[] = [];
  let n = 0;
  for (const d of DOMAINS) for (let i = 0; i < EXAM_QUOTA[d] * 2; i++) bank.push(q(`x-${n}`, ++n, d));
  const ids = selectExam(bank, {}, Math.random);
  assert.equal(ids.length, 65);
  assert.equal(new Set(ids).size, 65);
  for (const d of DOMAINS) {
    assert.equal(ids.filter((id) => bank.find((b) => b.id === id)!.domain === d).length, EXAM_QUOTA[d]);
  }
});

test("模擬試験: 問題が足りなければある分だけ", () => {
  assert.equal(selectExam(all, {}, seq).length, all.length);
});

test("統計と正答率", () => {
  const s = computeStats(all, { "a-1": log(["o"]), "a-2": log(["x"]), "a-3": log(["?"]) });
  assert.deepEqual(s, { total: 5, answered: 3, correct: 1, wrong: 1, unknown: 1 });
  assert.equal(accuracy(s), 33);
  assert.equal(accuracy(computeStats(all, {})), null);
});

test("shuffle は要素を保つ", () => {
  assert.deepEqual(shuffle([1, 2, 3, 4], seq).sort(), [1, 2, 3, 4]);
});
