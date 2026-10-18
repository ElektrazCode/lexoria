// Response shapes of the Go API (see backend_go/models and backend_go/handlers).
// JSON field names are snake_case exactly as the backend sends them.

/** One vocabulary entry. `target_word` holds the word in the language being learned (Greek). */
export interface Word {
  id: number
  target_word: string
  english: string
  /** Part of speech, e.g. "noun" or "phrase". May be an empty string. */
  parts: string
}

export interface Group {
  id: number
  name: string
}

export interface QuickStats {
  total_words: number
  total_groups: number
}

export interface StudyProgress {
  total_sessions: number
  total_words: number
}

/**
 * The most recent study session. The backend only fills these three fields;
 * the full Session model also has `activity_id` and `ended_at`, but this
 * endpoint leaves them as zero values, so they are deliberately not typed here.
 */
export interface LastStudySession {
  id: number
  group_id: number
  /** ISO 8601 timestamp */
  created_at: string
}

/** `GET /api/dashboard/last_study_session` wraps the session; it is `null` before any study. */
export interface LastStudySessionResponse {
  session: LastStudySession | null
}
