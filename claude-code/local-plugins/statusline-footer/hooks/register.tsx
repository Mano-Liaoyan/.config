import type { Register } from 'claude-code'

// The hint row under the prompt repeats the permission mode on a line of its
// own ("⏵⏵ auto mode on (shift+tab to cycle)"). This plugin hands the mode to
// the status line script through CLAUDE_STATUSLINE_MODE and hides the row
// while it says nothing else, so the footer stays one line.

const MODES: readonly (readonly [RegExp, string])[] = [
  [/\bauto mode on\b/i, 'auto'],
  [/\baccept edits on\b/i, 'acceptEdits'],
  [/\bplan mode on\b/i, 'plan'],
  [/\bbypass permissions on\b/i, 'bypassPermissions'],
  [/\bdon'?t ask(?: mode)? on\b/i, 'dontAsk'],
]

// Hint fragments the status line covers or the footer can do without; any
// other text (an exit confirmation, a paste hint) keeps the row visible.
const FOLDED: readonly RegExp[] = [
  /[^\w\s]*\s*(?:auto mode|accept edits|plan mode|bypass permissions|don'?t ask(?: mode)?) on/gi,
  /\(?shift\+tab to cycle\)?/gi,
  /\?\s*for shortcuts/gi,
  /esc to interrupt/gi,
]

const modeOf = (hint: string): string =>
  MODES.find(([pattern]) => pattern.test(hint))?.[1] ?? 'default'

const isFoldable = (hint: string): boolean =>
  FOLDED.reduce((rest, pattern) => rest.replace(pattern, ''), hint)
    .replace(/[·•|]/g, '')
    .trim() === ''

export const register: Register = on => {
  let published: string | undefined

  on('ui.render', { component: 'PromptHint' }, async ($, e, next) => {
    if (e.surface !== 'terminal') return next(e)

    const mode = modeOf(e.props.hint)
    if (mode !== published) {
      try {
        await $.env.set('CLAUDE_STATUSLINE_MODE', mode)
        published = mode
      } catch {
        // The row still folds; the status line just goes without the mode.
      }
    }

    if (!isFoldable(e.props.hint)) return next(e)

    const { Box } = $.ui.resolve(e)
    return <Box />
  })
}
