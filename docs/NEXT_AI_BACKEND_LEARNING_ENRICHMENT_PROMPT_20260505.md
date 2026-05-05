# Backend and AI Learning Enrichment Implementation Prompt 20260505

작성일: 2026-05-05

이 문서는 다음 AI에게 그대로 전달하기 위한 구현 지시서다. 목적은 프론트 전면 재작성 없이, 현재 앱이 부족하게 느껴지는 백엔드 분석 기능, 학습 콘텐츠 깊이, AI 응답 구조를 보강하는 것이다.

---

## 0. 이번 작업의 핵심 목표

현재 앱은 차트, 20일 이동평균선, 매수/매도 검토 구간, AI 카드, 학습 시트의 기본 형태는 있다. 그러나 사용자가 기대하는 "AI가 알려주는 듯한 설명"은 아직 부족하다.

다음 AI는 아래를 구현해야 한다.

1. 이동평균선이 무엇이고, 현재 차트에서 어떤 의미인지 백엔드가 구조화해서 내려준다.
2. 매수/매도 시점은 직접 지시하지 않고, "매수 검토 조건", "매도 검토 조건", "관망 조건", "리스크 관리 조건"으로 설명한다.
3. 호재와 악재를 단순 목록이 아니라 "왜 호재인지", "왜 악재인지", "반대 신호는 무엇인지"까지 설명한다.
4. 학습 용어는 짧은 사전 수준이 아니라, 초보자가 실제 차트와 연결해서 이해할 수 있는 깊이로 확장한다.
5. AI 응답은 화면이 바로 사용할 수 있도록 구조화 필드를 충분히 반환한다.

중요: 개인화 투자 조언, 수익 보장, "지금 사라", "지금 팔아라" 같은 직접 지시는 절대 만들지 않는다. 모든 표현은 교육용 조건 검토로 제한한다.

---

## 1. 반드시 먼저 읽을 문서

작업 전에 아래 문서를 읽고 현재 요구사항과 실제 구현의 차이를 확인한다.

1. `docs/AI_HANDOFF_PROMPT.md`
2. `docs/API_SPEC.md`
3. `docs/ROADMAP.md`
4. `docs/FRONTEND_FOLLOWUP_IMPLEMENTATION_PROMPT_20260505_V1.md`
5. `docs/API_PORTFOLIO_AI_ENRICHMENT_20260505.md`
6. `docs/LLM_QUALITY_BENCHMARK.md`
7. `README.md`
8. `PRD.md`

특히 `docs/AI_HANDOFF_PROMPT.md`의 Phase 2, Phase 3, Phase 5와 `docs/API_SPEC.md`의 `/api/stocks/{code}/trade-zones`, `/api/ai/chat` 명세를 기준으로 삼는다.

---

## 2. 현재 확인된 부족한 부분

### 2.1 이동평균선 설명이 화면과 AI 응답에 충분히 연결되지 않음

현재 `frontend/src/components/ImmersiveChart.jsx`는 프론트에서 `ma20`을 직접 계산해서 선만 그린다. 툴팁에는 `20일선: 가격` 정도만 나온다.

부족한 점:

- 백엔드 `StockChartDto`에는 이동평균선 배열, 기울기, 현재가와 이동평균선의 거리, 정배열/역배열 같은 해석 필드가 없다.
- `AiChatContextEnricher`는 차트 최신 종가와 거래량만 넘기고, 이동평균선 상태를 AI 근거로 넘기지 않는다.
- `LearningTermCatalog`의 이동평균선 설명은 기본 의미는 있으나, "20일선 위/아래", "기울기", "돌파", "이탈", "후행성", "거래량과 함께 보는 이유"까지 충분히 풀어주지 않는다.

### 2.2 매수/매도 검토 구간은 있으나 이유가 얕음

현재 `StockTradeZoneService`는 5개 구간을 반환한다.

- `buy_review`
- `split_buy`
- `watch`
- `sell_review`
- `risk_management`

