// Languages tab: which language the page uses (auto, main or a translation),
// translation tabs, add and remove languages, and the texts and labels of the
// selected language (legacy textPanel "lang" card and addTranslationDialog).

import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Languages, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Field } from '@/components/fields'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { Rich, SelectField } from './controls'
import { useDesigner } from './designer-store'
import { LANG_CODE, langLabel, newTranslation } from './page-model'
import { TextEditor } from './text-editor'

export function LanguagesTab() {
  const { t } = useTranslation()
  const { page, edit, editLang, setEditLang } = useDesigner()
  const [addOpen, setAddOpen] = useState(false)
  const [removeOpen, setRemoveOpen] = useState(false)

  const codes = Object.keys(page.translations ?? {}).sort()
  const mainLang = page.lang || 'en'
  const options = [
    { value: 'auto', label: t('page.lang.languageAuto') },
    { value: mainLang, label: langLabel(mainLang) },
    ...codes.filter((c) => c !== mainLang).map((c) => ({ value: c, label: langLabel(c) })),
  ]
  const languageValue = options.some((o) => o.value === page.language) ? page.language : 'auto'
  const tabValue = editLang || 'main'

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{t('page.lang.title')}</CardTitle>
          <CardDescription>{t('page.lang.desc')}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <SelectField
            id="page-language"
            label={t('page.lang.language')}
            help={t('page.lang.languageHelp')}
            value={languageValue}
            options={options}
            onChange={(v) => edit((p) => {
              p.auto_language = v === 'auto'
              p.language = v
            })}
          />

          <Tabs value={tabValue} onValueChange={(v) => setEditLang(v === 'main' ? '' : v)} className="grid gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <TabsList className="h-auto flex-wrap justify-start">
                <TabsTrigger value="main">{t('page.lang.mainTab', { lang: langLabel(mainLang) })}</TabsTrigger>
                {codes.map((c) => (
                  <TabsTrigger key={c} value={c}>
                    {langLabel(c)}
                  </TabsTrigger>
                ))}
              </TabsList>
              <Button variant="outline" size="sm" onClick={() => setAddOpen(true)}>
                <Plus aria-hidden />
                {t('page.lang.add')}
              </Button>
              {editLang ? (
                <Button variant="ghost" size="sm" onClick={() => setRemoveOpen(true)}>
                  <Trash2 aria-hidden />
                  {t('page.lang.remove', { lang: langLabel(editLang) })}
                </Button>
              ) : null}
            </div>
          </Tabs>

          {editLang ? (
            <Alert>
              <Languages aria-hidden />
              <AlertTitle>{t('page.lang.fallbackTitle', { lang: langLabel(editLang) })}</AlertTitle>
              <AlertDescription>{t('page.lang.fallbackDesc')}</AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
      </Card>

      <TextEditor key={tabValue} target={tabValue} />

      <AddLanguageDialog open={addOpen} onOpenChange={setAddOpen} />
      {editLang ? <RemoveLanguageDialog code={editLang} open={removeOpen} onOpenChange={setRemoveOpen} /> : null}
    </div>
  )
}

interface AddLanguageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function AddLanguageDialog({ open, onOpenChange }: AddLanguageDialogProps) {
  const { t } = useTranslation()
  const { page, defaults, edit, setEditLang } = useDesigner()
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | undefined>(undefined)
  const mainLang = (page.lang || 'en').toLowerCase()

  const close = (next: boolean) => {
    if (!next) {
      setCode('')
      setError(undefined)
    }
    onOpenChange(next)
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const c = code.trim().toLowerCase()
    if (!LANG_CODE.test(c)) {
      setError(t('page.lang.errCode'))
      return
    }
    if (c === mainLang) {
      setError(t('page.lang.errMain', { lang: langLabel(c) }))
      return
    }
    if (page.translations?.[c]) {
      setError(t('page.lang.errExists', { lang: langLabel(c) }))
      return
    }
    const builtin = defaults.translations?.[c]
    edit((p) => {
      p.translations[c] = newTranslation(builtin)
    })
    setEditLang(c)
    toast.info(t('page.lang.added', { lang: langLabel(c) }), {
      description: builtin ? t('page.lang.addedBuiltin') : t('page.lang.addedEmpty'),
    })
    close(false)
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent>
        <form onSubmit={submit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>{t('page.lang.addTitle')}</DialogTitle>
            <DialogDescription>{t('page.lang.addDesc')}</DialogDescription>
          </DialogHeader>
          <Field id="new-language-code" label={t('page.lang.code')} help={<Rich text={t('page.lang.codeHelp')} />} error={error}>
            <Input
              id="new-language-code"
              value={code}
              placeholder="de"
              maxLength={12}
              autoComplete="off"
              spellCheck={false}
              className="font-mono"
              aria-describedby="new-language-code-help"
              aria-invalid={error ? true : undefined}
              autoFocus
              onChange={(e) => {
                setCode(e.target.value)
                setError(undefined)
              }}
            />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => close(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit">{t('page.lang.add')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

interface RemoveLanguageDialogProps {
  code: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

function RemoveLanguageDialog({ code, open, onOpenChange }: RemoveLanguageDialogProps) {
  const { t } = useTranslation()
  const { edit, setEditLang } = useDesigner()
  const name = langLabel(code)

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('page.lang.removeTitle', { lang: name })}</AlertDialogTitle>
          <AlertDialogDescription>{t('page.lang.removeDesc')}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={() => {
              edit((p) => {
                delete p.translations[code]
                if (p.language === code) {
                  p.language = 'auto'
                  p.auto_language = true
                }
              })
              setEditLang('')
              onOpenChange(false)
            }}
          >
            {t('page.lang.removeConfirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
