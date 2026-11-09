import { Fragment, useMemo } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Folder, Info, Cpu, Paintbrush, Webhook, TriangleAlert } from 'lucide-react'
import { useForm, useWatch, type Control } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { z } from 'zod'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useDraft } from '@/lib/draft-context'
import type { ModuleConfig, ModulesResponse } from '@/lib/types'

import {
  CACHE_MAX,
  MODULE_NAME,
  MODULE_TYPES,
  ON_ERROR_VALUES,
  PAGE_FILES,
  WEBHOOK_TIMEOUT_MAX,
  WEBHOOK_TIMEOUT_MIN,
  onErrorOptions,
  slotText,
  withNode,
} from './helpers'
import { SitesCombobox } from './sites-combobox'

const TYPE_ICON = { go: Cpu, webhook: Webhook, page: Paintbrush } as const

interface AddModuleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  info: ModulesResponse | undefined
  /** Called with the new module; the screen adds it to the end of the list. */
  onAdd: (module: ModuleConfig) => void
}

/** Add-module dialog: type, then the fields for that type (legacy addModuleDialog). */
export function AddModuleDialog({ open, onOpenChange, info, onAdd }: AddModuleDialogProps) {
  const { t } = useTranslation()
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100svh-2rem)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('modules.addTitle')}</DialogTitle>
          <DialogDescription>{t('modules.addDesc')}</DialogDescription>
        </DialogHeader>
        {/* Mounted only while open, so every opening starts from a clean form. */}
        {open ? <AddModuleForm info={info} onAdd={onAdd} onDone={() => onOpenChange(false)} /> : null}
      </DialogContent>
    </Dialog>
  )
}

/** Validation for the add form, as legacy (messages come from the locale files). */
function buildSchema(
  t: TFunction,
  available: ModulesResponse['available'],
  pages: ModulesResponse['page_modules'],
  existing: ModuleConfig[],
) {
  return z
    .object({
      type: z.enum(MODULE_TYPES),
      goName: z.string(),
      goSettings: z.record(z.string(), z.string()),
      name: z.string(),
      url: z.string(),
      timeout: z.string(),
      cache: z.string(),
      sendCookies: z.boolean(),
      onError: z.enum(ON_ERROR_VALUES),
      page: z.string(),
      sites: z.array(z.string()),
    })
    .superRefine((v, ctx) => {
      const issue = (path: string[], message: string) => ctx.addIssue({ code: 'custom', path, message })
      let moduleName = ''
      let nameField = 'name'

      if (v.type === 'go') {
        nameField = 'goName'
        const mod = available.find((x) => x.name === v.goName)
        if (!mod) {
          issue(['goName'], t('modules.noBuiltin'))
        } else {
          moduleName = mod.name
          for (const d of mod.settings) {
            if (d.required && !(v.goSettings[d.name] ?? '').trim()) {
              issue(['goSettings', d.name], t('modules.errRequired', { name: d.name }))
            }
          }
        }
      } else if (v.type === 'webhook') {
        const name = v.name.trim()
        if (!MODULE_NAME.test(name)) issue(['name'], t('modules.errName'))
        if (!/^https?:\/\/[^\s/]+/i.test(v.url.trim())) issue(['url'], t('modules.errUrl'))
        const timeout = Number(v.timeout)
        if (!(Number.isInteger(timeout) && timeout >= WEBHOOK_TIMEOUT_MIN && timeout <= WEBHOOK_TIMEOUT_MAX)) {
          issue(['timeout'], t('modules.errTimeoutMax'))
        }
        const cache = v.cache.trim() === '' ? 0 : Number(v.cache)
        if (!(Number.isInteger(cache) && cache >= 0 && cache <= CACHE_MAX)) issue(['cache'], t('modules.errCache'))
        moduleName = name
      } else {
        nameField = 'page'
        const pm = pages.find((x) => x.name === v.page)
        if (!pm) issue(['page'], t('modules.pageNoneTitle'))
        else moduleName = pm.name
      }

      if (moduleName && existing.some((x) => x.type === v.type && x.name === moduleName)) {
        issue([nameField], t('modules.errDuplicate', { name: moduleName }))
      }
    })
}

type AddValues = z.infer<ReturnType<typeof buildSchema>>

