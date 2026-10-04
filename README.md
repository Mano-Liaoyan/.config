# .config
config files

## OpenWhispr

[`openwhispr/`](openwhispr/README.md) contains the portable programming
dictionary and a Python script for restoring it on Linux. Agents setting up
OpenWhispr on a new machine should follow its restore and verification steps.

## Claude Code

`claude-code/` holds a one-line, right-aligned Claude Code status line (mode,
fast mode, model and effort, git branch, context usage) and the small plugin
it relies on.

Agents installing it on a new machine: follow the steps in
[`claude-code/README.md`](claude-code/README.md#install-for-agents). They copy
the files into `~/.claude/`, merge `claude-code/settings.snippet.json` into
`~/.claude/settings.json`, and verify the install.
