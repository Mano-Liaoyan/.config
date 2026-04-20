# Harness Full Setup — End-to-End Agent Knowledge Pipeline

Set up the complete Harness Engineering pipeline for any project in one command.

This skill orchestrates three steps in sequence — creating AGENTS.md + docs/ skeleton, populating documentation with real code analysis, and establishing cross-session state management — pausing between each step for user review and confirmation.

## What It Does

- Runs a pre-flight check to confirm you're in a valid project root
- Invokes **harness-step1-create-agents-md**: scans project, creates AGENTS.md and docs/ structure
- Pauses for user review and TBD filling
- Invokes **harness-step2-fill-docs**: deep-reads code, populates docs/ with substantive content
- Pauses for user review and TBD filling
- Invokes **harness-step3-session-management**: creates init.sh, tasks.json, progress.md
- Presents a consolidated final summary with all remaining TBD items

If any step fails, the pipeline stops and reports — it never skips ahead.

## When to Use It

Use this skill when you want to set up the full Harness Engineering pipeline from scratch on a project.

Trigger phrases: "set up harness for my project", "run the full harness pipeline", "bootstrap agent support", "initialize everything for AI development", "run all harness steps".

## Installation

### Option 1 — CLI (recommended)

```bash
npx skills add simbajigege/book2skills/skills/harness-full-setup
```

### Option 2 — Manual upload

1. Download the skill folder (or clone this repo).
2. In Claude.ai, go to **Settings → Skills** and upload the folder.
3. The skill will appear in your available skills list.

## Prerequisites

None. All three sub-skills are bundled inside this skill folder.

## File Structure

```
harness-full-setup/
├── SKILL.md                              # Orchestrator instructions
├── README.md                             # This file
├── LICENSE                               # Apache 2.0
├── harness-step1-create-agent-md/        # Subskill: create AGENTS.md + docs/ skeleton
│   ├── SKILL.md
│   ├── README.md
│   └── LICENSE
├── harness-step2-fill-docs/              # Subskill: populate docs/ with real content
│   ├── SKILL.md
│   ├── README.md
│   └── LICENSE
└── harness-step3-session-management/     # Subskill: init.sh, tasks.json, progress.md
    ├── SKILL.md
    ├── README.md
    └── LICENSE
```

## License

Apache 2.0 — Original work. See LICENSE.
