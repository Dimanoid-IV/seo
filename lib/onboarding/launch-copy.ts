import type { SaasLocale } from "@/lib/i18n/saas/locales";

const copy = {
  ru: {
    title: "Ваш сайт. Дальше — RankBoost.", subtitle: "Добавьте адрес сайта. Мы изучим бизнес, проведём аудит и запустим план работы на 30 дней.",
    url: "Адрес сайта", start: "Проверить сайт и запустить", working: "Готовим ваш план работы", background: "Можно закрыть вкладку: анализ продолжится на сервере. Обычно это занимает несколько минут.",
    safety: "Сначала — подготовка и проверка. Публикации и изменения на сайте требуют подключения и вашего разрешения. Лимиты выбранного тарифа сохраняются.",
    ready: "План запущен", readyBody: "Аудит готов, задачи поставлены в расписание. RankBoost будет готовить материалы в пределах вашего тарифа; перед публикацией вы сможете их проверить.",
    dashboard: "Открыть результаты", connect: "Подключить публикации", later: "Search Console и публикации можно подключить позже — они не мешают анализу и подготовке плана.",
    retry: "Продолжить запуск", connectionError: "Не удалось обновить прогресс. Проверяем соединение повторно; уже выполненная работа сохранена.",
    retryError: "Не удалось продолжить запуск. Попробуйте ещё раз.", stalled: "Запуск прервался. Продолжите с сохранённого этапа.", details: "Посмотреть план и задачи", tasks: "Задач найдено", plan: "План на 30 дней", done: "Готов", waiting: "Подготовка", website: "Сайт", progress: "Этапы запуска",
  },
  en: {
    title: "Your website. RankBoost takes it from here.", subtitle: "Add your website address. We’ll understand your business, audit the site and start a 30-day work plan.",
    url: "Website address", start: "Audit my site and start", working: "Preparing your work plan", background: "You can close this tab: analysis continues on the server. This usually takes a few minutes.",
    safety: "Preparation and review come first. Publishing and website changes require a connection and your permission. Your plan’s usage limits apply.",
    ready: "Your plan is running", readyBody: "The audit is ready and work is scheduled. RankBoost will prepare content within your plan’s limits for you to review before publishing.",
    dashboard: "Open results", connect: "Connect publishing", later: "Search Console and publishing can be connected later. Analysis and planning can start without them.",
    retry: "Resume setup", connectionError: "Could not refresh progress. Retrying the connection; completed work is saved.",
    retryError: "Could not resume setup. Please try again.", stalled: "Setup was interrupted. Resume from the saved step.", details: "View plan and tasks", tasks: "Tasks found", plan: "30-day plan", done: "Ready", waiting: "Preparing", website: "Website", progress: "Setup progress",
  },
  et: {
    title: "Sinu veebisait. Edasi tegutseb RankBoost.", subtitle: "Lisa veebisaidi aadress. Uurime sinu ettevõtet, auditeerime saiti ja käivitame 30 päeva tööplaani.",
    url: "Veebisaidi aadress", start: "Auditeeri saiti ja alusta", working: "Koostame sinu tööplaani", background: "Võid vahekaardi sulgeda: analüüs jätkub serveris. Tavaliselt kulub mõni minut.",
    safety: "Kõigepealt ettevalmistus ja ülevaatus. Avaldamine ja saidi muutmine vajavad ühendust ning sinu luba. Kehtivad sinu paketi kasutuslimiidid.",
    ready: "Sinu plaan on käivitatud", readyBody: "Audit on valmis ja tööd ajastatud. RankBoost valmistab sinu paketi piires ette sisu, mille saad enne avaldamist üle vaadata.",
    dashboard: "Ava tulemused", connect: "Ühenda avaldamine", later: "Search Console’i ja avaldamise saad ühendada hiljem. Analüüs ja planeerimine toimivad ka ilma nendeta.",
    retry: "Jätka seadistamist", connectionError: "Edenemist ei õnnestunud uuendada. Proovime ühendust uuesti; tehtud töö on salvestatud.",
    retryError: "Seadistamist ei õnnestunud jätkata. Proovi uuesti.", stalled: "Seadistamine katkes. Jätka salvestatud etapist.", details: "Vaata plaani ja ülesandeid", tasks: "Leitud ülesandeid", plan: "30 päeva plaan", done: "Valmis", waiting: "Ettevalmistamisel", website: "Veebisait", progress: "Seadistamise edenemine",
  },
};
export function getLaunchCopy(locale: SaasLocale) { return copy[locale]; }
