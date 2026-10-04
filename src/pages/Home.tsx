import type { Question, QuizMode, QuizState, AnswerLog, SetInfo } from "../types";
import { DOMAINS, DOMAIN_ICON, DOMAIN_LABEL, DOMAIN_PERCENT, EXAM_COUNT, EXAM_MINUTES } from "../data/domains";
import { computeStats, accuracy } from "../quiz/selectors";
import { needsReview } from "../store/progress";
import { TopBar } from "../components/TopBar";
import { describeMode } from "../quiz/describe";

type Props = {
  questions: Question[];
  sets: SetInfo[];
  answers: Record<string, AnswerLog>;
  bookmarks: Set<string>;
  current: QuizState | null;
  onStart: (mode: QuizMode) => void;
  onResume: () => void;
  onDiscard: () => void;
  onOpenStats: () => void;
  onOpenReview: () => void;
};

export function Home(p: Props) {
  const stats = computeStats(p.questions, p.answers);
  const acc = accuracy(stats);
  const reviewCount = p.questions.filter((q) => needsReview(p.answers[q.id])).length;
  const bookmarkCount = p.questions.filter((q) => p.bookmarks.has(q.id)).length;
  const unanswered = stats.total - stats.answered;
  const resumable = p.current && !p.current.finished ? p.current : null;
  const remaining = resumable ? resumable.ids.length - Object.keys(resumable.answers).length : 0;
  const examCount = Math.min(EXAM_COUNT, p.questions.length);

  return (
    <>
      <TopBar
        title="AWS SAA-C03 練習問題"
        right={
          <button className="icon-btn" onClick={p.onOpenStats} aria-label="統計">
            📊
          </button>
        }
      />
      <main className="content">
        <section className="card">
          <div className="hero">
            <div>
              <div className="v num">{stats.answered}</div>
              <div className="k">解答済み / {stats.total}</div>
            </div>
            <div>
              <div className="v num">{acc === null ? "–" : `${acc}%`}</div>
              <div className="k">正答率</div>
            </div>
            <div>
              <div className="v num">{reviewCount}</div>
              <div className="k">要復習</div>
            </div>
          </div>
          <div className="progress" style={{ marginTop: 12 }} aria-hidden>
            <i className="o" style={{ width: pct(stats.correct, stats.total) }} />
            <i className="x" style={{ width: pct(stats.wrong, stats.total) }} />
            <i className="u" style={{ width: pct(stats.unknown, stats.total) }} />
          </div>
        </section>

        {resumable && remaining > 0 && (
          <section className="card">
            <h2>続きから</h2>
            <div className="row">
              <div>
                <div>{describeMode(resumable.mode)}</div>
                <div className="small muted">
                  {resumable.mode.kind === "exam" ? "解答済み" : "残り"} {resumable.mode.kind === "exam" ? resumable.ids.length - remaining : remaining} 問
                  {resumable.mode.kind === "exam" ? `（全 ${resumable.ids.length} 問）` : ""}
                </div>
              </div>
              <div className="spacer" />
              <button className="btn" onClick={p.onDiscard}>
                破棄
              </button>
              <button className="btn primary" onClick={p.onResume}>
                再開
              </button>
            </div>
          </section>
        )}

        <h2 className="muted small section-title">模擬試験</h2>
        <div className="mode-list">
          <ModeButton
            icon="⏱️"
            title={`模擬試験 ${examCount} 問・${EXAM_MINUTES} 分`}
            desc="分野の比率は本番と同じ。終了まで正誤は表示しない"
            disabled={examCount === 0}
            onClick={() => {
              if (!p.current || p.current.finished || confirm("現在の出題を破棄して模擬試験を始めますか？")) p.onStart({ kind: "exam" });
            }}
          />
        </div>

        <h2 className="muted small section-title">出題</h2>
        <div className="mode-list">
          <ModeButton icon="🎲" title="ランダム 10 問" desc="未解答 → 要復習 の順に出題" onClick={() => p.onStart({ kind: "random", count: 10 })} />
          <ModeButton
            icon="🆕"
            title="未解答から 10 問"
            desc="まだ解いていない問題だけ"
            badge={`${unanswered}`}
            disabled={unanswered === 0}
            onClick={() => p.onStart({ kind: "unanswered", count: 10 })}
          />
          <ModeButton
            icon="🔁"
            title="要復習 10 問"
            desc="不正解・わからない だった問題"
            badge={`${reviewCount}`}
            disabled={reviewCount === 0}
            onClick={() => p.onStart({ kind: "wrong", count: 10 })}
          />
          <ModeButton
            icon="⭐"
            title="ブックマーク"
            desc="★ を付けた問題"
            badge={`${bookmarkCount}`}
            disabled={bookmarkCount === 0}
            onClick={() => p.onStart({ kind: "bookmark", count: 50 })}
          />
        </div>

        <h2 className="muted small section-title">分野別（10 問）</h2>
        <div className="mode-list">
          {DOMAINS.map((d) => {
            const s = computeStats(
              p.questions.filter((q) => q.domain === d),
              p.answers,
            );
            const a = accuracy(s);
            return (
              <ModeButton
                key={d}
                icon={DOMAIN_ICON[d]}
                title={DOMAIN_LABEL[d]}
                desc={`出題比率 ${DOMAIN_PERCENT[d]}% ・ ${s.answered}/${s.total} 解答済み`}
                badge={a === null ? "–" : `${a}%`}
                onClick={() => p.onStart({ kind: "domain", domain: d, count: 10 })}
              />
            );
          })}
        </div>

        <h2 className="muted small section-title">その他</h2>
        <div className="mode-list">
          <ModeButton
            icon="📚"
            title="セット別・問題一覧"
            desc={`${p.sets.length} セットを通しで解く、問題を探す`}
            onClick={p.onOpenReview}
          />
        </div>
      </main>
    </>
  );
}

function pct(n: number, total: number): string {
  return total ? `${(n / total) * 100}%` : "0%";
}

function ModeButton(p: {
  icon: string;
  title: string;
  desc: string;
  badge?: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button className="mode-btn" onClick={p.onClick} disabled={p.disabled}>
      <span className="icon">{p.icon}</span>
      <span>
        <div className="t">{p.title}</div>
        <div className="d">{p.desc}</div>
      </span>
      {p.badge !== undefined && <span className="badge">{p.badge}</span>}
    </button>
  );
}
