# 수학 완료 저장: localStorage → Supabase 전환

**날짜**: 2025-03-16

## 요약
수학 소단원 완료 기록을 localStorage 대신 Supabase를 소스로 사용하도록 변경.

## 변경 내용

### math_logic.js
- **`_mathProgressCache`**: in-memory 캐시 (Supabase pull 결과)
- **`getMathProgress(key)`**: 캐시에서 조회
- **`pullFromSupabase()`**: Supabase에서 `math_tutor_*` 키만 가져와 캐시에 반영
- **`syncProgress(key, date)`**: Supabase에 push + 캐시 업데이트 (localStorage 제거)
- **`loadMathProgress`, `renderLessonList`, `isLessonComplete`**: `getMathProgress()` 사용
- **Lifecycle**: `pullFromSupabase` → `loadMathProgress` 순서로 실행

### viewer_logic.js
- **`initViewer()`**: 시작 시 `await pullFromSupabase()` 호출

### index.html (메인)
- **`updateWeeklyStatus()`**: `pullProgress()`로 수학 데이터 조회 후 studyDates에 반영

### calendar_module.js
- **`getActivitiesForWeek()`**: `pullProgress()`로 `math_tutor_*` 조회, localStorage는 `rahee_eng_`, `math_drill_`만 사용

## storage_key 형식
- `math_tutor_math_{grade}_unit{unitId}_lesson{lessonId}` (변경 없음)

## 영향 범위
- 수학 인덱스, 뷰어, 메인 인덱스 주간 현황, 캘린더
- 기존 localStorage에 저장된 수학 데이터는 더 이상 사용하지 않음 (Supabase에 이미 동기화된 데이터만 표시)
