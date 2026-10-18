import { useCallback, useEffect, useState } from 'react'

export type ApiState<T> =
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error }

/**
 * Runs a GET request when the component mounts and exposes its progress.
 *
 * `fetcher` must be referentially stable (a module-level function such as
 * `getWords`, or one wrapped in useCallback): a new function identity restarts the request.
 *
 * - Unmounting (or a new `fetcher`) aborts the in-flight request and ignores its result.
 * - `reload()` repeats the request, e.g. from a "Try again" button.
 */
export function useApi<T>(fetcher: (signal: AbortSignal) => Promise<T>) {
  const [state, setState] = useState<ApiState<T>>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setState({ status: 'loading' })

    fetcher(controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) setState({ status: 'success', data })
      },
      (error: unknown) => {
        if (controller.signal.aborted) return
        setState({ status: 'error', error: error instanceof Error ? error : new Error(String(error)) })
      },
    )

    return () => controller.abort()
  }, [fetcher, attempt])

  const reload = useCallback(() => setAttempt((n) => n + 1), [])

  return { state, reload }
}
