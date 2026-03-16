# 영어·수학 완료 내역 Supabase 동기화 (2025-03-16)

## 개요

영어 단어, 영어 문법, 수학 연산 완료 내역을 Supabase `rahee_progress` 테이블에 저장하고, 페이지 로드 시 동기화합니다.

## 사전 작업 (Supabase)

`docs/supabase_rahee_progress_payload_20250316.sql` 실행하여 `payload` 컬럼 추가:

```sql
ALTER TABLE rahee_progress
ADD COLUMN IF NOT EXISTS payload JSONB DEFAULT NULL;
```

## storage_key 규칙

| 구분 | storage_key | completed_at | payload |
|------|-------------|-------------|---------|
| 문법 | `rahee_grammar_unit_1` | 완료 시각 | - |
| 단어 | `rahee_eng_learned_v2_day1` | 마지막 학습 시각 | `{ "word_ids": [101,102,...] }` |
| 연산 | `math_drill_g1_s1` | 완료 시각 | - |

## 수정 파일

| 파일 | 변경 내용 |
|------|-----------|
| `assets/js/supabase_service.js` | `pushProgress(key, date, payload?)`, `pullProgress()`에 payload 포함 |
| `english/grammar_detail.html` | 완료 시 `pushProgress('rahee_grammar_unit_N', ...)` |
| `english/grammar.html` | 로드 시 `syncGrammarFromSupabase()` → localStorage 반영 |
| `english/index.html` | 로드 시 `syncEngWordsFromSupabase()`, 단어 학습 시 `pushProgress(..., { word_ids })` |
| `math/math_drill.html` | 로드 시 `syncMathDrillFromSupabase()`, 100점 시 `pushProgress('math_drill_gN_sM', ...)` |

## 동기화 흐름

1. **Pull (페이지 로드)**: `pullProgress()` → storage_key별로 localStorage 병합
2. **Push (완료 시)**: localStorage 저장 + `pushProgress()` 호출

## 영향 범위

- **2025-03-16**: 수학 튜터(`math_tutor_*`) → Supabase 전용 전환 (localStorage 제거). `docs/math_progress_supabase_20250316.md` 참고
- env.js 로드 추가된 페이지: grammar_detail, grammar, english/index, math_drill
