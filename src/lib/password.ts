/**
 * Rough password strength on a 0 to 4 scale, the same rule the legacy UI used.
 * Below 8 characters the score is capped at 1 ("too weak").
 * An empty password scores 0; anything else scores at least 1.
 */
export function passwordScore(password: string): number {
  if (!password) return 0
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 14) score++
  const classes = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^a-zA-Z0-9]/].filter((r) => r.test(password)).length
  if (classes >= 2) score++
  if (classes >= 3 || password.length >= 20) score++
  if (password.length < 8) score = Math.min(score, 1)
  return Math.max(1, score)
}
