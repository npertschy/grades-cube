# Notenwürfel — Task Backlog

**Legend:** ✅ Done · 🟡 Partial / started · ⬜ Missing · 🐞 Bug / tech debt · ❓ Open question / needs decision

**Priority:** `[P1]` Blocking / foundational — do first · `[P2]` Important feature work · `[P3]` Polish / nice-to-have

See [REQUIREMENTS.md](./REQUIREMENTS.md) for domain rules and business invariants. See [ARCHITECTURE.md](./ARCHITECTURE.md) for the stack, schema, and gateway correctness checklist.

---

## 1. Infrastructure & Cross-Cutting

- ✅ Routing (vue-router), app shell (`App.vue`, `GlobalToolbar`)
- ✅ PrimeVue 4 with custom Aura/cyan theme; performance-type color tokens
- ✅ Dark mode toggle (toolbar avatar popover), persisted via `KeyValueStore`
- ✅ Global school-year + semester selector (`SchoolYearSelector`), persisted to `KeyValueStore`
- ✅ Core Data date helpers (`coreDataToUnix` / `dateToCoreData`, +978307200 epoch offset)
- ✅ `nextPrimaryKey()` — reads/increments `Z_PRIMARYKEY` table for Core Data-compatible PK allocation
- ✅ Test coverage: all gateway functions and all management views have tests
- ✅ `[P1]` **Reload on school-year / semester change** — management views (Student, Group, Subject, Course) and the Evaluation view do **not** watch the global `selectedSchoolYear` / `selectedSemester` signals; switching the selector does not reload data in any of these views. Every view that depends on the selection must add a `watch` on both values and re-run its load function.
- 🐞 `[P3]` Dead scaffold Rust command `greet()` in `src-tauri/src/main.rs` — can be removed
- 🐞 `[P2]` **Drop `Z_3SEMESTERS`** — the app now owns the DB (see ARCHITECTURE §2/§2.3). (1) Add the migration runner if not present; (2) grep gateways/query libs for `Z_3SEMESTERS` and remove any reads/writes; (3) `DROP TABLE Z_3SEMESTERS` in a forward migration; (4) update ARCHITECTURE §2.2. Groups remain school-year-scoped via `Z_3YEARS`.
- ✅ `[P1]` **Migration runner** — ordered, forward-only SQL scripts applied on startup, tracked by `schema_version` (see ARCHITECTURE §2.3); prerequisite for the `Z_3SEMESTERS` drop and `ZCOURSE.ZLEVEL`/`ZORDINAL` additions.
- ✅ `[P2]` No user-facing error handling: DB failures are silently swallowed; no toast/dialog on error
- ✅ `[P2]` No delete-confirmation dialogs anywhere (destructive actions fire immediately)

---

## 2. Management

### 2.1 School Years & Semesters (`SchoolYearGateway`, `SchoolYearStore`, `SchoolYearManagement`)

- ✅ Load all school years with their two semesters
- ✅ Create school year + two semesters (Core Data timestamps, cross-field date validation)
- ✅ Edit school year / semester dates
- ✅ Format / display school year label
- ✅ **Delete school year** — `deleteSchoolYear()` cascade-deletes: ZGRADE → ZPERFORMANCE → Z_1STUDENTS → ZCOURSE → Z_3YEARS → Z_6YEARS → Z_7YEARS → ZSEMESTER → ZYEAR, all inside a transaction. `removeSchoolYear()` in `SchoolYearStore` still needs to call this.

### 2.2 Subjects (`SubjectGateway`, `SubjectStore`, `SubjectManagement`)

- ✅ Load subjects by school year
- ✅ Load all subjects (for autocomplete)
- ✅ Create subject — `INSERT OR IGNORE` on `ZSUBJECT` (unique index on ZNAME); if inserted use new PK, else SELECT existing PK; check for existing `Z_7YEARS` link and insert only if missing. All inside a transaction.
- ✅ Edit subject name
- ✅ Delete subject — removes `Z_7YEARS` link inside a transaction; deletes `ZSUBJECT` only if no other year link remains

