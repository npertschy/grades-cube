# School Year Migration — Implementation Plan

Companion to [TASKS.md](./TASKS.md) §4.1, [REQUIREMENTS.md](./REQUIREMENTS.md) §2, and [ARCHITECTURE.md](./ARCHITECTURE.md). This document is the detailed, decision-locked plan for implementing school-year migration. Update TASKS.md checkboxes as each item completes.

## Decisions locked in

- Migrated courses get fresh default performances (`insertDefaultPerformancesWithGrades`) for the adjusted student list — old grades/performances are never copied.
- The migration wizard opens automatically right after a new school year is created, if a prior year exists.
- Step 1 preselects all current group members (opt-out); user can also add new students via AutoComplete.
- Subjects are migrated as-is (no renaming step) — only groups can be renamed during migration.
- Courses are migrated to **both** semesters of the target year, mapped by matching `ZSEMESTER.ZTYPEID` (old semester 1 → new semester 1, old semester 2 → new semester 2).
- `ZORDINAL` (Sek II parallel-course number) is **auto-assigned** as `max(ZORDINAL) + 1` scoped to `(year, subject, level)` — never manually entered, and **never recomputed/changed once assigned**, including on course edit and during migration (migrated courses get a *fresh* auto-assigned ordinal for the target year, not a copy of the source ordinal).
- `Z_3SEMESTERS` drop (TASKS §1 tech-debt item) is explicitly **out of scope** for this effort.

---

## Phase 0 — Prerequisite: Course level (GK/LK) + auto ordinal (TASKS §2.6)

Must be completed before Phase 1, since migrated Sek II courses depend on `ZLEVEL`/`ZORDINAL` and `getNextOrdinal`.

1. **Migration v5** (`src-tauri/src/main.rs`, new `Migration { version: 5, ... }` entry):
   - `ALTER TABLE ZCOURSE ADD COLUMN ZLEVEL INTEGER DEFAULT 0;`
   - `ALTER TABLE ZCOURSE ADD COLUMN ZORDINAL INTEGER;`
2. **Types**: `CourseEntity.ts` / `Course.ts` — add `level: number | undefined`, `ordinal: number | undefined`.
3. **`CourseGateway.ts`**:
   - Add `getNextOrdinal(schoolYear, subject, level): Promise<number>`:
     ```sql
     SELECT COALESCE(MAX(ZORDINAL), 0) + 1 FROM ZCOURSE
     WHERE ZYEAR = $1 AND ZSUBJECT = $2 AND ZLEVEL = $3
     ```
   - `createCourse`: when `group.type === 2` (Sek II), compute ordinal via `getNextOrdinal` inside the transaction and insert `ZLEVEL`/`ZORDINAL`. Sek I courses get `ZLEVEL = 0`, `ZORDINAL = null`.
   - `updateCourse`: persist `ZLEVEL` if changed. **Never** touch or recompute `ZORDINAL` on update — immutable once assigned, even if subject/level changes later (known limitation, intentionally not auto-fixed).
   - `loadCoursesBySchoolYearAndSemester`: select and map `ZLEVEL`/`ZORDINAL`.
4. **Display-name helper** — new `src/components/courses/CourseDisplayName.ts`:
   - `formatCourseName(course)` → `"8b Englisch"` (Sek I) vs `"GK 1 Geschichte"` / `"LK 2 Chemie"` (Sek II, using level + ordinal + subject).
   - Wire into `CourseManagement`, evaluation tree/table, `StudentManagement` wherever course names are currently rendered ad hoc.
5. **`CourseManagement.vue`**: when the selected group's `ZTYPE === 2`, show a GK/LK selector only (no ordinal input field — auto-assigned, surfaced read-only via the display-name helper after save). Hidden entirely for Sek I (defaults `level = 0`, `ordinal = null`).
6. **Tests**:
   - Extend `CourseGateway.spec.ts`: ordinal auto-increment scoped correctly per `(year, subject, level)`, immutability on update, Sek I defaults.
   - Add `CourseDisplayName.spec.ts`.
   - Update `CourseManagement.spec.ts` for conditional GK/LK UI.
7. **Docs**: check off TASKS §2.6 items; verify ARCHITECTURE §2.2 wording matches final behavior (ordinal auto-assigned & immutable).

---

## Phase 1 — School Year Migration (TASKS §4.1)

### 1. Domain types

`src/components/schoolYears/Migration.ts`:

```ts
type MigrationGroupSelection = {
  group: Group;
  newName: string;
  selected: boolean;
  students: { student: Student; included: boolean }[];
};

type MigrationCoursePreview = {
  course: Course; // old course
  newGroupName: string;
  targetSemesterType: 1 | 2;
  students: Student[]; // adjusted list
};

type SchoolYearMigrationPlan = {
  sourceYear: SchoolYear;
  targetYear: SchoolYear;
  groups: MigrationGroupSelection[];
};
```

### 2. `MigrationGateway.ts`

