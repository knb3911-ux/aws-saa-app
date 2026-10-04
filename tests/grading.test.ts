import { test } from "node:test";
import assert from "node:assert/strict";
import { isCorrect, markOf, toggleChoice, remainingSeconds, formatClock } from "../src/quiz/grading.ts";

const single = { answers: ["B" as const] };
const multi = { answers: ["A" as const, "D" as const] };

test("単一選択の採点", () => {
  assert.equal(isCorrect(single, ["B"]), true);
  assert.equal(isCorrect(single, ["A"]), false);
});

test("複数選択は集合の完全一致（順序不問・過不足は不正解）", () => {
  assert.equal(isCorrect(multi, ["A", "D"]), true);
  assert.equal(isCorrect(multi, ["D", "A"]), true);
  assert.equal(isCorrect(multi, ["A"]), false);
  assert.equal(isCorrect(multi, ["A", "D", "E"]), false);
  assert.equal(isCorrect(multi, ["A", "E"]), false);
});

test("markOf: わからない は ?", () => {
  assert.equal(markOf(single, "?"), "?");
  assert.equal(markOf(single, ["B"]), "o");
  assert.equal(markOf(single, ["C"]), "x");
});

test("toggleChoice は昇順を保つ", () => {
  assert.deepEqual(toggleChoice(["C"], "A"), ["A", "C"]);
  assert.deepEqual(toggleChoice(["A", "C"], "A"), ["C"]);
});

test("模擬試験の残り時間", () => {
  const start = "2026-01-01T00:00:00.000Z";
  const t0 = new Date(start).getTime();
  assert.equal(remainingSeconds(start, 130, t0), 130 * 60);
  assert.equal(remainingSeconds(start, 130, t0 + 60_000), 129 * 60);
  assert.equal(remainingSeconds(start, 130, t0 + 131 * 60_000), 0);
});

test("formatClock", () => {
  assert.equal(formatClock(130 * 60), "2:10:00");
  assert.equal(formatClock(65), "01:05");
  assert.equal(formatClock(0), "00:00");
});
