import type { Dictionary } from "./ru";

export const dictionary: Dictionary = {
  meta: {
    siteName: "RankBoost.eu",
    siteDescription:
      "SEO Autopilot and AI Growth Manager for small businesses — website audits, growth opportunities, and review-ready SEO, content, and social actions for Google and AI search.",
    home: {
      title: "RankBoost — SEO Autopilot for Small Businesses",
      description:
        "RankBoost analyzes your site, prepares a monthly article plan, writes in your brand voice, and can publish to WordPress after you confirm the plan. Start in Review Mode.",
    },
    services: {
      title: "SEO Autopilot capabilities | RankBoost.eu",
      description:
        "Website audits, monthly growth plans, brand-voice articles, WordPress publishing after plan confirmation, and handoff packages for custom sites.",
    },
    pricing: {
      title: "Start your SEO autopilot | RankBoost.eu",
      description:
        "Start free, then upgrade for more growth actions, review workflows, and optional WordPress auto-publish after you confirm a plan. No long-term contracts.",
    },
    blog: {
      title: "Website growth, SEO autopilot & AI search | RankBoost.eu",
      description:
        "Practical guides for small businesses that want to improve visibility in Google and AI search without becoming SEO experts.",
    },
    contact: {
      title: "Contact | RankBoost.eu",
      description:
        "Have a question about your SEO autopilot? Tell us about your website and we will get back to you.",
    },
    privacy: {
      title: "Privacy Policy | RankBoost.eu",
      description:
        "How RankBoost.eu processes account, website, integration, and automation data for its SEO Autopilot SaaS platform.",
    },
    terms: {
      title: "Terms of Service | RankBoost.eu",
      description:
        "Terms of use for the RankBoost.eu SEO Autopilot and AI Growth Manager SaaS platform.",
    },
  },
  nav: {
    home: "Home",
    services: "Product",
    pricing: "Pricing",
    blog: "Blog",
    contact: "Contact",
    login: "Log in",
    cta: "Start free",
  },
  hero: {
    badge: "SEO Autopilot",
    title: "SEO Autopilot for small businesses",
    subtitle:
      "RankBoost analyzes your website, prepares a monthly plan of articles and improvements, writes in your brand style, and can publish automatically to WordPress after you confirm the plan.",
    ctaPrimary: "Start free",
    ctaSecondary: "See how it works",
    trustLine:
      "You confirm the plan once a month. Autopilot can be paused. Published posts can be rolled back.",
    dashboard: {
      overview: "Your website growth overview",
      status: "Monitoring your site",
      growthScore: "Growth Score",
      growthScoreValue: "72 / 100",
      opportunities: "Opportunities",
      opportunitiesValue: "4 found",
      needsReview: "Needs review",
      needsReviewValue: "2 items",
      nextAction: "Next step",
      nextActionValue: "Review your monthly growth plan",
      prepared: "Prepared for you",
      preparedItems: "Monthly plan · article draft · WordPress path",
    },
  },
  trust: {
    items: [
      "Confirm the monthly plan first",
      "Pause Autopilot anytime",
      "Cancel anytime",
      "No ranking guarantees",
    ],
  },
  problem: {
    title: "Sound familiar?",
    subtitle:
      "Most small businesses know their website should bring more customers, but they don't know what to fix first.",
    items: [
      "You don't know why Google traffic is low",
      "You don't have time to create SEO content",
      "You're not sure what to post or improve next",
    ],
  },
  solution: {
    title: "RankBoost is your SEO Autopilot",
    subtitle:
      "Analyze the site, build a monthly plan, write articles in your brand voice, then publish on WordPress after you confirm — or hand off a package for custom sites.",
    items: [
      {
        title: "Analyze your site",
        description:
          "Website audit, growth tasks, and clear SEO priorities.",
      },
      {
        title: "Monthly plan and brand-voice articles",
        description:
          "A monthly plan of articles and improvements, written in your brand style for review.",
      },
      {
        title: "Publish with control",
        description:
          "On WordPress, RankBoost can publish approved plan articles automatically after you confirm. For custom sites — export, webhook, or developer handoff.",
      },
      {
        title: "Pause and roll back",
        description:
          "You can pause Autopilot anytime. WordPress posts published by RankBoost can be moved back to draft.",
      },
    ],
  },
  outputs: {
    title: "What your SEO Autopilot can prepare",
    subtitle:
      "Monthly plans and articles first — WordPress auto-publish only after you confirm the plan.",
    items: [
      "SEO tasks",
      "Monthly growth plan",
      "Brand-voice articles",
      "Social post drafts",
      "WordPress publish (after plan confirmation)",
      "Export / webhook for custom sites",
      "AI search readiness checks",
    ],
    trustNote:
      "WordPress: automatic publishing after you confirm the monthly plan. Custom sites: ready package or webhook integration. Backlinks and partner networks are not included yet. No ranking guarantees.",
  },
  aiSearch: {
    eyebrow: "Google + AI search",
    title: "Built for Google and AI search",
    description:
      "People no longer discover businesses only through Google. They also ask AI assistants such as ChatGPT, Gemini, Perplexity, and other answer engines. RankBoost helps you create clearer, more useful website content that answers customer questions and improves your chances of being understood by search and AI systems.",
    disclaimer:
      "RankBoost cannot guarantee rankings or AI mentions, but it helps your website become clearer, more structured, and easier for search systems to understand.",
  },
  autopilotModes: {
    title: "Choose how much your SEO autopilot can do",
    subtitle:
      "Start safely in Review Mode. Enable WordPress auto-publish when you confirm a monthly plan.",
    reviewMode: {
      badge: "Available now",
      title: "Review Mode",
      description:
        "RankBoost finds opportunities and prepares plans, tasks, and articles for your review. You decide what goes live.",
    },
    autoPublishMode: {
      badge: "WordPress after plan confirmation",
      title: "Auto-Publish Mode",
      description:
        "After you confirm a monthly plan and choose auto-publish, RankBoost can publish approved articles to WordPress on schedule. You can pause anytime and roll posts back to draft.",
    },
    safeguards: [
      "Confirm the plan monthly",
      "WordPress connected",
      "Can be paused",
      "Rollback available",
    ],
    note: "Auto-publish is optional and not on by default. Custom sites get an export or webhook package — not the same as WordPress live publish. No ranking guarantees.",
  },
  pricingPreview: {
    title: "Simple pricing, no long-term contracts",
    subtitle:
      "Start free, then upgrade when RankBoost starts helping you grow.",
    trustNote:
      "No long-term contracts. Cancel anytime. Secure payment via Stripe.",
    popular: "Popular",
    viewAllPlans: "View all plans",
    plans: [
      {
        name: "Free",
        priceAmount: "€0",
        pricePeriod: "",
        description:
          "Try RankBoost and get your first view of growth opportunities.",
        cta: "Start free",
      },
      {
        name: "Starter",
        priceAmount: "€19",
        pricePeriod: "/mo",
        description:
          "For small businesses that need regular SEO tasks and a clear growth plan.",
        cta: "Choose Starter",
      },
      {
        name: "Pro",
        priceAmount: "€49",
        pricePeriod: "/mo",
        description:
          "For growing businesses: more insights, content, and workflows.",
        cta: "Choose Pro",
      },
      {
        name: "Agency",
        priceAmount: "€149",
        pricePeriod: "/mo",
        description:
          "For teams and agencies managing several websites.",
        cta: "Choose Agency",
      },
    ],
  },
  whatWeDo: {
    title: "What we do",
    subtitle: "Comprehensive SEO approach",
    items: ["SEO audit", "Content", "Local SEO"],
  },
  forWhom: {
    title: "Who it's for",
    subtitle: "Small and medium businesses",
    items: ["local businesses", "ecommerce stores"],
  },
  services: {
    title: "SEO Autopilot capabilities",
    subtitle: "Growth actions your autopilot prepares for review",
    viewAll: "All capabilities",
    learnMore: "Learn more",
    pageTitle: "What the SEO Autopilot can prepare for you",
    pageSubtitle:
      "Website audits, SEO tasks, content plans, drafts, GSC insights, and AI search readiness — start in Review Mode, automate more when you enable rules.",
    ctaConsultation: "Start free",
    whatsIncluded: "What's included",
  },
  process: {
    title: "How it works",
    subtitle: "A simple path from website to clear next steps",
    steps: [
      {
        title: "Add your website",
        description: "Enter your URL — RankBoost sets up your workspace.",
      },
      {
        title: "RankBoost finds opportunities",
        description: "Audit, Growth Score, and growth tasks.",
      },
      {
        title: "Review and approve",
        description: "Confirm the monthly plan — then RankBoost prepares and can publish on WordPress.",
      },
      {
        title: "Track progress",
        description: "Your dashboard shows what's done and what's next.",
      },
    ],
  },
  monthlyHowItWorks: {
    title: "How the monthly autopilot works",
    steps: [
      "You confirm the monthly plan once.",
      "RankBoost writes articles in your brand style on schedule.",
      "On WordPress with auto-publish enabled, approved articles can go live automatically.",
      "You can pause Autopilot anytime and roll a published post back to draft.",
    ],
    disclaimer:
      "RankBoost does not guarantee Google rankings, traffic, or revenue. Results depend on your site, competition, and consistent publishing. Backlinks are not included yet.",
  },
  pricing: {
    title: "Pricing",
    subtitle: "SEO Autopilot plans — start free, upgrade when you need more growth actions",
    popular: "Popular",
    pageTitle: "Start your SEO autopilot",
    pageSubtitle:
      "Start free, then upgrade for more growth actions and optional WordPress auto-publish after plan confirmation. No guaranteed Google rankings.",
    comparisonTitle: "Plan comparison",
    customNote: "Paid checkout will be available when billing is configured.",
  },
  pricingFaq: {
    title: "Pricing FAQ",
    subtitle: "Answers to common questions about plans and payment",
  },
  stats: {
    title: "Built for busy small businesses",
    items: [
      {
        value: "1×",
        label: "Monthly plan confirmation",
        description: "Approve once — Autopilot prepares on schedule",
      },
      {
        value: "WP",
        label: "WordPress auto-publish",
        description: "Optional, after you confirm the plan",
      },
      {
        value: "3",
        label: "Languages",
        description: "English, Russian, and Estonian",
      },
      {
        value: "0",
        label: "Ranking guarantees",
        description: "Honest tooling — results depend on your market",
      },
    ],
  },
  testimonials: {
    title: "What owners want from Autopilot",
    subtitle: "Clarity and control — not empty ranking promises",
    items: [
      {
        quote:
          "I needed a clear monthly plan and articles in our brand voice — without becoming an SEO specialist.",
        author: "Maria K.",
        role: "Director",
        company: "Beauty Studio Tallinn",
      },
      {
        quote:
          "The audit showed what to fix first. Drafts and WordPress handoff made publishing manageable.",
        author: "Andres T.",
        role: "CEO",
        company: "TechShop.ee",
      },
      {
        quote:
          "I want clear next steps in Estonian, Russian, and English — and to pause publishing if something looks wrong.",
        author: "Dmitri S.",
        role: "Owner",
        company: "RemontPro Tallinn",
      },
    ],
  },
  faq: {
    title: "Frequently asked questions",
    subtitle: "Answers about SEO Autopilot, WordPress publishing, and plans",
  },
  cta: {
    title: "Turn website issues into growth actions",
    subtitle:
      "Start free: RankBoost analyzes your site and prepares a monthly plan. Confirm once — pause and roll back anytime.",
    button: "Start free",
    note: "No credit card required on the Free plan. Cancel anytime. No ranking guarantees.",
  },
  blog: {
    title: "Website growth, SEO autopilot, and AI search",
    subtitle:
      "Practical guides for small businesses that want to improve visibility in Google and AI search without becoming SEO experts.",
    readMore: "Read",
    readTime: "min read",
    min: "min",
    related: "Related articles",
    backToBlog: "← All articles",
    allArticles: "All articles",
    noArticles: "No articles in this category",
    allCategories: "All",
  },
  contact: {
    title: "Contact us",
    subtitle:
      "Have a question about your SEO autopilot? Tell us about your website and we'll get back to you.",
    form: {
      name: "Name",
      namePlaceholder: "Your name",
      email: "Email",
      emailPlaceholder: "email@example.com",
      phone: "Phone",
      phonePlaceholder: "",
      website: "Website URL",
      websitePlaceholder: "https://yoursite.com",
      budget: "Budget",
      budgetPlaceholder: "",
      service: "Service",
      servicePlaceholder: "",
      plan: "Plan",
      planPlaceholder: "",
      message: "Message",
      messagePlaceholder: "How can we help you with RankBoost?",
      websiteOrMessageHint: "Provide your website URL or a short message — at least one is required.",
      websiteOrMessageError: "Please provide a website URL or write a message.",
      submit: "Send message",
      submitting: "Sending...",
      success: "Thank you! Your message has been sent. We will get back to you soon.",
      error:
        "Failed to send the message. Please try again or email us directly at info@rankboost.eu.",
    },
    info: {
      title: "Contact information",
      email: "Email",
      response: "Response time",
      responseTime: "Within 24 hours on business days",
    },
    serviceTypes: {
      "seo-audit": "SEO Audit",
      "technical-seo": "Technical SEO",
      "local-seo": "Local SEO",
      "ecommerce-seo": "E-commerce SEO",
      "content-seo": "SEO Content & Articles",
      "multilingual-seo": "Multilingual SEO",
      "landing-pages": "Landing Page Optimization",
      "new-sites": "SEO for New Websites",
      other: "Other",
    },
    plans: {
      start: "Start SEO",
      "local-boost": "Local Boost",
      growth: "Growth SEO",
      partner: "SEO Partner",
      "not-sure": "Not sure yet",
    },
    budgets: {
      "under-200": "up to €200 / mo",
      "200-500": "€200–500 / mo",
      "500-1000": "€500–1000 / mo",
      "over-1000": "over €1000 / mo",
      "not-sure": "Not sure yet",
    },
  },
  footer: {
    description:
      "RankBoost.eu — SEO Autopilot and AI Growth Manager for small businesses. Audits, growth actions, and review-ready drafts for Google and AI search.",
    navigation: "Navigation",
    productTitle: "Product",
    blogTitle: "Blog",
    trustNote:
      "Review Mode by default. Automation only when explicitly enabled. No long-term contracts. Cancel anytime.",
    legal: "Legal",
    privacy: "Privacy",
    terms: "Terms",
    disclaimer:
      "Growth results depend on website condition, competition, and consistent review of recommended actions.",
    copyright: "© {year} RankBoost.eu. All rights reserved.",
  },
  privacy: {
    title: "Privacy Policy",
    lastUpdated: "Last updated: July 7, 2026",
    sections: [
      {
        title: "1. General",
        content:
          "RankBoost.eu («we») operates an SEO Autopilot and AI Growth Manager SaaS platform. This policy describes how we collect and use data when you use rankboost.eu, create an account, use the dashboard, or contact us.",
      },
      {
        title: "2. Data we collect",
        content:
          "Depending on how you use RankBoost, we may process: account details (name, email), website and domain URLs, audit and growth-opportunity data, content and social drafts prepared for your review, integration metadata (for example Google Search Console site selection or WordPress connection details when you connect them), automation settings and activity logs when you enable automation features (if available), subscription and billing-related data when paid plans are enabled through our payment provider, contact form submissions (name, email, website URL, message), and technical logs (IP address, browser type, referring page, session identifiers).",
      },
      {
        title: "3. How we use data",
        content:
          "We use data to operate the platform, provide website audits and review-ready recommendations, save drafts you choose to review, manage your account and subscription, respond to support requests, and improve the service. We do not sell your personal data to third parties for marketing purposes. If you connect an integration such as Google Search Console or WordPress, RankBoost processes only the data needed to provide that integration. If automation features are available and you enable them, RankBoost may process the settings, rules, logs, and content needed to perform those actions.",
      },
      {
        title: "4. Storage and security",
        content:
          "Data is stored on protected servers in the EU. We apply reasonable security measures in compliance with GDPR. No method of transmission or storage is completely secure.",
      },
      {
        title: "5. Your rights",
        content:
          "You have the right to access, correct, and delete your personal data, subject to applicable law. To make a request, email info@rankboost.eu.",
      },
      {
        title: "6. Cookies",
        content:
          "The website and dashboard may use cookies or similar technologies for authentication, locale preferences, analytics, and basic platform functionality. You can limit cookies in your browser settings, but some features may not work correctly without them.",
      },
    ],
  },
  terms: {
    title: "Terms of Service",
    lastUpdated: "Last updated: July 7, 2026",
    sections: [
      {
        title: "1. General terms",
        content:
          "RankBoost.eu provides software tools that help users analyze websites, identify growth opportunities, prepare SEO, content, and social recommendations, and manage review-ready drafts and automation workflows through a subscription-based SEO Autopilot SaaS platform. By using the site or creating an account, you agree to these terms.",
      },
      {
        title: "2. Platform use and your responsibility",
        content:
          "By default, RankBoost works in Review Mode. The platform may generate audits, suggestions, drafts, and action plans for your review. You are responsible for reviewing recommendations before publishing, sending, or applying them. Content and actions are prepared for your review unless you explicitly enable available automation features. Automatic publishing or sending, where available, requires your explicit setup, connected integrations, and rules.",
      },
      {
        title: "3. No guaranteed results",
        content:
          "RankBoost does not guarantee search rankings, AI assistant mentions, traffic, revenue, leads, or other business results. Outcomes depend on your website, market competition, content quality, integrations you connect, and how consistently you review and apply recommendations.",
      },
      {
        title: "4. Subscriptions and billing",
        content:
          "Paid plans, limits, and pricing are shown in the app. There are no long-term contracts; subscriptions can be cancelled according to the billing terms displayed in your account when billing is enabled. Free and paid features may change over time as the product evolves.",
      },
      {
        title: "5. Third-party integrations",
        content:
          "Features such as Google Search Console, WordPress drafts, Stripe billing, or email delivery may require your authorization and depend on third-party providers. RankBoost is not responsible for outages, policy changes, or limitations imposed by those providers.",
      },
      {
        title: "6. Contact and confidentiality",
        content:
          "Submitting the contact form does not create a contract. We do not disclose account or client data to third parties without consent, except as required by law. For questions: info@rankboost.eu.",
      },
    ],
  },
  common: {
    readMore: "Learn more",
    getStarted: "Get started",
    contactUs: "Contact us",
    backToHome: "Back to home",
    breadcrumbHome: "Home",
  },
};