하지만 응답은 주로 가격 범위와 짧은 조건 문장이다.

부족한 점:

- 현재 차트 상태가 왜 매수 검토 또는 매도 검토에 가까운지 설명하는 `reasoning`이 없다.
- 조건이 깨지는 상황을 설명하는 `invalidationSignal` 또는 `oppositeSignal`은 있지만, 초보자가 이해할 만큼 충분히 구체적이지 않다.
- 이동평균선, 거래량, 지지선, 저항선이 각각 어떤 역할을 했는지 분리된 구조화 필드가 없다.
- 일봉, 주봉, 월봉에서 같은 신호가 다르게 해석될 수 있다는 설명이 약하다.

### 2.3 호재/악재 판단의 이유가 구조화되어 있지 않음

현재 이벤트 API는 가격 급등, 급락, 거래량 급증 같은 이벤트를 제공한다. 일부 evidence source와 causal score도 있다.

부족한 점:

- 이벤트가 호재인지, 악재인지, 혼합 신호인지 판단한 결과가 명확한 구조로 내려오지 않는다.
- "왜 호재인지", "왜 악재인지", "그래도 반대로 볼 수 있는 신호는 무엇인지"가 별도 필드로 없다.
- AI 카드의 호재/악재는 실제 AI 응답보다 fallback 문구에 기대는 흐름이 있다.
- `AiChatContextEnricher`가 이벤트의 `evidenceSources`, `causalScores`를 AI service에 충분히 전달하지 않아 좋은 근거가 있어도 답변 깊이가 제한된다.

### 2.4 `/api/ai/chat`의 `structured`가 화면용으로 부족함

현재 `ai-service/app/main.py`의 `structured` 응답은 대략 아래 필드 중심이다.

- `conclusion`
- `evidence`
- `opposingSignals`
- `risks`
- `sources`
- `confidence`
- `basisDate`
- `limitations`

부족한 점:

- `buyCondition`, `sellCondition`, `waitCondition`, `riskCondition`이 구조화되어 있지 않다.
- `positives`, `negatives`, `goodNewsReasons`, `badNewsReasons`가 구조화되어 있지 않다.
- `movingAverageExplanation` 또는 `indicatorInsights`가 없다.
- `nextChecklist`, `beginnerSummary`, `chartReadingGuide`가 없다.
- LLM이 좋은 자연어 답변을 생성해도, 프론트가 안정적으로 표시할 구조화 데이터가 부족하다.

### 2.5 학습 콘텐츠가 "사전" 수준에 머무름

현재 학습 용어 API는 많은 용어를 제공하지만, 일부 내용은 템플릿처럼 보인다.

부족한 점:

- 이동평균선, 거래량, 지지선, 저항선, RSI, MACD, OBV, 볼린저밴드 같은 차트 핵심 용어가 실제 매매 검토 구간과 더 깊게 연결되어야 한다.
- 각 용어에 "차트에서 어디를 봐야 하는지", "잘못 이해하기 쉬운 지점", "실제 시나리오", "AI에게 물어볼 다음 질문"이 더 풍부해야 한다.
- 학습 도우미는 아직 `rule_based_learning_preview` 중심이며, AI/RAG와의 연결이 체감되기 약하다.

---

## 3. 구현 범위

프론트 전면 재작성은 하지 않는다. 기존 몰입형 UI 방향은 유지한다.

이번 작업은 백엔드, ai-service, 학습 데이터, 가벼운 프론트 바인딩만 포함한다.

허용되는 프론트 변경:

- 기존 `FloatingAiCard`, `DeepDiveLearningSheet`, `ImmersiveChart`, `apiClient`가 새 구조화 필드를 표시하도록 보강
- 새 카드나 큰 화면 재배치 금지
- 레이아웃 전면 재구성 금지

---

## 4. 백엔드 구현 지시

### 4.1 차트 지표 분석 DTO 추가

