// Texts of the checking page for one language: the main texts ("main") or one
// translation. Includes the "Other wording" labels (legacy textPanel / labelsSection).

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Field } from '@/components/fields'
import { cn } from '@/lib/utils'
import type { Labels, PageTranslation } from '@/lib/types'

import { Rich, TextArea, TextField } from './controls'
import { useDesigner } from './designer-store'
import { LABEL_GROUPS, LABEL_HELP, PAGE_STATES } from './page-model'

interface TextEditorProps {
  /** "main" for the main language, or a translation code. */
  target: string
}

export function TextEditor({ target }: TextEditorProps) {
  const { t } = useTranslation()
  const { page, defaults, edit, editText, setPreviewState } = useDesigner()
  const [labelsOpen, setLabelsOpen] = useState(false)

  const isMain = target === 'main'
  const block: PageTranslation | undefined = isMain ? page : page.translations?.[target]
  if (!block) return null

  const fieldLang = isMain ? page.lang || undefined : target
  // Translations show the main text grayed out where they are empty.
  const hint = (get: (b: PageTranslation) => string): string | undefined => (isMain ? undefined : get(page) || undefined)
  const labelHint = (k: keyof Labels): string | undefined =>
    (isMain ? defaults.labels[k] : page.labels[k] || defaults.labels[k]) || undefined
  const idp = `text-${target}`
  const setBlock = (mutate: (b: PageTranslation) => void) => editText(target, mutate)

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{t('page.text.page')}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              id={`${idp}-title`}
              label={t('page.text.title')}
              value={block.title}
              placeholder={hint((b) => b.title)}
              lang={fieldLang}
              onChange={(v) => setBlock((b) => { b.title = v })}
            />
            {isMain ? (
              <TextField
                id={`${idp}-lang`}
                label={t('page.text.lang')}
                value={page.lang}
                placeholder="en"
                mono
                help={<Rich text={t('page.text.langHelp')} />}
                onChange={(v) => edit((p) => { p.lang = v })}
              />
            ) : (
              <Field id={`${idp}-lang`} label={t('page.text.lang')}>
                <code className="text-sm">{target}</code>
              </Field>
            )}
          </div>
          <TextArea
            id={`${idp}-noscript`}
            label={t('page.text.noscript')}
            rows={2}
            value={block.noscript}
            placeholder={hint((b) => b.noscript)}
            lang={fieldLang}
            onChange={(v) => setBlock((b) => { b.noscript = v })}
          />
          <TextField
            id={`${idp}-footer`}
            label={t('page.text.footer')}
            value={block.footer_text}
            placeholder={isMain ? t('page.text.footerPlaceholder') : hint((b) => b.footer_text)}
            lang={fieldLang}
            onChange={(v) => setBlock((b) => { b.footer_text = v })}
          />
        </CardContent>
      </Card>

      {PAGE_STATES.map((st) => (
        <Card key={st}>
          <CardHeader>
            <CardTitle>{t(`page.text.${st}`)}</CardTitle>
            <CardDescription>{t(`page.text.${st}Desc`)}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <TextField
              id={`${idp}-${st}-heading`}
              label={t('page.text.heading')}
              value={block.texts[st].heading}
              placeholder={hint((b) => b.texts[st].heading)}
              lang={fieldLang}
              onFocus={() => setPreviewState(st)}
              onChange={(v) => setBlock((b) => { b.texts[st].heading = v })}
            />
            <TextArea
              id={`${idp}-${st}-message`}
              label={t('page.text.message')}
              rows={3}
              value={block.texts[st].message}
              placeholder={hint((b) => b.texts[st].message)}
              lang={fieldLang}
              help={<Rich text={t('page.text.hostHelp')} />}
              onFocus={() => setPreviewState(st)}
              onChange={(v) => setBlock((b) => { b.texts[st].message = v })}
            />
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader>
          <CardTitle>{t('page.text.buttons')}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <TextField
            id={`${idp}-retry`}
            label={t('page.text.retry')}
            value={block.retry_label}
            placeholder={hint((b) => b.retry_label)}
            lang={fieldLang}
            onFocus={() => setPreviewState('error')}
            onChange={(v) => setBlock((b) => { b.retry_label = v })}
          />
          <TextField
            id={`${idp}-continue`}
            label={t('page.text.continue')}
            value={block.continue_label}
            placeholder={hint((b) => b.continue_label)}
            lang={fieldLang}
            help={<Rich text={t('page.text.continueHelp')} />}
            onFocus={() => setPreviewState('success')}
            onChange={(v) => setBlock((b) => { b.continue_label = v })}
          />
        </CardContent>
      </Card>

      <Collapsible open={labelsOpen} onOpenChange={setLabelsOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <button type="button" className="flex w-full items-center justify-between gap-4 rounded-xl px-6 text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
              <span className="font-semibold">{t('page.labels.title')}</span>
              <ChevronDown aria-hidden className={cn('size-4 shrink-0 transition-transform', labelsOpen && 'rotate-180')} />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="grid gap-6 pt-6">
              <p className="text-sm text-muted-foreground">
                <Rich text={t('page.labels.desc')} />
              </p>
              {LABEL_GROUPS.map(({ group, keys }) => (
                <div key={group} className="grid gap-3">
                  <h3 className="text-sm font-semibold">{t(`page.labels.group.${group}`)}</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {keys.map((k) => (
                      <TextField
                        key={k}
                        id={`${idp}-label-${k}`}
                        label={t(`page.labels.${k}`)}
                        value={block.labels[k]}
                        placeholder={labelHint(k)}
                        lang={fieldLang}
                        help={LABEL_HELP[k] ? <Rich text={t(`page.labels.${k}Help`)} /> : undefined}
                        onChange={(v) => setBlock((b) => { b.labels[k] = v })}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  )
}
