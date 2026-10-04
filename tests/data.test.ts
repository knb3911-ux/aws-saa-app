import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildAll } from "../tools/merge.ts";
import { DOMAINS, EXAM_QUOTA, EXAM_COUNT } from "../src/data/domains.ts";
import type { Question } from "../src/types.ts";

const { index, files } = buildAll();
const all: Question[] = [...files.values()].flatMap((f) => f.questions);

test("セットが 1 つ以上ある", () => {
  assert.ok(index.sets.length >= 1);
});

test("ID が一意", () => {
  assert.equal(new Set(all.map((q) => q.id)).size, all.length);
});

for (const [set, { questions }] of files) {
  test(`セット${set}: 65 問・分野比率 20/17/16/12・問番号が連番`, () => {
    assert.equal(questions.length, EXAM_COUNT);
    for (const d of DOMAINS) {
      assert.equal(questions.filter((q) => q.domain === d).length, EXAM_QUOTA[d], d);
    }
    assert.deepEqual(
      questions.map((q) => q.number),
      Array.from({ length: questions.length }, (_, i) => i + 1),
    );
  });

  test(`セット${set}: 単一選択（4択）と複数選択（5択以上）の両方がある`, () => {
    const multi = questions.filter((q) => q.select > 1);
    assert.ok(multi.length >= 6 && multi.length <= 14, `複数選択 ${multi.length} 問`);
    assert.ok(questions.some((q) => q.select === 1));
  });
}

test("各問の形式: 選択肢数・正答・解説", () => {
  for (const q of all) {
    const keys = q.choices.map((c) => c.key);
    assert.deepEqual(keys, ["A", "B", "C", "D", "E", "F"].slice(0, keys.length), `${q.id}: 選択肢の記号は A から連続`);
    if (q.select === 1) assert.equal(keys.length, 4, `${q.id}: 単一選択は 4 択`);
    else assert.ok(keys.length >= 5 && keys.length <= 6, `${q.id}: 複数選択は 5〜6 択`);
    assert.ok(q.select === 1 || q.select === 2 || q.select === 3, `${q.id}: select`);
    assert.equal(new Set(q.answers).size, q.answers.length, `${q.id}: 正答の重複`);
    for (const a of q.answers) assert.ok(keys.includes(a), `${q.id}: 正答 ${a} が選択肢にない`);
    assert.ok(q.answers.length < keys.length, `${q.id}: 全選択肢が正答`);
    assert.equal(new Set(q.choices.map((c) => c.text)).size, keys.length, `${q.id}: 選択肢の重複`);
    assert.ok(q.text.length >= 40, `${q.id}: 問題文が短すぎる`);
    assert.ok(q.explanation.length >= 80, `${q.id}: 解説が短すぎる`);
    for (const c of q.choices) assert.ok(c.text.trim().length > 0, `${q.id}: 空の選択肢`);
  }
});

test("解説は正答と誤答肢の両方に触れる（全選択肢の記号が登場）", () => {
  for (const q of all) {
    for (const c of q.choices) {
      assert.match(q.explanation, new RegExp(`(^|[^A-Za-z0-9])${c.key}([^A-Za-z0-9]|$)`), `${q.id}: 解説に選択肢 ${c.key} への言及がない`);
    }
  }
});

test("正答の位置が偏っていない（単一選択）", () => {
  for (const [set, { questions }] of files) {
    const counts: Record<string, number> = {};
    for (const q of questions.filter((x) => x.select === 1)) counts[q.answers[0]] = (counts[q.answers[0]] ?? 0) + 1;
    const n = questions.filter((x) => x.select === 1).length;
    for (const k of ["A", "B", "C", "D"]) {
      const c = counts[k] ?? 0;
      assert.ok(c >= n * 0.15 && c <= n * 0.4, `セット${set}: 正答 ${k} が ${c}/${n} 問で偏っている`);
    }
  }
});

test("public/data が data/questions と一致している（npm run merge 済み）", () => {
  const pub = JSON.parse(readFileSync(join(import.meta.dirname, "..", "public", "data", "index.json"), "utf8"));
  assert.deepEqual(pub, index);
  for (const [set, body] of files) {
    const p = JSON.parse(readFileSync(join(import.meta.dirname, "..", "public", "data", "questions", `set${set}.json`), "utf8"));
    assert.deepEqual(p, body);
  }
});
