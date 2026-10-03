# Claude Code status line

A one-line, right-aligned Claude Code footer in a Tokyo Night palette:

```
⏵⏵ AUTO  │  ⚡ FAST ON  │  ◆ Opus 5.5 · xhigh ●●●●○  │  ⎇ main  │  ━━━━━━━━━━━━ 10% 98.1k / 1M
```

From left to right: permission mode (hidden in the default mode), fast mode,
model with its effort level, git branch, and context window usage (bar,
percentage, used / total tokens). The bar turns from green to amber, orange
and red at 50%, 75% and 90%.

| File | Install to | Role |
| --- | --- | --- |
| `statusline.mjs` | `~/.claude/statusline.mjs` | Status line command: reads Claude Code's status JSON on stdin and prints the line, padded to the terminal width (`COLUMNS`). |
| `local-plugins/statusline-footer/` | `~/.claude/local-plugins/statusline-footer/` | Function-hooks plugin: hides the separate "auto mode on" hint row and passes the mode to the status line as `CLAUDE_STATUSLINE_MODE`. |
| `settings.snippet.json` | merge into `~/.claude/settings.json` | Turns both on. |

## Install (for agents)

Requirements: Node.js 18 or newer and `git` on `PATH`, a Claude Code build with
the function-hooks plugin API (tested on 2.1.288; the API is early access), and
a true-color terminal whose font has the `⚡ ⎇ ⏵ ━ ●` glyphs.

1. Copy `statusline.mjs` and `local-plugins/` into `~/.claude/`, keeping the
   paths in the table above. Overwrite older copies of these files only.
2. Merge `settings.snippet.json` into `~/.claude/settings.json`:
   - Replace `<HOME>` with the absolute home directory. On Windows use forward
     slashes (`C:/Users/<name>`).
   - Add the keys to what is there; keep the user's other settings.
   - If `env.CLAUDE_CODE_PLUGIN_DIRS` already has a value, append the plugin
     folder with the platform's path-list separator (`;` on Windows, `:`
     elsewhere) instead of replacing it.
   - If a `statusLine` already exists, ask the user before replacing it.
3. Check the install:
   ```sh
   echo '{"fast_mode":true,"model":{"display_name":"Opus 5.5"},"effort":{"level":"high"},"context_window":{"total_input_tokens":50000,"context_window_size":200000,"used_percentage":25}}' \
     | COLUMNS=120 CLAUDE_STATUSLINE_MODE=auto node ~/.claude/statusline.mjs
   claude plugin validate ~/.claude/local-plugins/statusline-footer
   claude plugin test ~/.claude/local-plugins/statusline-footer
   ```
   The first command prints one colored line ending in `25% 50k / 200k`. The
   plugin validates and its tests pass.
4. Tell the user to restart Claude Code. The status line applies right away; the
   plugin loads with the next session.

## Notes

- The status line still works without the plugin; it then shows no mode
  segment, and Claude Code keeps its own mode row under the prompt.
- The plugin hides the hint row only while it shows the mode, `? for
  shortcuts` or `esc to interrupt`. Other hints, such as `Press Ctrl-C again
  to exit`, still appear for as long as Claude Code shows them.
- The line leaves one cell free at the right edge so Claude Code never cuts
  off its end. Narrow terminals get tighter spacing and a shorter bar.
- While a notification is showing on the right of the footer, it wraps to a
  second row.
