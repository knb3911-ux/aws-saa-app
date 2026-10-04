# CLAUDE.md

このリポジトリで作業する Claude 向けの運用ルール。

- 仕様: [SPEC.md](SPEC.md)
- 実装状況・タスク: [TASKS.md](TASKS.md)
- 使い方: [README.md](README.md)

## 1. プロジェクトの目的

AWS 認定ソリューションアーキテクト – アソシエイト（**SAA-C03**）の練習問題を、スマホで解く個人用 PWA。
同作者の `knb3911-ux/ipa-ap-app`（応用情報 科目A 過去問アプリ）と同じ使い勝手にしている。

## 2. 問題データの絶対ルール

- 問題はすべて **Claude が書くオリジナル**。AWS の過去問・ダンプ・他サイトの問題・**AWS 公式のサンプル問題は一切使わない、参照して言い換えることもしない**
  - AWS は過去問を公開しておらず、試験内容は NDA で持ち出し禁止のため
- 解説は自分の知識だけで書く。他サイトの解説を取り込まない
- 試験ガイド（公式）の 4 分野と出題比率に合わせる: セキュア 30% / 障害に強い 26% / 高パフォーマンス 24% / コスト最適化 20%
- 1 セット = 65 問 = セキュア 20 / 障害に強い 17 / 高パフォーマンス 16 / コスト 12（`src/data/domains.ts` の `EXAM_QUOTA`）
- シナリオ型。単一選択（4 択 A〜D）と複数選択（5〜6 択、2〜3 個選ぶ）を混在させる（1 セットあたり 6〜14 問が複数選択）
- 全問に日本語の解説を付ける。**正答の根拠**と、**誤答肢がなぜ違うか**（全選択肢の記号に言及する。テストで検査している）
- 各セットの単一選択の正答位置（A〜D）が偏らないようにする（テストで検査）

## 3. 技術スタック

- Vite + React 19 + TypeScript、vite-plugin-pwa（Workbox precache）。ルーターは無し（`App.tsx` の `view` state + history API）
- 学習データは localStorage のみ（`src/store/progress.ts`、キーは `saa:` 接頭辞）。バックエンド無し
- テスト: `node --test`（`tests/`）
- 公開: GitHub Pages（`.github/workflows/deploy.yml`、`base: /aws-saa-app/`）。main への push でデプロイ

## 4. ディレクトリ

```
data/questions/set<N>.json   問題のソース（人手/Claude 執筆。ここを編集する）
tools/merge.ts               ソースを検証・変換 → public/data/ を生成
public/data/                 配信用データ（merge.ts の出力。直接編集しない）
src/                         アプリ本体（pages/ components/ quiz/ store/ data/）
tests/                       データ整合性・出題・採点のテスト
```

## 5. コマンド

| コマンド | 内容 |
|---|---|
| `npm run dev` | 開発サーバー（`http://localhost:5173/aws-saa-app/`） |
| `npm run build` / `npm run preview` | 本番ビルド / プレビュー（SW の動作確認はこちら） |
| `npm test` | テスト |
| `npm run lint` | oxlint |
| `npm run merge` | `data/questions` → `public/data` を再生成（問題を編集したら必ず実行） |

## 6. 問題の追加・修正手順

1. `data/questions/set<N>.json` を編集する。形式:

   ```json
   {
     "number": 1,
     "domain": "secure | resilient | performance | cost",
     "topic": "IAM ロール",
     "text": "シナリオ付きの問題文",
     "choices": { "A": "…", "B": "…", "C": "…", "D": "…" },
     "answers": ["B"],
     "explanation": "正答: B\n根拠…\nA: なぜ違うか\nC: …\nD: …"
   }
   ```

   複数選択は `choices` を E（まれに F）まで、`answers` を 2〜3 個にする。`select` は `answers` の個数から自動で決まる。
2. `npm run merge` → `npm test` → commit / push（main への push でデプロイ）

## 7. 遵守事項

- 選択肢の順序をシャッフルしない
- 色はすべて `src/index.css` の CSS 変数で定義し、コンポーネントにハードコードしない
- UI を変えたらモバイル幅（375px）のスクリーンショットで確認する（ライト・ダーク両方）
- `public/data/` を手で編集しない（`merge.ts` の出力）
- ドキュメント（README、SPEC、TASKS など）は日本語で書く
- main に直接 push してよい
