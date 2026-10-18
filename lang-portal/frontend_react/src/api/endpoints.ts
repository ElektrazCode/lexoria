import { apiGet } from './client'
import type {
  Group,
  LastStudySessionResponse,
  QuickStats,
  StudyProgress,
  Word,
} from './types'

// One function per endpoint, all with the (signal) => Promise<T> shape that `useApi` expects.
// The Go list endpoints answer `null` (not `[]`) when there are no rows, so lists are normalised here.

export const getWords = async (signal?: AbortSignal): Promise<Word[]> =>
  (await apiGet<Word[] | null>('/api/words', signal)) ?? []

export const getGroups = async (signal?: AbortSignal): Promise<Group[]> =>
  (await apiGet<Group[] | null>('/api/groups', signal)) ?? []

export const getQuickStats = (signal?: AbortSignal) =>
  apiGet<QuickStats>('/api/dashboard/quick-stats', signal)

export const getStudyProgress = (signal?: AbortSignal) =>
  apiGet<StudyProgress>('/api/dashboard/study_progress', signal)

export const getLastStudySession = (signal?: AbortSignal) =>
  apiGet<LastStudySessionResponse>('/api/dashboard/last_study_session', signal)
