import type { SaasServerStrings } from "./types";

export const serverStringsEn: SaasServerStrings = {
  dashboard: {
    growthScore: {
      notEnough: "Not enough data yet",
      lookingGood: "Looking good",
      roomToGrow: "Room to grow",
      needsAttention: "Needs attention",
    },
    hero: {
      getStarted: "Get started",
      getStartedDesc: "Add your website to start finding growth opportunities.",
      finishSetup: "Finish setup",
      finishSetupDesc: "Finish setup so RankBoost can prepare your first growth plan.",
      runFirstAudit: "Run your first audit",
      runFirstAuditDesc:
        "Run an audit so RankBoost can understand your website and prepare actions.",
      actionsReady: "Actions ready for you",
      actionsReadyDesc:
        "RankBoost found new opportunities and prepared actions for your review.",
      planActive: "Growth plan active",
      planActiveDesc:
        "Your growth plan is active. RankBoost is monitoring for new opportunities.",
    },
    nextAction: {
      reviewPlanTitle: "Review your monthly growth plan",
      reviewPlanDesc:
        "RankBoost prepared a plan with SEO, content, and social actions for this month.",
      runAuditTitle: "Check my site now",
      runAuditDesc:
        "RankBoost needs to scan your website before it can prepare actions.",
      connectGscTitle: "Connect Google Search Console",
      connectGscDesc: "Unlock real search queries and traffic opportunities.",
      reviewEmailTitle: "Review prepared email",
      reviewEmailDesc:
        "An approval email is ready. It will not be sent until you manually send it.",
      openReviewTitle: "Review ready materials",
      openReviewDesc:
        "RankBoost prepared an article or fix. Nothing is published without your confirmation.",
      openPlanTitle: "Open publishing plan",
      openPlanDesc:
        "Your plan has article topics — open it and decide what to prepare next.",
      selectGscTitle: "Choose your Google Search Console site",
      selectGscDesc:
        "Google is connected — select the site property to unlock search data.",
      setupPublishingTitle: "Set up publishing",
      setupPublishingDesc:
        "Connect WordPress or use manual publishing (export / developer handoff).",
      openControlTitle: "Open control center",
      openControlDesc:
        "See plan status, tasks, and next steps in one place.",
    },
    actionLabels: {
      openGrowthPlan: "Open growth plan",
      reviewEmail: "Review email",
      viewDrafts: "View drafts",
      viewPosts: "View posts",
      connectGsc: "Connect GSC",
      runAudit: "Check my site now",
      viewTasks: "View tasks",
      openTimeline: "Open timeline",
      open: "Open",
      openReview: "Open review queue",
      openPlan: "Open plan",
      selectGsc: "Choose site",
      setupPublishing: "Set up publishing",
      openControl: "Open control center",
      checkSiteNow: "Check my site now",
    },
    findings: {
      seoTasksWaiting: (count) =>
        `Your website has ${count} SEO task${count === 1 ? "" : "s"} waiting.`,
      planReady: "A monthly growth plan is ready for review.",
      gscNotConnected: "Google Search Console is not connected yet.",
      socialDraftsReady: (count) =>
        `${count} social post draft${count === 1 ? " is" : "s are"} ready.`,
      emailDraftsWaiting: (count) =>
        `${count} email draft${count === 1 ? " is" : "s are"} waiting for review.`,
      opportunitiesFound: (count) =>
        `RankBoost found ${count} growth opportunit${count === 1 ? "y" : "ies"}.`,
    },
    secondary: {
      doLater: "Do this later",
      openSetup: "Open setup",
    },
    billingNoteFree:
      "You're on the Free plan. Upgrade when you need more growth actions.",
  },
  controlCenter: {
    status: {
      setupNeeded: "Setup needed",
      setupNeededDesc: "Add a website to use Control Center.",
      setupNeededNoData:
        "Connect data sources or run an audit so RankBoost can prepare growth actions.",
      limitedData: "Limited data",
      limitedDataDesc:
        "Run an audit or connect Google Search Console so RankBoost can prepare growth actions.",
      needsReview: "Needs review",
      needsReviewDesc:
        "RankBoost prepared several growth actions that need your review.",
      ready: "Ready",
      readyDesc:
        "Your current growth plan is approved. RankBoost is monitoring for new opportunities.",
      monitoring: "Monitoring",
      monitoringDesc:
        "No urgent approvals right now. RankBoost is monitoring your website.",
    },
    recommended: {
      generatePlanTitle: "Generate this month's growth plan",
      generatePlanDesc:
        "Organize SEO, content, and social priorities for the current month.",
      prepareEmailTitle: "Prepare review email",
      prepareEmailDesc: "Create an email draft from this month's growth plan.",
      reviewEmailTitle: "Review prepared email",
      reviewEmailDesc: (count) =>
        `${count} email draft${count === 1 ? "" : "s"} waiting for your review.`,
      reviewArticlesTitle: "Review article drafts",
      reviewArticlesDesc: (count) =>
        `${count} article draft${count === 1 ? "" : "s"} need attention.`,
      copySocialTitle: "Copy ready social posts",
      copySocialDesc: (count) =>
        `${count} post draft${count === 1 ? "" : "s"} ready to copy or edit.`,
      connectGscTitle: "Connect Google Search Console",
      connectGscDesc: "Unlock search query opportunities and traffic insights.",
      fixTasksTitle: "Fix high-priority SEO tasks",
      fixTasksDesc: (count) =>
        `${count} high-priority task${count === 1 ? "" : "s"} are open.`,
      runAuditTitle: "Run a website audit",
      runAuditDesc: "Refresh technical SEO findings and Growth Score.",
      reviewTimelineTitle: "Review recent growth activity",
      reviewTimelineDesc: (count) =>
        `${count} unread timeline event${count === 1 ? "" : "s"}.`,
    },
  },
  timeline: {
    sources: {
      AUDIT_ENGINE: "Audit Engine",
      RULE_ENGINE: "Rule Engine",
      GROWTH_SCORE: "Growth Score",
      TASKS: "Tasks",
      CONTENT_PLAN: "Content Plan",
      REPORTS: "Reports",
      GSC: "Search Console",
      WORDPRESS: "WordPress",
      HERMES: "Hermes AI",
      AI_QUALITY_PIPELINE: "AI Quality",
      CONTINUOUS_IMPROVEMENT: "Growth Engine",
      SYSTEM: "System",
    },
    severityLabels: {
      INFO: "Info",
      WARNING: "Warning",
      ERROR: "Error",
      SUCCESS: "Success",
      OPPORTUNITY: "Opportunity",
    },
    eventTitles: {
      AUDIT_COMPLETED: "Website audit completed",
      SCORE_CHANGED: "Growth Score changed",
      TASK_CREATED: "New growth task created",
      TASK_CREATED_GSC: "Search Console insight converted into a task",
      TASK_COMPLETED: "Task completed",
      GSC_OPPORTUNITY_FOUND: "New Search Console opportunity found",
      GSC_INSIGHT_FOUND: "New Search Console insight found",
      ARTICLE_DRAFT_CREATED: "Article draft created",
      AI_RECOMMENDATION_CREATED: "AI content quality check completed",
      WORDPRESS_DRAFT_CREATED: "WordPress draft created",
      INTEGRATION_CONNECTED: "Integration connected",
      INTEGRATION_ERROR: "Integration needs attention",
      REPORT_CREATED: "New report created",
      CONTENT_IDEA_CREATED: "New content idea created",
      SOCIAL_POST_DRAFT_CREATED: "Social post draft created",
      MONTHLY_AUTOPILOT_PLAN_CREATED: "Monthly growth plan created",
      EMAIL_APPROVAL_CREATED: "Review email prepared",
    },
    systemNoteTitles: {
      "Monthly growth plan approved": "Monthly growth plan approved",
      "Social post copied": "Social post copied",
      "Review email approved": "Review email approved",
      "Review email sent": "Review email sent",
      "Autopilot plan item executed": "Autopilot plan item executed",
      "Subscription updated": "Subscription updated",
    },
    knownSummaries: {
      "RankBoost prepared a monthly plan with priority tasks, content ideas, and social post opportunities.":
        "RankBoost prepared a monthly plan with priority tasks, content ideas, and social post opportunities.",
      "The monthly plan was approved and is ready for execution.":
        "The monthly plan was approved and is ready for execution.",
      "Autopilot prepared an article draft for review.":
        "Autopilot prepared an article draft for review.",
      "Autopilot created a WordPress draft from an approved article.":
        "Autopilot created a WordPress draft from an approved article.",
      "Your RankBoost subscription was updated.":
        "Your RankBoost subscription was updated.",
      "RankBoost prepared an email draft for your approval.":
        "RankBoost prepared an email draft for your approval.",
      "An email draft was approved by the user.":
        "An email draft was approved by the user.",
      "An approved review email was sent manually.":
        "An approved review email was sent manually.",
    },
    summaryHeadlines: {
      quiet:
        "No major changes since your last visit. RankBoost is still monitoring your website.",
      monitoringContinued:
        "RankBoost continued monitoring your website while you were away.",
      sinceVisit: (details) =>
        `Since your last visit, RankBoost found ${details}.`,
      opportunities: (count) =>
        `${count} new ${count === 1 ? "opportunity" : "opportunities"}`,
      newTasks: (count) => `${count} new ${count === 1 ? "task" : "tasks"}`,
      completedTasks: (count) =>
        `${count} completed ${count === 1 ? "task" : "tasks"}`,
      scoreChange: (delta) => `Growth Score ${delta}`,
    },
    eventSummaries: {
      auditCompleted: (findings, tasks) => {
        const parts = ["RankBoost scanned your website and updated its recommendations."];
        if (findings > 0) parts.push(`${findings} findings need attention.`);
        if (tasks > 0) parts.push(`${tasks} new tasks were created.`);
        return parts.join(" ");
      },
      scoreChanged: (from, to, delta) =>
        `Your Growth Score ${delta > 0 ? "increased" : "decreased"} from ${from} to ${to} (${delta > 0 ? "+" : ""}${delta}).`,
      qualityPassed: "The article draft passed quality checks.",
      qualityNeedsReview: "The article draft needs your review before publishing.",
      wordpressDraftCreated: "A draft was created in WordPress and is waiting for review.",
      socialPostDraftCreated: (platform) => `A new ${platform} post draft was created.`,
      socialPostCopied: "A social post draft was copied for publishing.",
    },
    actions: {
      openArticle: "Open article",
      openReport: "Open report",
      openIntegration: "Open integration",
      viewInsight: "View insight",
      openDashboard: "Open dashboard",
      openSocialPosts: "Open social posts",
      openAutopilot: "Open growth plan",
      openEmailApprovals: "Open review emails",
      openContentPlan: "Open content plan",
    },
  },
  onboardingForms: {
    websiteUrlRequired: "Enter your website URL to continue.",
    addWebsiteFailed: "Could not add website",
    addWebsiteNetworkError: "Network error while adding website",
    websitePlaceholder: "https://yourwebsite.com",
    auditFailed: "Could not run audit",
    auditNetworkError: "Network error while running audit",
    skipGscFailed: "Could not skip this step",
    markViewedFailed: "Could not mark results as viewed",
    generatePlanFailed: "Could not generate plan",
    generatePlanNetworkError: "Network error while generating plan",
    optional: "Optional",
    done: "Done",
    skipped: "Skipped",
    current: "Current step",
    locked: "Locked",
    progressLabel: (completed, total) => `${completed} of ${total} steps complete`,
    completeSetup: "Complete setup",
    continueSetup: "Continue setup",
  },
};
