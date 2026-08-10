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
- ✅ Test coverage: all gateway functions and all management views have tests
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
- ✅ **Delete school year** — `deleteSchoolYear()` cascade-deletes: ZGRADE → ZPERFORMANCE → Z_1STUDENTS → ZCOURSE → Z_3YEARS → Z_6YEARS → Z_7YEARS → ZSEMESTER → ZYEAR, all inside a transaction. `removeSchoolYear()` in `SchoolYearStore` still needs to call this.

### 3.2 Subjects (`SubjectGateway`, `SubjectStore`, `SubjectManagement`)

- ✅ Load subjects by school year
- ✅ Load all subjects (for autocomplete)
- ✅ Create subject — `INSERT OR IGNORE` on `ZSUBJECT` (unique index on ZNAME); if inserted use new PK, else SELECT existing PK; check for existing `Z_7YEARS` link and insert only if missing. All inside a transaction.
- ✅ Edit subject name
- ✅ Delete subject — removes `Z_7YEARS` link inside a transaction; deletes `ZSUBJECT` only if no other year link remains

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
- ✅ **Fixed SQLite syntax** in `GroupGateway.deleteGroupInSchoolYear`: rewrote invalid `DELETE … INNER JOIN` as subquery-based deletes.
- ❓ **Open question** (`GroupGateway.ts:109` TODO): when a student is unassigned from a group, should they also be removed from all courses that belong to that group? Decide and implement.

### 3.5 Courses (`CourseGateway`, `CourseStore`, `CourseManagement`)

This is the most critical incomplete area. The UI is fully built; the entire persistence layer is unimplemented.

- ✅ Load courses by school year + semester (with group and subject names)
- ✅ Load students enrolled in a course
- ✅ Load available groups for a school year (for course creation)
- ✅ Load available subjects for a school year (for course creation)
- ✅ **Create course**: inserts `ZCOURSE` with `ZGROUP`, `ZSUBJECT`, `ZYEAR`, `ZSEMESTER`, `ZDAYS` via `nextPrimaryKey("Course")`, inside a transaction. Note: `ZDAYS` serialization format (blob) is still unresolved — see §5.3.
- ✅ **Update course**: updates `ZGROUP`, `ZSUBJECT`, `ZDAYS`, and increments `Z_OPT`.
- ✅ **Delete course**: cascade-deletes ZGRADE (subquery via ZPERFORMANCE) → ZPERFORMANCE → Z_1STUDENTS → ZCOURSE, inside a transaction.
- ✅ **Assign student to course**: inserts `Z_1STUDENTS` row and creates blank `ZGRADE` rows for every existing `ZPERFORMANCE` of the course, inside a transaction.
- ✅ **Unassign student from course**: deletes the student's `ZGRADE` rows for that course's performances, then removes the `Z_1STUDENTS` link, inside a transaction.

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
| `SchoolYearGateway` | ✅ | ✅ | ✅ | ✅ | ✅ (full cascade) | `nextPrimaryKey` |
| `SubjectGateway` | ✅ | ✅ | ✅ | ✅ | ✅ (Z_7YEARS + orphan check) | `nextPrimaryKey` |
| `StudentGateway` | ✅ | ✅ | ✅ | ✅ | ✅ (Z_6YEARS + orphan check) | `nextPrimaryKey` |
| `GroupGateway` | ✅ | ✅ | ✅ | ✅ | ✅ (subquery cascade) | `nextPrimaryKey` |
| `CourseGateway` | ✅ | ✅ | ✅ | ✅ | ✅ (ZGRADE→ZPERF→Z_1STUDENTS→ZCOURSE) | `nextPrimaryKey` |
| `EvaluationGateway` | ✅ (perf+grades) | ✅ | ✅ | ✅ | ✅ (ZGRADE before ZPERFORMANCE) | `nextPrimaryKey` |

**Specific items:**

- ✅ `Z_OPT` incremented on every `UPDATE` across all gateways
- ✅ `Z_ENT` set correctly on every `INSERT` via the `Z_ENT` constants map
- ✅ All gateways use `nextPrimaryKey` for Core Data-compatible PK allocation
- ✅ `GroupGateway.deleteGroupInSchoolYear` invalid SQL fixed (see §3.4)
- ✅ `SchoolYearGateway.deleteSchoolYear` implemented with correct cascade order (see §3.1)
- ✅ All 5 `CourseGateway` mutation functions implemented (see §3.5)
- ✅ `deletePerformance` added to `EvaluationGateway`: deletes all `ZGRADE` rows then the `ZPERFORMANCE` row, inside a transaction.
