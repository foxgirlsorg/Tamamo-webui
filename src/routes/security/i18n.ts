import i18n from '@/lib/i18n'

// Security screen strings that the shared locale files do not have yet.
// Each language is added as its own bundle (deep merge, no overwrite).

i18n.addResourceBundle(
  'en',
  'translation',
  {
    security: {
      webuiTitle: 'Turning the web UI off',
      webuiDesc:
        "This admin and its API run only while the backend has TAMAMO_ENABLE_API=true. To turn them off, remove TAMAMO_ENABLE_API=true from the backend's environment and restart Tamamo. Tamamo keeps protecting your site with the saved settings, but nobody can change them from the web.",
      loginLockedTitle: 'The login is set by {env}',
      loginLockedDesc:
        'The username and password come from environment variables (TAMAMO_ADMIN_USERNAME and TAMAMO_ADMIN_PASSWORD), so they can’t be changed here. Change them there.',
    },
  },
  true,
  false,
)

i18n.addResourceBundle(
  'ru',
  'translation',
  {
    security: {
      webuiTitle: 'Как отключить веб-интерфейс',
      webuiDesc:
        'Эта панель и её API работают только пока в окружении бэкенда задано TAMAMO_ENABLE_API=true. Чтобы их отключить, уберите TAMAMO_ENABLE_API=true из окружения бэкенда и перезапустите Tamamo. Tamamo продолжит защищать сайт с сохранёнными настройками, но изменить их через веб уже нельзя.',
      loginLockedTitle: 'Вход задан переменной {env}',
      loginLockedDesc:
        'Имя пользователя и пароль берутся из переменных окружения (TAMAMO_ADMIN_USERNAME и TAMAMO_ADMIN_PASSWORD), поэтому здесь их нельзя изменить. Измените их там.',
    },
  },
  true,
  false,
)

i18n.addResourceBundle(
  'uk',
  'translation',
  {
    security: {
      webuiTitle: 'Як вимкнути веб-інтерфейс',
      webuiDesc:
        'Ця панель і її API працюють лише тоді, коли в оточенні бекенда задано TAMAMO_ENABLE_API=true. Щоб їх вимкнути, приберіть TAMAMO_ENABLE_API=true з оточення бекенда і перезапустіть Tamamo. Tamamo продовжить захищати сайт зі збереженими налаштуваннями, але змінити їх через веб уже не можна.',
      loginLockedTitle: 'Вхід задано змінною {env}',
      loginLockedDesc:
        'Ім’я користувача і пароль беруться зі змінних оточення (TAMAMO_ADMIN_USERNAME та TAMAMO_ADMIN_PASSWORD), тому тут їх не можна змінити. Змініть їх там.',
    },
  },
  true,
  false,
)
