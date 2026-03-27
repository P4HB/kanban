# 📋 개인 프로젝트 매니저 — 기획서

> 개발 프로젝트 관리를 위한 칸반보드 + 캘린더 + 대시보드 웹앱
> 작성일: 2026-03-26

---

## 1. 프로젝트 개요

| 항목 | 내용 |
|------|------|
| **목적** | 다수의 개발 프로젝트(클라이언트, 졸업, 개인)를 한곳에서 칸반 + 캘린더로 관리 |
| **사용자** | 본인 1명 (간단한 인증 적용) |
| **배포** | Vercel (호스팅 + DB) |
| **유지보수** | Claude Code CLI로 자연어 수정 반영 |

---

## 2. 기술 스택

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **언어**: TypeScript
- **스타일링**: Tailwind CSS
- **상태관리**: Zustand (경량, 간단)
- **드래그앤드롭**: @dnd-kit/core + @dnd-kit/sortable
- **캘린더**: react-big-calendar 또는 @schedule-x/react (경량 대안)
- **아이콘**: Lucide React

### Backend
- **API**: Next.js Route Handlers (App Router)
- **ORM**: Drizzle ORM (경량, 타입 안전)
- **DB**: Vercel Postgres (Neon 기반, Vercel 대시보드에서 바로 연결)
- **인증**: NextAuth.js v5 — GitHub OAuth (가장 간단, 본인 계정만 허용)

### 인프라
- **호스팅**: Vercel
- **DB**: Vercel Postgres (무료 티어: 256MB 저장, 충분)
- **CI/CD**: Vercel Git Integration (push → 자동 배포)

---

## 3. 핵심 기능

### 3.1 프로젝트 관리
- 사이드바에 프로젝트 목록 표시
- 프로젝트별 색상 + 아이콘 지정
- 프로젝트 추가/수정/삭제/아카이브
- 프로젝트 선택 시 해당 칸반보드로 전환

### 3.2 칸반보드
- **기본 컬럼 (6개)**:
  - `Backlog` — 아이디어/미정리 작업
  - `Todo` — 이번에 할 것으로 확정
  - `In Progress` — 현재 진행 중
  - `On Hold` — 보류 (클라이언트 응답 대기, 블로커 등)
  - `Review` — 검토/테스트/피드백 대기
  - `Done` — 완료
- 드래그앤드롭으로 카드 이동 (컬럼 간 + 컬럼 내 순서)
- 컬럼별 카드 개수 표시

### 3.3 태스크 카드
- **필수 필드**: 제목, 상태(컬럼), 프로젝트
- **선택 필드**:
  - 설명 (마크다운 지원)
  - 우선순위: `Urgent` / `High` / `Medium` / `Low`
  - 라벨: 자유 태그 (색상 지정 가능)
  - 마감일 (due date)
  - 체크리스트 (서브태스크)
- 카드 클릭 시 상세 모달/사이드패널

### 3.4 캘린더 뷰
- 월간/주간 뷰 전환
- 마감일이 있는 태스크를 캘린더에 표시
- 프로젝트별 색상으로 구분
- 캘린더에서 직접 태스크 클릭 → 상세 보기
- 오늘 기준 지난 마감일 하이라이트 (overdue)

### 3.5 대시보드
- **프로젝트별 진행률**: 완료/전체 태스크 비율 프로그레스 바
- **전체 요약**: 오늘의 할일, 이번 주 마감, overdue 카운트
- **컬럼별 분포**: 간단한 바 차트 또는 숫자 카드

### 3.6 인증
- NextAuth.js + GitHub OAuth
- `allowedEmails` 또는 `allowedGitHubIds`로 본인만 로그인 허용
- 미인증 시 로그인 페이지로 리다이렉트

---

## 4. 데이터 모델 (Drizzle ORM)

```typescript
// schema.ts

// 프로젝트
export const projects = pgTable('projects', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  color: varchar('color', { length: 7 }).notNull().default('#6366f1'), // hex
  icon: varchar('icon', { length: 50 }),  // lucide icon name
  archived: boolean('archived').notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 칸반 컬럼 (프리셋이지만 DB에 저장하여 순서/이름 변경 가능)
export const columns = pgTable('columns', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 50 }).notNull(),
  slug: varchar('slug', { length: 50 }).notNull().unique(), // backlog, todo, in_progress, on_hold, review, done
  sortOrder: integer('sort_order').notNull(),
  color: varchar('color', { length: 7 }),
});

// 라벨
export const labels = pgTable('labels', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 50 }).notNull(),
  color: varchar('color', { length: 7 }).notNull().default('#8b5cf6'),
});

// 태스크 (카드)
export const tasks = pgTable('tasks', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 200 }).notNull(),
  description: text('description'),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  columnId: uuid('column_id').references(() => columns.id).notNull(),
  priority: varchar('priority', { length: 10 }), // urgent, high, medium, low
  dueDate: date('due_date'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 태스크-라벨 관계 (다대다)
export const taskLabels = pgTable('task_labels', {
  taskId: uuid('task_id').references(() => tasks.id, { onDelete: 'cascade' }).notNull(),
  labelId: uuid('label_id').references(() => labels.id, { onDelete: 'cascade' }).notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.taskId, t.labelId] }),
}));

// 체크리스트 아이템
export const checklistItems = pgTable('checklist_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  taskId: uuid('task_id').references(() => tasks.id, { onDelete: 'cascade' }).notNull(),
  content: varchar('content', { length: 300 }).notNull(),
  completed: boolean('completed').notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(0),
});
```

---

## 5. 페이지 구조 (App Router)

