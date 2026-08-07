# Notenwürfel — Consolidated Task List

**Legend:** ✅ Done · 🟡 Partial / started · ⬜ Missing · 🐞 Bug / tech debt · ❓ Open question / needs decision

**Stack:** Tauri 2 · Vue 3 + PrimeVue 4 · TypeScript · SQLite (@tauri-apps/plugin-sql)  
**DB:** Pre-existing Apple Core Data SQLite file (`{appLocalDataDir}/db/Notenwuerfel.sqlite`). Schema is fixed. All SQL lives in TypeScript gateway files — the Rust backend is a thin plugin-registration shell only.

---

## 1. Infrastructure & Cross-Cutting

- ✅ Routing (vue-router), app shell (`App.vue`, `GlobalToolbar`)
- ✅ PrimeVue 4 with custom Aura/cyan theme; performance-type color tokens
- ✅ Dark mode toggle (toolbar avatar popover), persisted via `KeyValueStore`
- ✅ Global school-year + semester selector (`SchoolYearSelector`), persisted to `KeyValueStore`
- ✅ Core Data date helpers (`coreDataToUnix` / `dateToCoreData`, +978307200 epoch offset)
- ✅ `nextPrimaryKey()` — reads/increments `Z_PRIMARYKEY` table for Core Data-compatible PK allocation
- 🟡 **Reload on school-year / semester change** — management views (Student, Group, Subject, Course) and the Evaluation view do **not** watch the global `selectedSchoolYear` / `selectedSemester` signals; switching the selector does not reload data in any of these views. Every view that depends on the selection must add a `watch` on both values and re-run its load function.
- 🐞 Dead scaffold Rust command `greet()` in `src-tauri/src/main.rs` — can be removed
- 🟡 Test coverage: only `SubjectGateway` and `StudentManagement` / `SubjectManagement` views have partial tests; Groups, Courses, School Years, and the entire Evaluation domain have none
- ⬜ No user-facing error handling: DB failures are silently swallowed; no toast/dialog on error
- ⬜ No delete-confirmation dialogs anywhere (destructive actions fire immediately)

---

## 2. Data Model Reference

All business tables carry Core Data's `Z_PK` / `Z_ENT` / `Z_OPT` columns. Timestamps are Core Data integers (Unix − 978307200).

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

## 3. Part 1 — Management

### 3.1 School Years & Semesters (`SchoolYearGateway`, `SchoolYearStore`, `SchoolYearManagement`)

- ✅ Load all school years with their two semesters
- ✅ Create school year + two semesters (Core Data timestamps, cross-field date validation)
- ✅ Edit school year / semester dates
- ✅ Format / display school year label
- ⬜ **Delete school year** — `removeSchoolYear()` in `SchoolYearStore` is an empty no-op; no SQL delete exists in `SchoolYearGateway`. Must cascade-delete: both `ZSEMESTER` rows, all `Z_3YEARS` / `Z_6YEARS` / `Z_7YEARS` join rows, all `ZCOURSE` rows (and their cascades — see Course delete), then `ZYEAR`.

### 3.2 Subjects (`SubjectGateway`, `SubjectStore`, `SubjectManagement`)

- ✅ Load subjects by school year
- ✅ Load all subjects (for autocomplete)
- ✅ Create subject — insert `ZSUBJECT` (via `nextPrimaryKey("Subject")`) + `Z_7YEARS` link; or link-only if subject already exists in another year
- ✅ Edit subject name
- ✅ Delete subject — removes `Z_7YEARS` link; deletes `ZSUBJECT` only if no other year link remains
- 🐞 Remove debug `console.log` statements in `SubjectGateway.ts` (lines 23, 28)

### 3.3 Students (`StudentGateway`, `StudentStore`, `StudentManagement`)

