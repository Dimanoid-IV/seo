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
    popular: string;
    viewAllPlans: string;
    plans: { name: string; priceAmount: string; pricePeriod: string; description: string; cta: string }[];
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
  monthlyHowItWorks: {
    title: string;
    steps: string[];
    disclaimer: string;
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
        "RankBoost анализирует сайт, готовит месячный план статей, пишет в стиле бренда и может публиковать на WordPress после подтверждения плана. Начните в режиме проверки.",
    },
    services: {
      title: "Возможности SEO-автопилота | RankBoost.eu",
      description:
        "Аудит сайта, месячные планы роста, статьи в стиле бренда, публикация на WordPress после подтверждения плана и пакеты handoff для custom-сайтов.",
    },
    pricing: {
      title: "Запустите SEO-автопилот | RankBoost.eu",
      description:
        "Начните бесплатно, затем перейдите на платный план для большего числа действий, процессов проверки и опциональной автопубликации на WordPress после подтверждения плана. Без долгосрочных контрактов.",
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
      "RankBoost анализирует сайт, готовит месячный план статей и улучшений, пишет статьи в стиле бренда и может публиковать их автоматически на WordPress после вашего подтверждения плана.",
    ctaPrimary: "Начать бесплатно",
    ctaSecondary: "Как это работает",
    trustLine:
      "Вы подтверждаете план один раз в месяц. Автопилот можно остановить. Публикации можно откатить.",
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
      preparedItems: "Месячный план · черновик статьи · путь WordPress",
    },
  },
  trust: {
    items: [
      "Сначала подтвердите месячный план",
      "Остановите автопилот в любой момент",
      "Отмена в любой момент",
      "Без гарантий позиций",
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
      "Анализирует сайт, строит месячный план, пишет статьи в стиле бренда, затем публикует на WordPress после вашего подтверждения — или передаёт пакет для custom-сайтов.",
    items: [
      {
        title: "Анализирует сайт",
        description:
          "Аудит сайта, задачи роста и понятные SEO-приоритеты.",
      },
      {
        title: "Месячный план и статьи в стиле бренда",
        description:
          "Месячный план статей и улучшений, написанный в стиле вашего бренда — на проверку.",
      },
      {
        title: "Публикация под вашим контролем",
        description:
          "На WordPress RankBoost может автоматически публиковать статьи из одобренного плана после вашего подтверждения. Для custom-сайтов — экспорт, webhook или handoff разработчику.",
      },
      {
        title: "Пауза и откат",
        description:
          "Автопилот можно остановить в любой момент. Посты WordPress, опубликованные RankBoost, можно вернуть в черновик.",
      },
    ],
  },
  outputs: {
    title: "Что может подготовить SEO-автопилот",
    subtitle:
      "Сначала месячные планы и статьи — автопубликация на WordPress только после подтверждения плана.",
    items: [
      "SEO-задачи",
      "Месячный план роста",
      "Статьи в стиле бренда",
      "Черновики постов",
      "Публикация на WordPress (после подтверждения плана)",
      "Экспорт / webhook для custom-сайтов",
      "Проверки готовности к AI-поиску",
    ],
    trustNote:
      "WordPress: автоматическая публикация после подтверждения месячного плана. Custom-сайты: готовый пакет или webhook. Бэклинки и партнёрские сети пока не входят. Без гарантий позиций.",
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
    subtitle:
      "Начните безопасно в режиме проверки. Включите автопубликацию на WordPress, когда подтвердите месячный план.",
    reviewMode: {
      badge: "Доступно сейчас",
      title: "Режим проверки (Review Mode)",
      description:
        "RankBoost находит возможности и готовит планы, задачи и статьи на вашу проверку. Вы решаете, что публиковать.",
    },
    autoPublishMode: {
      badge: "WordPress после подтверждения плана",
      title: "Режим автопубликации (Auto-Publish Mode)",
      description:
        "После подтверждения месячного плана и выбора автопубликации RankBoost может публиковать одобренные статьи на WordPress по расписанию. Можно остановить в любой момент и вернуть посты в черновик.",
    },
    safeguards: [
      "Подтверждение плана раз в месяц",
      "WordPress подключён",
      "Можно приостановить",
      "Доступен откат",
    ],
    note: "Автопубликация опциональна и по умолчанию выключена. Custom-сайты получают пакет экспорта или webhook — это не то же самое, что живая публикация на WordPress. Без гарантий позиций.",
  },
  pricingPreview: {
    title: "Простые тарифы без долгосрочных контрактов",
    subtitle:
      "Начните бесплатно, а когда RankBoost начнёт приносить пользу — подключите больше автоматизации, задач и контента.",
    trustNote:
      "Без долгосрочных контрактов. Отмена в любой момент. Безопасная оплата через Stripe.",
    popular: "Популярный",
    viewAllPlans: "Смотреть все тарифы",
    plans: [
      {
        name: "Free",
        priceAmount: "€0",
        pricePeriod: "",
        description:
          "Попробуйте RankBoost и получите первый обзор возможностей роста.",
        cta: "Начать бесплатно",
      },
      {
        name: "Starter",
        priceAmount: "€19",
        pricePeriod: "/мес",
        description:
          "Для малого бизнеса, которому нужны регулярные SEO-задачи и понятный план роста.",
        cta: "Выбрать Starter",
      },
      {
        name: "Pro",
        priceAmount: "€49",
        pricePeriod: "/мес",
        description:
          "Для растущего бизнеса: больше инсайтов, контента и рабочих процессов.",
        cta: "Выбрать Pro",
      },
      {
        name: "Agency",
        priceAmount: "€149",
        pricePeriod: "/мес",
        description:
          "Для команд и агентств, которые ведут несколько сайтов.",
        cta: "Выбрать Agency",
      },
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
      "Аудит сайта, SEO-задачи, контент-планы, черновики, GSC и готовность к AI-поиску — начните в режиме проверки, автоматизируйте больше, когда включите правила.",
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
        description:
          "Подтвердите месячный план — затем RankBoost готовит материалы и может публиковать на WordPress.",
      },
      {
        title: "Отслеживайте прогресс",
        description: "Дашборд показывает, что сделано и что дальше.",
      },
    ],
  },
  monthlyHowItWorks: {
    title: "Как работает месячный автопилот",
    steps: [
      "Вы подтверждаете месячный план один раз.",
      "RankBoost пишет статьи в стиле бренда по расписанию.",
      "На WordPress с включённой автопубликацией одобренные статьи могут выходить автоматически.",
      "Автопилот можно остановить в любой момент и вернуть опубликованный пост в черновик.",
    ],
    disclaimer:
      "RankBoost не гарантирует позиции в Google, трафик или выручку. Результат зависит от сайта, конкуренции и регулярной публикации. Бэклинки пока не входят.",
  },
  pricing: {
    title: "Тарифы",
    subtitle: "SaaS-планы для роста сайта — начните бесплатно, переходите при необходимости",
    popular: "Популярный",
    pageTitle: "Запустите SEO-автопилот",
    pageSubtitle:
      "Начните бесплатно, затем перейдите на платный план для большего числа действий и опциональной автопубликации на WordPress после подтверждения плана. Без гарантий позиций в Google.",
    comparisonTitle: "Сравнение тарифов",
    customNote: "Оплата появится, когда биллинг будет настроен.",
  },
  pricingFaq: {
    title: "FAQ по тарифам",
    subtitle: "Ответы на частые вопросы о планах и оплате",
  },
  stats: {
    title: "Создано для занятого малого бизнеса",
    items: [
      {
        value: "1×",
        label: "Подтверждение плана раз в месяц",
        description: "Одобрите один раз — автопилот готовит по расписанию",
      },
      {
        value: "WP",
        label: "Автопубликация WordPress",
        description: "Опционально, после подтверждения плана",
      },
      {
        value: "3",
        label: "Языка",
        description: "Английский, русский и эстонский",
      },
      {
        value: "0",
        label: "Гарантий позиций",
        description: "Честный инструмент — результат зависит от вашего рынка",
      },
    ],
  },
  testimonials: {
    title: "Чего владельцы ждут от автопилота",
    subtitle: "Ясность и контроль — без пустых обещаний про позиции",
    items: [
      {
        quote:
          "Мне нужен был понятный месячный план и статьи в голосе бренда — без превращения в SEO-специалиста.",
        author: "Мария К.",
        role: "Директор",
        company: "Beauty Studio Tallinn",
      },
      {
        quote:
          "Аудит показал, что исправлять в первую очередь. Черновики и handoff для WordPress сделали публикацию управляемой.",
        author: "Andres T.",
        role: "CEO",
        company: "TechShop.ee",
      },
      {
        quote:
          "Хочу понятные следующие шаги на эстонском, русском и английском — и возможность остановить публикацию, если что-то выглядит не так.",
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
      "Начните бесплатно: RankBoost анализирует сайт и готовит месячный план. Подтвердите один раз — остановите и откатите в любой момент.",
    button: "Начать бесплатно",
    note: "Без кредитной карты на Free-плане. Отмена в любой момент. Без гарантий позиций.",
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
