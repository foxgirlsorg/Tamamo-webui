// Strings the modules screen needs on top of src/locales. Keys that already exist
// there are used as they are. These are the extra ones (combobox, key/value
// settings, cookie switch, stricter limits that match the Go backend).

import i18n from '@/lib/i18n'

const en = {
  modules: {
    sitesSearch: 'Search sites',
    sitesNoMatch: 'No site matches.',
    sitesRemove: 'Remove {name}',
    sendCookies: 'Send cookies',
    sendCookiesHelp: 'Off: the webhook does not see the visitor’s cookies. Turn it on only if the webhook needs them.',
    errCache: 'Cache must be a whole number from 0 to 3600 seconds.',
    errTimeoutMax: 'The timeout must be between 1 and 10,000 ms.',
    settingsTitle: 'Settings',
    kvTitle: 'Other settings',
    kvHelp: 'Free-form options the module reads, as key and value pairs. Leave them out when the module needs none.',
    kvKey: 'Key',
    kvValue: 'Value',
    kvAdd: 'Add setting',
    kvRemove: 'Remove setting {key}',
    kvEmptyKey: 'Give this setting a key.',
    kvNone: 'No other settings.',
  },
}

const ru = {
  modules: {
    sitesSearch: 'Поиск сайтов',
    sitesNoMatch: 'Ни один сайт не подходит.',
    sitesRemove: 'Убрать {name}',
    sendCookies: 'Передавать cookie',
    sendCookiesHelp: 'Выключено: вебхук не видит cookie посетителя. Включайте, только если вебхуку они нужны.',
    errCache: 'Кэш должен быть целым числом от 0 до 3600 секунд.',
    errTimeoutMax: 'Тайм-аут должен быть от 1 до 10 000 мс.',
    settingsTitle: 'Настройки',
    kvTitle: 'Другие настройки',
    kvHelp: 'Произвольные параметры, которые читает модуль, в виде пар «ключ — значение». Не добавляйте их, если модулю они не нужны.',
    kvKey: 'Ключ',
    kvValue: 'Значение',
    kvAdd: 'Добавить настройку',
    kvRemove: 'Удалить настройку {key}',
    kvEmptyKey: 'Укажите ключ настройки.',
    kvNone: 'Других настроек нет.',
  },
}

const uk = {
  modules: {
    sitesSearch: 'Пошук сайтів',
    sitesNoMatch: 'Жоден сайт не підходить.',
    sitesRemove: 'Прибрати {name}',
    sendCookies: 'Передавати cookie',
    sendCookiesHelp: 'Вимкнено: вебхук не бачить cookie відвідувача. Вмикайте, лише якщо вебхуку вони потрібні.',
    errCache: 'Кеш має бути цілим числом від 0 до 3600 секунд.',
    errTimeoutMax: 'Тайм-аут має бути від 1 до 10 000 мс.',
    settingsTitle: 'Налаштування',
    kvTitle: 'Інші налаштування',
    kvHelp: 'Довільні параметри, які читає модуль, у вигляді пар «ключ — значення». Не додавайте їх, якщо модулю вони не потрібні.',
    kvKey: 'Ключ',
    kvValue: 'Значення',
    kvAdd: 'Додати налаштування',
    kvRemove: 'Видалити налаштування {key}',
    kvEmptyKey: 'Вкажіть ключ налаштування.',
    kvNone: 'Інших налаштувань немає.',
  },
}

i18n.addResourceBundle('en', 'translation', en, true, false)
i18n.addResourceBundle('ru', 'translation', ru, true, false)
i18n.addResourceBundle('uk', 'translation', uk, true, false)
