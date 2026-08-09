export type IntegrationRiskLevel = "low" | "medium" | "high";

export type IntegrationProviderDetails = {
  benefits: string[];
  dataUsed: string[];
  actions: string[];
  riskLevel: IntegrationRiskLevel;
  connectionPath: string[];
};

export const INTEGRATION_PROVIDER_DETAILS: Record<
  string,
  IntegrationProviderDetails
> = {
  google_search_console: {
    benefits: [
      "Реальные клики и показы из Google",
      "Запросы, по которым сайт уже виден",
      "Страницы, которые можно улучшить",
    ],
    dataUsed: [
      "Поисковые запросы и позиции",
      "Клики, показы и CTR",
      "Индексируемые URL и ошибки обхода",
    ],
    actions: [
      "Приоритизировать задачи по реальному спросу",
      "Показывать прогресс по ключевым страницам",
      "Строить ежемесячные отчёты на данных Google",
    ],
    riskLevel: "low",
    connectionPath: [
      "Войти через Google OAuth",
      "Выбрать сайт в Search Console",
      "Подтвердить доступ только на чтение",
      "RankBoost начнёт синхронизацию данных",
    ],
  },
  google_analytics: {
    benefits: [
      "Данные о посетителях",
      "Понимание, какие страницы приводят клиентов",
    ],
    dataUsed: [
      "Сессии и источники трафика",
      "Популярные страницы и конверсии",
      "География и устройства посетителей",
    ],
    actions: [
      "Связывать SEO-задачи с реальным трафиком",
      "Оценивать эффект изменений на сайте",
      "Рекомендовать контент по спросу",
    ],
    riskLevel: "medium",
    connectionPath: [
      "Подключить Google Analytics 4",
      "Выбрать property сайта",
      "Выдать доступ на чтение метрик",
    ],
  },
  google_business_profile: {
    benefits: [
      "Проверка карточки компании",
      "Локальная видимость в Google Maps",
      "Контекст адреса, категории и сайта",
    ],
    dataUsed: [
      "Название, адрес и сайт компании",
      "Основная категория бизнеса",
      "Google account/location ID без паролей",
    ],
    actions: [
      "Учитывать локальный контекст в SEO-плане",
      "Показывать, подключена ли карточка компании",
      "Готовить будущие локальные рекомендации",
    ],
    riskLevel: "medium",
    connectionPath: [
      "Подключить Google через OAuth",
      "Указать Google Business account ID и location ID",
      "Загрузить карточку компании только для чтения",
    ],
  },
  wordpress: {
    benefits: [
      "Создание черновиков статей",
      "Подготовка Meta Title / Description",
      "Будущая автопубликация по разрешению",
    ],
    dataUsed: [
      "Список страниц и записей",
      "Текущие meta-теги и статусы",
      "Структура категорий и тегов",
    ],
    actions: [
      "Создавать черновики из контент-плана",
      "Обновлять SEO-поля без ручного копирования",
      "Публиковать только после вашего подтверждения",
    ],
    riskLevel: "high",
    connectionPath: [
      "Указать URL сайта WordPress",
      "Создать Application Password в админке",
      "Проверить соединение и права",
      "Выбрать, что RankBoost может публиковать",
    ],
  },
  custom_webhook: {
    benefits: [
      "Подходит для самописных сайтов",
      "Один защищённый endpoint вместо ручного копирования",
      "Можно отправлять готовые статьи и site fixes",
    ],
    dataUsed: [
      "URL endpoint без показа полного значения в UI",
      "HMAC secret в зашифрованном виде",
      "Статусы теста и отправки",
    ],
    actions: [
      "Проверять endpoint безопасным test payload",
      "Отправлять готовую статью после quality gate",
      "Сохранять историю отправок и ошибки",
    ],
    riskLevel: "high",
    connectionPath: [
      "Разработчик добавляет защищённый POST endpoint",
      "Вы вставляете URL и optional secret",
      "RankBoost отправляет тест без статьи",
      "После 2xx можно отправлять готовые материалы",
    ],
  },
  hosted_blog: {
    benefits: [
      "Быстрый fallback, если CMS ещё не подключена",
      "Публичные SEO-friendly страницы",
      "Sitemap и JSON-LD уже формируются RankBoost",
    ],
    dataUsed: [
      "Одобренные статьи RankBoost",
      "Slug, title, description и canonical",
      "Website URL для контекста бренда",
    ],
    actions: [
      "Публиковать hosted-страницу в один клик",
      "Добавлять статью в hosted sitemap",
      "Сохранять публичный URL в статье",
    ],
    riskLevel: "medium",
    connectionPath: [
      "Откройте готовую статью",
      "Выберите hosted publish как временный путь",
      "RankBoost создаст публичный URL",
      "Позже можно перейти на WordPress или custom endpoint",
    ],
  },
  webflow: {
    benefits: [
      "Подходит для сайтов агентств и landing pages",
      "CMS collections можно наполнять из месячного плана",
      "SEO-поля страниц обновляются без копирования",
    ],
    dataUsed: [
      "Webflow site и collection IDs",
      "CMS item fields для статьи",
      "Slug, title, excerpt и SEO metadata",
    ],
    actions: [
      "Создавать CMS item для статьи",
      "Обновлять meta title/description",
      "Публиковать после подтверждённого плана",
    ],
    riskLevel: "high",
    connectionPath: [
      "Подключить Webflow OAuth или API token",
      "Выбрать site и blog collection",
      "Сопоставить поля статьи",
      "Запустить тестовую отправку",
    ],
  },
  shopify: {
    benefits: [
      "SEO для интернет-магазинов",
      "Статьи поддерживают спрос вокруг товаров",
      "Позже можно улучшать product SEO",
    ],
    dataUsed: [
      "Blog/article endpoints Shopify",
      "Products, collections и tags",
      "SEO title/description для товаров и статей",
    ],
    actions: [
      "Публиковать blog article",
      "Готовить SEO fixes для product pages",
      "Связывать статьи с товарами и коллекциями",
    ],
    riskLevel: "high",
    connectionPath: [
      "Подключить Shopify app",
      "Выбрать blog и режим публикации",
      "Подтвердить права на articles/products",
      "Проверить draft/live publish на тестовой статье",
    ],
  },
  wix: {
    benefits: [
      "Путь для малого бизнеса на Wix",
      "RankBoost объяснит, что можно автоматизировать",
      "Manual fallback останется доступен",
    ],
    dataUsed: [
      "Wix site/blog identifiers",
      "Blog post content and SEO fields",
      "Connection health",
    ],
    actions: [
      "Создавать blog post, когда API доступен",
      "Готовить SEO metadata",
      "Показывать fallback-инструкции при ограничениях Wix",
    ],
    riskLevel: "medium",
    connectionPath: [
      "Подключить Wix OAuth/app",
      "Выбрать сайт",
      "Проверить доступ к блогу",
      "Сделать тестовую публикацию",
    ],
  },
  squarespace: {
    benefits: [
      "Поддержка распространённых SMB-сайтов",
      "Готовые материалы не теряются в ручном процессе",
      "Можно начать с guided/manual workflow",
    ],
    dataUsed: [
      "Site/blog identifiers",
      "SEO fields and page URLs",
      "Publication status",
    ],
    actions: [
      "Готовить payload под Squarespace",
      "Отправлять или давать fallback по ограничениям API",
      "Вести execution history",
    ],
    riskLevel: "medium",
    connectionPath: [
      "Подключить Squarespace credentials",
      "Выбрать blog/channel",
      "Проверить test connection",
      "Включить публикацию после подтверждения плана",
    ],
  },
  ghost: {
    benefits: [
      "Быстрый blogging API",
      "Хорошо подходит для контентных сайтов",
      "Поддерживает tags, excerpt и canonical",
    ],
    dataUsed: [
      "Ghost Admin API key",
      "Posts, tags and authors",
      "HTML/Mobiledoc/lexical content",
    ],
    actions: [
      "Создавать draft или published post",
      "Обновлять excerpt и SEO metadata",
      "Сохранять external post ID",
    ],
    riskLevel: "high",
    connectionPath: [
      "Создать Ghost custom integration",
      "Вставить Admin API URL/key",
      "Проверить доступ к posts",
      "Выбрать draft или auto-publish mode",
    ],
  },
  github: {
    benefits: [
      "Безопасно для custom/Next/Astro/Hugo сайтов",
      "Изменения проходят через pull request",
      "Команда видит diff перед merge",
    ],
    dataUsed: [
      "Repository, branch and content path",
      "Markdown/MDX article files",
      "PR status and merge result",
    ],
    actions: [
      "Создавать branch и pull request",
      "Добавлять статью или SEO-fix как файл",
      "Обновлять status после merge",
    ],
    riskLevel: "medium",
    connectionPath: [
      "Подключить GitHub App",
      "Выбрать repo и content folder",
      "Настроить frontmatter mapping",
      "Создать тестовый PR",
    ],
  },
  sitemap: {
    benefits: [
      "Работает без логина и паролей",
      "Помогает найти важные страницы сайта",
      "Улучшает аудит и внутреннюю перелинковку",
    ],
    dataUsed: [
      "sitemap.xml и robots.txt",
      "Публичные URL и lastmod",
      "Статусы доступности страниц",
    ],
    actions: [
      "Находить URL для аудита",
      "Предлагать страницы для обновления",
      "Сравнивать опубликованные статьи с sitemap",
    ],
    riskLevel: "low",
    connectionPath: [
      "RankBoost проверяет sitemap автоматически",
      "Если sitemap нет — использует crawl fallback",
      "Найденные URL попадают в аудит",
    ],
  },
  zapier: {
    benefits: [
      "Быстрый no-code bridge",
      "Можно подключить CRM, email или CMS через Zap",
      "Не требует разработки в RankBoost под каждый сервис",
    ],
    dataUsed: [
      "Zapier webhook endpoint",
      "Article/fix payload",
      "Delivery status",
    ],
    actions: [
      "Триггерить Zap после quality gate",
      "Отправлять статью или задачу в workflow",
      "Показывать ошибки доставки",
    ],
    riskLevel: "medium",
    connectionPath: [
      "Создать Zap с webhook trigger",
      "Вставить URL в RankBoost",
      "Проверить test payload",
      "Включить действие в месячном плане",
    ],
  },
  make: {
    benefits: [
      "Гибкие сценарии для сложных процессов",
      "Можно связать CMS, Sheets, Slack и email",
      "Подходит агентствам",
    ],
    dataUsed: [
      "Make webhook endpoint",
      "Article/fix payload",
      "Scenario execution status",
    ],
    actions: [
      "Запускать Make scenario",
      "Передавать готовые статьи и fixes",
      "Сохранять execution result",
    ],
    riskLevel: "medium",
    connectionPath: [
      "Создать Custom webhook в Make",
      "Вставить URL в RankBoost",
      "Отправить тест",
      "Подключить scenario к публикации",
    ],
  },
  cloudflare: {
    benefits: [
      "Скорость загрузки и CDN",
      "Безопасность и защита от атак",
      "Технические сигналы для SEO",
    ],
    dataUsed: [
      "Настройки кэша и производительности",
      "События безопасности (агрегированно)",
      "Статус SSL и DNS",
    ],
    actions: [
      "Предлагать технические улучшения",
      "Связывать скорость с Growth Score",
      "Предупреждать о критичных проблемах",
    ],
    riskLevel: "medium",
    connectionPath: [
      "Подключить API-токен Cloudflare",
      "Выбрать зону домена",
      "Ограничить права только чтением",
    ],
  },
  resend: {
    benefits: [
      "Ежемесячные отчёты на email",
      "Письма с кнопкой подтверждения публикации",
      "Уведомления о важных изменениях",
    ],
    dataUsed: [
      "Email адреса получателей отчётов",
      "Шаблоны и статусы отправки",
      "Логи доставки (без содержимого писем клиентов)",
    ],
    actions: [
      "Отправлять monthly SEO report",
      "Запрашивать approve перед публикацией",
      "Уведомлять о падении score или критичных задачах",
    ],
    riskLevel: "low",
    connectionPath: [
      "Подтвердить email для отчётов",
      "Выбрать частоту уведомлений",
      "Настроить список получателей",
    ],
  },
  hermes_ai: {
    benefits: [
      "Генерация статей по вашему плану",
      "Улучшение контента на основе аудита",
      "Подготовка постов для соцсетей",
    ],
    dataUsed: [
      "Результаты аудита и задачи",
      "Темы и ключевые слова из плана",
      "Черновики, созданные в RankBoost",
    ],
    actions: [
      "Предлагать тексты статей и постов",
      "Адаптировать тон под ваш бренд",
      "Готовить материалы к публикации",
    ],
    riskLevel: "medium",
    connectionPath: [
      "Включить AI-модуль в тарифе",
      "Задать лимиты и правила автопилота",
      "Подтверждать публикации вручную",
    ],
  },
};

export const RISK_LEVEL_LABELS: Record<
  IntegrationRiskLevel,
  { label: string; className: string }
> = {
  low: {
    label: "Низкий риск",
    className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  },
  medium: {
    label: "Средний риск",
    className: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  },
  high: {
    label: "Высокий риск",
    className: "border-red-500/30 bg-red-500/10 text-red-300",
  },
};
