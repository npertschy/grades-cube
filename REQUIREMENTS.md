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

| Entity                                    | Action                                                                                                          |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Selected groups                           | New `Z_3YEARS` links; `ZGROUP` rows reused (not duplicated)                                                     |
| Students per group                        | New `Z_6YEARS` links; `Z_3STUDENTS` memberships rebuilt from the adjusted list                                  |
| Subjects (referenced by migrated courses) | New `Z_7YEARS` links                                                                                            |
| Courses                                   | New `ZCOURSE` rows for the new year/semester; `Z_1STUDENTS` memberships rebuilt from the adjusted student lists |
| `ZPERFORMANCE` / `ZGRADE`                 | **Not copied** — they belong to the old year                                                                    |

### 2.3 Migration UI

The migration is a **modal stepper** overlaying the School Year Management view.

- The stepper manages its own ephemeral state (selected groups, renames, student adjustments).
- The user can abort at any time; all in-progress migration state is discarded.
- On final confirmation, one serialized migration operation writes all links and new rows without interleaving with other app writes (see ARCHITECTURE §3.4 for the plugin transaction limitation).
- No persistence of intermediate migration state — if the user navigates away, the wizard resets.

---

## 3. Group–Course Membership Invariant

Group membership is a prerequisite for course enrollment. A student must belong to the group a course is tied to in order to be enrolled in that course.

**Group vs. course usage differs by phase (`ZGROUP.ZTYPE`):**

- **Primary / Sek I (`ZTYPE = 1`):** students are arranged in a class-like group (e.g. `8b`) that fans out 1:N to many shared courses (`8b Englisch`, `8b Sport`). Most students of the group attend most courses.
- **Sek II (`ZTYPE = 2`):** the group acts as a school-year cohort (e.g. `Jahrgang 11`). Students choose courses individually, so group↔course membership is effectively 1:1 via `Z_1STUDENTS`. Courses carry a level (`ZCOURSE.ZLEVEL`: GK/LK) and a parallel-course number (`ZCOURSE.ZORDINAL`), producing labels like `GK 1 Geschichte` or `LK 2 Chemie`.

Both cases are handled by the existing `Z_3STUDENTS` (students↔groups) and `Z_1STUDENTS` (students↔courses) M:N relationships; no structural change to Group/Course is required.

**Consequences:**

