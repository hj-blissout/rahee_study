# storage_key에서 rahee_ 접두사 제거

**날짜**: 2025-03-17

## 변경 내용

| 구분 | 이전 | 이후 |
|------|------|------|
| 문법 | rahee_grammar_unit_N | grammar_unit_N |
| 문법 localStorage | rahee_grammar_completed | grammar_completed |
| 단어 | rahee_eng_learned_v2_dayN | eng_learned_v2_dayN |

## 수정 파일

- `english/grammar_detail.html` - pushProgress, localStorage
- `english/grammar.html` - syncGrammarFromSupabase, localStorage, 파싱 정규식
- `english/index.html` - KEY_PREFIX, syncEngWordsFromSupabase
- `assets/js/supabase_service.js` - inferSubjectFromKey
- `assets/js/calendar_module.js` - addActivityForWeek, getActivitiesForWeek
- `schedule.html` - progressTitle
- `index.html` - updateWeeklyStatus (studyDates)

## 기존 데이터 호환

- **Supabase**: 기존 rahee_* 키는 그대로 유지. 읽기 시 두 패턴 모두 인식
- **localStorage**: 최초 로드 시 rahee_* → 새 키로 복사 후 삭제 (1회 마이그레이션)
- **syncGrammarFromSupabase**: `(?:rahee_)?grammar_unit_(\d+)` 정규식으로 둘 다 매칭
- **syncEngWordsFromSupabase**: rahee_eng_learned_v2_ row → eng_learned_v2_ 로 저장

## subject 컬럼 매핑 (inferSubjectFromKey)

- eng_learned_v2_*, rahee_eng_* → english_words
- grammar_unit_*, rahee_grammar_* → english_grammar