function AddModuleForm({
  info,
  onAdd,
  onDone,
}: {
  info: ModulesResponse | undefined
  onAdd: (module: ModuleConfig) => void
  onDone: () => void
}) {
  const { t } = useTranslation()
  const { draft } = useDraft()
  const available = useMemo(() => info?.available ?? [], [info])
  const pages = useMemo(() => info?.page_modules ?? [], [info])
  const modulesDir = (info?.modules_dir || info?.data_dir || 'data/modules').replace(/[\\/]+$/, '')

  const schema = useMemo(
    () => buildSchema(t, available, pages, draft.modules),
    [t, available, pages, draft.modules],
  )

  const form = useForm<AddValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: available.length ? 'go' : 'webhook',
      goName: available[0]?.name ?? '',
      goSettings: {},
      name: '',
      url: '',
      timeout: '2000',
      cache: '',
      sendCookies: false,
      onError: 'continue',
      page: pages[0]?.name ?? '',
      sites: [],
    },
  })

  const type = useWatch({ control: form.control, name: 'type' })
  const goName = useWatch({ control: form.control, name: 'goName' })
  const page = useWatch({ control: form.control, name: 'page' })
  const selectedGo = available.find((x) => x.name === goName) ?? available[0]
  const selectedPage = pages.find((x) => x.name === page) ?? pages[0]

  const submit = form.handleSubmit((v) => {
    const module: ModuleConfig = {
      name: '',
      enabled: true,
      type: v.type,
      sites: v.sites,
      url: '',
      timeout_ms: 0,
      on_error: 'continue',
      settings: {},
    }
    if (v.type === 'go') {
      const mod = available.find((x) => x.name === v.goName)
      if (!mod) return
      module.name = mod.name
      module.on_error = v.onError
      for (const d of mod.settings) {
        const value = (v.goSettings[d.name] ?? '').trim()
        if (value) module.settings[d.name] = value
      }
    } else if (v.type === 'webhook') {
      module.name = v.name.trim()
      module.url = v.url.trim()
      module.timeout_ms = Number(v.timeout)
      module.on_error = v.onError
      const cache = v.cache.trim() === '' ? 0 : Number(v.cache)
      if (cache > 0) module.settings.cache_seconds = String(cache)
      if (v.sendCookies) module.settings.send_cookies = 'true'
    } else {
      const pm = pages.find((x) => x.name === v.page)
      if (!pm) return
      module.name = pm.name
    }
    onAdd(module)
    onDone()
  })

  return (
    <Form {...form}>
      <form onSubmit={(e) => void submit(e)} className="space-y-6" noValidate>
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('modules.typeLabel')}</FormLabel>
              <FormControl>
                <RadioGroup
                  value={field.value}
                  onValueChange={(v) => field.onChange(v)}
                  className="grid gap-3 sm:grid-cols-3"
                >
                  {MODULE_TYPES.map((ty) => {
                    const Icon = TYPE_ICON[ty]
                    return (
                      <label
                        key={ty}
                        className="flex cursor-pointer flex-col gap-1.5 rounded-lg border p-3 transition-colors hover:bg-muted/40 has-data-[state=checked]:border-primary has-data-[state=checked]:bg-primary/5"
                      >
                        <span className="flex items-center gap-2 font-medium">
                          <RadioGroupItem value={ty} />
                          <Icon aria-hidden className="size-4" />
                          {t(`modules.type.${ty}`)}
                        </span>
                        <span className="text-xs text-muted-foreground">{t(`modules.typeDesc.${ty}`)}</span>
                      </label>
                    )
                  })}
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {type === 'go' ? (
          available.length && selectedGo ? (
            <div className="space-y-6">
              <FormField
                control={form.control}
                name="goName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('modules.builtinLabel')}</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(v) => {
                        field.onChange(v)
                        form.setValue('goSettings', {})
                      }}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {available.map((x) => (
                          <SelectItem key={x.name} value={x.name}>
                            {x.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedGo.description ? <FormDescription>{selectedGo.description}</FormDescription> : null}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedGo.settings.length ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {selectedGo.settings.map((d) => (
                    <FormField
                      key={`${selectedGo.name}-${d.name}`}
                      control={form.control}
                      name={`goSettings.${d.name}`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex flex-wrap items-center gap-2">
                            <code className="font-mono text-xs">{d.name}</code>
                            {d.required ? <span className="text-xs text-muted-foreground">{t('modules.required')}</span> : null}
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value ?? ''}
                              className="font-mono"
                              placeholder={d.default || undefined}
                              spellCheck={false}
                              autoComplete="off"
                            />
                          </FormControl>
                          {d.description ? <FormDescription>{d.description}</FormDescription> : null}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              ) : null}

              <OnErrorSelect control={form.control} />
            </div>
          ) : (
            <Alert>
              <Info aria-hidden />
              <AlertTitle>{t('modules.noBuiltin')}</AlertTitle>
              <AlertDescription>{t('modules.noBuiltinDesc')}</AlertDescription>
            </Alert>
          )
        ) : null}

        {type === 'webhook' ? (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('modules.name')}</FormLabel>
                    <FormControl>
                      <Input {...field} className="font-mono" placeholder="my-check" spellCheck={false} autoComplete="off" />
                    </FormControl>
                    <FormDescription>{t('modules.nameHelp')}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('modules.url')}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="url"
                        className="font-mono"
                        placeholder="https://checks.example.com/tamamo"
                        spellCheck={false}
                        autoComplete="off"
                      />
                    </FormControl>
                    <FormDescription>{t('modules.urlHelp')}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="timeout"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('modules.timeout')}</FormLabel>
                    <div className="flex items-center gap-2">
                      <FormControl>
                        <Input {...field} type="number" inputMode="numeric" min={WEBHOOK_TIMEOUT_MIN} max={WEBHOOK_TIMEOUT_MAX} step={50} />
                      </FormControl>
                      <span className="shrink-0 text-sm text-muted-foreground">{t('unit.ms')}</span>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cache"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('modules.cache')}</FormLabel>
                    <div className="flex items-center gap-2">
                      <FormControl>
                        <Input {...field} type="number" inputMode="numeric" min={0} max={CACHE_MAX} placeholder="0" />
                      </FormControl>
                      <span className="shrink-0 text-sm text-muted-foreground">{t('unit.seconds')}</span>
                    </div>
                    <FormDescription>{t('modules.cacheHelp')}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="sendCookies"
              render={({ field }) => (
                <FormItem className="flex items-start justify-between gap-4 rounded-lg border p-3">
                  <div className="space-y-1">
                    <FormLabel>{t('modules.sendCookies')}</FormLabel>
                    <p className="text-xs text-muted-foreground">{t('modules.sendCookiesHelp')}</p>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <OnErrorSelect control={form.control} />
          </div>
        ) : null}

        {type === 'page' ? (
          pages.length && selectedPage ? (
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="page"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('modules.folder')}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {pages.map((x) => (
                          <SelectItem key={x.name} value={x.name}>
                            {x.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Folder aria-hidden className="size-4 text-muted-foreground" />
                <code className="font-mono text-xs">{`${modulesDir}/${selectedPage.name}/`}</code>
                {selectedPage.files.map((f) => (
                  <Badge key={f} variant="outline">
                    {f}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {withNode(t('modules.pageFilesHelp', { files: slotText }), filesList())}
              </p>
            </div>
          ) : (
            <Alert>
              <TriangleAlert aria-hidden />
              <AlertTitle>{t('modules.pageNoneTitle')}</AlertTitle>
              <AlertDescription>
                {withNode(t('modules.pageHow', { path: slotText }), <code className="font-mono text-xs">{`${modulesDir}/my-addon/`}</code>)}
              </AlertDescription>
            </Alert>
          )
        ) : null}

        <FormField
          control={form.control}
          name="sites"
          render={({ field }) => (
            <FormItem>
              <Label htmlFor="add-module-sites">{t('modules.sites')}</Label>
              <SitesCombobox id="add-module-sites" value={field.value} onChange={field.onChange} />
              <FormDescription>{t('modules.sitesHelp')}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onDone}>
            {t('common.cancel')}
          </Button>
          <Button type="submit">
            {t('modules.add')}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  )
}

function OnErrorSelect({ control }: { control: Control<AddValues> }) {
  const { t } = useTranslation()
  return (
    <FormField
      control={control}
      name="onError"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t('modules.onErrorLabel')}</FormLabel>
          <Select value={field.value} onValueChange={field.onChange}>
            <FormControl>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {onErrorOptions(t).map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormDescription>{t('modules.onErrorHelp')}</FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

/** The page file names, each in code, separated by commas. */
function filesList() {
  return PAGE_FILES.map((f, i) => (
    <Fragment key={f}>
      {i ? ', ' : ''}
      <code className="font-mono">{f}</code>
    </Fragment>
  ))
}
