// 생식세포 유전적 다양성 (독립적 분리) — 유전자형 AaBb 감수분열을 단계별 애니메이션으로.
// 근거: PRD §7.5, 교과서/정답지: 경우1→AB·ab, 경우2→Ab·aB → 합치면 2ⁿ=4종류.

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Chromosome } from '../../components/Chromosome';
import { homologColor } from '../../components/palette';
import './diversity.css';

type Allele = 'A' | 'a' | 'B' | 'b';
const INFO: Record<Allele, { pair: number; origin: 'paternal' | 'maternal'; len: number }> = {
  A: { pair: 0, origin: 'paternal', len: 70 },
  a: { pair: 0, origin: 'maternal', len: 70 },
  B: { pair: 1, origin: 'paternal', len: 48 },
  b: { pair: 1, origin: 'maternal', len: 48 },
};
const colorOf = (al: Allele) => homologColor(INFO[al].pair, INFO[al].origin);

type Case = 'case1' | 'case2';

const W = 440;
const H = 300;
const CX = W / 2;
const POLE_Y = H / 2; // 방추사 극의 세로 위치(세포 중앙선)
const LC = 120; // 왼쪽 딸세포 중심
const RC = 320; // 오른쪽 딸세포 중심
const Y_TOP = 95; // A쌍 행
const Y_BOT = 205; // B쌍 행

interface Body {
  key: string;
  allele: Allele;
  x: number;
  y: number;
  replicated: boolean;
  initialX?: number;
  /** 연결된 방추사 극의 x좌표들 */
  polesFrom: number[];
}

/** 단계별 방추사 극(점)의 x좌표 */
function polesAt(step: number): number[] {
  if (step <= 1) return [80, W - 80];
  if (step === 3 || step === 4) return [70, 170, 270, 370];
  return [];
}

const STEPS = ['중기Ⅰ', '후기Ⅰ', '말기Ⅰ', '중기Ⅱ', '후기Ⅱ', '말기Ⅱ (생식세포)'];

function captionOf(step: number, types: string): string {
  return [
    '상동염색체 쌍(2가 염색체)이 적도판에 무작위로 배열됩니다.',
    '상동염색체가 분리되어 양극으로 이동합니다 (감수 1분열).',
    '핵상이 n인 딸세포 2개가 만들어집니다.',
    '각 세포에서 염색체가 적도판에 배열됩니다 (감수 2분열).',
    '염색분체가 분리되어 양극으로 이동합니다.',
    `생식세포 4개 완성! 이 경우의 생식세포: ${types}.`,
  ][step]!;
}

