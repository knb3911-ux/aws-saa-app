import type { Domain } from "../types";

export const DOMAINS: Domain[] = ["secure", "resilient", "performance", "cost"];

export const DOMAIN_LABEL: Record<Domain, string> = {
  secure: "セキュアなアーキテクチャ",
  resilient: "障害に強いアーキテクチャ",
  performance: "高パフォーマンスなアーキテクチャ",
  cost: "コストを最適化したアーキテクチャ",
};

export const DOMAIN_SHORT: Record<Domain, string> = {
  secure: "セキュア",
  resilient: "障害に強い",
  performance: "高パフォーマンス",
  cost: "コスト最適化",
};

export const DOMAIN_ICON: Record<Domain, string> = {
  secure: "🔐",
  resilient: "🛟",
  performance: "⚡",
  cost: "💰",
};

/** 試験ガイドの出題比率（%） */
export const DOMAIN_PERCENT: Record<Domain, number> = {
  secure: 30,
  resilient: 26,
  performance: 24,
  cost: 20,
};

/** 65 問に対する各分野の問題数（30/26/24/20% を 65 問に丸めた値） */
export const EXAM_QUOTA: Record<Domain, number> = {
  secure: 20,
  resilient: 17,
  performance: 16,
  cost: 12,
};

export const EXAM_COUNT = 65;
export const EXAM_MINUTES = 130;
