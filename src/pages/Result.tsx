import type { Question, QuizState } from "../types";
import { TopBar } from "../components/TopBar";
import { describeMode } from "../quiz/describe";
import { markOf } from "../quiz/grading";
import { DOMAINS, DOMAIN_SHORT } from "../data/domains";

type Props = {
  state: QuizState;
  byId: Map<string, Question>;
  onOpen: (index: number) => void;
  onRetryWrong: () => void;
  onHome: () => void;
};

/** 試験ガイドの合格スコアは 720/1000（スケールスコア）。素点との対応は非公開なので、あくまで目安として 72% を表示する */
const PASS_GUIDE = 72;

export function Result(p: Props) {
  const { ids, answers } = p.state;
  const exam = p.state.mode.kind === "exam";
  let correct = 0;
  let wrong = 0;
  let unknown = 0;
  const rows = ids.map((id, i) => {
    const q = p.byId.get(id)!;
    const a = answers[id];
    const mark = a === undefined ? "none" : markOf(q, a) === "o" ? "o" : markOf(q, a) === "x" ? "x" : "u";
    if (mark === "o") correct++;
    else if (mark === "x") wrong++;
    else if (mark === "u") unknown++;
    return { q, i, mark };
  });
  const answered = correct + wrong + unknown;
  // 模擬試験は未解答も不正解として数える
  const denom = exam ? ids.length : answered;
  const rate = denom ? Math.round((correct / denom) * 100) : 0;

  const byDomain = DOMAINS.map((d) => {
    const r = rows.filter((x) => x.q.domain === d);
    return { d, total: r.length, ok: r.filter((x) => x.mark === "o").length };
  }).filter((x) => x.total > 0);

  return (
    <>
      <TopBar title="結果" onBack={p.onHome} />
      <main className="content">
        <section className="card">
          <div className="result-score">
            <div className="muted small">{describeMode(p.state.mode)}</div>
            <div className="big num">
              {correct} <span className="muted" style={{ fontSize: 20 }}>/ {denom}</span>
            </div>
            <div className="muted">
              正答率 {rate}%
              {unknown > 0 && ` ・ わからない ${unknown}`}
              {exam && ids.length - answered > 0 && ` ・ 未解答 ${ids.length - answered}`}
            </div>
            {exam && (
              <div className="small muted" style={{ marginTop: 4 }}>
                本番の合格ライン（720/1000）は素点換算が非公開のため、目安として {PASS_GUIDE}% 以上を目標に
              </div>
            )}
          </div>
          <div className="progress" style={{ marginTop: 8 }} aria-hidden>
            <i className="o" style={{ width: `${(correct / ids.length) * 100}%` }} />
            <i className="x" style={{ width: `${(wrong / ids.length) * 100}%` }} />
            <i className="u" style={{ width: `${(unknown / ids.length) * 100}%` }} />
          </div>
        </section>

        {byDomain.length > 1 && (
          <section className="card">
            <h2>分野別</h2>
            {byDomain.map((x) => (
              <div key={x.d} className="row small" style={{ padding: "3px 0" }}>
                <span>{DOMAIN_SHORT[x.d]}</span>
                <span className="spacer" />
                <span className="num">
                  {x.ok} / {x.total}（{Math.round((x.ok / x.total) * 100)}%）
                </span>
              </div>
            ))}
          </section>
        )}

        <div className="row" style={{ margin: "12px 0" }}>
          <button className="btn" style={{ flex: 1 }} onClick={p.onRetryWrong} disabled={correct === ids.length}>
            間違えた問題をもう一度
          </button>
          <button className="btn primary" style={{ flex: 1 }} onClick={p.onHome}>
            ホームへ
          </button>
        </div>

        <div className="qlist">
          {rows.map(({ q, i, mark }) => (
            <button key={q.id} className="qitem" onClick={() => p.onOpen(i)}>
              <span className={"mark " + mark}>{mark === "o" ? "○" : mark === "x" ? "✕" : mark === "u" ? "?" : "–"}</span>
              <span className="body">
                <div className="src">
                  {q.source} ・ {DOMAIN_SHORT[q.domain]}
                  {q.select > 1 ? ` ・ ${q.select}つ選択` : ""}
                </div>
                <div className="txt">{q.text}</div>
              </span>
            </button>
          ))}
        </div>
      </main>
    </>
  );
}
