// New strings for the Activity screen (site filter). Other strings are legacy keys.

import i18n from '@/lib/i18n'

const en = {
  activity: {
    siteFilter: 'Site',
    siteFilterLabel: 'Filter events by site',
  },
}

const ru: typeof en = {
  activity: {
    siteFilter: 'Сайт',
    siteFilterLabel: 'Фильтр событий по сайту',
  },
}

const uk: typeof en = {
  activity: {
    siteFilter: 'Сайт',
    siteFilterLabel: 'Фільтр подій за сайтом',
  },
}

i18n.addResourceBundle('en', 'translation', en, true, false)
i18n.addResourceBundle('ru', 'translation', ru, true, false)
i18n.addResourceBundle('uk', 'translation', uk, true, false)
