export const FALLBACK_AS_OF = "2026-05-05";

export const fallbackCandidates = [
  {
    id: "005930",
    code: "005930",
    name: "삼성전자",
    market: "KOSPI",
    rate: "+1.55%",
    theme: "반도체",
    beginnerLine: "메모리 반도체 사이클과 20일선 지지를 함께 보는 대표 대형주입니다.",
    positive: "HBM 수요와 외국인 수급 회복 기대가 가격 방어 근거로 작동했습니다.",
    negative: "전고점 근처에서 거래량이 줄면 단기 매물 부담이 커질 수 있습니다.",
    confidence: "86%"
  },
  {
    id: "000660",
    code: "000660",
    name: "SK하이닉스",
    market: "KOSPI",
    rate: "+2.10%",
    theme: "AI 메모리",
    beginnerLine: "AI 서버 투자와 고대역폭 메모리 기대를 차트로 확인하기 좋은 종목입니다.",
    positive: "AI 메모리 수요와 실적 개선 기대가 상승 재료로 남아 있습니다.",
    negative: "급등 후 거래량 둔화가 이어지면 추격 매수보다 관망이 필요합니다.",
    confidence: "84%"
  },
  {
    id: "247540",
    code: "247540",
    name: "에코프로비엠",
    market: "KOSDAQ",
    rate: "-0.80%",
    theme: "2차전지",
    beginnerLine: "업황 회복 기대와 변동성 리스크를 동시에 공부하기 좋은 성장주입니다.",
    positive: "정책 수혜와 수주 기대가 생기면 반등 후보가 될 수 있습니다.",
    negative: "업황 둔화와 지지선 이탈이 겹치면 리스크 관리가 먼저입니다.",
    confidence: "78%"
  }
];

export const fallbackSearchResults = [
  {
    id: "stock-005930",
    type: "stock",
    title: "삼성전자",
    code: "005930",
    market: "KOSPI",
    rate: "+1.55%",
    tags: ["반도체", "대형주", "AI 메모리"],
    summary: "HBM 기대와 20일선 지지 여부를 함께 보는 대표 반도체 종목입니다.",
    source: "frontend_fallback",
    stockCode: "005930",
    stockName: "삼성전자"
  },
  {
    id: "stock-000660",
    type: "stock",
    title: "SK하이닉스",
    code: "000660",
    market: "KOSPI",
    rate: "+2.10%",
    tags: ["AI 메모리", "HBM", "수급"],
    summary: "AI 서버 투자 사이클과 거래량 확장을 같이 확인해야 합니다.",
    source: "frontend_fallback",
    stockCode: "000660",
    stockName: "SK하이닉스"
  },
  {
    id: "theme-semiconductor",
    type: "theme",
    title: "반도체",
    code: "테마",
    market: "산업",
    rate: "관찰",
    tags: ["HBM", "AI", "수출"],
    summary: "대형주와 장비주가 함께 움직이는지 보면 테마 강도를 이해하기 쉽습니다.",
    source: "frontend_fallback"
  },
  {
    id: "term-volume",
    type: "term",
    title: "거래량",
    code: "학습",
    market: "용어",
    rate: "기초",
    tags: ["차트", "수급"],
    summary: "가격 움직임이 실제 관심을 동반했는지 확인하는 기본 지표입니다.",
    source: "frontend_fallback",
    termId: "volume"
  }
];

const baseCandles = [
  ["2025-11-18", 70500, 72000, 69800, 71600, 11600000],
  ["2025-11-25", 71600, 73100, 71000, 72800, 12100000],
  ["2025-12-02", 72800, 74200, 72100, 73900, 13500000],
  ["2025-12-09", 73900, 75400, 73200, 74800, 14200000],
  ["2025-12-16", 74800, 76600, 74000, 76300, 16600000],
  ["2025-12-23", 76300, 78100, 75800, 77400, 18100000],
  ["2025-12-30", 77400, 78800, 76200, 76700, 15100000],
  ["2026-01-06", 76700, 78300, 76000, 78100, 14400000],
  ["2026-01-13", 78100, 80200, 77600, 79600, 19800000],
  ["2026-01-20", 79600, 82300, 79100, 81800, 24200000],
  ["2026-01-27", 81800, 83100, 80500, 81100, 17400000],
  ["2026-02-03", 81100, 83600, 80400, 82900, 19100000],
  ["2026-02-10", 82900, 85100, 82100, 84500, 22500000],
  ["2026-02-17", 84500, 86200, 83500, 83800, 17600000],
  ["2026-02-24", 83800, 86800, 83000, 86100, 25300000],
  ["2026-03-03", 86100, 90200, 85400, 89500, 31200000],
  ["2026-03-10", 89500, 91400, 88200, 88900, 22700000],
  ["2026-03-17", 88900, 90900, 87400, 90200, 21600000],
  ["2026-03-24", 90200, 92100, 89000, 91300, 20300000],
  ["2026-03-31", 91300, 92700, 89800, 90600, 18300000],
  ["2026-04-07", 90600, 93400, 90200, 92800, 24700000],
  ["2026-04-14", 92800, 94600, 91200, 91800, 17100000],
  ["2026-04-21", 91800, 95700, 91500, 95100, 28600000],
  ["2026-04-28", 95100, 96800, 93600, 94400, 19800000],
  ["2026-05-05", 94400, 98200, 94100, 97600, 30400000]
];

