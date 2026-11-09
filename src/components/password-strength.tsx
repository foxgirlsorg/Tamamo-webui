import { useTranslation } from 'react-i18next'

import { passwordScore } from '@/lib/password'
import { cn } from '@/lib/utils'

const MIN_LENGTH = 8

/** Four-segment meter and hint for a new password (minimum 8 characters). */
export function PasswordStrength({ password, id }: { password: string; id?: string }) {
  const { t } = useTranslation()
  const score = passwordScore(password)
  const hint =
    password.length === 0
      ? t('pw.hint')
      : password.length < MIN_LENGTH
        ? t('pw.more', { count: MIN_LENGTH - password.length, n: MIN_LENGTH - password.length })
        : t('pw.strength', { level: t(`pw.level.${score}`) })

  return (
    <div className="space-y-2">
      <div aria-hidden className="grid grid-cols-4 gap-1">
        {[1, 2, 3, 4].map((seg) => (
          <span
            key={seg}
            className={cn(
              'h-1 rounded-full bg-muted transition-colors',
              score >= seg && (score <= 1 ? 'bg-destructive' : score === 2 ? 'bg-chart-3' : 'bg-chart-2'),
            )}
          />
        ))}
      </div>
      <p id={id} aria-live="polite" className="text-xs text-muted-foreground">
        {hint}
      </p>
    </div>
  )
}
