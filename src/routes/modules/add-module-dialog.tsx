import { useMemo } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useDraft } from '@/lib/draft-context'
import type { ModuleConfig, ModuleInfo } from '@/lib/types'

import { MODULE_NAME, uniqueModuleName } from './helpers'
import { SitesCombobox } from './sites-combobox'

interface AddModuleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Modules compiled into this build. */
  available: ModuleInfo[]
  /** Module preselected when the dialog opens (its "Add" button was used). */
  initialId?: string
  /** Called with the new entry; the screen adds it to the end of the list. */
  onAdd: (module: ModuleConfig) => void
}

/** Add-module dialog: pick a module of this build, name the entry and choose its sites. */
export function AddModuleDialog({ open, onOpenChange, available, initialId, onAdd }: AddModuleDialogProps) {
  const { t } = useTranslation()
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100svh-2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('modules.addTitle')}</DialogTitle>
          <DialogDescription>{t('modules.addDesc')}</DialogDescription>
        </DialogHeader>
        {/* Mounted only while open, so every opening starts from a clean form. */}
        {open ? <AddModuleForm available={available} initialId={initialId} onAdd={onAdd} onDone={() => onOpenChange(false)} /> : null}
      </DialogContent>
    </Dialog>
  )
}

function buildSchema(t: TFunction, available: ModuleInfo[], existing: ModuleConfig[]) {
  return z.object({
    module: z.string().refine((id) => available.some((a) => a.id === id), t('modules.errPick')),
    name: z
      .string()
      .trim()
      .regex(MODULE_NAME, t('modules.errName'))
      .refine((name) => !existing.some((m) => m.name === name), { error: (issue) => t('modules.errDuplicate', { name: String(issue.input) }) }),
    sites: z.array(z.string()),
  })
}

type AddValues = z.infer<ReturnType<typeof buildSchema>>

function AddModuleForm({
  available,
  initialId,
  onAdd,
  onDone,
}: {
  available: ModuleInfo[]
  initialId?: string
  onAdd: (module: ModuleConfig) => void
  onDone: () => void
}) {
  const { t } = useTranslation()
  const { draft } = useDraft()
  const schema = useMemo(() => buildSchema(t, available, draft.modules), [t, available, draft.modules])
  const first = available.find((a) => a.id === initialId) ?? available[0]

  const form = useForm<AddValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      module: first?.id ?? '',
      name: first ? uniqueModuleName(first.id, draft.modules) : '',
      sites: [],
    },
  })
  const moduleId = useWatch({ control: form.control, name: 'module' })
  const selected = available.find((a) => a.id === moduleId)

  const submit = form.handleSubmit((v) => {
    const entry: ModuleConfig = { name: v.name, enabled: true, sites: v.sites, on_error: 'continue', settings: {} }
    if (v.module !== v.name) entry.module = v.module
    onAdd(entry)
    onDone()
  })

  return (
    <Form {...form}>
      <form onSubmit={(e) => void submit(e)} className="space-y-5" noValidate>
        <FormField
          control={form.control}
          name="module"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('modules.moduleLabel')}</FormLabel>
              <Select
                value={field.value}
                onValueChange={(id) => {
                  field.onChange(id)
                  // Suggest a name for the new choice unless the admin typed their own.
                  if (!form.getFieldState('name').isDirty) form.setValue('name', uniqueModuleName(id, draft.modules))
                }}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {available.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selected?.description ? <FormDescription>{selected.description}</FormDescription> : null}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('modules.name')}</FormLabel>
              <FormControl>
                <Input {...field} className="font-mono" spellCheck={false} autoComplete="off" />
              </FormControl>
              <FormDescription>{t('modules.nameHelp')}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="sites"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('modules.sites')}</FormLabel>
              <SitesCombobox value={field.value} onChange={field.onChange} />
              <FormDescription>{t('modules.sitesHelp')}</FormDescription>
            </FormItem>
          )}
        />

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onDone}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={!available.length}>
            {t('modules.add')}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  )
}
