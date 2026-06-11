// 성염색체로 배우는 성 결정 — 어머니 XX × 아버지 XY → 정자(X/Y)에 따라 딸(XX)·아들(XY).
// '수정과 자손 다양성'의 성염색체 버전. 같은 수정→비율 방식으로 성비(이론 1:1)를 연습.
// 근거: 사람의 성 결정. 색맹 대응: X(긴 염색체)·Y(짧은 염색체) + 라벨로 구분.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Chromosome } from '../../components/Chromosome';
import './fertilization.css';

type Sperm = 'X' | 'Y';
type Zygote = 'XX' | 'XY';
const zygoteOf = (s: Sperm): Zygote => (s === 'X' ? 'XX' : 'XY');
const sexLabel = (z: Zygote): string => (z === 'XX' ? '딸' : '아들');

// X는 길고 Y는 짧다(길이로도 구분 — 색맹 대응)
const SEX = {
  X: { color: '#9b59b6', len: 56 },
  Y: { color: '#2f6fd6', len: 34 },
} as const;

function SexChromo({ type, w = 18 }: { type: Sperm; w?: number }) {
  return (
    <Chromosome
      replicated={false}
      color={SEX[type].color}
      label={type}
      lengthPx={SEX[type].len}
      widthPx={w}
    />
  );
}

interface Anim {
  round: number;
  sperm: Sperm;
  phase: 'move' | 'fused';
}

const MOVE_MS = 750;

