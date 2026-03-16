# 수학 뷰어 grade/unit 파라미터 수정 (2025-03-16)

## 문제
어떤 단원을 눌러도 뷰어에 항상 "소수와 합성수"(math_1 unit_0101)만 표시됨.

## 원인 추정
1. 링크 기본 동작이 일부 환경에서 href로의 이동을 제대로 수행하지 않음
2. sessionStorage에 이전 방문 값이 남아 있어, URL 파라미터가 비어 있을 때 잘못된 단원 로드

## 수정 내용

### 1. math/index.html
- 단원 링크 `onclick`에서 `event.preventDefault()` 후 `window.location.href=this.href`로 **명시적 이동**
- 클릭 시 항상 올바른 `?grade=&unit=` 파라미터가 포함된 URL로 이동하도록 보장

### 2. assets/js/viewer_logic.js
- URL 파라미터가 있을 때만 sessionStorage에 저장 (동기화)
- 다음 방문 시 stale 데이터로 인한 잘못된 단원 표시 방지

## 영향 범위
- math/index.html: 단원 카드 링크 클릭 동작
- viewer_logic.js: initViewer() 내 grade/unit 파싱 및 sessionStorage 동기화

## 테스트
- math/index.html에서 중1/중2/중3 각 탭 선택 후, 서로 다른 단원 클릭
- 뷰어에 해당 단원 제목이 올바르게 표시되는지 확인
