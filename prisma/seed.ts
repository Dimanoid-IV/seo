import {
  ActivityType,
  AIJobStatus,
  AIJobType,
  AIUsagePurpose,
  ArticleStatus,
  AuditCheckCategory,
  AuditCheckSeverity,
  AuditCheckStatus,
  AuditStatus,
  AuditTriggeredBy,
  AuditType,
  EmailStatus,
  EmailType,
  Locale,
  MonthlyPlanStatus,
  OrganizationStatus,
  PlanItemStatus,
  PlanItemType,
  ReportStatus,
  ReportType,
  ScoreSource,
  SocialPlatform,
  SocialPostStatus,
  SubscriptionPlan,
  SubscriptionStatus,
  TaskCategory,
  TaskPriority,
  TaskSource,
  TaskStatus,
  UserRole,
  WebsiteLanguage,
  WebsiteStatus,
  WordPressConnectionStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { hashSecret } from "../lib/security";
import { getPrisma } from "../lib/db";

const DEMO_USER_EMAIL = "demo@rankboost.local";
const DEMO_ORG_NAME = "Demo Organization";
const DEMO_WEBSITE_URL = "https://example.com";

function monthPeriod(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999)
  );
  return { start, end };
}

type SeedPrisma = ReturnType<typeof getPrisma>;

async function seedDemoAuditData({
  prisma,
  websiteId,
  organizationId,
  userId,
}: {
  prisma: SeedPrisma;
  websiteId: string;
  organizationId: string;
  userId: string;
}): Promise<void> {
  const existingAudit = await prisma.audit.findFirst({
    where: {
      websiteId,
      type: AuditType.PREVIEW,
      status: AuditStatus.COMPLETED,
      deletedAt: null,
    },
  });

  if (existingAudit) {
    console.log("Demo preview audit already exists — skipping audit seed.");
    return;
  }

  const completedAt = new Date();
  const startedAt = new Date(completedAt.getTime() - 2 * 60 * 1000);
  const growthScore = 62;
  const aiReadinessScore = 48;

  const audit = await prisma.audit.create({
    data: {
      websiteId,
      type: AuditType.PREVIEW,
      status: AuditStatus.COMPLETED,
      triggeredBy: AuditTriggeredBy.SYSTEM,
      triggeredByUserId: userId,
      growthScore,
      aiReadinessScore,
      summaryJson: {
        headline: "Demo preview audit completed",
        pagesScanned: 12,
      },
      visiblePreviewJson: {
        issuesShown: 4,
        quickWins: 2,
      },
      startedAt,
      completedAt,
    },
  });

  const checks = [
    {
      category: AuditCheckCategory.TECHNICAL,
      code: "missing_meta_description",
      title: "Missing meta descriptions",
      description: "Several pages lack unique meta descriptions.",
      severity: AuditCheckSeverity.HIGH,
      status: AuditCheckStatus.FAIL,
      scoreImpact: -8,
      isVisibleInPreview: true,
    },
    {
      category: AuditCheckCategory.PERFORMANCE,
      code: "slow_lcp",
      title: "Slow largest contentful paint",
      description: "Homepage LCP exceeds recommended threshold.",
      severity: AuditCheckSeverity.MEDIUM,
      status: AuditCheckStatus.WARNING,
      scoreImpact: -5,
      isVisibleInPreview: true,
    },
    {
      category: AuditCheckCategory.CONTENT,
      code: "thin_content",
      title: "Thin content on key pages",
      description: "Service pages have limited word count.",
      severity: AuditCheckSeverity.MEDIUM,
      status: AuditCheckStatus.WARNING,
      scoreImpact: -4,
      isVisibleInPreview: true,
    },
    {
      category: AuditCheckCategory.LOCAL_SEO,
      code: "missing_local_schema",
      title: "LocalBusiness schema not detected",
      description: "Structured data can improve local visibility.",
      severity: AuditCheckSeverity.LOW,
      status: AuditCheckStatus.WARNING,
      scoreImpact: -3,
      isVisibleInPreview: false,
    },
    {
      category: AuditCheckCategory.AI_READINESS,
      code: "weak_faq_structure",
      title: "Limited FAQ-style content",
      description: "AI assistants prefer clear Q&A blocks.",
      severity: AuditCheckSeverity.INFO,
      status: AuditCheckStatus.PASS,
      scoreImpact: 0,
      isVisibleInPreview: true,
    },
  ];

  await prisma.auditCheck.createMany({
    data: checks.map((check) => ({
      auditId: audit.id,
      websiteId,
      ...check,
      recommendationJson: { action: "fix", priority: check.severity },
    })),
  });

  await prisma.growthScoreSnapshot.create({
    data: {
      websiteId,
      auditId: audit.id,
      score: growthScore,
      previousScore: null,
      delta: null,
      breakdownJson: {
        technical: 58,
        content: 64,
        local: 55,
        performance: 60,
      },
      reason: "Initial preview audit score",
      source: ScoreSource.AUDIT,
    },
  });

  await prisma.aIReadinessSnapshot.create({
    data: {
      websiteId,
      auditId: audit.id,
      score: aiReadinessScore,
      previousScore: null,
      delta: null,
      breakdownJson: {
        structure: 50,
        clarity: 45,
        trust: 52,
      },
      reason: "Initial preview audit AI readiness",
      source: ScoreSource.AUDIT,
    },
  });

  await prisma.website.update({
    where: { id: websiteId },
    data: {
      lastAuditAt: completedAt,
      currentGrowthScore: growthScore,
      currentAIReadinessScore: aiReadinessScore,
    },
  });

  const activityBase = {
    organizationId,
    websiteId,
    userId,
  };

  await prisma.activity.createMany({
    data: [
      {
        ...activityBase,
        type: ActivityType.AUDIT_STARTED,
        title: "Preview audit started",
        description: "Demo preview audit queued for analysis.",
        metadataJson: { auditId: audit.id, auditType: AuditType.PREVIEW },
      },
      {
        ...activityBase,
        type: ActivityType.AUDIT_COMPLETED,
        title: "Preview audit completed",
        description: "Demo preview audit finished successfully.",
        metadataJson: {
          auditId: audit.id,
          growthScore,
          aiReadinessScore,
        },
      },
      {
        ...activityBase,
        type: ActivityType.GROWTH_SCORE_UPDATED,
        title: "Growth Score updated",
        description: `Growth Score set to ${growthScore}.`,
        metadataJson: { auditId: audit.id, score: growthScore },
      },
    ],
  });

  console.log("Demo audit data seeded:", { auditId: audit.id });
}

