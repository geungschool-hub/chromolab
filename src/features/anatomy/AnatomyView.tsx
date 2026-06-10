// F1 염색체 해부 뷰 (Step 2)
// 근거: PRD F1 — 부위 탭 시 명칭·정의, 자매염색분체(동일 색) vs 상동염색체(다른 명도+부/모) 구분(오개념 M1)

import { useState } from 'react';
import { Chromosome } from '../../components/Chromosome';
import type { ChromosomePart } from '../../components/Chromosome';
import { PALETTE, homologColor, ORIGIN_LABEL } from '../../components/palette';
import { getTerm, type TermKey } from '../../domain/terms';
import './anatomy.css';

/** 용어(칩) 선택 시 그림에서 강조할 부위들 — 복제 상태에 따라 달라짐 */
function termToParts(key: TermKey, replicated: boolean): ChromosomePart[] {
  const strands: ChromosomePart[] = replicated
    ? ['chromatid-left', 'chromatid-right']
    : ['chromatid'];
  switch (key) {
    case 'chromosome':
    case 'homologousChromosome':
      return [...strands, 'centromere']; // 염색체 전체
    case 'chromatid':
    case 'sisterChromatid':
      return strands;
    case 'centromere':
      return ['centromere'];
    default:
      return [];
  }
}

export function AnatomyView() {
  const [replicated, setReplicated] = useState(true);
  const [selected, setSelected] = useState<TermKey | null>(null);
  // 특정 부위를 직접 클릭한 경우(해당 쪽만 강조). 칩 선택 시에는 null → 양쪽 강조.
  const [clicked, setClicked] = useState<{ side: 'p' | 'm'; part: ChromosomePart } | null>(null);

  const handlePart = (side: 'p' | 'm') => (part: ChromosomePart, termKey: string) => {
    setSelected(termKey as TermKey);
    setClicked({ side, part });
  };

  const selectTerm = (key: TermKey) => {
    setSelected(key);
    setClicked(null); // 칩 선택은 양쪽 모두 강조
  };

  const term = selected ? getTerm(selected) : null;
  const pairActive = selected === 'homologousChromosome' && !clicked;

  // 한 쪽(부/모) 염색체에서 강조할 부위 계산
  const partsForSide = (side: 'p' | 'm'): ChromosomePart[] => {
    if (clicked) return clicked.side === side ? [clicked.part] : [];
    if (selected) return termToParts(selected, replicated);
    return [];
  };

  return (
    <div className="anatomy">
      <div className="anatomy-controls">
        <span className="anatomy-q">염색체 상태:</span>
        <div className="toggle" role="group" aria-label="염색체 복제 상태">
          <button
            className={!replicated ? 'on' : ''}
            onClick={() => setReplicated(false)}
            aria-pressed={!replicated}
          >
            복제 전 (염색분체 1개)
          </button>
          <button
            className={replicated ? 'on' : ''}
            onClick={() => setReplicated(true)}
            aria-pressed={replicated}
          >
            복제 후 (염색분체 2개)
          </button>
        </div>
      </div>

      <div className="anatomy-stage">
        <div className="homolog-pair">
          <div className="chromo-slot">
            <Chromosome
              replicated={replicated}
              color={homologColor(0, 'paternal')}
              label={ORIGIN_LABEL.paternal}
              onPartClick={handlePart('p')}
              activeParts={partsForSide('p')}
              lengthPx={150}
              widthPx={40}
            />
          </div>
          <div className="chromo-slot">
            <Chromosome
              replicated={replicated}
              color={homologColor(0, 'maternal')}
              label={ORIGIN_LABEL.maternal}
              onPartClick={handlePart('m')}
              activeParts={partsForSide('m')}
              lengthPx={150}
              widthPx={40}
            />
          </div>
          <button
            className={pairActive ? 'pair-brace on' : 'pair-brace'}
            onClick={() => selectTerm('homologousChromosome')}
            aria-label="상동염색체 쌍 설명 보기"
          >
            ⟵ 상동염색체 쌍 ⟶
          </button>
        </div>
        <p className="stage-hint">
          부위(염색분체·동원체)나 아래 용어를 눌러보세요. 색이 같으면 <b>자매염색분체</b>, 명도가
          다른 쌍이면 <b>상동염색체</b>입니다.
        </p>
      </div>

      <div className="term-chips">
        {(
          [
            'chromosome',
            'chromatid',
            'sisterChromatid',
            'centromere',
            'homologousChromosome',
          ] as TermKey[]
        ).map((k) => (
          <button
            key={k}
            className={selected === k ? 'chip on' : 'chip'}
            onClick={() => selectTerm(k)}
          >
            {getTerm(k).ko}
          </button>
        ))}
      </div>

      <div className="term-panel" aria-live="polite">
        {term ? (
          <>
            <h3>
              {term.ko} <span className="en">{term.en}</span>
            </h3>
            <p>{term.def}</p>
            {term.note && <p className="term-note">※ {term.note}</p>}
          </>
        ) : (
          <p className="term-empty">용어나 염색체 부위를 선택하면 설명이 여기에 표시됩니다.</p>
        )}
      </div>

      <div className="anatomy-legend">
        <span>
          <i className="dot" style={{ background: homologColor(0, 'paternal') }} /> 부(父) 유래
        </span>
        <span>
          <i className="dot" style={{ background: homologColor(0, 'maternal') }} /> 모(母) 유래
        </span>
        <span>
          <i className="dot" style={{ background: PALETTE.centromere }} /> 동원체
        </span>
      </div>
    </div>
  );
}