```
app/
├── layout.tsx              # 루트 레이아웃 (사이드바 포함)
├── page.tsx                # 대시보드 (메인)
├── login/
│   └── page.tsx            # 로그인 페이지
├── board/
│   └── [projectId]/
│       └── page.tsx        # 프로젝트별 칸반보드
├── calendar/
│   └── page.tsx            # 캘린더 뷰 (전체 프로젝트)
├── api/
│   ├── auth/[...nextauth]/ # NextAuth 라우트
│   ├── projects/           # CRUD
│   ├── tasks/              # CRUD + 순서 변경
│   ├── labels/             # CRUD
│   └── columns/            # 조회 (프리셋)
```

---

## 6. UI 레이아웃

```
┌─────────────────────────────────────────────────┐
│  ☰ 앱 이름                          🔔  👤     │
├────────┬────────────────────────────────────────┤
│        │                                        │
│ 📊 대시보드│  ← 메인 콘텐츠 영역                 │
│        │                                        │
│ 📋 보드  │  [Backlog] [Todo] [Progress] [Hold]  │
│  ├ 단가로 │  [Review]  [Done]                    │
│  ├ miniwedd│                                     │
│  ├ KORI  │   ┌─────┐  ┌─────┐  ┌─────┐        │
│  └ 날다데브│   │카드1 │  │카드3 │  │카드5 │        │
│        │   │     │  │     │  │     │        │
│ 📅 캘린더 │   ├─────┤  └─────┘  └─────┘        │
│        │   │카드2 │                             │
│ ⚙️ 설정 │   └─────┘                             │
│        │                                        │
└────────┴────────────────────────────────────────┘
```

---

## 7. API 설계

### Projects
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/projects` | 전체 프로젝트 목록 |
| POST | `/api/projects` | 프로젝트 생성 |
| PATCH | `/api/projects/:id` | 프로젝트 수정 |
| DELETE | `/api/projects/:id` | 프로젝트 삭제 |

### Tasks
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/tasks?projectId=xxx` | 프로젝트별 태스크 조회 |
| GET | `/api/tasks/calendar?from=&to=` | 캘린더용 (마감일 기준) |
| POST | `/api/tasks` | 태스크 생성 |
| PATCH | `/api/tasks/:id` | 태스크 수정 (상태, 순서 등) |
| PATCH | `/api/tasks/:id/move` | 드래그앤드롭 이동 (컬럼 + 순서) |
| DELETE | `/api/tasks/:id` | 태스크 삭제 |

### Labels
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/labels` | 라벨 목록 |
| POST | `/api/labels` | 라벨 생성 |
| DELETE | `/api/labels/:id` | 라벨 삭제 |

### Dashboard
| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/dashboard` | 전체 통계 (서버사이드 집계) |

---

## 8. 개발 순서 (마일스톤)

### Phase 1: 기반 세팅 (Day 1)
- [ ] Next.js 프로젝트 초기화 + Tailwind + TypeScript
- [ ] Vercel Postgres 연결 + Drizzle ORM 세팅
- [ ] DB 마이그레이션 (스키마 생성)
- [ ] NextAuth.js GitHub OAuth 설정
- [ ] 기본 레이아웃 (사이드바 + 헤더)

### Phase 2: 칸반보드 (Day 2-3)
- [ ] 프로젝트 CRUD
- [ ] 태스크 CRUD
- [ ] 칸반보드 UI (dnd-kit 드래그앤드롭)
- [ ] 태스크 상세 모달 (우선순위, 라벨, 마감일, 체크리스트)

### Phase 3: 캘린더 + 대시보드 (Day 4-5)
- [ ] 캘린더 뷰 구현
- [ ] 대시보드 통계 + 진행률 표시
- [ ] Overdue 하이라이트

### Phase 4: 다듬기 (Day 6-7)
- [ ] 반응형 디자인 (모바일 최소 지원)
- [ ] 다크모드
- [ ] 키보드 단축키 (n: 새 태스크, /: 검색 등)
- [ ] Vercel 배포 + 도메인 연결

---

## 9. Claude Code 연동 참고

프로젝트 루트에 이 기획서를 `PROJECT.md`로 배치하면 Claude Code가 컨텍스트로 활용 가능.

**사용 예시:**
```bash
# 태스크에 코멘트 기능 추가해줘
claude "tasks 테이블에 comments 기능 추가해줘. 간단하게 텍스트+작성시간만."

# 캘린더에 드래그로 마감일 변경하는 기능 추가
claude "캘린더에서 태스크를 다른 날짜로 드래그하면 마감일이 변경되게 해줘"

# 특정 버그 수정
claude "칸반에서 카드 드래그할 때 가끔 순서가 꼬이는 버그 있어. sortOrder 로직 확인해줘"
```

---

## 10. 주요 설계 결정 기록

| 결정 | 선택 | 이유 |
|------|------|------|
| 프레임워크 | Next.js App Router | Vercel 최적화, 풀스택 원스톱 |
| DB | Vercel Postgres | Vercel 통합, 무료 티어 충분, 별도 세팅 불필요 |
| ORM | Drizzle | 경량, 타입 안전, SQL에 가까운 직관적 API |
| DnD | dnd-kit | React 18+ 호환, 접근성, 커스터마이징 자유도 |
| 인증 | NextAuth + GitHub | 1인 사용, 가장 간단한 OAuth |
| 상태관리 | Zustand | 보일러플레이트 최소, 필요한 곳에만 사용 |
| 칸반 컬럼 | 6개 프리셋 (DB 저장) | 범용성 + 추후 커스터마이징 가능성 확보 |
