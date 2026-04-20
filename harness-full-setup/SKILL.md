---
name: harness-full-setup
description: |
  Use when a user wants to set up the complete Harness Engineering pipeline for a project in one go.
  Orchestrates harness-step1, harness-step2, and harness-step3 in sequence, pausing between each
  step for user review and confirmation. Applies when the user says "set up harness for my project",
  "run the full harness pipeline", "bootstrap agent support end-to-end", or "initialize everything
  for AI agent development".
---

# Harness Full Setup: End-to-End Project Harness Pipeline

## Overview

Single entry point that orchestrates the complete Harness Engineering pipeline:

1. **Step 1** — Create AGENTS.md and docs/ skeleton
2. **Step 2** — Deep-read code and populate docs/ with substantive content
3. **Step 3** — Establish cross-session state management (init.sh, tasks.json, progress.md)

Each step runs to completion, then pauses for user review before proceeding to the next.

**Core principle**: The pipeline is a gate-checked sequence, not a batch job. The user reviews and
approves after each step. If a step fails, the pipeline stops and reports — it does not skip ahead.

**Subskills**: The three step skills are bundled in this directory:
- `harness-step1-create-agent-md/SKILL.md`
- `harness-step2-fill-docs/SKILL.md`
- `harness-step3-session-management/SKILL.md`

Read each subskill's SKILL.md when executing that phase. Do NOT guess the instructions — load and follow the file.

---

## Pre-Flight Check

Before invoking any step, verify the agent is in a valid project root:

```bash
# Confirm we're in a project directory (at least one of these should exist)
ls package.json 2>/dev/null || ls pyproject.toml 2>/dev/null || \
  ls go.mod 2>/dev/null || ls Cargo.toml 2>/dev/null || \
  ls README.md 2>/dev/null || ls src/ 2>/dev/null

# If none exist, STOP and ask the user to confirm the working directory
```

If no project indicators are found:
- **STOP the pipeline**
- Report: "This directory does not appear to be a project root. No package manifest, README, or src/ directory found."
- Ask the user to confirm the correct working directory before proceeding

---

## Pipeline Execution

### Phase 1: Create AGENTS.md & docs/ Skeleton

**Read and follow**: `harness-step1-create-agent-md/SKILL.md` (bundled subskill)

Follow the step1 skill instructions completely. When finished, present a summary:

```
Step 1 Complete:
- Files created: [list]
- Content inferred from scan: [list items that may need verification]
- Items marked TBD: [list items requiring human input]
```

**Gate check — ask the user:**

> Step 1 is complete. Please review the files created above.
> - Are there any TBD items you'd like to fill in now?
> - Do you want to adjust anything before I proceed to Step 2 (deep code analysis and doc population)?
>
> Say **"continue"** to proceed, or tell me what to change.

**Wait for user response.** Do NOT proceed to Step 2 until the user explicitly confirms.

If the user provides corrections or fills in TBD items, apply them before continuing.

---

### Phase 2: Populate docs/ Knowledge Base

**Read and follow**: `harness-step2-fill-docs/SKILL.md` (bundled subskill)

Follow the step2 skill instructions completely. When finished, present a summary:

```
Step 2 Complete:
- ARCHITECTURE.md: [brief description of what was documented]
- CONVENTIONS.md: [brief description]
- TECH_DECISIONS.md: [brief description]
- QUALITY.md: [brief description]
- tech-debt-tracker.md: [N items found]
- Items marked TBD: [aggregated list across all files]
```

**Gate check — ask the user:**

> Step 2 is complete. The docs/ files now contain substantive content derived from your codebase.
> - Review the TBD items listed above — would you like to fill any in now?
> - Does the architecture description and dependency rules look accurate?
>
> Say **"continue"** to proceed to Step 3 (session state management), or tell me what to change.

**Wait for user response.** Do NOT proceed to Step 3 until the user explicitly confirms.

---

### Phase 3: Establish Session State Management

**Read and follow**: `harness-step3-session-management/SKILL.md` (bundled subskill)

Follow the step3 skill instructions completely. When finished, present a summary:

```
Step 3 Complete:
- init.sh: [what checks it performs]
- tasks.json: [N] tasks, [N] requiring Evaluator review
- progress.md: initialized
- AGENTS.md: updated with task management rules
```

---

## Final Summary

After all three phases complete, present a consolidated report:

```
=== Harness Engineering Setup Complete ===

Files created:
  AGENTS.md                           <- Agent entry point / table of contents
  docs/ARCHITECTURE.md                <- Module layout and dependency rules
  docs/CONVENTIONS.md                 <- Naming and code style patterns
  docs/TECH_DECISIONS.md              <- Technology choice rationale
  docs/QUALITY.md                     <- Definition of Done, review checklist
  docs/exec-plans/backlog.md          <- Planned features (not yet scheduled)
  docs/exec-plans/tech-debt-tracker.md <- Known technical debt
  init.sh                             <- Environment health check script
  tasks.json                          <- Structured task queue
  progress.md                         <- Session progress log

Remaining TBD items requiring your input:
  [Aggregated list of all TBD items across all files]

How to use:
  At the start of each AI agent session, the agent reads AGENTS.md, runs init.sh,
  checks tasks.json and progress.md, and reviews git log. No more explaining
  "where we left off" each time.

Next steps:
  - Fill in any remaining TBD items
  - Review tasks.json and adjust the task list to match your priorities
  - Start developing with your AI agent
  - If the agent repeatedly violates conventions: run harness-step4-linter
  - If agent self-evaluation is unreliable: run harness-step5-evaluator
```

---

## Error Handling

If any step encounters a critical failure:

1. **STOP the pipeline immediately** — do not proceed to the next step
2. **Report clearly**: which step failed, what went wrong, and what the user can do about it
3. **Offer options**:
   - Fix the issue and retry the current step
   - Abort the pipeline (partial results remain in place)

Examples of critical failures:
- Pre-flight check finds no project indicators
- Step 1 cannot detect any tech stack or entry points
- Step 2 finds no source code to analyze
- Step 3's init.sh fails validation when run

Non-critical issues (e.g., a few TBD items, minor uncertainties) are **not** reasons to stop — these are reported at the gate check and the user decides.

---

## Common Mistakes

| Mistake | Correction |
|---------|------------|
| Skipping the pre-flight check | Always verify project root before starting |
| Proceeding without user confirmation at gate checks | Each gate is mandatory — wait for explicit "continue" |
| Running all steps as a batch | This is a gated pipeline, not a batch script |
| Duplicating sub-skill logic in this orchestrator | Read the bundled subskill SKILL.md files — do not reimplement their logic |
| Ignoring TBD items | Aggregate and present them — the user must be aware of gaps |
