#!/usr/bin/env node
import { writeFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { CONTENT as CONTENT_EXTRA } from "./blog-content-data.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "../data/blog/posts/all-posts.ts");

const LOCALES = ["ru", "et", "en"];

function truncate(str, max) {
  if (str.length <= max) return str;
  const cut = str.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd() + "…";
}

function staggerDate(index, total = 60) {
  const start = new Date("2025-01-15T12:00:00Z");
  const end = new Date("2025-10-01T12:00:00Z");
  const ms = start.getTime() + (index / (total - 1)) * (end.getTime() - start.getTime());
  return new Date(ms).toISOString().slice(0, 10);
}

function path(locale, p) {
  return `/${locale}${p.startsWith("/") ? p : `/${p}`}`;
}

function links(locale) {
  const t = {
    ru: { title: "Полезные материалы", services: "SEO-услуги", pricing: "Тарифы", contact: "Контакты" },
    et: { title: "Kasulikud lingid", services: "SEO teenused", pricing: "Hinnakiri", contact: "Kontakt" },
    en: { title: "Helpful links", services: "SEO Services", pricing: "Pricing", contact: "Contact" },
  }[locale];
  return {
    type: "links",
    title: t.title,
    items: [
      { label: t.services, href: path(locale, "/services") },
      { label: t.pricing, href: path(locale, "/pricing") },
      { label: t.contact, href: path(locale, "/contact") },
    ],
  };
}

function cta(locale) {
  const t = {
    ru: {
      title: "Нужна помощь с SEO?",
      description: "Закажите бесплатный SEO-аудит — мы покажем точки роста вашего сайта в Google.",
      button: "Получить SEO-аудит",
    },
    et: {
      title: "Vajate abi SEO-ga?",
      description: "Tellige tasuta SEO audit — näitame teie veebilehe kasvupunkte Google'is.",
      button: "Küsi SEO-auditit",
    },
    en: {
      title: "Need SEO help?",
      description: "Order a free SEO audit — we'll show your website's growth opportunities on Google.",
      button: "Get an SEO Audit",
    },
  }[locale];
  return {
    type: "cta",
    title: t.title,
    description: t.description,
    buttonLabel: t.button,
    href: path(locale, "/contact"),
  };
}

/** @param {unknown} val */
function ts(val, indent = 2) {
  const pad = " ".repeat(indent);
  if (val === null || val === undefined) return "undefined";
  if (typeof val === "string") return JSON.stringify(val);
  if (typeof val === "number" || typeof val === "boolean") return String(val);
  if (Array.isArray(val)) {
    if (val.length === 0) return "[]";
    return `[\n${val.map((v) => `${pad}  ${ts(v, indent + 2)}`).join(",\n")}\n${pad}]`;
  }
  const entries = Object.entries(val);
  return `{\n${entries.map(([k, v]) => `${pad}  ${/^[a-zA-Z_$][\w$]*$/.test(k) ? k : JSON.stringify(k)}: ${ts(v, indent + 2)}`).join(",\n")}\n${pad}}`;
}

// ─── Topic definitions ───────────────────────────────────────────────────────

const TOPICS = [
  {
    translationKey: "seo-estonia",
    category: "Local SEO",
    ru: { slug: "seo-prodvizhenie-v-estonii", title: "SEO-продвижение в Эстонии: как бизнесу получать клиентов из Google" },
    et: { slug: "seo-teenus-eestis", title: "SEO teenus Eestis: kuidas ettevõte saab Google'ist rohkem kliente" },
    en: { slug: "seo-services-in-estonia", title: "SEO Services in Estonia: How Businesses Get Customers from Google" },
  },
  {
    translationKey: "local-seo-tallinn",
    category: "Local SEO",
    ru: { slug: "local-seo-tallinn", title: "Local SEO в Таллине: как попасть выше конкурентов в Google" },
    et: { slug: "kohalik-seo-tallinnas", title: "Kohalik SEO Tallinnas: kuidas Google'is konkurentidest ette jõuda" },
    en: { slug: "local-seo-tallinn", title: "Local SEO in Tallinn: How to Rank Above Competitors in Google" },
  },
  {
    translationKey: "ecommerce-seo",
    category: "E-commerce SEO",
    ru: { slug: "seo-dlya-internet-magazina", title: "SEO для интернет-магазина: как увеличить органический трафик и продажи" },
    et: { slug: "e-poe-seo", title: "E-poe SEO: kuidas kasvatada orgaanilist liiklust ja müüki" },
    en: { slug: "ecommerce-seo", title: "Ecommerce SEO: How to Grow Organic Traffic and Sales" },
  },
  {
    translationKey: "technical-seo-audit",
    category: "Technical SEO",
    ru: { slug: "tehnicheskiy-seo-audit", title: "Технический SEO-аудит сайта: что проверять в первую очередь" },
    et: { slug: "tehniline-seo-audit", title: "Tehniline SEO audit: mida kontrollida esimesena" },
    en: { slug: "technical-seo-audit", title: "Technical SEO Audit: What to Check First" },
  },
  {
    translationKey: "seo-pricing",
    category: "SEO Strategy",
    ru: { slug: "skolko-stoit-seo", title: "Сколько стоит SEO-продвижение сайта в Европе" },
    et: { slug: "kui-palju-maksab-seo", title: "Kui palju maksab SEO Euroopas" },
    en: { slug: "how-much-does-seo-cost", title: "How Much Does SEO Cost in Europe" },
  },
  {
    translationKey: "seo-small-business",
    category: "General SEO",
    ru: { slug: "seo-dlya-malogo-biznesa", title: "SEO для малого бизнеса: с чего начать продвижение сайта" },
    et: { slug: "seo-vaikeettevottele", title: "SEO väikeettevõttele: millest alustada" },
    en: { slug: "seo-for-small-business", title: "SEO for Small Business: Where to Start" },
  },
  {
    translationKey: "google-business-profile",
    category: "Local SEO",
    ru: { slug: "google-business-profile-estonia", title: "Google Business Profile в Эстонии: как получать больше локальных клиентов" },
    et: { slug: "google-business-profile-eestis", title: "Google Business Profile Eestis: kuidas saada rohkem kohalikke kliente" },
    en: { slug: "google-business-profile-estonia", title: "Google Business Profile in Estonia: How to Get More Local Customers" },
  },
  {
    translationKey: "seo-articles",
    category: "Content SEO",
    ru: { slug: "seo-stati-dlya-sayta", title: "SEO-статьи для сайта: как писать контент, который приводит клиентов" },
    et: { slug: "seo-artiklid-kodulehele", title: "SEO artiklid kodulehele: kuidas kirjutada sisu, mis toob kliente" },
    en: { slug: "seo-articles-for-website", title: "SEO Articles for a Website: How to Write Content That Brings Customers" },
  },
  {
    translationKey: "on-page-seo",
    category: "Technical SEO",
    ru: { slug: "vnutrennyaya-optimizaciya-sayta", title: "Внутренняя оптимизация сайта: что влияет на позиции в Google" },
    et: { slug: "kodulehe-sisemine-optimeerimine", title: "Kodulehe sisemine optimeerimine: mis mõjutab Google'i positsioone" },
    en: { slug: "on-page-seo-optimization", title: "On-Page SEO Optimization: What Affects Google Rankings" },
  },
  {
    translationKey: "seo-mistakes",
    category: "General SEO",
    ru: { slug: "seo-oshibki-na-sayte", title: "Главные SEO-ошибки, из-за которых сайт не растет" },
    et: { slug: "seo-vead-kodulehel", title: "Peamised SEO vead, mis takistavad veebilehe kasvu" },
    en: { slug: "common-seo-mistakes", title: "Common SEO Mistakes That Stop a Website from Growing" },
  },
  {
    translationKey: "multilingual-seo",
    category: "SEO Strategy",
    ru: { slug: "multiyazychnoe-seo", title: "Мультиязычное SEO: как продвигать сайт на нескольких языках" },
    et: { slug: "mitmekeelne-seo", title: "Mitmekeelne SEO: kuidas optimeerida veebilehte mitmes keeles" },
    en: { slug: "multilingual-seo", title: "Multilingual SEO: How to Grow a Website in Multiple Languages" },
  },
  {
    translationKey: "seo-new-website",
    category: "General SEO",
    ru: { slug: "seo-dlya-novogo-sayta", title: "SEO для нового сайта: что сделать сразу после запуска" },
    et: { slug: "seo-uuele-veebilehele", title: "SEO uuele veebilehele: mida teha kohe pärast avaldamist" },
    en: { slug: "seo-for-new-website", title: "SEO for a New Website: What to Do Right After Launch" },
  },
  {
    translationKey: "choose-seo-agency",
    category: "SEO Strategy",
    ru: { slug: "kak-vybrat-seo-agentstvo", title: "Как выбрать SEO-агентство и не потерять бюджет" },
    et: { slug: "kuidas-valida-seo-agentuuri", title: "Kuidas valida SEO agentuuri ja mitte kaotada eelarvet" },
    en: { slug: "how-to-choose-seo-agency", title: "How to Choose an SEO Agency and Avoid Wasting Budget" },
  },
  {
    translationKey: "seo-vs-ads",
    category: "SEO Strategy",
    ru: { slug: "seo-vs-reklama-google-ads", title: "SEO или Google Ads: что лучше для бизнеса" },
    et: { slug: "seo-voi-google-ads", title: "SEO või Google Ads: kumb on ettevõttele parem" },
    en: { slug: "seo-vs-google-ads", title: "SEO vs Google Ads: Which Is Better for Business" },
  },
  {
    translationKey: "keyword-research",
    category: "Content SEO",
    ru: { slug: "semanticheskoe-yadro", title: "Семантическое ядро: зачем бизнесу правильные ключевые слова" },
    et: { slug: "marksonade-analuus-seo", title: "Märksõnade analüüs: miks ettevõte vajab õigeid otsingusõnu" },
    en: { slug: "keyword-research-for-seo", title: "Keyword Research: Why Businesses Need the Right Search Terms" },
  },
  {
    translationKey: "website-structure",
    category: "Technical SEO",
    ru: { slug: "struktura-sayta-dlya-seo", title: "Правильная структура сайта для SEO-продвижения" },
    et: { slug: "kodulehe-struktuur-seo-jaoks", title: "Õige veebilehe struktuur SEO jaoks" },
    en: { slug: "website-structure-for-seo", title: "The Right Website Structure for SEO Growth" },
  },
  {
    translationKey: "landing-page-seo",
    category: "Content SEO",
    ru: { slug: "landing-page-seo", title: "SEO для посадочных страниц: как продвигать услуги в Google" },
    et: { slug: "maandumislehe-seo", title: "Maandumislehe SEO: kuidas teenuseid Google'is nähtavaks teha" },
    en: { slug: "landing-page-seo", title: "Landing Page SEO: How to Promote Services in Google" },
  },
  {
    translationKey: "seo-services-estonia",
    category: "Local SEO",
    ru: { slug: "seo-dlya-uslug-v-estonii", title: "SEO для услуг в Эстонии: как получать заявки с сайта" },
    et: { slug: "teenuste-seo-eestis", title: "Teenuste SEO Eestis: kuidas saada veebilehelt rohkem päringuid" },
    en: { slug: "seo-for-services-in-estonia", title: "SEO for Services in Estonia: How to Get More Leads from a Website" },
  },
  {
    translationKey: "content-plan",
    category: "Content SEO",
    ru: { slug: "kontent-plan-dlya-seo", title: "Контент-план для SEO: как системно растить трафик" },
    et: { slug: "seo-sisuplaan", title: "SEO sisuplaan: kuidas süsteemselt liiklust kasvatada" },
    en: { slug: "seo-content-plan", title: "SEO Content Plan: How to Grow Traffic Systematically" },
  },
  {
    translationKey: "seo-report",
    category: "SEO Strategy",
    ru: { slug: "seo-otchet", title: "SEO-отчет: какие показатели действительно важны" },
    et: { slug: "seo-raport", title: "SEO raport: millised mõõdikud on tegelikult olulised" },
    en: { slug: "seo-report", title: "SEO Report: Which Metrics Really Matter" },
  },
];

// ─── Per-topic content (excerpt, meta, tags, sections without links/cta, faq) ─

const CONTENT = {
  "seo-estonia": {
    ru: {
      excerpt: "Разбираем, как компаниям в Эстонии выстраивать SEO-стратегию: от анализа спроса до локальных сигналов и измеримых заявок из Google.",
      metaTitle: "SEO в Эстонии: как получать клиентов из Google",
      metaDescription: "Практическое руководство по SEO-продвижению в Эстонии: аудитория, конкуренция, локальные факторы и шаги для роста органического трафика.",
      tags: ["SEO Эстония", "продвижение сайта", "Google"],
      sections: [
        { type: "h2", text: "Почему SEO в Эстонии — отдельная задача" },
        { type: "p", text: "Рынок Эстонии компактный, но конкурентный: пользователи ищут на эстонском, русском и английском. Один универсальный контент редко покрывает весь спрос. SEO здесь — это не только позиции, а попадание в нужный языковой сегмент с правильным коммерческим намерением." },
        { type: "p", text: "Многие компании недооценивают локальные запросы вроде «услуга + Таллин» или отраслевые формулировки на эстонском. Без семантики и структуры сайта трафик остаётся случайным, а заявки — нестабильными." },
        { type: "ul", items: ["Три рабочих языка поиска: et, ru, en", "Высокая доля мобильного трафика", "Сильная роль Google Business Profile для локального бизнеса"] },
        { type: "h2", text: "С чего начать продвижение" },
        { type: "p", text: "Первый шаг — собрать семантическое ядро по каждому языку и сегменту услуг. Затем проверить техническое состояние: индексация, скорость, корректные hreflang и канонические URL." },
        { type: "ol", items: ["Провести SEO-аудит и карту страниц", "Сгруппировать ключевые запросы по посадочным", "Настроить аналитику и цели на заявки", "Запустить контент и внутреннюю перелинковку"] },
        { type: "h2", text: "Локальные факторы ранжирования" },
        { type: "p", text: "Для бизнеса с офисом или точкой обслуживания критичны NAP-данные, отзывы и активность в Google Business Profile. Ссылки с местных каталогов и партнёрских ресурсов усиливают доверие в регионе." },
        { type: "p", text: "Если вы работаете по всей Эстонии, создайте отдельные посадочные под ключевые города — Таллин, Тарту, Пярну — с уникальными кейсами и FAQ." },
        { type: "h2", text: "Как измерять результат" },
        { type: "p", text: "Смотрите не только на позиции, но на органические лиды: звонки, формы, бронирования. Сравнивайте динамику по языкам и страницам входа — так видно, какие сегменты масштабировать." },
        { type: "ul", items: ["Органический трафик по landing pages", "Конверсия из поиска в заявку", "Доля брендовых и коммерческих запросов", "Рост видимости в Search Console"] },
      ],
      faq: [
        { question: "Сколько времени нужно, чтобы SEO заработало в Эстонии?", answer: "Первые сдвиги по низкоконкурентным запросам возможны за 2–3 месяца. Устойчивый рост по коммерческим кластерам обычно занимает 4–8 месяцев при регулярной работе над контентом и технической базой." },
        { question: "Нужен ли сайт на трёх языках?", answer: "Если аудитория многоязычная — да. Важно не дублировать переводы машинно, а адаптировать структуру и ключевые страницы под реальный спрос на каждом языке." },
        { question: "Чем отличается SEO для B2B и B2C в Эстонии?", answer: "B2B чаще выигрывает за счёт экспертного контента и длинных запросов, B2C — за счёт локального SEO, скорости сайта и коммерческих страниц с чётким оффером." },
      ],
    },
    et: {
      excerpt: "Praktiline ülevaade, kuidas Eesti ettevõtted saavad Google'ist rohkem kliente: semantika, tehniline baas, kohalikud signaalid ja mõõdetavad tulemused.",
      metaTitle: "SEO teenus Eestis: rohkem kliente Google'ist",
      metaDescription: "Kuidas kasvatada orgaanilist liiklust Eestis: märksõnad, tehniline SEO, kohalik nähtavus ja samm-sammuline strateegia väikeettevõttele.",
      tags: ["SEO Eestis", "Google", "orgaaniline liiklus"],
      sections: [
        { type: "h2", text: "Miks Eesti SEO vajab eraldi lähenemist" },
        { type: "p", text: "Eesti turg on väike, kuid tihe. Kasutajad otsivad eesti, vene ja inglise keeles ning ootavad kiiret ja usaldusväärset vastust. Üks üldine leht ei kata tavaliselt kogu nõudlust." },
        { type: "p", text: "Paljud ettevõtted keskenduvad ainult brändile, jättes kasutamata kohalikud ja teenuspõhised päringud. Ilma selge struktuuri ja sisuta ei muutu Google liikluseks müüki." },
        { type: "ul", items: ["Kolmekeelne otsingukeskkond", "Mobiilne liiklus on domineeriv", "Google Business Profile mõjutab kohalikke tulemusi tugevalt"] },
        { type: "h2", text: "Esimesed sammud SEO strateegias" },
        { type: "p", text: "Alusta märksõnade kaardistamisega iga keele ja teenuse jaoks. Kontrolli seejärel indekseerimist, lehe kiirust ja keeleversioonide tehnilist seadistust." },
        { type: "ol", items: ["Tee SEO audit ja lehtede kaart", "Seo märksõnad maandumislehtedega", "Määra analüütikas konversioonid", "Avalda sisu ja sisemised lingid"] },
        { type: "h2", text: "Kohalikud rankingusignaalid" },
        { type: "p", text: "Füüsilise asukohaga ettevõtte puhul on olulised täpsed kontaktandmed, arvustused ja aktiivne profiil Google'is. Kohalikud viited ja partnerlingid tõstavad usaldusväärsust." },
        { type: "p", text: "Kui teenindad kogu Eestit, loo eraldi lehed suurematele linnadele koos unikaalse sisu ja KKK-ga." },
        { type: "h2", text: "Tulemuste mõõtmine" },
        { type: "p", text: "Jälgi mitte ainult positsioone, vaid päringuid, kõnesid ja vormitäitmisi. Võrdle keeli ja sisulehti, et näha, kuhu investeering annab kõige parema tulu." },
        { type: "ul", items: ["Orgaaniline liiklus maandumislehtedelt", "Otsingu konversioonimäär", "Brändi- ja ostupäringute dünaamika", "Search Console nähtavus"] },
      ],
      faq: [
        { question: "Kui kaua võtab SEO Eestis aega?", answer: "Esimesed tulemused madalama konkurentsiga päringutel võivad ilmuda 2–3 kuuga. Stabiilne kasv nõuab tavaliselt 4–8 kuud järjepidevat tööd." },
        { question: "Kas vajan mitmekeelset veebilehte?", answer: "Kui klientide hulk on mitmekeelne, siis jah. Iga keel vajab kohandatud sisu, mitte automaatset tõlget." },
        { question: "Mis eristab B2B ja B2C SEO-d?", answer: "B2B kasvab sageli eksperdisisu ja pikkade päringute kaudu, B2C kohaliku nähtavuse ja kiirete teenuselehtede kaudu." },
      ],
    },
    en: {
      excerpt: "A practical guide for businesses in Estonia on building SEO that turns Google searches into qualified leads — across Estonian, Russian, and English audiences.",
      metaTitle: "SEO Services in Estonia: Get Google Customers",
      metaDescription: "How Estonian businesses grow organic traffic: keyword strategy, technical SEO, local signals, and measurable lead generation from Google search.",
      tags: ["SEO Estonia", "Google traffic", "local SEO"],
      sections: [
        { type: "h2", text: "Why SEO in Estonia needs a focused approach" },
        { type: "p", text: "Estonia's market is small but competitive. Searchers use Estonian, Russian, and English, often with strong local intent. A single generic website rarely captures the full demand." },
        { type: "p", text: "Many companies overlook city- and service-specific queries. Without structured landing pages and clean technical setup, organic traffic stays flat even when rankings look acceptable." },
        { type: "ul", items: ["Multilingual search behavior", "Mobile-first audience", "Google Business Profile drives local visibility"] },
        { type: "h2", text: "Where to start your SEO roadmap" },
        { type: "p", text: "Begin with keyword research per language and service line. Audit crawlability, page speed, and hreflang implementation before scaling content." },
        { type: "ol", items: ["Run a technical and content audit", "Map keywords to landing pages", "Track conversions from organic search", "Publish helpful content with internal links"] },
        { type: "h2", text: "Local ranking factors that matter" },
        { type: "p", text: "For location-based businesses, consistent NAP data, reviews, and an active Google Business Profile are essential. Local citations and partnerships add regional trust." },
        { type: "p", text: "If you serve all of Estonia, build dedicated pages for Tallinn, Tartu, and Pärnu with unique proof points and FAQs." },
        { type: "h2", text: "Measuring SEO beyond rankings" },
        { type: "p", text: "Track leads — calls, forms, bookings — not vanity metrics alone. Compare performance by language and landing page to decide where to invest next." },
        { type: "ul", items: ["Organic sessions by landing page", "Search conversion rate", "Branded vs commercial query growth", "Search Console impression trends"] },
      ],
      faq: [
        { question: "How long does SEO take to work in Estonia?", answer: "You may see movement on lower-competition terms in 2–3 months. Sustainable growth on commercial clusters typically needs 4–8 months of consistent work." },
        { question: "Do I need a multilingual website?", answer: "If your customers search in multiple languages, yes. Each language version should reflect real demand, not machine-translated duplicates." },
        { question: "Is SEO different for B2B and B2C?", answer: "B2B often wins with expert content and long-tail queries; B2C benefits more from local SEO, speed, and clear service pages with strong offers." },
      ],
    },
  },

  "local-seo-tallinn": {
    ru: {
      excerpt: "Пошаговый разбор Local SEO для Таллина: карта Google, отзывы, локальные страницы и конкурентный анализ в столичном регионе.",
      metaTitle: "Local SEO в Таллине: выше конкурентов в Google",
      metaDescription: "Как продвигать бизнес в Таллине через Google: оптимизация профиля компании, локальные ключевые слова, отзывы и посадочные страницы.",
      tags: ["Local SEO", "Таллин", "Google Maps"],
      sections: [
        { type: "h2", text: "Как устроена локальная выдача в Таллине" },
        { type: "p", text: "В столице Эстонии локальный пакет Google Maps часто решает, кто получит звонок. Пользователь ищет «рядом», «в Таллине», «сегодня» — и выбирает из 3–5 карточек." },
        { type: "p", text: "Конкуренция высокая в сферах красоты, ремонта, медицины и B2B-услуг. Без системной работы с GBP и локальными страницами сайта бизнес остаётся невидимым." },
        { type: "ul", items: ["Пакет карт + органическая выдача", "Отзывы и фото влияют на CTR", "Мобильные near-me запросы растут"] },
        { type: "h2", text: "Оптимизация Google Business Profile" },
        { type: "p", text: "Заполните категории, услуги, часы работы и зону обслуживания. Публикуйте посты, отвечайте на отзывы и добавляйте реальные фото работ — это повышает доверие и кликабельность." },
        { type: "ol", items: ["Верифицируйте профиль", "Добавьте UTM-метки на сайт", "Собирайте отзывы по процессу", "Обновляйте спецпредложения"] },
        { type: "h2", text: "Локальные страницы на сайте" },
        { type: "p", text: "Создайте страницу «Услуга + Таллин» с уникальным текстом, кейсами из района и FAQ. Не копируйте один шаблон на все города — Google распознаёт шаблонность." },
        { type: "p", text: "Добавьте Schema LocalBusiness, встроенную карту и чёткие CTA: звонок, маршрут, форма записи." },
        { type: "h2", text: "Как обойти конкурентов" },
        { type: "p", text: "Сравните топ-10 в Maps и органике: какие категории, отзывы и контент у лидеров. Закройте пробелы в услугах, скорости ответа и релевантности страниц." },
        { type: "ul", items: ["Анализ конкурентов по районам", "Локальные ссылки и партнёрства", "Регулярный контент в блоге по Таллину"] },
      ],
      faq: [
        { question: "Нужна ли отдельная страница под каждый район?", answer: "Если район — отдельный спрос и вы там работаете, да. Иначе достаточно одной сильной страницы по Таллину с блоком зон обслуживания." },
        { question: "Сколько отзывов нужно для топа в Maps?", answer: "Важнее качество и регулярность, чем число. Стабильный поток свежих отзывов с деталями услуги работает лучше разовой накрутки." },
        { question: "Помогает ли Local SEO без сайта?", answer: "Профиль в Google даёт базовую видимость, но сайт с локальными страницами расширяет охват в органике и повышает конверсию." },
      ],
    },
    et: {
      excerpt: "Tallinna kohaliku SEO juhend: Google kaart, arvustused, linnapõhised lehed ja praktilised sammud konkurentidest ette jõudmiseks.",
      metaTitle: "Kohalik SEO Tallinnas: jõua Google'is ette",
      metaDescription: "Kuidas tõsta Tallinna ettevõtte nähtavust Google'is: Business Profile, kohalikud märksõnad, arvustused ja optimeeritud maandumislehed.",
      tags: ["kohalik SEO", "Tallinn", "Google Maps"],
      sections: [
        { type: "h2", text: "Kuidas töötab kohalik otsing Tallinnas" },
        { type: "p", text: "Tallinnas otsivad inimesed sageli teenust linna või naabruses põhjal. Google Maps pakett määrab, kes saab kõne või broneeringu." },
        { type: "p", text: "Konkurents on tugev teenusvaldkondades nagu iluteenused, remont ja tervishoid. Ilma süsteemse kohaliku strateegiata jääb ettevõte teise plaaniga." },
        { type: "ul", items: ["Kaardipakett + orgaaniline tulemus", "Arvustused mõjutavad klikke", "Mobiilsed 'lähedal' päringud"] },
        { type: "h2", text: "Google Business Profile optimeerimine" },
        { type: "p", text: "Täida kategooriad, teenused ja lahtiolekuajad. Lisa päris fotod, vasta arvustustele ja avalda uuendusi — see tõstab usaldust." },
        { type: "ol", items: ["Kinnita profiil", "Seo veebilehe lingid", "Kogu arvustusi protsessina", "Uuenda pakkumisi"] },
        { type: "h2", text: "Kohalikud lehed veebis" },
        { type: "p", text: "Loo leht 'teenus + Tallinn' unikaalse teksti, juhtumiuuringute ja KKK-ga. Väldi identseid šabloone eri linnade jaoks." },
        { type: "p", text: "Lisa LocalBusiness markup, kaart ja selged tegevuskutsed: helista, marsruut, vorm." },
        { type: "h2", text: "Kuidas konkurente ületada" },
        { type: "p", text: "Uuri TOP-i kaardil ja orgaanikas: millised teenused, arvustused ja sisulehed neil on. Täida oma tugevamate pakkumiste ja kiirema vastusega lüngad." },
        { type: "ul", items: ["Linnaosa konkurentsianalüüs", "Kohalikud viited", "Tallinna-teemaline blogi"] },
      ],
      faq: [
        { question: "Kas vajan eraldi lehte iga linnaosa jaoks?", answer: "Kui linnaosas on eraldi nõudlus ja teenindad seal, siis jah. Muidu piisab tugevast üld-Tallinna lehest." },
        { question: "Mitu arvustust on vaja?", answer: "Oluline on regulaarsus ja detailid teenuse kohta, mitte ainult arv." },
        { question: "Kas Local SEO töötab ilma veebileheta?", answer: "Profiil annab baasnähtavuse, kuid veebileht laiendab orgaanilist haaret." },
      ],
    },
    en: {
      excerpt: "Step-by-step Local SEO for Tallinn businesses: Google Maps, reviews, city landing pages, and tactics to outrank competitors in the capital.",
      metaTitle: "Local SEO in Tallinn: Rank Above Competitors",
      metaDescription: "Grow your Tallinn business on Google: optimize Business Profile, local keywords, reviews, and dedicated landing pages for the capital market.",
      tags: ["Local SEO", "Tallinn", "Google Maps"],
      sections: [
        { type: "h2", text: "How local search works in Tallinn" },
        { type: "p", text: "In Estonia's capital, the Google Maps pack often decides who gets the call. Users search with city and near-me intent and pick from a handful of listings." },
        { type: "p", text: "Competition is intense in beauty, home services, healthcare, and professional services. Without GBP optimization and local pages, visibility stays limited." },
        { type: "ul", items: ["Map pack plus organic results", "Reviews influence click-through", "Mobile near-me queries dominate"] },
        { type: "h2", text: "Optimizing your Google Business Profile" },
        { type: "p", text: "Complete categories, services, hours, and service areas. Publish updates, respond to reviews, and add real project photos to build trust." },
        { type: "ol", items: ["Verify the profile", "Link to tracked website URLs", "Build a steady review workflow", "Refresh offers regularly"] },
        { type: "h2", text: "City landing pages on your site" },
        { type: "p", text: "Create a 'service + Tallinn' page with unique copy, local case studies, and FAQ. Avoid copy-pasting the same template across cities." },
        { type: "p", text: "Add LocalBusiness schema, an embedded map, and clear CTAs for calls, directions, and booking." },
        { type: "h2", text: "Beating local competitors" },
        { type: "p", text: "Benchmark top map and organic results: categories, review themes, and content depth. Close gaps with stronger offers and faster response." },
        { type: "ul", items: ["District-level competitor review", "Local citations and partnerships", "Tallinn-focused blog content"] },
      ],
      faq: [
        { question: "Do I need a page for every district?", answer: "Only if there is distinct demand and you serve that area. Otherwise one strong Tallinn page with service zones is enough." },
        { question: "How many reviews do I need?", answer: "Consistency and detail matter more than volume. Fresh, specific reviews outperform a one-time spike." },
        { question: "Can Local SEO work without a website?", answer: "A profile gives baseline visibility, but a website expands organic reach and improves conversion." },
      ],
    },
  },

  "ecommerce-seo": {
    ru: {
      excerpt: "Как интернет-магазину увеличить органический трафик: категории, карточки товаров, фильтры, скорость и контент, который конвертирует в продажи.",
      metaTitle: "SEO для интернет-магазина: трафик и продажи",
      metaDescription: "Практические методы SEO для e-commerce: структура каталога, оптимизация карточек, технические ошибки и рост конверсии из Google.",
      tags: ["интернет-магазин", "e-commerce SEO", "продажи"],
      sections: [
        { type: "h2", text: "Архитектура каталога для поиска" },
        { type: "p", text: "Поисковики должны понимать иерархию: категория → подкатегория → товар. Плоская структура или дубли URL режут индексацию и размывают релевантность." },
        { type: "p", text: "Фильтры и сортировки часто создают тысячи дублей. Используйте canonical, noindex для малополезных комбинаций и оставляйте индексируемыми только ценные посадочные." },
        { type: "ul", items: ["Чистые URL без лишних параметров", "Хлебные крошки и внутренние ссылки", "Отдельные SEO-тексты для категорий"] },
        { type: "h2", text: "Оптимизация карточек товара" },
        { type: "p", text: "Title и H1 должны отражать бренд, модель и ключевой атрибут. Описание — не копия поставщика: добавьте FAQ, сравнения и реальные преимущества для покупателя." },
        { type: "ol", items: ["Уникальные meta description", "Структурированные данные Product", "Отзывы и UGC на странице", "Качественные изображения с alt"] },
        { type: "h2", text: "Технический SEO для магазина" },
        { type: "p", text: "Скорость напрямую влияет на конверсию. Оптимизируйте изображения, критический CSS и кэш. Проверьте мобильную версию и корректность пагинации." },
        { type: "p", text: "Отслеживайте ошибки сканирования в Search Console: битые ссылки, редиректы и out-of-stock страницы должны обрабатываться предсказуемо." },
        { type: "h2", text: "Контент вне каталога" },
        { type: "p", text: "Блог, гайды и подборки «лучшее для…» приводят информационный трафик и усиливают внутренние ссылки на коммерческие страницы." },
        { type: "ul", items: ["Обзоры и сравнения товаров", "Сезонные подборки", "Статьи по болям покупателя"] },
      ],
      faq: [
        { question: "Индексировать ли страницы «нет в наличии»?", answer: "Если товар вернётся — оставьте с пометкой и альтернативами. Если снят навсегда — 301 на ближайшую категорию или аналог." },
        { question: "Нужен ли блог интернет-магазину?", answer: "Да, он расширяет семантику и даёт ссылки на категории. Главное — писать под реальные вопросы покупателей." },
        { question: "Как быстрее всего поднять продажи из SEO?", answer: "Оптимизируйте топ-категории и хиты продаж: там уже есть спрос, нужно улучшить видимость и конверсию страницы." },
      ],
    },
    et: {
      excerpt: "E-poe SEO praktika: kataloogi struktuur, tootelehed, tehniline jõudlus ja sisu, mis muudab Google'i külastajad ostjateks.",
      metaTitle: "E-poe SEO: orgaaniline liiklus ja müük",
      metaDescription: "Kuidas kasvatada e-poe nähtavust Google'is: kategooriad, tootelehtede optimeerimine, tehnilised vead ja konversiooni tõstmine.",
      tags: ["e-pood", "SEO", "müük"],
      sections: [
        { type: "h2", text: "Kataloogi struktuur otsingumootoritele" },
        { type: "p", text: "Selge hierarhia aitab Google'il mõista su pakkumist. Halvad filtrid ja duplikaat-URL-id vähendavad indekseeritavat mahtu." },
        { type: "p", text: "Kasuta canonical märgendeid ja noindex reegleid filtritele, mis ei too otsinguliiklust." },
        { type: "ul", items: ["Puhtad URL-id", "Siselingid kategooriates", "Unikaalne kategooriatekst"] },
        { type: "h2", text: "Tootelehe optimeerimine" },
        { type: "p", text: "Pealkiri peab sisaldama brändi ja peamist omadust. Kirjeldus peab vastama ostja küsimustele, mitte kordama tarnija teksti." },
        { type: "ol", items: ["Unikaalne meta kirjeldus", "Product schema", "Arvustused lehel", "Optimeeritud pildid"] },
        { type: "h2", text: "Tehniline SEO e-poes" },
        { type: "p", text: "Kiirus mõjutab nii positsioone kui ostukäitumist. Optimeeri pildid, vahemälu ja mobiilikogemust." },
        { type: "p", text: "Jälgi Search Console'i vigu: katkised lingid ja laost otsas tooted vajavad selget käsitlust." },
        { type: "h2", text: "Sisu väljaspool kataloogi" },
        { type: "p", text: "Blogi ja juhendid toovad infopäringuid ja suunavad liiklust müügilehtedele." },
        { type: "ul", items: ["Tootevõrdlused", "Hooajalised kollektsioonid", "Ostujuhendid"] },
      ],
      faq: [
        { question: "Kas indekseerida laost otsas tooteid?", answer: "Kui toode tuleb tagasi, jäta leht alles alternatiividega. Kui ei tule, suuna 301 kategooriasse." },
        { question: "Kas e-pood vajab blogi?", answer: "Jah, see laiendab märksõnade ulatust ja toetab kategooriaid siselingiga." },
        { question: "Kust alustada kiireima tulemusega?", answer: "Paranda kõige populaarsemad kategooriad ja tooted, kus nõudlus on juba olemas." },
      ],
    },
    en: {
      excerpt: "Practical ecommerce SEO: catalog structure, product pages, technical performance, and content that turns organic visitors into buyers.",
      metaTitle: "Ecommerce SEO: Organic Traffic and Sales",
      metaDescription: "Grow ecommerce visibility on Google: category architecture, product page optimization, technical fixes, and conversion-focused content.",
      tags: ["ecommerce SEO", "online store", "organic sales"],
      sections: [
        { type: "h2", text: "Catalog architecture for search" },
        { type: "p", text: "Search engines need a clear hierarchy: category, subcategory, product. Flat or duplicate URL patterns waste crawl budget and dilute relevance." },
        { type: "p", text: "Faceted navigation can spawn thousands of thin URLs. Use canonicals, noindex rules, and index only high-value landing combinations." },
        { type: "ul", items: ["Clean parameterized URLs", "Breadcrumbs and internal links", "Unique category copy"] },
        { type: "h2", text: "Product page optimization" },
        { type: "p", text: "Titles should reflect brand, model, and key attributes. Descriptions must answer buyer questions — not duplicate supplier text." },
        { type: "ol", items: ["Unique meta descriptions", "Product schema markup", "On-page reviews and UGC", "Optimized images with alt text"] },
        { type: "h2", text: "Technical SEO for stores" },
        { type: "p", text: "Speed affects rankings and revenue. Compress images, cache smartly, and validate mobile UX. Monitor crawl errors and out-of-stock handling." },
        { type: "p", text: "Fix broken links, redirect chains, and pagination issues flagged in Search Console before scaling content." },
        { type: "h2", text: "Content beyond the catalog" },
        { type: "p", text: "Guides, comparisons, and seasonal collections capture informational queries and funnel authority to money pages." },
        { type: "ul", items: ["Buying guides", "Comparison articles", "Problem-solution content"] },
      ],
      faq: [
        { question: "Should out-of-stock pages stay indexed?", answer: "If the product returns, keep the page with alternatives. If discontinued, 301 to the category or successor SKU." },
        { question: "Does an online store need a blog?", answer: "Yes — it expands keyword coverage and supports categories via internal links." },
        { question: "What drives sales fastest?", answer: "Optimize top categories and bestsellers where demand already exists; improve visibility and on-page conversion." },
      ],
    },
  },

  "technical-seo-audit": {
    ru: {
      excerpt: "Чек-лист технического SEO-аудита: индексация, скорость, мобильная версия, разметка и ошибки, которые блокируют рост позиций.",
      metaTitle: "Технический SEO-аудит: что проверить первым",
      metaDescription: "Пошаговый технический SEO-аудит сайта: краулинг, Core Web Vitals, robots.txt, sitemap, дубли и критические ошибки индексации.",
      tags: ["технический SEO", "аудит", "индексация"],
      sections: [
        { type: "h2", text: "Индексация и доступность для роботов" },
        { type: "p", text: "Начните с Search Console и краулера: какие URL в индексе, какие исключены и почему. Ошибки 4xx/5xx и случайный noindex — частая причина просадки." },
        { type: "p", text: "Проверьте robots.txt, XML-sitemap и канонические теги. Sitemap должен содержать только канонические, актуальные страницы." },
        { type: "ul", items: ["Статус индексации по разделам", "Блокировки в robots", "Дубли с www/non-www и http/https"] },
        { type: "h2", text: "Скорость и Core Web Vitals" },
        { type: "p", text: "LCP, INP и CLS влияют на UX и могут ограничивать рост. Измеряйте реальные данные из CrUX, не только лабораторные тесты." },
        { type: "ol", items: ["Оптимизация изображений и шрифтов", "Отложенная загрузка некритичного JS", "Стабильная вёрстка без сдвигов"] },
        { type: "h2", text: "Мобильная версия и UX" },
        { type: "p", text: "Google использует mobile-first indexing. Проверьте совпадение контента, кликабельность элементов и отсутствие навязчивых interstitials." },
        { type: "p", text: "Отдельно оцените внутреннюю перелинковку: важные страницы не должны быть глубже 3–4 кликов от главной." },
        { type: "h2", text: "Структурированные данные и безопасность" },
        { type: "p", text: "Валидная разметка Organization, BreadcrumbList и FAQ может улучшить сниппет. HTTPS обязателен; смешанный контент и просроченные сертификаты подрывают доверие." },
        { type: "ul", items: ["Проверка schema в Rich Results Test", "Редиректы 301 без цепочек", "Hreflang для мультиязычных сайтов"] },
      ],
      faq: [
        { question: "Как часто делать технический аудит?", answer: "Полный аудит — раз в квартал или после крупных релизов. Мониторинг индексации и 404 — ежемесячно." },
        { question: "Что важнее: скорость или контент?", answer: "Оба блока обязательны. Технические ошибки могут не дать контенту попасть в индекс или ухудшить конверсию." },
        { question: "Нужен ли краулер, если есть Search Console?", answer: "Да, краулер показывает полную картину сайта и проблемы перелинковки, которые в GSC видны фрагментарно." },
      ],
    },
    et: {
      excerpt: "Tehnilise SEO auditi kontrollnimekiri: indekseerimine, kiirus, mobiil, markup ja vead, mis takistavad positsioonide kasvu.",
      metaTitle: "Tehniline SEO audit: mida kontrollida esimesena",
      metaDescription: "Samm-sammuline tehniline SEO audit: indekseerimine, Core Web Vitals, robots.txt, sitemap, duplikaadid ja kriitilised vead.",
      tags: ["tehniline SEO", "audit", "indekseerimine"],
      sections: [
        { type: "h2", text: "Indekseerimine ja indekseeritavus" },
        { type: "p", text: "Alusta Search Console'i ja crawl'iga: millised URL-id on indeksis ja millised välja jäetud. 4xx/5xx vead ja juhuslik noindex on sagedased põhjused." },
        { type: "p", text: "Kontrolli robots.txt, XML sitemap'i ja canonical märgendeid." },
        { type: "ul", items: ["Indekseerimise staatus", "Robots blokeeringud", "www/http duplikaadid"] },
        { type: "h2", text: "Kiirus ja Core Web Vitals" },
        { type: "p", text: "LCP, INP ja CLS mõjutavad kasutajakogemust. Mõõda pärisandmeid, mitte ainult laboriteste." },
        { type: "ol", items: ["Piltide optimeerimine", "JS laadimise haldus", "Stabiilne paigutus"] },
        { type: "h2", text: "Mobiil ja kasutajakogemus" },
        { type: "p", text: "Google kasutab mobile-first indekseerimist. Kontrolli sisu ühtsust ja interaktiivsust mobiilis." },
        { type: "p", text: "Olulised lehed peaksid olema kuni 3–4 klikki avalehelt." },
        { type: "h2", text: "Struktureeritud andmed ja turvalisus" },
        { type: "p", text: "Korrektne schema võib parandada snippet'i. HTTPS ja puhas redirect'ide ahel on kohustuslikud." },
        { type: "ul", items: ["Rich Results test", "301 redirect'id", "Hreflang mitme keele jaoks"] },
      ],
      faq: [
        { question: "Kui tihti teha auditit?", answer: "Täisaudit kord kvartalis või pärast suuri muudatusi. Indekseerimise jälgimine igakuiselt." },
        { question: "Mis on olulisem: kiirus või sisu?", answer: "Mõlemad. Tehnilised vead võivad takistada sisu indekseerimist." },
        { question: "Kas crawler on vajalik?", answer: "Jah, see näitab kogu saidi struktuuri ja siselingiprobleeme." },
      ],
    },
    en: {
      excerpt: "Technical SEO audit checklist: crawlability, speed, mobile UX, structured data, and the issues that block ranking growth.",
      metaTitle: "Technical SEO Audit: What to Check First",
      metaDescription: "Step-by-step technical SEO audit: indexing, Core Web Vitals, robots.txt, sitemaps, duplicates, and critical crawl errors.",
      tags: ["technical SEO", "site audit", "indexing"],
      sections: [
        { type: "h2", text: "Indexing and crawl accessibility" },
        { type: "p", text: "Start with Search Console and a crawler: which URLs are indexed, excluded, and why. 4xx/5xx errors and accidental noindex are common growth blockers." },
        { type: "p", text: "Validate robots.txt, XML sitemaps, and canonical tags. Sitemaps should list only canonical, live URLs." },
        { type: "ul", items: ["Index coverage by section", "Robots blocks", "www and protocol duplicates"] },
        { type: "h2", text: "Speed and Core Web Vitals" },
        { type: "p", text: "LCP, INP, and CLS affect UX and can limit gains. Measure field data from CrUX, not lab scores alone." },
        { type: "ol", items: ["Image and font optimization", "Defer non-critical JavaScript", "Stable layout without CLS"] },
        { type: "h2", text: "Mobile experience" },
        { type: "p", text: "With mobile-first indexing, content parity and tap targets matter. Avoid intrusive interstitials that hurt usability." },
        { type: "p", text: "Key pages should sit within three to four clicks from the homepage." },
        { type: "h2", text: "Structured data and security" },
        { type: "p", text: "Valid Organization, Breadcrumb, and FAQ schema can enhance snippets. HTTPS is mandatory; mixed content hurts trust." },
        { type: "ul", items: ["Rich Results validation", "Clean 301 redirects", "Hreflang for multilingual sites"] },
      ],
      faq: [
        { question: "How often should I run a technical audit?", answer: "Full audits quarterly or after major releases; monitor indexing and 404s monthly." },
        { question: "Speed or content — which matters more?", answer: "Both. Technical issues can prevent content from indexing or converting." },
        { question: "Do I need a crawler if I have Search Console?", answer: "Yes. Crawlers reveal site-wide linking and duplication issues GSC shows only partially." },
      ],
    },
  },
  ...CONTENT_EXTRA,
};

// ─── Build articles & write output ───────────────────────────────────────────

function buildArticle(topic, locale, dateIndex) {
  const meta = topic[locale];
  const body = CONTENT[topic.translationKey][locale];
  const metaTitle = truncate(body.metaTitle || meta.title, 60);
  const metaDescription = truncate(body.metaDescription || body.excerpt, 160);

  return {
    locale,
    translationKey: topic.translationKey,
    slug: meta.slug,
    title: meta.title,
    metaTitle,
    metaDescription,
    date: staggerDate(dateIndex),
    author: "RankBoost Team",
    category: topic.category,
    excerpt: body.excerpt,
    tags: body.tags,
    content: [...body.sections, links(locale), cta(locale)],
    faq: body.faq,
  };
}

const articles = [];
let dateIndex = 0;
for (const topic of TOPICS) {
  for (const locale of LOCALES) {
    articles.push(buildArticle(topic, locale, dateIndex++));
  }
}

if (articles.length !== 60) {
  console.error(`Expected 60 articles, got ${articles.length}`);
  process.exit(1);
}

for (const key of TOPICS.map((t) => t.translationKey)) {
  if (!CONTENT[key]) {
    console.error(`Missing content for translationKey: ${key}`);
    process.exit(1);
  }
  for (const locale of LOCALES) {
    if (!CONTENT[key][locale]) {
      console.error(`Missing content for ${key}/${locale}`);
      process.exit(1);
    }
  }
}

const header = `import { buildPost } from "../types";
import type { ArticleInput } from "../types";

const articles: ArticleInput[] = `;

const footer = `;

export const allPosts = articles.map(buildPost);
`;

const output = header + ts(articles, 0) + footer;

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, output, "utf8");

const lineCount = output.split("\n").length;
console.log(`Wrote ${OUT}`);
console.log(`Articles: ${articles.length}`);
console.log(`Lines: ${lineCount}`);
