import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useApi } from './useApi'

describe('useApi', () => {
  it('starts loading, then exposes the data', async () => {
    const fetcher = vi.fn().mockResolvedValue('data')
    const { result } = renderHook(() => useApi(fetcher))

    expect(result.current.state).toEqual({ status: 'loading' })
    await waitFor(() => expect(result.current.state).toEqual({ status: 'success', data: 'data' }))
  })

  it('exposes errors, and wraps non-Error rejections', async () => {
    // Fetchers are created outside the render callback: a new function identity would restart the request
    const failure = new Error('boom')
    const failing = vi.fn().mockRejectedValue(failure)
    const first = renderHook(() => useApi(failing))
    await waitFor(() => expect(first.result.current.state).toEqual({ status: 'error', error: failure }))

    const throwsText = vi.fn().mockRejectedValue('plain text')
    const second = renderHook(() => useApi(throwsText))
    await waitFor(() => expect(second.result.current.state.status).toBe('error'))
    expect(second.result.current.state).toMatchObject({ error: { message: 'plain text' } })
  })

  it('reload() repeats the request and can recover from an error', async () => {
    const fetcher = vi.fn().mockRejectedValueOnce(new Error('boom')).mockResolvedValue('ok')
    const { result } = renderHook(() => useApi(fetcher))
    await waitFor(() => expect(result.current.state.status).toBe('error'))

    act(() => result.current.reload())
    await waitFor(() => expect(result.current.state).toEqual({ status: 'success', data: 'ok' }))
    expect(fetcher).toHaveBeenCalledTimes(2)
  })

  it('aborts the in-flight request on unmount', () => {
    let signal: AbortSignal | undefined
    const fetcher = vi.fn((s: AbortSignal) => {
      signal = s
      return new Promise<string>(() => {})
    })
    const { unmount } = renderHook(() => useApi(fetcher))

    expect(signal?.aborted).toBe(false)
    unmount()
    expect(signal?.aborted).toBe(true)
  })

  it('ignores a result that arrives after the request was aborted', async () => {
    let resolve!: (value: string) => void
    const fetcher = vi.fn(() => new Promise<string>((r) => (resolve = r)))
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { unmount } = renderHook(() => useApi(fetcher))

    unmount()
    resolve('late') // would warn or throw if the hook still updated state
    await Promise.resolve()
    expect(errors).not.toHaveBeenCalled()
  })
})
