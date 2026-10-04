import type { Question, AnswerLog, SetInfo } from "../types";
import { DOMAINS, DOMAIN_LABEL, DOMAIN_PERCENT } from "../data/domains";
import { computeStats, accuracy, type Stats as S } from "../quiz/selectors";
import { TopBar } from "../components/TopBar";

type Props = {
  questions: Question[];
  sets: SetInfo[];
  answers: Record<string, AnswerLog>;
  onBack: () => void;
  onReset: () => void;
};

export function Stats(p: Props) {
  const total = computeStats(p.questions, p.answers);
  const multi = p.questions.filter((q) => q.select > 1);

  return (
    <>
      <TopBar title="統計" onBack={p.onBack} />
      <main className="content">
        <section className="card">
          <h2>全体</h2>
          <BarRow label="全問題" s={total} />
          <BarRow label="単一選択" s={computeStats(p.questions.filter((q) => q.select === 1), p.answers)} />
          {multi.length > 0 && <BarRow label="複数選択" s={computeStats(multi, p.answers)} />}
        </section>

        <section className="card">
          <h2>分野別</h2>
          {DOMAINS.map((d) => (
            <BarRow
              key={d}
              label={`${DOMAIN_LABEL[d]}（${DOMAIN_PERCENT[d]}%）`}
              s={computeStats(p.questions.filter((q) => q.domain === d), p.answers)}
            />
          ))}
        </section>

        <section className="card">
          <h2>セット別</h2>
          {p.sets.map((s) => (
            <BarRow key={s.set} label={s.label} s={computeStats(p.questions.filter((q) => q.set === s.set), p.answers)} />
          ))}
        </section>

        <section className="card">
          <h2>データ</h2>
          <p className="small muted">
            学習履歴はこの端末のブラウザ内にのみ保存されます。別の端末とは同期されません。
          </p>
          <button
            className="btn"
            onClick={() => {
              if (confirm("解答履歴とブックマークをすべて削除します。よろしいですか？")) p.onReset();
            }}
          >
            学習履歴をリセット
          </button>
        </section>
      </main>
    </>
  );
}

function BarRow({ label, s }: { label: string; s: S }) {
  const a = accuracy(s);
  return (
    <div className="bar-row">
      <div className="lbl">{label}</div>
      <div>
        <div className="progress" aria-hidden>
          <i className="o" style={{ width: `${(s.correct / s.total) * 100}%` }} />
          <i className="x" style={{ width: `${(s.wrong / s.total) * 100}%` }} />
          <i className="u" style={{ width: `${(s.unknown / s.total) * 100}%` }} />
        </div>
        <div className="small muted num" style={{ fontSize: 11 }}>
          {s.answered}/{s.total} 解答 ・ ○{s.correct} ✕{s.wrong} ?{s.unknown}
        </div>
      </div>
      <div className="pct">{a === null ? "–" : `${a}%`}</div>
    </div>
  );
}
