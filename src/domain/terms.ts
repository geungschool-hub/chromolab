// ChromoLab 표준 용어 사전 — 교과서 『생명과학』(이준규 외, 22개정) 표기 기준
// 근거: ChromoLab_PRD.md §7.1 표준 용어 통일표

export interface Term {
  /** 표준 표기 (UI 1차 노출) */
  ko: string;
  /** 영문 (i18n/보조) */
  en: string;
  /** 1문장 정의 (해부 뷰 툴팁용) */
  def: string;
  /** 교과서 근거/주의 */
  note?: string;
}

export const terms = {
  chromosome: {
    ko: '염색체',
    en: 'chromosome',
    def: 'DNA와 단백질로 이루어진 유전 정보의 전달 단위. 분열기에 응축되어 관찰된다.',
  },
  chromatid: {
    ko: '염색분체',
    en: 'chromatid',
    def: 'DNA 복제 후 동원체로 연결된 각각의 가닥. 복제된 염색체는 2개의 염색분체로 구성된다.',
    note: '후기에 분리되면 각각을 "염색체"라 부른다(오개념 M2).',
  },
  sisterChromatid: {
    ko: '자매염색분체',
    en: 'sister chromatids',
    def: '하나의 염색체가 복제되어 생긴, 유전적으로 동일한 두 염색분체.',
    note: 'UI에서 동일 색·패턴으로 표시(상동염색체와 구분, 오개념 M1).',
  },
  centromere: {
    ko: '동원체',
    en: 'centromere',
    def: '두 염색분체가 연결된 잘록한 부위. 방추사가 부착된다.',
  },
  homologousChromosome: {
    ko: '상동염색체',
    en: 'homologous chromosome',
    def: '크기·모양이 같고 같은 위치에 대립유전자가 있는, 부계·모계 한 쌍의 염색체.',
    note: 'UI에서 동계열 다른 명도 + 부/모 유래 라벨로 표시(오개념 M1).',
  },
  spindleFiber: {
    ko: '방추사',
    en: 'spindle fiber',
    def: '염색체의 동원체에 부착해 염색체를 양극으로 끌어당기는 섬유.',
    note: '교과서 표기 "방추사"(방추체 아님). 동물=중심체, 식물=미세소관형성중심에서 뻗어나옴.',
  },
  bivalent: {
    ko: '2가 염색체',
    en: 'bivalent (tetrad)',
    def: '감수 1분열에서 상동염색체가 접합하여 형성된 구조. 염색분체 4개로 이루어져 4분 염색체라고도 한다.',
  },
  equatorialPlate: {
    ko: '세포 중앙(적도판)',
    en: 'equatorial plate',
    def: '분열기 중기에 염색체가 배열되는 세포의 중앙면.',
  },
  ploidy: {
    ko: '핵상',
    en: 'ploidy',
    def: '세포가 갖는 염색체의 상대적 수. 2n(상동염색체 쌍 존재)과 n(쌍 중 하나)으로 표기한다.',
  },
  dnaRelativeAmount: {
    ko: '핵 1개당 DNA 상대량',
    en: 'relative DNA amount per nucleus',
    def: 'S기 복제로 2배가 되고 분열로 절반이 되는 DNA의 상대적 양(1·2·4로 표기).',
    note: '교과서 기본 표기. C값(C·2C·4C)은 보조 토글(§7.1).',
  },
  cellCycle: {
    ko: '세포주기',
    en: 'cell cycle',
    def: '간기(G₁·S·G₂)와 분열기(M기)로 이루어진, 세포가 분열을 반복하는 주기.',
  },
} satisfies Record<string, Term>;

export type TermKey = keyof typeof terms;

export function getTerm(key: TermKey): Term {
  return terms[key]; // satisfies로 키가 보장되어 undefined 가능성 없음
}
