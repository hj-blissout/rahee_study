# 수학 유닛별 완료 로직 정리

**날짜**: 2025-03-17

## 1. 현재 구조 요약

### 1.1 계층
- **학년(grade)** → **단원(unit)** → **소단원(lesson)** → **단계(step 1~5)**
- 예: 중1 수학 > 작도와 합동(0402) > 합동(0402-03) > 1~5단계

### 1.2 저장 키 형식
```
math_tutor_math_{grade}_unit{unitId}_lesson{lessonId}
예: math_tutor_math_1_unit0402_lesson0402-03
```

### 1.3 완료 시점
- **소단원(lesson) 단위**로 완료 기록
- 5단계(확인 퀴즈)를 모두 맞추거나 "이해 완료" 버튼을 누르면 `markChapterComplete()` 호출
- `syncProgress(key, date)` → Supabase `rahee_progress` 테이블에 upsert

### 1.4 메인 인덱스 진도 표시
- `loadMathProgress()`: 각 카드별로 `total_lessons`만큼 lesson 완료 개수 카운트
- **단원 완료**: `completedInUnit >= totalLessons` → "완료! 참 잘했어요 👑"
- **진행 중**: `completedInUnit > 0` → "공부 중.. (n/m)"
- **전체 진행률**: 완료된 단원 수 / 전체 단원 수 → 상단 progress bar

---

## 2. 잠재적 이슈 (진도가 안 나오는 원인 후보)

### 2.1 markChapterComplete에서 unitId 누락
```javascript
// math_logic.js - 현재
const unitId = urlParams.get('unit');  // URL에 unit 없으면 null
```
- **문제**: 북마크/직접 접속 시 `?grade=1&unit=0402` 없으면 저장 실패
- **대안**: `currentUnit?.unit_id` 또는 `sessionStorage.getItem('math_unit')` fallback

### 2.2 bfcache 복귀 시 캐시 미갱신
```javascript
// math/index.html - 현재
window.addEventListener('pageshow', (e) => {
  if (e.persisted && ...) {
    loadMathProgress();  // pullFromSupabase() 호출 안 함!
  }
});
```
- **문제**: 뒤로가기로 돌아올 때 `_mathProgressCache`가 예전 상태일 수 있음
- **대안**: `pageshow` 시 `pullFromSupabase()` 먼저 호출 후 `loadMathProgress()`

### 2.3 index.json과 unit JSON의 lesson_id 불일치
- **loadMathProgress**: `lessonId = unitId-01`, `unitId-02` … (순차 가정)
- **unit_0402.json**: `lesson_id`가 `0402-01`, `0402-02`, `0402-03` 등
- **index.json**: `lesson_ids` 배열 또는 `total_lessons`만 있음
- **위험**: `lesson_ids`가 비순차(예: 0402-a, 0402-b)면 키 불일치

### 2.4 뷰어 내 progress bar
- **역할**: 현재 소단원의 5단계 진행률 (20% → 100%)
- **초기화**: 새 lesson 로드 시 `main-progress`를 0% 또는 20%로 리셋하지 않음
- **영향**: UX만 영향, 저장 로직과는 무관

---

## 3. 유닛 완료 정의 (정리)

| 구분 | 현재 | 제안 |
|------|------|------|
| **완료 단위** | 소단원(lesson) | 유지 |
| **단원 완료 조건** | 해당 단원의 모든 lesson 완료 | 유지 |
| **저장 키** | `math_tutor_math_{g}_unit{u}_lesson{l}` | 유지 |
| **데이터 소스** | index.json `total_lessons`로 lesson 개수 추정 | `lesson_ids` 우선 사용 권장 |

---

## 4. 권장 수정 사항

### 4.1 markChapterComplete 보강
```javascript
const unitId = urlParams.get('unit') || currentUnit?.unit_id || sessionStorage.getItem('math_unit');
const grade = window.currentGrade || sessionStorage.getItem('math_grade') || '1';
```

### 4.2 pageshow 시 Supabase 재조회
```javascript
if (e.persisted && document.querySelectorAll('.card[data-unit]').length) {
  await pullFromSupabase();
  loadMathProgress();
}
```

### 4.3 loadMathProgress에서 lesson_ids 활용
- index.json에 `lesson_ids`가 있으면 그대로 사용
- 없으면 기존처럼 `unitId-01`, `unitId-02` … 생성

### 4.4 디버깅용 로그 (개발 중)
- `markChapterComplete` 호출 시 `key`, `grade`, `unitId`, `lessonId` 로그
- `syncProgress` 성공/실패 로그

---

## 5. 영향 범위
- `assets/js/math_logic.js`: markChapterComplete, loadMathProgress
- `math/index.html`: pageshow 핸들러
- `math/data/math_*/index.json`: lesson_ids 필드 유무 확인
