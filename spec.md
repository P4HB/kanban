# spec.md — 개인 프로젝트 매니저 (칸반보드)

> 현재 코드베이스 기준 기술 명세서
> 최종 갱신: 2026-03-28

---

## 1. 프로젝트 개요

개발 프로젝트를 칸반보드 + 캘린더 + 대시보드로 관리하는 1인용 웹앱.

| 항목 | 내용 |
|------|------|
| 사용자 | 본인 1명 (Credentials 인증) |
| 배포 | Vercel (호스팅) + Vercel Postgres / Neon (DB) |
| 유지보수 | Claude Code CLI |

---

## 2. 기술 스택

| 레이어 | 기술 | 버전 |
|--------|------|------|
| Framework | Next.js (App Router) | 14.2.35 |
| Language | TypeScript | 5 |
| Styling | Tailwind CSS | 3.4.1 |
| State | Zustand | 5.0.12 |
| DnD | @dnd-kit/core + sortable | 6.3.1 / 10.0.0 |
| Icons | Lucide React | - |
| Date | date-fns | 4.1.0 |
| ORM | Drizzle ORM | 0.45.1 |
| DB | PostgreSQL (Neon serverless) | @neondatabase/serverless 1.0.2 |
| Auth | NextAuth.js v5 (beta 30) | JWT 세션 |

---

## 3. 디렉터리 구조

```
src/
├── app/
│   ├── layout.tsx                 # 루트 레이아웃 (providers 래핑)
│   ├── page.tsx                   # 대시보드 (홈)
│   ├── middleware.ts              # 인증 미들웨어
│   ├── login/page.tsx             # 로그인 페이지
│   ├── board/[projectId]/page.tsx # 프로젝트별 칸반보드
│   ├── calendar/page.tsx          # 캘린더 뷰
│   └── api/
│       ├── auth/[...nextauth]/    # NextAuth 라우트
│       ├── projects/              # 프로젝트 CRUD
│       ├── tasks/                 # 태스크 CRUD + move
│       ├── labels/                # 라벨 CRUD
│       ├── columns/               # 컬럼 조회
│       └── dashboard/             # 통계 집계
├── components/
│   ├── board/                     # kanban-board, kanban-column, task-card, task-modal
│   ├── calendar/                  # calendar-view
│   ├── dashboard/                 # dashboard-view
│   └── layout/                    # app-shell, sidebar, header, providers
├── db/
│   ├── schema.ts                  # Drizzle 스키마
│   ├── index.ts                   # DB 클라이언트 (Neon)
│   └── seed.ts                    # 시드 데이터
├── lib/
│   ├── api.ts                     # API 클라이언트 (fetch 래퍼)
│   ├── auth.ts                    # NextAuth 설정
│   └── types.ts                   # TypeScript 인터페이스
├── store/
│   └── use-store.ts               # Zustand 스토어
└── globals.css
```

---

## 4. 데이터 모델

