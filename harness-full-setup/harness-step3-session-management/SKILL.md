---
name: harness-step3-session-management
description: |
  Use when the agent loses context between sessions and the user wants persistent state management.
  Applies when the user says "set up task management", "let the agent remember progress",
  "create tasks.json", "maintain state across sessions", "the agent never remembers what it did
  last time", "create a progress file", or "initialize state management".
  
  Prerequisite: harness-step1 and harness-step2 must be complete (AGENTS.md and docs/ knowledge base exist).
---

# Harness Step 3: Cross-Session State Management

## Overview

Create three files that enable any agent to recover full working context within 30 seconds at the start of a new session:

- `init.sh`: Environment initialization script — verifies the project can start correctly
- `tasks.json`: Structured task queue — the agent's authoritative source of work items
- `progress.md`: Human-readable progress log — records key information from each session

**Core principle**: State is transmitted via files, not agent memory. Git log is the primary record; these three files are supplements.

---

## Execution Steps

### Step 1: Scan Project Startup Procedures

Before writing `init.sh`, confirm how the project starts and runs tests:

```bash
# Read package.json scripts (Node.js projects)
cat package.json 2>/dev/null | grep -A 20 '"scripts"'

# Or read Makefile (multi-language projects)
cat Makefile 2>/dev/null | head -40

# Or read pyproject.toml (Python projects)
cat pyproject.toml 2>/dev/null | grep -A 20 '\[tool.poetry.scripts\]'

# Confirm startup commands in existing AGENTS.md
grep -A 5 'start\|dev\|run\|launch' AGENTS.md 2>/dev/null
```

Collect:
- Dev server startup command
- Test command
- Type check / lint commands (if applicable)
- Any prerequisite initialization steps (e.g., database migrations)

---

### Step 2: Create `init.sh`

Purpose: Run at the start of every session to **quickly verify the environment is healthy**. If something is broken, fix it before proceeding.

```bash
#!/bin/bash
# init.sh — Run at the start of every session
# Verifies the development environment is in a working state

set -e  # Stop on any failure

echo "=== Checking environment ==="

# 1. Confirm correct working directory
echo "Working directory: $(pwd)"

# 2. Install dependencies (if node_modules doesn't exist)
# [Adapt to tech stack — the following is an example]
# Node.js:
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# 3. Smoke test: verify the project can start normally
# [Adapt to actual project — goal is the fastest possible basic health check]
# Example: run the fastest available test
# npm run test -- --testPathPattern=smoke 2>/dev/null || echo "WARNING: Smoke test failed — fix before proceeding"

echo "=== Environment check complete — ready to work ==="
echo "Tip: Run 'git log --oneline -10' to review recent work history"
```

**Writing requirements:**
- Populate with actual startup commands discovered during scanning — do not leave example comments
- Smoke test must be fast (< 30 seconds); the goal is to catch environment issues quickly, not run the full test suite
- If the project uses a database, add a step to verify database connectivity
- After writing, actually run the script to confirm it executes without errors: `bash init.sh`

---

### Step 3: Create `tasks.json`

**Schema:**

```json
{
  "project": "[project name]",
  "last_updated": "[today's date, YYYY-MM-DD format]",
  "current_focus": "[the single most important thing right now, one sentence]",
  "tasks": [
    {
      "id": "[module-abbreviation]-[number]",
      "title": "[task title]",
      "description": "[what to do specifically, 1-3 sentences]",
      "status": "pending | in_progress | done | blocked",
      "priority": "high | medium | low",
      "blocked_by": "[reason for blockage, only when status is blocked]",
      "verify": "[how to verify this task is complete]",
      "requires_eval": false
    }
  ]
}
```

**Field specification** (every field must be populated when adding a task — no omissions):

| Field | Required | Description |
|-------|----------|-------------|
| `id` | Yes | Module abbreviation + sequence number, e.g., `auth-01`, `ui-03` — short, readable |
| `title` | Yes | Task title, one sentence |
| `description` | Yes | What to do specifically, 1-3 sentences |
| `status` | Yes | Initial value `pending`; updated by the agent during work |
| `priority` | Yes | `high / medium / low` |
| `blocked_by` | Only when blocked | Reason for blockage |
| `verify` | Yes | How to verify completion — must be an executable step (command or action) |
| `requires_eval` | Yes | Whether independent Evaluator review is needed; default `false` — see criteria below |

**`requires_eval` criteria** (must be evaluated against these rules when adding tasks — never default to `false` without thinking):

