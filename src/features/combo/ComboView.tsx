// 종합 흐름 — 상염색체 유전자 + 성염색체(또는 반성유전)를 감수분열→수정→자손까지 한 흐름으로.
// 두 개념이 합쳐질 때를 비계처럼 풀어준다. 단계: 부모세포→중기Ⅰ(독립적 분리)→생식세포→수정→자손.
// 근거: 독립적 분리 + 성 결정 + (반성유전). 색맹 대응: 길이+색+라벨.

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Chromosome } from '../../components/Chromosome';
import './combo.css';

type Version = 'autosex' | 'xlinked';
type CaseArr = 'case1' | 'case2';

const CHR = {
  A: { color: '#2a7a38', len: 84, label: 'A' },
  a: { color: '#74c187', len: 84, label: 'a' },
  X: { color: '#9b59b6', len: 90, label: 'X' },
  Y: { color: '#2f6fd6', len: 54, label: 'Y' },
  // 대립유전자는 작은 유니코드 위첨자(ᴬ/ᵃ) 대신 base 'X' + labelSup으로 분리 → 크고 굵게 렌더
  XA: { color: '#8e44ad', len: 90, label: 'X', sup: 'A' },
  Xa: { color: '#d98cc4', len: 90, label: 'X', sup: 'a' },
} as const;
type ChrKey = keyof typeof CHR;

function Chr({ k, w = 24, replicated = false }: { k: ChrKey; w?: number; replicated?: boolean }) {
  const c = CHR[k];
  const supProp = 'sup' in c ? { labelSup: c.sup } : {};
  return (
    <Chromosome
      replicated={replicated}
      color={c.color}
      label={c.label}
      lengthPx={c.len}
      widthPx={w}
      {...supProp}
    />
  );
}

const STEPS = ['부모 세포', '중기Ⅰ 배열', '생식세포', '수정', '자손'];

// ── 생식세포 정의 (염색체 키 배열) ──
const AUTOSEX = {
  sperm: [
    { id: 'AX', chr: ['A', 'X'] as ChrKey[] },
    { id: 'AY', chr: ['A', 'Y'] as ChrKey[] },
    { id: 'aX', chr: ['a', 'X'] as ChrKey[] },
    { id: 'aY', chr: ['a', 'Y'] as ChrKey[] },
  ],
  egg: [
    { id: 'AX', chr: ['A', 'X'] as ChrKey[] },
    { id: 'aX', chr: ['a', 'X'] as ChrKey[] },
  ],
};
const XLINKED = {
  sperm: [
    { id: 'XA', chr: ['XA'] as ChrKey[] },
    { id: 'Y', chr: ['Y'] as ChrKey[] },
  ],
  egg: [
    { id: 'XA', chr: ['XA'] as ChrKey[] },
    { id: 'Xa', chr: ['Xa'] as ChrKey[] },
  ],
};

const rand = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]!;

// 자손 계산
function autoGeno(eggAuto: string, spermAuto: string): string {
  const hasA = eggAuto === 'A' || spermAuto === 'A';
  const hasa = eggAuto === 'a' || spermAuto === 'a';
  return hasA && hasa ? 'Aa' : hasA ? 'AA' : 'aa';
}

interface Offspring {
  chr: ChrKey[]; // 자손 염색체(상염색체 2 + 성염색체 2, 또는 성염색체 2)
  geno: string; // 표기 (예: 'Aa XY' 또는 'XᴬY')
  son: boolean;
  pheno: string; // 표현형 설명
}

function makeOffspringAutosex(egg: { id: string }, sperm: { id: string }): Offspring {
  const eggAuto = egg.id[0]!;
  const spermAuto = sperm.id[0]!;
  const ag = autoGeno(eggAuto, spermAuto);
  const son = sperm.id.includes('Y');
  const sex = son ? 'XY' : 'XX';
  const autoChr: ChrKey[] = [eggAuto as ChrKey, spermAuto as ChrKey];
  const sexChr: ChrKey[] = son ? ['X', 'Y'] : ['X', 'X'];
  return {
    chr: [...autoChr, ...sexChr],
    geno: `${ag} ${sex}`,
    son,
    pheno: son ? '아들' : '딸',
  };
}

