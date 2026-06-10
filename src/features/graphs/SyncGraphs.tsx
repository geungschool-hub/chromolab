// 동기화 그래프 (Step 3~4, F4) — DNA 상대량 + 염색체/염색분체 수, 현재 시기 강조
// 근거: PRD F4. 좌측 시뮬레이션과 동일 시기축. 염색체 수≠염색분체 수 분리 표기(M6).
//
// 교과서/정답지(3-1·3-2 정답지 p.3) 형태 반영:
//   - x축은 시기 순서(밴드). 폭은 실제 시간이 아님(§7.2 유의점).
//   - 값 변화는 "시기 경계"가 아니라 "해당 시기 구간 안"에서 일어난다.
//     · S기: 완만한 상승(DNA 2→4)  · 말기: 말기 "초기"에 감소(4→2 등)

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import type { PhaseFacts } from '../../domain/types';

// 시기 라벨을 그래프용 짧은 이름으로
function shortLabel(p: PhaseFacts): string {
  return p.labelKo
    .replace('·세포질분열', '')
    .replace(' (감수 1분열 완료)', '')
    .replace(' (감수 2분열 완료)', '')
    .replace('S기~G₂기 (간기 후)', 'S~G₂');
}

type Pt = { x: number; v: number };

/**
 * 값 배열 → 폴리라인 점들. 변화가 "해당 시기 밴드 [i,i+1] 안"에서 일어나도록 정형화.
 * - 증가: 'slope'면 밴드를 가로질러 완만 상승, 'step'이면 밴드 중앙에서 계단.
 * - 감소: 말기 초기(잠깐 유지 후 하강).
 * - 동일: 평평.
 */
function bandedSeries(values: number[], mode: 'slope' | 'step'): Pt[] {
  const pts: Pt[] = [];
  const n = values.length;
  pts.push({ x: 0, v: values[0]! });
  for (let i = 1; i < n; i++) {
    const prev = values[i - 1]!;
    const cur = values[i]!;
    if (cur === prev) {
      pts.push({ x: i, v: cur }); // 평평 유지
    } else if (cur > prev) {
      // 증가(S기 등)
      if (mode === 'slope') {
        pts.push({ x: i, v: prev });
        pts.push({ x: i + 1, v: cur });
      } else {
        // 밴드 중앙에서 거의 수직 계단 (병합 시 x 충돌 방지용 미세 오프셋)
        pts.push({ x: i, v: prev });
        pts.push({ x: i + 0.5, v: prev });
        pts.push({ x: i + 0.5 + 1e-4, v: cur });
      }
    } else {
      // 감소(말기): 말기 "초기"에 거의 순식간(수직)으로 하강
      pts.push({ x: i, v: prev });
      pts.push({ x: i + 0.2, v: prev });
      pts.push({ x: i + 0.2 + 1e-4, v: cur }); // 거의 수직 낙하
    }
  }
  pts.push({ x: n, v: values[n - 1]! });
  return pts;
}

/** 여러 시리즈를 같은 x축으로 합쳐 Recharts data로 */
function mergeSeries(series: Record<string, Pt[]>): Record<string, number>[] {
  const xs = new Set<number>();
  Object.values(series).forEach((pts) => pts.forEach((p) => xs.add(p.x)));
  const sorted = [...xs].sort((a, b) => a - b);
  // 각 시리즈를 x로 조회 가능하게
  const maps: Record<string, Map<number, number>> = {};
  for (const k in series) maps[k] = new Map(series[k]!.map((p) => [p.x, p.v]));
  return sorted.map((x) => {
    const row: Record<string, number> = { x };
    for (const k in maps) {
      const v = maps[k]!.get(x);
      if (v !== undefined) row[k] = v;
    }
    return row;
  });
}

interface Props {
  phases: PhaseFacts[];
  index: number;
}

