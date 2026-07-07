import type { SaasServerStrings } from "./types";

export const serverStringsRu: SaasServerStrings = {
  dashboard: {
    growthScore: {
      notEnough: "Недостаточно данных",
      lookingGood: "Хорошо",
      roomToGrow: "Есть куда расти",
      needsAttention: "Нужно внимание",
    },
    hero: {
      getStarted: "Начните",
      getStartedDesc: "Добавьте сайт, чтобы начать находить возможности роста.",
      finishSetup: "Завершите настройку",
      finishSetupDesc: "Завершите настройку, чтобы RankBoost подготовил первый план роста.",
      runFirstAudit: "Запустите первый аудит",
      runFirstAuditDesc:
        "Запустите аудит, чтобы RankBoost понял ваш сайт и подготовил действия.",
      actionsReady: "Действия ждут вас",
      actionsReadyDesc:
        "RankBoost нашёл новые возможности и подготовил действия для проверки.",
      planActive: "План роста активен",
      planActiveDesc:
        "Ваш план роста активен. RankBoost отслеживает новые возможности.",
    },
    nextAction: {
      reviewPlanTitle: "Проверьте месячный план роста",
      reviewPlanDesc:
        "RankBoost подготовил план с SEO, контентом и соцсетями на этот месяц.",
      runAuditTitle: "Запустите первый аудит",
      runAuditDesc:
        "RankBoost нужно просканировать сайт, прежде чем готовить действия.",
      connectGscTitle: "Подключите Google Search Console",
      connectGscDesc: "Откройте реальные запросы и возможности по трафику.",
      reviewEmailTitle: "Проверьте подготовленное письмо",
      reviewEmailDesc:
        "Письмо готово. Оно не будет отправлено, пока вы не отправите его вручную.",
    },
    actionLabels: {
      openGrowthPlan: "Открыть план роста",
      reviewEmail: "Проверить письмо",
      viewDrafts: "Смотреть черновики",
      viewPosts: "Смотреть посты",
      connectGsc: "Подключить GSC",
      runAudit: "Запустить аудит",
      viewTasks: "Смотреть задачи",
      openTimeline: "Открыть историю",
      open: "Открыть",
    },
    findings: {
      seoTasksWaiting: (count) =>
        `На сайте ${count} SEO-задач${count === 1 ? "а" : count < 5 ? "и" : ""} ждут выполнения.`,
      planReady: "Месячный план роста готов к проверке.",
      gscNotConnected: "Google Search Console ещё не подключён.",
      socialDraftsReady: (count) =>
        `${count} черновик${count === 1 ? "" : count < 5 ? "а" : "ов"} постов готов${count === 1 ? "" : "ы"}.`,
      emailDraftsWaiting: (count) =>
        `${count} черновик${count === 1 ? "" : count < 5 ? "а" : "ов"} писем ждут проверки.`,
      opportunitiesFound: (count) =>
        `RankBoost нашёл ${count} возможност${count === 1 ? "ь" : count < 5 ? "и" : "ей"} роста.`,
    },
    secondary: {
      doLater: "Сделать позже",
      openSetup: "Открыть настройку",
    },
    billingNoteFree:
      "Вы на бесплатном плане. Улучшите план, когда нужно больше действий.",
  },
  controlCenter: {
    status: {
      setupNeeded: "Нужна настройка",
      setupNeededDesc: "Добавьте сайт для использования центра управления.",
      setupNeededNoData:
        "Подключите источники данных или запустите аудит для подготовки действий.",
      limitedData: "Мало данных",
      limitedDataDesc:
        "Запустите аудит или подключите Google Search Console для подготовки действий.",
      needsReview: "Требует проверки",
      needsReviewDesc:
        "RankBoost подготовил действия роста, которые нужно проверить.",
      ready: "Готово",
      readyDesc:
        "Текущий план роста одобрен. RankBoost отслеживает новые возможности.",
      monitoring: "Мониторинг",
      monitoringDesc:
        "Срочных одобрений нет. RankBoost отслеживает ваш сайт.",
    },
    recommended: {
      generatePlanTitle: "Создайте план роста на этот месяц",
      generatePlanDesc:
        "Организуйте SEO, контент и соцсети на текущий месяц.",
      prepareEmailTitle: "Подготовить письмо на проверку",
      prepareEmailDesc: "Создайте черновик письма из плана роста.",
      reviewEmailTitle: "Проверьте подготовленное письмо",
      reviewEmailDesc: (count) =>
        `${count} черновик${count === 1 ? "" : count < 5 ? "а" : "ов"} писем ждут проверки.`,
      reviewArticlesTitle: "Проверьте черновики статей",
      reviewArticlesDesc: (count) =>
        `${count} черновик${count === 1 ? "" : count < 5 ? "а" : "ов"} статей требуют внимания.`,
      copySocialTitle: "Скопируйте готовые посты",
      copySocialDesc: (count) =>
        `${count} черновик${count === 1 ? "" : count < 5 ? "а" : "ов"} постов готов${count === 1 ? "" : "ы"} к копированию.`,
      connectGscTitle: "Подключите Google Search Console",
      connectGscDesc: "Откройте возможности по запросам и трафику.",
      fixTasksTitle: "Исправьте приоритетные SEO-задачи",
      fixTasksDesc: (count) =>
        `${count} приоритетн${count === 1 ? "ая задача" : count < 5 ? "ые задачи" : "ых задач"} открыт${count === 1 ? "а" : "ы"}.`,
      runAuditTitle: "Запустите аудит сайта",
      runAuditDesc: "Обновите технические находки и Growth Score.",
      reviewTimelineTitle: "Проверьте недавнюю активность",
      reviewTimelineDesc: (count) =>
        `${count} непрочитанн${count === 1 ? "ое событие" : count < 5 ? "ых события" : "ых событий"}.`,
    },
  },
  timeline: {
    sources: {
      AUDIT_ENGINE: "Движок аудита",
      RULE_ENGINE: "Правила",
      GROWTH_SCORE: "Growth Score",
      TASKS: "Задачи",
      CONTENT_PLAN: "Контент-план",
      REPORTS: "Отчёты",
      GSC: "Search Console",
      WORDPRESS: "WordPress",
      HERMES: "Hermes AI",
      AI_QUALITY_PIPELINE: "Качество AI",
      CONTINUOUS_IMPROVEMENT: "Движок роста",
      SYSTEM: "Система",
    },
    actions: {
      openArticle: "Открыть статью",
      openReport: "Открыть отчёт",
      openIntegration: "Открыть интеграции",
      viewInsight: "Смотреть инсайт",
      openDashboard: "Открыть обзор",
      openSocialPosts: "Открыть соцсети",
      openAutopilot: "Открыть план роста",
      openEmailApprovals: "Открыть письма",
      openContentPlan: "Открыть контент-план",
    },
  },
  onboardingForms: {
    websiteUrlRequired: "Введите URL сайта, чтобы продолжить.",
    addWebsiteFailed: "Не удалось добавить сайт",
    addWebsiteNetworkError: "Сетевая ошибка при добавлении сайта",
    websitePlaceholder: "https://yourwebsite.com",
    auditFailed: "Не удалось запустить аудит",
    auditNetworkError: "Сетевая ошибка при запуске аудита",
    skipGscFailed: "Не удалось пропустить шаг",
    markViewedFailed: "Не удалось отметить результаты просмотренными",
    generatePlanFailed: "Не удалось создать план",
    generatePlanNetworkError: "Сетевая ошибка при создании плана",
    optional: "Необязательно",
    done: "Готово",
    skipped: "Пропущено",
    current: "Текущий шаг",
    locked: "Заблокировано",
    progressLabel: (completed, total) => `${completed} из ${total} шагов выполнено`,
    completeSetup: "Завершить настройку",
    continueSetup: "Продолжить настройку",
  },
};
