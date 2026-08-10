# Notenwürfel — Architecture

## 1. Stack

| Layer | Technology |
|---|---|
| Desktop shell | Tauri 2 (Rust — thin plugin-registration shell only) |
| Frontend | Vue 3 + PrimeVue 4 · TypeScript · Vite |
| Database access | `@tauri-apps/plugin-sql` (SQLite) |
| State | Pinia stores |
| Routing | vue-router |

---

## 2. Database

**File:** `{appLocalDataDir}/db/Notenwuerfel.sqlite`  
**Origin:** Pre-existing Apple Core Data SQLite file. Schema is fixed — no migrations are run by this app.  
**All SQL** lives in TypeScript gateway files. The Rust backend does not touch the DB.

### 2.1 Core Data conventions

All business tables carry three Core Data bookkeeping columns:

| Column | Rule |
|---|---|
| `Z_PK` | Primary key. Always allocated via `nextPrimaryKey()`, which reads/increments `Z_PRIMARYKEY`. |
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
| `ZCOURSE` | Z_PK, ZGROUP→FK, ZSUBJECT→FK, ZYEAR→FK, ZSEMESTER→FK, ZDAYS | has N × ZPERFORMANCE; M:N ZSTUDENT (`Z_1STUDENTS`) |
| `ZPERFORMANCE` | Z_PK, ZCOURSE→FK, ZTYPE, ZSORTORDER, ZEDITABLE, ZDATE, ZWEIGHT, ZTITLE | has N × ZGRADE |
| `ZGRADE` | Z_PK, ZPERFORMANCE→FK, ZSTUDENT→FK, ZVALUE | leaf |
| `Z_6YEARS` | Z_6STUDENTS2→ZSTUDENT, Z_8YEARS1→ZYEAR | students ↔ school years |
| `Z_7YEARS` | Z_7SUBJECTS→ZSUBJECT, Z_8YEARS2→ZYEAR | subjects ↔ school years |
| `Z_3YEARS` | Z_3GROUPS1→ZGROUP, Z_8YEARS→ZYEAR | groups ↔ school years |
| `Z_3STUDENTS` | Z_6STUDENTS1→ZSTUDENT, Z_3GROUPS2→ZGROUP | students ↔ groups |
| `Z_1STUDENTS` | Z_6STUDENTS→ZSTUDENT, Z_1COURSES→ZCOURSE | students ↔ courses |

---

## 3. Gateway Layer

Each domain area has a `*Gateway.ts` file that owns all SQL for that entity. Gateways are called by Pinia stores; views never query the DB directly.

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

### 3.2 Cascade delete order

Correct ordering to avoid FK violations (leaf → root):

- `ZGRADE` → `ZPERFORMANCE` → `Z_1STUDENTS` → `ZCOURSE` → `Z_3YEARS` / `Z_6YEARS` / `Z_7YEARS` → `ZSEMESTER` → `ZYEAR`
- Use subquery-based deletes — `DELETE … INNER JOIN` is not valid SQLite syntax.
- All multi-step mutations run inside `BEGIN EXCLUSIVE TRANSACTION` / `COMMIT` / `ROLLBACK`.
