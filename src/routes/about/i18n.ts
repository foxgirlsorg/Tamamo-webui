import i18n from '@/lib/i18n'

// About screen strings that the shared locale files do not have yet.
// Each language is added as its own bundle (deep merge, no overwrite).

i18n.addResourceBundle(
  'en',
  'translation',
  {
    about: {
      settingsTitle: 'Settings file',
      settingsDesc:
        'Everything you save here is written to {file} in the data directory. You can edit that file by hand too.',
      webuiNote:
        'This web UI is optional. It runs only while the backend has TAMAMO_ENABLE_API=true; without it, Tamamo runs from its settings file alone.',
    },
  },
  true,
  false,
)

i18n.addResourceBundle(
  'ru',
  'translation',
  {
    about: {
      settingsTitle: 'Файл настроек',
      settingsDesc:
        'Всё, что вы сохраняете здесь, записывается в {file} в каталоге данных. Этот файл можно редактировать и вручную.',
      webuiNote:
        'Веб-интерфейс необязателен. Он работает только при TAMAMO_ENABLE_API=true; без него Tamamo работает только по файлу настроек.',
    },
  },
  true,
  false,
)

i18n.addResourceBundle(
  'uk',
  'translation',
  {
    about: {
      settingsTitle: 'Файл налаштувань',
      settingsDesc:
        'Усе, що ви зберігаєте тут, записується у {file} у каталозі даних. Цей файл можна редагувати і вручну.',
      webuiNote:
        'Веб-інтерфейс необов’язковий. Він працює лише за TAMAMO_ENABLE_API=true; без нього Tamamo працює лише за файлом налаштувань.',
    },
  },
  true,
  false,
)
