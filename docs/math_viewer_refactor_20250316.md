# 수학 뷰어 통일 리팩토링 (2025-03-16)

## 요약

- **목표**: math_1/2/3 각각의 viewer.html → 단일 `math/viewer.html`로 통일
- **URL**: `math/viewer.html?grade=1&unit=0101` (grade: 1|2|3, unit: 단원ID)

## 변경 사항

### 추가
| 파일 | 내용 |
|------|------|
| math/viewer.html | 통합 뷰어 (grade, unit URL 파라미터) |

### 수정
| 파일 | 내용 |
|------|------|
| assets/js/viewer_logic.js | initViewer() → grade를 URL에서 읽음, 목록으로 링크 동적 설정 |
| math/math_1/index.html | `../viewer.html?grade=1&unit=xxx` |
| math/math_2/index.html | `../viewer.html?grade=2&unit=xxx` |
| math/math_3/index.html | `../viewer.html?grade=3&unit=xxx` |

### 삭제
| 파일 | 사유 |
|------|------|
| math/math_1/viewer.html | 통합 뷰어로 대체 |
| math/math_2/viewer.html | 통합 뷰어로 대체 |
| math/math_3/viewer.html | 통합 뷰어로 대체 |
| math/math_1/chapter_*.html (5개) | JSON 기반 뷰어로 대체, math_common.js 미존재로 미사용 |
| math/math_3/chapter_*.html (7개) | 동일 |
| math/math_3/all_in_one.html | chapter 링크용, 제거 |

## 경로 구조 (리팩토링 후)

```
math/
├── viewer.html          # 통합 뷰어 (?grade=1|2|3&unit=xxxx)
├── data/
│   ├── math_1/unit_*.json
│   ├── math_2/unit_*.json
│   └── math_3/unit_*.json
├── math_1/
│   └── index.html       # 단원 목록 → ../viewer.html?grade=1&unit=xxx
├── math_2/
│   └── index.html       # 단원 목록 → ../viewer.html?grade=2&unit=xxx
├── math_3/
│   └── index.html       # 단원 목록 → ../viewer.html?grade=3&unit=xxx
└── math_drill.html
```

## 영향 범위

- 메인 index.html → math/math_N/index.html 링크: 변경 없음
- 학습 흐름: index → 단원 클릭 → viewer → (목록으로) → index
