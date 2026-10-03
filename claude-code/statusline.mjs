#!/usr/bin/env node
// Claude Code status line, right-aligned on one row:
//   mode │ fast mode │ model · effort │ git branch │ context window usage
// Claude Code pipes the session JSON to stdin; we print one ANSI-colored line.
// The permission mode arrives as CLAUDE_STATUSLINE_MODE, set by the
// statusline-footer plugin (~/.claude/local-plugins/statusline-footer).

import { execFileSync } from 'node:child_process';

const chunks = [];
for await (const chunk of process.stdin) chunks.push(chunk);

let data = {};
try {
  data = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
} catch {}

// Tokyo Night palette, 24-bit color.
const C = {
  dim: '#565f89',
  muted: '#3b4261',
  text: '#c0caf5',
  purple: '#bb9af7',
  cyan: '#7dcfff',
  blue: '#7aa2f7',
  teal: '#73daca',
  amber: '#e0af68',
  green: '#9ece6a',
  orange: '#ff9e64',
  red: '#f7768e',
};

const rgb = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return `${n >> 16};${(n >> 8) & 255};${n & 255}`;
};
const fg = (hex, s) => `\x1b[38;2;${rgb(hex)}m${s}\x1b[39m`;
const bold = (s) => `\x1b[1m${s}\x1b[22m`;

const formatTokens = (n) => {
  const short = (x) => (x >= 100 ? x.toFixed(0) : x.toFixed(1)).replace(/\.0$/, '');
  if (n >= 999_500) return `${short(n / 1e6)}M`;
  if (n >= 1_000) return `${short(n / 1e3)}k`;
  return String(n);
};

const levelColor = (pct) =>
  pct < 50 ? C.green : pct < 75 ? C.amber : pct < 90 ? C.orange : C.red;

// Terminal cells a string takes once its color codes are stripped.
const isWide = (cp) =>
  cp === 0x26a1 || // ⚡
  (cp >= 0x1100 && cp <= 0x115f) ||
  (cp >= 0x2e80 && cp <= 0xa4cf) ||
  (cp >= 0xac00 && cp <= 0xd7a3) ||
  (cp >= 0xf900 && cp <= 0xfaff) ||
  (cp >= 0xfe30 && cp <= 0xfe4f) ||
  (cp >= 0xff00 && cp <= 0xff60) ||
  (cp >= 0xffe0 && cp <= 0xffe6) ||
  (cp >= 0x1f300 && cp <= 0x1faff) ||
  (cp >= 0x20000 && cp <= 0x3fffd);
const cellWidth = (s) => {
  let width = 0;
  for (const ch of s.replace(/\x1b\[[0-9;]*m/g, '')) width += isWide(ch.codePointAt(0)) ? 2 : 1;
  return width;
};

// Permission mode; shown only when it is not the default
const MODES = {
  auto: fg(C.teal, bold('⏵⏵ AUTO')),
  acceptEdits: fg(C.purple, bold('⏵⏵ ACCEPT EDITS')),
  plan: fg(C.cyan, bold('⏸ PLAN')),
  bypassPermissions: fg(C.red, bold('⏵⏵ BYPASS')),
  dontAsk: fg(C.amber, bold("⏵⏵ DON'T ASK")),
};
const mode = MODES[process.env.CLAUDE_STATUSLINE_MODE] ?? null;

// Fast mode
const fast = data.fast_mode === true
  ? fg(C.amber, bold('⚡ FAST ON'))
  : fg(C.dim, '○ FAST OFF');

// Model
const modelName = data.model?.display_name || data.model?.id || 'unknown model';
let model = fg(C.purple, '◆ ') + fg(C.text, bold(modelName));

// Effort (thinking level); only sent for models that support it
const EFFORT_LEVELS = ['low', 'medium', 'high', 'xhigh', 'max'];
const effort = data.effort?.level;
const thinkingOff = data.thinking?.enabled === false;
if (effort) {
  const rank = EFFORT_LEVELS.indexOf(effort) + 1;
  const meter = rank > 0
    ? ' ' + fg(C.cyan, '●'.repeat(rank)) + fg(C.muted, '○'.repeat(EFFORT_LEVELS.length - rank))
    : '';
  model += fg(C.dim, ' · ') + fg(C.cyan, bold(effort)) + meter +
    (thinkingOff ? fg(C.dim, ' (thinking off)') : '');
} else if (data.thinking) {
  model += fg(C.dim, ' · ') + fg(C.dim, thinkingOff ? 'thinking off' : 'thinking on');
}

// Git branch of the session's working directory
const dir = data.workspace?.current_dir || data.cwd || process.cwd();
const git = (...args) => execFileSync('git', ['-C', dir, ...args], {
  encoding: 'utf8',
  timeout: 1500,
  stdio: ['ignore', 'pipe', 'ignore'],
  windowsHide: true,
}).trim();

let branch = null;
try {
  const name = git('branch', '--show-current');
  branch = name
    ? fg(C.blue, '⎇ ') + fg(C.blue, bold(name))
    : fg(C.blue, '⎇ ') + fg(C.amber, `detached @${git('rev-parse', '--short', 'HEAD')}`);
  const worktree = data.workspace?.git_worktree;
  if (worktree) branch += fg(C.dim, ` (worktree ${worktree})`);
} catch {
  // Not a git repository, or git unavailable: omit the segment.
}

// Context window
const ctx = data.context_window ?? {};
const size = ctx.context_window_size ?? 0;
const used = ctx.total_input_tokens ?? 0;
const pct = typeof ctx.used_percentage === 'number'
  ? ctx.used_percentage
  : size > 0 ? (used / size) * 100 : 0;

const contextOf = (barCells) => {
  if (used > 0 && size > 0) {
    const color = levelColor(pct);
    const filled = Math.min(barCells, Math.max(pct > 0 ? 1 : 0, Math.round((pct / 100) * barCells)));
    const bar = fg(color, '━'.repeat(filled)) + fg(C.muted, '━'.repeat(barCells - filled));
    return `${bar} ${fg(color, bold(`${Math.round(pct)}%`))} ` +
      fg(C.text, formatTokens(used)) + fg(C.dim, ` / ${formatTokens(size)}`);
  }
  // No API response yet in this window (fresh session or just compacted).
  return fg(C.muted, '━'.repeat(barCells)) + fg(C.dim, ' --% ') +
    fg(C.dim, `— / ${size > 0 ? formatTokens(size) : '?'}`);
};

const layout = (gap, barCells) =>
  [mode, fast, model, branch, contextOf(barCells)].filter(Boolean).join(fg(C.muted, `${gap}│${gap}`));

// Right-align: the footer draws the status line inside 2 columns of padding
// on each side; one more column of slack keeps the end from being truncated.
// Claude Code trims the output, so the padding starts after a color code.
const FOOTER_INSET = 5;
const room = (Number(process.env.COLUMNS) || 0) - FOOTER_INSET;
const roomy = layout('  ', 12);
const line = room <= 0 || cellWidth(roomy) <= room ? roomy : layout(' ', 6);
const pad = Math.max(0, room - cellWidth(line));
process.stdout.write(pad > 0 ? '\x1b[39m' + ' '.repeat(pad) + line : line);

