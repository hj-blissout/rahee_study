# 수학 인덱스 소단원 완료 표시 수정

**날짜**: 2025-03-16

## 요약
수학 인덱스에서 단원(1단원) 완료는 표시되지만, 개별 소단원(소인수분해, 최대공약수와 최소공배수 등) 완료 표시가 안 나오던 문제 수정.

## 원인
1. **Supabase 동기화 타이밍**: 인덱스 로드 시 `loadMathProgress`가 `pullFromSupabase` 완료 전에 실행되어 최신 데이터 반영 안 됨
2. **getUnitInfo 경로**: `pathname`이 `/math`(슬래시 없음)일 때 `pathname.includes('/math/')`가 false → 잘못된 상대 경로 사용
3. **뒤로가기 시 갱신 없음**: bfcache로 복귀 시 진행률 재렌더링 안 함

## 변경 내용

### math/index.html
- `loadMathProgress` 전에 `await pullFromSupabase()` 추가
- `pageshow` 이벤트에서 bfcache 복귀 시 `loadMathProgress()` 재호출

### math_logic.js getUnitInfo
- `pathname.includes('/math/')` → `pathname.includes('/math')`로 변경 (pathname `/math` 대응)
- basePath 계산: `pathname.includes('.')` 체크로 index.html vs /math/ 구분

## 영향 범위
- math/index.html 단원 카드 내 lesson-list
- getUnitInfo를 사용하는 모든 페이지