function makeOffspringXlinked(egg: { id: string }, sperm: { id: string }): Offspring {
  const son = sperm.id === 'Y';
  if (son) {
    // 아들: 어머니 X + 아버지 Y. 어머니가 Xᵃ면 발현
    const carriesa = egg.id === 'Xa';
    return {
      chr: [egg.id as ChrKey, 'Y'],
      geno: egg.id === 'Xa' ? 'XᵃY' : 'XᴬY',
      son: true,
      pheno: carriesa ? '아들 · 발현(열성)' : '아들 · 정상',
    };
  }
  // 딸: 어머니 X + 아버지 Xᴬ
  const carrier = egg.id === 'Xa';
  return {
    chr: [egg.id as ChrKey, 'XA'],
    geno: egg.id === 'Xa' ? 'XᴬXᵃ' : 'XᴬXᴬ',
    son: false,
    pheno: carrier ? '딸 · 보인자(정상)' : '딸 · 정상',
  };
}

function ParentCell({ who, version }: { who: 'mother' | 'father'; version: Version }) {
  const isMother = who === 'mother';
  const title = isMother
    ? `어머니 세포 (2n) · ${version === 'autosex' ? 'AaXX' : 'XᴬXᵃ'}`
    : `아버지 세포 (2n) · ${version === 'autosex' ? 'AaXY' : 'XᴬY'}`;
  // 성염색체 쌍: 어머니는 XX(또는 XᴬXᵃ), 아버지는 XY(또는 XᴬY)
  const sexChr: ChrKey[] =
    version === 'autosex'
      ? isMother
        ? ['X', 'X']
        : ['X', 'Y']
      : isMother
        ? ['XA', 'Xa']
        : ['XA', 'Y'];
  return (
    <div className="combo-cell">
      <span className="combo-cell-title">{title}</span>
      {version === 'autosex' && (
        <div className="combo-row">
          <Chr k="A" replicated />
          <Chr k="a" replicated />
        </div>
      )}
      <div className="combo-row">
        {sexChr.map((k, i) => (
          <Chr key={i} k={k} replicated />
        ))}
      </div>
    </div>
  );
}

function GameteCard({ chr, cap, w = 16 }: { chr: ChrKey[]; cap?: string; w?: number }) {
  return (
    <div className="combo-gamete">
      {cap && <span className="combo-gamete-cap">{cap}</span>}
      <div className="chromos">
        {chr.map((k, i) => (
          <Chr key={i} k={k} w={w} />
        ))}
      </div>
    </div>
  );
}

