# Claude Code status line

A one-line, right-aligned Claude Code status line in a Tokyo Night palette:

```
⚡ FAST ON  │  ◆ Opus 5.5 · xhigh ●●●●○  │  ⎇ main  │  ━━━━━━━━━━━━ 10% 98.1k / 1M
```

From left to right: fast mode, model with its effort level, git branch, and
context window usage (bar, percentage, used / total tokens). The bar turns from
green to amber, orange and red at 50%, 75% and 90%.

| File | Install to | Role |
| --- | --- | --- |
| `statusline.mjs` | `~/.claude/statusline.mjs` | Status line command: reads Claude Code's status JSON on stdin and prints the line, padded to the terminal width (`COLUMNS`). |
| `settings.snippet.json` | merge into `~/.claude/settings.json` | Turns it on. |

## Install (for agents)

Requirements: Node.js 18 or newer and `git` on `PATH`, and a true-color
terminal whose font has the `⚡ ◆ ⎇ ━ ●` glyphs.

1. Copy `statusline.mjs` to `~/.claude/statusline.mjs`. Overwrite an older copy
   of this file only.
2. Merge `settings.snippet.json` into `~/.claude/settings.json`:
   - Replace `<HOME>` with the absolute home directory. On Windows use forward
     slashes (`C:/Users/<name>`).
   - Add the keys to what is there; keep the user's other settings.
   - If a `statusLine` already exists, ask the user before replacing it.
3. Check the install:
   ```sh
   echo '{"fast_mode":true,"model":{"display_name":"Opus 5.5"},"effort":{"level":"high"},"context_window":{"total_input_tokens":50000,"context_window_size":200000,"used_percentage":25}}' \
     | COLUMNS=120 node ~/.claude/statusline.mjs
   ```
   It prints one colored line ending in `25% 50k / 200k`.
4. Tell the user the status line applies right away; no restart is needed.

## Notes

- The line shows no permission mode. Claude Code (tested on 2.1.288) leaves
  the mode out of the status line's JSON, and its plugin API can neither read
  the live mode nor hide the mode label under the prompt, so Claude Code's own
  label stays the only place the mode appears.
- The line leaves one cell free at the right edge so Claude Code never cuts
  off its end. Narrow terminals get tighter spacing and a shorter bar.
- While a notification is showing on the right of the footer, it wraps to a
  second row.
