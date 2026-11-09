import { useState } from 'react'
import { Check, ChevronsUpDown, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { useDraft } from '@/lib/draft-context'

import { siteOptions, sitesSummary, siteNameFor } from './helpers'

interface SitesComboboxProps {
  id?: string
  /** Selected site IDs ("default" for the default site). Empty means every site. */
  value: string[]
  onChange: (ids: string[]) => void
  invalid?: boolean
}

/**
 * Multi-select of sites for a module (Popover + Command). Empty selection = all
 * sites. Options follow the draft, so a site added on this screen shows up here.
 */
export function SitesCombobox({ id, value, onChange, invalid }: SitesComboboxProps) {
  const { t } = useTranslation()
  const { draft } = useDraft()
  const [open, setOpen] = useState(false)
  const options = siteOptions(t, draft)

  const toggle = (siteId: string) => {
    const next = value.includes(siteId) ? value.filter((x) => x !== siteId) : [...value, siteId]
    // Keep the order of the options, like the sites list.
    onChange(options.map((o) => o.id).filter((x) => next.includes(x)))
  }

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-invalid={invalid || undefined}
            className="w-full justify-between font-normal"
          >
            <span className="truncate">{sitesSummary(t, draft, value)}</span>
            <ChevronsUpDown className="opacity-50" aria-hidden />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
          <Command>
            <CommandInput placeholder={t('modules.sitesSearch')} />
            <CommandList>
              <CommandEmpty>{t('modules.sitesNoMatch')}</CommandEmpty>
              <CommandGroup>
                {options.map((o) => {
                  const selected = value.includes(o.id)
                  return (
                    <CommandItem key={o.id} value={`${o.name} ${o.id}`} onSelect={() => toggle(o.id)}>
                      <Check className={cn('size-4', selected ? 'opacity-100' : 'opacity-0')} aria-hidden />
                      <span className="truncate">{o.name}</span>
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {value.length ? (
        <div className="flex flex-wrap gap-1.5">
          {value.map((siteId) => (
            <Badge key={siteId} variant="secondary" className="gap-1 pr-1">
              {siteNameFor(t, draft, siteId)}
              <button
                type="button"
                className="rounded-sm p-0.5 hover:bg-muted-foreground/20"
                aria-label={t('modules.sitesRemove', { name: siteNameFor(t, draft, siteId) })}
                onClick={() => toggle(siteId)}
              >
                <X className="size-3" aria-hidden />
              </button>
            </Badge>
          ))}
        </div>
      ) : null}
    </div>
  )
}