`backend/src/main/java/com/krbrief/stocks/` 아래에 차트 지표 분석용 DTO와 서비스를 추가한다.

권장 이름:

- `StockIndicatorSnapshotDto`
- `StockIndicatorService`

반드시 포함할 필드:

```json
{
  "basisDate": "2026-05-05",
  "latestClose": 232500,
  "ma5": 225000,
  "ma20": 214130,
  "ma60": 198000,
  "ma20Slope": "rising | flat | falling",
  "ma60Slope": "rising | flat | falling",
  "priceVsMa20": {
    "position": "above | near | below",
    "distanceRate": 8.58,
    "beginnerExplanation": "현재가는 20일선 위에 있어 단기 추세가 유지되는 쪽으로 볼 수 있지만, 거래량과 저항선을 함께 확인해야 합니다."
  },
  "trendStage": "uptrend_pullback | uptrend_extension | sideways | downtrend_rebound | downtrend",
  "volumeRatio20": 138.0,
  "support": 190100,
  "resistance": 232500,
  "rangePosition": 100.0,
  "beginnerSummary": "20일선 위에 있고 거래량도 평균보다 많지만, 최근 저항선 부근이라 추격보다 확인이 필요한 구간입니다.",
  "caution": "이동평균선은 과거 가격 기반이라 신호가 늦을 수 있습니다."
}
```

계산 규칙:

- `ma5`, `ma20`, `ma60`: 각 기간 종가 평균
- 데이터가 부족하면 가능한 기간만 계산하고 `confidence`를 낮춘다.
- `ma20Slope`: 최근 5개 MA20 값의 변화로 판단
- `position`: 현재가가 MA20 대비 2% 이상 위면 `above`, 2% 이내면 `near`, 2% 이상 아래면 `below`
- `volumeRatio20`: 최근 거래량 / 20일 평균 거래량 * 100
- `trendStage`: 현재가, MA20, MA60, 기울기, 저항선 위치를 함께 사용해 규칙형으로 분류

테스트:

- `StockIndicatorServiceTest` 추가
- 60개 이상 샘플에서 MA20, MA60, slope, distanceRate 계산 검증
- 데이터 부족 시 null/low confidence 처리 검증

### 4.2 기존 trade-zones 응답 확장

기존 `/api/stocks/{code}/trade-zones` 응답을 깨지 말고, 필드를 추가한다.

추가할 필드:

```json
{
  "indicatorSnapshot": {},
  "currentDecisionSummary": {
    "status": "buy_review | watch | sell_review | risk_management",
    "headline": "20일선 위지만 저항선에 가까워 추격보다 확인이 필요한 구간입니다.",
    "why": [
      "현재가가 20일선보다 8.6% 위에 있습니다.",
      "거래량은 20일 평균 대비 138%입니다.",
      "최근 저항선 근처라 위로 더 가려면 거래량 유지가 필요합니다."
    ],
    "beginnerExplanation": "평균선 위에 있다는 점은 긍정적이지만, 이미 많이 오른 자리에서는 새로 따라가기보다 다음 지지 확인이 중요합니다."
  }
}
```

각 zone에도 아래 필드를 추가한다.

- `reasoning`
- `indicatorEvidence`
- `invalidationSignal`
- `goodScenario`
- `badScenario`
- `beginnerChecklist`

주의:

- 기존 `type`, `label`, `fromPrice`, `toPrice`, `condition`, `evidence`, `oppositeSignal`, `confidence`, `basisDate`, `beginnerExplanation`은 제거하지 않는다.

### 4.3 이벤트 호재/악재 분류 보강

이벤트 응답 또는 백엔드 보강 레이어에서 아래 필드를 추가한다.