function bodiesAt(step: number, c: Case): Body[] {
  const bL: Allele = c === 'case1' ? 'B' : 'b'; // 왼쪽으로 갈 B쌍 대립유전자
  const bR: Allele = c === 'case1' ? 'b' : 'B';
  const r = true;
  const L = 80;
  const R = W - 80;
  switch (step) {
    case 0: {
      // 중기Ⅰ — 2가 염색체가 적도판 좌우로, 양극에서 방추사
      const poles = [L, R];
      return [
        { key: 'A', allele: 'A', x: CX - 26, y: Y_TOP, replicated: r, polesFrom: poles },
        { key: 'a', allele: 'a', x: CX + 26, y: Y_TOP, replicated: r, polesFrom: poles },
        { key: bL, allele: bL, x: CX - 26, y: Y_BOT, replicated: r, polesFrom: poles },
        { key: bR, allele: bR, x: CX + 26, y: Y_BOT, replicated: r, polesFrom: poles },
      ];
    }
    case 1: // 후기Ⅰ — 상동염색체가 양극으로(향하는 극에서만 방추사)
      return [
        { key: 'A', allele: 'A', x: L, y: Y_TOP, replicated: r, polesFrom: [L] },
        { key: 'a', allele: 'a', x: R, y: Y_TOP, replicated: r, polesFrom: [R] },
        { key: bL, allele: bL, x: L, y: Y_BOT, replicated: r, polesFrom: [L] },
        { key: bR, allele: bR, x: R, y: Y_BOT, replicated: r, polesFrom: [R] },
      ];
    case 2: // 말기Ⅰ — 딸세포 2개 (방추사 없음)
    case 3: {
      // 중기Ⅱ — 각 세포 적도판 정렬(각 세포 양극에서 방추사)
      const lp = step === 3 ? [70, 170] : [];
      const rp = step === 3 ? [270, 370] : [];
      return [
        { key: 'A', allele: 'A', x: LC, y: Y_TOP, replicated: r, polesFrom: lp },
        { key: bL, allele: bL, x: LC, y: Y_BOT, replicated: r, polesFrom: lp },
        { key: 'a', allele: 'a', x: RC, y: Y_TOP, replicated: r, polesFrom: rp },
        { key: bR, allele: bR, x: RC, y: Y_BOT, replicated: r, polesFrom: rp },
      ];
    }
    case 4: // 후기Ⅱ — 염색분체 분리(향하는 극에서만)
    case 5: {
      // 말기Ⅱ — 생식세포 4개
      const pf = (x: number): number[] => (step === 4 ? [x] : []);
      return [
        {
          key: 'A-1',
          allele: 'A',
          x: 70,
          y: Y_TOP,
          replicated: false,
          initialX: LC,
          polesFrom: pf(70),
        },
        {
          key: 'A-2',
          allele: 'A',
          x: 170,
          y: Y_TOP,
          replicated: false,
          initialX: LC,
          polesFrom: pf(170),
        },
        {
          key: `${bL}-1`,
          allele: bL,
          x: 70,
          y: Y_BOT,
          replicated: false,
          initialX: LC,
          polesFrom: pf(70),
        },
        {
          key: `${bL}-2`,
          allele: bL,
          x: 170,
          y: Y_BOT,
          replicated: false,
          initialX: LC,
          polesFrom: pf(170),
        },
        {
          key: 'a-1',
          allele: 'a',
          x: 270,
          y: Y_TOP,
          replicated: false,
          initialX: RC,
          polesFrom: pf(270),
        },
        {
          key: 'a-2',
          allele: 'a',
          x: 370,
          y: Y_TOP,
          replicated: false,
          initialX: RC,
          polesFrom: pf(370),
        },
        {
          key: `${bR}-1`,
          allele: bR,
          x: 270,
          y: Y_BOT,
          replicated: false,
          initialX: RC,
          polesFrom: pf(270),
        },
        {
          key: `${bR}-2`,
          allele: bR,
          x: 370,
          y: Y_BOT,
          replicated: false,
          initialX: RC,
          polesFrom: pf(370),
        },
      ];
    }
    default:
      return [];
  }
}

function cellRegions(step: number): { left: string; width: string }[] {
  if (step <= 1) return [{ left: '4%', width: '92%' }];
  if (step <= 4)
    return [
      { left: '4%', width: '44%' },
      { left: '52%', width: '44%' },
    ];
  return [
    { left: '4%', width: '21.5%' },
    { left: '28%', width: '21.5%' },
    { left: '52%', width: '21.5%' },
    { left: '76%', width: '21.5%' },
  ];
}

function gameteTypes(c: Case): string {
  return c === 'case1' ? 'AB, ab' : 'Ab, aB';
}

