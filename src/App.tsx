// ChromoLab 메인 셸 — 단계별 화면을 탭으로 전환.
// 1단계: 진리표 점검 / 2단계: 해부 뷰(F1) + 드래그 엔진 데모.
// ⚠️ 3~5단계(시뮬레이터·그래프·퀴즈)는 이후 features/ 아래에 추가된다.

import { useState, lazy, Suspense } from 'react';
import { mitosisPhases, meiosisPhases, DEFAULT_DIPLOID } from './domain/phases';
import type { PhaseFacts } from './domain/types';
import { toCValue } from './domain/types';
import { AnatomyView } from './features/anatomy/AnatomyView';
import { Tip } from './components/Tip';
import { readTeacherMode } from './app/teacherMode';
import './App.css';

// 그래프(Recharts)는 무거우므로 시뮬레이터 탭에서만 지연 로드 — 초기 번들 경량 유지(성능 예산)
const MitosisSimulator = lazy(() =>
  import('./features/mitosis/MitosisSimulator').then((m) => ({ default: m.MitosisSimulator })),
);
const MeiosisSimulator = lazy(() =>
  import('./features/meiosis/MeiosisSimulator').then((m) => ({ default: m.MeiosisSimulator })),
);
const QuizView = lazy(() =>
  import('./features/quiz/QuizView').then((m) => ({ default: m.QuizView })),
);
const CompareView = lazy(() =>
  import('./features/compare/CompareView').then((m) => ({ default: m.CompareView })),
);
const DiversityView = lazy(() =>
  import('./features/diversity/DiversityView').then((m) => ({ default: m.DiversityView })),
);

type Tab = 'truth' | 'anatomy' | 'mitosis' | 'meiosis' | 'compare' | 'diversity' | 'quiz';

const TABS: { id: Tab; label: string }[] = [
  { id: 'anatomy', label: '① 염색체 해부 (F1)' },
  { id: 'mitosis', label: '② 체세포분열 (F2)' },
  { id: 'meiosis', label: '③ 감수분열 (F3)' },
  { id: 'compare', label: '④ 비교 (F6)' },
  { id: 'diversity', label: '⑤ 생식세포 다양성' },
  { id: 'quiz', label: '⑥ 퀴즈 (F7)' },
  { id: 'truth', label: '정리표' },
];

function PhaseTable({ title, phases }: { title: string; phases: PhaseFacts[] }) {
  return (
    <section className="phase-block">
      <h2>{title}</h2>
      <table>
        <thead>
          <tr>
            <th>시기</th>
            <th>핵상</th>
            <th>염색체 수</th>
            <th>염색분체 수</th>
            <th>DNA 상대량 (C값)</th>
            <th>분리 대상</th>
          </tr>
        </thead>
        <tbody>
          {phases.map((p) => (
            <tr key={p.id} className={p.stage === 'interphase' ? 'interphase' : ''}>
              <td className="phase-name">
                {p.labelKo}
                {p.transientNotice && (
                  <Tip text={p.transientNotice}>
                    <span className="transient-badge">참고</span>
                  </Tip>
                )}
              </td>
              <td>
                <span className={`ploidy ploidy-${p.ploidy}`}>{p.ploidy}</span>
              </td>
              <td>
                {p.chromosomeCount}
                {p.perPole && <span className="per-pole"> (극당 {p.perPole.chromosomeCount})</span>}
              </td>
              <td>{p.chromatidCount}</td>
              <td>
                {p.dnaRelative} <span className="cval">({toCValue(p.dnaRelative)})</span>
                {p.dnaReplication && (
                  <span className="dna-rep" title="DNA 복제 시점">
                    ⬆ 복제
                  </span>
                )}
                {p.graphAnnotation?.includes('복제 없음') && (
                  <span className="dna-norep" title={p.graphAnnotation}>
                    복제 없음
                  </span>
                )}
              </td>
              <td>
                {p.separationEvent === 'homolog' && <span className="sep homolog">상동염색체</span>}
                {p.separationEvent === 'chromatid' && (
                  <span className="sep chromatid">염색분체</span>
                )}
                {!p.separationEvent && <span className="sep none">–</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function TruthView() {
  return (
    <>
      <p className="note">
        아래 값은 <code>domain/phases.ts</code> 한 곳에서 나오며, 시뮬레이터·그래프·퀴즈가 모두 이
        값을 참조합니다. (단위 테스트 36종 통과)
      </p>
      <PhaseTable title="체세포분열 (Mitosis)" phases={mitosisPhases} />
      <PhaseTable title="감수분열 (Meiosis)" phases={meiosisPhases} />
    </>
  );
}

function App() {
  const [tab, setTab] = useState<Tab>('mitosis');
  const teacher = readTeacherMode();

  return (
    <div className={`app ${teacher.enabled ? 'teacher-mode' : ''}`}>
      <header className="app-header">
        <h1>🧬 ChromoLab{teacher.enabled && <span className="teacher-tag">교사 모드</span>}</h1>
        <p className="subtitle">세포분열 학습 도구 · 기본 모델 2n = {DEFAULT_DIPLOID}</p>
      </header>

      <nav className="tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            className={tab === t.id ? 'tab on' : 'tab'}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main>
        {tab === 'anatomy' && <AnatomyView />}
        {tab === 'mitosis' && (
          <Suspense fallback={<p className="loading">시뮬레이터 불러오는 중…</p>}>
            <MitosisSimulator />
          </Suspense>
        )}
        {tab === 'meiosis' && (
          <Suspense fallback={<p className="loading">시뮬레이터 불러오는 중…</p>}>
            <MeiosisSimulator />
          </Suspense>
        )}
        {tab === 'compare' && (
          <Suspense fallback={<p className="loading">비교 모드 불러오는 중…</p>}>
            <CompareView />
          </Suspense>
        )}
        {tab === 'diversity' && (
          <Suspense fallback={<p className="loading">불러오는 중…</p>}>
            <DiversityView />
          </Suspense>
        )}
        {tab === 'quiz' && (
          <Suspense fallback={<p className="loading">퀴즈 불러오는 중…</p>}>
            <QuizView />
          </Suspense>
        )}
        {tab === 'truth' && <TruthView />}
      </main>
    </div>
  );
}

export default App;
