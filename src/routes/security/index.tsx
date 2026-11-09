import './i18n'

import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { Info, KeyRound, LogOut } from 'lucide-react'
import { useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { z } from 'zod'
import type { TFunction } from 'i18next'

import { Field, LockedBadge, NumberField } from '@/components/fields'
import { PageHeader } from '@/components/page-header'
import { PasswordStrength } from '@/components/password-strength'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api'
import { AUTH_STATE_KEY, CONFIG_QUERY_KEY, setSignInNotice, useAppState } from '@/lib/auth'
import { useDraft } from '@/lib/draft-context'
import { queryClient } from '@/lib/query-client'
import type { AppState } from '@/lib/types'
import { sentence } from '@/lib/utils'

const MIN_PASSWORD = 8
const MIN_USERNAME = 3
const MAX_USERNAME = 64

interface LoginValues {
  username: string
  current: string
  password: string
  confirm: string
}

/**
 * The login form. Username and new password are both optional, but at least
 * one of them has to change, and the current password is always required.
 */
function loginSchema(t: TFunction, currentUsername: string) {
  return z
    .object({
      username: z
        .string()
        .trim()
        .min(MIN_USERNAME, t('auth.usernameLength'))
        .max(MAX_USERNAME, t('auth.usernameLength')),
      current: z.string().min(1, t('security.needCurrent')),
      password: z.string(),
      confirm: z.string(),
    })
    .superRefine((v, ctx) => {
      if (v.password && v.password.length < MIN_PASSWORD) {
        ctx.addIssue({ code: 'custom', message: t('security.passwordLength'), path: ['password'] })
      }
      if (v.password !== v.confirm) {
        ctx.addIssue({ code: 'custom', message: t('security.passwordMismatch'), path: ['confirm'] })
      }
      if (!v.password && v.username.trim() === currentUsername) {
        ctx.addIssue({ code: 'custom', message: t('security.nothing'), path: ['username'] })
      }
    })
}

/** Admin login (username and password), signing secret, session length, sign out, and the web UI note. */
export function SecurityPage() {
  const { t } = useTranslation()
  const { draft, setDraft, locked, dirty } = useDraft()
  const { data: appState } = useAppState()
  const username = appState?.username ?? ''
  const loginLock = locked['admin.login']
  const [serverError, setServerError] = useState<string | null>(null)
  const [confirmSignOut, setConfirmSignOut] = useState(false)
  const [confirmRotate, setConfirmRotate] = useState(false)

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema(t, username)),
    defaultValues: { username, current: '', password: '', confirm: '' },
  })
  const password = useWatch({ control: form.control, name: 'password' }) ?? ''

  // Keep the username field in step with the signed-in account.
  useEffect(() => {
    form.reset({ username, current: '', password: '', confirm: '' })
  }, [username, form])

  const onSubmit = form.handleSubmit(async (values) => {
    setServerError(null)
    const body: { current: string; new_username?: string; new_password?: string } = { current: values.current }
    const name = values.username.trim()
    if (name !== username) body.new_username = name
    if (values.password) body.new_password = values.password
    try {
      const res = await api.changePassword(body)
      toast.success(t('security.updated'), { description: t('security.updatedDesc') })
      form.reset({ username: res.username, current: '', password: '', confirm: '' })
      await queryClient.invalidateQueries({ queryKey: AUTH_STATE_KEY })
    } catch (e) {
      setServerError(sentence(e instanceof Error ? e.message : String(e)))
    }
  })

  const rotate = useMutation({
    mutationFn: () => api.rotateSecret(),
    onSuccess: () => toast.success(t('security.rotated'), { description: t('security.rotatedDesc') }),
    onError: (e) =>
      toast.error(t('security.rotateError'), { description: e instanceof Error ? e.message : undefined }),
  })

  const performSignOut = async () => {
    try {
      await api.logout()
    } catch {
      // The session may already be gone on the server. Show the sign-in screen either way.
    }
    setSignInNotice('auth.signedOut')
    queryClient.setQueryData<AppState>(AUTH_STATE_KEY, (s) => (s ? { ...s, authenticated: false } : s))
    queryClient.removeQueries({ queryKey: CONFIG_QUERY_KEY })
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t('nav.security')} description={t('security.desc')} />

      <Card>
        <CardHeader>
          <CardTitle>{t('security.login')}</CardTitle>
          <CardDescription>{t('security.loginDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {loginLock ? (
            <Alert>
              <Info aria-hidden />
              <AlertTitle className="flex flex-wrap items-center gap-2">
                {t('security.loginLockedTitle', { env: loginLock })}
                <LockedBadge env={loginLock} />
              </AlertTitle>
              <AlertDescription>{t('security.loginLockedDesc')}</AlertDescription>
            </Alert>
          ) : null}

          <Form {...form}>
            <form onSubmit={onSubmit} noValidate>
              <fieldset disabled={!!loginLock} className="space-y-5">
                {serverError ? (
                  <Alert variant="destructive" role="alert">
                    <AlertDescription>{serverError}</AlertDescription>
                  </Alert>
                ) : null}

                <div className="grid gap-5 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('auth.username')}</FormLabel>
                        <FormControl>
                          <Input autoComplete="username" spellCheck={false} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="current"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('security.current')}</FormLabel>
                        <FormControl>
                          <Input type="password" autoComplete="current-password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('security.newPassword')}</FormLabel>
                        <FormControl>
                          <Input type="password" autoComplete="new-password" {...field} />
                        </FormControl>
                        {password ? <PasswordStrength password={password} /> : null}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="confirm"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('security.confirmNew')}</FormLabel>
                        <FormControl>
                          <Input type="password" autoComplete="new-password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <p className="text-xs text-muted-foreground">{t('security.keepHint')}</p>
                <div>
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {t('security.update')}
                  </Button>
                </div>
              </fieldset>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('security.sessions')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <Field id="security-session-hours" label={t('security.sessionHours')} help={t('security.sessionHoursHelp')}>
            <NumberField
              id="security-session-hours"
              value={draft.admin.session_hours}
              onChange={(v) =>
                setDraft((d) => {
                  d.admin.session_hours = v
                })
              }
              min={1}
              max={2160}
              suffix={t('unit.hours')}
              aria-describedby="security-session-hours-help"
            />
          </Field>
          <p className="text-xs text-muted-foreground">{t('security.cookieNote')}</p>
          <div>
            <Button variant="outline" onClick={() => setConfirmSignOut(true)}>
              <LogOut aria-hidden />
              {t('shell.signOut')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('security.secret')}</CardTitle>
          <CardDescription>{t('security.secretDesc')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => setConfirmRotate(true)} disabled={rotate.isPending}>
            <KeyRound aria-hidden />
            {t('security.rotate')}
          </Button>
        </CardContent>
      </Card>

      <Alert>
        <Info aria-hidden />
        <AlertTitle>{t('security.webuiTitle')}</AlertTitle>
        <AlertDescription>{t('security.webuiDesc')}</AlertDescription>
      </Alert>

      <AlertDialog open={confirmRotate} onOpenChange={setConfirmRotate}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('security.rotateTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('security.rotateDesc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => rotate.mutate()}>
              {t('security.rotateConfirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmSignOut} onOpenChange={setConfirmSignOut}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {dirty ? t('shell.signOutDirtyTitle') : t('shell.signOut')}
            </AlertDialogTitle>
            {dirty ? <AlertDialogDescription>{t('shell.signOutDirtyDesc')}</AlertDialogDescription> : null}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                setConfirmSignOut(false)
                void performSignOut()
              }}
            >
              {t('shell.signOut')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