export function SexFertilizationView() {
  const [counts, setCounts] = useState<Record<Zygote, number>>({ XX: 0, XY: 0 });
  const [total, setTotal] = useState(0);
  const [last, setLast] = useState<Zygote | null>(null);
  const [anim, setAnim] = useState<Anim | null>(null);
  const roundRef = useRef(0);

  const reset = useCallback(() => {
    setCounts({ XX: 0, XY: 0 });
    setTotal(0);
    setLast(null);
    setAnim(null);
  }, []);

  const record = useCallback((sperm: Sperm) => {
    const z = zygoteOf(sperm);
    setCounts((p) => ({ ...p, [z]: p[z] + 1 }));
    setTotal((t) => t + 1);
    setLast(z);
  }, []);

  useEffect(() => {
    if (!anim || anim.phase !== 'move') return;
    const { sperm } = anim;
    const t = setTimeout(() => {
      setAnim((a) => (a ? { ...a, phase: 'fused' } : a));
      record(sperm);
    }, MOVE_MS);
    return () => clearTimeout(t);
  }, [anim, record]);

  const moving = anim?.phase === 'move';

  const fertilizeOnce = () => {
    if (moving) return;
    const sperm: Sperm = Math.random() < 0.5 ? 'X' : 'Y';
    setAnim({ round: ++roundRef.current, sperm, phase: 'move' });
  };

  const fertilizeMany = (n: number) => {
    let x = 0;
    let lastSperm: Sperm = 'X';
    for (let i = 0; i < n; i++) {
      const sperm: Sperm = Math.random() < 0.5 ? 'X' : 'Y';
      if (sperm === 'X') x++;
      lastSperm = sperm;
    }
    setCounts((p) => ({ XX: p.XX + x, XY: p.XY + (n - x) }));
    setTotal((t) => t + n);
    setLast(zygoteOf(lastSperm));
    setAnim({ round: ++roundRef.current, sperm: lastSperm, phase: 'fused' });
  };

  const rows = useMemo(
    () =>
      (['XX', 'XY'] as Zygote[]).map((z) => ({
        z,
        obs: counts[z],
        obsPct: total > 0 ? (counts[z] / total) * 100 : 0,
      })),
    [counts, total],
  );

  return (
    <>
      <div className="fz-intro">
        <p>
          사람의 성별은 <b>성염색체</b>로 정해져요. 여자는 <b>XX</b>, 남자는 <b>XY</b>. 어떤 정자가
          수정되느냐에 따라 딸(XX)·아들(XY)이 결정됩니다. 직접 수정시켜 성비를 확인해 보세요.
        </p>
      </div>

      {/* 부모(고정): 어머니 XX × 아버지 XY */}
      <div className="fz-parents">
        <div className="fz-parent">
          <div className="fz-parent-title">어머니 (♀)</div>
          <div className="fz-genotype">XX</div>
          <div className="fz-chromos">
            <SexChromo type="X" />
            <SexChromo type="X" />
          </div>
        </div>
        <span className="fz-cross" aria-hidden>
          ×
        </span>
        <div className="fz-parent">
          <div className="fz-parent-title">아버지 (♂)</div>
          <div className="fz-genotype">XY</div>
          <div className="fz-chromos">
            <SexChromo type="X" />
            <SexChromo type="Y" />
          </div>
        </div>
      </div>

      {/* 생식세포 종류 */}
      <div className="fz-pools">
        <div className="fz-pool">
          <div className="fz-pool-head">
            어머니(♀) 난자 — <b>1종류</b>
          </div>
          <div className="fz-pool-cards">
            <div className="fz-gamete">
              <div className="fz-chromos">
                <SexChromo type="X" w={14} />
              </div>
            </div>
          </div>
        </div>
        <div className="fz-pool">
          <div className="fz-pool-head">
            아버지(♂) 정자 — <b>2종류</b>
          </div>
          <div className="fz-pool-cards">
            <div className="fz-gamete">
              <div className="fz-chromos">
                <SexChromo type="X" w={14} />
              </div>
            </div>
            <div className="fz-gamete">
              <div className="fz-chromos">
                <SexChromo type="Y" w={14} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 수정 무대 */}
      <div className="fz-stage">
        <span className="fz-src fz-src-l">♀</span>
        <span className="fz-src fz-src-r">♂</span>
        {!anim && <div className="fz-hint">‘수정 ▶’을 눌러 난자와 정자를 수정시켜 보세요.</div>}
        {moving && (
          <>
            <motion.div
              className="fz-mover"
              key={`egg-${anim!.round}`}
              initial={{ left: '15%' }}
              animate={{ left: '39%' }}
              transition={{ duration: 0.7, ease: 'easeInOut' }}
            >
              <div className="fz-gamete">
                <span className="fz-gamete-cap">난자(♀)</span>
                <div className="fz-chromos">
                  <SexChromo type="X" w={14} />
                </div>
              </div>
            </motion.div>
            <motion.div
              className="fz-mover"
              key={`sperm-${anim!.round}`}
              initial={{ left: '85%' }}
              animate={{ left: '61%' }}
              transition={{ duration: 0.7, ease: 'easeInOut' }}
            >
              <div className="fz-gamete">
                <span className="fz-gamete-cap">정자(♂)</span>
                <div className="fz-chromos">
                  <SexChromo type={anim!.sperm} w={14} />
                </div>
              </div>
            </motion.div>
          </>
        )}
        {anim?.phase === 'fused' && (
          <div className="fz-zygote-wrap">
            <motion.div
              key={`zyg-${anim.round}`}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, ease: 'backOut' }}
            >
              <div className="fz-zygote">
                <div className="fz-chromos">
                  <SexChromo type="X" />
                  <SexChromo type={anim.sperm} />
                </div>
                <div className="fz-zygote-label">
                  수정란 <b>{zygoteOf(anim.sperm)}</b>{' '}
                  <span>({sexLabel(zygoteOf(anim.sperm))})</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
      <p className="fz-stage-cap">
        난자는 모두 <b>X</b>, 정자는 <b>X 또는 Y</b>. 정자가 X면 <b>딸(XX)</b>, Y면 <b>아들(XY)</b>
        이 돼요.
      </p>

      {/* 컨트롤 */}
      <div className="fz-controls">
        <button className="primary" onClick={fertilizeOnce} disabled={moving}>
          수정 ▶
        </button>
        <button onClick={() => fertilizeMany(10)} disabled={moving}>
          자손 10명 더
        </button>
        <button onClick={() => fertilizeMany(1000)} disabled={moving}>
          자손 1000명 더
        </button>
        <button onClick={reset} disabled={total === 0 && !anim}>
          ↺ 자손 비우기
        </button>
      </div>

      <div className="fz-counter">
        지금까지 자손 <b>{total}</b>명 · 딸(XX) <b>{counts.XX}</b> · 아들(XY) <b>{counts.XY}</b>
      </div>

      {/* 퍼넷 격자 */}
      <div className="fz-grid-wrap">
        <div className="fz-grid-title">
          가능한 조합: 난자 <b>1</b>종 × 정자 <b>2</b>종 = <b>2</b>가지
        </div>
        <table className="fz-grid">
          <thead>
            <tr>
              <th className="fz-corner">난자＼정자</th>
              <th className="fz-dad-head">♂ X</th>
              <th className="fz-dad-head">♂ Y</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th className="fz-mom-head">♀ X</th>
              {(['X', 'Y'] as Sperm[]).map((s) => {
                const z = zygoteOf(s);
                const cnt = counts[z];
                return (
                  <td key={s} className={`${cnt > 0 ? 'hit' : ''} ${last === z ? 'last' : ''}`}>
                    <span className="fz-cell-geno">{z}</span>{' '}
                    <span className="fz-cell-sex">{sexLabel(z)}</span>
                    {cnt > 0 && <span className="fz-cell-cnt">{cnt}</span>}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>

      {/* 비율 — 실제 성비 vs 이론 1:1 */}
      <div className="fz-ratios">
        <div className="fz-ratios-cols">
          <div className="fz-ratio-card">
            <div className="fz-col-title">
              실제 나온 자손 <span>(총 {total}명)</span>
            </div>
            {total === 0 ? (
              <p className="fz-ratio-empty">아직 자손이 없어요. ‘수정 ▶’으로 만들어 보세요.</p>
            ) : (
              <div className="fz-ratio-list">
                {rows.map((r) => (
                  <div className="fz-ratio-row" key={r.z}>
                    <span className="fz-ratio-geno">{sexLabel(r.z)}</span>
                    <span className="fz-ratio-track">
                      <span className="fz-ratio-fill obs" style={{ width: `${r.obsPct}%` }} />
                    </span>
                    <span className="fz-ratio-val">
                      {r.obs}명·{Math.round(r.obsPct)}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="fz-ratio-card ref">
            <div className="fz-col-title">
              이론값 <span>(참고)</span>
            </div>
            <div className="fz-ratio-list">
              {rows.map((r) => (
                <div className="fz-ratio-row" key={r.z}>
                  <span className="fz-ratio-geno">{sexLabel(r.z)}</span>
                  <span className="fz-ratio-track">
                    <span className="fz-ratio-fill th" style={{ width: '100%' }} />
                  </span>
                  <span className="fz-ratio-val">1/2·50%</span>
                </div>
              ))}
            </div>
            <div className="fz-ratio-summary">
              이론 성비 = <b>아들 1 : 딸 1</b>
            </div>
          </div>
        </div>
        <p className="fz-ratios-note">
          수정을 많이 할수록 <b>실제 성비</b>가 <b>1 : 1</b>에 가까워져요.
        </p>
      </div>

      {/* 요약 */}
      <div className="fz-summary">
        <h4>자녀의 성별은 누가 결정할까?</h4>
        <ol>
          <li>
            <b>난자는 모두 X</b> — 어머니(XX)는 X만 줄 수 있어요.
          </li>
          <li>
            <b>정자는 X 또는 Y</b> — 아버지(XY)가 X 정자를 주면 딸(XX), Y 정자를 주면 아들(XY).
          </li>
        </ol>
        <p className="fz-formula">
          그래서 <b>자녀의 성별은 정자(아버지)가 결정</b>하고, 어떤 정자가 수정될지는 우연이라{' '}
          <b>아들 : 딸 = 1 : 1</b>이에요.
        </p>
      </div>
    </>
  );
}
