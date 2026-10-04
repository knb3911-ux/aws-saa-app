import type { ReactNode } from "react";

type Props = {
  title: string;
  sub?: string;
  onBack?: () => void;
  right?: ReactNode;
};

export function TopBar({ title, sub, onBack, right }: Props) {
  return (
    <header className="topbar">
      {onBack && (
        <button className="icon-btn" onClick={onBack} aria-label="戻る">
          ‹
        </button>
      )}
      <h1>{title}</h1>
      {sub && <span className="sub">{sub}</span>}
      {right}
    </header>
  );
}
