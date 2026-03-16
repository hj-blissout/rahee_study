-- 학생 스케줄 (시간 블럭) 테이블 (2025-03-16)
-- 해당 시간대에 뭐했는지 기록, 장소 플래그 포함

CREATE TABLE IF NOT EXISTS rahee_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  time_block TEXT NOT NULL,
  content TEXT NOT NULL,
  subject TEXT,
  place TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, date, time_block)
);

-- RLS
ALTER TABLE rahee_schedule ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own schedule"
  ON rahee_schedule FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- place: school, company, home, cafe, countryside, other
-- subject: class(수업), academy(학원), healing(힐링), reading(독서), movie(영화), tv(티비), youtube(유튜브), other(기타)
