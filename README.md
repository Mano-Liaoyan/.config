# .config
config files

## Claude Code

`claude-code/` holds a one-line, right-aligned Claude Code status line (mode,
fast mode, model and effort, git branch, context usage) and the small plugin
it relies on.

Agents installing it on a new machine: follow the steps in
[`claude-code/README.md`](claude-code/README.md#install-for-agents). They copy
the files into `~/.claude/`, merge `claude-code/settings.snippet.json` into
`~/.claude/settings.json`, and verify the install.
