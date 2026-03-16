# 스케줄 관리 기능 (2025-03-16)

## 개요

시간 블럭 단위로 "해당 시간대에 뭐 했는지" 기록. Supabase 저장, 장소 플래그 포함.

## 사전 작업 (Supabase)

`docs/supabase_rahee_schedule_20250316.sql` 실행하여 `rahee_schedule` 테이블 생성.

## 데이터 구조

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | UUID | PK |
| user_id | UUID | auth.users 참조 |
| date | DATE | 날짜 |
| time_block | TEXT | "19:00" (1시간 단위) |
| content | TEXT | 무엇을 했는지 |
| subject | TEXT | class, academy, healing, reading, movie, tv, youtube, other (일과) |
| place | TEXT | school, company, home, cafe, countryside, other |

## 일과(subject)

| 값 | 표시 |
|----|------|
| class | 수업 |
| academy | 학원 |
| healing | 힐링 |
| reading | 독서 |
| movie | 영화 |
| tv | 티비 |
| youtube | 유튜브 |
| other | 기타 |

## 장소(place)

| 값 | 표시 |
|----|------|
| school | 학교 |
| company | 회사 |
| home | 집 |
| cafe | 카페 |
| countryside | 시골 |
| other | 기타 |

## 수정/추가 파일

| 파일 | 내용 |
|------|------|
| docs/supabase_rahee_schedule_20250316.sql | 테이블 생성 |
| assets/js/supabase_service.js | pushSchedule, pullSchedule, deleteSchedule |
| schedule.html | 주간 스케줄 그리드, 블럭 클릭 → 모달 입력 |
| index.html | 스케줄 관리 카드 링크 |

## 사용 흐름

1. 메인 → "스케줄 관리" 클릭
2. schedule.html → 주간 그리드 (월~일, 06:00~24:00 1시간 단위)
3. 블럭 클릭 → 모달에서 날짜·시작시간·소요시간·내용·일과·장소 입력
4. 일과: 수업, 학원, 힐링, 독서, 영화, 티비, 유튜브, 기타
5. 소요시간: 1~3시간 기본, 더보기로 4~18시간 선택 가능
6. 저장 시 해당 구간의 모든 1시간 블럭에 동일 내용 저장
7. 인접한 같은 내용 블럭은 편집 시 하나의 그룹으로 표시
8. 같은 시간 블럭에 여러 일정 허용 (겹침 시 세로로 나열 표시)
9. 사전 작업: `docs/supabase_rahee_schedule_unique_remove_20250316.sql` 실행하여 UNIQUE 제거
