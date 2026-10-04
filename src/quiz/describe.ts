import type { QuizMode } from "../types";
import { DOMAIN_LABEL } from "../data/domains";

export function describeMode(mode: QuizMode): string {
  switch (mode.kind) {
    case "random":
      return `ランダム ${mode.count} 問`;
    case "unanswered":
      return `未解答から ${mode.count} 問`;
    case "wrong":
      return `要復習 ${mode.count} 問`;
    case "bookmark":
      return "ブックマーク";
    case "domain":
      return `${DOMAIN_LABEL[mode.domain]} ${mode.count} 問`;
    case "set":
      return `セット${mode.set} 通し`;
    case "exam":
      return "模擬試験";
    case "single":
      return "1 問";
  }
}
