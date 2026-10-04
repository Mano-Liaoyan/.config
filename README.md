# .config
config files

## OpenWhispr

[`openwhispr/`](openwhispr/README.md) contains the portable programming
dictionary and a Python script for restoring it on Linux. The
[KDE Wayland and Ghostty setup guide](openwhispr/linux-setup.md) records the
input-group and automatic-paste fixes verified on 2026-10-04, including the
steps that were insufficient on their own and the final verification.

[`ghostty/openwhispr.conf`](ghostty/openwhispr.conf) is the setting to merge into
an existing Ghostty config. Pulling this repository does not automatically
change Linux groups, install snippets, or refresh running apps; agents should
follow the setup and verification steps.

## Codex

[`codex/`](codex/README.md) contains the persistent **Approve for me** defaults,
instructions for merging them without replacing personal config, and the
observed limits of backend and desktop verification.

## Claude Code

`claude-code/` holds a one-line, right-aligned Claude Code status line (mode,
fast mode, model and effort, git branch, context usage) and the small plugin
it relies on.

Agents installing it on a new machine: follow the steps in
[`claude-code/README.md`](claude-code/README.md#install-for-agents). They copy
the files into `~/.claude/`, merge `claude-code/settings.snippet.json` into
`~/.claude/settings.json`, and verify the install.