- ✅ Load students by school year
- ✅ Create student — insert `ZSTUDENT` + `Z_6YEARS` link
- ✅ Edit student first/last name
- ✅ Delete student — removes `Z_6YEARS` link; deletes `ZSTUDENT` only if no other year link remains
- ✅ Load a student's groups for a given semester
- ✅ Assign / unassign student to/from a group (via `Z_3STUDENTS`)
- ⬜ **Course assignment in StudentManagement** — the courses autocomplete is hard-coded to `:items="[]"` (`StudentManagement.vue:176`); `availableCourses` is loaded but never wired to the autocomplete. Fix: bind `:items="availableCourses"` and call the store's assign/unassign functions.
- ⬜ **Grade summary in student management** — display an overview of a student's current grades across all their courses (see §5.2)

### 3.4 Groups / Classes (`GroupGateway`, `GroupStore`, `GroupManagement`)

- ✅ Load groups by school year (ordered by `ZSORTINGNAME`)
- ✅ Create group — insert `ZGROUP` (computes zero-padded `ZSORTINGNAME`) + `Z_3YEARS` link
- ✅ Edit group name and type (Sek I / Sek II)
- ✅ Load students belonging to a group
- ✅ Assign / unassign student to/from group (`Z_3STUDENTS`)
- ✅ Delete group — cascade intended: `Z_3STUDENTS`, `Z_3YEARS`, grades, performances, courses for that group in the year, then `ZGROUP`
- 🐞 **Invalid SQLite syntax** in `GroupGateway.deleteGroupInSchoolYear` (lines 67–86): `DELETE … INNER JOIN` is not valid SQLite. Rewrite as subqueries, e.g. `DELETE FROM ZGRADE WHERE ZPERFORMANCE IN (SELECT Z_PK FROM ZPERFORMANCE WHERE ZCOURSE IN (SELECT Z_PK FROM ZCOURSE WHERE ZGROUP = $1 AND ZYEAR = $2))` and similar for `ZPERFORMANCE` and `ZCOURSE`.
- ❓ **Open question** (`GroupGateway.ts:109` TODO): when a student is unassigned from a group, should they also be removed from all courses that belong to that group? Decide and implement.

### 3.5 Courses (`CourseGateway`, `CourseStore`, `CourseManagement`)

This is the most critical incomplete area. The UI is fully built; the entire persistence layer is unimplemented.

- ✅ Load courses by school year + semester (with group and subject names)
- ✅ Load students enrolled in a course
- ✅ Load available groups for a school year (for course creation)
- ✅ Load available subjects for a school year (for course creation)
- ⬜ **Create course** (`CourseGateway.createCourse` — empty body): insert `ZCOURSE` with `ZGROUP`, `ZSUBJECT`, `ZYEAR`, `ZSEMESTER`. Note: `ZDAYS` serialization format must be clarified (currently a blob in the DB).
- ⬜ **Update course** (`CourseGateway.updateCourse` — empty body): update `ZGROUP`, `ZSUBJECT`, `ZDAYS` as needed.
- ⬜ **Delete course** (`CourseGateway.deleteCourseInSchoolYear` — empty body): cascade-delete `ZGRADE` rows (for all performances of that course), `ZPERFORMANCE` rows, `Z_1STUDENTS` links, then `ZCOURSE`.
- ⬜ **Assign student to course** (`CourseGateway.assignStudentToCourse` — empty body): insert row into `Z_1STUDENTS`; also create blank `ZGRADE` rows for each existing `ZPERFORMANCE` of that course.
- ⬜ **Unassign student from course** (`CourseGateway.unassignStudentFromCourse` — empty body): delete from `Z_1STUDENTS`; decide whether to delete that student's `ZGRADE` rows.

---

## 4. Part 2 — Evaluation

### 4.1 Course / Group Tree & Navigation

- ✅ Load tree: groups → courses for selected school year + semester
- ✅ Select group → show all students of that group (read-only, no grade columns)
- ✅ Select course → load students + performances for that course
- ✅ Auto-expand all groups on load
- 🟡 **Reload on school-year / semester change** — `onMounted` loads once; switching the global selector does not reload the tree or clear the current selection. Add a `watch` on `selectedSchoolYear` / `selectedSemester` to call `loadTreeItems` and reset selected node/students/performances.

### 4.2 Grade Table (`EvaluationTable`)

- ✅ Virtual-scrolled editable DataTable
- ✅ Color-coded columns by performance type (oral = sky, special = green, test = red)
- ✅ Per-type input validation: oral grades (`++/+/0/-/--/f`), numeric grades (0–15)
- ✅ Column selection (click header → emits `column-selected`)
- ✅ Grade-change event propagation