export function ComboView() {
  const [version, setVersion] = useState<Version>('autosex');
  const [step, setStep] = useState(0);
  const [caseArr, setCaseArr] = useState<CaseArr>('case1');
  const [playing, setPlaying] = useState(false);
  const [fertKey, setFertKey] = useState(0); // 수정 재추첨 트리거

  const model = version === 'autosex' ? AUTOSEX : XLINKED;
  const isLast = step >= STEPS.length - 1;

  // 수정 단계의 난자·정자(무작위) — step이 3 이상이고 fertKey가 바뀔 때 고정
  const fert = useMemo(() => {
    const egg = rand(model.egg);
    const sperm = rand(model.sperm);
    const off =
      version === 'autosex' ? makeOffspringAutosex(egg, sperm) : makeOffspringXlinked(egg, sperm);
    return { egg, sperm, off };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fertKey, version]);

  useEffect(() => {
    if (!playing || isLast) return;
    const t = setTimeout(() => setStep((s) => s + 1), 1700);
    return () => clearTimeout(t);
  }, [playing, step, isLast]);

  const restartAll = (v?: Version) => {
    if (v) setVersion(v);
    setStep(0);
    setPlaying(false);
    setFertKey((k) => k + 1);
  };
  const goStep = (i: number) => {
    setStep(i);
    setPlaying(false);
    if (i === 3) setFertKey((k) => k + 1);
  };

  // 중기Ⅰ 배열: A는 왼쪽 고정, 성염색체 쪽이 경우에 따라 바뀜(독립적 분리)
  const sexLeft: ChrKey = caseArr === 'case1' ? 'X' : 'Y';
  const sexRight: ChrKey = caseArr === 'case1' ? 'Y' : 'X';

  return (
    <div className="combo">
      <div className="combo-intro">
        <p>
          상염색체 유전자와 성염색체(성 결정)가 <b>한 번의 감수분열·수정</b>에서 어떻게 함께
          유전되는지 따라가 봐요. 단계를 눌러 보세요.
        </p>
      </div>

      <div className="combo-toggle" role="group" aria-label="버전">
        <button className={version === 'autosex' ? 'on' : ''} onClick={() => restartAll('autosex')}>
          상염색체 + 성염색체
        </button>
        <button className={version === 'xlinked' ? 'on' : ''} onClick={() => restartAll('xlinked')}>
          반성유전 (X 연관)
        </button>
      </div>

      {/* 단계 칩 */}
      <div className="combo-steps">
        {STEPS.map((s, i) => (
          <button
            key={s}
            className={`combo-chip ${i === step ? 'on' : ''} ${i < step ? 'done' : ''}`}
            onClick={() => goStep(i)}
          >
            {i + 1}. {s}
          </button>
        ))}
      </div>

      {/* 경우 토글 (상+성, 중기Ⅰ 단계에서만) */}
      {version === 'autosex' && (step === 1 || step === 2) && (
        <div className="combo-toggle case" role="group" aria-label="중기Ⅰ 배열 경우">
          <button className={caseArr === 'case1' ? 'on' : ''} onClick={() => setCaseArr('case1')}>
            경우 1 (A·X 같은 쪽)
          </button>
          <button className={caseArr === 'case2' ? 'on' : ''} onClick={() => setCaseArr('case2')}>
            경우 2 (A·Y 같은 쪽)
          </button>
        </div>
      )}

      {/* 무대 */}
      <div className="combo-stage">
        <motion.div
          className="combo-scene"
          key={`${version}-${step}-${caseArr}-${fertKey}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          {/* 0. 부모 세포 (어머니·아버지 둘 다 — 난자가 어디서 오는지 보이게) */}
          {step === 0 && (
            <div className="combo-cells">
              <ParentCell who="mother" version={version} />
              <ParentCell who="father" version={version} />
            </div>
          )}

          {/* 1. 중기Ⅰ 배열 */}
          {step === 1 && (
            <div className="combo-meta">
              <div className="combo-equator" />
              {version === 'autosex' && (
                <div className="combo-pair">
                  <div className="combo-side">
                    <Chr k="A" replicated />
                  </div>
                  <div className="combo-side">
                    <Chr k="a" replicated />
                  </div>
                </div>
              )}
              <div className="combo-pair">
                {version === 'autosex' ? (
                  <>
                    <div className="combo-side">
                      <Chr k={sexLeft} replicated />
                    </div>
                    <div className="combo-side">
                      <Chr k={sexRight} replicated />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="combo-side">
                      <Chr k="XA" replicated />
                    </div>
                    <div className="combo-side">
                      <Chr k="Y" replicated />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* 2. 생식세포 */}
          {step === 2 && (
            <div className="combo-pools">
              <div className="combo-pool">
                <div className="combo-pool-head">
                  아버지(♂) 정자 — <b>{model.sperm.length}종류</b>
                </div>
                <div className={`combo-pool-cards ${model.sperm.length === 4 ? 'g2' : ''}`}>
                  {model.sperm.map((s) => (
                    <GameteCard key={s.id} chr={s.chr} w={18} />
                  ))}
                </div>
              </div>
              <div className="combo-pool">
                <div className="combo-pool-head">
                  어머니(♀) 난자 — <b>{model.egg.length}종류</b>
                </div>
                <div className="combo-pool-cards">
                  {model.egg.map((e) => (
                    <GameteCard key={e.id} chr={e.chr} w={18} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 3. 수정 */}
          {step === 3 && (
            <div className="combo-fert">
              <GameteCard chr={fert.egg.chr} cap="난자(♀)" w={20} />
              <span className="combo-op">+</span>
              <GameteCard chr={fert.sperm.chr} cap="정자(♂)" w={20} />
              <span className="combo-op">→</span>
              <Zygote off={fert.off} />
            </div>
          )}

          {/* 4. 자손 */}
          {step === 4 && <Zygote off={fert.off} big />}
        </motion.div>
      </div>

      <p className="combo-cap">
        <strong>
          {step + 1}. {STEPS[step]}
        </strong>{' '}
        — {captionOf(version, step, caseArr)}
      </p>

      {/* 컨트롤 */}
      <div className="combo-controls">
        <button onClick={() => goStep(Math.max(0, step - 1))} disabled={step === 0}>
          ◀ 이전
        </button>
        <button
          className="primary"
          onClick={() => goStep(Math.min(STEPS.length - 1, step + 1))}
          disabled={isLast}
        >
          다음 ▶
        </button>
        {step >= 3 && <button onClick={() => setFertKey((k) => k + 1)}>🎲 다시 수정</button>}
        <button onClick={() => restartAll()}>↺ 처음</button>
        <button className="primary" onClick={() => setPlaying((p) => !p)} disabled={isLast}>
          {playing ? '⏸ 정지' : '▶ 재생'}
        </button>
      </div>

      {/* 자손 단계: 전체 조합 요약 */}
      {step === 4 && (version === 'autosex' ? <AutosexSummary /> : <XlinkedSummary />)}
    </div>
  );
}

function Zygote({ off, big }: { off: Offspring; big?: boolean }) {
  const w = big ? 22 : 20;
  // chr = [상염색체(모), 상염색체(부), 성염색체(모), 성염색체(부)] 또는 [성염색체(모), 성염색체(부)]
  // 상동염색체 한 쌍씩 묶어, 한쪽은 어머니·다른 쪽은 아버지에게서 왔음을 보인다(2n 회복).
  const pairs: ChrKey[][] = [];
  for (let i = 0; i < off.chr.length; i += 2) pairs.push(off.chr.slice(i, i + 2));
  return (
    <div className="combo-zygote">
      <div className="combo-zpairs">
        {pairs.map((pr, pi) => (
          <div className="combo-zpair" key={pi}>
            <div className="chromos">
              {pr.map((k, i) => (
                <Chr key={i} k={k} w={w} />
              ))}
            </div>
            <div className="combo-zpair-origin">
              <span>♀</span>
              <span>♂</span>
            </div>
          </div>
        ))}
      </div>
      <div className="combo-zygote-label">
        수정란 <b>{off.geno}</b> <span className="combo-2n">2n</span>
        <span className={`combo-sex-badge ${off.son ? 'son' : 'daughter'}`}>{off.pheno}</span>
      </div>
    </div>
  );
}

function captionOf(version: Version, step: number, c: CaseArr): string {
  if (version === 'autosex') {
    return [
      '어머니(AaXX)와 아버지(AaXY)의 세포(2n)예요. 상염색체 한 쌍(A·a)과 성염색체가 복제된 채로 있어요. 어머니는 XX, 아버지는 XY.',
      `아버지 세포에서 상염색체 쌍과 성염색체 쌍이 적도판에 무작위로 배열돼요(독립적 분리). 지금은 ${c === 'case1' ? 'A와 X' : 'A와 Y'}가 같은 쪽.`,
      '감수분열을 거쳐 아버지 정자는 4종류(A·X, A·Y, a·X, a·Y), 어머니 난자는 2종류(A·X, a·X)가 만들어져요.',
      '난자와 정자가 무작위로 수정돼요. 상염색체 유전자형과 성별이 함께 정해져요.',
      '자손은 유전자형(AA·Aa·aa)과 성별(딸 XX·아들 XY)을 동시에 가져요.',
    ][step]!;
  }
  return [
    '어머니(XᴬXᵃ)와 아버지(XᴬY)의 세포(2n). 유전자가 X염색체 위에 있어요(반성유전).',
    '아버지 세포에서 성염색체 쌍(Xᴬ·Y)이 적도판에 배열돼 분리돼요.',
    '아버지 정자는 Xᴬ·Y 2종류, 어머니 난자는 Xᴬ·Xᵃ 2종류예요.',
    '난자와 정자가 무작위로 수정돼요. 아들은 X를 어머니에게서만 받아요.',
    '딸은 X가 둘이라 열성이 잘 안 드러나고(보인자 가능), 아들은 X가 하나라 어머니의 Xᵃ를 받으면 바로 드러나요.',
  ][step]!;
}

function AutosexSummary() {
  const eggs = AUTOSEX.egg;
  const sperms = AUTOSEX.sperm;
  return (
    <div className="combo-summary">
      <h4>가능한 자손 (난자 2종 × 정자 4종 = 8칸)</h4>
      <table>
        <thead>
          <tr>
            <th>난자＼정자</th>
            {sperms.map((s) => (
              <th key={s.id}>
                {s.id[0]}·{s.id[1]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {eggs.map((e) => (
            <tr key={e.id}>
              <th>
                {e.id[0]}·{e.id[1]}
              </th>
              {sperms.map((s) => {
                const off = makeOffspringAutosex(e, s);
                return (
                  <td key={s.id} className={off.son ? 'son' : 'daughter'}>
                    {off.geno}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="combo-note">
        상염색체 유전자형 <b>AA : Aa : aa = 1 : 2 : 1</b>, 성별 <b>딸 : 아들 = 1 : 1</b>. 둘은
        독립적으로 분리되므로 모든 조합(예: Aa 딸, aa 아들…)이 함께 나타나요.
      </p>
    </div>
  );
}

function XlinkedSummary() {
  const eggs = XLINKED.egg;
  const sperms = XLINKED.sperm;
  return (
    <div className="combo-summary">
      <h4>가능한 자손 (어머니 XᴬXᵃ × 아버지 XᴬY)</h4>
      <table>
        <thead>
          <tr>
            <th>난자＼정자</th>
            {sperms.map((s) => (
              <th key={s.id}>{s.id === 'Y' ? 'Y' : 'Xᴬ'}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {eggs.map((e) => (
            <tr key={e.id}>
              <th>{e.id === 'Xa' ? 'Xᵃ' : 'Xᴬ'}</th>
              {sperms.map((s) => {
                const off = makeOffspringXlinked(e, s);
                return (
                  <td key={s.id} className={off.son ? 'son' : 'daughter'}>
                    {off.geno}
                    <br />
                    <small>{off.pheno.replace(/^(아들|딸) · /, '')}</small>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="combo-note">
        <b>딸</b>은 X가 둘(XᴬXᴬ 정상 · XᴬXᵃ 보인자)이라 열성 형질이 잘 안 드러나요. <b>아들</b>은
        X가 하나(XᴬY 정상 · XᵃY 발현)라 어머니의 Xᵃ를 받으면 바로 드러나요 → 열성 반성유전은{' '}
        <b>아들에게 더 자주</b> 나타나요.
      </p>
      <div className="combo-def">
        <span className="combo-def-tag">보인자란?</span>
        <p>
          열성 대립유전자(<b>Xᵃ</b>)를 가지고 있지만, 우성 대립유전자(<b>Xᴬ</b>)도 함께 있어 그
          형질이 <b>겉으로 드러나지 않는</b>(정상으로 보이는) 사람이에요. 딸 <b>XᴬXᵃ</b>가
          대표적이죠. 자신은 증상이 없지만, 생식세포로 <b>Xᵃ를 자손에게 물려줄 수 있어요</b> —
          그래서 정상으로 보이는 어머니에게서 발현된 아들이 태어날 수 있어요.
        </p>
      </div>
    </div>
  );
}