```json
{
  "sentiment": "positive | negative | mixed | neutral",
  "goodNewsReasons": [
    "가격 상승과 거래량 증가가 함께 나타나 실제 참여가 붙은 이벤트일 수 있습니다."
  ],
  "badNewsReasons": [
    "급등 후 거래량이 줄면 단기 차익 실현 매물이 나올 수 있습니다."
  ],
  "oppositeSignals": [
    "다음 거래일에 거래량 없이 종가가 밀리면 호재 지속성을 낮춰야 합니다."
  ],
  "whyItMoved": [
    "가격 변화와 거래량 변화가 같은 날 커졌습니다.",
    "뉴스/공시 근거가 있으면 원인 신뢰도를 높입니다."
  ],
  "verificationChecklist": [
    "DART 공시 확인",
    "동일 날짜 뉴스 확인",
    "다음 거래일 거래량 유지 여부 확인"
  ]
}
```

분류 규칙 예시:

- 가격 상승 + 거래량 급증 + 긍정 causal direction이면 `positive`
- 가격 하락 + 거래량 급증이면 `negative`
- 가격 상승이지만 evidence 부족, 또는 급등 후 과열이면 `mixed`
- 움직임이 작고 근거도 약하면 `neutral`

### 4.4 AI chat context enrichment 강화

`backend/src/main/java/com/krbrief/ai/AiChatContextEnricher.java`를 보강한다.

반드시 AI service에 넘길 것:

- `indicatorSnapshot`
- `tradeZones`
- `currentDecisionSummary`
- 이벤트의 `evidenceSources`
- 이벤트의 `causalScores`
- 이벤트의 `sentiment`, `goodNewsReasons`, `badNewsReasons`, `oppositeSignals`
- 질문에 등장한 학습 용어

현재처럼 chart latest만 넘기면 부족하다. AI가 "이동평균선", "언제 매수/매도 검토", "호재/악재 이유"를 답하려면 지표와 이벤트 이유가 retrieval 문서에 들어가야 한다.

---

## 5. ai-service 구현 지시

### 5.1 ChatRequest 스키마 확장

`ai-service/app/main.py`의 `ChatRequest`에 아래 필드를 추가한다.

- `indicatorSnapshot`
- `tradeZones`
- `currentDecisionSummary`

### 5.2 retrieval 문서 확장

`_build_retrieval_documents()`가 아래 문서를 생성해야 한다.

- `indicator-snapshot`
- `trade-zone-buy-review`
- `trade-zone-sell-review`
- `trade-zone-risk-management`
- `event-*-sentiment`
- `event-*-evidence-*`
- `event-*-causal-*`
- `term-*`

### 5.3 structured 응답 확장

`structured`에 아래 필드를 반드시 포함한다.

```json
{
  "conclusion": "...",
  "beginnerSummary": "...",
  "movingAverageExplanation": {
    "headline": "20일선 위지만 저항선 근처입니다.",
    "whatItMeans": "20일선은 최근 한 달 정도의 평균 가격입니다.",
    "currentSignal": "현재가가 20일선 위에 있어 단기 흐름은 유지되는 편입니다.",
    "caution": "다만 이동평균선은 후행 지표라 거래량과 저항선 확인이 필요합니다."
  },
  "buyCondition": "...",
  "sellCondition": "...",
  "waitCondition": "...",
  "riskCondition": "...",
  "positives": [
    "20일선 위에서 거래량이 평균보다 많아 단기 관심은 유지됩니다."
  ],
  "negatives": [
    "최근 저항선 근처라 추격 시 변동성 리스크가 큽니다."
  ],
  "goodNewsReasons": [],
  "badNewsReasons": [],
  "opposingSignals": [],
  "nextChecklist": [],
  "evidence": [],
  "sources": [],
  "confidence": "medium-high",
  "basisDate": "2026-05-05",
  "limitations": []
}
```

규칙:

- LLM 호출 성공 여부와 관계없이 `structured`는 항상 화면이 쓸 수 있는 형태로 채운다.
- LLM 응답이 좋은 자연어를 만들더라도, `structured.buyCondition`, `structured.sellCondition`, `structured.positives`, `structured.negatives`는 deterministic fallback으로라도 채운다.
- "사라", "팔아라"가 아니라 "매수 검토", "매도 검토", "관망", "리스크 관리"라고 쓴다.

