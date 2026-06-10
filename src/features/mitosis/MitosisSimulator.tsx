// 체세포분열 시뮬레이터 (Step 3, F2) — 공용 Simulator 셸 + 체세포 세포 뷰
import { Simulator } from '../sim/Simulator';
import { CellView } from './CellView';

export function MitosisSimulator() {
  return (
    <Simulator
      process="mitosis"
      renderCell={(phase) => <CellView phase={phase} />}
      result={
        <>
          ✓ 체세포분열 완료 — 모세포(2n=4)와 <b>유전적으로 동일한 딸세포(2n=4) 2개</b> 형성.
        </>
      }
    />
  );
}
