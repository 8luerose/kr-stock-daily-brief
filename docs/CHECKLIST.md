# 점검 체크리스트 (A/MVP)

## P0 / P1 / P2 작업 체크리스트 (남은 코딩)

### P0 (정확도/신뢰성 — 최우선)

- [ ] **휴장일/비거래일 정확성 확정**
  - [ ] 기준 데이터 소스 결정(예: KRX/공공데이터/검증 가능한 캘린더)
  - [ ] 서버에서 "비거래일이면 생성 금지" 또는 "휴장 안내 요약" 중 정책 확정
  - [ ] API 응답에 사용자 친화적 안내(예: `marketClosed=true`, `marketClosedReason`) 제공
  - [ ] 테스트 케이스 추가: 주말 + 실제 공휴일 + 임시휴장(있다면)

- [ ] **백필(2025-01-01 ~ 2026-02-20) 대량 생성 안정화**
  - [ ] 중간 실패 시 재시도/부분 성공 결과 리포트(실패 날짜 목록 포함)
  - [ ] 호출량/속도 제한(시장데이터 API 부담 완화)
  - [ ] 랜덤 샘플링 QA 스크립트로 검증(최소 10~30일)
  - [ ] "이미 존재하는 날짜" 처리 정책 확인(스킵/재생성/아카이브 후 재생성)

- [ ] **pykrx 데이터 신뢰성 교차검증(사용자 설명용) 강화**
  - [ ] 네이버 금융 + Yahoo Finance 링크가 항상 "사용자 클릭 가능한" 형태로 들어가는지 확인
  - [ ] 대표 샘플 3~5일치에 대해 "차이 0원" 로그/결과를 남기는 옵션(필요 시)

### P1 (UX/설명 품질)

- [ ] **설명(비LLM) 문구 품질 통일**
  - [ ] 초보자 친화 문장(어려운 용어 최소화)
  - [ ] "왜 이 종목이 1위인지"를 1줄로 명확히
  - [ ] 이상치 필터 사유(투명성) 문구 다듬기

- [ ] **프론트 UI 폴리싱(캘린더/카드/다크모드)**
  - [ ] 모바일 레이아웃 확인
  - [ ] 다크모드 토글 UX 마감
  - [ ] 생성/로딩/에러 상태 표시 개선

### P2 (운영/배포 마감)

- [ ] **외부 공개(노로그인) 시나리오 마감**
  - [ ] PUBLIC_KEY 게이트 기본값 정책 정리(OFF 권장, 필요 시 ON)
  - [ ] README에 외부 공개 시 주의사항/운영 가이드 추가

- [ ] **관측/모니터링(로그/오류) 정리**
  - [ ] 백필/생성 실패 원인 로그 구조 정리
  - [ ] 간단한 헬스/메트릭 확인 루틴 문서화

---

## 1) 기동

```bash
make up
make health
```

정상 기준:
- backend health가 `{"status":"UP"}`
- frontend 페이지 접속 가능

## 2) 수동 생성

```bash
make generate-today
# (내부적으로 /api/summaries/generate/today 호출)
```

정상 기준:
- JSON 응답에 `topGainer`, `topLoser`, `source(rawNotes)` 포함
- anomaly-aware 필드 확인:
  - `rawTopGainer/rawTopLoser`
  - `filteredTopGainer/filteredTopLoser`
  - `anomalies[]`, `rankingWarning`
  - `leaderExplanations.topGainer/topLoser` (`level`, `summary`, `evidenceLinks`)

## 3) 월 조회

```bash
make check-month MONTH=2026-02
```

정상 기준:
- 배열(JSON) 응답
- 생성된 날짜가 포함됨

## 4) UI 확인

- `http://localhost:5173`
- 날짜 선택 후 Generate
- 생성 직후 해당 날짜 dot가 즉시 표시되는지 확인

## 5) PUBLIC_KEY 모드 확인(선택)

```bash
PUBLIC_KEY=secret make up
```

- UI: `http://localhost:5173/?k=secret`
- API: `...&k=secret` 없으면 403, 있으면 200

### 자동 회귀 점검

```bash
./scripts/qa_public_key.sh
# or
make qa
```

정상 기준:
- PUBLIC_KEY off: stats 200
- PUBLIC_KEY on + key 없음: 401 또는 403
- PUBLIC_KEY on + key 있음: 200

## 6) 날짜 고정 회귀 점검(추천)

```bash
./scripts/recheck_past_dates.sh 2026-02-02 2026-02-09 2026-02-13
# 날짜 미지정 시 기본 3개 날짜 사용
```

정상 기준:
- 각 날짜 generate 성공
- `leaderExplanations.topGainer/topLoser.summary` 존재
- 5개 출처 링크(`*DateSearch`)가 종목 직접 링크 형식으로 채워짐
