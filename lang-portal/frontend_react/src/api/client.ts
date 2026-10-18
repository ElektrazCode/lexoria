/** Error thrown for any failed API request. */
export class ApiError extends Error {
  /** HTTP status code, or `null` when no usable response arrived (network down, invalid JSON). */
  readonly status: number | null

  constructor(message: string, status: number | null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

/**
 * Picks the message for an HTTP error response:
 *  1. the Go API's own message, from a `{"error": "<message>"}` body, whatever the status;
 *  2. otherwise, for a 5xx, a friendly "service may be unavailable" text. A 5xx without a real
 *     API error body usually comes from a proxy or gateway (for example the Vite dev proxy
 *     while the Go backend is stopped), not from the application;
 *  3. otherwise the plain status code.
 */
async function errorMessage(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json()
    if (body && typeof body === 'object' && 'error' in body && typeof body.error === 'string' && body.error.trim()) {
      return body.error
    }
  } catch {
    // Empty or non-JSON body
  }
  if (response.status >= 500) {
    return 'The service may be unavailable. Please make sure the backend is running, then try again.'
  }
  return `Request failed with status ${response.status}`
}

/**
 * GET `path` (a relative URL such as "/api/words") and return the parsed JSON.
 * Throws ApiError for HTTP errors, network failures and invalid JSON.
 * If `signal` is aborted the original AbortError is rethrown untouched.
 */
export async function apiGet<T>(path: string, signal?: AbortSignal): Promise<T> {
  let response: Response
  try {
    response = await fetch(path, { headers: { Accept: 'application/json' }, signal })
  } catch (error) {
    if (signal?.aborted) throw error
    throw new ApiError('Could not reach the server. Is the backend running?', null)
  }

  if (!response.ok) {
    throw new ApiError(await errorMessage(response), response.status)
  }

  try {
    return (await response.json()) as T
  } catch (error) {
    if (signal?.aborted) throw error
    throw new ApiError('The server sent an unreadable response.', response.status)
  }
}
