# 운영/배포 가이드

## 로컬 기동

```bash
cp .env.example .env
make up
make health
```

서비스:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8080`
- Marketdata: `http://localhost:8000`
- AI service: `http://localhost:8100`
- Qdrant: `http://localhost:6333`

## 출시 전 점검

```bash
make ops-check
./gradlew test
(cd frontend && npm run build)
python3 -m py_compile marketdata-python/app/main.py
python3 -m py_compile ai-service/app/main.py
docker compose up -d --build
./scripts/test_all_apis.sh
```

정상 기준:
- `docker compose config -q`가 통과하고 tracked `.env`/명백한 secret token이 없다.
- `docker compose ps`에서 mysql/backend/frontend/marketdata/ai-service/qdrant가 모두 `Up`
- `GET /actuator/health`가 `{"status":"UP"}`
- `GET /api/stocks/005930/chart` 응답에 `data[]` 존재
- `POST /api/ai/chat` 응답에 `sources`, `limitations`, `oppositeSignals` 존재
- 브라우저에서 첫 화면, 종목 차트, AI 차트 해석 버튼, 포트폴리오 샌드박스가 보임

## 운영 주의

- `.env`, API key, DB password, webhook URL은 commit하지 않는다.
- 공개 배포 전 `ADMIN_KEY`를 설정하고 `APP_ADMIN_TRUSTED_CIDRS`를 엄격하게 제한한다.
- AI 응답은 교육용 분석 보조이며 매수/매도 지시로 표시하지 않는다.
- pykrx/KRX 장애 시 생성이 지연될 수 있으므로 `marketdata` 로그를 먼저 확인한다.
