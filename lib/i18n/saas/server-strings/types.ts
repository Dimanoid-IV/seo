export type SaasServerStrings = {
  dashboard: {
    growthScore: {
      notEnough: string;
      lookingGood: string;
      roomToGrow: string;
      needsAttention: string;
    };
    hero: {
      getStarted: string;
      getStartedDesc: string;
      finishSetup: string;
      finishSetupDesc: string;
      runFirstAudit: string;
      runFirstAuditDesc: string;
      actionsReady: string;
      actionsReadyDesc: string;
      planActive: string;
      planActiveDesc: string;
    };
    nextAction: {
      reviewPlanTitle: string;
      reviewPlanDesc: string;
      runAuditTitle: string;
      runAuditDesc: string;
      connectGscTitle: string;
      connectGscDesc: string;
      reviewEmailTitle: string;
      reviewEmailDesc: string;
    };
    actionLabels: {
      openGrowthPlan: string;
      reviewEmail: string;
      viewDrafts: string;
      viewPosts: string;
      connectGsc: string;
      runAudit: string;
      viewTasks: string;
      openTimeline: string;
      open: string;
    };
    findings: {
      seoTasksWaiting: (count: number) => string;
      planReady: string;
      gscNotConnected: string;
      socialDraftsReady: (count: number) => string;
      emailDraftsWaiting: (count: number) => string;
      opportunitiesFound: (count: number) => string;
    };
    secondary: {
      doLater: string;
      openSetup: string;
    };
    billingNoteFree: string;
  };
  controlCenter: {
    status: {
      setupNeeded: string;
      setupNeededDesc: string;
      setupNeededNoData: string;
      limitedData: string;
      limitedDataDesc: string;
      needsReview: string;
      needsReviewDesc: string;
      ready: string;
      readyDesc: string;
      monitoring: string;
      monitoringDesc: string;
    };
    recommended: {
      generatePlanTitle: string;
      generatePlanDesc: string;
      prepareEmailTitle: string;
      prepareEmailDesc: string;
      reviewEmailTitle: string;
      reviewEmailDesc: (count: number) => string;
      reviewArticlesTitle: string;
      reviewArticlesDesc: (count: number) => string;
      copySocialTitle: string;
      copySocialDesc: (count: number) => string;
      connectGscTitle: string;
      connectGscDesc: string;
      fixTasksTitle: string;
      fixTasksDesc: (count: number) => string;
      runAuditTitle: string;
      runAuditDesc: string;
      reviewTimelineTitle: string;
      reviewTimelineDesc: (count: number) => string;
    };
  };
  timeline: {
    sources: Record<string, string>;
    severityLabels: Record<string, string>;
    eventTitles: Record<string, string>;
    systemNoteTitles: Record<string, string>;
    knownSummaries: Record<string, string>;
    summaryHeadlines: {
      quiet: string;
      monitoringContinued: string;
      sinceVisit: (details: string) => string;
      opportunities: (count: number) => string;
      newTasks: (count: number) => string;
      completedTasks: (count: number) => string;
      scoreChange: (delta: string) => string;
    };
    eventSummaries: {
      auditCompleted: (findings: number, tasks: number) => string;
      scoreChanged: (from: string, to: number, delta: number) => string;
      qualityPassed: string;
      qualityNeedsReview: string;
      wordpressDraftCreated: string;
      socialPostDraftCreated: (platform: string) => string;
      socialPostCopied: string;
    };
    actions: {
      openArticle: string;
      openReport: string;
      openIntegration: string;
      viewInsight: string;
      openDashboard: string;
      openSocialPosts: string;
      openAutopilot: string;
      openEmailApprovals: string;
      openContentPlan: string;
    };
  };
  onboardingForms: {
    websiteUrlRequired: string;
    addWebsiteFailed: string;
    addWebsiteNetworkError: string;
    websitePlaceholder: string;
    auditFailed: string;
    auditNetworkError: string;
    skipGscFailed: string;
    markViewedFailed: string;
    generatePlanFailed: string;
    generatePlanNetworkError: string;
    optional: string;
    done: string;
    skipped: string;
    current: string;
    locked: string;
    progressLabel: (completed: number, total: number) => string;
    completeSetup: string;
    continueSetup: string;
  };
};
