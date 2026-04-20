---
name: harness-step1-create-agents-md
description: |
  Use when a user wants to add agent support to a project, make AI understand their codebase,
  start harness engineering, create AGENTS.md, or set up an agent-readable documentation structure.
  Also applies when the user says "organize docs for agents", "I want to start using AI agents
  for development", or "help Claude Code work better with my project".
---

# Harness Step 1: Create AGENTS.md & docs/ Knowledge Base

## Overview

Establish the foundational agent-readable knowledge base for a project:
- A concise `AGENTS.md` (~100 lines) serving as a table of contents, not an encyclopedia
- A `docs/` directory structure containing the actual knowledge

**Core principle**: If the agent can't see it, it doesn't exist. All architectural decisions, naming conventions, and technology choices must exist as files in the repository.

---

## Execution Steps

### Step 1: Scan the Project

Collect project information in order. **Skip anything already known — do not ask redundant questions.**

```bash
# 1. Project root structure (2 levels deep)
find . -maxdepth 2 -not -path '*/node_modules/*' -not -path '*/.git/*' \
  -not -path '*/__pycache__/*' -not -path '*/dist/*' -not -path '*/.next/*' | sort

# 2. Identify the tech stack
cat package.json 2>/dev/null || cat pyproject.toml 2>/dev/null || \
  cat go.mod 2>/dev/null || cat Cargo.toml 2>/dev/null || echo "No package manifest found"

# 3. Check for existing documentation
ls -la *.md 2>/dev/null; ls -la docs/ 2>/dev/null

# 4. Read the README (if present)
head -80 README.md 2>/dev/null || head -80 readme.md 2>/dev/null
```

Extract from the scan results:
- **Project name and purpose** (from README or package manifest)
- **Tech stack** (language, framework, major dependencies)
- **Directory structure** (primary module layout)
- **Existing documentation** (reuse existing content; avoid duplication)

### Step 2: Generate the docs/ Directory Structure

Create the following files with content derived from scan results. **Do not leave empty placeholders.**

**Required files:**

```
AGENTS.md                    <- Table-of-contents file, ~100 lines
docs/
├── ARCHITECTURE.md          <- Module layout, dependency relationships
├── CONVENTIONS.md           <- Naming rules, code style
├── TECH_DECISIONS.md        <- Technology choice rationale
├── QUALITY.md               <- Acceptance criteria, definition of done
└── exec-plans/
    ├── active/              <- Currently active plans (empty dir, add .gitkeep)
    ├── completed/           <- Completed plans (empty dir, add .gitkeep)
    ├── backlog.md           <- Planned features not yet scheduled
    └── tech-debt-tracker.md <- Known technical debt
```

**Optional (create based on project needs):**

```
docs/
├── design-docs/             <- Create when complex design decisions exist
├── product-specs/           <- Create when product specifications exist
└── references/              <- Create when external docs need localization
```

### Step 3: Write AGENTS.md

Follow this format strictly. Keep it under 100 lines:

```markdown
# [Project Name] — Agent Working Guide

## What This Project Is
[1-3 sentences: purpose, core functionality, target users]

## Quick Orientation
- **Working directory?** Run `pwd` to confirm
- **Tech stack**: [language] + [framework] + [key tools]
- **Entry point**: [main entry, e.g., src/main.ts, app/main.py]
- **Start command**: [how to launch the dev server]
- **Test command**: [how to run tests]

## Knowledge Base Map
Before making any changes, read the relevant documentation:

| I want to understand... | Read this file |
|------------------------|----------------|
| Overall architecture, module layout | `docs/ARCHITECTURE.md` |
| Naming rules, code style | `docs/CONVENTIONS.md` |
| Technology choice rationale | `docs/TECH_DECISIONS.md` |
| What "done" means | `docs/QUALITY.md` |
| Currently active plans | `docs/exec-plans/active/` |
| Planned feature backlog | `docs/exec-plans/backlog.md` |
| Known technical debt | `docs/exec-plans/tech-debt-tracker.md` |

## Working Rules
1. **Read before modifying**: Read the corresponding architecture doc before changing any module
2. **Commit on completion**: Git commit immediately after each feature, with a clear message
3. **Update documentation**: If your changes affect architecture or conventions, update docs/ accordingly
4. **Don't guess**: If something is unclear, read the docs first; if the docs don't cover it, ask

## Prohibited Actions
[Fill based on actual project constraints, e.g.:]
- Do not directly modify files under `generated/` (auto-generated)
- Do not skip tests before merging
- Do not import UI components from the service layer (see docs/ARCHITECTURE.md)
```

### Step 4: Write Each docs/ File

Content requirements for each file:

**`docs/ARCHITECTURE.md`**
- Module/package layout and responsibilities
- Dependency direction rules (which layer can reference which)
- Primary data flows
- Do not describe implementation details — describe "what" and "why it's structured this way"

**`docs/CONVENTIONS.md`**
- File naming rules
- Variable/function/class naming rules
- Directory organization rules
- Comment style
- Any team conventions established by practice

**`docs/TECH_DECISIONS.md`**
- Why this framework was chosen over alternatives
- Why this library was selected
- Significant past architectural decisions and their rationale
- If the rationale cannot be determined from scanning, write "TBD" and note it requires human input

**`docs/QUALITY.md`**
- Definition of Done for a feature
- Code review checklist
- Test coverage requirements
- Performance benchmarks (if applicable)

**`docs/exec-plans/backlog.md`**
- Known but unscheduled planned features — ask the user about these
- Format per entry: `[Priority: P1/P2/P3] Feature description — Context`
- Note: the backlog tracks "want to do but haven't started", not technical debt ("already exists but poorly implemented")
- If scanning reveals backend features not yet exposed in the frontend, or roadmap items mentioned in docs, include them here
- If no obvious backlog items are found, write an empty list with the note "To be added as items are identified"

**`docs/exec-plans/tech-debt-tracker.md`**
- Known technical debt (existing code with subpar quality that needs improvement)
- Format per entry: `[Priority] Issue description — Impact scope`
- Note: do not mix backlog items (planned features) into this file
- If no obvious debt is found, write an empty list with the note "To be added as items are identified"

---

## Quality Checklist

After generation, verify the following:

- [ ] Is AGENTS.md under 150 lines?
- [ ] Does AGENTS.md contain concrete start/test commands (not just "see docs")?
- [ ] Do docs/ files contain substantive content rather than empty placeholders?
- [ ] Are undetermined decisions in TECH_DECISIONS.md marked "TBD"?
- [ ] Does every link in the knowledge base map point to an actually existing file?

---

## Completion Summary

Output a brief summary:
1. Which files were created
2. Which content was inferred from the project scan (may need human verification)
3. Which fields require manual input (items marked "TBD")
4. Next step: run the `harness-step2` skill to populate documentation with substantive content from deep code analysis