export function DiversityView() {
  const [c, setC] = useState<Case>('case1');
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const isLast = step >= STEPS.length - 1;
  const bodies = bodiesAt(step, c);
  const regions = cellRegions(step);
  const equators = step === 0 ? [CX] : step === 3 ? [LC, RC] : [];

  useEffect(() => {
    if (!playing || isLast) return;
    const t = setTimeout(() => setStep((s) => s + 1), 1500);
    return () => clearTimeout(t);
  }, [playing, step, isLast]);

  const restart = (next?: Case) => {
    if (next) setC(next);
    setStep(0);
    setPlaying(false);
  };

  return (
    <div className="diversity">
      <div className="dv-intro">
        <span className="dv-genotype">유전자형 AaBb</span>
        <p>
          상동염색체 쌍은 중기Ⅰ에서 <b>무작위로 배열</b>됩니다(독립적 분리). 배열 방향에 따라
          생식세포 조합이 달라져요. 아래에서 두 경우를 <b>재생</b>해 비교해 보세요.
        </p>
      </div>

      <div className="dv-toggle" role="group" aria-label="중기Ⅰ 배열 경우">
        <button className={c === 'case1' ? 'on' : ''} onClick={() => restart('case1')}>
          경우 1 (A·B 같은 쪽)
        </button>
        <button className={c === 'case2' ? 'on' : ''} onClick={() => restart('case2')}>
          경우 2 (A·b 같은 쪽)
        </button>
      </div>

      <div className="dv-stepbar">
        {STEPS.map((s, i) => (
          <button
            key={s}
            className={`dv-chip ${i === step ? 'on' : ''} ${i < step ? 'done' : ''}`}
            onClick={() => {
              setStep(i);
              setPlaying(false);
            }}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="dv-stage" style={{ width: W, height: H }}>
        {regions.map((rg, i) => (
          <div key={i} className="dv-cellshape" style={{ left: rg.left, width: rg.width }} />
        ))}
        {equators.map((x) => (
          <div key={x} className="dv-equator" style={{ left: x }} />
        ))}
        <svg className="dv-spindle" width={W} height={H} aria-hidden>
          {/* 방추사 — 각 극에서 염색체로 */}
          {bodies.flatMap((b) =>
            b.polesFrom.map((px) => (
              <motion.line
                key={`${b.key}-sp-${px}`}
                x1={px}
                y1={POLE_Y}
                initial={b.initialX !== undefined ? { x2: b.initialX, y2: b.y } : false}
                animate={{ x2: b.x, y2: b.y }}
                transition={{ duration: 0.7, ease: 'easeInOut' }}
                stroke="var(--spindle)"
                strokeWidth={1.5}
                strokeDasharray="2 3"
                opacity={0.8}
              />
            )),
          )}
          {/* 극(중심체) 점 */}
          {polesAt(step).map((px) => (
            <circle key={`pole-${px}`} cx={px} cy={POLE_Y} r={5} fill="var(--spindle)" />
          ))}
          {/* 2가 염색체 연결선(중기Ⅰ) */}
          {step === 0 &&
            [Y_TOP, Y_BOT].map((y) => (
              <line
                key={`biv-${y}`}
                x1={CX - 26}
                y1={y}
                x2={CX + 26}
                y2={y}
                stroke="var(--homolog)"
                strokeWidth={3}
                opacity={0.45}
              />
            ))}
        </svg>
        {bodies.map((b) => (
          <motion.div
            key={b.key}
            className="dv-body"
            initial={b.initialX !== undefined ? { left: b.initialX, top: b.y } : false}
            animate={{ left: b.x, top: b.y }}
            transition={{ duration: 0.7, ease: 'easeInOut' }}
          >
            <Chromosome
              replicated={b.replicated}
              color={colorOf(b.allele)}
              label={b.allele}
              lengthPx={INFO[b.allele].len}
              widthPx={22}
            />
          </motion.div>
        ))}
      </div>

      <div className="dv-stage-cap">
        <strong>{STEPS[step]}</strong> — {captionOf(step, gameteTypes(c))}
      </div>

      <div className="dv-controls">
        <button
          onClick={() => {
            setStep((s) => Math.max(0, s - 1));
            setPlaying(false);
          }}
          disabled={step === 0}
        >
          ◀ 이전
        </button>
        <button
          className="primary"
          onClick={() => {
            setStep((s) => Math.min(STEPS.length - 1, s + 1));
            setPlaying(false);
          }}
          disabled={isLast}
        >
          다음 ▶
        </button>
        <button onClick={() => restart()}>↺ 처음</button>
        <button className="play" onClick={() => setPlaying((p) => !p)} disabled={isLast}>
          {playing ? '⏸ 정지' : '▶ 재생'}
        </button>
      </div>

      <div className="dv-summary">
        <h4>두 경우를 합치면?</h4>
        <table>
          <tbody>
            <tr>
              <td>경우 1</td>
              <td>
                <b>AB</b>, <b>ab</b>
              </td>
            </tr>
            <tr>
              <td>경우 2</td>
              <td>
                <b>Ab</b>, <b>aB</b>
              </td>
            </tr>
            <tr className="dv-total">
              <td>종합 (집단 전체)</td>
              <td>
                <b>AB, Ab, aB, ab</b> — 4종류
              </td>
            </tr>
          </tbody>
        </table>
        <p className="dv-formula">
          상동염색체 쌍이 <b>n개</b>면 생식세포 조합은 <b>2ⁿ종류</b>. 여기선 n=2 → 2² = <b>4종류</b>
          . 사람(23쌍)은 2²³ ≈ <b>약 840만 종류</b>! 여기에 교차·무작위 수정까지 더해져 다양성이 더
          커집니다.
        </p>
      </div>
    </div>
  );
}
