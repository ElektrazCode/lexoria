import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, apiGet } from './client'
import { getGroups, getLastStudySession, getQuickStats, getStudyProgress, getWords } from './endpoints'

const fetchMock = vi.fn<typeof fetch>()

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => {
  fetchMock.mockReset()
  vi.unstubAllGlobals()
})

const jsonResponse = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })

async function caught(promise: Promise<unknown>) {
  try {
    await promise
  } catch (error) {
    return error
  }
  throw new Error('expected the promise to reject')
}

const UNAVAILABLE = 'The service may be unavailable. Please make sure the backend is running, then try again.'

describe('apiGet: success', () => {
  it('requests the relative URL as JSON and returns the parsed body', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ hello: 'world' }))
    const controller = new AbortController()

    await expect(apiGet('/api/thing', controller.signal)).resolves.toEqual({ hello: 'world' })
    expect(fetchMock).toHaveBeenCalledWith('/api/thing', {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    })
  })
})

describe('apiGet: errors returned by the Go backend (JSON body)', () => {
  it.each([400, 404, 500, 503])('keeps the backend message for a %i and the real status', async (status) => {
    fetchMock.mockResolvedValue(jsonResponse({ error: 'sql: no rows in result set' }, status))
    const error = await caught(apiGet('/api/words/9999'))

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ message: 'sql: no rows in result set', status })
  })

  it.each([
    ['an empty error message', { error: '' }],
    ['a blank error message', { error: '   ' }],
    ['a non-string error', { error: { code: 1 } }],
    ['no error field', { message: 'something else' }],
    ['a JSON array', ['nope']],
    ['JSON null', null],
  ])('does not treat %s as a backend message (5xx → service unavailable)', async (_name, body) => {
    fetchMock.mockResolvedValue(jsonResponse(body, 500))
    expect(await caught(apiGet('/api/x'))).toMatchObject({ message: UNAVAILABLE, status: 500 })
  })
})

describe('apiGet: server errors without an API error body (proxy / gateway)', () => {
  it.each([500, 502, 503, 504])('says the service may be unavailable for an empty %i and keeps the status', async (status) => {
    fetchMock.mockResolvedValue(new Response('', { status }))
    const error = await caught(apiGet('/api/x'))

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ message: UNAVAILABLE, status })
  })

  it('does so for a non-JSON error page too', async () => {
    fetchMock.mockResolvedValue(new Response('<html>Bad Gateway</html>', { status: 502 }))
    expect(await caught(apiGet('/api/x'))).toMatchObject({ message: UNAVAILABLE, status: 502 })
  })

  it('does so when the error body is cut off mid-JSON', async () => {
    fetchMock.mockResolvedValue(new Response('{"error": "unfinished', { status: 500 }))
    expect(await caught(apiGet('/api/x'))).toMatchObject({ message: UNAVAILABLE, status: 500 })
  })

  it('does not blame availability for client errors: 4xx without a body keeps the plain status message', async () => {
    fetchMock.mockResolvedValue(new Response('404 page not found', { status: 404 }))
    expect(await caught(apiGet('/api/nope'))).toMatchObject({ message: 'Request failed with status 404', status: 404 })
  })
})

describe('apiGet: network failures', () => {
  it('turns a failed fetch into an ApiError without a status', async () => {
    fetchMock.mockRejectedValue(new TypeError('fetch failed'))
    const error = await caught(apiGet('/api/x'))

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ message: 'Could not reach the server. Is the backend running?', status: null })
  })
})

describe('apiGet: malformed successful responses', () => {
  it.each([
    ['HTML', '<html>'],
    ['an empty body', ''],
    ['truncated JSON', '{"id": 1,'],
  ])('reports an unreadable response for %s on a 200', async (_name, body) => {
    fetchMock.mockResolvedValue(new Response(body, { status: 200 }))
    const error = await caught(apiGet('/api/x'))

    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ message: 'The server sent an unreadable response.', status: 200 })
  })
})

describe('apiGet: cancellation', () => {
  const abortError = () => new DOMException('The operation was aborted.', 'AbortError')

  it('rethrows the original AbortError when the request is aborted in flight', async () => {
    const controller = new AbortController()
    const original = abortError()
    fetchMock.mockImplementation(async () => {
      controller.abort()
      throw original
    })

    expect(await caught(apiGet('/api/x', controller.signal))).toBe(original)
  })

  it('rethrows the AbortError when aborted while the body is being read', async () => {
    const controller = new AbortController()
    const original = abortError()
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => {
        controller.abort()
        throw original
      },
    } as unknown as Response)

    expect(await caught(apiGet('/api/x', controller.signal))).toBe(original)
  })

  it('never reports an abort as "backend not running"', async () => {
    const controller = new AbortController()
    controller.abort()
    fetchMock.mockRejectedValue(abortError())

    const error = await caught(apiGet('/api/x', controller.signal))
    expect(error).not.toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ name: 'AbortError' })
  })
})

describe('endpoints', () => {
  it('call the expected URLs', async () => {
    fetchMock.mockImplementation(async () => jsonResponse({}))
    await getQuickStats()
    await getStudyProgress()
    await getLastStudySession()
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      '/api/dashboard/quick-stats',
      '/api/dashboard/study_progress',
      '/api/dashboard/last_study_session',
    ])
  })

  it('turn the null the Go backend sends for empty lists into []', async () => {
    fetchMock.mockImplementation(async () => jsonResponse(null))
    await expect(getWords()).resolves.toEqual([])
    await expect(getGroups()).resolves.toEqual([])
  })

  it('pass real lists through unchanged', async () => {
    const list = [{ id: 1, target_word: 'Νερό', english: 'Water', parts: 'noun' }]
    fetchMock.mockResolvedValue(jsonResponse(list))
    await expect(getWords()).resolves.toEqual(list)
  })
})
