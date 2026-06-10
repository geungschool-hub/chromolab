// 즉시 뜨는 커스텀 툴팁 — 네이티브 title의 지연(약 1초)을 없앰.
// hover/focus(키보드·터치) 모두 지원. 스타일은 App.css의 .tip 참조.

import type { ReactNode } from 'react';

export function Tip({ text, children }: { text: string; children: ReactNode }) {
  return (
    <span className="tip" data-tip={text} tabIndex={0} role="note" aria-label={text}>
      {children}
    </span>
  );
}