Set to `true` if **any** of the following apply:
- This is a new feature (not just a bug fix or config change)
- Involves security, permissions, or data validation logic
- Expected to modify more than 3 files
- Task description includes "refactor" or "architecture change"

Set to `false` only when **all** of the following apply:
- Pure bug fix with a well-defined scope
- Documentation update or comment improvement
- Configuration or environment variable change
- Unit test additions

**How to determine the initial task list:**

Prioritize extraction from these sources:
1. Plan files in `docs/exec-plans/active/` (if any exist)
2. High-priority items in `docs/exec-plans/tech-debt-tracker.md`
3. TODOs or roadmap items mentioned in README
4. Ask the user: "What are the 3-5 tasks you most want to make progress on right now?"

**Writing requirements:**
- The `verify` field must describe an executable step — do not write vague statements like "confirm feature works"
- Task granularity: each task should be completable in 1-2 hours; split anything larger
- Initial state: all tasks start as `pending`; the agent updates status during work

**Prompt the user** (if tasks cannot be inferred from existing documentation):

> I've scanned the project and am ready to create the task list. Please tell me:
> What are the 3-5 tasks you most want to make progress on right now?
> A one-sentence description for each is sufficient.

---

### Step 4: Create `progress.md`

Initial content:

```markdown
# Project Progress Log

> After completing tasks in each session, append a record at the top. Never delete history.
> Format: ## [Date] [Task Name]

---

## [Today's date] Initialize Harness

- Completed harness-step1: Created docs/ skeleton
- Completed harness-step2: Populated knowledge base content
- Completed harness-step3: Established state management
- Initial task count in tasks.json: [N] tasks
- Next session pickup point: Read tasks.json, select the task with priority=high and status=pending
```

---

### Step 4b: Update `AGENTS.md` — Add Task Management Rules

Locate the task completion section in `AGENTS.md` and **replace** it with the following:

```markdown
### When Adding New Tasks:
1. Populate every field in tasks.json — no omissions
2. Evaluate `requires_eval` against the following criteria (never default to false without thinking):
   - New feature / security-related / modifies 3+ files / refactor -> true
   - Pure bug fix / documentation update / config change -> false

### After Completing Each Task:
1. Execute the verification steps described in that task's `verify` field in tasks.json
2. If the task's `requires_eval` is `true`: Fill in `sprint_output.md`, wait for Evaluator approval before marking `done`
   If the task's `requires_eval` is `false`: Mark `done` once verification passes
3. Git commit with format: `type(scope): what was done, what remains (if any)`
4. Append a record at the top of `progress.md`

**Prohibited**: Skipping the verify step and self-declaring a task as complete.
**Prohibited**: Setting `requires_eval` to false without evaluating the criteria.
```

---

### Step 5: Validate End-to-End Integration

After all three files are created, simulate a full session startup flow to verify everything works together:

```bash
# Simulate the agent's new-session startup sequence
echo "=== Simulating new session startup ==="

# 1. Run init.sh
bash init.sh

# 2. Check git log
git log --oneline -10

# 3. Read progress.md (confirm file exists and is readable)
head -20 progress.md

# 4. Read tasks.json (confirm valid JSON format)
cat tasks.json | python3 -m json.tool > /dev/null && echo "tasks.json format valid" || echo "tasks.json format invalid"
```

All checks must pass before this step is considered complete.

---

## Quality Checklist

- [ ] Does `init.sh` run without errors?
- [ ] Is `tasks.json` valid JSON? Does every task have `verify` and `requires_eval` fields?
- [ ] Was each task's `requires_eval` evaluated against the criteria, rather than blindly set to false?
- [ ] Does `progress.md` have an initial record?
- [ ] Does `AGENTS.md` include both the "adding tasks" and "completing tasks" rules?

---

## Completion Summary

Output a summary:

**Files created:**
- `init.sh`: [describe what checks it performs]
- `tasks.json`: [N] tasks, of which [N] require Evaluator review
- `progress.md`: Initialized

**How to use:**
> You can now hand the project off to an AI agent. At the start of each session, it will read
> these three files + git log to recover working context. You no longer need to explain
> "where we left off" every time.

**Action items for you:**
- Review the task list in `tasks.json` to confirm it matches your expectations — feel free to add or remove tasks
- Confirm whether the `requires_eval` flags are reasonable
- If any step in `init.sh` fails, report it so it can be fixed

**Next steps:**
- The Harness foundation is complete (step1 + step2 + step3)
- You can begin development with your AI agent
- If the agent repeatedly violates code conventions, run `harness-step4-linter` to enforce rules mechanically
- If the agent's self-evaluation proves unreliable, run `harness-step5-evaluator` to introduce independent review
