export type Dictionary = {
  meta: {
    siteName: string;
    siteDescription: string;
    home: { title: string; description: string };
    services: { title: string; description: string };
    pricing: { title: string; description: string };
    blog: { title: string; description: string };
    contact: { title: string; description: string };
    privacy: { title: string; description: string };
    terms: { title: string; description: string };
  };
  nav: {
    home: string;
    services: string;
    pricing: string;
    blog: string;
    contact: string;
    login: string;
    cta: string;
  };
  hero: {
    badge: string;
    title: string;
    subtitle: string;
    ctaPrimary: string;
    ctaSecondary: string;
    trustLine: string;
    dashboard: {
      overview: string;
      status: string;
      growthScore: string;
      growthScoreValue: string;
      opportunities: string;
      opportunitiesValue: string;
      needsReview: string;
      needsReviewValue: string;
      nextAction: string;
      nextActionValue: string;
      prepared: string;
      preparedItems: string;
    };
  };
  trust: {
    items: string[];
  };
  problem: {
    title: string;
    subtitle: string;
    items: string[];
  };
  solution: {
    title: string;
    subtitle: string;
    items: { title: string; description: string }[];
  };
  outputs: {
    title: string;
    subtitle: string;
    items: string[];
    trustNote: string;
  };
  aiSearch: {
    eyebrow: string;
    title: string;
    description: string;
    disclaimer: string;
  };
  autopilotModes: {
    title: string;
    subtitle: string;
    reviewMode: {
      badge: string;
      title: string;
      description: string;
    };
    autoPublishMode: {
      badge: string;
      title: string;
      description: string;
    };
    safeguards: string[];
    note: string;
  };
  pricingPreview: {
    title: string;
    subtitle: string;
    trustNote: string;
    plans: { name: string; description: string }[];
  };
  whatWeDo: {
    title: string;
    subtitle: string;
    items: string[];
  };
  forWhom: {
    title: string;
    subtitle: string;
    items: string[];
  };
  services: {
    title: string;
    subtitle: string;
    viewAll: string;
    learnMore: string;
    pageTitle: string;
    pageSubtitle: string;
    ctaConsultation: string;
    whatsIncluded: string;
  };
  process: {
    title: string;
    subtitle: string;
    steps: { title: string; description?: string }[];
  };
  pricing: {
    title: string;
    subtitle: string;
    popular: string;
    pageTitle: string;
    pageSubtitle: string;
    comparisonTitle: string;
    customNote: string;
  };
  pricingFaq: {
    title: string;
    subtitle: string;
  };
  stats: {
    title: string;
    items: { value: string; label: string; description: string }[];
  };
  testimonials: {
    title: string;
    subtitle: string;
    items: { quote: string; author: string; role: string; company: string }[];
  };
  faq: {
    title: string;
    subtitle: string;
  };
  cta: {
    title: string;
    subtitle: string;
    button: string;
    note: string;
  };
  blog: {
    title: string;
    subtitle: string;
    readMore: string;
    readTime: string;
    min: string;
    related: string;
    backToBlog: string;
    allArticles: string;
    noArticles: string;
    allCategories: string;
  };
  contact: {
    title: string;
    subtitle: string;
    form: {
      name: string;
      namePlaceholder: string;
      email: string;
      emailPlaceholder: string;
      phone: string;
      phonePlaceholder: string;
      website: string;
      websitePlaceholder: string;
      budget: string;
      budgetPlaceholder: string;
      service: string;
      servicePlaceholder: string;
      plan: string;
      planPlaceholder: string;
      message: string;
      messagePlaceholder: string;
      websiteOrMessageHint: string;
      websiteOrMessageError: string;
      submit: string;
      submitting: string;
      success: string;
      error: string;
    };
    info: {
      title: string;
      email: string;
      response: string;
      responseTime: string;
    };
    serviceTypes: {
      "seo-audit": string;
      "technical-seo": string;
      "local-seo": string;
      "ecommerce-seo": string;
      "content-seo": string;
      "multilingual-seo": string;
      "landing-pages": string;
      "new-sites": string;
      other: string;
    };
    plans: {
      start: string;
      "local-boost": string;
      growth: string;
      partner: string;
      "not-sure": string;
    };
    budgets: {
      "under-200": string;
      "200-500": string;
      "500-1000": string;
      "over-1000": string;
      "not-sure": string;
    };
  };
  footer: {
    description: string;
    navigation: string;
    productTitle: string;
    blogTitle: string;
    trustNote: string;
    legal: string;
    privacy: string;
    terms: string;
    disclaimer: string;
    copyright: string;
  };
  privacy: {
    title: string;
    lastUpdated: string;
    sections: { title: string; content: string }[];
  };
  terms: {
    title: string;
    lastUpdated: string;
    sections: { title: string; content: string }[];
  };
  common: {
    readMore: string;
    getStarted: string;
    contactUs: string;
    backToHome: string;
    breadcrumbHome: string;
  };
};