export function SyncGraphs({ phases, index }: Props) {
  const n = phases.length;
  const tickXs = phases.map((_, i) => i + 0.5);
  const labelAt = (x: number) => {
    const p = phases[Math.floor(x)];
    return p ? shortLabel(p) : '';
  };

  // 시리즈 값 (모두 phases.ts 기준)
  const dnaVals = phases.map((p) => p.dnaRelative);
  // 염색체 수: 후기 순간값(8)은 숨기고 perPole(2n) 유지 → 평평
  const chromosomeVals = phases.map((p) =>
    p.transientChromosomeCount && p.perPole ? p.perPole.chromosomeCount : p.chromosomeCount,
  );
  // 염색분체 수: 전체 세포값 → 말기에 하강(DNA와 같은 시점, 교과서 일치)
  const chromatidVals = phases.map((p) => p.chromatidCount);

  const dnaData = bandedSeries(dnaVals, 'slope');
  const countData = mergeSeries({
    chromatid: bandedSeries(chromatidVals, 'step'),
    chromosome: bandedSeries(chromosomeVals, 'step'),
  });

  const commonX = (
    <XAxis
      type="number"
      dataKey="x"
      domain={[0, n]}
      ticks={tickXs}
      tickFormatter={labelAt}
      tick={{ fontSize: 10, fill: 'var(--muted)' }}
      tickLine={false}
      interval={0}
    />
  );
  // 시기 경계(정수 위치)에 옅은 구분선 → 라벨은 각 구간 "중앙"에 위치
  const boundaries = Array.from({ length: n - 1 }, (_, i) => i + 1);
  const dividers = boundaries.map((b) => (
    <ReferenceLine key={b} x={b} stroke="var(--line)" strokeWidth={1} />
  ));
  const currentBand = (
    <ReferenceArea x1={index} x2={index + 1} fill="var(--ploidy-n)" fillOpacity={0.14} />
  );

  return (
    <div className="graphs">
      <div className="graph-card">
        <h4>핵 1개당 DNA 상대량</h4>
        <ResponsiveContainer width="100%" height={150}>
          <LineChart data={dnaData} margin={{ top: 8, right: 12, bottom: 4, left: -18 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
            {dividers}
            {commonX}
            <YAxis
              domain={[0, 4]}
              ticks={[0, 1, 2, 4]}
              tick={{ fontSize: 10, fill: 'var(--muted)' }}
            />
            <Tooltip contentStyle={{ fontSize: 12 }} labelFormatter={(l) => labelAt(Number(l))} />
            {currentBand}
            <Line
              type="linear"
              dataKey="v"
              name="DNA 상대량"
              stroke="var(--ploidy-2n)"
              strokeWidth={2.5}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="graph-card">
        <h4>
          염색체 수 vs 염색분체 수 <span className="m6">(M6: 다름)</span>
        </h4>
        <ResponsiveContainer width="100%" height={150}>
          <LineChart data={countData} margin={{ top: 8, right: 12, bottom: 4, left: -18 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
            {dividers}
            {commonX}
            <YAxis
              domain={[0, 8]}
              ticks={[0, 2, 4, 8]}
              tick={{ fontSize: 10, fill: 'var(--muted)' }}
            />
            <Tooltip contentStyle={{ fontSize: 12 }} labelFormatter={(l) => labelAt(Number(l))} />
            {currentBand}
            <Line
              type="linear"
              dataKey="chromatid"
              name="염색분체 수"
              stroke="var(--chromatid)"
              strokeWidth={2.5}
              dot={false}
              connectNulls
              isAnimationActive={false}
            />
            <Line
              type="linear"
              dataKey="chromosome"
              name="염색체 수"
              stroke="var(--homolog)"
              strokeWidth={2.5}
              dot={false}
              connectNulls
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
        <div className="graph-legend">
          <span className="lg chromatid">● 염색분체 수</span>
          <span className="lg chromosome">● 염색체 수</span>
        </div>
        <p className="graph-foot">
          ※ 핵심은 둘이 <b>다르다</b>는 것! 복제 후 염색체 수는 그대로지만 염색분체 수는 2배가 돼요.
          (염색분체 '개수' 자체를 묻는 문제는 드뭅니다.)
        </p>
      </div>
    </div>
  );
}
