// 감수분열 시뮬레이터 (Step 4, F3) — 공용 Simulator 셸 + 감수 세포 뷰
import { Simulator } from '../sim/Simulator';
import { MeiosisCellView } from './MeiosisCellView';

export function MeiosisSimulator() {
  return (
    <Simulator
      process="meiosis"
      renderCell={(phase) => <MeiosisCellView phase={phase} />}
      result={
        <>
          ✓ 감수분열 완료 — 핵상이 절반(2n→n)인 <b>딸세포(n=2) 4개</b> 형성. 감수 1분열에서
          상동염색체가 분리되어 유전적으로 다양한 생식세포가 만들어집니다.
        </>
      }
    />
  );
}
