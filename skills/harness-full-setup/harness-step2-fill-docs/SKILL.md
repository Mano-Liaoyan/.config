---
name: harness-step2-fill-docs
description: |
  Use when a project already has an AGENTS.md and docs/ skeleton (created by harness-step1) and the
  documentation needs substantive content. Applies when the user says "fill in the docs", "add real
  content to docs/", "analyze the codebase and write architecture docs", "write ARCHITECTURE.md",
  "write tech decisions", or "make the docs reflect the actual code".
  
  Prerequisite: AGENTS.md and docs/ directory skeleton must already exist (created by harness-step1).
---

# Harness Step 2: Populate docs/ Knowledge Base Content

## Overview

Deep-read the project source code and make implicit knowledge explicit — architecture patterns,
naming conventions, technology decisions — writing it all into the docs/ files so that any agent
in any session can rapidly understand the full project landscape.

**Core principle**: Inferred content must cite its source. Content that cannot be confirmed must be
marked "TBD". Never use vague placeholders to paper over gaps.

---

## Execution Steps

### Step 1: Deep Scan

Before writing any documentation, thoroughly understand the project. Execute in order:

```bash
# 1. Confirm docs/ skeleton exists
ls docs/

# 2. Read the directory structure (3 levels deep)
find . -maxdepth 3 \
  -not -path '*/node_modules/*' -not -path '*/.git/*' \
  -not -path '*/__pycache__/*' -not -path '*/dist/*' \
  -not -path '*/.next/*' -not -path '*/build/*' | sort

# 3. Read the main entry file(s)
# (Determine from tech stack: main.ts / main.py / app.go / index.js, etc.)

# 4. Read module boundaries (index files or first file in each major directory)
# Goal: understand the responsibility of each directory

# 5. Read dependency declarations
cat package.json 2>/dev/null || cat pyproject.toml 2>/dev/null || \
  cat go.mod 2>/dev/null || cat Cargo.toml 2>/dev/null

# 6. Read existing documentation (reuse, don't duplicate)
cat README.md 2>/dev/null
cat AGENTS.md 2>/dev/null
```

Scan objectives — before writing docs, you must be able to answer:
- What are the major modules? What does each one do?
- What is the call chain? (UI -> ? -> ? -> data layer)
- Which major libraries/frameworks are used? Can you infer why they were chosen?
- What are the file naming patterns? Variable naming patterns?
- What would cause tests to fail? What are the acceptance criteria?

---

### Step 2: Write `docs/ARCHITECTURE.md`

**What to write**: Module layout, dependency directions, primary data flows. Describe "what the structure is" and "why it's organized this way" — not implementation details.

**Mandatory requirement: Verify imports before describing component/module relationships**

Before writing any assertion like "A is used by B", "A embeds B", or "page A contains component C",
you must use Grep to confirm the actual import. Do not guess based on file names or directory locations.

```bash
# Verify whether a component is actually referenced by a page
grep -r "ChatInterface" frontend/src/app/[locale]/book/[bookCode]/ 2>/dev/null

# Verify which files actually reference a component
grep -rl "ComponentName" src/ 2>/dev/null
```

If grep returns no results, there is no reference relationship — even if the component is in the same directory,
do not assert it is being used. Mark unverified relationships as "TBD: no import found, requires manual confirmation".

**Format template:**

```markdown
# Architecture

## Overall Structure
[Describe the layering in prose, then supplement with a directory tree]

[Directory tree, only to key levels — do not exhaustively list every file]

## Dependency Direction Rules
[Use arrow diagrams or lists to show which layer can reference which]

Key constraints:
- [Constraint 1, with rationale]
- [Constraint 2, with rationale]

## Primary Data Flows
[Describe the 1-2 most critical request/data flows, from entry point to data store]

## TBD
- [ ] [Content that could not be determined from scanning]
```

**Writing requirements:**
- Dependency rules must be specific — do not write vague statements like "maintain clean layering"
- Each constraint must include a rationale ("Do not call DB from the UI layer because...")
- Content that cannot be inferred from code must be explicitly marked "TBD: requires manual confirmation"

---

### Step 3: Write `docs/CONVENTIONS.md`

**What to write**: Naming patterns and file organization patterns observed in the code.

**Scanning method:**
```bash
# Observe file naming patterns
find src -name "*.ts" -o -name "*.py" -o -name "*.go" 2>/dev/null | head -30

# Observe function/variable naming (sample several files)
head -50 [path to main source files]
```

**Format template:**

