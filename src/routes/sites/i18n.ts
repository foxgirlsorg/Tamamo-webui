import i18n from '@/lib/i18n'

// Strings the Sites screen needs beyond the legacy keys in src/locales/*.json.
// Imported at the top of index.tsx.

i18n.addResourceBundle(
  'en',
  'translation',
  {
    sites: {
      hostPlaceholder: 'Add a host name…',
      hostsTagHelp:
        'Type a host name, then press Enter or comma. `*.example.com` matches every subdomain. Exact names win over wildcards.',
      removeHost: 'Remove {host}',
      errNoHosts: 'Add at least one host name. Visitors reach a site only through its host names.',
      errDuplicateName: 'Another site already has this name.',
      errHostTaken: '{host} is already used by another site.',
    },
  },
  true,
  false,
)

i18n.addResourceBundle(
  'ru',
  'translation',
  {
    sites: {
      hostPlaceholder: 'Добавьте имя хоста…',
      hostsTagHelp:
        'Введите имя хоста и нажмите Enter или запятую. `*.example.com` подходит для всех поддоменов. Точные имена важнее масок.',
      removeHost: 'Удалить {host}',
      errNoHosts: 'Добавьте хотя бы одно имя хоста. Посетители попадают на сайт только по его именам хостов.',
      errDuplicateName: 'Другой сайт уже использует это имя.',
      errHostTaken: '{host} уже используется другим сайтом.',
    },
  },
  true,
  false,
)

i18n.addResourceBundle(
  'uk',
  'translation',
  {
    sites: {
      hostPlaceholder: 'Додайте ім’я хоста…',
      hostsTagHelp:
        'Введіть ім’я хоста і натисніть Enter або кому. `*.example.com` охоплює всі піддомени. Точні імена важливіші за маски.',
      removeHost: 'Видалити {host}',
      errNoHosts: 'Додайте принаймні одне ім’я хоста. Відвідувачі потрапляють на сайт лише за його іменами хостів.',
      errDuplicateName: 'Інший сайт уже використовує це ім’я.',
      errHostTaken: '{host} уже використовує інший сайт.',
    },
  },
  true,
  false,
)
