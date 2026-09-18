/**
 * Turns the common API error shapes into a short message suitable for the UI.
 * It intentionally avoids exposing an entire server response to the user.
 */
export function getSolicitudErrorMessage(error: unknown, fallback: string): string {
  if (!error || typeof error !== "object") return fallback

  const response = (error as { response?: { data?: unknown } }).response
  const data = response?.data

  if (typeof data === "string" && data.trim()) return data
  if (!data || typeof data !== "object") return fallback

  const detail = (data as { detail?: unknown }).detail
  if (typeof detail === "string" && detail.trim()) return detail

  const firstMessage = Object.values(data as Record<string, unknown>)
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .find((value): value is string => typeof value === "string" && value.trim().length > 0)

  return firstMessage ?? fallback
}
