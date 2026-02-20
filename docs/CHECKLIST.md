# 점검 체크리스트 (A/MVP)

## 개발 TODO/우선순위

- 남은 개발 작업 목록은 `docs/ROADMAP.md`에서 관리합니다.

---

## 1) 기동

(참고) 휴장일 검증 빠른 체크:
```bash
# 주말/공휴일로 의심되는 날짜를 넣어 marketClosed가 true인지 확인
curl -s 'http://localhost:8000/leaders?date=2026-02-21' | jq '.marketClosed,.marketClosedReason,.source'
```


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
- 휴장일 날짜를 선택했을 때:
  - 휴장 배지/문구 표시
  - 근거 링크(KRX/네이버) 2개가 클릭 가능

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