### 2.3 Students (`StudentGateway`, `StudentStore`, `StudentManagement`)

- ✅ Load students by school year
- ✅ Create student — insert `ZSTUDENT` + `Z_6YEARS` link
- ✅ Edit student first/last name
- ✅ Delete student — removes `Z_6YEARS` link; deletes `ZSTUDENT` only if no other year link remains
- ✅ Load a student's groups for a given semester
- ✅ Assign / unassign student to/from a group (via `Z_3STUDENTS`)
- ✅ `[P1]` **Course assignment in StudentManagement** — atomic assign/unassign via InputGroup + AutoComplete, consistent with GroupManagement pattern
- ⬜ `[P3]` **Grade summary in student management** — display an overview of a student's current grades across all their courses (see §4.2)

### 2.4 Groups / Classes (`GroupGateway`, `GroupStore`, `GroupManagement`)

- ✅ Load groups by school year (ordered by `ZSORTINGNAME`)
- ✅ Create group — insert `ZGROUP` (computes zero-padded `ZSORTINGNAME`) + `Z_3YEARS` link
- ✅ Edit group name and type (Sek I / Sek II)
- ✅ Load students belonging to a group
- ✅ Assign / unassign student to/from group (`Z_3STUDENTS`)
- ✅ Delete group — cascade: `Z_3STUDENTS`, `Z_3YEARS`, grades, performances, courses for that group in the year, then `ZGROUP`
- ✅ `GroupGateway.deleteGroupInSchoolYear` invalid SQL fixed (rewrote invalid `DELETE … INNER JOIN` as subquery-based deletes)
- ⬜ `[P2]` **Cascade unassign** (`GroupGateway.ts:109` TODO): when a student is unassigned from a group, cascade to removing them from all courses of that group (+ their ZGRADE rows). See REQUIREMENTS §3.

### 2.5 Courses (`CourseGateway`, `CourseStore`, `CourseManagement`)

- ✅ Load courses by school year + semester (with group and subject names)
- ✅ Load students enrolled in a course
- ✅ Load available groups for a school year (for course creation)
- ✅ Load available subjects for a school year (for course creation)
- ✅ Create course — inserts `ZCOURSE` via `nextPrimaryKey("Course")`, inside a transaction
- ✅ Update course — updates `ZGROUP`, `ZSUBJECT`, `ZDAYS`, increments `Z_OPT`
- ✅ Delete course — cascade: ZGRADE (subquery via ZPERFORMANCE) → ZPERFORMANCE → Z_1STUDENTS → ZCOURSE, inside a transaction
- ✅ Assign student to course — inserts `Z_1STUDENTS` + blank `ZGRADE` rows for every existing performance, inside a transaction
- ✅ Unassign student from course — deletes student's `ZGRADE` rows for the course's performances, then removes `Z_1STUDENTS` link, inside a transaction
- ✅ `[P1]` **Create default performances on course creation** — after inserting `ZCOURSE`, call the shared sub-procedure to insert default performance rows and empty grades for all enrolled students (see REQUIREMENTS §4 and §5)

### 2.6 Course level (GK/LK) — Sek II

- ❓ `[P3]` **`ZORDINAL` assignment**: free integer the teacher sets vs. auto `max+1` per (year, subject, level). Decision pending.
- ⬜ `[P2]` **Add `ZCOURSE.ZLEVEL`** (`0=n/a, 1=GK, 2=LK`) and **`ZCOURSE.ZORDINAL`** (parallel-course number) via migration (ARCHITECTURE §2.3).
- ⬜ `[P2]` Extend `CourseGateway` create/update to read/write `ZLEVEL` + `ZORDINAL`.
- ⬜ `[P2]` `CourseManagement`: when the selected group's `ZTYPE = 2` (Sek II), show a GK/LK selector + ordinal input; otherwise hide (defaults to `0`/null).
- ⬜ `[P2]` Course display-name helper: `8b Englisch` (Sek I) vs `GK 1 Geschichte` (Sek II). Reuse everywhere courses are listed (Course/Evaluation/Student views).
- ⬜ `[P3]` UI soft-uniqueness check on (year, subject, level, ordinal).

