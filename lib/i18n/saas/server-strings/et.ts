import type { SaasServerStrings } from "./types";

export const serverStringsEt: SaasServerStrings = {
  dashboard: {
    growthScore: {
      notEnough: "Andmeid pole piisavalt",
      lookingGood: "Hea seis",
      roomToGrow: "Kasvuruumi on",
      needsAttention: "Vajab tähelepanu",
    },
    hero: {
      getStarted: "Alustage",
      getStartedDesc: "Lisage veebisait, et alustada kasvuvõimaluste leidmist.",
      finishSetup: "Lõpetage seadistamine",
      finishSetupDesc: "Lõpetage seadistamine, et RankBoost saaks esimese plaani koostada.",
      runFirstAudit: "Käivitage esimene audit",
      runFirstAuditDesc:
        "Käivitage audit, et RankBoost saaks teie veebisaidist aru ja toiminguid ette valmistada.",
      actionsReady: "Toimingud ootavad teid",
      actionsReadyDesc:
        "RankBoost leidis uusi võimalusi ja valmistas toimingud ülevaatamiseks.",
      planActive: "Kasvuplaan on aktiivne",
      planActiveDesc:
        "Teie kasvuplaan on aktiivne. RankBoost jälgib uusi võimalusi.",
    },
    nextAction: {
      reviewPlanTitle: "Vaadake kuine kasvuplaan üle",
      reviewPlanDesc:
        "RankBoost koostas selle kuu SEO, sisu ja sotsiaalmeedia toimingute plaani.",
      runAuditTitle: "Kontrolli saiti kohe",
      runAuditDesc:
        "RankBoost peab teie veebisaidi skaneerima enne toimingute ettevalmistamist.",
      connectGscTitle: "Ühendage Google Search Console",
      connectGscDesc: "Avage tegelikud otsingupäringud ja liikluse võimalused.",
      reviewEmailTitle: "Vaadake ettevalmistatud e-kiri üle",
      reviewEmailDesc:
        "Kinnitamise e-kiri on valmis. Seda ei saadeta enne, kui saadate selle käsitsi.",
      openReviewTitle: "Kontrolli valmis materjale",
      openReviewDesc:
        "RankBoost valmistas artikli või paranduse. Midagi ei avaldata ilma teie kinnituseta.",
      openPlanTitle: "Ava avaldamisplaan",
      openPlanDesc:
        "Plaanis on artikliteemad — avage ja otsustage, mida järgmiseks ette valmistada.",
      selectGscTitle: "Vali Google Search Console'i sait",
      selectGscDesc:
        "Google on ühendatud — valige saidi omadus, et avada otsinguandmed.",
      setupPublishingTitle: "Seadista avaldamine",
      setupPublishingDesc:
        "Ühendage WordPress või oma sait, et RankBoost saaks artiklid otse blogisse saata.",
      openControlTitle: "Ava juhtimiskeskus",
      openControlDesc:
        "Vaadake plaani olekut, ülesandeid ja järgmisi samme ühes kohas.",
      confirmPlanTitle: "Kinnita kuu plaan",
      confirmPlanDesc:
        "RankBoost valmistab artiklid ajakava järgi pärast teie kinnitust.",
      autopilotActiveTitle: "Kuu autopiloot on aktiivne",
      autopilotActiveDesc:
        "RankBoost valmistab artikleid ajakava järgi. Ühendatud sait saab kinnitatud plaani publikatsioonid vastu võtta.",
      nextArticlePrepared: (date) => `Järgmine artikkel valmistatakse: ${date}`,
      readyToPublishCount: (count) => `Valmis avaldamiseks: ${count}`,
    },
    actionLabels: {
      openGrowthPlan: "Ava kasvuplaan",
      reviewEmail: "Vaata e-kirja",
      viewDrafts: "Vaata mustandeid",
      viewPosts: "Vaata postitusi",
      connectGsc: "Ühenda GSC",
      runAudit: "Kontrolli saiti kohe",
      viewTasks: "Vaata ülesandeid",
      openTimeline: "Ava ajalugu",
      open: "Ava",
      openReview: "Ava ülevaatus",
      openPlan: "Ava plaan",
      selectGsc: "Vali sait",
      setupPublishing: "Ühenda saidi avaldamine",
      openControl: "Ava juhtimiskeskus",
      checkSiteNow: "Kontrolli saiti kohe",
      confirmPlan: "Kinnita plaan",
      viewAutopilot: "Ava autopiloot",
    },
    findings: {
      seoTasksWaiting: (count) =>
        `Teie veebisaidil on ${count} SEO-ülesannet ootel.`,
      planReady: "Kuine kasvuplaan on ülevaatamiseks valmis.",
      gscNotConnected: "Google Search Console pole veel ühendatud.",
      socialDraftsReady: (count) =>
        `${count} sotsiaalpostituse mustand${count === 1 ? "" : "it"} on valmis.`,
      emailDraftsWaiting: (count) =>
        `${count} e-kirja mustand${count === 1 ? "" : "it"} ootab ülevaatamist.`,
      opportunitiesFound: (count) =>
        `RankBoost leidis ${count} kasvuvõimalust.`,
    },
    secondary: {
      doLater: "Tee hiljem",
      openSetup: "Ava seadistamine",
    },
    billingNoteFree:
      "Olete tasuta paketil. Uuendage paketti, kui vajate rohkem toiminguid.",
  },
  controlCenter: {
    status: {
      setupNeeded: "Seadistamine vajalik",
      setupNeededDesc: "Lisage veebisait juhtimiskeskuse kasutamiseks.",
      setupNeededNoData:
        "Ühendage andmeallikad või käivitage audit, et RankBoost saaks toiminguid ette valmistada.",
      limitedData: "Piiratud andmed",
      limitedDataDesc:
        "Käivitage audit või ühendage Google Search Console, et RankBoost saaks toiminguid ette valmistada.",
      needsReview: "Vajab ülevaatamist",
      needsReviewDesc:
        "RankBoost valmistas ette kasvutoiminguid, mis vajavad teie ülevaatamist.",
      ready: "Valmis",
      readyDesc:
        "Teie praegune kasvuplaan on kinnitatud. RankBoost jälgib uusi võimalusi.",
      monitoring: "Jälgimine",
      monitoringDesc:
        "Kiireloomulisi kinnitusi pole. RankBoost jälgib teie veebisaiti.",
    },
    recommended: {
      generatePlanTitle: "Genereerige selle kuu kasvuplaan",
      generatePlanDesc:
        "Korraldage SEO, sisu ja sotsiaalmeedia prioriteedid käesolevaks kuuks.",
      prepareEmailTitle: "Valmistage ülevaatav e-kiri",
      prepareEmailDesc: "Looge e-kirja mustand selle kuu kasvuplaanist.",
      reviewEmailTitle: "Vaadake ettevalmistatud e-kiri üle",
      reviewEmailDesc: (count) =>
        `${count} e-kirja mustand${count === 1 ? "" : "it"} ootab ülevaatamist.`,
      reviewArticlesTitle: "Vaadake artiklite mustandid üle",
      reviewArticlesDesc: (count) =>
        `${count} artikli mustand${count === 1 ? "" : "it"} vajab tähelepanu.`,
      copySocialTitle: "Kopeerige valmis sotsiaalpostitused",
      copySocialDesc: (count) =>
        `${count} postituse mustand${count === 1 ? "" : "it"} on kopeerimiseks valmis.`,
      connectGscTitle: "Ühendage Google Search Console",
      connectGscDesc: "Avage otsingupäringute võimalused ja liikluse ülevaated.",
      fixTasksTitle: "Parandage kõrge prioriteediga SEO-ülesanded",
      fixTasksDesc: (count) =>
        `${count} kõrge prioriteediga ülesanne${count === 1 ? "" : "t"} on avatud.`,
      runAuditTitle: "Käivitage veebisaidi audit",
      runAuditDesc: "Värskendage tehnilised leiud ja Growth Score.",
      reviewTimelineTitle: "Vaadake hiljutine tegevus üle",
      reviewTimelineDesc: (count) =>
        `${count} lugemata ajajoone sündmus${count === 1 ? "" : "t"}.`,
    },
  },
  timeline: {
    sources: {
      AUDIT_ENGINE: "Auditi mootor",
      RULE_ENGINE: "Reeglid",
      GROWTH_SCORE: "Growth Score",
      TASKS: "Ülesanded",
      CONTENT_PLAN: "Sisuplaan",
      REPORTS: "Aruanded",
      GSC: "Search Console",
      WORDPRESS: "WordPress",
      HERMES: "Hermes AI",
      AI_QUALITY_PIPELINE: "AI kvaliteet",
      CONTINUOUS_IMPROVEMENT: "Kasvumootor",
      SYSTEM: "Süsteem",
    },
    severityLabels: {
      INFO: "Info",
      WARNING: "Hoiatus",
      ERROR: "Viga",
      SUCCESS: "Valmis",
      OPPORTUNITY: "Võimalus",
    },
    eventTitles: {
      AUDIT_COMPLETED: "Veebisaidi audit lõpetatud",
      SCORE_CHANGED: "Kasvuskoor muutus",
      TASK_CREATED: "Loodud uus kasvülesanne",
      TASK_CREATED_GSC: "Search Console'i ülevaade teisendati ülesandeks",
      TASK_COMPLETED: "Ülesanne tehtud",
      GSC_OPPORTUNITY_FOUND: "Leitud uus Search Console'i võimalus",
      GSC_INSIGHT_FOUND: "Leitud uus Search Console'i ülevaade",
      ARTICLE_DRAFT_CREATED: "Artikli mustand loodud",
      AI_RECOMMENDATION_CREATED: "AI sisu kvaliteedikontroll lõpetatud",
      WORDPRESS_DRAFT_CREATED: "WordPressi mustand loodud",
      INTEGRATION_CONNECTED: "Integratsioon ühendatud",
      INTEGRATION_ERROR: "Integratsioon vajab tähelepanu",
      REPORT_CREATED: "Uus aruanne loodud",
      CONTENT_IDEA_CREATED: "Uus sisuidee loodud",
      SOCIAL_POST_DRAFT_CREATED: "Sotsiaalpostituse mustand loodud",
      MONTHLY_AUTOPILOT_PLAN_CREATED: "Kuine kasvuplaan loodud",
      EMAIL_APPROVAL_CREATED: "Ülevaatusmeil ette valmistatud",
    },
    systemNoteTitles: {
      "Monthly growth plan approved": "Kuine kasvuplaan kinnitatud",
      "Social post copied": "Sotsiaalpostitus kopeeritud",
      "Review email approved": "Ülevaatusmeil kinnitatud",
      "Review email sent": "Ülevaatusmeil saadetud",
      "Autopilot plan item executed": "Autopiloot täitis plaani punkti",
      "Subscription updated": "Tellimus uuendatud",
    },
    knownSummaries: {
      "RankBoost prepared a monthly plan with priority tasks, content ideas, and social post opportunities.":
        "RankBoost koostas kuuplaani prioriteetsete ülesannete, sisuideede ja postitusvõimalustega.",
      "The monthly plan was approved and is ready for execution.":
        "Kuuplaan on kinnitatud ja valmis täitmiseks.",
      "Autopilot prepared an article draft for review.":
        "Artikkel valmis ülevaatamiseks",
      "Autopilot created a WordPress draft from an approved article.":
        "WordPressi mustand loodud",
      "Autopilot prepared a research brief for a scheduled article.":
        "Uuring valmis",
      "Autopilot prepared a publishing handoff (draft or export package).":
        "Avaldamispakett valmis",
      "Your RankBoost subscription was updated.":
        "Teie RankBoosti tellimust uuendati.",
      "RankBoost prepared an email draft for your approval.":
        "RankBoost valmistas ette e-kirja mustandi teie kinnitamiseks.",
      "An email draft was approved by the user.": "E-kirja mustand kinnitati.",
      "An approved review email was sent manually.":
        "Kinnitatud ülevaatuskiri saadeti käsitsi.",
    },
    summaryHeadlines: {
      quiet:
        "Olulisi muutusi teie viimase külastuse järel pole. RankBoost jälgib teie veebisaiti edasi.",
      monitoringContinued:
        "RankBoost jälgis teie veebisaiti edasi, kui te eemal olite.",
      sinceVisit: (details) =>
        `Teie viimase külastuse järel leidis RankBoost ${details}.`,
      opportunities: (count) =>
        `${count} uut ${count === 1 ? "võimalus" : "võimalust"}`,
      newTasks: (count) =>
        `${count} uut ${count === 1 ? "ülesanne" : "ülesannet"}`,
      completedTasks: (count) =>
        `${count} lõpetatud ${count === 1 ? "ülesanne" : "ülesannet"}`,
      scoreChange: (delta) => `Kasvuskoor ${delta}`,
    },
    eventSummaries: {
      auditCompleted: (findings, tasks) => {
        const parts = ["RankBoost skannis teie saidi ja uuendas soovitusi."];
        if (findings > 0) parts.push(`${findings} leidu vajab tähelepanu.`);
        if (tasks > 0) parts.push(`Loodi uusi ülesandeid: ${tasks}.`);
        return parts.join(" ");
      },
      scoreChanged: (from, to, delta) =>
        `Growth Score ${delta > 0 ? "tõusis" : "langes"} ${from} → ${to} (${delta > 0 ? "+" : ""}${delta}).`,
      qualityPassed: "Artikli mustand läbis kvaliteedikontrolli.",
      qualityNeedsReview: "Artikli mustand vajab enne avaldamist teie ülevaatust.",
      wordpressDraftCreated: "WordPressis loodi mustand — see ootab ülevaatust.",
      socialPostDraftCreated: (platform) => `Loodi ${platform} postituse mustand.`,
      socialPostCopied: "Sotsiaalmeedia postituse mustand kopeeriti avaldamiseks.",
    },
    actions: {
      openArticle: "Ava artikkel",
      openReport: "Ava aruanne",
      openIntegration: "Ava integratsioonid",
      viewInsight: "Vaata ülevaadet",
      openDashboard: "Ava ülevaade",
      openSocialPosts: "Ava sotsiaalpostitused",
      openAutopilot: "Ava kasvuplaan",
      openEmailApprovals: "Ava e-kirjad",
      openContentPlan: "Ava sisuplaan",
    },
  },
  onboardingForms: {
    websiteUrlRequired: "Jätkamiseks sisestage veebisaidi URL.",
    addWebsiteFailed: "Veebisaidi lisamine ebaõnnestus",
    addWebsiteNetworkError: "Võrguviga veebisaidi lisamisel",
    websitePlaceholder: "https://yourwebsite.com",
    auditFailed: "Auditi käivitamine ebaõnnestus",
    auditNetworkError: "Võrguviga auditi käivitamisel",
    skipGscFailed: "Sammu vahelejätmine ebaõnnestus",
    markViewedFailed: "Tulemuste vaatatuks märkimine ebaõnnestus",
    generatePlanFailed: "Plaani genereerimine ebaõnnestus",
    generatePlanNetworkError: "Võrguviga plaani genereerimisel",
    optional: "Valikuline",
    done: "Valmis",
    skipped: "Vahele jäetud",
    current: "Praegune samm",
    locked: "Lukustatud",
    progressLabel: (completed, total) => `${completed}/${total} sammu tehtud`,
    completeSetup: "Lõpeta seadistamine",
    continueSetup: "Jätka seadistamist",
  },
};
