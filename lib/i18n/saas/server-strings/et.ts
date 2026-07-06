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
      runAuditTitle: "Käivitage esimene audit",
      runAuditDesc:
        "RankBoost peab teie veebisaidi skaneerima enne toimingute ettevalmistamist.",
      connectGscTitle: "Ühendage Google Search Console",
      connectGscDesc: "Avage tegelikud otsingupäringud ja liikluse võimalused.",
      reviewEmailTitle: "Vaadake ettevalmistatud e-kiri üle",
      reviewEmailDesc:
        "Kinnitamise e-kiri on valmis. Seda ei saadeta enne, kui saadate selle käsitsi.",
    },
    actionLabels: {
      openGrowthPlan: "Ava kasvuplaan",
      reviewEmail: "Vaata e-kirja",
      viewDrafts: "Vaata mustandeid",
      viewPosts: "Vaata postitusi",
      connectGsc: "Ühenda GSC",
      runAudit: "Käivita audit",
      viewTasks: "Vaata ülesandeid",
      openTimeline: "Ava ajalugu",
      open: "Ava",
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