function currentMonthKey(): string {
  const now = new Date();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${now.getUTCFullYear()}-${month}`;
}

async function seedDemoContentData({
  prisma,
  websiteId,
  organizationId,
  userId,
  userEmail,
}: {
  prisma: SeedPrisma;
  websiteId: string;
  organizationId: string;
  userId: string;
  userEmail: string;
}): Promise<void> {
  const month = currentMonthKey();

  const existingPlan = await prisma.monthlyPlan.findUnique({
    where: {
      websiteId_month: { websiteId, month },
    },
  });

  if (existingPlan) {
    console.log("Demo monthly plan already exists — skipping content seed.");
    return;
  }

  const { start, end } = monthPeriod();

  const monthlyPlan = await prisma.monthlyPlan.create({
    data: {
      websiteId,
      organizationId,
      month,
      status: MonthlyPlanStatus.ACTIVE,
      goalsJson: { focus: ["technical", "content"], articles: 1, social: 2 },
      summary: "Demo content plan for dashboard preview",
    },
  });

  const audit = await prisma.audit.findFirst({
    where: { websiteId, status: AuditStatus.COMPLETED, deletedAt: null },
    orderBy: { completedAt: "desc" },
  });

  const tasks = await Promise.all([
    prisma.task.create({
      data: {
        websiteId,
        organizationId,
        auditId: audit?.id,
        title: "Add meta descriptions to service pages",
        description: "Unique meta descriptions improve CTR from search.",
        category: TaskCategory.TECHNICAL,
        priority: TaskPriority.HIGH,
        status: TaskStatus.OPEN,
        impactScore: 8,
        source: TaskSource.AUDIT,
      },
    }),
    prisma.task.create({
      data: {
        websiteId,
        organizationId,
        title: "Publish local landing page content",
        category: TaskCategory.CONTENT,
        priority: TaskPriority.MEDIUM,
        status: TaskStatus.IN_PROGRESS,
        impactScore: 6,
        source: TaskSource.AI,
      },
    }),
    prisma.task.create({
      data: {
        websiteId,
        organizationId,
        title: "Optimize Google Business Profile",
        category: TaskCategory.LOCAL_SEO,
        priority: TaskPriority.MEDIUM,
        status: TaskStatus.OPEN,
        impactScore: 7,
        source: TaskSource.SYSTEM,
      },
    }),
  ]);

  const aiJob = await prisma.aIJob.create({
    data: {
      websiteId,
      organizationId,
      userId,
      type: AIJobType.GENERATE_ARTICLE,
      status: AIJobStatus.COMPLETED,
      provider: "hermes-stub",
      model: "demo-model",
      costCents: 45,
      startedAt: new Date(Date.now() - 60_000),
      completedAt: new Date(),
      outputJson: { status: "ok" },
    },
  });

  await prisma.aIUsage.create({
    data: {
      aiJobId: aiJob.id,
      websiteId,
      organizationId,
      userId,
      provider: "hermes-stub",
      model: "demo-model",
      inputTokens: 1200,
      outputTokens: 800,
      totalTokens: 2000,
      costCents: 45,
      purpose: AIUsagePurpose.CONTENT_GENERATION,
    },
  });

  const article = await prisma.article.create({
    data: {
      websiteId,
      organizationId,
      monthlyPlanId: monthlyPlan.id,
      title: "How local SEO helps small businesses in Estonia",
      slug: "local-seo-estonia-demo",
      language: WebsiteLanguage.EN,
      status: ArticleStatus.DRAFT,
      topic: "Local SEO",
      targetKeyword: "local seo estonia",
      metaTitle: "Local SEO in Estonia | Demo",
      contentHtml: "<p>Demo article draft for dashboard preview.</p>",
      generatedByAIJobId: aiJob.id,
    },
  });

  await prisma.socialPost.createMany({
    data: [
      {
        websiteId,
        organizationId,
        monthlyPlanId: monthlyPlan.id,
        platform: SocialPlatform.LINKEDIN,
        language: WebsiteLanguage.EN,
        status: SocialPostStatus.READY,
        text: "Demo LinkedIn post about local SEO wins.",
        hook: "3 quick wins for local visibility",
        hashtagsJson: ["#SEO", "#Estonia"],
      },
      {
        websiteId,
        organizationId,
        articleId: article.id,
        monthlyPlanId: monthlyPlan.id,
        platform: SocialPlatform.FACEBOOK,
        language: WebsiteLanguage.EN,
        status: SocialPostStatus.DRAFT,
        text: "Demo Facebook post promoting the new article draft.",
      },
    ],
  });

  await prisma.report.create({
    data: {
      websiteId,
      organizationId,
      type: ReportType.MONTHLY,
      periodStart: start,
      periodEnd: end,
      status: ReportStatus.READY,
      title: `Monthly SEO Report — ${month}`,
      summary: "Demo monthly report ready to send.",
      reportJson: {
        growthScore: 62,
        tasksCompleted: 0,
        highlights: ["Preview audit completed"],
      },
    },
  });

  await prisma.emailLog.create({
    data: {
      organizationId,
      websiteId,
      userId,
      toEmail: userEmail,
      fromEmail: "RankBoost <noreply@rankboost.eu>",
      subject: `Your monthly SEO report — ${month}`,
      type: EmailType.MONTHLY_REPORT,
      status: EmailStatus.SENT,
      sentAt: new Date(),
    },
  });

  const wpSiteUrl = "https://example.com/wp";
  const existingWp = await prisma.wordPressConnection.findUnique({
    where: {
      websiteId_siteUrl: { websiteId, siteUrl: wpSiteUrl },
    },
  });

  if (!existingWp) {
    await prisma.wordPressConnection.create({
      data: {
        websiteId,
        organizationId,
        status: WordPressConnectionStatus.DISCONNECTED,
        siteUrl: wpSiteUrl,
        apiKeyHash: hashSecret("demo-wp-api-key-not-real"),
        permissionsJson: { drafts: true, publish: false },
      },
    });
  }

  await prisma.planItem.create({
    data: {
      monthlyPlanId: monthlyPlan.id,
      type: PlanItemType.ARTICLE,
      title: article.title,
      status: PlanItemStatus.PLANNED,
      linkedArticleId: article.id,
      linkedTaskId: tasks[0]?.id,
    },
  });

  console.log("Demo content data seeded:", {
    monthlyPlanId: monthlyPlan.id,
    taskCount: tasks.length,
    articleId: article.id,
    aiJobId: aiJob.id,
  });
}

async function main(): Promise<void> {
  if (!process.env.DATABASE_URL?.trim()) {
    console.log("DATABASE_URL is not set — skipping seed.");
    return;
  }

  const prisma = getPrisma();

  try {
    const adminEmail = process.env.ADMIN_EMAIL?.trim();
    const adminPassword = process.env.ADMIN_PASSWORD?.trim();

    if (adminEmail && adminPassword) {
      const passwordHash = await bcrypt.hash(adminPassword, 12);
      await prisma.user.upsert({
        where: { email: adminEmail },
        update: {
          role: UserRole.ADMIN,
          emailVerified: true,
          emailVerifiedAt: new Date(),
        },
        create: {
          email: adminEmail,
          passwordHash,
          name: "Admin",
          role: UserRole.ADMIN,
          locale: Locale.EN,
          emailVerified: true,
          emailVerifiedAt: new Date(),
        },
      });
      console.log(`Admin user ensured: ${adminEmail}`);
    } else {
      console.log(
        "ADMIN_EMAIL or ADMIN_PASSWORD not set — skipping admin user (demo data only)."
      );
    }

    const demoPasswordHash = await bcrypt.hash("demo-password-change-me", 12);
    const demoUser = await prisma.user.upsert({
      where: { email: DEMO_USER_EMAIL },
      update: {},
      create: {
        email: DEMO_USER_EMAIL,
        passwordHash: demoPasswordHash,
        name: "Demo User",
        role: UserRole.USER,
        locale: Locale.RU,
        emailVerified: true,
        emailVerifiedAt: new Date(),
      },
    });

    let organization = await prisma.organization.findFirst({
      where: { ownerUserId: demoUser.id, deletedAt: null },
    });

    if (!organization) {
      organization = await prisma.organization.create({
        data: {
          name: DEMO_ORG_NAME,
          country: "EE",
          city: "Tallinn",
          ownerUserId: demoUser.id,
          billingUserId: demoUser.id,
          status: OrganizationStatus.ACTIVE,
        },
      });
    }

    const website = await prisma.website.upsert({
      where: {
        organizationId_url: {
          organizationId: organization.id,
          url: DEMO_WEBSITE_URL,
        },
      },
      update: {},
      create: {
        organizationId: organization.id,
        url: DEMO_WEBSITE_URL,
        displayName: "Demo Website",
        primaryLanguage: WebsiteLanguage.EN,
        contentLanguages: ["en"],
        status: WebsiteStatus.ACTIVE,
      },
    });

    let subscription = await prisma.subscription.findFirst({
      where: {
        organizationId: organization.id,
        plan: SubscriptionPlan.FREE,
        deletedAt: null,
      },
    });

    const { start, end } = monthPeriod();

    if (!subscription) {
      subscription = await prisma.subscription.create({
        data: {
          organizationId: organization.id,
          userId: demoUser.id,
          plan: SubscriptionPlan.FREE,
          status: SubscriptionStatus.ACTIVE,
          currentPeriodStart: start,
          currentPeriodEnd: end,
        },
      });
    }

    const existingLimit = await prisma.planLimit.findFirst({
      where: {
        subscriptionId: subscription.id,
        periodStart: start,
      },
    });

    if (!existingLimit) {
      await prisma.planLimit.create({
        data: {
          subscriptionId: subscription.id,
          organizationId: organization.id,
          periodStart: start,
          periodEnd: end,
          auditsLimit: 1,
          articlesLimit: 0,
          socialPostsLimit: 0,
          websitesLimit: 1,
        },
      });
    }

    await seedDemoAuditData({
      prisma,
      websiteId: website.id,
      organizationId: organization.id,
      userId: demoUser.id,
    });

    await seedDemoContentData({
      prisma,
      websiteId: website.id,
      organizationId: organization.id,
      userId: demoUser.id,
      userEmail: demoUser.email,
    });

    console.log("Seed complete:", {
      demoUser: demoUser.email,
      organizationId: organization.id,
      websiteId: website.id,
      subscriptionId: subscription.id,
    });
  } finally {
    await prisma.$disconnect().catch(() => undefined);
  }
}

main().catch((error: unknown) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
