// 퀴즈 모드 (Step 5, F7) — 두 유형:
//  ① 시기 값: 임의 시기의 그림을 보고 핵상/염색체 수/DNA 상대량 즉답(진리표 기반).
//  ② 생식세포·수정: 독립적 분리(2ⁿ)·무작위 수정 등 개념 문항(conceptQuiz).
// 결과는 LocalStorage 저장 + 익명 텔레메트리.

import { useState } from 'react';
import { buildMitosisPhases, buildMeiosisPhases, DEFAULT_DIPLOID } from '../../domain/phases';
import type { PhaseFacts, Process } from '../../domain/types';
import { CellView } from '../mitosis/CellView';
import { MeiosisCellView } from '../meiosis/MeiosisCellView';
import { buildQuestions, isQuizable, type SubKey } from './quizLogic';
import { pickConceptQuestion, type ConceptQuestion } from './conceptQuiz';
import { loadProgress, recordQuiz, resetProgress, type Progress } from '../../storage/progress';
import { consoleSink, nowTs } from '../../telemetry/events';
import { readTeacherMode } from '../../app/teacherMode';
import './quiz.css';

type Category = 'phase' | 'concept';

function pickPhase(process: Process): PhaseFacts {
  const phases = (process === 'mitosis' ? buildMitosisPhases : buildMeiosisPhases)(
    DEFAULT_DIPLOID,
  ).filter(isQuizable);
  return phases[Math.floor(Math.random() * phases.length)]!;
}