- Assigning a student to a group cascades to assigning them to all courses of that group (including creating blank ZGRADE rows for each course's existing performances).
- Removing a student from a group cascades to removing them from all courses of that group (including their ZGRADE rows for those courses).
- Assigning/removing a student to/from a course does NOT affect their group membership.
- During school year migration, a student deselected from a group is implicitly excluded from all courses migrated for that group.

---

## 4. Course Creation Invariant

Creating a course must always trigger:

1. **Create default performances** — the fixed set of overall/summary performance rows for the course (see §5).
2. **Create empty grades** — one `ZGRADE` row (value = null) for every enrolled student × every performance.

This sub-procedure must be extracted into a dedicated reusable function because the same logic applies in two other situations:

| Trigger                                     | Required action                                                        |
| ------------------------------------------- | ---------------------------------------------------------------------- |
| New performance added to an existing course | Create empty `ZGRADE` rows for all currently enrolled students         |
| Student assigned to an existing course      | Create empty `ZGRADE` rows for all existing performances of the course |

---

## 5. Default Performances & Grade Weights

### 5.1 Default performance set

When a course is created, the following default performances are generated automatically (the full type map is listed here for reference):

| ZTYPE | Role                                                                   | Value domain               | Editable |
| ----- | ---------------------------------------------------------------------- | -------------------------- | -------- |
| 0     | Oral grade (individual)                                                | Symbolic (`++/+/0/-/--/f`) | Yes      |
| 1     | Oral suggestion (frequency-weighted average of type 0 grades)          | Symbolic (`++/+/0/-/--/f`) | No       |
| 2     | Oral overall — teacher's numeric oral grade informed by the suggestion | Numeric (0–15)             | **Yes**  |
| 3     | Special grade (individual)                                             | Numeric (0–15)             | Yes      |
| 4     | Special overall (computed from type 3 grades)                          | Numeric (0–15)             | No       |
| 5     | AT overall (weighted combination of type 2 and type 4)                 | Numeric (0–15)             | No       |
| 6     | Written/test grade (individual)                                        | Numeric (0–15)             | Yes      |
| 7     | Written overall (computed from type 6 grades)                          | Numeric (0–15)             | No       |
| 8     | Final overall (weighted combination of type 5 and type 7)              | Numeric (0–15)             | No       |

Types 0, 2, 3, and 6 are editable (`ZEDITABLE = 1`). All other default performance types have `ZEDITABLE = 0` and are updated automatically by the grade auto-calculation logic.

### 5.2 Overall grade (type 8)

**AT overall (type 5):**

```
AT_overall = floor(type2 × oral_weight + type4 × special_weight)
```

Recomputed whenever type 2 or type 4 changes.

**Final overall (type 8):**

```
final_overall = floor(type5 × AT_weight + type7 × written_weight)
```

Recomputed whenever type 5 or type 7 changes.

**Null propagation — two rules:**

1. **Aggregation summaries (types 1, 4, 7):** Compute from whichever input grades are non-null, renormalizing weights proportionally. Only stay null when ALL inputs are null.
   - Example: 3 special performances with weights 0.6, 0.3, 0.1. If the 0.6 performance's grade is null, type 4 is computed from the other two with renormalized weights: 0.3/(0.3+0.1) = 0.75 and 0.1/(0.3+0.1) = 0.25.
2. **Combination summaries (types 5, 8):** Strict — if either input is null, the result is null. No fallback to partial inputs.

**Oral suggestion formula (type 1):** Symbolic grades are mapped to numeric indices: `['++', '+', '0', '-', '--', 'f']` → `[0, 1, 2, 3, 4, 5]`. Grades with value `f` (absent) are excluded from the computation (treated like null). The suggestion is a simple frequency-based average: `sum(indices of non-null/non-f grades) / count(non-null/non-f grades)`, rounded to nearest index and mapped back to the corresponding symbol. Oral performance weights (`ZWEIGHT` on type 0 rows) are not used in this computation — no redistribution is needed when adding or deleting oral performances.

**Absent marker:** The value `f` (absent) is valid for oral grades (type 0). For numeric grades (types 3 and 6), an equivalent absent marker is needed — excluded from weighted-average computation like `f` for oral.

**Individual performance weight constraint:** Within each manually-weighted type (special type 3, written type 6), all individual performance weights must sum to 1. `ZWEIGHT` is stored as a float.

**Rounding:**

- Symbolic grades (type 1): round to nearest, with 0.5 rounding down/generous (1.5 → 1 = `+`, not 2 = `0`)
- Numeric computed grades (types 4, 5, 7, 8): `floor` (11.5 → 11)

Types 1, 4, 5, 7, and 8 are non-editable default performances (`ZEDITABLE = 0`) created alongside the other defaults on course creation. Default performances cannot be deleted by the user — they exist for the lifetime of the course.

**Weight storage:** The pair weights are stored on `ZPERFORMANCE.ZWEIGHT` of the summary rows:

| Performance type         | ZWEIGHT holds                                         | Pair constraint     |
| ------------------------ | ----------------------------------------------------- | ------------------- |
| Type 2 (oral overall)    | Oral weight within AT (e.g. 0.7)                      | type 2 + type 4 = 1 |
| Type 4 (special overall) | Special weight within AT (e.g. 0.3)                   | type 2 + type 4 = 1 |
| Type 5 (AT overall)      | AT weight in final (e.g. 0.7 Sek I / 0.5 Sek II)      | type 5 + type 7 = 1 |
| Type 7 (written overall) | Written weight in final (e.g. 0.3 Sek I / 0.5 Sek II) | type 5 + type 7 = 1 |

The summation invariant is enforced at the UI level (slider forces the complement). Within the application, the weights are stored as floats in the range [0, 1] on the summary rows.

### 5.3 Column sort order

The grade table sorts performance columns by:

1. **Primary:** `ZTYPE` ascending (all oral columns appear before special, before written, before summaries)
2. **Secondary:** `ZSORTORDER` ascending within the same type

Default performances are created with `ZSORTORDER = 0`. When the user adds a new manual performance, its sort order is `max(ZSORTORDER for that type in the course) + 1`.

### 5.4 Initial weight configuration

The initial weights depend on the group type (`ZGROUP.ZTYPE`):

| Weight              | Sek I (ZTYPE = 1) | Sek II (ZTYPE = 2) |
| ------------------- | ----------------- | ------------------ |
| Oral (within AT)    | 0.7                | 0.7                 |
| Special (within AT) | 0.3                | 0.3                 |
| AT (overall)        | 0.7                | 0.5                 |
| Written (overall)   | 0.3                | 0.5                 |

**Summation invariant** — both pairs must always sum to 1:

- oral weight + special weight = 1
- AT weight + written weight = 1

This invariant applies at course creation and whenever the user adjusts weights in `GradeWeightsView`.

### 5.5 Future configurability

Default weights per group type should be user-configurable in the Configuration view. Individual courses can always override weights in `GradeWeightsView` regardless of the default.

### 5.6 Deleting a manual performance

When a manual performance is deleted:

1. All `ZGRADE` rows for that performance are deleted.
2. The corresponding auto-computed summary (type 1 for oral, type 4 for special, type 7 for written) is recomputed from the remaining performances.
3. For oral performances (type 0): no weight redistribution needed (suggestion uses frequency, not weights).
4. For special/written performances (types 3/6): the user is prompted to redistribute weights among the remaining performances of that type (must still sum to 1).

The recomputation cascades upward through the chain (e.g. deleting a type 0 → recompute type 1 suggestion; deleting a type 3 → recompute type 4 → recompute type 5 → recompute type 8).

### 5.7 Weights on manual performance creation

When the user manually adds a new performance to a course:

- **Oral (type 0):** No weight handling needed — the suggestion is frequency-based, not weight-based. Oral performance weights are irrelevant.
  - **Special (type 3) or written (type 6):** The app must prompt for the weight of that performance. It shows the corresponding table from the GradeWeightsView and allows the user to adjust the weights of the other performances of the same type to maintain the summation invariant (all weights must sum to 1). The app suggests a default weight: if all existing performance weights are equal, apply 1 / #performances. If existing weights are unequal, suggest 0 for the new performance and let the user adjust all weights manually.

### 5.8 Course level (GK/LK) and weights (future)

Sek II courses carry a level (`ZCOURSE.ZLEVEL`: GK/LK). Default weights (§5.4) will eventually be keyed by `(group type, course level)` rather than group type alone, so GK and LK can define different AT/written splits. Until implemented, GK/LK is organizational only and both use the Sek II defaults. Per-course override in `GradeWeightsView` remains available regardless.