### 4.1 projects
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid (PK) | 자동 생성 |
| name | varchar(100) | 프로젝트명 |
| color | varchar(7) | hex 색상 (#6366f1) |
| icon | varchar(50) | Lucide 아이콘명 (선택) |
| archived | boolean | 아카이브 여부 (기본 false) |
| sortOrder | integer | 정렬 순서 |
| createdAt / updatedAt | timestamp | 자동 |

### 4.2 columns (프리셋 6개)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid (PK) | 자동 생성 |
| name | varchar(50) | Backlog / Todo / In Progress / On Hold / Review / Done |
| slug | varchar(50) UNIQUE | backlog, todo, in_progress, on_hold, review, done |
| sortOrder | integer | 표시 순서 |
| color | varchar(7) | 컬럼 색상 (선택) |

### 4.3 tasks
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid (PK) | 자동 생성 |
| title | varchar(200) | 태스크 제목 (필수) |
| description | text | 설명 (선택) |
| projectId | uuid (FK → projects, CASCADE) | 소속 프로젝트 |
| columnId | uuid (FK → columns) | 현재 상태 컬럼 |
| priority | varchar(10) | urgent / high / medium / low (선택) |
| dueDate | date | 마감일 (선택) |
| sortOrder | integer | 컬럼 내 정렬 순서 |
| createdAt / updatedAt | timestamp | 자동 |

### 4.4 labels
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid (PK) | 자동 생성 |
| name | varchar(50) | 라벨명 |
| color | varchar(7) | hex 색상 (#8b5cf6) |

### 4.5 taskLabels (다대다)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| taskId | uuid (FK → tasks, CASCADE) | 복합 PK |
| labelId | uuid (FK → labels, CASCADE) | 복합 PK |

### 4.6 checklistItems
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid (PK) | 자동 생성 |
| taskId | uuid (FK → tasks, CASCADE) | 소속 태스크 |
| content | varchar(300) | 항목 내용 |
| completed | boolean | 완료 여부 (기본 false) |
| sortOrder | integer | 정렬 순서 |

---

## 5. API 엔드포인트

### Projects
| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/projects` | 비아카이브 프로젝트 목록 |
| POST | `/api/projects` | 프로젝트 생성 |
| PATCH | `/api/projects/:id` | 프로젝트 수정 |
| DELETE | `/api/projects/:id` | 프로젝트 삭제 (태스크 CASCADE) |

### Tasks
| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/tasks?projectId=xxx` | 프로젝트별 태스크 (라벨+체크리스트 포함) |
| GET | `/api/tasks?from=&to=` | 날짜 범위 태스크 (캘린더용) |
| POST | `/api/tasks` | 태스크 생성 (labelIds 선택) |
| PATCH | `/api/tasks/:id` | 태스크 수정 (제목, 설명, 우선순위, 마감일, 라벨, 체크리스트) |
| PATCH | `/api/tasks/:id/move` | 드래그앤드롭 이동 (columnId + sortOrder) |
| DELETE | `/api/tasks/:id` | 태스크 삭제 |

### Labels
| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/labels` | 전체 라벨 목록 |
| POST | `/api/labels` | 라벨 생성 |
| DELETE | `/api/labels/:id` | 라벨 삭제 |

### Columns
| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/columns` | 컬럼 목록 (sortOrder 정렬) |

### Dashboard
| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/dashboard` | 전체 통계 (총 태스크, 오늘/이번주 마감, overdue, 컬럼 분포, 프로젝트별 진행률) |

---

## 6. 구현된 기능

### 6.1 인증
- Credentials 기반 로그인 (환경변수: `ADMIN_USERNAME`, `ADMIN_PASSWORD`)
- JWT 세션 전략
- 미들웨어로 보호된 라우트 (미인증 → `/login` 리다이렉트)
- GitHub OAuth는 auth.ts에 주석 처리 (미래 대비)

### 6.2 프로젝트 관리
- 사이드바에서 프로젝트 목록 표시
- 프로젝트 생성 (이름 + 색상 8개 프리셋)
- 프로젝트 삭제 (확인 다이얼로그)
- 프로젝트별 칸반보드 (/board/[projectId])

### 6.3 칸반보드
- 6개 프리셋 컬럼 (Backlog → Done)
- @dnd-kit 드래그앤드롭 (컬럼 간 + 컬럼 내 정렬)
- Optimistic UI 업데이트 (API 실패 시 롤백)
- 컬럼별 태스크 개수 뱃지
- 컬럼 색상 인디케이터

### 6.4 태스크 카드
- 모달로 생성/수정
- 필수: 제목, 상태(컬럼)
- 선택: 설명, 우선순위, 마감일, 라벨, 체크리스트
- 카드 시각 표시: 우선순위 점, 마감일(overdue 하이라이트), 체크리스트 진행률, 라벨
- 태스크 삭제

### 6.5 대시보드 (홈)
- 전체 태스크 수
- 오늘 마감 / 이번 주 마감 / Overdue 카운트
- 컬럼별 분포 (가로 바)
- 프로젝트별 진행률 (완료 비율)

### 6.6 캘린더 뷰
- 월간/주간 뷰 전환
- 날짜 범위 기반 태스크 필터링
- 프로젝트 색상 코딩
- Overdue 하이라이트

### 6.7 UI/UX
- 다크모드 토글 (localStorage 저장)
- 반응형 레이아웃 (사이드바 + 헤더 + 메인)
- Lucide 아이콘 네비게이션
- 로딩 스피너

---

## 7. 상태 관리 (Zustand)

**파일:** `src/store/use-store.ts`

| State | 타입 | 설명 |
|-------|------|------|
| projects | Project[] | 프로젝트 목록 |
| columns | Column[] | 칸반 컬럼 |
| tasks | TaskWithRelations[] | 태스크 (라벨+체크리스트 포함) |
| labels | Label[] | 라벨 목록 |
| selectedProjectId | string \| null | 현재 선택된 프로젝트 |

**Actions:** setProjects, addProject, updateProject, removeProject, setTasks, addTask, updateTask, removeTask, moveTask, setLabels, setColumns, setSelectedProjectId

---

## 8. 환경 변수

| 변수명 | 용도 |
|--------|------|
| `POSTGRES_URL` | DB 연결 (Vercel Postgres / Neon) |
| `AUTH_SECRET` | NextAuth JWT 서명 |
| `ADMIN_USERNAME` | 로그인 사용자명 |
| `ADMIN_PASSWORD` | 로그인 비밀번호 |

---

## 9. 주요 설계 패턴

| 패턴 | 설명 |
|------|------|
| Optimistic Update | 드래그앤드롭 시 UI 즉시 반영, API 실패 시 롤백 |
| Cascade Delete | 프로젝트 삭제 → 하위 태스크 일괄 삭제 |
| Relation Hydration | 태스크 조회 시 라벨+체크리스트를 Promise.all로 병렬 로드 |
| JWT 미들웨어 | 모든 라우트에서 세션 검증, API/auth 경로 제외 |
| 클라이언트 캐시 | 다크모드 등 설정을 localStorage에 보관 |

---

## 10. NPM 스크립트

| 스크립트 | 명령 |
|----------|------|
| `dev` | 개발 서버 |
| `build` | 프로덕션 빌드 |
| `start` | 프로덕션 서버 |
| `lint` | ESLint 실행 |
| `db:generate` | Drizzle 마이그레이션 생성 |
| `db:migrate` | 마이그레이션 적용 |
| `db:push` | 스키마 직접 푸시 |
| `db:seed` | 시드 데이터 투입 |
| `db:studio` | Drizzle Studio 실행 |

---

## 11. 미구현 / 향후 과제

- 프로젝트 수정 UI (이름/색상 변경)
- 프로젝트 아카이브 기능
- GitHub OAuth 로그인
- 설명 필드 마크다운 렌더링
- 키보드 단축키 (n: 새 태스크, /: 검색)
- 모바일 반응형 최적화
- 태스크 검색/필터
- 태스크 코멘트 기능
