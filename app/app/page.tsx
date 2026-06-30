import { ActivityItem } from "@/components/dashboard/ActivityItem";
import { GrowthScoreGauge } from "@/components/dashboard/GrowthScoreGauge";
import { IntegrationStatusCard } from "@/components/dashboard/IntegrationStatusCard";
import { ScoreCard } from "@/components/dashboard/ScoreCard";
import { TaskCard } from "@/components/dashboard/TaskCard";
import { UsageMeter } from "@/components/dashboard/UsageMeter";
import {
  BarChart3,
  Bot,
  FileText,
  Globe,
  Search,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";

const demoTasks = [
  {
    title: "Добавить FAQ-разметку на страницу услуг",
    description:
      "Структурированные данные FAQPage помогут попасть в rich results и ответы AI-поиска.",
    category: "AI Readiness",
    priority: "high" as const,
    status: "open" as const,
    impactScore: 82,
  },
  {
    title: "Оптимизировать Core Web Vitals на мобильных",
    description:
      "LCP 3.2s — сжать hero-изображение и отложить некритичный JS.",
    category: "Performance",
    priority: "medium" as const,
    status: "in_progress" as const,
    impactScore: 71,
  },
  {
    title: "Обновить Google Business Profile: фото и часы работы",
    description: "Актуальные данные повышают доверие и локальную видимость.",
    category: "Local SEO",
    priority: "medium" as const,
    status: "open" as const,
    impactScore: 65,
  },
];

const demoActivities = [
  {
    title: "Preview-аудит завершён",
    description: "Growth Score: 68 → 72 после исправления meta tags.",
    timestamp: "2 ч назад",
    icon: Search,
    accent: "blue" as const,
  },
  {
    title: "AI сгенерировал 3 задачи",
    description: "Категории: Performance, Local SEO, AI Readiness.",
    timestamp: "5 ч назад",
    icon: Bot,
    accent: "violet" as const,
  },
  {
    title: "Черновик статьи готов",
    description: "«Уход за кожей зимой в Таллинне» — ожидает ревью.",
    timestamp: "Вчера",
    icon: FileText,
    accent: "cyan" as const,
  },
  {
    title: "Месячный отчёт подготовлен",
    description: "PDF и email-версия готовы к отправке.",
    timestamp: "3 дня назад",
    icon: BarChart3,
    accent: "emerald" as const,
  },
];

export default function AppDashboardPreviewPage() {
  return (
    <main className="app-content mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-8">
        <p className="text-xs font-medium uppercase tracking-wider text-blue-400">
          Demo Preview
        </p>
        <h2 className="mt-1 text-2xl font-bold text-white sm:text-3xl">
          Обзор сайта
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          Статический превью будущего dashboard. Данные не загружаются из базы
          и не требуют авторизации.
        </p>
      </div>

      {/* Scores */}
      <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <ScoreCard
          title="Growth Score"
          value={72}
          subtitle="+4 за последний аудит"
          trend={{ value: "↑ 5.9% за месяц", positive: true }}
          icon={TrendingUp}
          accent="emerald"
          className="xl:col-span-1"
        >
          <div className="flex justify-center pt-2">
            <GrowthScoreGauge score={72} size="sm" />
          </div>
        </ScoreCard>

        <ScoreCard
          title="AI Readiness"
          value="64%"
          subtitle="Готовность к AI-поиску и LLM-citation"
          trend={{ value: "3 рекомендации в приоритете", positive: false }}
          icon={Sparkles}
          accent="violet"
        >
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full w-[64%] rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-400"
              role="progressbar"
              aria-valuenow={64}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </ScoreCard>

        <ScoreCard
          title="Органический трафик"
          value="+18%"
          subtitle="Прогноз на следующий месяц"
          icon={Zap}
          accent="cyan"
          className="sm:col-span-2 xl:col-span-1"
        />
      </section>

      <div className="grid gap-8 xl:grid-cols-3">
        {/* AI Tasks */}
        <section className="xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">AI Tasks</h3>
            <span className="text-xs text-slate-500">3 открытых</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-1">
            {demoTasks.map((task) => (
              <TaskCard key={task.title} {...task} />
            ))}
          </div>
        </section>

        {/* Activity */}
        <section>
          <h3 className="mb-4 text-lg font-semibold text-white">Активность</h3>
          <div className="glass-card divide-y divide-white/5 px-4">
            {demoActivities.map((activity) => (
              <ActivityItem key={activity.title} {...activity} />
            ))}
          </div>
        </section>
      </div>

      {/* Integrations + Usage */}
      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <section>
          <h3 className="mb-4 text-lg font-semibold text-white">
            Интеграции
          </h3>
          <div className="grid gap-3">
            <IntegrationStatusCard
              name="Google Search Console"
              provider="google_search_console"
              status="disconnected"
              icon={Search}
            />
            <IntegrationStatusCard
              name="Google Analytics 4"
              provider="google_analytics"
              status="disconnected"
              icon={BarChart3}
            />
            <IntegrationStatusCard
              name="WordPress"
              provider="wordpress"
              status="disconnected"
              icon={Globe}
            />
          </div>
        </section>

        <section>
          <h3 className="mb-4 text-lg font-semibold text-white">
            Использование плана
          </h3>
          <div className="glass-card space-y-6 p-5">
            <UsageMeter label="AI-статьи в месяц" used={1} limit={4} />
            <UsageMeter label="AI-посты для соцсетей" used={2} limit={8} />
            <UsageMeter label="Полные аудиты" used={0} limit={1} />
            <UsageMeter label="AI-токены (EUR)" used={12} limit={50} unit="€" />
          </div>
        </section>
      </div>
    </main>
  );
}