export const fallbackChart = {
  code: "005930",
  name: "삼성전자",
  interval: "daily",
  range: "6M",
  priceBasis: "close",
  adjusted: true,
  asOf: FALLBACK_AS_OF,
  data: baseCandles.map(([date, open, high, low, close, volume]) => ({
    date,
    open,
    high,
    low,
    close,
    volume
  }))
};

export const fallbackTradeZones = {
  code: "005930",
  name: "삼성전자",
  interval: "daily",
  range: "6M",
  basisDate: FALLBACK_AS_OF,
  riskMode: "neutral",
  confidence: "86%",
  evidence: [
    "20일선 지지 구간에서 거래량이 평균보다 높아졌습니다.",
    "전고점 부근에서는 윗꼬리와 거래량 둔화를 함께 확인해야 합니다.",
    "RSI 과열권 진입 전까지는 추세 유지 가능성이 남아 있습니다."
  ],
  zones: [
    {
      type: "buy_watch",
      label: "매수 검토",
      fromPrice: 93000,
      toPrice: 95000,
      condition: "20일선 지지와 거래량 증가가 함께 확인되면 매수 검토 구간입니다.",
      evidence: "최근 조정 때 20일선 근처에서 종가가 회복했습니다.",
      oppositeSignal: "전저점 이탈 또는 거래량 없는 반등이면 보류합니다.",
      confidence: "medium-high",
      basisDate: FALLBACK_AS_OF,
      beginnerExplanation: "가격이 중요한 평균선 위에서 버티고, 거래량이 늘면 관심이 실제로 붙었다고 볼 수 있습니다."
    },
    {
      type: "split_buy",
      label: "분할매수 검토",
      fromPrice: 90000,
      toPrice: 93000,
      condition: "악재 후 하락이 멈추고 음봉 거래량이 줄어들 때만 분할로 검토합니다.",
      evidence: "이 구간은 이전 돌파 지점과 단기 지지선이 겹칩니다.",
      oppositeSignal: "거래량이 커지며 지지선을 깨면 리스크 관리가 우선입니다.",
      confidence: "medium",
      basisDate: FALLBACK_AS_OF,
      beginnerExplanation: "한 번에 판단하지 않고 여러 조건을 확인하며 나눠 보는 연습 구간입니다."
    },
    {
      type: "hold",
      label: "관망",
      fromPrice: 95000,
      toPrice: 98200,
      condition: "전고점 돌파 전에는 호재가 있어도 추격보다 관망이 더 적절할 수 있습니다.",
      evidence: "상단 저항선과 단기 과열 신호가 가까워졌습니다.",
      oppositeSignal: "거래대금이 크게 붙고 종가가 전고점을 넘으면 재평가합니다.",
      confidence: "medium",
      basisDate: FALLBACK_AS_OF,
      beginnerExplanation: "좋은 뉴스가 있어도 차트가 저항선을 넘지 못하면 쉬어가는 구간일 수 있습니다."
    },
    {
      type: "sell_watch",
      label: "매도 검토",
      fromPrice: 98200,
      toPrice: 101500,
      condition: "급등 이후 거래량 둔화와 긴 윗꼬리가 반복되면 매도 검토 시점입니다.",
      evidence: "전고점 위 가격대는 이전 매물이 나올 수 있는 구간입니다.",
      oppositeSignal: "기관/외국인 수급과 거래대금이 동시에 붙으면 보유 조건을 다시 봅니다.",
      confidence: "medium",
      basisDate: FALLBACK_AS_OF,
      beginnerExplanation: "오른 뒤 힘이 약해지는지 보는 구간입니다. 수익 확정 기준을 미리 정해 둡니다."
    },
    {
      type: "risk",
      label: "리스크 관리",
      fromPrice: 88500,
      toPrice: 90000,
      condition: "20일선과 직전 저점이 동시에 깨지면 리스크 관리 기준을 먼저 세웁니다.",
      evidence: "지지선 이탈은 단기 추세 훼손 신호가 될 수 있습니다.",
      oppositeSignal: "빠르게 회복하고 거래량이 붙으면 단기 흔들림으로 볼 여지도 있습니다.",
      confidence: "medium-high",
      basisDate: FALLBACK_AS_OF,
      beginnerExplanation: "손실을 키우지 않기 위해 미리 확인해야 하는 방어선입니다."
    }
  ]
};

