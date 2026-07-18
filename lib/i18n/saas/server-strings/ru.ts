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
      runAuditTitle: "Проверить сайт сейчас",
      runAuditDesc:
        "RankBoost нужно просканировать сайт, прежде чем готовить действия.",
      connectGscTitle: "Подключите Google Search Console",
      connectGscDesc: "Откройте реальные запросы и возможности по трафику.",
      reviewEmailTitle: "Проверьте подготовленное письмо",
      reviewEmailDesc:
        "Письмо готово. Оно не будет отправлено, пока вы не отправите его вручную.",
      openReviewTitle: "Проверить готовые материалы",
      openReviewDesc:
        "RankBoost подготовил статью или исправление. Ничего не публикуется без вашего подтверждения.",
      openPlanTitle: "Открыть план публикаций",
      openPlanDesc:
        "В плане есть темы статей — откройте и решите, что готовить дальше.",
      selectGscTitle: "Выбрать сайт в Google Search Console",
      selectGscDesc:
        "Google уже подключён — выберите свойство сайта, чтобы открыть поисковые данные.",
      setupPublishingTitle: "Настроить публикацию",
      setupPublishingDesc:
        "Подключите WordPress или настройте ручную публикацию (экспорт / письмо разработчику).",
      openControlTitle: "Открыть центр управления",
      openControlDesc:
        "Посмотрите статус плана, задач и следующих шагов в одном месте.",
    },
    actionLabels: {
      openGrowthPlan: "Открыть план роста",
      reviewEmail: "Проверить письмо",
      viewDrafts: "Смотреть черновики",
      viewPosts: "Смотреть посты",
      connectGsc: "Подключить GSC",
      runAudit: "Проверить сайт сейчас",
      viewTasks: "Смотреть задачи",
      openTimeline: "Открыть историю",
      open: "Открыть",
      openReview: "Открыть на проверку",
      openPlan: "Открыть план",
      selectGsc: "Выбрать сайт",
      setupPublishing: "Настроить публикацию",
      openControl: "Открыть центр управления",
      checkSiteNow: "Проверить сайт сейчас",
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
    severityLabels: {
      INFO: "Инфо",
      WARNING: "Внимание",
      ERROR: "Ошибка",
      SUCCESS: "Готово",
      OPPORTUNITY: "Возможность",
    },
    eventTitles: {
      AUDIT_COMPLETED: "Аудит сайта завершён",
      SCORE_CHANGED: "Оценка роста изменилась",
      TASK_CREATED: "Создана новая задача роста",
      TASK_CREATED_GSC: "Инсайт Search Console преобразован в задачу",
      TASK_COMPLETED: "Задача выполнена",
      GSC_OPPORTUNITY_FOUND: "Найдена новая возможность в Search Console",
      GSC_INSIGHT_FOUND: "Найден новый инсайт Search Console",
      ARTICLE_DRAFT_CREATED: "Создан черновик статьи",
      AI_RECOMMENDATION_CREATED: "Проверка качества AI-контента завершена",
      WORDPRESS_DRAFT_CREATED: "Создан черновик WordPress",
      INTEGRATION_CONNECTED: "Интеграция подключена",
      INTEGRATION_ERROR: "Интеграция требует внимания",
      REPORT_CREATED: "Создан новый отчёт",
      CONTENT_IDEA_CREATED: "Создана новая идея контента",
      SOCIAL_POST_DRAFT_CREATED: "Создан черновик поста",
      MONTHLY_AUTOPILOT_PLAN_CREATED: "Создан месячный план роста",
      EMAIL_APPROVAL_CREATED: "Подготовлено письмо на проверку",
    },
    systemNoteTitles: {
      "Monthly growth plan approved": "Месячный план роста одобрен",
      "Social post copied": "Пост скопирован",
      "Review email approved": "Письмо на проверку одобрено",
      "Review email sent": "Письмо на проверку отправлено",
      "Autopilot plan item executed": "Пункт плана выполнен автопилотом",
      "Subscription updated": "Подписка обновлена",
    },
    knownSummaries: {
      "RankBoost prepared a monthly plan with priority tasks, content ideas, and social post opportunities.":
        "Автопилот подготовил месячный план с приоритетными задачами, идеями контента и постами для соцсетей.",
      "The monthly plan was approved and is ready for execution.":
        "Месячный план одобрен и готов к выполнению.",
      "Autopilot prepared an article draft for review.":
        "Автопилот подготовил черновик статьи на проверку.",
      "Autopilot created a WordPress draft from an approved article.":
        "Автопилот создал черновик в WordPress из одобренной статьи.",
      "Your RankBoost subscription was updated.":
        "Ваша подписка RankBoost обновлена.",
      "RankBoost prepared an email draft for your approval.":
        "RankBoost подготовил черновик письма на ваше одобрение.",
      "An email draft was approved by the user.": "Черновик письма одобрен.",
      "An approved review email was sent manually.":
        "Одобренное письмо на проверку отправлено вручную.",
    },
    summaryHeadlines: {
      quiet:
        "Существенных изменений с вашего последнего визита нет. RankBoost продолжает отслеживать ваш сайт.",
      monitoringContinued:
        "RankBoost продолжал отслеживать ваш сайт, пока вас не было.",
      sinceVisit: (details) =>
        `С вашего последнего визита RankBoost нашёл ${details}.`,
      opportunities: (count) =>
        `${count} ${count === 1 ? "новую возможность" : count < 5 ? "новые возможности" : "новых возможностей"}`,
      newTasks: (count) =>
        `${count} ${count === 1 ? "новую задачу" : count < 5 ? "новые задачи" : "новых задач"}`,
      completedTasks: (count) =>
        `${count} ${count === 1 ? "выполненную задачу" : count < 5 ? "выполненные задачи" : "выполненных задач"}`,
      scoreChange: (delta) => `Оценка роста ${delta}`,
    },
    eventSummaries: {
      auditCompleted: (findings, tasks) => {
        const parts = ["RankBoost проверил ваш сайт и обновил рекомендации."];
        if (findings > 0) parts.push(`${findings} находок требуют внимания.`);
        if (tasks > 0) parts.push(`Создано новых задач: ${tasks}.`);
        return parts.join(" ");
      },
      scoreChanged: (from, to, delta) =>
        `Growth Score ${delta > 0 ? "вырос" : "снизился"} с ${from} до ${to} (${delta > 0 ? "+" : ""}${delta}).`,
      qualityPassed: "Черновик статьи прошёл проверку качества.",
      qualityNeedsReview: "Черновик статьи нужно проверить перед публикацией.",
      wordpressDraftCreated: "В WordPress создан черновик — он ждёт вашей проверки.",
      socialPostDraftCreated: (platform) => `Создан черновик поста для ${platform}.`,
      socialPostCopied: "Черновик поста скопирован для публикации.",
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
