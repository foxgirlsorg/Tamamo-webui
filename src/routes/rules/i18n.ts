// Strings the rules screen needs beyond the legacy keys in src/locales.
// Imported once at the top of ./index.tsx.

import i18n from '@/lib/i18n'

const en = {
  rules: {
    tags: {
      hint: 'Press Enter to add each entry. Pasting several lines adds them all.',
      remove: 'Remove {value}',
    },
  },
  tester: {
    headers: 'Headers',
    headersHelp: 'Optional. Only needed for rules that match on a header.',
    headerValue: 'Header value',
    removeHeader: 'Remove header',
  },
  rulesFile: {
    keysCm: '{save} saves the file. Tab moves focus out of the editor.',
  },
}

const ru = {
  rules: {
    tags: {
      hint: 'Нажмите Enter, чтобы добавить запись. Вставка нескольких строк добавит их все.',
      remove: 'Удалить {value}',
    },
  },
  tester: {
    headers: 'Заголовки',
    headersHelp: 'Необязательно. Нужно только для правил, которые проверяют заголовок.',
    headerValue: 'Значение заголовка',
    removeHeader: 'Удалить заголовок',
  },
  rulesFile: {
    keysCm: '{save} сохраняет файл. Tab переводит фокус за пределы редактора.',
  },
}

const uk = {
  rules: {
    tags: {
      hint: 'Натисніть Enter, щоб додати запис. Вставлення кількох рядків додасть їх усі.',
      remove: 'Видалити {value}',
    },
  },
  tester: {
    headers: 'Заголовки',
    headersHelp: "Необов'язково. Потрібно лише для правил, що перевіряють заголовок.",
    headerValue: 'Значення заголовка',
    removeHeader: 'Видалити заголовок',
  },
  rulesFile: {
    keysCm: '{save} зберігає файл. Tab переводить фокус за межі редактора.',
  },
}

i18n.addResourceBundle('en', 'translation', en, true, false)
i18n.addResourceBundle('ru', 'translation', ru, true, false)
i18n.addResourceBundle('uk', 'translation', uk, true, false)
