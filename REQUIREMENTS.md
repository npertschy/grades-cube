# Notenwürfel — Requirements

## 1. App Concept

Notenwürfel is a desktop gradebook app for teachers. All data is organized around **school years** (`ZYEAR`). Every entity — student, group, subject, course — must belong to a school year. Starting from a blank database, the user creates an initial school year and the corresponding base entities before any evaluation work can begin.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the stack, database schema, and gateway layer details.

---

## 2. School Year Lifecycle & Migration

### 2.1 First-time setup

Starting from a blank database, the user creates the first school year and then builds the initial entity set: groups, students, subjects, and courses.

### 2.2 Advancing to a new school year

When advancing to a new school year, the app guides the user through a two-step migration. The migration is group-centric and non-destructive — previous year data is never modified.

**Step 1 — Migrate groups and students**

1. The user selects which groups to migrate.
2. For each selected group, the user specifies the new name (e.g. `5a → 6a`).
3. The user can add or deselect individual students per group.

**Step 2 — Migrate courses**

Courses belonging to the selected groups are migrated to the new school year, applying the updated group names and the adjusted student lists from step 1.

**What is copied to the new year**

| Entity | Action |
|---|---|
| Selected groups | New `Z_3YEARS` links; `ZGROUP` rows reused (not duplicated) |
| Students per group | New `Z_6YEARS` links; `Z_3STUDENTS` memberships rebuilt from the adjusted list |
| Subjects (referenced by migrated courses) | New `Z_7YEARS` links |
| Courses | New `ZCOURSE` rows for the new year/semester; `Z_1STUDENTS` memberships rebuilt from the adjusted student lists |
| `ZPERFORMANCE` / `ZGRADE` | **Not copied** — they belong to the old year |

---

## 4. Course Creation Invariant

Creating a course must always trigger:

1. **Create default performances** — the fixed set of overall/summary performance rows for the course (see §5).
2. **Create empty grades** — one `ZGRADE` row (value = null) for every enrolled student × every performance.

This sub-procedure must be extracted into a dedicated reusable function because the same logic applies in two other situations:

| Trigger | Required action |
|---|---|
| New performance added to an existing course | Create empty `ZGRADE` rows for all currently enrolled students |
| Student assigned to an existing course | Create empty `ZGRADE` rows for all existing performances of the course |

---

## 5. Default Performances & Grade Weights

### 5.1 Default performance set

When a course is created, the following non-editable summary performances are generated automatically:

| ZTYPE | Role |
|---|---|
| 1 | Oral recommendation (computed from oral grades, type 0) |
| 4 | Special overall (computed from special grades, type 3) |
| 6 | AT overall / general-part combined |
| 7 | Written overall (computed from written/test grades, type 6) |

These rows have `ZEDITABLE = 0` and are updated automatically by the grade auto-calculation logic.

### 5.2 Initial weight configuration

The initial weights depend on the group type (`ZGROUP.ZTYPE`):

| Weight | Sek I (ZTYPE = 1) | Sek II (ZTYPE = 2) |
|---|---|---|
| Oral (within AT) | 70 | 70 |
| Special (within AT) | 30 | 30 |
| AT (overall) | 70 | 50 |
| Written (overall) | 30 | 50 |

**Summation invariant** — both pairs must always sum to 100:
- oral weight + special weight = 100
- AT weight + written weight = 100

This invariant applies at course creation and whenever the user adjusts weights in `GradeWeightsView`.

### 5.3 Future configurability

Default weights per group type should be user-configurable in the Configuration view. Individual courses can always override weights in `GradeWeightsView` regardless of the default.
