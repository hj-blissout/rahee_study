# 수학 뷰어 완료 시 콘페티·박지훈 응원 추가

**날짜**: 2025-03-16

## 요약
수학 소단원 완료 시 콘페티와 박지훈 응원 모달이 표시되지 않던 문제를 수정했다.

## 변경 내용

### viewer_logic.js
- `mathLessonComplete` 이벤트 핸들러에 추가:
  - `fireConfetti()` 호출 (app_utils.js)
  - `showMathLessonCelebration()` 1.2초 후 호출
- `showMathLessonCelebration()` 함수 추가:
  - `.celebration-overlay` 스타일 활용 (math_common.css)
  - 박지훈 이미지 + "라희야, 수학도 완벽하게 마스터했어! 진짜 멋지다! 👍"
- `closeMathCelebration()` 전역 함수 추가

## 추가 수정 (퀴즈 완료 감지 버그)

### math_logic.js checkAnswer
- **원인**: `allAnswered`를 "모든 option-btn이 disabled"로 잘못 판단. 실제로는 문항당 1개만 선택하므로 9개 중 3개만 비활성화됨 → 항상 false
- **수정**: 각 `[data-quiz-q]` 퀴즈 컨테이너별로, 선택된(disabled) 버튼이 있고 그게 정답(correct)인지 확인

## 추가 수정 (상단 타이틀 완료 표시)

### viewer_logic.js
- **상단 타이틀(lesson-title)**: 완료한 소단원일 때 체크 아이콘 표시 (`updateLessonTitle()`)
- **소단원 nav**: 현재 보고 있는 소단원 active 상태 정확히 반영 (`currentLesson.lesson_id` 기준)
- `loadLesson`, `mathLessonComplete` 시 `updateLessonTitle()` 호출

## 영향 범위
- `math/viewer.html`에서 소단원 완료 시에만 동작
- 기존 completion-nav, 버튼 동작은 그대로 유지