### 4.3 Add / Edit Performances

- ✅ Dialog to create a new oral / special / written performance (title, type, date)
- ✅ Weight auto-distribution on creation (equal redistribution among existing performances of the same type)
- ✅ Blank `ZGRADE` rows inserted for every student in the course on performance creation
- ✅ Edit performance title (via same dialog when a column is selected)

### 4.4 Grade Auto-Calculation

- ✅ **Oral recommendation** (type 1): after each oral-grade entry (type 0), re-compute the frequency-weighted average across all oral grades for that student and update the recommendation performance automatically
- ✅ **Special overall grade** (type 4): updated from special performance grades (type 3)
- ✅ **Written overall grade** (type 7): updated from written/test performance grades (type 6)

### 4.5 Grade Weights (`GradeWeightsView`)

- ✅ Display special, written, and general-part performances with their current weights
- ✅ Sliders / number inputs that keep paired weights summing to 1
- ✅ Emit `update-performance` to parent which persists via `updatePerformance`
- 🐞 **Save button has no `@click` handler** in the special performances panel (`GradeWeightsView.vue:127–134`) — button is dead
- 🐞 **Save button has no `@click` handler** in the written performances panel (`GradeWeightsView.vue:172–179`) — button is dead
- 🐞 **Undo buttons** in both panels likewise have no `@click` handlers
- 🐞 `update-performances` (bulk) emit is declared in the component's `defineEmits` but never called — either wire it or remove it
- ⬜ Implement save action: collect all modified weights for the panel's performances and emit `update-performances` (or call `update-performance` for each)
- ⬜ Implement undo action: revert local weight values to the last-persisted state

### 4.6 Test Grade Calculator (`TestGradeCalculator`)

- ✅ Total-points input → builds full German 15-point scale table with per-grade point thresholds
- ✅ Achieved-points input → highlights matching row and shows grade summary
- 🐞 Typo `lowetPercent` throughout (should be `lowerPercent`) — cosmetic but inconsistent
- ⬜ **Rechtschreibung option**: add a toggle (checkbox/switch) to enable a spelling-error deduction. When enabled, show an additional input for Rechtschreibung points (always capped at 10% of total points). Deduct this value from `achievedPoints` before the grade lookup. The deduction should be reflected in the grade summary display.

### 4.7 Histogram (`HistogramPanel`)

- ✅ Bottom drawer; opens when a performance column is selected and histogram toggle is active
- ✅ **Oral performances** (type 0): bar chart over `++/+/0/-/--/f` labels; average calculated and shown in dataset label
- 🟡 **Non-oral performances** (numeric 0–15): bar chart shows distribution and grade-band grouping, but **no average is calculated or displayed**. Add: `const average = grades.reduce((a, b) => a + b, 0) / grades.length` and include it in the dataset label (e.g. `"… Durchschnitt: X.XX Notenpunkte"`).

---

## 5. Part 2 — Planned / Not Yet Implemented

### 5.1 Automatic Data Migration on New School Year

When the user creates a new school year, the app should offer (or automatically perform) a migration of the previous year's data:

- ⬜ After school year creation, detect whether a previous school year exists
- ⬜ Prompt the user: "Soll die Basisstruktur des letzten Schuljahres übernommen werden?" (or similar)
- ⬜ If confirmed, copy (not move) the following from the previous year to the new year:
  - All `ZSTUDENT` records → create new `Z_6YEARS` links to the new year
  - All `ZGROUP` records → create new `Z_3YEARS` links and new `Z_3STUDENTS` membership links
  - All `ZSUBJECT` records → create new `Z_7YEARS` links
  - All `ZCOURSE` records (group + subject pairings) → create new `ZCOURSE` rows for the new year/semester; copy `Z_1STUDENTS` memberships; do **not** copy `ZPERFORMANCE` or `ZGRADE` rows (those belong to the old year)
- ⬜ Implement as a dedicated migration gateway function, called from `SchoolYearStore` after `createSchoolYear`

### 5.2 Student Grade Summary in Management

