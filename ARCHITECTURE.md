# Notenwürfel — Architecture

## 1. Stack

| Layer | Technology |
|---|---|
| Desktop shell | Tauri 2 (Rust — thin plugin-registration shell only) |
| Frontend | Vue 3 + PrimeVue 4 · TypeScript · Vite |
| Database access | `@tauri-apps/plugin-sql` (SQLite) |
| State | self written composables |
| Routing | vue-router |

---

## 2. Database

**File:** `{appConfigDir}/db/Notenwuerfel.sqlite`  
**Origin:** Originally an Apple Core Data SQLite file. The app now **owns** the database — schema evolution happens via forward migrations shipped with the app. Core Data bookkeeping columns/tables (`Z_PK`, `Z_ENT`, `Z_OPT`, `Z_PRIMARYKEY`) are retained for compatibility with existing data, but tables no longer required by any use case may be dropped.
**All SQL** lives in TypeScript gateway files. The Rust backend does not touch the DB.

### 2.1 Core Data conventions

All business tables carry three Core Data bookkeeping columns:

| Column | Rule |
|---|---|
| `Z_PK` | Primary key. Always allocated via `nextPrimaryKey()`, which atomically increments `Z_PRIMARYKEY` in a single `UPDATE … RETURNING` statement. |
| `Z_ENT` | Entity type ID. Must be set to the correct constant from `Z_ENT` map on every `INSERT`. |
| `Z_OPT` | Optimistic-lock counter. Must be incremented (`Z_OPT + 1`) on every `UPDATE`. |

Timestamps are Core Data integers: `Unix seconds − 978307200` (epoch offset). Use `dateToCoreData` / `coreDataToUnix` for all conversions.

### 2.2 Schema

| Table | Key columns | Relationships |
|---|---|---|
| `ZYEAR` | Z_PK, ZSTART, ZEND | has 2 × ZSEMESTER; M:N ZSTUDENT, ZGROUP, ZSUBJECT via join tables |
| `ZSEMESTER` | Z_PK, ZTYPEID (1/2), ZYEAR→FK | belongs to ZYEAR |
| `ZSTUDENT` | Z_PK, ZFIRSTNAME, ZLASTNAME | M:N ZYEAR (`Z_6YEARS`), M:N ZGROUP (`Z_3STUDENTS`), M:N ZCOURSE (`Z_1STUDENTS`) |
| `ZGROUP` | Z_PK, ZNAME, ZSORTINGNAME, ZTYPE | M:N ZYEAR (`Z_3YEARS`), M:N ZSTUDENT (`Z_3STUDENTS`) |
| `ZSUBJECT` | Z_PK, ZNAME | M:N ZYEAR (`Z_7YEARS`) |
| `ZCOURSE` | Z_PK, ZGROUP→FK, ZSUBJECT→FK, ZYEAR→FK, ZSEMESTER→FK, ZDAYS, ZLEVEL, ZORDINAL | has N × ZPERFORMANCE; M:N ZSTUDENT (`Z_1STUDENTS`). `ZLEVEL` (0=n/a, 1=GK, 2=LK) and `ZORDINAL` (parallel-course number) apply to Sek II; the display name is composed from group+subject (Sek I) or level+ordinal+subject (Sek II) |
| `ZPERFORMANCE` | Z_PK, ZCOURSE→FK, ZTYPE, ZSORTORDER, ZEDITABLE, ZDATE, ZWEIGHT, ZTITLE | has N × ZGRADE |
| `ZGRADE` | Z_PK, ZPERFORMANCE→FK, ZSTUDENT→FK, ZVALUE | leaf |
| `Z_6YEARS` | Z_6STUDENTS2→ZSTUDENT, Z_8YEARS1→ZYEAR | students ↔ school years |
| `Z_7YEARS` | Z_7SUBJECTS→ZSUBJECT, Z_8YEARS2→ZYEAR | subjects ↔ school years |
| `Z_3YEARS` | Z_3GROUPS1→ZGROUP, Z_8YEARS→ZYEAR | groups ↔ school years |
| `Z_3STUDENTS` | Z_6STUDENTS1→ZSTUDENT, Z_3GROUPS2→ZGROUP | students ↔ groups |
| `Z_1STUDENTS` | Z_6STUDENTS→ZSTUDENT, Z_1COURSES→ZCOURSE | students ↔ courses |

### 2.3 Migrations

The app owns schema evolution via `tauri-plugin-sql`'s built-in migration runner. Migrations are ordered, forward-only `Migration { version, description, sql, kind: MigrationKind::Up }` values registered in `src-tauri/src/main.rs` and applied automatically on startup. `tauri-plugin-sql` tracks applied versions internally in the SQLite file. SQL scripts live in `src-tauri/sql/`. Each migration must be idempotent-safe (`CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`, etc.). Dropping legacy Core Data tables (e.g. `Z_3SEMESTERS`) and adding new columns (e.g. `ZCOURSE.ZLEVEL` / `ZCOURSE.ZORDINAL`) is done here.

---

## 3. Gateway Layer

Each domain area has a `*Gateway.ts` file that owns all SQL for that entity. Gateways are called by the composables stores; views never query the DB directly.

### 3.1 Correctness checklist

Because Core Data originally managed FK integrity, cascade deletes, and PK allocation, the hand-written TypeScript gateways must replicate this correctly.

