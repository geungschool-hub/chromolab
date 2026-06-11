// 수정과 자손 다양성 — 두 개체의 생식세포가 무작위로 수정되어 자손의 유전적 다양성이 커지는 과정.
// '세대를 넘어' 섹션. 기존 '생식세포 다양성'(한 개체의 2ⁿ)과 달리, 암수 생식세포의 '무작위 결합'을 다룬다.
// 근거: [12생과03-02], genetics.ts 모델. 색·길이·라벨 삼중 인코딩(색맹 대응), 어두운 배경+밝은 글씨 고대비.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Chromosome } from '../../components/Chromosome';
import { homologColor } from '../../components/palette';
import {
  type Genotype,
  type Gamete,
  type AlleleA,
  type AlleleB,
  PAIR_A_OPTIONS,
  PAIR_B_OPTIONS,
  distinctGametes,
  randomGamete,
  combine,
  gameteLabel,
  genotypeLabel,
  diversityStats,
  genotypeRatios,
  simplestRatio,
} from './genetics';
import './fertilization.css';

const MOVE_MS = 750; // 난자·정자가 중앙으로 이동하는 시간(애니메이션)

/** A쌍(0)·B쌍(1) 길이 — 상동염색체 쌍은 같은 길이, 다른 쌍은 다른 길이로 구분 */
const LEN_MINI: readonly [number, number] = [46, 32];
const LEN_ZYG: readonly [number, number] = [54, 38];

const miniColor = (pair: 0 | 1, parent: 'mom' | 'dad') =>
  homologColor(pair, parent === 'mom' ? 'maternal' : 'paternal');

function labelToGamete(l: string): Gamete {
  return { A: l[0] as AlleleA, B: l[1] as AlleleB };
}

/** 생식세포 카드 — A쌍·B쌍 염색체 1개씩(반수체 n) */
function GameteCard({
  gamete,
  parent,
  caption,
}: {
  gamete: Gamete;
  parent: 'mom' | 'dad';
  caption?: string;
}) {
  return (
    <div className="fz-gamete">
      {caption && <span className="fz-gamete-cap">{caption}</span>}
      <div className="fz-chromos">
        <Chromosome
          replicated={false}
          color={miniColor(0, parent)}
          label={gamete.A}
          lengthPx={LEN_MINI[0]}
          widthPx={14}
        />
        <Chromosome
          replicated={false}
          color={miniColor(1, parent)}
          label={gamete.B}
          lengthPx={LEN_MINI[1]}
          widthPx={14}
        />
      </div>
    </div>
  );
}

/** 수정란 — 2n 회복: 각 쌍이 어머니쪽 1개 + 아버지쪽 1개의 상동염색체 쌍 */
function Zygote({ egg, sperm }: { egg: Gamete; sperm: Gamete }) {
  const geno = genotypeLabel(combine(egg, sperm));
  return (
    <div className="fz-zygote">
      <div className="fz-chromos fz-pairs">
        <div className="fz-pair">
          <Chromosome
            replicated={false}
            color={miniColor(0, 'mom')}
            label={egg.A}
            lengthPx={LEN_ZYG[0]}
            widthPx={16}
          />
          <Chromosome
            replicated={false}
            color={miniColor(0, 'dad')}
            label={sperm.A}
            lengthPx={LEN_ZYG[0]}
            widthPx={16}
          />
        </div>
        <div className="fz-pair">
          <Chromosome
            replicated={false}
            color={miniColor(1, 'mom')}
            label={egg.B}
            lengthPx={LEN_ZYG[1]}
            widthPx={16}
          />
          <Chromosome
            replicated={false}
            color={miniColor(1, 'dad')}
            label={sperm.B}
            lengthPx={LEN_ZYG[1]}
            widthPx={16}
          />
        </div>
      </div>
      <div className="fz-zygote-label">
        수정란 <b>{geno}</b> <span>(2n)</span>
      </div>
    </div>
  );
}