export const fallbackEvents = {
  code: "005930",
  name: "삼성전자",
  from: "2025-11-18",
  to: FALLBACK_AS_OF,
  events: [
    {
      date: "2026-01-20",
      type: "positive",
      severity: "medium",
      priceChangeRate: 2.76,
      volumeChangeRate: 38,
      title: "HBM 수요 기대",
      explanation: "AI 서버 투자 기대가 반도체 대형주 전반에 긍정적으로 반영되었습니다.",
      evidenceSources: [
        {
          type: "news",
          title: "산업 수요 기대",
          description: "AI 메모리 수요와 실적 기대를 함께 확인해야 합니다."
        }
      ],
      causalScores: [
        {
          label: "호재 영향",
          score: 78,
          confidence: "medium",
          interpretation: "상승 재료가 있었지만 차트 돌파 확인이 필요합니다."
        }
      ]
    },
    {
      date: "2026-03-03",
      type: "positive",
      severity: "high",
      priceChangeRate: 3.95,
      volumeChangeRate: 72,
      title: "거래량 동반 돌파",
      explanation: "전고점 돌파 시도와 거래량 증가가 함께 나타났습니다.",
      evidenceSources: [
        {
          type: "chart",
          title: "거래량",
          description: "평균 거래량 대비 높은 거래가 발생했습니다."
        }
      ],
      causalScores: [
        {
          label: "수급 신호",
          score: 86,
          confidence: "high",
          interpretation: "가격 상승이 실제 관심 증가를 동반했습니다."
        }
      ]
    },
    {
      date: "2026-04-14",
      type: "negative",
      severity: "medium",
      priceChangeRate: -1.08,
      volumeChangeRate: -19,
      title: "전고점 부근 매물 부담",
      explanation: "상단 저항선 근처에서 거래량이 줄며 관망 신호가 생겼습니다.",
      evidenceSources: [
        {
          type: "chart",
          title: "저항선",
          description: "전고점 부근에서 종가 돌파가 확인되지 않았습니다."
        }
      ],
      causalScores: [
        {
          label: "악재 영향",
          score: 64,
          confidence: "medium",
          interpretation: "추세 훼손보다 단기 과열 해소에 가깝습니다."
        }
      ]
    }
  ]
};

export const fallbackAiBrief = {
  status: "fallback",
  conclusion: "현재 국면은 상승 추세 유지 속 단기 조정입니다.",
  prediction: "20일선 지지와 거래량 재확대가 함께 확인되면 관심 후보로 유지할 수 있습니다.",
  stage: "상승 추세 유지 속 단기 조정",
  confidence: "86%",
  basisDate: FALLBACK_AS_OF,
  limitations: [
    "실시간 체결 데이터가 아니라 백엔드 응답 또는 프론트 fallback 기준입니다.",
    "교육용 조건 설명이며 투자 지시나 수익 보장이 아닙니다."
  ],
  sources: ["daily summaries", "chart OHLCV", "event markers", "learning terms"],
  thesis: [
    "20일 이동평균선 위에서 종가가 회복되며 추세가 완전히 꺾이지 않았습니다.",
    "거래량이 붙은 상승 구간이 있어 단순 반등보다 수급 확인 신호가 강합니다.",
    "전고점 근처에서는 윗꼬리와 거래량 둔화가 나오면 관망 조건으로 바뀝니다."
  ],
  opposingSignals: [
    "전저점 이탈",
    "거래량 없는 반등",
    "호재 뉴스에도 전고점 미돌파"
  ],
  riskRules: [
    "20일선 이탈 시 리스크 관리 기준을 먼저 확인합니다.",
    "급등 후 거래량 둔화가 2회 이상 반복되면 매도 검토 조건을 점검합니다."
  ]
};

