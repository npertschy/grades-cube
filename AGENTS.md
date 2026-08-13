# Agents Guide

This document orients any AI coding agent (or human contributor) working on the `grades-cube` project. It explains how the project is organized, where to find authoritative information, and how to approach changes.

## Key Documents

Before making any changes, review the following files, which together define the source of truth for this project:

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** — Describes the system's architecture: components, data flow, technology stack, and design decisions. Consult this to understand how new code should fit into the existing structure.
- **[REQUIREMENTS.md](./REQUIREMENTS.md)** — Captures functional and non-functional requirements the project must satisfy. Use this to validate that changes align with intended behavior and constraints.
- **[TASKS.md](./TASKS.md)** — Tracks the current backlog, in-progress work, and completed tasks. Check this before starting work to avoid duplicating effort, and update it as tasks progress.

## Working Agreement

1. **Read first.** Review `ARCHITECTURE.md` and `REQUIREMENTS.md` before implementing a feature or fix.
2. **Track work.** Add, update, or check off items in `TASKS.md` as you make progress.
3. **Stay consistent.** Any architectural changes should be reflected back into `ARCHITECTURE.md`.
4. **Validate against requirements.** Ensure new features or fixes satisfy the constraints in `REQUIREMENTS.md`; update it if requirements evolve.
5. **Keep documentation in sync.** Documentation updates should accompany code changes in the same set of edits when relevant.

## Suggested Workflow

1. Check `TASKS.md` for the next item to work on.
2. Review relevant sections of `ARCHITECTURE.md` and `REQUIREMENTS.md`.
3. Implement the change.
4. Update `TASKS.md` to reflect progress.
5. Update `ARCHITECTURE.md` or `REQUIREMENTS.md` if the change affects design or scope.

## Skills and Tools

Use the following skills when available:
- vue-best-practices for any vue related task
- primevue for any UI component work
- SQLite Database expert when working on database schema or queries
- vitest when writing unit tests