/** 부모 한쪽의 유전자형 선택기 */
function ParentPicker({
  title,
  g,
  onChange,
}: {
  title: string;
  g: Genotype;
  onChange: (pair: 'A' | 'B', value: string) => void;
}) {
  return (
    <div className="fz-parent">
      <div className="fz-parent-title">{title}</div>
      <div className="fz-genotype">{genotypeLabel(g)}</div>
      <div className="fz-seg-row">
        <span className="fz-seg-label">A쌍</span>
        <div className="fz-seg" role="group" aria-label={`${title} A쌍 유전자형`}>
          {PAIR_A_OPTIONS.map((o) => (
            <button key={o} className={g.A === o ? 'on' : ''} onClick={() => onChange('A', o)}>
              {o}
            </button>
          ))}
        </div>
      </div>
      <div className="fz-seg-row">
        <span className="fz-seg-label">B쌍</span>
        <div className="fz-seg" role="group" aria-label={`${title} B쌍 유전자형`}>
          {PAIR_B_OPTIONS.map((o) => (
            <button key={o} className={g.B === o ? 'on' : ''} onClick={() => onChange('B', o)}>
              {o}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

interface Anim {
  round: number;
  egg: Gamete;
  sperm: Gamete;
  phase: 'move' | 'fused';
}

export function FertilizationView() {
  const [mom, setMom] = useState<Genotype>({ A: 'Aa', B: 'Bb' });
  const [dad, setDad] = useState<Genotype>({ A: 'Aa', B: 'Bb' });
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [total, setTotal] = useState(0);
  const [lastCell, setLastCell] = useState<string | null>(null);
  const [anim, setAnim] = useState<Anim | null>(null);
  const roundRef = useRef(0);

  const eggs = useMemo(() => distinctGametes(mom), [mom]);
  const sperms = useMemo(() => distinctGametes(dad), [dad]);
  const stats = useMemo(() => diversityStats(mom, dad), [mom, dad]);
  const ratios = useMemo(() => genotypeRatios(mom, dad), [mom, dad]);
  const ratioParts = useMemo(() => simplestRatio(ratios.map((r) => r.count)), [ratios]);

  const reset = useCallback(() => {
    setCounts({});
    setTotal(0);
    setLastCell(null);
    setAnim(null);
  }, []);

  // 지금까지 실제로 나온 자손을 유전자형별로 집계(이론 비율과 비교용)
  const observedByGeno = useMemo(() => {
    const m = new Map<string, number>();
    for (const [key, c] of Object.entries(counts)) {
      if (c > 0) {
        const [el, sl] = key.split('|');
        const label = genotypeLabel(combine(labelToGamete(el!), labelToGamete(sl!)));
        m.set(label, (m.get(label) ?? 0) + c);
      }
    }
    return m;
  }, [counts]);
  const seenGenotypes = observedByGeno.size;

  // 비율 그래프용 행 데이터: 이론 순서(내림차순) 고정, 실제 관찰값을 함께. 두 그래프를 같은 가로 스케일로.
  const ratioView = useMemo(() => {
    const rows = ratios.map((r) => {
      const obs = observedByGeno.get(r.label) ?? 0;
      return {
        label: r.label,
        count: r.count,
        total: r.total,
        obs,
        obsPct: total > 0 ? (obs / total) * 100 : 0,
        thPct: (r.count / r.total) * 100,
      };
    });
    const maxPct = Math.max(1, ...rows.map((x) => Math.max(x.thPct, x.obsPct)));
    return { rows, maxPct };
  }, [ratios, observedByGeno, total]);

  const recordOffspring = useCallback((egg: Gamete, sperm: Gamete) => {
    const key = `${gameteLabel(egg)}|${gameteLabel(sperm)}`;
    setCounts((prev) => ({ ...prev, [key]: (prev[key] ?? 0) + 1 }));
    setTotal((t) => t + 1);
    setLastCell(key);
  }, []);

  // move → fused 전환 + 자손 기록 (cleanup가 StrictMode/중복 타이머 방지)
  useEffect(() => {
    if (!anim || anim.phase !== 'move') return;
    const { egg, sperm } = anim;
    const t = setTimeout(() => {
      setAnim((a) => (a ? { ...a, phase: 'fused' } : a));
      recordOffspring(egg, sperm);
    }, MOVE_MS);
    return () => clearTimeout(t);
  }, [anim, recordOffspring]);

  const fertilizeOnce = () => {
    if (anim?.phase === 'move') return; // 이동 중에는 무시
    const egg = randomGamete(mom);
    const sperm = randomGamete(dad);
    setAnim({ round: ++roundRef.current, egg, sperm, phase: 'move' });
  };

  const fertilizeMany = (n: number) => {
    const add: Record<string, number> = {};
    let lastEgg: Gamete | null = null;
    let lastSperm: Gamete | null = null;
    for (let i = 0; i < n; i++) {
      const egg = randomGamete(mom);
      const sperm = randomGamete(dad);
      const key = `${gameteLabel(egg)}|${gameteLabel(sperm)}`;
      add[key] = (add[key] ?? 0) + 1;
      lastEgg = egg;
      lastSperm = sperm;
    }
    setCounts((prev) => {
      const next = { ...prev };
      for (const k in add) next[k] = (next[k] ?? 0) + add[k]!;
      return next;
    });
    setTotal((t) => t + n);
    if (lastEgg && lastSperm) {
      setLastCell(`${gameteLabel(lastEgg)}|${gameteLabel(lastSperm)}`);
      setAnim({ round: ++roundRef.current, egg: lastEgg, sperm: lastSperm, phase: 'fused' });
    }
  };

  // 부모 유전자형을 바꾸면 기존 자손 기록은 의미가 없어지므로 함께 초기화
  const updateMom = (pair: 'A' | 'B', value: string) => {
    setMom((g) => ({ ...g, [pair]: value }) as Genotype);
    reset();
  };
  const updateDad = (pair: 'A' | 'B', value: string) => {
    setDad((g) => ({ ...g, [pair]: value }) as Genotype);
    reset();
  };

  const moving = anim?.phase === 'move';

  return (
    <div className="fertilization">
      <div className="fz-intro">
        <p>
          한 개체가 만드는 생식세포가 다양한 데다(<b>독립적 분리</b>), 어떤 난자와 어떤 정자가
          만날지도 <b>우연</b>이에요. 그래서 자손의 유전적 다양성은 훨씬 더 커집니다. 부모의
          유전자형을 정하고 <b>수정</b>시켜 보세요.
        </p>
      </div>

      {/* 부모 유전자형 선택 */}
      <div className="fz-parents">
        <ParentPicker title="어머니 (♀)" g={mom} onChange={updateMom} />
        <span className="fz-cross" aria-hidden>
          ×
        </span>
        <ParentPicker title="아버지 (♂)" g={dad} onChange={updateDad} />
      </div>

      {/* 각 부모가 만드는 생식세포 종류 */}
      <div className="fz-pools">
        <div className="fz-pool">
          <div className="fz-pool-head">
            어머니(♀) 생식세포 — <b>{eggs.length}종류</b>
          </div>
          <div className="fz-pool-cards">
            {eggs.map((g) => (
              <GameteCard key={gameteLabel(g)} gamete={g} parent="mom" />
            ))}
          </div>
        </div>
        <div className="fz-pool">
          <div className="fz-pool-head">
            아버지(♂) 생식세포 — <b>{sperms.length}종류</b>
          </div>
          <div className="fz-pool-cards">
            {sperms.map((g) => (
              <GameteCard key={gameteLabel(g)} gamete={g} parent="dad" />
            ))}
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
              <GameteCard gamete={anim!.egg} parent="mom" caption="난자(♀)" />
            </motion.div>
            <motion.div
              className="fz-mover"
              key={`sperm-${anim!.round}`}
              initial={{ left: '85%' }}
              animate={{ left: '61%' }}
              transition={{ duration: 0.7, ease: 'easeInOut' }}
            >
              <GameteCard gamete={anim!.sperm} parent="dad" caption="정자(♂)" />
            </motion.div>
          </>
        )}
        {anim?.phase === 'fused' && (
          // 정렬(translate)은 정적 래퍼가, 스케일 애니메이션은 안쪽 motion이 담당
          // — framer-motion의 transform이 CSS 중앙정렬을 덮어쓰지 않도록 분리.
          <div className="fz-zygote-wrap">
            <motion.div
              key={`zyg-${anim.round}`}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, ease: 'backOut' }}
            >
              <Zygote egg={anim.egg} sperm={anim.sperm} />
            </motion.div>
          </div>
        )}
      </div>
      <p className="fz-stage-cap">
        난자(n) + 정자(n) → 수정란(2n). 핵상이 <b>n + n = 2n</b>으로 회복되고, 상동염색체 한쪽은
        어머니, 다른 쪽은 아버지에게서 와요.
      </p>

      {/* 컨트롤 */}
      <div className="fz-controls">
        <button className="primary" onClick={fertilizeOnce} disabled={moving}>
          수정 ▶
        </button>
        <button onClick={() => fertilizeMany(10)} disabled={moving}>
          자손 10명 더
        </button>
        <button onClick={reset} disabled={total === 0 && !anim}>
          ↺ 자손 비우기
        </button>
      </div>

      <p className="fz-controls-note">
        <b>‘자손 10명 더’</b>는 어머니·아버지의 생식세포를 <b>무작위로 10번 짝지어</b> 한꺼번에
        수정시켜요. 어떤 난자와 어떤 정자가 만날지는 우연이라, 많이 시행할수록 실제 비율이 아래{' '}
        <b>이론값</b>에 가까워집니다.
      </p>

      <div className="fz-counter">
        지금까지 자손 <b>{total}</b>명 · 나온 유전자형 <b>{seenGenotypes}</b>종 / 가능한{' '}
        <b>{stats.distinctGenotypes}</b>종
      </div>

      {/* 퍼넷 격자 — 가능한 수정 조합 */}
      <div className="fz-grid-wrap">
        <div className="fz-grid-title">
          가능한 수정 조합: 난자 <b>{stats.momGameteTypes}</b>종 × 정자{' '}
          <b>{stats.dadGameteTypes}</b>종 = <b>{stats.fertilizationCombos}</b>가지
        </div>
        <table className="fz-grid">
          <thead>
            <tr>
              <th className="fz-corner">난자＼정자</th>
              {sperms.map((s) => (
                <th key={gameteLabel(s)} className="fz-dad-head">
                  ♂ {gameteLabel(s)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {eggs.map((e) => (
              <tr key={gameteLabel(e)}>
                <th className="fz-mom-head">♀ {gameteLabel(e)}</th>
                {sperms.map((s) => {
                  const key = `${gameteLabel(e)}|${gameteLabel(s)}`;
                  const cnt = counts[key] ?? 0;
                  return (
                    <td
                      key={key}
                      className={`${cnt > 0 ? 'hit' : ''} ${lastCell === key ? 'last' : ''}`}
                    >
                      <span className="fz-cell-geno">{genotypeLabel(combine(e, s))}</span>
                      {cnt > 0 && <span className="fz-cell-cnt">{cnt}</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 자손 유전자형 비율 — 실제 관찰(메인, 동적) + 이론값(옆에 참고용) */}
      <div className="fz-ratios">
        <div className="fz-ratios-cols">
          {/* 실제 나온 자손 (관찰값에 따라 변하는 메인 그래프) */}
          <div className="fz-ratio-card">
            <div className="fz-col-title">
              실제 나온 자손 <span>(총 {total}명)</span>
            </div>
            {total === 0 ? (
              <p className="fz-ratio-empty">
                아직 자손이 없어요. ‘수정 ▶’이나 ‘자손 10명 더’로 자손을 만들어 보세요.
              </p>
            ) : (
              <div className="fz-ratio-list">
                {ratioView.rows.map((r) => (
                  <div className="fz-ratio-row" key={r.label}>
                    <span className="fz-ratio-geno">{r.label}</span>
                    <span className="fz-ratio-track">
                      <span
                        className="fz-ratio-fill obs"
                        style={{ width: `${(r.obsPct / ratioView.maxPct) * 100}%` }}
                      />
                    </span>
                    <span className="fz-ratio-val">
                      {r.obs}명·{Math.round(r.obsPct)}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 이론값 (참고) */}
          <div className="fz-ratio-card ref">
            <div className="fz-col-title">
              이론값 <span>(참고)</span>
            </div>
            <div className="fz-ratio-list">
              {ratioView.rows.map((r) => (
                <div className="fz-ratio-row" key={r.label}>
                  <span className="fz-ratio-geno">{r.label}</span>
                  <span className="fz-ratio-track">
                    <span
                      className="fz-ratio-fill th"
                      style={{ width: `${(r.thPct / ratioView.maxPct) * 100}%` }}
                    />
                  </span>
                  <span className="fz-ratio-val">
                    {r.count}/{r.total}·{+r.thPct.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
            <div className="fz-ratio-summary">
              이론 비율 = <b>{ratioParts.join(' : ')}</b>
            </div>
          </div>
        </div>
        <p className="fz-ratios-note">
          수정을 많이 할수록 <b>실제 나온 비율(왼쪽)</b>이 <b>이론값(오른쪽)</b>에 점점 가까워져요.
        </p>
      </div>

      {/* 요약 */}
      <div className="fz-summary">
        <h4>왜 자손은 부모와도, 형제와도 다를까?</h4>
        <ol>
          <li>
            <b>① 감수분열의 독립적 분리</b> — 한 사람이 만드는 생식세포가 <b>2ⁿ종류</b>. (상동염색체
            n쌍, 여기선 n=2 → 4종류)
          </li>
          <li>
            <b>② 무작위 수정</b> — 어떤 난자와 어떤 정자가 만날지는 우연. 자손 조합 ={' '}
            <b>난자 종류 × 정자 종류</b>.
          </li>
        </ol>
        <p className="fz-formula">
          사람은 상동염색체 <b>23쌍</b> → 한 사람의 생식세포가 약 <b>840만(2²³)</b>종류. 난자 약
          840만 × 정자 약 840만 ≈ <b>약 70조 가지</b>의 수정 조합! 여기에 교차까지 더해지면
          형제자매도 서로 달라요.
        </p>
      </div>
    </div>
  );
}
