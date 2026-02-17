# 점검 체크리스트 (A/MVP)

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
