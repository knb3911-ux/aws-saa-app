import { useState } from "react";
import type { Answer, ChoiceKey, Question } from "../types";
import { DOMAIN_SHORT } from "../data/domains";
import { isCorrect, toggleChoice } from "../quiz/grading";

type Props = {
  question: Question;
  /** 確定済みの解答（練習: 確定後 / 模擬: 下書き）。"?" = わからない */
  answer?: Answer;
  /**
   * practice: 答えるとすぐ正誤と解説を出す（複数選択は「回答する」で確定）
   * exam:     解答中は正誤を出さず、選択を随時 onChange で通知する
   */
  mode: "practice" | "exam";
  /** 採点済みの見直し表示。未解答でも正答と解説を出す */
  locked?: boolean;
  onAnswer?: (a: Answer) => void;
  onChange?: (a: Answer | null) => void;
};

export function QuestionCard({ question: q, answer, mode, locked, onAnswer, onChange }: Props) {
  const multi = q.select > 1;
  const [picked, setPicked] = useState<ChoiceKey[]>([]);
  const revealed = mode === "practice" && (answer !== undefined || !!locked);
  const interactive = !revealed;
  // 現在チェックされている選択肢
  const current: ChoiceKey[] = mode === "exam" ? (Array.isArray(answer) ? answer : []) : revealed ? (Array.isArray(answer) ? answer : []) : picked;
  const unknownOn = mode === "exam" && answer === "?";

  function tap(key: ChoiceKey) {
    if (!interactive) return;
    if (mode === "exam") {
      const base = Array.isArray(answer) ? answer : [];
      const next = multi ? toggleChoice(base, key) : base.includes(key) ? [] : [key];
      onChange?.(next.length ? next : null);
    } else if (multi) {
      setPicked((p) => toggleChoice(p, key));
    } else {
      onAnswer?.([key]);
    }
  }

  function unknown() {
    if (mode === "exam") onChange?.(unknownOn ? null : "?");
    else onAnswer?.("?");
  }

  return (
    <div>
      <div className="source">
        {q.source} ・ {DOMAIN_SHORT[q.domain]}
        <span className="select-pill">{multi ? `${q.select}つ選択` : "1つ選択"}</span>
      </div>
      <p className="stem">{q.text}</p>

      <div className="choices" role="group" aria-label="選択肢">
        {q.choices.map((c) => {
          const cls = ["choice"];
          const checked = current.includes(c.key);
          const isAns = q.answers.includes(c.key);
          if (revealed) {
            if (checked && isAns) cls.push("correct");
            else if (checked) cls.push("wrong");
            else if (isAns) cls.push("missed");
            else cls.push("dim");
          } else if (checked) cls.push("selected");
          return (
            <button
              key={c.key}
              className={cls.join(" ")}
              disabled={revealed}
              aria-pressed={interactive ? checked : undefined}
              onClick={() => tap(c.key)}
            >
              <span className={"key" + (multi ? " box" : "")}>{c.key}</span>
              <span className="txt">{c.text}</span>
              {revealed && isAns && <span className="tick" aria-label="正解の選択肢">✓</span>}
            </button>
          );
        })}
        {interactive && mode === "practice" && multi && (
          <button className="btn primary submit" disabled={picked.length !== q.select} onClick={() => onAnswer?.([...picked])}>
            回答する（{picked.length}/{q.select}）
          </button>
        )}
        {interactive && (
          <button className={"choice unknown" + (unknownOn ? " selected" : "")} onClick={unknown}>
            {unknownOn ? "わからない（選択中）" : "わからない"}
          </button>
        )}
      </div>

      {revealed && (
        <>
          <Verdict q={q} answer={answer} />
          <div className="explanation">
            <h3>解説{q.topic ? `（${q.topic}）` : ""}</h3>
            {q.explanation}
          </div>
        </>
      )}
    </div>
  );
}

function Verdict({ q, answer }: { q: Question; answer?: Answer }) {
  const ans = q.answers.join("・");
  if (answer === undefined) return <div className="verdict u">未解答 → 正答は「{ans}」</div>;
  if (answer === "?") return <div className="verdict u">わからない → 正答は「{ans}」</div>;
  if (isCorrect(q, answer)) return <div className="verdict o">正解！</div>;
  return <div className="verdict x">不正解 → 正答は「{ans}」</div>;
}
