// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { DocumentTitle } from '../src/client/DocumentTitle.tsx'

afterEach(() => {
  cleanup()
  document.title = ''
  vi.unstubAllEnvs()
})

describe('DocumentTitle', () => {
  it('projects a durable title and restores the product title', () => {
    vi.stubEnv('XHE_CLIENT_TITLE', 'Xee Harness Enhanced')
    document.title = 'stale title'
    const mounted = render(<DocumentTitle />)
    expect(document.title).toBe('Xee Harness Enhanced')
    mounted.rerender(<DocumentTitle title="First title" />)
    expect(document.title).toBe('First title — Xee Harness Enhanced')
    mounted.rerender(<DocumentTitle title="Revised title" />)
    expect(document.title).toBe('Revised title — Xee Harness Enhanced')
    mounted.rerender(<DocumentTitle />)
    expect(document.title).toBe('Xee Harness Enhanced')
    mounted.unmount()
    expect(document.title).toBe('Xee Harness Enhanced')
  })

  it('uses the generic title when the build provides no title', () => {
    vi.stubEnv('XHE_CLIENT_TITLE', '')
    delete process.env.XHE_CLIENT_TITLE
    const mounted = render(<DocumentTitle title="First title" />)
    expect(document.title).toBe('First title — XHE Local Build')
    mounted.unmount()
    expect(document.title).toBe('DSH Local Build')
  })
})
