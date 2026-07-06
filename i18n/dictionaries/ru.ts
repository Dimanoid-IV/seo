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
    title: string;
    description: string;
  };
  control: {
    title: string;
    items: string[];
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
    servicesTitle: string;
    blogTitle: string;
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
      "SEO-продвижение сайтов в Эстонии и Европе. Техническое SEO, Local SEO, аудит и контентное продвижение для малого и среднего бизнеса.",
    home: {
      title: "RankBoost — AI Growth Manager для малого бизнеса",
      description:
        "Находите возможности роста сайта, готовьте SEO и контент-действия и улучшайте видимость в Google и AI-поиске — с вашим контролем на каждом шаге.",
    },
    services: {
      title: "SEO-услуги | RankBoost.eu",
      description:
        "Техническое SEO, Local SEO, SEO-аудит, контентное продвижение и сопровождение для бизнеса в Эстонии и Европе.",
    },
    pricing: {
      title: "Тарифы на SEO | RankBoost.eu",
      description:
        "Прозрачные тарифы на SEO-услуги: от разового аудита до комплексного сопровождения. Пакеты для локального бизнеса и интернет-магазинов.",
    },
    blog: {
      title: "SEO-блог | RankBoost.eu",
      description:
        "Экспертные статьи о SEO, Local SEO, технической оптимизации и контентной стратегии для бизнеса в Эстонии.",
    },
    contact: {
      title: "Контакты | RankBoost.eu",
      description:
        "Свяжитесь с RankBoost.eu для бесплатной SEO-консультации. Продвижение сайтов в Эстонии и Европе.",
    },
    privacy: {
      title: "Политика конфиденциальности | RankBoost.eu",
      description: "Политика конфиденциальности RankBoost.eu — как мы обрабатываем ваши данные.",
    },
    terms: {
      title: "Условия использования | RankBoost.eu",
      description: "Условия использования услуг RankBoost.eu.",
    },
  },
  nav: {
    home: "Главная",
    services: "Услуги",
    pricing: "Тарифы",
    blog: "Блог",
    contact: "Контакты",
    login: "Войти",
    cta: "Начать бесплатно",
  },
  hero: {
    badge: "AI Growth Manager",
    title: "Ваш AI Growth Manager для лучшей видимости сайта",
    subtitle:
      "RankBoost проверяет сайт, находит SEO и контент-возможности, готовит действия для роста и помогает улучшить видимость в Google и AI-поиске — вы контролируете каждый шаг.",
    ctaPrimary: "Начать бесплатно",
    ctaSecondary: "Как это работает",
    trustLine:
      "Без долгосрочных контрактов. Ничего не публикуется автоматически.",
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
      "Ничего не публикуется автоматически",
      "Вы проверяете каждое действие",
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
    title: "RankBoost — ваш AI Growth Manager",
    subtitle:
      "Платформа находит возможности, готовит план и черновики — вы решаете, что запускать.",
    items: [
      {
        title: "Находит возможности",
        description:
          "Аудит сайта, задачи и идеи роста на основе данных и лучших практик.",
      },
      {
        title: "Готовит действия",
        description:
          "Месячный план, SEO-задачи и приоритеты — всё в одном месте.",
      },
      {
        title: "Создаёт черновики",
        description:
          "Статьи, посты и письма готовятся для проверки, а не для автопубликации.",
      },
      {
        title: "Отслеживает прогресс",
        description:
          "Growth Score, активность и следующий шаг всегда на виду.",
      },
    ],
  },
  outputs: {
    title: "Что RankBoost может подготовить",
    subtitle: "Готовые материалы для вашего обзора — не для автоматической публикации.",
    items: [
      "SEO-задачи",
      "Месячный план роста",
      "Черновики статей",
      "Черновики постов",
      "Письма на согласование",
      "Черновики WordPress",
    ],
    trustNote: "Подготовлено для проверки — ничего не публикуется автоматически.",
  },
  aiSearch: {
    title: "Создано для Google и AI-поиска",
    description:
      "RankBoost помогает создавать более понятные и полезные страницы: отвечать на вопросы клиентов, улучшать видимость в поиске и быть понятнее для современных AI-поисковых систем. Без обещаний «гарантированных позиций».",
  },
  control: {
    title: "Вы остаётесь главным",
    items: [
      "Ничего не публикуется автоматически",
      "Письма не отправляются без вашего одобрения",
      "Контент WordPress создаётся как черновики",
      "Каждую рекомендацию можно проверить перед действием",
    ],
  },
  pricingPreview: {
    title: "Тарифы для роста",
    subtitle:
      "Начните бесплатно. Перейдите на платный план, когда понадобится больше действий.",
    trustNote:
      "Без долгосрочных контрактов. Отмена в любой момент. Существующие данные остаются доступны.",
    plans: [
      { name: "Free", description: "Начать и протестировать RankBoost" },
      { name: "Starter", description: "Для одного сайта и регулярного роста" },
      { name: "Pro", description: "Больше генераций и действий" },
      { name: "Agency", description: "Для команд и нескольких проектов" },
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
    title: "SEO-услуги",
    subtitle: "Комплексное продвижение для роста органического трафика и лидов",
    viewAll: "Все услуги",
    learnMore: "Подробнее",
    pageTitle: "SEO-услуги",
    pageSubtitle:
      "Полный спектр SEO-услуг для бизнеса в Эстонии и Европе — от аудита до комплексного сопровождения.",
    ctaConsultation: "Получить консультацию",
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
    subtitle: "Прозрачные ежемесячные планы без скрытых платежей",
    popular: "Популярный",
    pageTitle: "Тарифы на SEO-услуги",
    pageSubtitle:
      "Выберите план под ваш бизнес — от локального продвижения до комплексного SEO-партнёрства.",
    comparisonTitle: "Сравнение тарифов",
    customNote: "Все цены указаны без НДС. Минимальный срок — 3 месяца.",
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
    title: "Начните улучшать сайт уже сегодня",
    subtitle:
      "RankBoost покажет, что улучшить дальше, и подготовит действия для вашего обзора.",
    button: "Начать бесплатно",
    note: "Без кредитной карты на Free-плане. Отмена в любой момент.",
  },
  blog: {
    title: "SEO-блог",
    subtitle: "Экспертные статьи о продвижении в Google для бизнеса в Эстонии",
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
    subtitle: "Расскажите о вашем проекте — мы предложим оптимальную SEO-стратегию",
    form: {
      name: "Имя",
      namePlaceholder: "Ваше имя",
      email: "Email",
      emailPlaceholder: "email@example.com",
      phone: "Телефон / Telegram / WhatsApp",
      phonePlaceholder: "+372 ... или @username",
      website: "Сайт",
      websitePlaceholder: "https://yoursite.ee",
      budget: "Бюджет",
      budgetPlaceholder: "Выберите бюджет",
      service: "Услуга",
      servicePlaceholder: "Выберите услугу",
      plan: "Тариф",
      planPlaceholder: "Выберите тариф",
      message: "Сообщение",
      messagePlaceholder: "Расскажите о вашем проекте и целях...",
      websiteOrMessageHint: "Укажите сайт или опишите задачу в сообщении — одно из полей обязательно.",
      websiteOrMessageError: "Укажите сайт или напишите сообщение.",
      submit: "Отправить заявку",
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
      "RankBoost.eu — SEO-агентство для малого и среднего бизнеса в Эстонии и Европе. Продвигаем сайты в Google на русском, эстонском и английском.",
    navigation: "Навигация",
    servicesTitle: "Услуги",
    blogTitle: "Блог",
    legal: "Правовая информация",
    privacy: "Конфиденциальность",
    terms: "Условия",
    disclaimer:
      "SEO-результаты зависят от состояния сайта, конкуренции и регулярности работы.",
    copyright: "© {year} RankBoost.eu. Все права защищены.",
  },
  privacy: {
    title: "Политика конфиденциальности",
    lastUpdated: "Последнее обновление: 1 января 2025",
    sections: [
      {
        title: "1. Общие положения",
        content:
          "RankBoost.eu («мы») уважает вашу конфиденциальность. Настоящая политика описывает, как мы собираем и используем данные при использовании сайта rankboost.eu и контактной формы.",
      },
      {
        title: "2. Какие данные мы собираем",
        content:
          "Через контактную форму мы можем получать: имя, email, телефон (включая Telegram/WhatsApp), URL сайта, бюджет, выбранную услугу и тариф, а также текст сообщения. Автоматически могут собираться технические данные: IP-адрес, тип браузера, страница источника (referrer).",
      },
      {
        title: "3. Как мы используем данные",
        content:
          "Данные используются исключительно для связи с вами по вашему запросу, подготовки коммерческого предложения и оказания SEO-услуг. Мы не продаём и не передаём ваши данные третьим лицам для маркетинговых целей.",
      },
      {
        title: "4. Хранение и безопасность",
        content:
          "Данные хранятся на защищённых серверах в ЕС. Мы применяем технические и организационные меры для защиты данных в соответствии с GDPR.",
      },
      {
        title: "5. Ваши права",
        content:
          "Вы имеете право на доступ, исправление и удаление ваших данных. Для запроса удаления или уточнения данных напишите на info@rankboost.eu.",
      },
      {
        title: "6. Cookies",
        content:
          "Сайт может использовать cookies для аналитики. Вы можете отключить cookies в настройках браузера.",
      },
    ],
  },
  terms: {
    title: "Условия использования",
    lastUpdated: "Последнее обновление: 1 января 2025",
    sections: [
      {
        title: "1. Общие условия",
        content:
          "Сайт RankBoost.eu предоставляет информацию об SEO-услугах в Эстонии и Европе. Используя сайт, вы соглашаетесь с настоящими условиями.",
      },
      {
        title: "2. Контактная форма",
        content:
          "Отправка заявки через форму не является заключением договора и не создаёт обязательств для сторон. Мы свяжемся с вами для уточнения деталей и подготовки предложения.",
      },
      {
        title: "3. SEO-результаты",
        content:
          "SEO-услуги не гарантируют конкретную позицию в Google или других поисковых системах. Результат зависит от конкуренции, технического состояния сайта, качества контента, бюджета, регулярности работ и алгоритмов поисковых систем.",
      },
      {
        title: "4. Цены и стоимость",
        content:
          "Цены на сайте указаны «от» и являются ориентировочными. Финальная стоимость зависит от объёма работ, количества страниц, языков, конкуренции в нише и выбранного тарифного плана.",
      },
      {
        title: "5. Конфиденциальность",
        content:
          "Мы не разглашаем данные клиентов и результаты аудитов третьим лицам без согласия, за исключением случаев, предусмотренных законом.",
      },
      {
        title: "6. Контакты",
        content: "По всем вопросам: info@rankboost.eu",
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
