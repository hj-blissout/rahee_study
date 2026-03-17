# rahee_progress 테이블: subject(과목) 컬럼 추가 검토

**날짜**: 2025-03-17

## 1. 현재 구조

| 컬럼 | 용도 |
|------|------|
| user_id | 사용자 |
| storage_key | 고유 식별 (user_id와 복합 PK) |
| completed_at | 완료 시각 |
| payload | JSONB (영어 word_ids 등) |

**storage_key 패턴** (과목 정보가 문자열에 인코딩됨):
- `math_tutor_math_{grade}_unit{unitId}_lesson{lessonId}` → 수학 튜터
- `math_drill_g{grade}_s{setId}` → 연산
- `rahee_eng_learned_v2_day{n}` → 영어 단어
- `rahee_grammar_unit_{n}` → 영어 문법

---

## 2. subject 컬럼 추가 시 장점

| 항목 | 설명 |
|------|------|
| **쿼리 단순화** | `WHERE subject = 'math'` vs `WHERE storage_key LIKE 'math_%'` |
| **과목별 집계** | 수학/영어/연산 완료 개수 등 통계 쿼리 용이 |
| **UI 분류** | 스케줄·캘린더에서 과목별 아이콘/색상 구분 |
| **유지보수** | `progressTitle()` 같은 파싱 로직 분산 감소 |
| **확장성** | activity_type, grade 등 추가 메타 확장 용이 |

---

## 3. 제안 스키마

```sql
ALTER TABLE rahee_progress
ADD COLUMN IF NOT EXISTS subject VARCHAR(32) DEFAULT NULL;

-- 예시 값: 'math_tutor', 'math_drill', 'english_words', 'english_grammar'
```

**subject 값 정의**:
| subject | storage_key 패턴 |
|---------|------------------|
| math_tutor | math_tutor_* |
| math_drill | math_drill_* |
| english_words | rahee_eng_* |
| english_grammar | rahee_grammar_* |

---

## 4. 고려사항

### 4.1 기존 데이터 마이그레이션
- 기존 row는 subject=NULL
- 마이그레이션 SQL로 storage_key 패턴 → subject 매핑
- 또는 애플리케이션에서 NULL이면 파싱 fallback (하이브리드)

### 4.2 pushProgress 시그니처 변경
```javascript
// 옵션 A: 4번째 인자로 subject
pushProgress(storageKey, completedAt, payload, subject)

// 옵션 B: storage_key에서 자동 추론 (추가 컬럼만, 코드 변경 최소)
// INSERT 시 DB 트리거/기본값으로 subject 설정
```

### 4.3 호환성
- subject가 NULL이어도 기존 로직 동작 (storage_key 파싱 유지)
- 점진적 마이그레이션 가능

---

## 5. 대안: subject 없이 유지

- storage_key 규칙을 엄격히 유지하고, 클라이언트/뷰에서만 파싱
- 과목별 필터가 자주 필요하지 않다면 현재 구조로도 충분
- 다만 progressTitle, getActivitiesForWeek 등에 파싱 로직이 여러 곳에 흩어져 있음

---

## 6. 구현 완료 (2025-03-17)

1. **SQL**: `docs/supabase_rahee_progress_subject_20250317.sql` - 컬럼 추가 + 마이그레이션
2. **pushProgress**: 4번째 인자 `subject` (선택), 없으면 `inferSubjectFromKey(storageKey)` 자동 추론
3. **pullProgress**: select에 `subject` 포함
4. **inferSubjectFromKey**: storage_key 패턴 → subject 매핑 (내부 헬퍼)

호출부 변경 없이 기존 코드 동작 유지. 추후 subject로 필터/집계 쿼리 가능.
