-- rahee_progress 테이블에 payload 컬럼 추가 (2025-03-16)
-- 영어 단어 완료 내역(word_ids 배열) 저장용

ALTER TABLE rahee_progress
ADD COLUMN IF NOT EXISTS payload JSONB DEFAULT NULL;

-- 기존 데이터는 payload=NULL로 유지됨
-- 사용 예: { "word_ids": [101, 102, 103] }
