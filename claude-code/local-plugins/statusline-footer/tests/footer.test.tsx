import { expect, test } from 'claude-code/testing'

const hintRow = (hint: string) => ({
  plugin: 'statusline-footer',
  surface: 'terminal' as const,
  component: 'PromptHint' as const,
  props: { isDraft: false, isWorking: false, hint },
})

test('a mode-only hint folds away and publishes the mode', async ($, on) => {
  const published: (string | undefined)[] = []
  on('env.set', ($, e) => {
    if (e.name === 'CLAUDE_STATUSLINE_MODE') published.push(e.value)
    return { value: undefined }
  })

  const ui = await $.ui.mount(hintRow('⏵⏵ auto mode on (shift+tab to cycle)'))
  expect(await ui.find({ type: 'Text' })).toBeUndefined()
  expect(published).toEqual(['auto'])
  await ui.unmount()
})

test('idle and working hints fold away in the default mode', async ($, on) => {
  const published: (string | undefined)[] = []
  on('env.set', ($, e) => {
    published.push(e.value)
    return { value: undefined }
  })

  for (const hint of ['? for shortcuts', 'esc to interrupt', '']) {
    const ui = await $.ui.mount(hintRow(hint))
    expect(await ui.find({ type: 'Text' })).toBeUndefined()
    await ui.unmount()
  }
  expect(published).toEqual(['default'])
})

test('a hint with anything else keeps the engine row', async ($, on) => {
  on('env.set', () => ({ value: undefined }))
  // Stands in for the engine's own hint row.
  on('ui.render', { component: 'PromptHint' }, ($, e) => {
    const { Text } = $.ui.resolve(e)
    return <Text>{e.props.hint}</Text>
  })

  const ui = await $.ui.mount(hintRow('⏸ plan mode on · Press Ctrl-C again to exit'))
  expect(await ui.find({ type: 'Text', text: /Ctrl-C again to exit/ })).toBeDefined()
  await ui.unmount()
})