- `loadMigratableGroups(sourceYear): Promise<Group[]>` — groups linked to `sourceYear` via `Z_3YEARS`, plus their current members (reuse `loadStudentsByGroup`).
- `loadMigratableCourses(sourceYear, groupIds): Promise<Course[]>` — courses for the selected groups across **both** semesters of the source year, joined with `ZSEMESTER.ZTYPEID` to know the target-semester mapping.
- `migrateSchoolYear(plan: SchoolYearMigrationPlan): Promise<void>` — single `withTransaction`:
  1. For each selected group: `INSERT OR IGNORE INTO Z_3YEARS` (group ↔ target year); if `newName` differs from `group.name`, update via the same logic as `updateGroup` (name + recomputed `ZSORTINGNAME`).
  2. For each included student: `INSERT OR IGNORE INTO Z_6YEARS` (student ↔ target year) and `INSERT OR IGNORE INTO Z_3STUDENTS` (student ↔ group) — rebuilt fresh from the adjusted list, not copied from the old `Z_3STUDENTS` rows.
  3. Collect distinct subjects used by courses being migrated; for each, `INSERT OR IGNORE INTO Z_7YEARS` linking subject → target year (reuse/extract the link-atom from `SubjectGateway.createSubjectForSchoolYear` if practical). Subjects are migrated as-is — no renaming.
  4. For each old course (both semesters) belonging to a selected group:
     - Create a new `ZCOURSE` row (`nextPrimaryKey`) in the **matching target semester** (`ZTYPEID` 1 → target `firstSemester`, 2 → target `secondSemester`), carrying over `ZSUBJECT`, `ZDAYS`, `ZLEVEL`.
     - If `ZLEVEL === 2` (Sek II), call `getNextOrdinal(targetYear, subject, level)` for a **fresh** ordinal — never copy the source course's `ZORDINAL`.
     - Insert `Z_1STUDENTS` only for the adjusted (included) students of that course's group.
     - Call `insertDefaultPerformancesWithGrades(newCourseId, group.type, includedStudents)`.
  5. No writes ever touch the old course's `ZPERFORMANCE`/`ZGRADE` rows — source year remains fully intact (non-destructive per REQUIREMENTS §2.2).

### 3. `MigrationStore.ts`

`useMigration()` composable:

- `startMigration(sourceYear, targetYear)`: loads groups + students via the gateway, builds initial `MigrationGroupSelection[]` with `selected = false`, `students[].included = true` (preselect-all-opt-out), `newName = group.name` (editable placeholder).
- `toggleGroupSelected(group)`, `toggleStudentIncluded(group, student)`, `renameGroup(group, newName)`, `addStudentToGroup(group, student)` (AutoComplete-driven, for new enrollees not previously in the group).
- `buildCoursePreviews()`: derives Step 2 preview list from selected groups + their old courses (both semesters) + adjusted student lists.
- `confirmMigration()`: wraps `migrateSchoolYear(plan)` in `runSafeWithThrow` (existing `ErrorHandling` composable pattern); on success, closes the wizard and triggers reloads (school years, groups, students, subjects, courses as applicable).
- `cancelMigration()`: discards all in-memory wizard state — no persistence of intermediate state (REQUIREMENTS §2.3).

### 4. UI

**`src/components/schoolYears/SchoolYearMigrationDialog.vue`** — modal PrimeVue `Dialog` wrapping a `Stepper` (`StepList`/`StepPanels`, per the `primevue` skill conventions, auto-imported, Aura theme):

- **Step 1 "Gruppen & Schüler"**: list of source-year groups with a checkbox to select for migration; when selected, shows an `InputText` for the new name and an expandable per-group student list with checkboxes (preselected per opt-out default), plus an AutoComplete + add button to include a student not previously in the group (reuse `EntityList`/InputGroup patterns from `GroupManagement`/`StudentManagement`).
- **Step 2 "Kurse"**: read-only preview (`DataTable`), grouped by target semester, showing derived courses with the new group name applied and the adjusted student list/count. "Zurück" / "Migration abschließen" actions.
- Footer: "Abbrechen" always available, discards state and closes without writing anything.

**`SchoolYearManagement.vue`** changes:

- After `addSchoolYear` succeeds in `handleSave`, check whether a previous school year exists (besides the new one); if so, prompt (confirm dialog) to open `SchoolYearMigrationDialog` with `sourceYear` = most recent prior year, `targetYear` = the newly created year.
- Add `<school-year-migration-dialog v-model:visible="migrationDialogVisible" :source-year="..." :target-year="..." @migrated="loadAllSchoolYears" />`.

### 5. Tests

- `MigrationGateway.spec.ts`: correct INSERT/link statements per step, transaction usage, subject dedup, semester mapping (1→1, 2→2), fresh ordinal assignment for Sek II (never copied), no writes to source `ZPERFORMANCE`/`ZGRADE`, correct new performances/grades created via `insertDefaultPerformancesWithGrades` for the adjusted student list only.
- `MigrationStore.spec.ts`: preselect-all-opt-out logic, rename propagation into course preview, add/remove student adjusts course preview, both-semesters preview split.
- `SchoolYearMigrationDialog.spec.ts`: step navigation, abort discards state, confirm calls store action and closes dialog.
- Update `SchoolYearManagement.spec.ts` to cover the new post-create prompt/dialog trigger.

### 6. Docs

- Update `TASKS.md` §4.1 checkboxes to ✅ as each item completes.
- Reflect any new shared query-library atoms (e.g., subject-link-to-year atom shared with `SubjectGateway`) in `ARCHITECTURE.md` §3.2.
</content>
