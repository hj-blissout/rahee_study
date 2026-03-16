# rahee_study 프로젝트 서머리

> 작성일: 2025-03-16  
> 목적: 아이(라희) 학습용 웹, GitHub Pages 배포

---

## 1. 프로젝트 개요

| 항목 | 내용 |
|------|------|
| **이름** | rahee_study (라희의 프리미엄 학습 룸) |
| **목적** | 아이 학습용 웹 애플리케이션 |
| **배포** | GitHub Pages |
| **스택** | 정적 HTML/CSS/JS, Supabase, xlsx |

---

## 2. 폴더 구조

```
rahee_study/
├── index.html              # 메인 홈 (학습 현황, 과목 진입)
├── login.html              # 로그인
├── timer_1min.html         # 1분 타이머
├── env.js                  # Supabase URL/KEY (환경변수)
├── package.json
│
├── assets/
│   ├── css/
│   │   ├── main_style.css       # 메인 공통 스타일
│   │   ├── math_style.css, math_common.css
│   │   └── english/            # grammar, grammar_detail, celebration, style
│   ├── js/
│   │   ├── supabase_service.js # Supabase 인증·진도
│   │   ├── app_utils.js
│   │   ├── calendar_module.js  # 캘린더/히스토리
│   │   ├── math_logic.js
│   │   ├── viewer_logic.js
│   │   └── celebration.js
│   └── images/
│       └── growth_banner.png
│
├── english/
│   ├── index.html          # 단어 마스터
│   ├── grammar.html        # 핵심 문법 목록
│   ├── grammar_detail.html # 문법 상세
│   └── data/
│       ├── words.json
│       └── grammar_data.json
│
├── math/
│   ├── index.html          # 단원 목록 (?grade=1|2|3)
│   ├── viewer.html         # 통합 뷰어 (?grade=1|2|3&unit=xxxx)
│   ├── math_drill.html     # 연산 마스터
│   └── data/
│       ├── math_1/         # unit_*.json (단원별 학습 데이터)
│       ├── math_2/
│       ├── math_3/
│       └── middle*_math_sets.json
│
├── daily/
│   └── data/
│       └── quote.json      # 365일 명언
│
└── scripts/
    └── update_passwords.js
```

---

## 3. 주요 기능

### 3.1 인증

- **Supabase Auth** 사용
- `env.js`에서 `SUPABASE_URL`, `SUPABASE_KEY` 로드
- `supabase_service.js`: `getCurrentUser()`, `getSession()`, `logout()`
- 미인증 시 `login.html`로 리다이렉트

### 3.2 영어

| 기능 | 파일 | 설명 |
|------|------|------|
| 단어 마스터 | english/index.html | words.json 기반 단어 학습 |
| 핵심 문법 | english/grammar.html | grammar_data.json 기반 문법 목록 |
| 문법 상세 | english/grammar_detail.html | am/is/are 등 단위별 상세 |

### 3.3 수학

| 학년 | 경로 | 데이터 |
|------|------|--------|
| 중1 | math/math_1/ | math/data/math_1/unit_*.json |
| 중2 | math/math_2/ | math/data/math_2/unit_*.json |
| 중3 | math/math_3/ | math/data/math_3/unit_*.json |
| 연산 | math/math_drill.html | middle*_math_sets.json |

**단원 JSON 구조 (예: unit_0101.json)**

- `curriculum`, `unit_id`, `title`
- `lessons[]`: `lesson_id`, `title`, `goal`, `steps[]`
- `steps` 타입: `recall`, `concept`, `pattern`, `guided_example`, `quiz`

### 3.4 진도 관리

- **Supabase 테이블**: `rahee_progress`
  - 컬럼: `user_id`, `storage_key`, `completed_at`
  - `onConflict: 'user_id,storage_key'`로 upsert
- **로컬**: `localStorage` (`math_tutor_*`, `rahee_eng_learned_*`) 병행
- **API**: `pushProgress()`, `pullProgress()`

### 3.5 부가 기능

- **일주일 학습 현황**: 메인 페이지 week-grid
- **캘린더/히스토리**: `calendar_module.js`
- **1분 타이머**: `timer_1min.html`
- **365일 명언**: `daily/data/quote.json`
- **축하 애니메이션**: canvas-confetti, celebration.js

---

## 4. Supabase 사용

| 용도 | 테이블/기능 |
|------|-------------|
| 인증 | Supabase Auth (이메일/비밀번호) |
| 진도 | `rahee_progress` (user_id, storage_key, completed_at) |

**supabase_service.js 주요 함수**

- `getSupabase()`: 클라이언트 싱글톤
- `getCurrentUser()`, `getSession()`, `logout()`
- `pushProgress(storageKey, completedAt)`
- `pullProgress()` → `{ storage_key, completed_at }[]`

---

## 5. 의존성 (package.json)

| 패키지 | 용도 |
|--------|------|
| @supabase/supabase-js | 인증, DB |
| xlsx | 엑셀 처리 (데이터 변환/관리용) |

---

## 6. GitHub Pages 배포

- `.github/workflows/` 없음 → GitHub Actions 미사용
- 정적 사이트 → 빌드 없이 배포 가능

**배포 방법**

1. Settings → Pages → Source: `main` 브랜치, `/ (root)`
2. 또는 `gh-pages` 브랜치를 Pages 소스로 지정

---

## 7. 주의사항

| 항목 | 설명 |
|------|------|
| **폴더명 대소문자** | Git에 `English/`로 보일 수 있으나 실제는 `english/`. Linux 등 대소문자 구분 환경에서 링크 오류 가능 |
| **민감정보** | `.env`, `env.js`는 `.gitignore` 대상. `env.js`가 포함되면 Supabase anon key 노출 |
| **node_modules** | `.gitignore`에 포함, 배포 제외 |

---

## 8. 외부 CDN

- Font Awesome 6.4.0
- Google Fonts (Nanum Square Round, Do Hyeon, Outfit)
- canvas-confetti 1.6.0
- @supabase/supabase-js@2