---

## 3. Evaluation

### 3.1 Course / Group Tree & Navigation

- ✅ Load tree: groups → courses for selected school year + semester
- ✅ Select group → show all students of that group (read-only, no grade columns)
- ✅ Select course → load students + performances for that course
- ✅ Auto-expand all groups on load
- ✅ `[P1]` **Reload on school-year / semester change** — `onMounted` loads once; switching the global selector does not reload the tree or clear the current selection. Add a `watch` on `selectedSchoolYear` / `selectedSemester` to call `loadTreeItems` and reset selected node/students/performances.

### 3.2 Grade Table (`EvaluationTable`)

- ✅ Virtual-scrolled editable DataTable
- ✅ Color-coded columns by performance type (oral = sky, special = green, test = red)
- ✅ Per-type input validation: oral grades (`++/+/0/-/--/f`), numeric grades (0–15)
- ⬜ `[P2]` **Absent marker for numeric grades**: add an `f` (or equivalent) value for types 3 and 6 that marks a student as absent; excluded from weighted-average computation like oral `f`
- ❓ `[P2]` **Absent marker value**: decide what value to store for numeric absent — `f` as string (ZVALUE is already text for oral), `-1`, or another sentinel
- ✅ Column selection (click header → emits `column-selected`)
- ✅ Grade-change event propagation

### 3.3 Add / Edit Performances

- ✅ Dialog to create a new oral / special / written performance (title, type, date)
- ✅ Weight auto-distribution on creation (for special/written: equal redistribution among existing performances of the same type)
- ✅ Blank `ZGRADE` rows inserted for every student in the course on performance creation
- ✅ Edit performance title (via same dialog when a column is selected)
- ⬜ `[P2]` **Delete performance**: on deletion, recompute the corresponding summary grade. For special/written: prompt to redistribute weights among remaining performances (must sum to 1). Oral needs no weight handling.

### 3.4 Grade Auto-Calculation

- ✅ **Oral suggestion** (type 1): after each oral-grade entry (type 0), re-compute the frequency-weighted average across all oral grades for that student and update the suggestion performance automatically
- ✅ **Special overall grade** (type 4): updated from special performance grades (type 3)
- ✅ **Written overall grade** (type 7): updated from written/test performance grades (type 6)
- ✅ `[P1]` **Oral overall column** (type 2): editable numeric (0–15) column; teacher enters a grade informed by the symbolic suggestion (type 1). Must be included in default performance creation.
- ✅ `[P1]` **AT overall grade** (type 5): weighted combination of oral overall (type 2) and special overall (type 4) using oral/special weights
- ✅ `[P1]` **Final overall grade** (type 8): weighted combination of AT overall (type 5) and written overall (type 7) using AT/written weights
- ✅ `[P1]` **Review auto-calc event chain**: verify that editing type 2 triggers type 5 recomputation, and that type 5/type 7 changes trigger type 8 recomputation. Current event-based approach via child component may not bubble correctly through multiple levels.

### 3.5 Grade Weights (`GradeWeightsView`)

- ✅ Display special, written, and general-part performances with their current weights
- ✅ Sliders / number inputs that keep paired weights summing to 1
- ✅ Emit `update-performances` to parent which persists via `updatePerformance`
- ✅ `[P1]` **Save button has no `@click` handler** in the special performances panel (`GradeWeightsView.vue:127–134`) — button is dead
- ✅ `[P1]` **Save button has no `@click` handler** in the written performances panel (`GradeWeightsView.vue:172–179`) — button is dead
- ✅ `[P2]` **Undo buttons** in both panels likewise have no `@click` handlers
- ✅ `[P3]` `update-performances` (bulk) emit is declared in the component's `defineEmits` but never called — either wire it or remove it
- ✅ `[P1]` Implement save action: collect all modified weights for the panel's performances and emit `update-performances`
- ✅ `[P2]` Implement undo action: revert local weight values to the last-persisted state
- ✅ `[P2]` `update-performances` should trigger a recomputation for all students of the corresponding overall grade (type 4 or 7) and propagate to the final overall (type 8). Currently, the parent `EvaluationTable` does not listen for these events and does not recompute the overall grades.

