# 수학 JSON 경로 수정 (2025-03-16)

## 요약

- **문제**: math_1/2/3 index·viewer 페이지에서 unit_*.json fetch 시 404 발생
- **원인**: `../data/...` 상대 경로가 `localhost:3000/math/math_1`(슬래시 없음) 등에서 잘못 해석됨
- **조치**: pathname에서 `math/` 경로를 추출하여 `.../math/data/math_N/unit_xxx.json` 절대 경로로 fetch

## 변경 파일

| 파일 | 내용 |
|------|------|
| assets/js/viewer_logic.js | initViewer() 내 dataUrl 생성 로직 수정 |
| assets/js/math_logic.js | getUnitInfo() 내 path 생성 로직 수정 (index 페이지 lesson-list용) |

## 변경 내용

### viewer_logic.js
- **기존**: `new URL('../data/...', window.location.href)`
- **변경**: pathname 정규식으로 `.../math/` 추출 후 절대 경로 조합

### math_logic.js
- **기존**: `isSubDir ? '../data/...' : './math/data/...'` (상대 경로)
- **변경**: pathname 정규식 `^(.*\/math\/)math_\d`로 `.../math/` 추출 후 `mathBase + 'data/math_N/unit_xxx.json'`
- **fallback**: 패턴 불일치 시 `./math/data/...` 유지

## 추가 수정 (2025-03-16)

**viewer_logic.js가 사용하는 함수가 math_logic.js에 없어 ReferenceError 발생**

| 함수 | 추가 위치 |
|------|------|
| isLessonComplete(unitId, lessonId) | math_logic.js |
| updateViewerProgress(percent) | math_logic.js |
| reveal(el) | math_logic.js |
| checkAnswer(btn, isCorrect, feedbackId) | math_logic.js |
| completeStep(stepNum) | math_logic.js |

## 영향 범위

- **math_logic.js**: math/math_1, math_2, math_3 **index.html** (단원 카드, lesson-list 렌더링)
- **viewer_logic.js**: math/math_1, math_2, math_3 **viewer.html**