### 5.4 LLM 프롬프트 개선

LLM system prompt에 아래 요구를 추가한다.

- 이동평균선은 현재가와의 위치, 기울기, 후행성, 거래량 확인까지 설명한다.
- 호재/악재는 각각 이유와 반대 신호를 함께 쓴다.
- 매수/매도는 직접 지시하지 않고 조건형 검토로만 쓴다.
- 각 핵심 주장에는 retrieval document id를 붙인다.
- 근거 없는 내용은 "확인 필요" 또는 "가능성"으로 낮춘다.

---

## 6. 학습 콘텐츠 구현 지시

`backend/src/main/java/com/krbrief/learning/LearningTermCatalog.java`를 확장한다.

우선 강화할 용어:

1. 이동평균선
2. 5일선
3. 20일선
4. 60일선
5. 정배열
6. 역배열
7. 골든크로스
8. 데드크로스
9. 거래량
10. 거래대금
11. 지지선
12. 저항선
13. 손절/리스크 관리
14. RSI
15. MACD
16. OBV
17. 볼린저밴드

각 용어는 최소 아래 내용을 가져야 한다.

- `plainDefinition`
- `whyItMatters`
- `beginnerCheck`
- `caution`
- `coreSummary`
- `longExplanation`: 최소 3문장 이상
- `chartUsage`: 실제 차트에서 어디를 보는지
- `commonMisunderstanding`
- `scenario`: 실제 종목을 보는 듯한 예시
- `relatedTerms`
- `exampleQuestions`

이동평균선 예시 수준:

```text
20일선은 최근 20거래일 종가 평균입니다. 초보자는 현재가가 20일선 위인지 아래인지, 선의 기울기가 올라가는지 내려가는지 먼저 봅니다. 가격이 20일선 위에 있어도 거래량이 줄거나 저항선 바로 아래라면 무조건 좋은 신호로 보지 않습니다. 반대로 20일선 아래라도 거래량을 동반해 회복하면 관심 후보로 다시 볼 수 있습니다.
```

---

## 7. 가벼운 프론트 바인딩 지시

프론트 전체 개편은 금지한다. 기존 화면에 새 데이터를 연결만 한다.

### 7.1 `frontend/src/services/apiClient.js`

`normalizeAi()`가 새 structured 필드를 읽도록 한다.

반드시 매핑할 필드:

- `buyCondition`
- `sellCondition`
- `waitCondition`
- `riskCondition`
- `positives`
- `negatives`
- `goodNewsReasons`
- `badNewsReasons`
- `movingAverageExplanation`
- `nextChecklist`

fallback 문구가 실제 API 응답을 덮어쓰지 않게 한다.

### 7.2 `FloatingAiCard`

현재 구조를 유지하면서 아래 정도만 추가한다.

- 이동평균선 한 줄 설명
- 호재/악재 이유 1~2개
- 매수 검토/매도 검토 조건의 근거 문장

카드가 커져서 화면을 가리지 않도록 접힘 상태는 유지한다.

### 7.3 `DeepDiveLearningSheet`

학습 용어가 풍부해진 만큼 아래를 표시한다.

- 왜 중요한지
- 초보자 체크
- 차트에서 보는 법
- 주의할 점
- 시나리오
- 다음 질문

---

## 8. 테스트 지시

처음부터 테스트만 붙잡지 말고, 구현 후 아래를 순서대로 실행한다.

### 8.1 백엔드 단위 테스트

추가 또는 갱신:

- `StockIndicatorServiceTest`
- `StockTradeZoneServiceTest`
- `AiChatContextEnricherTest`
- `LearningTermCatalogTest`
- `AiChatControllerTest`

검증할 것:

