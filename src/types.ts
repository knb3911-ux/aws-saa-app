export type ChoiceKey = "A" | "B" | "C" | "D" | "E" | "F";
export const CHOICE_KEYS: ChoiceKey[] = ["A", "B", "C", "D", "E", "F"];

/** SAA-C03 試験ガイドの 4 分野 */
export type Domain = "secure" | "resilient" | "performance" | "cost";

export type Question = {
  id: string; // "s1-12"
  set: number; // 1..3
  number: number; // セット内の問番号
  domain: Domain;
  /** 主題となるサービス・論点（任意。解説の見出しに出す） */
  topic?: string;
  text: string;
  choices: { key: ChoiceKey; text: string }[];
  /** 正答（昇順）。1 つなら単一選択、2 つ以上なら複数選択 */
  answers: ChoiceKey[];
  /** 選ぶ数（= answers.length） */
  select: number;
  explanation: string;
  source: string;
};

export type SetInfo = { set: number; label: string; count: number };

/** 解答結果: o=正解, x=不正解, ?=わからない */
export type Mark = "o" | "x" | "?";

export type AnswerLog = { history: Mark[]; last: string };

/** 解答 = 選んだ記号の昇順配列。"?" はわからない */
export type Answer = ChoiceKey[] | "?";

export type QuizMode =
  | { kind: "random"; count: number }
  | { kind: "domain"; domain: Domain; count: number }
  | { kind: "set"; set: number }
  | { kind: "wrong"; count: number }
  | { kind: "bookmark"; count: number }
  | { kind: "unanswered"; count: number }
  | { kind: "exam" }
  | { kind: "single"; id: string };

export type QuizState = {
  mode: QuizMode;
  ids: string[];
  index: number;
  /** 解答済み（模擬試験では下書きを含む）の問題 → 解答 */
  answers: Record<string, Answer>;
  startedAt: string;
  /** 模擬試験で採点・履歴記録まで終えたら true */
  finished?: boolean;
};
