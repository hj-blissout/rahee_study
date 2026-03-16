-- rahee_schedule UNIQUE 제거 (2025-03-16)
-- 같은 시간 블럭에 여러 일정 허용 (겹침 표시)
-- 제약 이름이 다르면: SELECT conname FROM pg_constraint WHERE conrelid = 'rahee_schedule'::regclass AND contype = 'u';

ALTER TABLE rahee_schedule DROP CONSTRAINT IF EXISTS rahee_schedule_user_id_date_time_block_key;
