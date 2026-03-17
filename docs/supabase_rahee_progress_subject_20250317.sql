-- rahee_progress 테이블에 subject 컬럼 추가 (2025-03-17)
-- 과목별 필터/집계 및 UI 분류 용이

-- 1. 컬럼 추가
ALTER TABLE rahee_progress
ADD COLUMN IF NOT EXISTS subject VARCHAR(32) DEFAULT NULL;

-- 2. 기존 데이터 마이그레이션 (storage_key 패턴 → subject)
UPDATE rahee_progress
SET subject = CASE
  WHEN storage_key LIKE 'math_tutor_%' THEN 'math_tutor'
  WHEN storage_key LIKE 'math_drill_%' THEN 'math_drill'
  WHEN storage_key LIKE 'rahee_eng_%' THEN 'english_words'
  WHEN storage_key LIKE 'rahee_grammar_%' THEN 'english_grammar'
  ELSE NULL
END
WHERE subject IS NULL;
