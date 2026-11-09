// Strings that the checking-page designer needs beyond the legacy keys in src/locales.
import i18n from '@/lib/i18n'

const en = {
  page: {
    tabs: {
      texts: 'Texts',
      look: 'Look & theme',
      mascot: 'Mascot & images',
      progress: 'Progress & behavior',
      languages: 'Languages',
      advanced: 'Advanced & CSS',
    },
    slot: {
      uploading: 'Uploading…',
    },
  },
}

const ru = {
  page: {
    tabs: {
      texts: 'Тексты',
      look: 'Оформление и тема',
      mascot: 'Маскот и изображения',
      progress: 'Прогресс и поведение',
      languages: 'Языки',
      advanced: 'Дополнительно и CSS',
    },
    slot: {
      uploading: 'Загрузка…',
    },
  },
}

const uk = {
  page: {
    tabs: {
      texts: 'Тексти',
      look: 'Оформлення і тема',
      mascot: 'Маскот і зображення',
      progress: 'Прогрес і поведінка',
      languages: 'Мови',
      advanced: 'Додатково і CSS',
    },
    slot: {
      uploading: 'Завантаження…',
    },
  },
}

i18n.addResourceBundle('en', 'translation', en, true, false)
i18n.addResourceBundle('ru', 'translation', ru, true, false)
i18n.addResourceBundle('uk', 'translation', uk, true, false)
