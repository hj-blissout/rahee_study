# 문법 상세 페이지 수정 (2025-03-16)

## 변경 요약

- **파일**: `english/grammar_detail.html`, `english/grammar.html`
- **문제**: 목차에서 챕터 클릭 시 문법 디테일이 표시되지 않음

## 수정 내용

### 1차 수정
- **unit 파라미터 없을 때**: "목차에서 학습할 챕터를 선택해주세요" 메시지 + 목차 이동 버튼
- **fetch 경로**: `data/grammar_data.json` 고정

### 2차 수정 (목차 클릭 시 디테일 미표시)
- **grammar_detail.html fetch 경로**: `window.location.href` 기준 절대 URL 생성
- **grammar.html fetch 경로**: 동일하게 `baseDir + 'data/Basic Grammar in Use.md'` 사용
- **grammar.html**: `chapterNum`, `chapterTitleText`에 `.trim()` 적용

### 3차 수정 (data json 요청 자체가 발생하지 않음)
- **원인**: 서버 리다이렉트 시 쿼리 파라미터(?unit=1) 손실
- **조치**: sessionStorage로 unit 전달 (임시)

### 4차 수정 (파라미터로 전달)
- **해시(#) 사용**: `grammar_detail.html#unit=1&title=...` - 해시는 서버로 전송되지 않아 리다이렉트 시에도 유지됨
- **grammar.html**: `grammar_detail.html#unit=${n}&title=...` 로 이동
- **grammar_detail.html**: `URLSearchParams(window.location.hash.slice(1))` 로 파싱

## 영향 범위

- `grammar_detail.html`, `grammar.html` 수정
- `grammar.html`에서 챕터 클릭 → `?unit=1&title=...` → 문법 상세 정상 표시