- MA20/MA60 계산
- slope 계산
- price vs MA20 position 계산
- trade-zones가 indicator snapshot을 포함
- AI context에 indicator/trade zones/events evidence가 포함
- 이동평균선 학습 용어가 충분한 문장을 포함

### 8.2 ai-service 테스트

가능하면 `pytest`를 추가하거나 기존 방식에 맞춰 최소 테스트를 만든다.

검증할 것:

- 최소 질문만 보내도 `structured.buyCondition`, `structured.sellCondition`, `movingAverageExplanation`이 존재
- retrieval documents에 `indicator-snapshot`과 `trade-zone-*`가 존재
- 금지 표현이 없음

### 8.3 API 스모크 테스트

`scripts/test_all_apis.sh`에 아래 검사를 추가한다.

- `/api/stocks/005930/trade-zones` 응답에 `indicatorSnapshot`
- `/api/stocks/005930/trade-zones` 응답에 `currentDecisionSummary`
- `/api/ai/chat` 최소 질문 응답에 `movingAverageExplanation`
- `/api/ai/chat` 응답에 `buyCondition`, `sellCondition`, `positives`, `negatives`
- `/api/learning/terms?query=이동평균선` 응답에 `chartUsage`, `scenario`, `commonMisunderstanding`

### 8.4 프론트 E2E

기존 `frontend/tests/frontend-quality.spec.js`에 아래를 추가한다.

- AI 카드 펼침 시 이동평균선 설명이 보임
- AI 카드에 호재/악재 이유가 보임
- 학습 시트에서 이동평균선의 차트 설명이 보임
- PC 1440px, 모바일 390px에서 텍스트 잘림과 겹침이 없음

### 8.5 전체 검증

마지막에 실행:

```bash
cd backend && ./gradlew test
cd ../frontend && npm run build
cd .. && make up
make health
BASE_URL=http://localhost:8080 ./scripts/test_all_apis.sh
cd frontend && APP_URL=http://localhost:5173 npm run test:e2e
cd .. && ./scripts/verify_no_secrets.sh
./scripts/verify_investment_language.sh
```

---

## 9. 완료 조건

완료로 인정하려면 아래가 모두 충족되어야 한다.

1. 이동평균선 설명이 백엔드/AI 응답/학습 시트에 모두 연결되어 있다.
2. AI 카드가 fallback이 아니라 실제 API 구조화 필드 기반으로 매수 검토, 매도 검토, 호재, 악재 이유를 보여준다.
3. `/api/ai/chat`은 질문만 받아도 검색, 차트, 지표, 이벤트, 학습 용어를 자동 보강한다.
4. `/api/stocks/{code}/trade-zones`는 지표 snapshot과 현재 판단 요약을 포함한다.
5. 학습 용어는 단어 뜻이 아니라 차트 사용법과 시나리오까지 포함한다.
6. 직접 투자 지시나 수익 보장 표현이 없다.
7. PC 1440px와 모바일 390px에서 화면 겹침/글자 잘림이 없다.
8. 전체 테스트와 secret 검사가 통과한다.

---

## 10. 커밋 규칙

작업 전 `git log -5 --oneline`으로 기존 커밋 형식을 확인한다.

권장 커밋 메시지:

```text
[FEAT]: (1) 이동평균선 기반 차트 해석 보강 / (2) AI 매수·매도 검토 조건과 호재·악재 이유 구조화 / (3) 학습 콘텐츠와 검증 항목 확장
```

`.env`, `.env.*`, API key, DB password, Discord webhook, OpenAI key, admin key 같은 민감정보는 절대 커밋하지 않는다.

---

## 11. 최종 보고 양식

다음 형식으로 보고한다.

1. 구현한 백엔드 기능
2. 풍부해진 학습 콘텐츠
3. AI 응답 구조화 필드
4. 프론트 바인딩 변경 범위
5. PC/모바일 UI 검증 결과
6. API/E2E/secret/투자문구 검증 결과
7. 남은 한계
8. commit hash와 push 여부

