import { useEffect, useState, type ReactNode } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { z } from 'zod'
import type { TFunction } from 'i18next'

import { PasswordStrength } from '@/components/password-strength'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { api, ApiError } from '@/lib/api'
import { AUTH_STATE_KEY, takeSignInNotice } from '@/lib/auth'
import { sentence } from '@/lib/utils'

const MIN_PASSWORD = 8
const MIN_USERNAME = 3
const MAX_USERNAME = 64

/** Shared layout of the setup and sign-in screens: mascot, title, description, form. */
function AuthCard({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background bg-[radial-gradient(circle_at_1px_1px,color-mix(in_srgb,var(--foreground)_9%,transparent)_1px,transparent_0)] bg-[length:22px_22px] px-4 py-6">
      <Card className="w-full max-w-[26rem]">
        <CardHeader className="justify-items-center text-center">
          <img src="/assets/mascot/checking.png" alt="" width={104} height={104} className="mb-1 size-[104px]" />
          <CardTitle className="text-[1.375rem]">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </main>
  )
}

function setupSchema(t: TFunction) {
  return z
    .object({
      username: z
        .string()
        .trim()
        .min(MIN_USERNAME, t('auth.usernameLength'))
        .max(MAX_USERNAME, t('auth.usernameLength')),
      password: z.string().min(MIN_PASSWORD, t('auth.passwordLength')),
      confirm: z.string(),
    })
    .refine((v) => v.password === v.confirm, {
      message: t('auth.passwordMismatch'),
      path: ['confirm'],
    })
}

/** First-run screen: creates the admin login. Shown only while the server has no login yet. */
export function SetupPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [serverError, setServerError] = useState<string | null>(null)
  const form = useForm({
    resolver: zodResolver(setupSchema(t)),
    defaultValues: { username: 'admin', password: '', confirm: '' },
  })
  const password = useWatch({ control: form.control, name: 'password' }) ?? ''

  useEffect(() => {
    document.title = t('auth.setupTitle')
  }, [t])

  const onSubmit = form.handleSubmit(async (values) => {
    setServerError(null)
    try {
      await api.setup(values.username.trim(), values.password)
      toast.success(t('auth.setupDone'), { description: t('auth.setupDoneDesc') })
      await queryClient.invalidateQueries({ queryKey: AUTH_STATE_KEY })
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        toast.error(t('auth.setupTaken'), { description: t('auth.setupTakenDesc') })
        await queryClient.invalidateQueries({ queryKey: AUTH_STATE_KEY })
        return
      }
      setServerError(sentence(e instanceof Error ? e.message : String(e)))
    }
  })

  return (
    <AuthCard title={t('auth.setupTitle')} description={t('auth.setupDesc')}>
      <Form {...form}>
        <form onSubmit={onSubmit} noValidate className="space-y-5">
          {serverError ? (
            <Alert variant="destructive">
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          ) : null}
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('auth.username')}</FormLabel>
                <FormControl>
                  <Input autoComplete="username" spellCheck={false} autoFocus {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('auth.password')}</FormLabel>
                <FormControl>
                  <Input type="password" autoComplete="new-password" {...field} />
                </FormControl>
                <PasswordStrength password={password} />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirm"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('auth.confirmPassword')}</FormLabel>
                <FormControl>
                  <Input type="password" autoComplete="new-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" size="lg" disabled={form.formState.isSubmitting}>
            {t('auth.setupSubmit')}
          </Button>
        </form>
      </Form>
    </AuthCard>
  )
}

function loginSchema(t: TFunction) {
  const required = t('auth.enterBoth')
  return z.object({
    username: z.string().min(1, required),
    password: z.string().min(1, required),
  })
}

/** Sign-in screen. */
export function LoginPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [notice] = useState(() => takeSignInNotice())
  const [serverError, setServerError] = useState<string | null>(null)
  const form = useForm({
    resolver: zodResolver(loginSchema(t)),
    defaultValues: { username: '', password: '' },
  })

  useEffect(() => {
    document.title = t('auth.signInTitle')
  }, [t])

  const onSubmit = form.handleSubmit(async (values) => {
    setServerError(null)
    try {
      await api.login(values.username, values.password)
      await queryClient.invalidateQueries({ queryKey: AUTH_STATE_KEY })
    } catch (e) {
      setServerError(sentence(e instanceof Error ? e.message : String(e)))
      form.setValue('password', '')
    }
  })

  return (
    <AuthCard title={t('auth.signInTitle')} description={t('auth.signInDesc')}>
      <Form {...form}>
        <form onSubmit={onSubmit} noValidate className="space-y-5">
          {notice ? (
            <Alert>
              <AlertDescription>{t(notice)}</AlertDescription>
            </Alert>
          ) : null}
          {serverError ? (
            <Alert variant="destructive">
              <AlertTitle>{serverError}</AlertTitle>
            </Alert>
          ) : null}
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('auth.username')}</FormLabel>
                <FormControl>
                  <Input autoComplete="username" spellCheck={false} autoFocus {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('auth.password')}</FormLabel>
                <FormControl>
                  <Input type="password" autoComplete="current-password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" size="lg" disabled={form.formState.isSubmitting}>
            {t('auth.signIn')}
          </Button>
        </form>
      </Form>
    </AuthCard>
  )
}
