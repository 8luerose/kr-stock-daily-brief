# PC Responsive Refinement Prompt 20260505

## 목표

모바일 화면에서 확보한 몰입형 사용 경험을 유지하면서, PC 화면도 별도 설계된 반응형 경험으로 완성한다. 프론트엔드 아키텍처를 전면 재작성하지 않고, 현재 검색, 차트, AI 카드, 학습 모드, 포트폴리오 샌드박스 구조를 살려 PC 레이아웃 밀도와 위치 체계를 바로잡는다.

## 참고한 기존 문서 기준

- `docs/FRONTEND_REBUILD_AUDIT_AND_NEXT_AI_PROMPT.md`
- `docs/NEXT_AI_MASTER_IMPLEMENTATION_PROMPT_20260505_V1.md`
- `docs/NEXT_AI_UI_FIX_PROMPT_20260505.md`

## 구현 기준

1. PC 1440px, 1280px, 1024px에서 검색, 차트, AI 카드, 액션 버튼, 포트폴리오 패널이 잘리거나 겹치지 않아야 한다.
2. 모바일 390px의 현재 사용 경험은 유지한다.
3. desktop에서는 검색을 좌측 command rail에 두고, 학습/포트폴리오 액션은 우측 compact group으로 묶는다.
4. desktop에서는 AI 카드를 하단 중앙이 아니라 우측 insight rail로 배치해 차트 중심 화면을 가리지 않게 한다.
5. 검색 결과와 접힌 AI 카드 텍스트는 중간에 잘리지 않도록 줄바꿈과 최소 너비를 보강한다.
6. 닫힌 drawer나 sheet가 viewport 밖에 보이는 요소로 남아 visual regression 검증을 방해하지 않게 한다.
7. Recharts 마커가 화면 밖으로 살짝 삐져나가지 않도록 차트 margin을 보정한다.
8. E2E에는 PC 1440px, 1280px, 1024px, mobile 390px 반응형 배치 검증을 추가한다.

## 루프

1. 실제 화면을 PC/mobile로 측정한다.
2. 겹침, 잘림, 화면 밖 이탈을 수정한다.
3. `npm run build`를 실행한다.
4. Playwright 좌표 측정으로 PC 1440px, 1280px, 1024px, mobile 390px를 재검증한다.
5. `npm run test:e2e`, `scripts/test_all_apis.sh`, `scripts/verify_no_secrets.sh`를 마지막에 실행한다.
6. 커밋하고 푸시한다.