export const dictionary: Dictionary = {
  meta: {
    siteName: "RankBoost.eu",
    siteDescription:
      "SEO-автопилот и AI Growth Manager для малого бизнеса — аудит сайта, возможности роста и готовые к проверке SEO, контент и соцсети для Google и AI-поиска.",
    home: {
      title: "RankBoost — SEO-автопилот для малого бизнеса",
      description:
        "Находите возможности роста сайта, готовьте SEO-задачи и контент, улучшайте видимость в Google и AI-поиске. Начните с режима проверки и автоматизируйте больше, когда будете готовы.",
    },
    services: {
      title: "Возможности SEO-автопилота | RankBoost.eu",
      description:
        "Что готовит SEO-автопилот: аудит, задачи роста, черновики контента, GSC и готовность к AI-поиску.",
    },
    pricing: {
      title: "Запустите SEO-автопилот | RankBoost.eu",
      description:
        "Начните бесплатно и переходите на платный план для большего числа действий, обзоров и будущих настроек автоматизации.",
    },
    blog: {
      title: "Рост сайта, SEO-автопилот и AI-поиск | RankBoost.eu",
      description:
        "Практические материалы для малого бизнеса: видимость в Google и AI-поиске без глубокой SEO-экспертизы.",
    },
    contact: {
      title: "Контакты | RankBoost.eu",
      description:
        "Вопросы о SEO-автопилоте? Расскажите о вашем сайте — мы ответим в ближайшее время.",
    },
    privacy: {
      title: "Политика конфиденциальности | RankBoost.eu",
      description:
        "Как RankBoost.eu обрабатывает данные аккаунта, сайта, интеграций и автоматизации в SaaS-платформе SEO-автопилота.",
    },
    terms: {
      title: "Условия использования | RankBoost.eu",
      description:
        "Условия использования SaaS-платформы RankBoost.eu — SEO-автопилот и AI Growth Manager.",
    },
  },
  nav: {
    home: "Главная",
    services: "Продукт",
    pricing: "Тарифы",
    blog: "Блог",
    contact: "Контакты",
    login: "Войти",
    cta: "Начать бесплатно",
  },
  hero: {
    badge: "SEO-автопилот",
    title: "SEO-автопилот для малого бизнеса",
    subtitle:
      "RankBoost анализирует сайт, находит возможности роста и готовит SEO-задачи, тексты и действия для соцсетей, чтобы улучшать видимость в Google и AI-поиске. Начните с режима проверки, а затем автоматизируйте больше, когда будете готовы.",
    ctaPrimary: "Начать бесплатно",
    ctaSecondary: "Как это работает",
    trustLine: "Сначала проверка. Автопубликация — только когда вы сами её включите.",
    dashboard: {
      overview: "Обзор роста вашего сайта",
      status: "Всё под контролем",
      growthScore: "Growth Score",
      growthScoreValue: "72 / 100",
      opportunities: "Возможности",
      opportunitiesValue: "4 найдено",
      needsReview: "Нужен обзор",
      needsReviewValue: "2 пункта",
      nextAction: "Следующий шаг",
      nextActionValue: "Проверить месячный план роста",
      prepared: "Подготовлено для вас",
      preparedItems: "Черновик статьи · посты · письмо на согласование",
    },
  },
  trust: {
    items: [
      "Начните в режиме проверки",
      "Автоматизируйте больше по вашим правилам",
      "Отмена в любой момент",
      "Google и AI-поиск",
    ],
  },
  problem: {
    title: "Знакомая ситуация?",
    subtitle:
      "Большинство малых бизнесов понимают, что сайт должен приносить клиентов, но не знают, с чего начать.",
    items: [
      "Не понятно, почему трафик из Google низкий",
      "Нет времени на SEO-контент и регулярные улучшения",
      "Неясно, что публиковать или улучшать дальше",
    ],
  },
  solution: {
    title: "RankBoost — ваш SEO-автопилот",
    subtitle:
      "Платформа находит возможности и готовит действия автоматически — вы решаете, что запускать в режиме проверки.",
    items: [
      {
        title: "Находит возможности",
        description:
          "Аудит сайта, задачи роста и SEO-приоритеты на основе сигналов вашего сайта.",
      },
      {
        title: "Готовит действия",
        description:
          "Месячный план, SEO-задачи, идеи контента и черновики для соцсетей — подготовлено для вас.",
      },
      {
        title: "Черновики на проверку",
        description:
          "Статьи, посты и письма в режиме проверки — вы одобряете перед публикацией.",
      },
      {
        title: "Отслеживает прогресс",
        description:
          "Growth Score, журнал активности и следующее действие автопилота всегда на виду.",
      },
    ],
  },
  outputs: {
    title: "Что может подготовить SEO-автопилот",
    subtitle: "Действия на проверку в режиме Review Mode — вы контролируете процесс.",
    items: [
      "SEO-задачи",
      "Месячный план роста",
      "Черновики статей",
      "Черновики постов",
      "Письма на согласование",
      "Черновики WordPress",
      "Проверки готовности к AI-поиску",
    ],
    trustNote: "Начните с действий на проверку. Автоматизируйте выбранные действия позже, когда включите правила.",
  },
  aiSearch: {
    eyebrow: "Google + AI-поиск",
    title: "Создано для Google и AI-поиска",
    description:
      "Люди находят бизнес не только через Google, но и через AI-ассистентов — ChatGPT, Gemini, Perplexity и другие. RankBoost помогает создавать более понятный и полезный контент, который отвечает на вопросы клиентов и лучше понимается поисковыми и AI-системами.",
    disclaimer:
      "RankBoost не гарантирует позиции или упоминания в AI, но помогает сделать сайт понятнее, структурированнее и доступнее для поисковых систем.",
  },
  autopilotModes: {
    title: "Выберите, сколько может делать SEO-автопилот",
    subtitle: "Начните безопасно в режиме проверки. Добавьте контролируемую автоматизацию, когда будете готовы.",
    reviewMode: {
      badge: "Доступно сейчас",
      title: "Режим проверки (Review Mode)",
      description:
        "RankBoost находит возможности и готовит действия, черновики, письма и контент WordPress на ваше одобрение. Вы решаете, что публиковать.",
    },
    autoPublishMode: {
      badge: "Планируемый контролируемый режим",
      title: "Режим автопубликации (Auto-Publish Mode)",
      description:
        "Будущий контролируемый режим для бизнеса, который хочет публиковать выбранные действия автоматически — только после явного включения, подключения интеграций и настройки правил.",
    },
    safeguards: [
      "Включается явно",
      "На основе правил",
      "Можно приостановить",
      "Журнал активности",
    ],
    note: "Auto-Publish Mode задуман как опциональный контролируемый слой автоматизации — по умолчанию не включён. Начните безопасно в Review Mode.",
  },
  pricingPreview: {
    title: "Запустите SEO-автопилот",
    subtitle:
      "Начните бесплатно и переходите на платный план, когда понадобится больше действий, черновиков, обзоров и будущих настроек автоматизации.",
    trustNote:
      "Без долгосрочных контрактов. Отмена в любой момент. Начните безопасно в режиме проверки.",
    plans: [
      { name: "Free", description: "Попробуйте RankBoost и оцените возможности роста вашего сайта." },
      { name: "Starter", description: "Для малого бизнеса с регулярными SEO и контент-действиями." },
      { name: "Pro", description: "Для растущего бизнеса: больше черновиков, инсайтов и рабочих процессов." },
      { name: "Agency", description: "Для агентств и команд с несколькими сайтами." },
    ],
  },
  whatWeDo: {
    title: "Что мы делаем",
    subtitle: "Комплексный подход к SEO",
    items: ["SEO-аудит", "Контент", "Local SEO"],
  },
  forWhom: {
    title: "Для кого",
    subtitle: "Малый и средний бизнес",
    items: ["локальный бизнес", "интернет-магазины"],
  },
  services: {
    title: "Возможности SEO-автопилота",
    subtitle: "Действия для роста, которые автопилот готовит на проверку",
    viewAll: "Все возможности",
    learnMore: "Подробнее",
    pageTitle: "Что SEO-автопилот может подготовить для вас",
    pageSubtitle:
      "Аудит, SEO-задачи, контент-план, черновики, GSC и готовность к AI-поиску — начните в режиме проверки, автоматизируйте больше по правилам.",
    ctaConsultation: "Начать бесплатно",
    whatsIncluded: "Что входит",
  },
  process: {
    title: "Как это работает",
    subtitle: "Простой путь от сайта к понятным следующим шагам",
    steps: [
      {
        title: "Добавьте сайт",
        description: "Укажите URL — RankBoost создаст рабочее пространство.",
      },
      {
        title: "RankBoost находит возможности",
        description: "Аудит, Growth Score и задачи для роста.",
      },
      {
        title: "Проверьте и одобрите",
        description: "Планы, черновики и письма — только после вашего решения.",
      },
      {
        title: "Отслеживайте прогресс",
        description: "Дашборд показывает, что сделано и что дальше.",
      },
    ],
  },
  pricing: {
    title: "Тарифы",
    subtitle: "SaaS-планы для роста сайта — начните бесплатно, переходите при необходимости",
    popular: "Популярный",
    pageTitle: "Запустите SEO-автопилот",
    pageSubtitle:
      "Начните бесплатно. Перейдите на платный план, когда понадобится больше действий и черновиков. Без долгосрочных контрактов. Начните в режиме проверки.",
    comparisonTitle: "Сравнение тарифов",
    customNote: "Оплата появится, когда биллинг будет настроен.",
  },
  pricingFaq: {
    title: "FAQ по тарифам",
    subtitle: "Ответы на частые вопросы о планах и оплате",
  },
  stats: {
    title: "Цифры, которые говорят сами за себя",
    items: [
      {
        value: "+180%",
        label: "Рост органического трафика",
        description: "Средний результат клиентов за 6 месяцев",
      },
      {
        value: "3–4 мес",
        label: "До топ-3 в Maps",
        description: "Для Local SEO в Таллине",
      },
      {
        value: "100+",
        label: "Параметров аудита",
        description: "В каждом техническом SEO-отчёте",
      },
      {
        value: "98%",
        label: "Клиентов продлевают",
        description: "Контракт после первых 3 месяцев",
      },
    ],
  },
  testimonials: {
    title: "Отзывы клиентов",
    subtitle: "Реальные результаты для бизнеса в Эстонии",
    items: [
      {
        quote:
          "За 4 месяца органический трафик вырос на 220%. RankBoost понимает специфику эстонского рынка и работает на трёх языках.",
        author: "Мария К.",
        role: "Директор",
        company: "Beauty Studio Tallinn",
      },
      {
        quote:
          "Технический аудит выявил 47 критических ошибок. После исправления сайт начал индексироваться в 3 раза быстрее.",
        author: "Andres T.",
        role: "CEO",
        company: "TechShop.ee",
      },
      {
        quote:
          "Local SEO помог нам попасть в топ-3 Google Maps по 12 ключевым запросам. Заявки выросли в 2.5 раза.",
        author: "Dmitri S.",
        role: "Владелец",
        company: "RemontPro Tallinn",
      },
    ],
  },
  faq: {
    title: "Частые вопросы",
    subtitle: "Ответы на главные вопросы о SEO-продвижении",
  },
  cta: {
    title: "Превратите проблемы сайта в действия для роста",
    subtitle:
      "Запустите SEO-автопилот в режиме проверки — RankBoost подготовит следующие шаги на ваше одобрение.",
    button: "Начать бесплатно",
    note: "Без кредитной карты на Free-плане. Отмена в любой момент.",
  },
  blog: {
    title: "Рост сайта, SEO-автопилот и AI-поиск",
    subtitle:
      "Практические материалы для малого бизнеса: улучшайте видимость в Google и AI-поиске без глубокой SEO-экспертизы.",
    readMore: "Читать",
    readTime: "мин чтения",
    min: "мин",
    related: "Похожие статьи",
    backToBlog: "← Все статьи",
    allArticles: "Все статьи",
    noArticles: "В этой категории пока нет статей",
    allCategories: "Все",
  },
  contact: {
    title: "Свяжитесь с нами",
    subtitle:
      "Есть вопрос о SEO-автопилоте? Расскажите о вашем сайте — мы ответим в ближайшее время.",
    form: {
      name: "Имя",
      namePlaceholder: "Ваше имя",
      email: "Email",
      emailPlaceholder: "email@example.com",
      phone: "Телефон",
      phonePlaceholder: "",
      website: "URL сайта",
      websitePlaceholder: "https://yoursite.com",
      budget: "Бюджет",
      budgetPlaceholder: "",
      service: "Услуга",
      servicePlaceholder: "",
      plan: "Тариф",
      planPlaceholder: "",
      message: "Сообщение",
      messagePlaceholder: "Чем мы можем помочь с RankBoost?",
      websiteOrMessageHint: "Укажите URL сайта или короткое сообщение — нужно хотя бы одно поле.",
      websiteOrMessageError: "Укажите URL сайта или напишите сообщение.",
      submit: "Отправить сообщение",
      submitting: "Отправка...",
      success: "Спасибо! Заявка отправлена. Мы свяжемся с вами в ближайшее время.",
      error:
        "Не удалось отправить заявку. Попробуйте еще раз или напишите напрямую на info@rankboost.eu.",
    },
    info: {
      title: "Контактная информация",
      email: "Email",
      response: "Время ответа",
      responseTime: "В течение 24 часов в рабочие дни",
    },
    serviceTypes: {
      "seo-audit": "SEO-аудит",
      "technical-seo": "Техническое SEO",
      "local-seo": "Local SEO",
      "ecommerce-seo": "SEO для интернет-магазина",
      "content-seo": "SEO-контент и статьи",
      "multilingual-seo": "Мультиязычное SEO",
      "landing-pages": "Оптимизация посадочных страниц",
      "new-sites": "SEO для нового сайта",
      other: "Другое",
    },
    plans: {
      start: "Start SEO",
      "local-boost": "Local Boost",
      growth: "Growth SEO",
      partner: "SEO Partner",
      "not-sure": "Не определился",
    },
    budgets: {
      "under-200": "до 200 € / мес",
      "200-500": "200–500 € / мес",
      "500-1000": "500–1000 € / мес",
      "over-1000": "более 1000 € / мес",
      "not-sure": "Пока не знаю",
    },
  },
  footer: {
    description:
      "RankBoost.eu — SEO-автопилот и AI Growth Manager для малого бизнеса. Аудит, действия для роста и черновики для Google и AI-поиска.",
    navigation: "Навигация",
    productTitle: "Продукт",
    blogTitle: "Блог",
    trustNote:
      "По умолчанию — режим проверки. Автоматизация только при явном включении. Без долгосрочных контрактов. Отмена в любой момент.",
    legal: "Правовая информация",
    privacy: "Конфиденциальность",
    terms: "Условия",
    disclaimer:
      "Результаты роста зависят от состояния сайта, конкуренции и регулярной проверки рекомендованных действий.",
    copyright: "© {year} RankBoost.eu. Все права защищены.",
  },
  privacy: {
    title: "Политика конфиденциальности",
    lastUpdated: "Последнее обновление: 7 июля 2026",
    sections: [
      {
        title: "1. Общие положения",
        content:
          "RankBoost.eu («мы») — SaaS-платформа SEO-автопилота и AI Growth Manager. Настоящая политика описывает, как мы собираем и используем данные при использовании rankboost.eu, создании аккаунта, работе в личном кабинете или обращении через контактную форму.",
      },
      {
        title: "2. Какие данные мы собираем",
        content:
          "В зависимости от использования RankBoost мы можем обрабатывать: данные аккаунта (имя, email), URL сайта и домена, данные аудита и возможностей роста, черновики контента и соцсетей, подготовленные на ваше одобрение, метаданные интеграций (например, выбранный сайт Google Search Console или параметры подключения WordPress, если вы их подключаете), настройки автоматизации и журналы действий, если вы включаете функции автоматизации (когда они доступны), данные подписки и оплаты при включённых платных тарифах через платёжного провайдера, сообщения из контактной формы (имя, email, URL сайта, текст), а также технические логи (IP-адрес, тип браузера, referrer, идентификаторы сессии).",
      },
      {
        title: "3. Как мы используем данные",
        content:
          "Данные используются для работы платформы, проведения аудитов, подготовки рекомендаций и черновиков на ваше одобрение, управления аккаунтом и подпиской, ответов на запросы и улучшения сервиса. Мы не продаём персональные данные третьим лицам для маркетинговых целей. Если вы подключаете интеграцию (Google Search Console, WordPress и т.п.), RankBoost обрабатывает только данные, необходимые для её работы. Если функции автоматизации доступны и вы их включаете, RankBoost может обрабатывать настройки, правила, журналы и контент, необходимые для выполнения этих действий.",
      },
      {
        title: "4. Хранение и безопасность",
        content:
          "Данные хранятся на защищённых серверах в ЕС. Мы применяем разумные меры безопасности в соответствии с GDPR. Ни один способ передачи или хранения не является абсолютно безопасным.",
      },
      {
        title: "5. Ваши права",
        content:
          "Вы имеете право на доступ, исправление и удаление персональных данных в пределах применимого законодательства. Запросы: info@rankboost.eu.",
      },
      {
        title: "6. Cookies",
        content:
          "Сайт и личный кабинет могут использовать cookies и аналогичные технологии для авторизации, языковых настроек, аналитики и базовой работы платформы. Вы можете ограничить cookies в браузере, но часть функций может работать некорректно без них.",
      },
    ],
  },
  terms: {
    title: "Условия использования",
    lastUpdated: "Последнее обновление: 7 июля 2026",
    sections: [
      {
        title: "1. Общие условия",
        content:
          "RankBoost.eu предоставляет программные инструменты SaaS SEO-автопилота, которые помогают анализировать сайты, находить возможности роста, готовить SEO-, контент- и соцрекомендации и управлять черновиками на одобрение и рабочими процессами автоматизации. Используя сайт или создавая аккаунт, вы соглашаетесь с настоящими условиями.",
      },
      {
        title: "2. Использование платформы и ваша ответственность",
        content:
          "По умолчанию RankBoost работает в режиме проверки. Платформа может формировать аудиты, рекомендации, черновики и планы действий на ваше одобрение. Вы отвечаете за проверку рекомендаций перед публикацией, отправкой или применением. Контент и действия готовятся на ваше одобрение, если вы явно не включите доступные функции автоматизации. Автоматическая публикация или отправка, когда они доступны, требуют явной настройки, подключённых интеграций и правил.",
      },
      {
        title: "3. Отсутствие гарантий результата",
        content:
          "RankBoost не гарантирует позиции в поиске, упоминания в AI-ассистентах, трафик, выручку, лиды или иные бизнес-результаты. Итог зависит от сайта, конкуренции, качества контента, подключённых интеграций и того, насколько регулярно вы проверяете и применяете рекомендации.",
      },
      {
        title: "4. Подписки и оплата",
        content:
          "Платные тарифы, лимиты и цены отображаются в приложении. Долгосрочных контрактов нет; подписку можно отменить согласно условиям биллинга в аккаунте, когда оплата включена. Бесплатные и платные функции могут меняться по мере развития продукта.",
      },
      {
        title: "5. Сторонние интеграции",
        content:
          "Функции Google Search Console, черновиков WordPress, оплаты через Stripe или отправки email могут требовать вашего разрешения и зависят от сторонних провайдеров. RankBoost не отвечает за их сбои, изменения политик или ограничения.",
      },
      {
        title: "6. Контакты и конфиденциальность",
        content:
          "Отправка контактной формы не создаёт договор. Мы не раскрываем данные аккаунта или клиентов третьим лицам без согласия, кроме случаев, предусмотренных законом. Вопросы: info@rankboost.eu.",
      },
    ],
  },
  common: {
    readMore: "Подробнее",
    getStarted: "Начать",
    contactUs: "Связаться",
    backToHome: "На главную",
    breadcrumbHome: "Главная",
  },
};