```markdown
# Code Conventions

## File Naming
- [Pattern 1]: example `XxxYyy.tsx`
- [Pattern 2]: example `xxx-yyy.ts`

## Variable and Function Naming
- Variables/functions: [pattern + example]
- Classes/components: [pattern + example]
- Constants: [pattern + example]

## Directory Organization
[What type of files goes in each major directory]

## Git Commit Format
[Infer from git log, or recommend a format]
`type(scope): description`
Allowed types: feat / fix / docs / refactor / test

## TBD
- [ ] [Conventions that could not be inferred from code]
```

**Writing requirements:**
- Each pattern must be backed by concrete examples observed in the code
- If the code itself has inconsistent naming, state this honestly and suggest "Currently inconsistent — recommend standardizing to..."
- Do not invent conventions that don't exist in the project

---

### Step 4: Write `docs/TECH_DECISIONS.md`

**What to write**: Rationale behind technology choices. This is the hardest document because reasons often aren't in the code.

**Scanning method:**
```bash
# List all direct dependencies
cat package.json | grep '"dependencies"' -A 50 2>/dev/null
# or
cat pyproject.toml | grep -A 30 '\[tool.poetry.dependencies\]' 2>/dev/null
```

**Format template:**

```markdown
# Technology Decision Records

## [Framework/Library Name]
**Purpose**: [What this library/framework is used for]
**Selection rationale**: [Inferred reason, or mark "TBD"]
**Alternatives considered**: [If obvious alternatives exist, list them and explain why they weren't chosen]
**Caveats**: [Anything that requires special attention when using this]

## TBD
- [ ] [Libraries whose selection rationale could not be inferred — requires human input]
```

**Writing requirements:**
- Only cover major frameworks and libraries — do not list every utility dependency
- Write inferred rationale where possible; where not, clearly mark "TBD: original selection rationale unknown, please provide"
- Do not fabricate selection rationale

---

### Step 5: Write `docs/QUALITY.md`

**What to write**: What "done" means, and the code review checklist.

**Scanning method:**
```bash
# Identify test file patterns
find . -name "*.test.*" -o -name "*.spec.*" -o -name "*_test.*" 2>/dev/null | head -10

# Read CI configuration (if present)
cat .github/workflows/*.yml 2>/dev/null | head -60
```

**Format template:**

```markdown
# Quality Standards

## Definition of Done
A task is considered complete when all of the following are met:
- [ ] Feature works correctly in the local environment
- [ ] Tests written (covering the happy path + at least one error path)
- [ ] [Add project-specific checks, e.g., type checking passes, no lint errors]
- [ ] Git commit message is clear and descriptive
- [ ] If architecture or conventions were modified, docs/ has been updated

## Code Review Checklist

**Correctness**
- [ ] [Project-specific correctness checks, e.g., multi-tenant isolation, permission validation]

**Maintainability**
- [ ] Does naming follow CONVENTIONS.md?
- [ ] Is there duplicated code that can be extracted?
- [ ] Is business logic in the correct layer? (see ARCHITECTURE.md)

## Testing Requirements
[Testing conventions inferred from existing test files, or recommended standards]

## TBD
- [ ] [Acceptance criteria that could not be inferred from code]
```

---

### Step 6: Write `docs/exec-plans/tech-debt-tracker.md`

**What to write**: Potential issues and technical debt discovered during scanning.

**Format:**
```markdown
# Technical Debt Tracker

Entry format: `[Priority: High/Medium/Low] Issue description — Impact scope`

## Current Debt
[Issues found during scanning — be honest]

## Resolved
(empty)
```

**Indicators of technical debt:**
- Duplicated code (same logic appears in multiple places)
- Inconsistent naming (same concept referred to by different names)
- TODO / FIXME comments
- Oversized files (exceeding 300 lines)
- Core modules with no test coverage

---

## Quality Checklist

After writing each file, verify one by one:

- [ ] Are there "TBD" items? Compile them into a list to present to the user
- [ ] Is there any fabricated content? Remove it and replace with "TBD"
- [ ] Are the dependency rules in ARCHITECTURE.md specific and actionable?
- [ ] Are the patterns in CONVENTIONS.md backed by code examples?
- [ ] Does the DoD in QUALITY.md include project-specific checks?

---

## Completion Summary

Output a summary with three sections:

**Content written**: List what was documented in each file

**Items requiring manual confirmation ("TBD" list)**:
Aggregate all "TBD" entries across all files — this is what the user most needs to review

**Next steps**:
- After manually filling in the "TBD" items, the knowledge base is ready for use
- Then run `harness-step3-session-management` to establish cross-session state management (progress file + tasks.json)