### 3.6 Test Grade Calculator (`TestGradeCalculator`)

- ✅ Total-points input → builds full German 15-point scale table with per-grade point thresholds
- ✅ Achieved-points input → highlights matching row and shows grade summary
- ✅ `[P3]` Typo `lowetPercent` throughout (should be `lowerPercent`) — cosmetic but inconsistent
- ✅ `[P3]` **Rechtschreibung option**: checkbox toggle. When unchecked: input total points + achieved points as today. When checked: input total points → 10% is reserved for Rechtschreibung (e.g. 60 total → 6 Rechtschreibung points, 54 content points). User enters Rechtschreibung points (0–6) and content points (0–54) separately. Final grade is based on combined points (Rechtschreibung + content) looked up against the full total-points scale.

### 3.7 Histogram (`HistogramPanel`)

- ✅ Bottom drawer; opens when a performance column is selected and histogram toggle is active
- ✅ **Oral performances** (type 0): bar chart over `++/+/0/-/--/f` labels; average calculated and shown in dataset label
- 🟡 `[P2]` **Non-oral performances** (numeric 0–15): bar chart shows distribution and grade-band grouping, but **no average is calculated or displayed**. Add: `const average = grades.reduce((a, b) => a + b, 0) / grades.length` and include in the dataset label.

---

## 4. Planned / Not Yet Implemented

### 4.1 School Year Migration

See REQUIREMENTS §2 for the full design.

- ⬜ `[P2]` After school year creation, detect whether a previous school year exists
- ⬜ `[P2]` Prompt the user to migrate base structure from the previous year
- ⬜ `[P2]` Step 1 UI: group selection with rename inputs and per-group student adjustment
- ⬜ `[P2]` Step 2 UI: course migration preview applying new group names and adjusted student lists
- ⬜ `[P2]` Implement `MigrationGateway` (or extend `SchoolYearGateway`) with a transaction that: links groups, rebuilds student memberships, links subjects, and creates new `ZCOURSE` rows — without copying performances or grades

### 4.2 Student Grade Summary

- ⬜ `[P3]` Add a grade summary panel to `StudentManagement` (or a separate route) showing all courses for the current semester, with performance titles, entered grade values, and computed overall grades
- ⬜ `[P3]` Read-only; editing stays in the Evaluation view

### 4.3 Timetable View (Course Days)

- ⬜ `[P3]` `ZCOURSE.ZDAYS` stores a serialized schedule; the field is read but never written or displayed
- ⬜ `[P3]` Define and document the `ZDAYS` serialization format (blob / JSON?)
- ⬜ `[P3]` Add a UI to set course days in `CourseManagement` (e.g. a weekday multi-select)
- ⬜ `[P3]` Implement a timetable view (new route `/timetable`) rendering a weekly grid of courses for the selected year + semester

---

## 5. Configuration

Currently `ConfigurationView.vue` renders only `<p>Konfigurieren</p>`.

- ⬜ `[P2]` Replace stub with a real settings layout
- ⬜ `[P2]` **Name rendering order**: "Nachname, Vorname" vs "Vorname Nachname"; persist in `KeyValueStore`; apply everywhere students are listed
- ⬜ `[P2]` **Dark mode setting**: surface the dark mode toggle here (currently only in the toolbar avatar popover)
- ⬜ `[P3]` **Default grade scale**: option to set the default grading system if other scales are ever added
- ⬜ `[P2]` **Default weights per group type** *(extend to `(group type, course level)` once `ZCOURSE.ZLEVEL` exists — see REQUIREMENTS §5.8)*: user-configurable Sek I / Sek II (and later GK / LK) weight defaults applied on course creation (see REQUIREMENTS §5.5)
- ⬜ `[P3]` **DB file path / backup**: show the active SQLite file location and allow a manual backup copy