export function QuizView() {
  const [category, setCategory] = useState<Category>('phase');
  const [process, setProcess] = useState<Process>('mitosis');
  const [phase, setPhase] = useState<PhaseFacts>(() => pickPhase('mitosis'));
  const [selected, setSelected] = useState<Partial<Record<SubKey, string>>>({});
  const [concept, setConcept] = useState<ConceptQuestion>(() => pickConceptQuestion());
  const [conceptSel, setConceptSel] = useState<string | undefined>(undefined);
  const [graded, setGraded] = useState(false);
  const [showScore, setShowScore] = useState(true);
  const [progress, setProgress] = useState<Progress>(() => loadProgress());

  const teacher = readTeacherMode();
  const questions = buildQuestions(phase, DEFAULT_DIPLOID);
  const allAnswered = questions.every((q) => selected[q.key] !== undefined);

  const newQuestion = (proc: Process = process) => {
    setProcess(proc);
    setPhase(pickPhase(proc));
    setSelected({});
    setGraded(false);
  };

  const newConcept = () => {
    setConcept(pickConceptQuestion());
    setConceptSel(undefined);
    setGraded(false);
  };

  const switchCategory = (cat: Category) => {
    if (cat === category) return;
    setCategory(cat);
    setGraded(false);
    if (cat === 'phase') {
      setSelected({});
      setPhase(pickPhase(process));
    } else {
      newConcept();
    }
  };

  const emit = (p: Progress, phaseId: string, question: string, correct: boolean) =>
    consoleSink.emit({
      type: 'quiz_answered',
      sessionId: p.sessionId,
      ts: nowTs(),
      teacherMode: teacher.enabled,
      phaseId,
      question,
      correct,
      attempt: 1,
    });

  const grade = () => {
    if (graded) return;
    if (category === 'phase') {
      if (!allAnswered) return;
      setGraded(true);
      let p = progress;
      for (const q of questions) {
        const correct = selected[q.key] === q.answer;
        p = recordQuiz(phase.id, correct);
        emit(p, phase.id, q.key, correct);
      }
      setProgress(p);
    } else {
      if (conceptSel === undefined) return;
      setGraded(true);
      const correct = conceptSel === concept.answer;
      const p = recordQuiz(`concept:${concept.topic}`, correct);
      emit(p, 'concept', concept.topic, correct);
      setProgress(p);
    }
  };

  const canGrade = category === 'phase' ? allAnswered : conceptSel !== undefined;
  const accuracy =
    progress.quiz.total > 0 ? Math.round((progress.quiz.correct / progress.quiz.total) * 100) : 0;

  return (
    <div className="quiz">
      <div className="quiz-top">
        <div className="toggle cat" role="group" aria-label="문제 유형">
          <button
            className={category === 'phase' ? 'on' : ''}
            onClick={() => switchCategory('phase')}
          >
            시기 값
          </button>
          <button
            className={category === 'concept' ? 'on' : ''}
            onClick={() => switchCategory('concept')}
          >
            생식세포·수정
          </button>
        </div>
        <div className="quiz-score">
          <label className="score-toggle">
            <input
              type="checkbox"
              checked={showScore}
              onChange={(e) => setShowScore(e.target.checked)}
            />
            점수 표시
          </label>
          {showScore && (
            <span className="score-num">
              {progress.quiz.correct}/{progress.quiz.total} · 정답률 {accuracy}%
            </span>
          )}
        </div>
      </div>

      {category === 'phase' ? (
        <>
          <div className="toggle" role="group" aria-label="분열 종류">
            <button
              className={process === 'mitosis' ? 'on' : ''}
              onClick={() => newQuestion('mitosis')}
            >
              체세포분열
            </button>
            <button
              className={process === 'meiosis' ? 'on' : ''}
              onClick={() => newQuestion('meiosis')}
            >
              감수분열
            </button>
          </div>

          <p className="quiz-q">
            아래 <b>{phase.labelKo}</b> 그림을 보고 답하세요.{' '}
            <span className="quiz-cond">모든 문항은 세포 1개(전체) 기준</span>
          </p>

          <div className="quiz-figure">
            {process === 'mitosis' ? <CellView phase={phase} /> : <MeiosisCellView phase={phase} />}
          </div>

          <div className="quiz-questions">
            {questions.map((q) => {
              const sel = selected[q.key];
              return (
                <div key={q.key} className="quiz-item">
                  <div className="qi-prompt">{q.prompt}</div>
                  <div className="qi-options">
                    {q.options.map((opt) => {
                      const isSel = sel === opt;
                      const isAns = opt === q.answer;
                      let cls = 'qi-opt';
                      if (graded) {
                        if (isAns) cls += ' correct';
                        else if (isSel) cls += ' wrong';
                      } else if (isSel) cls += ' sel';
                      return (
                        <button
                          key={opt}
                          className={cls}
                          disabled={graded}
                          onClick={() => setSelected((s) => ({ ...s, [q.key]: opt }))}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                  {graded && (
                    <div className={`qi-explain ${sel === q.answer ? 'ok' : 'no'}`}>
                      <span className="qi-mark">{sel === q.answer ? '✓ 정답!' : '✗ 오답'}</span>{' '}
                      {q.explain}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <>
          <p className="quiz-q">
            <span className="quiz-cond alt">{concept.topic}</span> 개념을 묻는 문제예요.
          </p>
          <div className="quiz-concept">
            <div className="quiz-item">
              <div className="qi-prompt">{concept.prompt}</div>
              <div className="qi-options vertical">
                {concept.options.map((opt) => {
                  const isSel = conceptSel === opt;
                  const isAns = opt === concept.answer;
                  let cls = 'qi-opt';
                  if (graded) {
                    if (isAns) cls += ' correct';
                    else if (isSel) cls += ' wrong';
                  } else if (isSel) cls += ' sel';
                  return (
                    <button
                      key={opt}
                      className={cls}
                      disabled={graded}
                      onClick={() => setConceptSel(opt)}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
              {graded && (
                <div className={`qi-explain ${conceptSel === concept.answer ? 'ok' : 'no'}`}>
                  <span className="qi-mark">
                    {conceptSel === concept.answer ? '✓ 정답!' : '✗ 오답'}
                  </span>{' '}
                  {concept.explain}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <div className="quiz-controls">
        {!graded ? (
          <button className="primary" onClick={grade} disabled={!canGrade}>
            채점하기
          </button>
        ) : (
          <button
            className="primary"
            onClick={() => (category === 'phase' ? newQuestion() : newConcept())}
          >
            다음 문제 ▶
          </button>
        )}
        <button
          className="ghost"
          onClick={() => {
            if (confirm('퀴즈 점수를 초기화할까요?')) setProgress(resetProgress());
          }}
        >
          ↺ 점수 초기화
        </button>
      </div>
    </div>
  );
}
