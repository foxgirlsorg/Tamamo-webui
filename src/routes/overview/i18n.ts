// New strings for Overview and Activity (shared stats screens). Legacy keys
// live in src/locales; these only add the statistics on/off notice.

import i18n from '@/lib/i18n'

const en = {
  statsOff: {
    hint: 'Statistics are off by default. Turn them on to count requests, checks and blocks and to keep recent events. Nothing is recorded until then.',
    activityHint: 'Turn statistics on to record checks, solves, failures and blocks here.',
    enable: 'Turn statistics on',
    enabledToast: 'Statistics are on',
    addedToDraft: 'Statistics will turn on when you save your changes.',
    enabledDesc: 'Tamamo is recording traffic now. Numbers appear within seconds.',
    locked: "Statistics are set by an environment variable, so they can't be turned on here.",
  },
}

const ru: typeof en = {
  statsOff: {
    hint: 'Статистика по умолчанию выключена. Включите её, чтобы считать запросы, проверки и блокировки и сохранять последние события. До этого ничего не записывается.',
    activityHint: 'Включите статистику, чтобы здесь записывались проверки, решения, ошибки и блокировки.',
    enable: 'Включить статистику',
    enabledToast: 'Статистика включена',
    addedToDraft: 'Статистика включится, когда вы сохраните изменения.',
    enabledDesc: 'Tamamo уже записывает трафик. Данные появятся в течение нескольких секунд.',
    locked: 'Статистику задаёт переменная окружения, поэтому включить её здесь нельзя.',
  },
}

const uk: typeof en = {
  statsOff: {
    hint: 'Статистику за замовчуванням вимкнено. Увімкніть її, щоб рахувати запити, перевірки та блокування і зберігати останні події. Доти нічого не записується.',
    activityHint: "Увімкніть статистику, щоб тут записувалися перевірки, розв'язання, помилки та блокування.",
    enable: 'Увімкнути статистику',
    enabledToast: 'Статистику увімкнено',
    addedToDraft: 'Статистику буде увімкнено, коли ви збережете зміни.',
    enabledDesc: "Tamamo вже записує трафік. Дані з'являться протягом кількох секунд.",
    locked: 'Статистику задає змінна середовища, тож увімкнути її тут не можна.',
  },
}

i18n.addResourceBundle('en', 'translation', en, true, false)
i18n.addResourceBundle('ru', 'translation', ru, true, false)
i18n.addResourceBundle('uk', 'translation', uk, true, false)