| Gateway | Create | Read | Update | Delete | Cascades | PK strategy |
|---|---|---|---|---|---|---|
| `SchoolYearGateway` | ✅ | ✅ | ✅ | ✅ | ✅ | `nextPrimaryKey` |
| `SubjectGateway` | ✅ | ✅ | ✅ | ✅ | ✅ | `nextPrimaryKey` |
| `StudentGateway` | ✅ | ✅ | ✅ | ✅ | ✅ | `nextPrimaryKey` |
| `GroupGateway` | ✅ | ✅ | ✅ | ✅ | ✅ | `nextPrimaryKey` |
| `CourseGateway` | ✅ | ✅ | ✅ | ✅ | ✅ | `nextPrimaryKey` |
| `EvaluationGateway` | ✅ | ✅ | ✅ | ✅ | ✅ | `nextPrimaryKey` |

### 3.2 Query libraries & transaction boundaries

Gateways are feature-scoped (one gateway per view/feature) and own the operation boundary. Reusable SQL lives in **query libraries** — small per-entity modules that export atomic query operations.

| Concept | Scope | Example |
|---|---|---|
| Query atom | Smallest reusable unit — a single `db.select()` or `db.execute()` call | `insertCourse(db, params)` |
| Query sequence | Multiple atoms that always run together (e.g. cascade deletes) — exported as one function | `deleteCourseGrades(db, coursePk)` |
| Gateway | Feature-scoped; imports atoms/sequences from one or more query libraries, wraps related writes in `withTransaction(...)` | `EvaluationGateway.createPerformanceWithGrades(...)` |
| Store | Orchestrates one gateway; belongs to a view/feature | `EvaluationStore` |

Atoms are extracted when reused across files. Sequences stay local when only used in one gateway.

School-year migration reuses the exported `GroupGateway.insertGroup`, `CourseGateway.insertCourse`, `CourseGateway.getNextOrdinal`, and `SubjectGateway.linkSubjectToSchoolYear` atoms. `MigrationGateway.migrateSchoolYear` owns the serialized operation boundary and creates fresh default performances and grades for each migrated course.

### 3.3 Error handling

Two-layer strategy:

1. **Global catch-all** — a top-level handler in `App.vue` catches unhandled exceptions from any store/gateway call and shows a generic error toast. This is the safety net.
2. **Per-operation handling** — added surgically only where the user can act on the failure (e.g. keeping a create-dialog open on unique-constraint violation, or showing a specific message). Not needed for read operations — a failed load shows an empty list + the global toast.

For a single-user desktop app with a local SQLite database, errors are very rare. The global catch-all alone covers the vast majority of real scenarios.

### 3.4 Cascade delete order

Correct ordering to avoid FK violations (leaf → root):

- `ZGRADE` → `ZPERFORMANCE` → `Z_1STUDENTS` → `ZCOURSE` → `Z_3YEARS` / `Z_6YEARS` / `Z_7YEARS` → `ZSEMESTER` → `ZYEAR`
- Use subquery-based deletes — `DELETE … INNER JOIN` is not valid SQLite syntax.
- All multi-step mutations are wrapped in `withTransaction(...)`. **Note:** `tauri-plugin-sql` runs on an SQLx connection pool (up to 10 connections), and each `db.execute` / `db.select` call acquires an arbitrary pooled connection. A SQL `BEGIN`/`COMMIT` issued across separate calls would therefore land on different physical connections — leaving a dangling transaction ("transaction within a transaction") and an unreleased lock ("database is locked"). Because the plugin exposes no way to pin a connection, `withTransaction` does **not** open a SQL transaction; it serializes related writes through a global queue. Atomic single-statement writes (WAL mode, `INSERT OR IGNORE`, `UPDATE … RETURNING`, subquery deletes) provide correctness. WAL is enabled once via migration; SQLx applies `foreign_keys = ON` and a 5 s `busy_timeout` per connection by default.
- Student membership can be managed from either side, and both paths are idempotent (safe to combine/repeat):
  - **Group → courses:** `GroupGateway.assignStudentToGroup` adds the `Z_3STUDENTS` group link and enrolls the student in **every existing course** of the group (`Z_1STUDENTS` + blank `ZGRADE` rows).
  - **Course → group:** `CourseGateway.assignStudentToCourse` enrolls the student in **that one course** (`Z_1STUDENTS` + grades) and adds the `Z_3STUDENTS` group link for the course's group. It does **not** enroll them in the group's other courses (granular by design; note that `createCourse` likewise does not auto-enroll existing group members).
  - Idempotency: membership tables (`Z_1STUDENTS`, `Z_3STUDENTS`) already have composite PKs and are written with `INSERT OR IGNORE`; grades are guarded by a unique index on `ZGRADE(ZPERFORMANCE, ZSTUDENT)` and only created for performances the student does not already have.

---

## 4. Management View Pattern

All management views (`StudentManagement`, `GroupManagement`, `CourseManagement`) follow a consistent two-panel layout:

| Area | Purpose |
|---|---|
| Left panel | Entity list (selectable) + create placeholder item (id=0) |
| Right panel | Entity fields (name, type, etc.) with save/delete buttons; **M:N assignments** are decoupled and atomic |

**Atomic assignment pattern:** Adding or removing a student from a group/course (or vice versa) is an immediate DB operation — not batched on save. The UI uses an InputGroup (AutoComplete + confirm/remove buttons) plus a button list showing current assignments. This keeps all management views consistent and avoids unsaved-state complexity.