- ⬜ Add a grade summary panel to `StudentManagement` (or as a separate route) showing:
  - All courses the student is enrolled in for the current semester
  - For each course: the performance titles and the student's entered grade values
  - The computed overall grades (oral recommendation, special overall, written overall) if available
- ⬜ Read-only view; no editing (editing stays in the Evaluation view)

### 5.3 Timetable View (Course Days)

- ⬜ `ZCOURSE.ZDAYS` stores a serialized schedule; the field is read but never written or displayed
- ⬜ Define and document the `ZDAYS` serialization format (blob / JSON?)
- ⬜ Add a UI to set course days in `CourseManagement` (e.g. a weekday multi-select)
- ⬜ Implement a timetable view (new route, e.g. `/timetable`) that renders a weekly grid of courses for the selected school year + semester

---

## 6. Part 3 — Configuration

Currently `ConfigurationView.vue` renders only `<p>Konfigurieren</p>`.

- ⬜ Replace stub with a real settings layout (reuse `ManagementPanel` or a dedicated settings shell)
- ⬜ **Name rendering order**: option to display students as "Nachname, Vorname" or "Vorname Nachname"; persist in `KeyValueStore`; apply everywhere students are listed
- ⬜ **Dark mode setting**: dark mode is currently only accessible via the toolbar avatar popover; consider surfacing the toggle here too (or moving it here exclusively)
- ⬜ **Default grade scale**: option to set the default grading system (e.g. 15-point vs 6-point) if other scales are ever needed
- ⬜ **Default weights**: allow setting default weights for oral / special / written portions that are applied when a new course is created
- ⬜ **DB file path / backup**: option to see the location of the active SQLite file and trigger a manual backup copy

---

## 7. Core Data Gateway Correctness (Most Critical)

Because Core Data originally managed all FK integrity, cascade deletes, and PK allocation, the hand-written TypeScript gateways must replicate this correctly. Review each gateway against the checklist:

| Gateway | Create | Read | Update | Delete | Cascades correct | PK strategy |
|---|---|---|---|---|---|---|
| `SchoolYearGateway` | ✅ | ✅ | ✅ | ⬜ missing | — | `lastInsertId` |
| `SubjectGateway` | ✅ | ✅ | ✅ | ✅ | ✅ (Z_7YEARS + orphan check) | `nextPrimaryKey` |
| `StudentGateway` | ✅ | ✅ | ✅ | ✅ | ✅ (Z_6YEARS + orphan check) | `lastInsertId` |
| `GroupGateway` | ✅ | ✅ | ✅ | 🐞 SQL bug | 🐞 invalid syntax | `lastInsertId` |
| `CourseGateway` | ⬜ | ✅ | ⬜ | ⬜ | ⬜ | — |
| `EvaluationGateway` | ✅ (perf+grades) | ✅ | ✅ | ⬜ missing | — | `lastInsertId` |

**Specific items:**

- ⬜ Verify that `Z_OPT` (Core Data's optimistic-lock counter) is incremented on every `UPDATE` — Core Data increments it; if the original app is ever used again on the same file, stale `Z_OPT` values may cause issues
- ⬜ Verify `Z_ENT` is set correctly on every `INSERT` (each entity has a fixed entity number in the Core Data model; e.g. ZYEAR=8, ZSEMESTER=5, ZSTUDENT=6, ZGROUP=3, ZSUBJECT=7)
- ⬜ Audit whether all `nextPrimaryKey` vs `lastInsertId` choices are intentional — `SubjectGateway` uses `nextPrimaryKey` (required because Core Data tracks Z_MAX per entity) but student/group/course gateways use `lastInsertId`; confirm the latter is safe for the Core Data schema
- 🐞 Fix `GroupGateway.deleteGroupInSchoolYear` invalid `DELETE … INNER JOIN` SQL (see §3.4)
- ⬜ Add delete to `SchoolYearGateway` with correct cascade order (see §3.1)
- ⬜ Implement all 5 missing `CourseGateway` mutation functions (see §3.5)
- ⬜ Add delete to `EvaluationGateway` for performances (and their grades) — currently there is no way to remove a performance once created
