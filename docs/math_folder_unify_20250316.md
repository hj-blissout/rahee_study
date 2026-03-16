# 수학 학년별 폴더 제거 (2025-03-16)

## 요약

- **기존**: math/math_1/, math/math_2/, math/math_3/ 각각에 index.html
- **변경**: math/index.html 단일 페이지, `?grade=1|2|3` 파라미터로 학년 구분

## 변경 사항

### 추가
| 파일 | 내용 |
|------|------|
| math/index.html | index.json 기반 동적 단원 목록, GRADE_META로 학년별 hero 텍스트 |

### 수정
| 파일 | 내용 |
|------|------|
| index.html (메인) | math/math_N/index.html → math/index.html?grade=N |
| assets/js/math_logic.js | getUnitInfo: pathname /math/ 처리 (math/ 루트 기준) |
| assets/js/viewer_logic.js | 목록으로: math_N/index.html → index.html?grade=N |
| math/viewer.html | btn-back 기본 href: index.html?grade=1 |

### 삭제
| 항목 | 사유 |
|------|------|
| math/math_1/ | index.html → math/index.html로 통합 |
| math/math_2/ | 동일 |
| math/math_3/ | 동일 |

## 경로 구조 (최종)

```
math/
├── index.html          # ?grade=1|2|3 단원 목록
├── viewer.html         # ?grade=1|2|3&unit=xxxx 뷰어
├── math_drill.html     # 연산 마스터
├── data/
│   ├── math_1/index.json, unit_*.json
│   ├── math_2/index.json, unit_*.json
│   ├── math_3/index.json, unit_*.json
│   └── middle*_math_sets.json
```

## URL

| 용도 | URL |
|------|-----|
| 중1 단원 목록 | math/index.html?grade=1 |
| 중2 단원 목록 | math/index.html?grade=2 |
| 중3 단원 목록 | math/index.html?grade=3 |
| 뷰어 | math/viewer.html?grade=N&unit=xxxx |