export const fallbackLearningTerms = [
  {
    id: "rate",
    term: "등락률",
    category: "기초 지표",
    coreSummary: "전일 종가 대비 오늘 가격이 얼마나 움직였는지 보여주는 숫자입니다.",
    plainDefinition: "가격 변화의 크기를 퍼센트로 표현한 값입니다.",
    longExplanation:
      "등락률은 오늘 주가가 전날보다 얼마나 올랐거나 내렸는지 빠르게 비교하게 해줍니다.\n같은 1,000원 상승이라도 주가가 낮은 종목과 높은 종목의 의미는 다릅니다.\n그래서 초보자는 금액보다 등락률을 먼저 보면 종목 간 움직임을 더 공정하게 비교할 수 있습니다.",
    chartUsage: "차트에서는 큰 양봉, 큰 음봉, 갭 상승/하락 구간과 함께 확인합니다.",
    whyItMatters: "급등과 급락을 구분하고, 과열인지 정상 상승인지 판단하는 첫 단서입니다.",
    beginnerCheck: "등락률만 보고 판단하지 말고 거래량과 이유를 같이 확인합니다.",
    caution: "높은 등락률은 좋은 기회일 수도 있지만 이미 과열된 신호일 수도 있습니다.",
    commonMisunderstanding: "많이 올랐으니 계속 오른다고 생각하는 실수가 많습니다.",
    scenario: "호재 뉴스로 8% 올랐지만 거래량이 평소보다 낮다면 추격보다 관망 조건을 봅니다.",
    relatedTerms: ["거래량", "변동성", "저항선"],
    exampleQuestions: ["오늘 등락률이 큰 이유는 뭐야?", "등락률과 거래량을 같이 보면 뭐가 달라?"],
    relatedQuestions: ["이 등락률은 과열이야?", "차트에서 다음 확인 지점은 어디야?"]
  },
  {
    id: "volume",
    term: "거래량",
    category: "차트 지표",
    coreSummary: "얼마나 많은 주식이 거래됐는지 보여주는 관심의 크기입니다.",
    plainDefinition: "정해진 기간 동안 사고팔린 주식 수입니다.",
    longExplanation:
      "거래량은 가격 움직임에 실제 참여가 있었는지 확인하게 해줍니다.\n가격이 오르는데 거래량도 늘면 더 많은 사람이 그 움직임에 참여한 것으로 볼 수 있습니다.\n반대로 가격은 오르지만 거래량이 줄면 힘이 약한 반등일 수 있어 조심해야 합니다.",
    chartUsage: "캔들 아래 막대 그래프에서 보며, 돌파 구간과 하락 구간의 거래량을 비교합니다.",
    whyItMatters: "가격 상승 또는 하락의 신뢰도를 판단하는 핵심 보조 지표입니다.",
    beginnerCheck: "최근 평균보다 거래량이 큰지, 상승일 때 늘었는지 하락일 때 늘었는지 봅니다.",
    caution: "거래량 급증은 호재뿐 아니라 악재 공포에서도 나타날 수 있습니다.",
    commonMisunderstanding: "거래량이 많으면 무조건 좋다고 보는 실수가 있습니다.",
    scenario: "20일선을 돌파할 때 거래량이 평균보다 크면 매수 검토 조건 하나가 충족됩니다.",
    relatedTerms: ["수급", "OBV", "돌파"],
    exampleQuestions: ["거래량이 늘면 왜 중요해?", "거래량 없는 상승은 위험해?"],
    relatedQuestions: ["오늘 거래량은 평균보다 많아?", "거래량으로 매도 검토를 어떻게 해?"]
  },
  {
    id: "moving-average",
    term: "이동평균선",
    category: "차트 지표",
    coreSummary: "일정 기간 평균 가격을 선으로 연결해 추세를 쉽게 보게 해주는 지표입니다.",
    plainDefinition: "최근 며칠간의 평균 종가를 계산해 만든 선입니다.",
    longExplanation:
      "이동평균선은 매일 흔들리는 가격을 조금 부드럽게 만들어 추세를 보게 해줍니다.\n20일선은 단기 흐름, 60일선은 중기 흐름을 볼 때 자주 사용됩니다.\n가격이 주요 이동평균선 위에 있으면 추세가 유지되는지, 아래로 내려가면 약해졌는지 확인합니다.",
    chartUsage: "캔들 위에 겹쳐진 선으로 보며, 지지와 저항 역할을 하는 구간을 확인합니다.",
    whyItMatters: "매수 검토, 관망, 리스크 관리 조건을 세우는 기준선이 됩니다.",
    beginnerCheck: "선 하나만 보지 말고 가격, 거래량, 전고점 위치를 같이 봅니다.",
    caution: "횡보장에서는 이동평균선 신호가 자주 틀릴 수 있습니다.",
    commonMisunderstanding: "20일선 위라면 항상 안전하다고 착각하기 쉽습니다.",
    scenario: "20일선을 지키며 거래량이 다시 늘면 관심 후보로 유지할 수 있습니다.",
    relatedTerms: ["지지선", "저항선", "추세"],
    exampleQuestions: ["20일선 지지는 무슨 뜻이야?", "이동평균선이 깨지면 팔아야 해?"],
    relatedQuestions: ["지금 가격은 20일선 위야?", "60일선과 같이 보면 뭐가 달라?"]
  },
  {
    id: "rsi",
    term: "RSI",
    category: "보조 지표",
    coreSummary: "최근 상승과 하락의 힘을 비교해 과열 또는 침체 가능성을 보는 지표입니다.",
    plainDefinition: "가격 상승 압력과 하락 압력을 0부터 100 사이 숫자로 표현합니다.",
    longExplanation:
      "RSI가 높으면 최근 상승 힘이 강했다는 뜻이고, 낮으면 하락 힘이 강했다는 뜻입니다.\n일반적으로 70 근처는 과열, 30 근처는 침체로 참고하지만 절대 기준은 아닙니다.\n강한 추세에서는 RSI가 높아도 더 오를 수 있어 가격과 거래량을 함께 확인해야 합니다.",
    chartUsage: "차트 하단 보조지표 영역에서 선으로 보며, 60 이상 유지나 70 접근을 확인합니다.",
    whyItMatters: "추격 매수와 성급한 매도를 피하는 데 도움을 줍니다.",
    beginnerCheck: "RSI 숫자보다 추세 유지와 반대 신호를 함께 확인합니다.",
    caution: "RSI 과열만 보고 바로 매도 판단을 내리면 강한 추세를 놓칠 수 있습니다.",
    commonMisunderstanding: "RSI 70이면 반드시 내려간다고 믿는 실수가 많습니다.",
    scenario: "RSI가 67이고 전고점 아래라면 돌파 확인 전에는 관망 조건을 봅니다.",
    relatedTerms: ["MACD", "변동성", "과열"],
    exampleQuestions: ["RSI 70은 위험해?", "RSI와 거래량을 같이 보면 뭐가 좋아?"],
    relatedQuestions: ["현재 RSI는 매수 검토에 유리해?", "RSI 반대 신호는 뭐야?"]
  },
  {
    id: "macd",
    term: "MACD",
    category: "보조 지표",
    coreSummary: "짧은 추세와 긴 추세의 차이를 이용해 방향 전환 가능성을 보는 지표입니다.",
    plainDefinition: "단기 이동평균과 장기 이동평균의 차이를 선으로 나타낸 지표입니다.",
    longExplanation:
      "MACD는 추세의 방향과 힘이 바뀌는 순간을 찾는 데 쓰입니다.\nMACD선이 시그널선을 위로 넘으면 상승 모멘텀이 생겼다고 볼 수 있습니다.\n하지만 가격이 이미 많이 오른 뒤에는 늦게 나타날 수 있어 차트 위치와 같이 확인합니다.",
    chartUsage: "차트 하단에서 MACD선과 시그널선의 교차, 히스토그램 변화를 확인합니다.",
    whyItMatters: "관망에서 매수 검토로 넘어갈 수 있는 변화 신호를 찾는 데 도움됩니다.",
    beginnerCheck: "골든크로스만 보지 말고 전고점 돌파와 거래량을 함께 봅니다.",
    caution: "횡보장에서는 교차 신호가 자주 흔들릴 수 있습니다.",
    commonMisunderstanding: "MACD가 위로 교차하면 무조건 오른다고 생각하는 실수가 있습니다.",
    scenario: "MACD가 개선되지만 거래량이 줄면 매수 검토보다 관망이 더 적절할 수 있습니다.",
    relatedTerms: ["이동평균선", "추세", "모멘텀"],
    exampleQuestions: ["MACD 골든크로스는 뭐야?", "MACD가 늦게 반응하는 이유는?"],
    relatedQuestions: ["현재 MACD는 상승 신호야?", "MACD 반대 신호는 어떻게 봐?"]
  }
];

export const requiredLearningTerms = [
  "등락률",
  "거래량",
  "거래대금",
  "PER",
  "PBR",
  "ROE",
  "공시",
  "DART",
  "일봉",
  "주봉",
  "월봉",
  "이동평균선",
  "손절",
  "분할매수",
  "추세",
  "저항선",
  "지지선",
  "변동성",
  "거래정지",
  "시가총액",
  "섹터",
  "테마",
  "수급",
  "RSI",
  "MACD",
  "OBV",
  "볼린저밴드"
];

export const aiPipeline = [
  "Data Collector",
  "Event Detector",
  "Evidence Ranker",
  "Beginner Explainer",
  "Risk Reviewer",
  "Response Composer"
];
