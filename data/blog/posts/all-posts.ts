import { buildPost } from "../types";
import type { ArticleInput } from "../types";
import { expertPosts2026 } from "./expert-posts-2026";

const articles: ArticleInput[] = [
  {
    locale: "ru",
    translationKey: "seo-estonia",
    slug: "seo-prodvizhenie-v-estonii",
    title: "SEO-продвижение в Эстонии: как бизнесу получать клиентов из Google",
    metaTitle: "SEO в Эстонии: как получать клиентов из Google",
    metaDescription: "Практическое руководство по SEO-продвижению в Эстонии: аудитория, конкуренция, локальные факторы и шаги для роста органического трафика.",
    date: "2025-01-15",
    author: "RankBoost Team",
    category: "Local SEO",
    excerpt: "Разбираем, как компаниям в Эстонии выстраивать SEO-стратегию: от анализа спроса до локальных сигналов и измеримых заявок из Google.",
    tags: [
      "SEO Эстония",
      "продвижение сайта",
      "Google"
    ],
    content: [
      {
        type: "h2",
        text: "Почему SEO в Эстонии — отдельная задача"
      },
      {
        type: "p",
        text: "Рынок Эстонии компактный, но конкурентный: пользователи ищут на эстонском, русском и английском. Один универсальный контент редко покрывает весь спрос. SEO здесь — это не только позиции, а попадание в нужный языковой сегмент с правильным коммерческим намерением."
      },
      {
        type: "p",
        text: "Многие компании недооценивают локальные запросы вроде «услуга + Таллин» или отраслевые формулировки на эстонском. Без семантики и структуры сайта трафик остаётся случайным, а заявки — нестабильными."
      },
      {
        type: "ul",
        items: [
          "Три рабочих языка поиска: et, ru, en",
          "Высокая доля мобильного трафика",
          "Сильная роль Google Business Profile для локального бизнеса"
        ]
      },
      {
        type: "h2",
        text: "С чего начать продвижение"
      },
      {
        type: "p",
        text: "Первый шаг — собрать семантическое ядро по каждому языку и сегменту услуг. Затем проверить техническое состояние: индексация, скорость, корректные hreflang и канонические URL."
      },
      {
        type: "ol",
        items: [
          "Провести SEO-аудит и карту страниц",
          "Сгруппировать ключевые запросы по посадочным",
          "Настроить аналитику и цели на заявки",
          "Запустить контент и внутреннюю перелинковку"
        ]
      },
      {
        type: "h2",
        text: "Локальные факторы ранжирования"
      },
      {
        type: "p",
        text: "Для бизнеса с офисом или точкой обслуживания критичны NAP-данные, отзывы и активность в Google Business Profile. Ссылки с местных каталогов и партнёрских ресурсов усиливают доверие в регионе."
      },
      {
        type: "p",
        text: "Если вы работаете по всей Эстонии, создайте отдельные посадочные под ключевые города — Таллин, Тарту, Пярну — с уникальными кейсами и FAQ."
      },
      {
        type: "h2",
        text: "Как измерять результат"
      },
      {
        type: "p",
        text: "Смотрите не только на позиции, но на органические лиды: звонки, формы, бронирования. Сравнивайте динамику по языкам и страницам входа — так видно, какие сегменты масштабировать."
      },
      {
        type: "ul",
        items: [
          "Органический трафик по landing pages",
          "Конверсия из поиска в заявку",
          "Доля брендовых и коммерческих запросов",
          "Рост видимости в Search Console"
        ]
      },
      {
        type: "links",
        title: "Полезные материалы",
        items: [
          {
            label: "SEO-услуги",
            href: "/ru/services"
          },
          {
            label: "Тарифы",
            href: "/ru/pricing"
          },
          {
            label: "Контакты",
            href: "/ru/contact"
          }
        ]
      },
      {
        type: "cta",
        title: "Нужна помощь с SEO?",
        description: "Закажите бесплатный SEO-аудит — мы покажем точки роста вашего сайта в Google.",
        buttonLabel: "Получить SEO-аудит",
        href: "/ru/contact"
      }
    ],
    faq: [
      {
        question: "Сколько времени нужно, чтобы SEO заработало в Эстонии?",
        answer: "Первые сдвиги по низкоконкурентным запросам возможны за 2–3 месяца. Устойчивый рост по коммерческим кластерам обычно занимает 4–8 месяцев при регулярной работе над контентом и технической базой."
      },
      {
        question: "Нужен ли сайт на трёх языках?",
        answer: "Если аудитория многоязычная — да. Важно не дублировать переводы машинно, а адаптировать структуру и ключевые страницы под реальный спрос на каждом языке."
      },
      {
        question: "Чем отличается SEO для B2B и B2C в Эстонии?",
        answer: "B2B чаще выигрывает за счёт экспертного контента и длинных запросов, B2C — за счёт локального SEO, скорости сайта и коммерческих страниц с чётким оффером."
      }
    ]
  },
  {
    locale: "et",
    translationKey: "seo-estonia",
    slug: "seo-teenus-eestis",
    title: "SEO teenus Eestis: kuidas ettevõte saab Google'ist rohkem kliente",
    metaTitle: "SEO teenus Eestis: rohkem kliente Google'ist",
    metaDescription: "Kuidas kasvatada orgaanilist liiklust Eestis: märksõnad, tehniline SEO, kohalik nähtavus ja samm-sammuline strateegia väikeettevõttele.",
    date: "2025-01-19",
    author: "RankBoost Team",
    category: "Local SEO",
    excerpt: "Praktiline ülevaade, kuidas Eesti ettevõtted saavad Google'ist rohkem kliente: semantika, tehniline baas, kohalikud signaalid ja mõõdetavad tulemused.",
    tags: [
      "SEO Eestis",
      "Google",
      "orgaaniline liiklus"
    ],
    content: [
      {
        type: "h2",
        text: "Miks Eesti SEO vajab eraldi lähenemist"
      },
      {
        type: "p",
        text: "Eesti turg on väike, kuid tihe. Kasutajad otsivad eesti, vene ja inglise keeles ning ootavad kiiret ja usaldusväärset vastust. Üks üldine leht ei kata tavaliselt kogu nõudlust."
      },
      {
        type: "p",
        text: "Paljud ettevõtted keskenduvad ainult brändile, jättes kasutamata kohalikud ja teenuspõhised päringud. Ilma selge struktuuri ja sisuta ei muutu Google liikluseks müüki."
      },
      {
        type: "ul",
        items: [
          "Kolmekeelne otsingukeskkond",
          "Mobiilne liiklus on domineeriv",
          "Google Business Profile mõjutab kohalikke tulemusi tugevalt"
        ]
      },
      {
        type: "h2",
        text: "Esimesed sammud SEO strateegias"
      },
      {
        type: "p",
        text: "Alusta märksõnade kaardistamisega iga keele ja teenuse jaoks. Kontrolli seejärel indekseerimist, lehe kiirust ja keeleversioonide tehnilist seadistust."
      },
      {
        type: "ol",
        items: [
          "Tee SEO audit ja lehtede kaart",
          "Seo märksõnad maandumislehtedega",
          "Määra analüütikas konversioonid",
          "Avalda sisu ja sisemised lingid"
        ]
      },
      {
        type: "h2",
        text: "Kohalikud rankingusignaalid"
      },
      {
        type: "p",
        text: "Füüsilise asukohaga ettevõtte puhul on olulised täpsed kontaktandmed, arvustused ja aktiivne profiil Google'is. Kohalikud viited ja partnerlingid tõstavad usaldusväärsust."
      },
      {
        type: "p",
        text: "Kui teenindad kogu Eestit, loo eraldi lehed suurematele linnadele koos unikaalse sisu ja KKK-ga."
      },
      {
        type: "h2",
        text: "Tulemuste mõõtmine"
      },
      {
        type: "p",
        text: "Jälgi mitte ainult positsioone, vaid päringuid, kõnesid ja vormitäitmisi. Võrdle keeli ja sisulehti, et näha, kuhu investeering annab kõige parema tulu."
      },
      {
        type: "ul",
        items: [
          "Orgaaniline liiklus maandumislehtedelt",
          "Otsingu konversioonimäär",
          "Brändi- ja ostupäringute dünaamika",
          "Search Console nähtavus"
        ]
      },
      {
        type: "links",
        title: "Kasulikud lingid",
        items: [
          {
            label: "SEO teenused",
            href: "/et/services"
          },
          {
            label: "Hinnakiri",
            href: "/et/pricing"
          },
          {
            label: "Kontakt",
            href: "/et/contact"
          }
        ]
      },
      {
        type: "cta",
        title: "Vajate abi SEO-ga?",
        description: "Tellige tasuta SEO audit — näitame teie veebilehe kasvupunkte Google'is.",
        buttonLabel: "Küsi SEO-auditit",
        href: "/et/contact"
      }
    ],
    faq: [
      {
        question: "Kui kaua võtab SEO Eestis aega?",
        answer: "Esimesed tulemused madalama konkurentsiga päringutel võivad ilmuda 2–3 kuuga. Stabiilne kasv nõuab tavaliselt 4–8 kuud järjepidevat tööd."
      },
      {
        question: "Kas vajan mitmekeelset veebilehte?",
        answer: "Kui klientide hulk on mitmekeelne, siis jah. Iga keel vajab kohandatud sisu, mitte automaatset tõlget."
      },
      {
        question: "Mis eristab B2B ja B2C SEO-d?",
        answer: "B2B kasvab sageli eksperdisisu ja pikkade päringute kaudu, B2C kohaliku nähtavuse ja kiirete teenuselehtede kaudu."
      }
    ]
  },
  {
    locale: "en",
    translationKey: "seo-estonia",
    slug: "seo-services-in-estonia",
    title: "SEO Services in Estonia: How Businesses Get Customers from Google",
    metaTitle: "SEO Services in Estonia: Get Google Customers",
    metaDescription: "How Estonian businesses grow organic traffic: keyword strategy, technical SEO, local signals, and measurable lead generation from Google search.",
    date: "2025-01-24",
    author: "RankBoost Team",
    category: "Local SEO",
    excerpt: "A practical guide for businesses in Estonia on building SEO that turns Google searches into qualified leads — across Estonian, Russian, and English audiences.",
    tags: [
      "SEO Estonia",
      "Google traffic",
      "local SEO"
    ],
    content: [
      {
        type: "h2",
        text: "Why SEO in Estonia needs a focused approach"
      },
      {
        type: "p",
        text: "Estonia's market is small but competitive. Searchers use Estonian, Russian, and English, often with strong local intent. A single generic website rarely captures the full demand."
      },
      {
        type: "p",
        text: "Many companies overlook city- and service-specific queries. Without structured landing pages and clean technical setup, organic traffic stays flat even when rankings look acceptable."
      },
      {
        type: "ul",
        items: [
          "Multilingual search behavior",
          "Mobile-first audience",
          "Google Business Profile drives local visibility"
        ]
      },
      {
        type: "h2",
        text: "Where to start your SEO roadmap"
      },
      {
        type: "p",
        text: "Begin with keyword research per language and service line. Audit crawlability, page speed, and hreflang implementation before scaling content."
      },
      {
        type: "ol",
        items: [
          "Run a technical and content audit",
          "Map keywords to landing pages",
          "Track conversions from organic search",
          "Publish helpful content with internal links"
        ]
      },
      {
        type: "h2",
        text: "Local ranking factors that matter"
      },
      {
        type: "p",
        text: "For location-based businesses, consistent NAP data, reviews, and an active Google Business Profile are essential. Local citations and partnerships add regional trust."
      },
      {
        type: "p",
        text: "If you serve all of Estonia, build dedicated pages for Tallinn, Tartu, and Pärnu with unique proof points and FAQs."
      },
      {
        type: "h2",
        text: "Measuring SEO beyond rankings"
      },
      {
        type: "p",
        text: "Track leads — calls, forms, bookings — not vanity metrics alone. Compare performance by language and landing page to decide where to invest next."
      },
      {
        type: "ul",
        items: [
          "Organic sessions by landing page",
          "Search conversion rate",
          "Branded vs commercial query growth",
          "Search Console impression trends"
        ]
      },
      {
        type: "links",
        title: "Helpful links",
        items: [
          {
            label: "SEO Services",
            href: "/en/services"
          },
          {
            label: "Pricing",
            href: "/en/pricing"
          },
          {
            label: "Contact",
            href: "/en/contact"
          }
        ]
      },
      {
        type: "cta",
        title: "Need SEO help?",
        description: "Order a free SEO audit — we'll show your website's growth opportunities on Google.",
        buttonLabel: "Get an SEO Audit",
        href: "/en/contact"
      }
    ],
    faq: [
      {
        question: "How long does SEO take to work in Estonia?",
        answer: "You may see movement on lower-competition terms in 2–3 months. Sustainable growth on commercial clusters typically needs 4–8 months of consistent work."
      },
      {
        question: "Do I need a multilingual website?",
        answer: "If your customers search in multiple languages, yes. Each language version should reflect real demand, not machine-translated duplicates."
      },
      {
        question: "Is SEO different for B2B and B2C?",
        answer: "B2B often wins with expert content and long-tail queries; B2C benefits more from local SEO, speed, and clear service pages with strong offers."
      }
    ]
  },
  {
    locale: "ru",
    translationKey: "local-seo-tallinn",
    slug: "local-seo-tallinn",
    title: "Local SEO в Таллине: как попасть выше конкурентов в Google",
    metaTitle: "Local SEO в Таллине: выше конкурентов в Google",
    metaDescription: "Как продвигать бизнес в Таллине через Google: оптимизация профиля компании, локальные ключевые слова, отзывы и посадочные страницы.",
    date: "2025-01-28",
    author: "RankBoost Team",
    category: "Local SEO",
    excerpt: "Пошаговый разбор Local SEO для Таллина: карта Google, отзывы, локальные страницы и конкурентный анализ в столичном регионе.",
    tags: [
      "Local SEO",
      "Таллин",
      "Google Maps"
    ],
    content: [
      {
        type: "h2",
        text: "Как устроена локальная выдача в Таллине"
      },
      {
        type: "p",
        text: "В столице Эстонии локальный пакет Google Maps часто решает, кто получит звонок. Пользователь ищет «рядом», «в Таллине», «сегодня» — и выбирает из 3–5 карточек."
      },
      {
        type: "p",
        text: "Конкуренция высокая в сферах красоты, ремонта, медицины и B2B-услуг. Без системной работы с GBP и локальными страницами сайта бизнес остаётся невидимым."
      },
      {
        type: "ul",
        items: [
          "Пакет карт + органическая выдача",
          "Отзывы и фото влияют на CTR",
          "Мобильные near-me запросы растут"
        ]
      },
      {
        type: "h2",
        text: "Оптимизация Google Business Profile"
      },
      {
        type: "p",
        text: "Заполните категории, услуги, часы работы и зону обслуживания. Публикуйте посты, отвечайте на отзывы и добавляйте реальные фото работ — это повышает доверие и кликабельность."
      },
      {
        type: "ol",
        items: [
          "Верифицируйте профиль",
          "Добавьте UTM-метки на сайт",
          "Собирайте отзывы по процессу",
          "Обновляйте спецпредложения"
        ]
      },
      {
        type: "h2",
        text: "Локальные страницы на сайте"
      },
      {
        type: "p",
        text: "Создайте страницу «Услуга + Таллин» с уникальным текстом, кейсами из района и FAQ. Не копируйте один шаблон на все города — Google распознаёт шаблонность."
      },
      {
        type: "p",
        text: "Добавьте Schema LocalBusiness, встроенную карту и чёткие CTA: звонок, маршрут, форма записи."
      },
      {
        type: "h2",
        text: "Как обойти конкурентов"
      },
      {
        type: "p",
        text: "Сравните топ-10 в Maps и органике: какие категории, отзывы и контент у лидеров. Закройте пробелы в услугах, скорости ответа и релевантности страниц."
      },
      {
        type: "ul",
        items: [
          "Анализ конкурентов по районам",
          "Локальные ссылки и партнёрства",
          "Регулярный контент в блоге по Таллину"
        ]
      },
      {
        type: "links",
        title: "Полезные материалы",
        items: [
          {
            label: "SEO-услуги",
            href: "/ru/services"
          },
          {
            label: "Тарифы",
            href: "/ru/pricing"
          },
          {
            label: "Контакты",
            href: "/ru/contact"
          }
        ]
      },
      {
        type: "cta",
        title: "Нужна помощь с SEO?",
        description: "Закажите бесплатный SEO-аудит — мы покажем точки роста вашего сайта в Google.",
        buttonLabel: "Получить SEO-аудит",
        href: "/ru/contact"
      }
    ],
    faq: [
      {
        question: "Нужна ли отдельная страница под каждый район?",
        answer: "Если район — отдельный спрос и вы там работаете, да. Иначе достаточно одной сильной страницы по Таллину с блоком зон обслуживания."
      },
      {
        question: "Сколько отзывов нужно для топа в Maps?",
        answer: "Важнее качество и регулярность, чем число. Стабильный поток свежих отзывов с деталями услуги работает лучше разовой накрутки."
      },
      {
        question: "Помогает ли Local SEO без сайта?",
        answer: "Профиль в Google даёт базовую видимость, но сайт с локальными страницами расширяет охват в органике и повышает конверсию."
      }
    ]
  },
  {
    locale: "et",
    translationKey: "local-seo-tallinn",
    slug: "kohalik-seo-tallinnas",
    title: "Kohalik SEO Tallinnas: kuidas Google'is konkurentidest ette jõuda",
    metaTitle: "Kohalik SEO Tallinnas: jõua Google'is ette",
    metaDescription: "Kuidas tõsta Tallinna ettevõtte nähtavust Google'is: Business Profile, kohalikud märksõnad, arvustused ja optimeeritud maandumislehed.",
    date: "2025-02-02",
    author: "RankBoost Team",
    category: "Local SEO",
    excerpt: "Tallinna kohaliku SEO juhend: Google kaart, arvustused, linnapõhised lehed ja praktilised sammud konkurentidest ette jõudmiseks.",
    tags: [
      "kohalik SEO",
      "Tallinn",
      "Google Maps"
    ],
    content: [
      {
        type: "h2",
        text: "Kuidas töötab kohalik otsing Tallinnas"
      },
      {
        type: "p",
        text: "Tallinnas otsivad inimesed sageli teenust linna või naabruses põhjal. Google Maps pakett määrab, kes saab kõne või broneeringu."
      },
      {
        type: "p",
        text: "Konkurents on tugev teenusvaldkondades nagu iluteenused, remont ja tervishoid. Ilma süsteemse kohaliku strateegiata jääb ettevõte teise plaaniga."
      },
      {
        type: "ul",
        items: [
          "Kaardipakett + orgaaniline tulemus",
          "Arvustused mõjutavad klikke",
          "Mobiilsed 'lähedal' päringud"
        ]
      },
      {
        type: "h2",
        text: "Google Business Profile optimeerimine"
      },
      {
        type: "p",
        text: "Täida kategooriad, teenused ja lahtiolekuajad. Lisa päris fotod, vasta arvustustele ja avalda uuendusi — see tõstab usaldust."
      },
      {
        type: "ol",
        items: [
          "Kinnita profiil",
          "Seo veebilehe lingid",
          "Kogu arvustusi protsessina",
          "Uuenda pakkumisi"
        ]
      },
      {
        type: "h2",
        text: "Kohalikud lehed veebis"
      },
      {
        type: "p",
        text: "Loo leht 'teenus + Tallinn' unikaalse teksti, juhtumiuuringute ja KKK-ga. Väldi identseid šabloone eri linnade jaoks."
      },
      {
        type: "p",
        text: "Lisa LocalBusiness markup, kaart ja selged tegevuskutsed: helista, marsruut, vorm."
      },
      {
        type: "h2",
        text: "Kuidas konkurente ületada"
      },
      {
        type: "p",
        text: "Uuri TOP-i kaardil ja orgaanikas: millised teenused, arvustused ja sisulehed neil on. Täida oma tugevamate pakkumiste ja kiirema vastusega lüngad."
      },
      {
        type: "ul",
        items: [
          "Linnaosa konkurentsianalüüs",
          "Kohalikud viited",
          "Tallinna-teemaline blogi"
        ]
      },
      {
        type: "links",
        title: "Kasulikud lingid",
        items: [
          {
            label: "SEO teenused",
            href: "/et/services"
          },
          {
            label: "Hinnakiri",
            href: "/et/pricing"
          },
          {
            label: "Kontakt",
            href: "/et/contact"
          }
        ]
      },
      {
        type: "cta",
        title: "Vajate abi SEO-ga?",
        description: "Tellige tasuta SEO audit — näitame teie veebilehe kasvupunkte Google'is.",
        buttonLabel: "Küsi SEO-auditit",
        href: "/et/contact"
      }
    ],
    faq: [
      {
        question: "Kas vajan eraldi lehte iga linnaosa jaoks?",
        answer: "Kui linnaosas on eraldi nõudlus ja teenindad seal, siis jah. Muidu piisab tugevast üld-Tallinna lehest."
      },
      {
        question: "Mitu arvustust on vaja?",
        answer: "Oluline on regulaarsus ja detailid teenuse kohta, mitte ainult arv."
      },
      {
        question: "Kas Local SEO töötab ilma veebileheta?",
        answer: "Profiil annab baasnähtavuse, kuid veebileht laiendab orgaanilist haaret."
      }
    ]
  },
  {
    locale: "en",
    translationKey: "local-seo-tallinn",
    slug: "local-seo-tallinn",
    title: "Local SEO in Tallinn: How to Rank Above Competitors in Google",
    metaTitle: "Local SEO in Tallinn: Rank Above Competitors",
    metaDescription: "Grow your Tallinn business on Google: optimize Business Profile, local keywords, reviews, and dedicated landing pages for the capital market.",
    date: "2025-02-06",
    author: "RankBoost Team",
    category: "Local SEO",
    excerpt: "Step-by-step Local SEO for Tallinn businesses: Google Maps, reviews, city landing pages, and tactics to outrank competitors in the capital.",
    tags: [
      "Local SEO",
      "Tallinn",
      "Google Maps"
    ],
    content: [
      {
        type: "h2",
        text: "How local search works in Tallinn"
      },
      {
        type: "p",
        text: "In Estonia's capital, the Google Maps pack often decides who gets the call. Users search with city and near-me intent and pick from a handful of listings."
      },
      {
        type: "p",
        text: "Competition is intense in beauty, home services, healthcare, and professional services. Without GBP optimization and local pages, visibility stays limited."
      },
      {
        type: "ul",
        items: [
          "Map pack plus organic results",
          "Reviews influence click-through",
          "Mobile near-me queries dominate"
        ]
      },
      {
        type: "h2",
        text: "Optimizing your Google Business Profile"
      },
      {
        type: "p",
        text: "Complete categories, services, hours, and service areas. Publish updates, respond to reviews, and add real project photos to build trust."
      },
      {
        type: "ol",
        items: [
          "Verify the profile",
          "Link to tracked website URLs",
          "Build a steady review workflow",
          "Refresh offers regularly"
        ]
      },
      {
        type: "h2",
        text: "City landing pages on your site"
      },
      {
        type: "p",
        text: "Create a 'service + Tallinn' page with unique copy, local case studies, and FAQ. Avoid copy-pasting the same template across cities."
      },
      {
        type: "p",
        text: "Add LocalBusiness schema, an embedded map, and clear CTAs for calls, directions, and booking."
      },
      {
        type: "h2",
        text: "Beating local competitors"
      },
      {
        type: "p",
        text: "Benchmark top map and organic results: categories, review themes, and content depth. Close gaps with stronger offers and faster response."
      },
      {
        type: "ul",
        items: [
          "District-level competitor review",
          "Local citations and partnerships",
          "Tallinn-focused blog content"
        ]
      },
      {
        type: "links",
        title: "Helpful links",
        items: [
          {
            label: "SEO Services",
            href: "/en/services"
          },
          {
            label: "Pricing",
            href: "/en/pricing"
          },
          {
            label: "Contact",
            href: "/en/contact"
          }
        ]
      },
      {
        type: "cta",
        title: "Need SEO help?",
        description: "Order a free SEO audit — we'll show your website's growth opportunities on Google.",
        buttonLabel: "Get an SEO Audit",
        href: "/en/contact"
      }
    ],
    faq: [
      {
        question: "Do I need a page for every district?",
        answer: "Only if there is distinct demand and you serve that area. Otherwise one strong Tallinn page with service zones is enough."
      },
      {
        question: "How many reviews do I need?",
        answer: "Consistency and detail matter more than volume. Fresh, specific reviews outperform a one-time spike."
      },
      {
        question: "Can Local SEO work without a website?",
        answer: "A profile gives baseline visibility, but a website expands organic reach and improves conversion."
      }
    ]
  },
  {
    locale: "ru",
    translationKey: "ecommerce-seo",
    slug: "seo-dlya-internet-magazina",
    title: "SEO для интернет-магазина: как увеличить органический трафик и продажи",
    metaTitle: "SEO для интернет-магазина: трафик и продажи",
    metaDescription: "Практические методы SEO для e-commerce: структура каталога, оптимизация карточек, технические ошибки и рост конверсии из Google.",
    date: "2025-02-10",
    author: "RankBoost Team",
    category: "E-commerce SEO",
    excerpt: "Как интернет-магазину увеличить органический трафик: категории, карточки товаров, фильтры, скорость и контент, который конвертирует в продажи.",
    tags: [
      "интернет-магазин",
      "e-commerce SEO",
      "продажи"
    ],
    content: [
      {
        type: "h2",
        text: "Архитектура каталога для поиска"
      },
      {
        type: "p",
        text: "Поисковики должны понимать иерархию: категория → подкатегория → товар. Плоская структура или дубли URL режут индексацию и размывают релевантность."
      },
      {
        type: "p",
        text: "Фильтры и сортировки часто создают тысячи дублей. Используйте canonical, noindex для малополезных комбинаций и оставляйте индексируемыми только ценные посадочные."
      },
      {
        type: "ul",
        items: [
          "Чистые URL без лишних параметров",
          "Хлебные крошки и внутренние ссылки",
          "Отдельные SEO-тексты для категорий"
        ]
      },
      {
        type: "h2",
        text: "Оптимизация карточек товара"
      },
      {
        type: "p",
        text: "Title и H1 должны отражать бренд, модель и ключевой атрибут. Описание — не копия поставщика: добавьте FAQ, сравнения и реальные преимущества для покупателя."
      },
      {
        type: "ol",
        items: [
          "Уникальные meta description",
          "Структурированные данные Product",
          "Отзывы и UGC на странице",
          "Качественные изображения с alt"
        ]
      },
      {
        type: "h2",
        text: "Технический SEO для магазина"
      },
      {
        type: "p",
        text: "Скорость напрямую влияет на конверсию. Оптимизируйте изображения, критический CSS и кэш. Проверьте мобильную версию и корректность пагинации."
      },
      {
        type: "p",
        text: "Отслеживайте ошибки сканирования в Search Console: битые ссылки, редиректы и out-of-stock страницы должны обрабатываться предсказуемо."
      },
      {
        type: "h2",
        text: "Контент вне каталога"
      },
      {
        type: "p",
        text: "Блог, гайды и подборки «лучшее для…» приводят информационный трафик и усиливают внутренние ссылки на коммерческие страницы."
      },
      {
        type: "ul",
        items: [
          "Обзоры и сравнения товаров",
          "Сезонные подборки",
          "Статьи по болям покупателя"
        ]
      },
      {
        type: "links",
        title: "Полезные материалы",
        items: [
          {
            label: "SEO-услуги",
            href: "/ru/services"
          },
          {
            label: "Тарифы",
            href: "/ru/pricing"
          },
          {
            label: "Контакты",
            href: "/ru/contact"
          }
        ]
      },
      {
        type: "cta",
        title: "Нужна помощь с SEO?",
        description: "Закажите бесплатный SEO-аудит — мы покажем точки роста вашего сайта в Google.",
        buttonLabel: "Получить SEO-аудит",
        href: "/ru/contact"
      }
    ],
    faq: [
      {
        question: "Индексировать ли страницы «нет в наличии»?",
        answer: "Если товар вернётся — оставьте с пометкой и альтернативами. Если снят навсегда — 301 на ближайшую категорию или аналог."
      },
      {
        question: "Нужен ли блог интернет-магазину?",
        answer: "Да, он расширяет семантику и даёт ссылки на категории. Главное — писать под реальные вопросы покупателей."
      },
      {
        question: "Как быстрее всего поднять продажи из SEO?",
        answer: "Оптимизируйте топ-категории и хиты продаж: там уже есть спрос, нужно улучшить видимость и конверсию страницы."
      }
    ]
  },
  {
    locale: "et",
    translationKey: "ecommerce-seo",
    slug: "e-poe-seo",
    title: "E-poe SEO: kuidas kasvatada orgaanilist liiklust ja müüki",
    metaTitle: "E-poe SEO: orgaaniline liiklus ja müük",
    metaDescription: "Kuidas kasvatada e-poe nähtavust Google'is: kategooriad, tootelehtede optimeerimine, tehnilised vead ja konversiooni tõstmine.",
    date: "2025-02-15",
    author: "RankBoost Team",
    category: "E-commerce SEO",
    excerpt: "E-poe SEO praktika: kataloogi struktuur, tootelehed, tehniline jõudlus ja sisu, mis muudab Google'i külastajad ostjateks.",
    tags: [
      "e-pood",
      "SEO",
      "müük"
    ],
    content: [
      {
        type: "h2",
        text: "Kataloogi struktuur otsingumootoritele"
      },
      {
        type: "p",
        text: "Selge hierarhia aitab Google'il mõista su pakkumist. Halvad filtrid ja duplikaat-URL-id vähendavad indekseeritavat mahtu."
      },
      {
        type: "p",
        text: "Kasuta canonical märgendeid ja noindex reegleid filtritele, mis ei too otsinguliiklust."
      },
      {
        type: "ul",
        items: [
          "Puhtad URL-id",
          "Siselingid kategooriates",
          "Unikaalne kategooriatekst"
        ]
      },
      {
        type: "h2",
        text: "Tootelehe optimeerimine"
      },
      {
        type: "p",
        text: "Pealkiri peab sisaldama brändi ja peamist omadust. Kirjeldus peab vastama ostja küsimustele, mitte kordama tarnija teksti."
      },
      {
        type: "ol",
        items: [
          "Unikaalne meta kirjeldus",
          "Product schema",
          "Arvustused lehel",
          "Optimeeritud pildid"
        ]
      },
      {
        type: "h2",
        text: "Tehniline SEO e-poes"
      },
      {
        type: "p",
        text: "Kiirus mõjutab nii positsioone kui ostukäitumist. Optimeeri pildid, vahemälu ja mobiilikogemust."
      },
      {
        type: "p",
        text: "Jälgi Search Console'i vigu: katkised lingid ja laost otsas tooted vajavad selget käsitlust."
      },
      {
        type: "h2",
        text: "Sisu väljaspool kataloogi"
      },
      {
        type: "p",
        text: "Blogi ja juhendid toovad infopäringuid ja suunavad liiklust müügilehtedele."
      },
      {
        type: "ul",
        items: [
          "Tootevõrdlused",
          "Hooajalised kollektsioonid",
          "Ostujuhendid"
        ]
      },
      {
        type: "links",
        title: "Kasulikud lingid",
        items: [
          {
            label: "SEO teenused",
            href: "/et/services"
          },
          {
            label: "Hinnakiri",
            href: "/et/pricing"
          },
          {
            label: "Kontakt",
            href: "/et/contact"
          }
        ]
      },
      {
        type: "cta",
        title: "Vajate abi SEO-ga?",
        description: "Tellige tasuta SEO audit — näitame teie veebilehe kasvupunkte Google'is.",
        buttonLabel: "Küsi SEO-auditit",
        href: "/et/contact"
      }
    ],
    faq: [
      {
        question: "Kas indekseerida laost otsas tooteid?",
        answer: "Kui toode tuleb tagasi, jäta leht alles alternatiividega. Kui ei tule, suuna 301 kategooriasse."
      },
      {
        question: "Kas e-pood vajab blogi?",
        answer: "Jah, see laiendab märksõnade ulatust ja toetab kategooriaid siselingiga."
      },
      {
        question: "Kust alustada kiireima tulemusega?",
        answer: "Paranda kõige populaarsemad kategooriad ja tooted, kus nõudlus on juba olemas."
      }
    ]
  },
  {
    locale: "en",
    translationKey: "ecommerce-seo",
    slug: "ecommerce-seo",
    title: "Ecommerce SEO: How to Grow Organic Traffic and Sales",
    metaTitle: "Ecommerce SEO: Organic Traffic and Sales",
    metaDescription: "Grow ecommerce visibility on Google: category architecture, product page optimization, technical fixes, and conversion-focused content.",
    date: "2025-02-19",
    author: "RankBoost Team",
    category: "E-commerce SEO",
    excerpt: "Practical ecommerce SEO: catalog structure, product pages, technical performance, and content that turns organic visitors into buyers.",
    tags: [
      "ecommerce SEO",
      "online store",
      "organic sales"
    ],
    content: [
      {
        type: "h2",
        text: "Catalog architecture for search"
      },
      {
        type: "p",
        text: "Search engines need a clear hierarchy: category, subcategory, product. Flat or duplicate URL patterns waste crawl budget and dilute relevance."
      },
      {
        type: "p",
        text: "Faceted navigation can spawn thousands of thin URLs. Use canonicals, noindex rules, and index only high-value landing combinations."
      },
      {
        type: "ul",
        items: [
          "Clean parameterized URLs",
          "Breadcrumbs and internal links",
          "Unique category copy"
        ]
      },
      {
        type: "h2",
        text: "Product page optimization"
      },
      {
        type: "p",
        text: "Titles should reflect brand, model, and key attributes. Descriptions must answer buyer questions — not duplicate supplier text."
      },
      {
        type: "ol",
        items: [
          "Unique meta descriptions",
          "Product schema markup",
          "On-page reviews and UGC",
          "Optimized images with alt text"
        ]
      },
      {
        type: "h2",
        text: "Technical SEO for stores"
      },
      {
        type: "p",
        text: "Speed affects rankings and revenue. Compress images, cache smartly, and validate mobile UX. Monitor crawl errors and out-of-stock handling."
      },
      {
        type: "p",
        text: "Fix broken links, redirect chains, and pagination issues flagged in Search Console before scaling content."
      },
      {
        type: "h2",
        text: "Content beyond the catalog"
      },
      {
        type: "p",
        text: "Guides, comparisons, and seasonal collections capture informational queries and funnel authority to money pages."
      },
      {
        type: "ul",
        items: [
          "Buying guides",
          "Comparison articles",
          "Problem-solution content"
        ]
      },
      {
        type: "links",
        title: "Helpful links",
        items: [
          {
            label: "SEO Services",
            href: "/en/services"
          },
          {
            label: "Pricing",
            href: "/en/pricing"
          },
          {
            label: "Contact",
            href: "/en/contact"
          }
        ]
      },
      {
        type: "cta",
        title: "Need SEO help?",
        description: "Order a free SEO audit — we'll show your website's growth opportunities on Google.",
        buttonLabel: "Get an SEO Audit",
        href: "/en/contact"
      }
    ],
    faq: [
      {
        question: "Should out-of-stock pages stay indexed?",
        answer: "If the product returns, keep the page with alternatives. If discontinued, 301 to the category or successor SKU."
      },
      {
        question: "Does an online store need a blog?",
        answer: "Yes — it expands keyword coverage and supports categories via internal links."
      },
      {
        question: "What drives sales fastest?",
        answer: "Optimize top categories and bestsellers where demand already exists; improve visibility and on-page conversion."
      }
    ]
  },
  {
    locale: "ru",
    translationKey: "technical-seo-audit",
    slug: "tehnicheskiy-seo-audit",
    title: "Технический SEO-аудит сайта: что проверять в первую очередь",
    metaTitle: "Технический SEO-аудит: что проверить первым",
    metaDescription: "Пошаговый технический SEO-аудит сайта: краулинг, Core Web Vitals, robots.txt, sitemap, дубли и критические ошибки индексации.",
    date: "2025-02-24",
    author: "RankBoost Team",
    category: "Technical SEO",
    excerpt: "Чек-лист технического SEO-аудита: индексация, скорость, мобильная версия, разметка и ошибки, которые блокируют рост позиций.",
    tags: [
      "технический SEO",
      "аудит",
      "индексация"
    ],
    content: [
      {
        type: "h2",
        text: "Индексация и доступность для роботов"
      },
      {
        type: "p",
        text: "Начните с Search Console и краулера: какие URL в индексе, какие исключены и почему. Ошибки 4xx/5xx и случайный noindex — частая причина просадки."
      },
      {
        type: "p",
        text: "Проверьте robots.txt, XML-sitemap и канонические теги. Sitemap должен содержать только канонические, актуальные страницы."
      },
      {
        type: "ul",
        items: [
          "Статус индексации по разделам",
          "Блокировки в robots",
          "Дубли с www/non-www и http/https"
        ]
      },
      {
        type: "h2",
        text: "Скорость и Core Web Vitals"
      },
      {
        type: "p",
        text: "LCP, INP и CLS влияют на UX и могут ограничивать рост. Измеряйте реальные данные из CrUX, не только лабораторные тесты."
      },
      {
        type: "ol",
        items: [
          "Оптимизация изображений и шрифтов",
          "Отложенная загрузка некритичного JS",
          "Стабильная вёрстка без сдвигов"
        ]
      },
      {
        type: "h2",
        text: "Мобильная версия и UX"
      },
      {
        type: "p",
        text: "Google использует mobile-first indexing. Проверьте совпадение контента, кликабельность элементов и отсутствие навязчивых interstitials."
      },
      {
        type: "p",
        text: "Отдельно оцените внутреннюю перелинковку: важные страницы не должны быть глубже 3–4 кликов от главной."
      },
      {
        type: "h2",
        text: "Структурированные данные и безопасность"
      },
      {
        type: "p",
        text: "Валидная разметка Organization, BreadcrumbList и FAQ может улучшить сниппет. HTTPS обязателен; смешанный контент и просроченные сертификаты подрывают доверие."
      },
      {
        type: "ul",
        items: [
          "Проверка schema в Rich Results Test",
          "Редиректы 301 без цепочек",
          "Hreflang для мультиязычных сайтов"
        ]
      },
      {
        type: "links",
        title: "Полезные материалы",
        items: [
          {
            label: "SEO-услуги",
            href: "/ru/services"
          },
          {
            label: "Тарифы",
            href: "/ru/pricing"
          },
          {
            label: "Контакты",
            href: "/ru/contact"
          }
        ]
      },
      {
        type: "cta",
        title: "Нужна помощь с SEO?",
        description: "Закажите бесплатный SEO-аудит — мы покажем точки роста вашего сайта в Google.",
        buttonLabel: "Получить SEO-аудит",
        href: "/ru/contact"
      }
    ],
    faq: [
      {
        question: "Как часто делать технический аудит?",
        answer: "Полный аудит — раз в квартал или после крупных релизов. Мониторинг индексации и 404 — ежемесячно."
      },
      {
        question: "Что важнее: скорость или контент?",
        answer: "Оба блока обязательны. Технические ошибки могут не дать контенту попасть в индекс или ухудшить конверсию."
      },
      {
        question: "Нужен ли краулер, если есть Search Console?",
        answer: "Да, краулер показывает полную картину сайта и проблемы перелинковки, которые в GSC видны фрагментарно."
      }
    ]
  },
  {
    locale: "et",
    translationKey: "technical-seo-audit",
    slug: "tehniline-seo-audit",
    title: "Tehniline SEO audit: mida kontrollida esimesena",
    metaTitle: "Tehniline SEO audit: mida kontrollida esimesena",
    metaDescription: "Samm-sammuline tehniline SEO audit: indekseerimine, Core Web Vitals, robots.txt, sitemap, duplikaadid ja kriitilised vead.",
    date: "2025-02-28",
    author: "RankBoost Team",
    category: "Technical SEO",
    excerpt: "Tehnilise SEO auditi kontrollnimekiri: indekseerimine, kiirus, mobiil, markup ja vead, mis takistavad positsioonide kasvu.",
    tags: [
      "tehniline SEO",
      "audit",
      "indekseerimine"
    ],
    content: [
      {
        type: "h2",
        text: "Indekseerimine ja indekseeritavus"
      },
      {
        type: "p",
        text: "Alusta Search Console'i ja crawl'iga: millised URL-id on indeksis ja millised välja jäetud. 4xx/5xx vead ja juhuslik noindex on sagedased põhjused."
      },
      {
        type: "p",
        text: "Kontrolli robots.txt, XML sitemap'i ja canonical märgendeid."
      },
      {
        type: "ul",
        items: [
          "Indekseerimise staatus",
          "Robots blokeeringud",
          "www/http duplikaadid"
        ]
      },
      {
        type: "h2",
        text: "Kiirus ja Core Web Vitals"
      },
      {
        type: "p",
        text: "LCP, INP ja CLS mõjutavad kasutajakogemust. Mõõda pärisandmeid, mitte ainult laboriteste."
      },
      {
        type: "ol",
        items: [
          "Piltide optimeerimine",
          "JS laadimise haldus",
          "Stabiilne paigutus"
        ]
      },
      {
        type: "h2",
        text: "Mobiil ja kasutajakogemus"
      },
      {
        type: "p",
        text: "Google kasutab mobile-first indekseerimist. Kontrolli sisu ühtsust ja interaktiivsust mobiilis."
      },
      {
        type: "p",
        text: "Olulised lehed peaksid olema kuni 3–4 klikki avalehelt."
      },
      {
        type: "h2",
        text: "Struktureeritud andmed ja turvalisus"
      },
      {
        type: "p",
        text: "Korrektne schema võib parandada snippet'i. HTTPS ja puhas redirect'ide ahel on kohustuslikud."
      },
      {
        type: "ul",
        items: [
          "Rich Results test",
          "301 redirect'id",
          "Hreflang mitme keele jaoks"
        ]
      },
      {
        type: "links",
        title: "Kasulikud lingid",
        items: [
          {
            label: "SEO teenused",
            href: "/et/services"
          },
          {
            label: "Hinnakiri",
            href: "/et/pricing"
          },
          {
            label: "Kontakt",
            href: "/et/contact"
          }
        ]
      },
      {
        type: "cta",
        title: "Vajate abi SEO-ga?",
        description: "Tellige tasuta SEO audit — näitame teie veebilehe kasvupunkte Google'is.",
        buttonLabel: "Küsi SEO-auditit",
        href: "/et/contact"
      }
    ],
    faq: [
      {
        question: "Kui tihti teha auditit?",
        answer: "Täisaudit kord kvartalis või pärast suuri muudatusi. Indekseerimise jälgimine igakuiselt."
      },
      {
        question: "Mis on olulisem: kiirus või sisu?",
        answer: "Mõlemad. Tehnilised vead võivad takistada sisu indekseerimist."
      },
      {
        question: "Kas crawler on vajalik?",
        answer: "Jah, see näitab kogu saidi struktuuri ja siselingiprobleeme."
      }
    ]
  },
  {
    locale: "en",
    translationKey: "technical-seo-audit",
    slug: "technical-seo-audit",
    title: "Technical SEO Audit: What to Check First",
    metaTitle: "Technical SEO Audit: What to Check First",
    metaDescription: "Step-by-step technical SEO audit: indexing, Core Web Vitals, robots.txt, sitemaps, duplicates, and critical crawl errors.",
    date: "2025-03-04",
    author: "RankBoost Team",
    category: "Technical SEO",
    excerpt: "Technical SEO audit checklist: crawlability, speed, mobile UX, structured data, and the issues that block ranking growth.",
    tags: [
      "technical SEO",
      "site audit",
      "indexing"
    ],
    content: [
      {
        type: "h2",
        text: "Indexing and crawl accessibility"
      },
      {
        type: "p",
        text: "Start with Search Console and a crawler: which URLs are indexed, excluded, and why. 4xx/5xx errors and accidental noindex are common growth blockers."
      },
      {
        type: "p",
        text: "Validate robots.txt, XML sitemaps, and canonical tags. Sitemaps should list only canonical, live URLs."
      },
      {
        type: "ul",
        items: [
          "Index coverage by section",
          "Robots blocks",
          "www and protocol duplicates"
        ]
      },
      {
        type: "h2",
        text: "Speed and Core Web Vitals"
      },
      {
        type: "p",
        text: "LCP, INP, and CLS affect UX and can limit gains. Measure field data from CrUX, not lab scores alone."
      },
      {
        type: "ol",
        items: [
          "Image and font optimization",
          "Defer non-critical JavaScript",
          "Stable layout without CLS"
        ]
      },
      {
        type: "h2",
        text: "Mobile experience"
      },
      {
        type: "p",
        text: "With mobile-first indexing, content parity and tap targets matter. Avoid intrusive interstitials that hurt usability."
      },
      {
        type: "p",
        text: "Key pages should sit within three to four clicks from the homepage."
      },
      {
        type: "h2",
        text: "Structured data and security"
      },
      {
        type: "p",
        text: "Valid Organization, Breadcrumb, and FAQ schema can enhance snippets. HTTPS is mandatory; mixed content hurts trust."
      },
      {
        type: "ul",
        items: [
          "Rich Results validation",
          "Clean 301 redirects",
          "Hreflang for multilingual sites"
        ]
      },
      {
        type: "links",
        title: "Helpful links",
        items: [
          {
            label: "SEO Services",
            href: "/en/services"
          },
          {
            label: "Pricing",
            href: "/en/pricing"
          },
          {
            label: "Contact",
            href: "/en/contact"
          }
        ]
      },
      {
        type: "cta",
        title: "Need SEO help?",
        description: "Order a free SEO audit — we'll show your website's growth opportunities on Google.",
        buttonLabel: "Get an SEO Audit",
        href: "/en/contact"
      }
    ],
    faq: [
      {
        question: "How often should I run a technical audit?",
        answer: "Full audits quarterly or after major releases; monitor indexing and 404s monthly."
      },
      {
        question: "Speed or content — which matters more?",
        answer: "Both. Technical issues can prevent content from indexing or converting."
      },
      {
        question: "Do I need a crawler if I have Search Console?",
        answer: "Yes. Crawlers reveal site-wide linking and duplication issues GSC shows only partially."
      }
    ]
  },
  {
    locale: "ru",
    translationKey: "seo-pricing",
    slug: "skolko-stoit-seo",
    title: "Сколько стоит SEO-продвижение сайта в Европе",
    metaTitle: "Сколько стоит SEO в Европе: цены и факторы",
    metaDescription: "Честный разбор цен на SEO-продвижение в Европе и Эстонии: что входит в тариф, от чего зависит бюджет и как оценить окупаемость органического трафика.",
    date: "2025-03-09",
    author: "RankBoost Team",
    category: "SEO Strategy",
    excerpt: "Разбираем, из чего складывается стоимость SEO в Европе и Эстонии: аудит, контент, ссылки и поддержка. Помогаем понять, за что вы платите и какой бюджет реалистичен для вашей ниши.",
    tags: [
      "SEO цена",
      "стоимость продвижения",
      "Европа"
    ],
    content: [
      {
        type: "h2",
        text: "Из чего складывается цена SEO"
      },
      {
        type: "p",
        text: "SEO — это не разовая покупка позиций, а системная работа: технический аудит, семантика, контент, внутренняя перелинковка, локальные сигналы и регулярная отчётность. Стоимость зависит от конкуренции ниши, числа языков и текущего состояния сайта."
      },
      {
        type: "p",
        text: "На рынке Эстонии и Балтии типичный диапазон для малого и среднего бизнеса — от нескольких сотен до нескольких тысяч евро в месяц. Дешёвые «пакеты из 50 ключей» редко дают устойчивый результат без стратегии."
      },
      {
        type: "ul",
        items: [
          "Объём семантики и число посадочных",
          "Количество языковых версий",
          "Техническая сложность CMS",
          "Необходимость контента и ссылок"
        ]
      },
      {
        type: "h2",
        text: "Типовые модели оплаты"
      },
      {
        type: "p",
        text: "Ретейнер (ежемесячная подписка) — самый распространённый формат для долгосрочного роста. Разовый аудит подходит для диагностики, проектная оплата — для запуска нового сайта или миграции."
      },
      {
        type: "ol",
        items: [
          "Стартовый аудит и дорожная карта",
          "Ежемесячное сопровождение с KPI",
          "Почасовая работа для точечных задач",
          "Гибрид: фикс + бонус за результат"
        ]
      },
      {
        type: "h2",
        text: "Как не переплатить и не недоинвестировать"
      },
      {
        type: "p",
        text: "Сравнивайте не только цену, но и состав работ: кто пишет тексты, кто правит код, как часто вы получаете отчёт. Прозрачный план на 3–6 месяцев снижает риск скрытых доплат."
      },
      {
        type: "p",
        text: "Для локального бизнеса в Таллине или Тарту часто достаточно узкой стратегии: GBP, локальные страницы и базовый технический фундамент. Для e-commerce или B2B с широкой семантикой бюджет будет выше."
      },
      {
        type: "h2",
        text: "Окупаемость SEO"
      },
      {
        type: "p",
        text: "Считайте стоимость лида из органики против платного трафика. SEO окупается, когда рост видимости конвертируется в заявки с предсказуемой маржой — обычно горизонт 4–12 месяцев."
      },
      {
        type: "ul",
        items: [
          "Сравнение CPL: SEO vs Google Ads",
          "LTV клиента из поиска",
          "Доля брендового трафика как подушка",
          "Экономия на масштабе контента"
        ]
      },
      {
        type: "links",
        title: "Полезные материалы",
        items: [
          {
            label: "SEO-услуги",
            href: "/ru/services"
          },
          {
            label: "Тарифы",
            href: "/ru/pricing"
          },
          {
            label: "Контакты",
            href: "/ru/contact"
          }
        ]
      },
      {
        type: "cta",
        title: "Нужна помощь с SEO?",
        description: "Закажите бесплатный SEO-аудит — мы покажем точки роста вашего сайта в Google.",
        buttonLabel: "Получить SEO-аудит",
        href: "/ru/contact"
      }
    ],
    faq: [
      {
        question: "Сколько стоит SEO в месяц для малого бизнеса в Эстонии?",
        answer: "При локальной нише и одном языке разумный диапазон часто начинается от 400–800 € в месяц за аудит, базовую оптимизацию и отчётность. Точная сумма зависит от конкуренции и объёма работ."
      },
      {
        question: "Можно ли платить только за топ-10?",
        answer: "Гарантии позиций — красный флаг. Профессиональное SEO оплачивает процесс и измеримый рост трафика и лидов, а не фиксированное место в выдаче."
      },
      {
        question: "Что дешевле: SEO или контекстная реклама?",
        answer: "Реклама даёт быстрый трафик, но останавливается с бюджетом. SEO требует вложений вперёд, зато снижает зависимость от клика в долгой перспективе."
      }
    ]
  },
  {
    locale: "et",
    translationKey: "seo-pricing",
    slug: "kui-palju-maksab-seo",
    title: "Kui palju maksab SEO Euroopas",
    metaTitle: "Kui palju maksab SEO Euroopas: hinnad",
    metaDescription: "Aus ülevaade SEO hindadest Euroopas ja Eestis: mis kuulub teenusesse, mis mõjutab eelarvet ja kuidas hinnata orgaanilise liikluse tasuvust.",
    date: "2025-03-13",
    author: "RankBoost Team",
    category: "SEO Strategy",
    excerpt: "Selgitame, millest koosneb SEO hind Euroopas ja Eestis: audit, sisu, lingid ja jätkuv tugi. Aitame mõista, mille eest maksad ja milline eelarve on sinu nišis realistlik.",
    tags: [
      "SEO hind",
      "turunduseelarve",
      "Euroopa"
    ],
    content: [
      {
        type: "h2",
        text: "Mis kujundab SEO hinda"
      },
      {
        type: "p",
        text: "SEO ei ole ühekordne positsioonide ost, vaid süsteemne töö: tehniline audit, märksõnad, sisu, siselingid, kohalikud signaalid ja regulaarne raport. Hind sõltub konkurentsist, keelte arvust ja saidi seisukorrast."
      },
      {
        type: "p",
        text: "Eesti ja Balti turul on väikeettevõtte tüüpiline vahemik mõnest sajast kuni mõne tuhandeni eurot kuus. Odavad '50 märksõna paketid' harva annavad jätkusuutlikku tulemust."
      },
      {
        type: "ul",
        items: [
          "Märksõnade maht ja maandumislehed",
          "Mitmekeelsus",
          "CMS-i tehniline keerukus",
          "Sisu ja linkide vajadus"
        ]
      },
      {
        type: "h2",
        text: "Levinud hinnamudelid"
      },
      {
        type: "p",
        text: "Kuutasu (retainer) sobib pikaajaliseks kasvuks. Ühekordne audit aitab diagnoosida, projektipõhine makse — uue saidi või migratsiooni käivitamisel."
      },
      {
        type: "ol",
        items: [
          "Algaudit ja tegevuskava",
          "Igakuine tugi KPI-dega",
          "Tunnipõhine töö",
          "Hübriid: fikseeritud + tulemusboonus"
        ]
      },
      {
        type: "h2",
        text: "Kuidas vältida üle- ja alainvesteerimist"
      },
      {
        type: "p",
        text: "Võrdle mitte ainult hinda, vaid töö mahtu: kes kirjutab sisu, kes parandab koodi, kui tihti saad raporti. Läbipaistev 3–6 kuu plaan vähendab ootamatuid kulusid."
      },
      {
        type: "p",
        text: "Kohalikule ettevõttele Tallinnas või Tartus piisab sageli kitsast strateegiast: GBP, kohalikud lehed ja tehniline baas. E-poe või laia semantikaga B2B puhul on eelarve suurem."
      },
      {
        type: "h2",
        text: "SEO tasuvus"
      },
      {
        type: "p",
        text: "Arvuta orgaanilise päringu maksumus võrreldes tasulise liiklusega. SEO tasub ära, kui nähtavuse kasv muutub prognoositavateks päringuteks — tavaliselt 4–12 kuu perspektiivis."
      },
      {
        type: "ul",
        items: [
          "CPL võrdlus: SEO vs Google Ads",
          "Kliendi eluaegne väärtus",
          "Brändiliikluse puhver",
          "Sisu skaleerimise sääst"
        ]
      },
      {
        type: "links",
        title: "Kasulikud lingid",
        items: [
          {
            label: "SEO teenused",
            href: "/et/services"
          },
          {
            label: "Hinnakiri",
            href: "/et/pricing"
          },
          {
            label: "Kontakt",
            href: "/et/contact"
          }
        ]
      },
      {
        type: "cta",
        title: "Vajate abi SEO-ga?",
        description: "Tellige tasuta SEO audit — näitame teie veebilehe kasvupunkte Google'is.",
        buttonLabel: "Küsi SEO-auditit",
        href: "/et/contact"
      }
    ],
    faq: [
      {
        question: "Kui palju maksab SEO kuus väikeettevõttele Eestis?",
        answer: "Kohaliku niši ja ühe keele puhul algab mõistlik vahemik sageli 400–800 € kuus auditi, baasoptimeerimise ja raporti eest. Täpne summa sõltub konkurentsist."
      },
      {
        question: "Kas saab maksta ainult TOP-10 eest?",
        answer: "Positsioonigarantii on hoiatusmärk. Professionaalne SEO maksab protsessi ja mõõdetava liikluse kasvu eest, mitte kindla koha eest."
      },
      {
        question: "Mis on odavam: SEO või reklaam?",
        answer: "Reklaam toob kiire liikluse, kuid peatub koos eelarvega. SEO nõuab etteinvesteeringut, kuid vähendab pikas plaanis sõltuvust klikihinnast."
      }
    ]
  },
  {
    locale: "en",
    translationKey: "seo-pricing",
    slug: "how-much-does-seo-cost",
    title: "How Much Does SEO Cost in Europe",
    metaTitle: "How Much Does SEO Cost in Europe",
    metaDescription: "Honest guide to SEO pricing in Europe and Estonia: what's included, what affects monthly retainers, and how to evaluate organic traffic ROI.",
    date: "2025-03-17",
    author: "RankBoost Team",
    category: "SEO Strategy",
    excerpt: "A clear breakdown of SEO pricing in Europe and Estonia: audits, content, links, and ongoing support. Learn what drives cost and what budget fits your niche.",
    tags: [
      "SEO pricing",
      "Europe",
      "marketing budget"
    ],
    content: [
      {
        type: "h2",
        text: "What drives SEO cost"
      },
      {
        type: "p",
        text: "SEO is ongoing work — technical audits, keyword strategy, content, internal linking, local signals, and reporting. Price depends on niche competition, language count, and your site's current health."
      },
      {
        type: "p",
        text: "In Estonia and the Baltics, small and mid-size businesses often invest from a few hundred to several thousand euros per month. Cheap '50 keywords' packages rarely deliver sustainable growth."
      },
      {
        type: "ul",
        items: [
          "Keyword scope and landing pages",
          "Multilingual setup",
          "CMS technical complexity",
          "Content and link building needs"
        ]
      },
      {
        type: "h2",
        text: "Common pricing models"
      },
      {
        type: "p",
        text: "Monthly retainers suit long-term growth. One-off audits diagnose issues; project fees fit new launches or migrations."
      },
      {
        type: "ol",
        items: [
          "Kickoff audit and roadmap",
          "Monthly support with KPIs",
          "Hourly for specific tasks",
          "Hybrid: fixed fee plus performance bonus"
        ]
      },
      {
        type: "h2",
        text: "Avoiding over- and under-spending"
      },
      {
        type: "p",
        text: "Compare scope, not price alone: who writes content, who fixes code, how often you get reports. A transparent 3–6 month plan reduces surprise costs."
      },
      {
        type: "p",
        text: "A Tallinn local business may need a focused plan — GBP, city pages, technical basics. E-commerce or broad B2B semantics require a larger budget."
      },
      {
        type: "h2",
        text: "SEO return on investment"
      },
      {
        type: "p",
        text: "Compare organic cost per lead with paid traffic. SEO pays off when visibility gains convert to predictable leads — typically over 4–12 months."
      },
      {
        type: "ul",
        items: [
          "CPL: SEO vs Google Ads",
          "Customer lifetime value from search",
          "Branded traffic as a buffer",
          "Content scale economies"
        ]
      },
      {
        type: "links",
        title: "Helpful links",
        items: [
          {
            label: "SEO Services",
            href: "/en/services"
          },
          {
            label: "Pricing",
            href: "/en/pricing"
          },
          {
            label: "Contact",
            href: "/en/contact"
          }
        ]
      },
      {
        type: "cta",
        title: "Need SEO help?",
        description: "Order a free SEO audit — we'll show your website's growth opportunities on Google.",
        buttonLabel: "Get an SEO Audit",
        href: "/en/contact"
      }
    ],
    faq: [
      {
        question: "What does monthly SEO cost for a small business in Estonia?",
        answer: "For a local niche and one language, a realistic range often starts around €400–800 per month for audit, core optimization, and reporting. Competition and scope set the final number."
      },
      {
        question: "Can I pay only for top-10 rankings?",
        answer: "Guaranteed positions are a red flag. Professional SEO charges for process and measurable traffic and lead growth, not a fixed slot in SERPs."
      },
      {
        question: "Is SEO cheaper than Google Ads?",
        answer: "Ads deliver fast traffic but stop when spend stops. SEO needs upfront investment but reduces long-term dependence on cost per click."
      }
    ]
  },
  {
    locale: "ru",
    translationKey: "seo-small-business",
    slug: "seo-dlya-malogo-biznesa",
    title: "SEO для малого бизнеса: с чего начать продвижение сайта",
    metaTitle: "SEO для малого бизнеса: с чего начать",
    metaDescription: "Пошаговый план SEO для малого бизнеса: Google Business Profile, ключевые страницы, отзывы и контент, который приводит локальных клиентов.",
    date: "2025-03-22",
    author: "RankBoost Team",
    category: "General SEO",
    excerpt: "Практичное руководство по SEO для малого бизнеса в Эстонии: минимальный набор действий, который даёт заявки из Google без огромного бюджета.",
    tags: [
      "малый бизнес",
      "SEO старт",
      "локальный трафик"
    ],
    content: [
      {
        type: "h2",
        text: "Почему SEO доступно малому бизнесу"
      },
      {
        type: "p",
        text: "Вам не нужен отдел из десяти человек. Достаточно сильного фундамента: понятный сайт, оптимизированный профиль в Google, несколько ключевых страниц услуг и система сбора отзывов."
      },
      {
        type: "p",
        text: "В Эстонии многие ниши ещё недооптимизированы — особенно на эстонском и русском языках. Это окно для быстрых побед по локальным и узким запросам."
      },
      {
        type: "ul",
        items: [
          "Локальный спрос выше национального",
          "Меньше страниц — быстрее эффект",
          "Отзывы решают в Maps"
        ]
      },
      {
        type: "h2",
        text: "Первые 30 дней"
      },
      {
        type: "p",
        text: "Проверьте, индексируется ли сайт, работает ли HTTPS и есть ли страницы под каждую основную услугу. Настройте Google Business Profile и аналитику с целями на звонки и формы."
      },
      {
        type: "ol",
        items: [
          "Технический мини-аудит",
          "Карточка услуг с ценами или вилкой",
          "Сбор 5–10 реальных отзывов",
          "Регистрация в Search Console"
        ]
      },
      {
        type: "h2",
        text: "Контент без блога на 100 статей"
      },
      {
        type: "p",
        text: "Сфокусируйтесь на коммерческих и FAQ-страницах: «сколько стоит», «как проходит услуга», «сроки». Один качественный гайд в квартал лучше десяти шаблонных постов."
      },
      {
        type: "p",
        text: "Используйте реальные кейсы и фото работ — это повышает доверие и уникальность для поисковиков."
      },
      {
        type: "h2",
        text: "Что отслеживать"
      },
      {
        type: "p",
        text: "Малый бизнес выигрывает от простых метрик: звонки с сайта, заявки из органики, показы в Maps, позиции по 10–20 целевым запросам."
      },
      {
        type: "ul",
        items: [
          "Заявки по источнику organic",
          "Конверсия мобильных пользователей",
          "Динамика отзывов в GBP",
          "Топ-страницы в Search Console"
        ]
      },
      {
        type: "links",
        title: "Полезные материалы",
        items: [
          {
            label: "SEO-услуги",
            href: "/ru/services"
          },
          {
            label: "Тарифы",
            href: "/ru/pricing"
          },
          {
            label: "Контакты",
            href: "/ru/contact"
          }
        ]
      },
      {
        type: "cta",
        title: "Нужна помощь с SEO?",
        description: "Закажите бесплатный SEO-аудит — мы покажем точки роста вашего сайта в Google.",
        buttonLabel: "Получить SEO-аудит",
        href: "/ru/contact"
      }
    ],
    faq: [
      {
        question: "Нужен ли блог малому бизнесу?",
        answer: "Не обязательно с первого дня. Начните с услуг и FAQ. Блог имеет смысл, когда есть вопросы клиентов, на которые нет места на коммерческих страницах."
      },
      {
        question: "Сколько времени уделять SEO самостоятельно?",
        answer: "2–4 часа в неделю на старте достаточно для профиля, отзывов и базовых правок. Для технических задач и контента лучше привлечь специалиста."
      },
      {
        question: "Что важнее для салона или мастера в Таллине?",
        answer: "Google Business Profile, мобильная скорость сайта и локальные ключевые слова с районом или городом в заголовках."
      }
    ]
  },
  {
    locale: "et",
    translationKey: "seo-small-business",
    slug: "seo-vaikeettevottele",
    title: "SEO väikeettevõttele: millest alustada",
    metaTitle: "SEO väikeettevõttele: kust alustada",
    metaDescription: "Samm-sammuline SEO plaan väikeettevõttele: Google Business Profile, teenuselehed, arvustused ja sisu, mis toob kohalikke kliente.",
    date: "2025-03-26",
    author: "RankBoost Team",
    category: "General SEO",
    excerpt: "Praktiline SEO juhend väikeettevõttele Eestis: minimaalne tegevuste komplekt, mis toob Google'ist päringuid ilma suure eelarbeta.",
    tags: [
      "väikeettevõte",
      "SEO algus",
      "kohalik liiklus"
    ],
    content: [
      {
        type: "h2",
        text: "Miks SEO sobib väikeettevõttele"
      },
      {
        type: "p",
        text: "Sul ei pea olema suurt meeskonda. Piisab tugevast vundamendist: arusaadav veebileht, optimeeritud Google'i profiil, peamised teenuselehed ja arvustuste kogumise protsess."
      },
      {
        type: "p",
        text: "Eestis on paljud nišid alles optimeerimata — eriti eesti ja vene keeles. See annab kiireid võite kohalike päringute osas."
      },
      {
        type: "ul",
        items: [
          "Kohalik nõudlus on kättesaadav",
          "Vähem lehti — kiirem tulemus",
          "Arvustused määravad Maps'is"
        ]
      },
      {
        type: "h2",
        text: "Esimesed 30 päeva"
      },
      {
        type: "p",
        text: "Kontrolli indekseerimist, HTTPS-i ja iga põhiteenuse lehte. Seadista Google Business Profile ja analüütika konversioonid kõnede ja vormide jaoks."
      },
      {
        type: "ol",
        items: [
          "Tehniline mini-audit",
          "Teenuseleht hindade või vahemikuga",
          "5–10 päris arvustust",
          "Search Console ühendamine"
        ]
      },
      {
        type: "h2",
        text: "Sisu ilma suure blogita"
      },
      {
        type: "p",
        text: "Keskendu müügi- ja KKK-lehtedele: hind, protsess, ajakava. Üks kvaliteetne juhend kvartalis on parem kui kümme šabloonpostitust."
      },
      {
        type: "p",
        text: "Kasuta päris juhtumiuuringuid ja tööfotosid — see tõstab usaldust ja unikaalsust."
      },
      {
        type: "h2",
        text: "Mida jälgida"
      },
      {
        type: "p",
        text: "Väikeettevõte võidab lihtsate mõõdikutega: kõned saidilt, orgaanilised päringud, Maps'i nähtavus, positsioonid 10–20 sihtpäringul."
      },
      {
        type: "ul",
        items: [
          "Päringud allikast organic",
          "Mobiilne konversioon",
          "GBP arvustuste dünaamika",
          "Search Console TOP-lehed"
        ]
      },
      {
        type: "links",
        title: "Kasulikud lingid",
        items: [
          {
            label: "SEO teenused",
            href: "/et/services"
          },
          {
            label: "Hinnakiri",
            href: "/et/pricing"
          },
          {
            label: "Kontakt",
            href: "/et/contact"
          }
        ]
      },
      {
        type: "cta",
        title: "Vajate abi SEO-ga?",
        description: "Tellige tasuta SEO audit — näitame teie veebilehe kasvupunkte Google'is.",
        buttonLabel: "Küsi SEO-auditit",
        href: "/et/contact"
      }
    ],
    faq: [
      {
        question: "Kas väikeettevõte vajab blogi?",
        answer: "Mitte kohe. Alusta teenustest ja KKK-st. Blogi on mõistlik, kui klientidel on küsimusi, mis ei mahu müügilehtedele."
      },
      {
        question: "Kui palju aega SEO-le kulutada?",
        answer: "2–4 tundi nädalas piisab profiili, arvustuste ja põhiparanduste jaoks. Tehnilise töö ja sisu jaoks tasub kaasata spetsialist."
      },
      {
        question: "Mis on olulisem salongile Tallinnas?",
        answer: "Google Business Profile, mobiilne kiirus ja kohalikud märksõnad linna või linnaosaga pealkirjades."
      }
    ]
  },
  {
    locale: "en",
    translationKey: "seo-small-business",
    slug: "seo-for-small-business",
    title: "SEO for Small Business: Where to Start",
    metaTitle: "SEO for Small Business: Where to Start",
    metaDescription: "Step-by-step SEO for small business: Google Business Profile, service pages, reviews, and content that attracts local customers from search.",
    date: "2025-03-31",
    author: "RankBoost Team",
    category: "General SEO",
    excerpt: "Practical SEO for small businesses in Estonia: the minimum viable plan that brings Google leads without a massive budget.",
    tags: [
      "small business SEO",
      "getting started",
      "local leads"
    ],
    content: [
      {
        type: "h2",
        text: "Why SEO fits small business"
      },
      {
        type: "p",
        text: "You do not need a large team. A strong foundation is enough: a clear website, an optimized Google profile, core service pages, and a steady review workflow."
      },
      {
        type: "p",
        text: "Many Estonian niches are still under-optimized — especially in Estonian and Russian. That creates quick wins on local and long-tail queries."
      },
      {
        type: "ul",
        items: [
          "Local demand is reachable",
          "Fewer pages, faster impact",
          "Reviews decide in Maps"
        ]
      },
      {
        type: "h2",
        text: "Your first 30 days"
      },
      {
        type: "p",
        text: "Confirm indexing, HTTPS, and a dedicated page per main service. Set up Google Business Profile and analytics goals for calls and forms."
      },
      {
        type: "ol",
        items: [
          "Technical mini-audit",
          "Service pages with pricing signals",
          "Collect 5–10 genuine reviews",
          "Connect Search Console"
        ]
      },
      {
        type: "h2",
        text: "Content without a huge blog"
      },
      {
        type: "p",
        text: "Focus on commercial and FAQ pages: pricing, process, timelines. One quality guide per quarter beats ten thin posts."
      },
      {
        type: "p",
        text: "Use real case studies and project photos — they build trust and uniqueness for search engines."
      },
      {
        type: "h2",
        text: "What to track"
      },
      {
        type: "p",
        text: "Small businesses win with simple metrics: calls from the site, organic form fills, Maps visibility, rankings on 10–20 target queries."
      },
      {
        type: "ul",
        items: [
          "Leads by organic source",
          "Mobile conversion rate",
          "GBP review trend",
          "Top pages in Search Console"
        ]
      },
      {
        type: "links",
        title: "Helpful links",
        items: [
          {
            label: "SEO Services",
            href: "/en/services"
          },
          {
            label: "Pricing",
            href: "/en/pricing"
          },
          {
            label: "Contact",
            href: "/en/contact"
          }
        ]
      },
      {
        type: "cta",
        title: "Need SEO help?",
        description: "Order a free SEO audit — we'll show your website's growth opportunities on Google.",
        buttonLabel: "Get an SEO Audit",
        href: "/en/contact"
      }
    ],
    faq: [
      {
        question: "Does a small business need a blog?",
        answer: "Not on day one. Start with services and FAQ. Add a blog when customer questions do not fit commercial pages."
      },
      {
        question: "How much time should I spend on SEO?",
        answer: "2–4 hours per week covers profile, reviews, and basic fixes. Technical work and content often need a specialist."
      },
      {
        question: "What matters most for a Tallinn service business?",
        answer: "Google Business Profile, mobile speed, and local keywords with city or district in titles."
      }
    ]
  },
  {
    locale: "ru",
    translationKey: "google-business-profile",
    slug: "google-business-profile-estonia",
    title: "Google Business Profile в Эстонии: как получать больше локальных клиентов",
    metaTitle: "Google Business Profile в Эстонии: гайд",
    metaDescription: "Полное руководство по Google Business Profile для бизнеса в Эстонии: верификация, оптимизация, отзывы и интеграция с сайтом.",
    date: "2025-04-04",
    author: "RankBoost Team",
    category: "Local SEO",
    excerpt: "Как настроить Google Business Profile в Эстонии: категории, услуги, отзывы и посты, которые увеличивают звонки и маршруты из Maps.",
    tags: [
      "Google Business Profile",
      "локальный SEO",
      "Эстония"
    ],
    content: [
      {
        type: "h2",
        text: "Зачем GBP критичен в Эстонии"
      },
      {
        type: "p",
        text: "Большинство локальных запросов в Таллине, Тарту и Пярну заканчиваются кликом по карте или звонком из пакета Maps. Без актуального профиля вы теряете трафик даже при хорошем сайте."
      },
      {
        type: "p",
        text: "Профиль влияет на доверие: фото, часы работы, ответы на отзывы и Q&A — сигналы, по которым пользователь выбирает между вами и конкурентом."
      },
      {
        type: "ul",
        items: [
          "Пакет карт + боковая панель знаний",
          "Мобильные near-me запросы",
          "Связка с сайтом и UTM"
        ]
      },
      {
        type: "h2",
        text: "Настройка и верификация"
      },
      {
        type: "p",
        text: "Выберите основную и дополнительные категории максимально близко к реальным услугам. Укажите зону обслуживания или адрес, добавьте все релевантные атрибуты и ссылку на сайт с отслеживанием."
      },
      {
        type: "ol",
        items: [
          "Подтверждение адреса или видеоверификация",
          "Заполнение услуг с ценами где возможно",
          "Загрузка качественных фото",
          "Единые NAP-данные с сайтом"
        ]
      },
      {
        type: "h2",
        text: "Отзывы и репутация"
      },
      {
        type: "p",
        text: "Просите отзыв после успешной услуги — по SMS или email со ссылкой. Отвечайте на каждый отзыв в течение 48 часов, особенно на негативные: это видят и клиенты, и алгоритм."
      },
      {
        type: "p",
        text: "Не покупайте накрутку — Google санкционирует профили. Лучше меньше, но подробных отзывов с упоминанием услуги и локации."
      },
      {
        type: "h2",
        text: "Посты, фото и аналитика"
      },
      {
        type: "p",
        text: "Публикуйте новости, акции и кейсы раз в 1–2 недели. Обновляйте сезонные фото. Смотрите Insights: какие запросы, звонки и маршруты приносит профиль."
      },
      {
        type: "ul",
        items: [
          "Google Posts с CTA",
          "Фото до/после и команды",
          "Сравнение месяц к месяцу в Insights",
          "Связка с локальными страницами сайта"
        ]
      },
      {
        type: "links",
        title: "Полезные материалы",
        items: [
          {
            label: "SEO-услуги",
            href: "/ru/services"
          },
          {
            label: "Тарифы",
            href: "/ru/pricing"
          },
          {
            label: "Контакты",
            href: "/ru/contact"
          }
        ]
      },
      {
        type: "cta",
        title: "Нужна помощь с SEO?",
        description: "Закажите бесплатный SEO-аудит — мы покажем точки роста вашего сайта в Google.",
        buttonLabel: "Получить SEO-аудит",
        href: "/ru/contact"
      }
    ],
    faq: [
      {
        question: "Можно ли вести GBP на русском и эстонском?",
        answer: "Описание и посты можно адаптировать под аудиторию. Категории и адрес должны совпадать с официальными данными компании на всех языках сайта."
      },
      {
        question: "Что делать при смене адреса?",
        answer: "Обновите адрес в GBP и на сайте одновременно, запросите повторную верификацию при необходимости. Несовпадение NAP снижает доверие."
      },
      {
        question: "Помогает ли GBP для онлайн-бизнеса без офиса?",
        answer: "Для чисто онлайн-модели профиль ограничен. Для сервиса с выездом к клиенту укажите зону обслуживания и скройте адрес, если политика Google это позволяет для вашей категории."
      }
    ]
  },
  {
    locale: "et",
    translationKey: "google-business-profile",
    slug: "google-business-profile-eestis",
    title: "Google Business Profile Eestis: kuidas saada rohkem kohalikke kliente",
    metaTitle: "Google Business Profile Eestis: juhend",
    metaDescription: "Täielik juhend Google Business Profile'ile Eestis: kinnitamine, optimeerimine, arvustused ja veebilehe integratsioon.",
    date: "2025-04-08",
    author: "RankBoost Team",
    category: "Local SEO",
    excerpt: "Kuidas seadistada Google Business Profile Eestis: kategooriad, teenused, arvustused ja postitused, mis suurendavad kõnesid ja marsruute Maps'ist.",
    tags: [
      "Google Business Profile",
      "kohalik SEO",
      "Eesti"
    ],
    content: [
      {
        type: "h2",
        text: "Miks GBP on Eestis kriitiline"
      },
      {
        type: "p",
        text: "Enamik kohalikke päringuid Tallinnas, Tartus ja Pärnus lõpeb kaardi või kõne klõpsuga. Ilma ajakohase profiilita kaotad liiklust isegi hea veebilehe korral."
      },
      {
        type: "p",
        text: "Profiil mõjutab usaldust: fotod, lahtiolekuajad, vastused arvustustele ja KKK — signaalid, mille järgi klient sind valib."
      },
      {
        type: "ul",
        items: [
          "Kaardipakett + teadmepaneel",
          "Mobiilsed 'lähedal' päringud",
          "Ühendus saidi ja UTM-idega"
        ]
      },
      {
        type: "h2",
        text: "Seadistamine ja kinnitamine"
      },
      {
        type: "p",
        text: "Vali peamine ja lisakategooriad vastavalt tegelikele teenustele. Lisa teeninduspiirkond või aadress, atribuudid ja veebilingi jälgimisega."
      },
      {
        type: "ol",
        items: [
          "Aadressi või videokinnitamine",
          "Teenuste täitmine hindadega",
          "Kvaliteetsed fotod",
          "Ühtsed NAP-andmed saidiga"
        ]
      },
      {
        type: "h2",
        text: "Arvustused ja maine"
      },
      {
        type: "p",
        text: "Küsi arvustust pärast edukat teenust SMS-i või e-kirjaga. Vasta 48 tunni jooksul, eriti negatiivsetele — neid näevad nii kliendid kui algoritm."
      },
      {
        type: "p",
        text: "Ära osta võltsarvustusi — Google sanktsioneerib profiile. Parem on vähem, kuid detailseid arvustusi teenuse ja asukohaga."
      },
      {
        type: "h2",
        text: "Postitused, fotod ja analüütika"
      },
      {
        type: "p",
        text: "Avalda uudiseid ja pakkumisi 1–2 nädala tagant. Uuenda hooajalisi fotosid. Jälgi Insights'is päringuid, kõnesid ja marsruute."
      },
      {
        type: "ul",
        items: [
          "Google Postid CTA-ga",
          "Enne/pärast fotod",
          "Kuu-võrdlus Insights'is",
          "Seos kohalike saidilehtedega"
        ]
      },
      {
        type: "links",
        title: "Kasulikud lingid",
        items: [
          {
            label: "SEO teenused",
            href: "/et/services"
          },
          {
            label: "Hinnakiri",
            href: "/et/pricing"
          },
          {
            label: "Kontakt",
            href: "/et/contact"
          }
        ]
      },
      {
        type: "cta",
        title: "Vajate abi SEO-ga?",
        description: "Tellige tasuta SEO audit — näitame teie veebilehe kasvupunkte Google'is.",
        buttonLabel: "Küsi SEO-auditit",
        href: "/et/contact"
      }
    ],
    faq: [
      {
        question: "Kas GBP-d saab hallata mitmes keeles?",
        answer: "Kirjeldusi ja postitusi saab kohandada. Kategooriad ja aadress peavad ühtima ametlike andmetega kõigil saidi keeldel."
      },
      {
        question: "Mida teha aadressi muutmisel?",
        answer: "Uuenda GBP ja sait korraga, vajadusel taotle uut kinnitust. NAP-i lahknevus vähendab usaldust."
      },
      {
        question: "Kas GBP aitab täiesti veebipõhisel ettevõttel?",
        answer: "Puhtalt veebimudelil on profiil piiratud. Kui teenindad klienti kohapeal, määra teeninduspiirkond vastavalt Google'i reeglitele."
      }
    ]
  },
  {
    locale: "en",
    translationKey: "google-business-profile",
    slug: "google-business-profile-estonia",
    title: "Google Business Profile in Estonia: How to Get More Local Customers",
    metaTitle: "Google Business Profile in Estonia: Guide",
    metaDescription: "Complete Google Business Profile guide for Estonian businesses: verification, optimization, reviews, and website integration for local leads.",
    date: "2025-04-13",
    author: "RankBoost Team",
    category: "Local SEO",
    excerpt: "How to optimize Google Business Profile in Estonia: categories, services, reviews, and posts that drive calls and directions from Maps.",
    tags: [
      "Google Business Profile",
      "local SEO",
      "Estonia"
    ],
    content: [
      {
        type: "h2",
        text: "Why GBP matters in Estonia"
      },
      {
        type: "p",
        text: "Most local searches in Tallinn, Tartu, and Pärnu end with a map click or call from the Maps pack. Without an active profile, you lose traffic even with a solid website."
      },
      {
        type: "p",
        text: "Your profile shapes trust: photos, hours, review responses, and Q&A are signals users compare before choosing you over competitors."
      },
      {
        type: "ul",
        items: [
          "Map pack plus knowledge panel",
          "Mobile near-me queries",
          "Website link with UTM tracking"
        ]
      },
      {
        type: "h2",
        text: "Setup and verification"
      },
      {
        type: "p",
        text: "Pick primary and secondary categories that match real services. Set service area or address, add attributes, and link to your site with tracking parameters."
      },
      {
        type: "ol",
        items: [
          "Address or video verification",
          "Service list with pricing where possible",
          "High-quality photo uploads",
          "Consistent NAP with your website"
        ]
      },
      {
        type: "h2",
        text: "Reviews and reputation"
      },
      {
        type: "p",
        text: "Ask for reviews after successful service — via SMS or email with a direct link. Reply within 48 hours, especially to negative feedback; customers and algorithms both notice."
      },
      {
        type: "p",
        text: "Avoid fake review schemes — Google penalizes profiles. Fewer detailed reviews mentioning service and location outperform bulk spam."
      },
      {
        type: "h2",
        text: "Posts, photos, and insights"
      },
      {
        type: "p",
        text: "Publish offers and updates every 1–2 weeks. Refresh seasonal photos. Use Insights to see which queries, calls, and direction requests you earn."
      },
      {
        type: "ul",
        items: [
          "Google Posts with CTAs",
          "Before/after and team photos",
          "Month-over-month Insights",
          "Tie-in with local site pages"
        ]
      },
      {
        type: "links",
        title: "Helpful links",
        items: [
          {
            label: "SEO Services",
            href: "/en/services"
          },
          {
            label: "Pricing",
            href: "/en/pricing"
          },
          {
            label: "Contact",
            href: "/en/contact"
          }
        ]
      },
      {
        type: "cta",
        title: "Need SEO help?",
        description: "Order a free SEO audit — we'll show your website's growth opportunities on Google.",
        buttonLabel: "Get an SEO Audit",
        href: "/en/contact"
      }
    ],
    faq: [
      {
        question: "Can I manage GBP in Estonian and Russian?",
        answer: "Descriptions and posts can match your audience. Categories and address must align with official company data across all site languages."
      },
      {
        question: "What if I change address?",
        answer: "Update GBP and the website together and re-verify if required. NAP mismatches hurt local trust."
      },
      {
        question: "Does GBP help a fully online business?",
        answer: "Pure online models have limited profile options. For on-site service businesses, set a service area per Google's category rules."
      }
    ]
  },
  {
    locale: "ru",
    translationKey: "seo-articles",
    slug: "seo-stati-dlya-sayta",
    title: "SEO-статьи для сайта: как писать контент, который приводит клиентов",
    metaTitle: "SEO-статьи для сайта: как писать контент",
    metaDescription: "Руководство по SEO-копирайтингу: выбор тем, структура H2-H3, внутренние ссылки и контент, который приводит заявки из Google.",
    date: "2025-04-17",
    author: "RankBoost Team",
    category: "Content SEO",
    excerpt: "Как писать SEO-статьи, которые ранжируются и конвертируют: структура, интент, E-E-A-T и примеры для B2B и сервисного бизнеса в Эстонии.",
    tags: [
      "SEO статьи",
      "контент-маркетинг",
      "копирайтинг"
    ],
    content: [
      {
        type: "h2",
        text: "Статья начинается с интента"
      },
      {
        type: "p",
        text: "Перед написанием определите, что ищет пользователь: сравнение, инструкция, цена, отзывы. Статья под информационный запрос не должна продавать в лоб — она ведёт к услуге через экспертизу."
      },
      {
        type: "p",
        text: "В эстонском и русскоязычном сегментах часто меньше качественного контента, чем на английском — это шанс занять нишу при глубоком раскрытии темы."
      },
      {
        type: "ul",
        items: [
          "Кластеризация запросов по теме",
          "Анализ SERP: какой формат в топе",
          "Уникальный угол для локального рынка"
        ]
      },
      {
        type: "h2",
        text: "Структура, которую любит Google"
      },
      {
        type: "p",
        text: "Один H1, логичные H2 по подтемам, короткие абзацы и списки. Добавьте оглавление на длинных материалах, таблицы сравнения и блок FAQ со schema."
      },
      {
        type: "ol",
        items: [
          "Цепляющий лид с ответом на запрос",
          "2–4 H2 с практическими шагами",
          "Визуалы с alt-текстом",
          "CTA к услуге или консультации"
        ]
      },
      {
        type: "h2",
        text: "E-E-A-T и доверие"
      },
      {
        type: "p",
        text: "Указывайте автора с опытом, ссылайтесь на источники, обновляйте даты. Для YMYL-тем (медицина, финансы) экспертная проверка обязательна."
      },
      {
        type: "p",
        text: "Кейсы из Эстонии, реальные цифры и скриншоты Search Console усиливают экспертность лучше общих фраз."
      },
      {
        type: "h2",
        text: "Внутренняя перелинковка и обновления"
      },
      {
        type: "p",
        text: "Каждая статья должна ссылаться на 2–3 релевантные коммерческие страницы и другие статьи кластера. Раз в 6–12 месяцев обновляйте статистику и примеры."
      },
      {
        type: "ul",
        items: [
          "Анкорные тексты естественные",
          "Хаб-страницы по темам",
          "Удаление устаревшего контента",
          "Мониторинг позиций и CTR"
        ]
      },
      {
        type: "links",
        title: "Полезные материалы",
        items: [
          {
            label: "SEO-услуги",
            href: "/ru/services"
          },
          {
            label: "Тарифы",
            href: "/ru/pricing"
          },
          {
            label: "Контакты",
            href: "/ru/contact"
          }
        ]
      },
      {
        type: "cta",
        title: "Нужна помощь с SEO?",
        description: "Закажите бесплатный SEO-аудит — мы покажем точки роста вашего сайта в Google.",
        buttonLabel: "Получить SEO-аудит",
        href: "/ru/contact"
      }
    ],
    faq: [
      {
        question: "Какой объём статьи оптимален?",
        answer: "Ориентир — полнота ответа, не знак. Для узкой темы хватит 800–1200 слов, для гайда — 2000+. Главное — закрыть интент лучше конкурентов."
      },
      {
        question: "Можно ли использовать AI для SEO-текстов?",
        answer: "AI ускоряет черновик, но финальный текст нуждается в экспертизе, фактах и редактуре. Шаблонный AI-контент редко держится в топе."
      },
      {
        question: "Сколько статей публиковать в месяц?",
        answer: "Для малого бизнеса 2–4 качественные публикации лучше 20 слабых. Приоритет — страницы с коммерческим потенциалом."
      }
    ]
  },
  {
    locale: "et",
    translationKey: "seo-articles",
    slug: "seo-artiklid-kodulehele",
    title: "SEO artiklid kodulehele: kuidas kirjutada sisu, mis toob kliente",
    metaTitle: "SEO artiklid: kuidas kirjutada sisu",
    metaDescription: "Juhend SEO copywriting'uks: teemade valik, H2-H3 struktuur, siselingid ja sisu, mis toob Google'ist kliente.",
    date: "2025-04-22",
    author: "RankBoost Team",
    category: "Content SEO",
    excerpt: "Kuidas kirjutada SEO artikleid, mis jõuavad tippu ja toovad päringuid: struktuur, otsingukavatsus, E-E-A-T ja näited Eesti turul.",
    tags: [
      "SEO artiklid",
      "sisuturundus",
      "copywriting"
    ],
    content: [
      {
        type: "h2",
        text: "Artikkel algab otsingukavatsusest"
      },
      {
        type: "p",
        text: "Enne kirjutamist määra, mida kasutaja otsib: võrdlus, juhend, hind, arvustus. Informatiivne artikkel ei müü agressiivselt — see viib teenuseni ekspertiisi kaudu."
      },
      {
        type: "p",
        text: "Eesti ja vene keeles on sageli vähem kvaliteetset sisu kui inglise keeles — sügav teema võimaldab niši hõivata."
      },
      {
        type: "ul",
        items: [
          "Märksõnade klastrid",
          "SERP-i formaadi analüüs",
          "Kohalik unikaalne nurk"
        ]
      },
      {
        type: "h2",
        text: "Struktuur, mida Google hindab"
      },
      {
        type: "p",
        text: "Üks H1, loogilised H2, lühikesed lõigud ja loendid. Pikematel materjalidel lisa sisukord, võrdlustabelid ja KKK schema'ga."
      },
      {
        type: "ol",
        items: [
          "Juhtlõik vastab päringule",
          "2–4 H2 praktiliste sammudega",
          "Visuaalid alt-tekstiga",
          "CTA teenuse või konsultatsioonini"
        ]
      },
      {
        type: "h2",
        text: "E-E-A-T ja usaldus"
      },
      {
        type: "p",
        text: "Näita autorit kogemusega, viita allikatele, uuenda kuupäevi. YMYL teemadel on eksperdikontroll kohustuslik."
      },
      {
        type: "p",
        text: "Eesti juhtumid, päris numbrid ja Search Console'i ekraanipildid tugevdavad ekspertiisi."
      },
      {
        type: "h2",
        text: "Siselingid ja uuendused"
      },
      {
        type: "p",
        text: "Iga artikkel lingib 2–3 asjakohasele müügilehele ja teistele klastri artiklile. Uuenda statistikat 6–12 kuu tagant."
      },
      {
        type: "ul",
        items: [
          "Loomulikud ankrud",
          "Teemahub'id",
          "Aegunud sisu korrastamine",
          "Positsioonide ja CTR jälgimine"
        ]
      },
      {
        type: "links",
        title: "Kasulikud lingid",
        items: [
          {
            label: "SEO teenused",
            href: "/et/services"
          },
          {
            label: "Hinnakiri",
            href: "/et/pricing"
          },
          {
            label: "Kontakt",
            href: "/et/contact"
          }
        ]
      },
      {
        type: "cta",
        title: "Vajate abi SEO-ga?",
        description: "Tellige tasuta SEO audit — näitame teie veebilehe kasvupunkte Google'is.",
        buttonLabel: "Küsi SEO-auditit",
        href: "/et/contact"
      }
    ],
    faq: [
      {
        question: "Milline on optimaalne artikli pikkus?",
        answer: "Mõõdupuu on vastuse täielikkus. Kitsale teemale piisab 800–1200 sõnast, juhendile 2000+. Oluline on konkurentidest parem vastus."
      },
      {
        question: "Kas AI sobib SEO tekstideks?",
        answer: "AI kiirendab mustandit, kuid lõplik tekst vajab ekspertiisi ja fakte. Šabloon-AI sisu püsib harva tipus."
      },
      {
        question: "Mitu artiklit kuus avaldada?",
        answer: "Väikeettevõttele on 2–4 kvaliteetset parem kui 20 nõrka. Prioriteet on müügipotentsiaaliga lehtedel."
      }
    ]
  },
  {
    locale: "en",
    translationKey: "seo-articles",
    slug: "seo-articles-for-website",
    title: "SEO Articles for a Website: How to Write Content That Brings Customers",
    metaTitle: "SEO Articles: Write Content That Ranks",
    metaDescription: "SEO copywriting guide: topic selection, H2-H3 structure, internal links, and content that generates leads from Google search.",
    date: "2025-04-26",
    author: "RankBoost Team",
    category: "Content SEO",
    excerpt: "How to write SEO articles that rank and convert: intent, structure, E-E-A-T, and practical examples for service businesses in Estonia.",
    tags: [
      "SEO articles",
      "content marketing",
      "copywriting"
    ],
    content: [
      {
        type: "h2",
        text: "Start with search intent"
      },
      {
        type: "p",
        text: "Define what the user wants: comparison, how-to, pricing, reviews. Informational articles build trust before the sale — they lead to services through expertise."
      },
      {
        type: "p",
        text: "Estonian and Russian segments often have less quality content than English — depth wins niches faster."
      },
      {
        type: "ul",
        items: [
          "Keyword clustering by topic",
          "SERP format analysis",
          "Local angle for your market"
        ]
      },
      {
        type: "h2",
        text: "Structure Google rewards"
      },
      {
        type: "p",
        text: "One H1, logical H2 sections, short paragraphs, and lists. Add a table of contents on long pieces, comparison tables, and FAQ schema."
      },
      {
        type: "ol",
        items: [
          "Lead paragraph answers the query",
          "2–4 H2 blocks with steps",
          "Images with descriptive alt text",
          "CTA to service or consultation"
        ]
      },
      {
        type: "h2",
        text: "E-E-A-T and trust signals"
      },
      {
        type: "p",
        text: "Show author expertise, cite sources, refresh dates. YMYL topics need professional review."
      },
      {
        type: "p",
        text: "Estonian case studies, real metrics, and Search Console screenshots beat generic advice."
      },
      {
        type: "h2",
        text: "Internal links and refreshes"
      },
      {
        type: "p",
        text: "Link each article to 2–3 commercial pages and cluster mates. Update stats and examples every 6–12 months."
      },
      {
        type: "ul",
        items: [
          "Natural anchor text",
          "Topic hub pages",
          "Prune outdated content",
          "Track rankings and CTR"
        ]
      },
      {
        type: "links",
        title: "Helpful links",
        items: [
          {
            label: "SEO Services",
            href: "/en/services"
          },
          {
            label: "Pricing",
            href: "/en/pricing"
          },
          {
            label: "Contact",
            href: "/en/contact"
          }
        ]
      },
      {
        type: "cta",
        title: "Need SEO help?",
        description: "Order a free SEO audit — we'll show your website's growth opportunities on Google.",
        buttonLabel: "Get an SEO Audit",
        href: "/en/contact"
      }
    ],
    faq: [
      {
        question: "What is the ideal article length?",
        answer: "Completeness beats word count. Narrow topics may need 800–1200 words; guides often need 2000+. Beat competitors on intent coverage."
      },
      {
        question: "Can I use AI for SEO content?",
        answer: "AI speeds drafts, but final copy needs expertise, facts, and editing. Generic AI content rarely holds top positions."
      },
      {
        question: "How many articles per month?",
        answer: "For small business, 2–4 strong pieces beat 20 thin posts. Prioritize topics with commercial upside."
      }
    ]
  },
  {
    locale: "ru",
    translationKey: "on-page-seo",
    slug: "vnutrennyaya-optimizaciya-sayta",
    title: "Внутренняя оптимизация сайта: что влияет на позиции в Google",
    metaTitle: "On-page SEO: внутренняя оптимизация сайта",
    metaDescription: "Чек-лист on-page SEO: title и description, H1-H3, изображения, schema и перелинковка для роста позиций в Google.",
    date: "2025-04-30",
    author: "RankBoost Team",
    category: "Technical SEO",
    excerpt: "Внутренняя оптимизация сайта: title, meta, заголовки, контент и технические элементы, которые напрямую влияют на позиции в Google.",
    tags: [
      "on-page SEO",
      "внутренняя оптимизация",
      "Google"
    ],
    content: [
      {
        type: "h2",
        text: "Title, meta и заголовки"
      },
      {
        type: "p",
        text: "Title — главный сигнал релевантности: ключевой запрос в начале, бренд в конце, до ~60 символов. Meta description не ранжирует напрямую, но влияет на CTR."
      },
      {
        type: "p",
        text: "Один H1 на страницу, H2 раскрывают подтемы. Не дублируйте title и H1 дословно — варьируйте формулировки естественно."
      },
      {
        type: "ul",
        items: [
          "Уникальные title на каждой странице",
          "Meta description с оффером",
          "Иерархия H1 → H2 → H3"
        ]
      },
      {
        type: "h2",
        text: "Контент и ключевые слова"
      },
      {
        type: "p",
        text: "Включайте основной запрос в первые 100 слов, LSI-термины и синонимы — без переспама. Контент должен отвечать на вопросы из «People also ask»."
      },
      {
        type: "ol",
        items: [
          "Покрытие подтем из SERP",
          "FAQ-блок на странице",
          "Уникальность vs конкуренты",
          "Обновление устаревших блоков"
        ]
      },
      {
        type: "h2",
        text: "Изображения и мультимедиа"
      },
      {
        type: "p",
        text: "Сжимайте файлы, используйте WebP, прописывайте описательный alt. Видео повышает вовлечённость, но не должно блокировать загрузку."
      },
      {
        type: "p",
        text: "Для локального бизнеса добавьте фото офиса, команды и работ — это усиливает доверие и уникальность страницы."
      },
      {
        type: "h2",
        text: "Schema и внутренние ссылки"
      },
      {
        type: "p",
        text: "Разметка Service, FAQ, BreadcrumbList помогает сниппетам. Внутренние ссылки распределяют вес на важные коммерческие URL и ускоряют индексацию новых страниц."
      },
      {
        type: "ul",
        items: [
          "Canonical на дублях",
          "Хлебные крошки",
          "Контекстные анкоры",
          "Проверка битых ссылок"
        ]
      },
      {
        type: "links",
        title: "Полезные материалы",
        items: [
          {
            label: "SEO-услуги",
            href: "/ru/services"
          },
          {
            label: "Тарифы",
            href: "/ru/pricing"
          },
          {
            label: "Контакты",
            href: "/ru/contact"
          }
        ]
      },
      {
        type: "cta",
        title: "Нужна помощь с SEO?",
        description: "Закажите бесплатный SEO-аудит — мы покажем точки роста вашего сайта в Google.",
        buttonLabel: "Получить SEO-аудит",
        href: "/ru/contact"
      }
    ],
    faq: [
      {
        question: "Сколько раз повторять ключ на странице?",
        answer: "Ориентируйтесь на естественность. Если текст читается нормально и покрывает тему — плотность обычно в норме. Переспам вредит и UX, и ранжированию."
      },
      {
        question: "Нужен ли отдельный title для мобильных?",
        answer: "Нет, Google использует один title. Важнее мобильная скорость и читаемость контента на маленьком экране."
      },
      {
        question: "Что проверить в первую очередь на сайте в Эстонии?",
        answer: "Уникальные title/description на et, ru, en версиях, корректный hreflang и отсутствие дублей между языковыми копиями."
      }
    ]
  },
  {
    locale: "et",
    translationKey: "on-page-seo",
    slug: "kodulehe-sisemine-optimeerimine",
    title: "Kodulehe sisemine optimeerimine: mis mõjutab Google'i positsioone",
    metaTitle: "On-page SEO: sisemine optimeerimine",
    metaDescription: "On-page SEO kontrollnimekiri: title ja description, H1-H3, pildid, schema ja siselingid positsioonide kasvuks.",
    date: "2025-05-05",
    author: "RankBoost Team",
    category: "Technical SEO",
    excerpt: "Sisemine SEO: title, meta, pealkirjad, sisu ja tehnilised elemendid, mis mõjutavad otseselt Google'i positsioone.",
    tags: [
      "on-page SEO",
      "sisemine optimeerimine",
      "Google"
    ],
    content: [
      {
        type: "h2",
        text: "Title, meta ja pealkirjad"
      },
      {
        type: "p",
        text: "Title on peamine relevantsisignaal: märksõna alguses, bränd lõpus, kuni ~60 tähemärki. Meta description mõjutab CTR-i."
      },
      {
        type: "p",
        text: "Üks H1 lehe kohta, H2 avavad alateemasid. Ära kopeeri title ja H1 sõna-sõnalt."
      },
      {
        type: "ul",
        items: [
          "Unikaalne title igal lehel",
          "Meta kirjeldus pakkumisega",
          "H1 → H2 → H3 hierarhia"
        ]
      },
      {
        type: "h2",
        text: "Sisu ja märksõnad"
      },
      {
        type: "p",
        text: "Lisa põhipäring esimestesse 100 sõnasse, LSI terminid ilma üleoptimeerimata. Sisu peab vastama 'People also ask' küsimustele."
      },
      {
        type: "ol",
        items: [
          "SERP alateemade katmine",
          "KKK plokk lehel",
          "Unikaalsus konkurentide suhtes",
          "Aegunud plokkide uuendus"
        ]
      },
      {
        type: "h2",
        text: "Pildid ja meedia"
      },
      {
        type: "p",
        text: "Tihenda faile, kasuta WebP, kirjuta kirjeldav alt. Video tõstab kaasatust, kuid ei tohi aeglustada laadimist."
      },
      {
        type: "p",
        text: "Kohalikule ettevõttele lisa kontori ja tööde fotod — see tõstab usaldust."
      },
      {
        type: "h2",
        text: "Schema ja siselingid"
      },
      {
        type: "p",
        text: "Service, FAQ ja BreadcrumbList markup aitab snippet'e. Siselingid jaotavad autoriteeti müügilehtedele."
      },
      {
        type: "ul",
        items: [
          "Canonical duplikaatidel",
          "Breadcrumb navigatsioon",
          "Kontekstilised ankrud",
          "Katkiste linkide kontroll"
        ]
      },
      {
        type: "links",
        title: "Kasulikud lingid",
        items: [
          {
            label: "SEO teenused",
            href: "/et/services"
          },
          {
            label: "Hinnakiri",
            href: "/et/pricing"
          },
          {
            label: "Kontakt",
            href: "/et/contact"
          }
        ]
      },
      {
        type: "cta",
        title: "Vajate abi SEO-ga?",
        description: "Tellige tasuta SEO audit — näitame teie veebilehe kasvupunkte Google'is.",
        buttonLabel: "Küsi SEO-auditit",
        href: "/et/contact"
      }
    ],
    faq: [
      {
        question: "Mitu korda märksõna lehel kasutada?",
        answer: "Keskendu loomulikkusele. Kui tekst loeb hästi ja katab teema, on tihedus tavaliselt korras."
      },
      {
        question: "Kas mobiil vajab eraldi title'i?",
        answer: "Ei. Olulisem on mobiilne kiirus ja loetavus."
      },
      {
        question: "Mida Eestis esimesena kontrollida?",
        answer: "Unikaalsed title/description et, ru, en keeltel, korrektne hreflang ja keeleversioonide duplikaadid."
      }
    ]
  },
  {
    locale: "en",
    translationKey: "on-page-seo",
    slug: "on-page-seo-optimization",
    title: "On-Page SEO Optimization: What Affects Google Rankings",
    metaTitle: "On-Page SEO: Optimize Every Page",
    metaDescription: "On-page SEO checklist: titles, meta descriptions, H1-H3, images, schema, and internal linking to improve Google rankings.",
    date: "2025-05-09",
    author: "RankBoost Team",
    category: "Technical SEO",
    excerpt: "On-page SEO essentials: titles, meta tags, headings, content, and technical elements that directly affect Google rankings.",
    tags: [
      "on-page SEO",
      "page optimization",
      "Google"
    ],
    content: [
      {
        type: "h2",
        text: "Titles, meta, and headings"
      },
      {
        type: "p",
        text: "The title tag is your top relevance signal: lead with the keyword, add the brand, stay near 60 characters. Meta descriptions drive CTR even though they are not a direct ranking factor."
      },
      {
        type: "p",
        text: "One H1 per page; H2s expand subtopics. Do not copy title and H1 verbatim — vary phrasing naturally."
      },
      {
        type: "ul",
        items: [
          "Unique titles on every URL",
          "Meta description with an offer",
          "H1 → H2 → H3 hierarchy"
        ]
      },
      {
        type: "h2",
        text: "Content and keywords"
      },
      {
        type: "p",
        text: "Place the primary query in the first 100 words, add LSI terms without stuffing. Cover questions from People Also Ask."
      },
      {
        type: "ol",
        items: [
          "Match SERP subtopics",
          "On-page FAQ block",
          "Uniqueness vs competitors",
          "Refresh outdated sections"
        ]
      },
      {
        type: "h2",
        text: "Images and media"
      },
      {
        type: "p",
        text: "Compress files, use WebP, write descriptive alt text. Video helps engagement but must not block load time."
      },
      {
        type: "p",
        text: "Local businesses should add office, team, and project photos for trust and uniqueness."
      },
      {
        type: "h2",
        text: "Schema and internal links"
      },
      {
        type: "p",
        text: "Service, FAQ, and Breadcrumb schema can enhance snippets. Internal links pass authority to money pages and speed indexing."
      },
      {
        type: "ul",
        items: [
          "Canonicals on duplicates",
          "Breadcrumb navigation",
          "Contextual anchors",
          "Broken link checks"
        ]
      },
      {
        type: "links",
        title: "Helpful links",
        items: [
          {
            label: "SEO Services",
            href: "/en/services"
          },
          {
            label: "Pricing",
            href: "/en/pricing"
          },
          {
            label: "Contact",
            href: "/en/contact"
          }
        ]
      },
      {
        type: "cta",
        title: "Need SEO help?",
        description: "Order a free SEO audit — we'll show your website's growth opportunities on Google.",
        buttonLabel: "Get an SEO Audit",
        href: "/en/contact"
      }
    ],
    faq: [
      {
        question: "How often should I repeat a keyword?",
        answer: "Write naturally. If the copy reads well and covers the topic, density is usually fine. Stuffing hurts UX and rankings."
      },
      {
        question: "Do I need a separate mobile title?",
        answer: "No. Mobile speed and readable layout matter more."
      },
      {
        question: "What to check first on an Estonian site?",
        answer: "Unique titles and descriptions per et, ru, en, correct hreflang, and no duplicate content across languages."
      }
    ]
  },
  {
    locale: "ru",
    translationKey: "seo-mistakes",
    slug: "seo-oshibki-na-sayte",
    title: "Главные SEO-ошибки, из-за которых сайт не растет",
    metaTitle: "Ошибки SEO: что мешает росту в Google",
    metaDescription: "Разбор частых SEO-ошибок бизнеса: технические проблемы, контент, ссылки и стратегия — и как исправить их без лишних затрат.",
    date: "2025-05-14",
    author: "RankBoost Team",
    category: "General SEO",
    excerpt: "Типичные SEO-ошибки, которые тормозят рост: дубли, тонкий контент, игнор мобильной версии и неправильные ожидания по срокам.",
    tags: [
      "ошибки SEO",
      "аудит",
      "Google"
    ],
    content: [
      {
        type: "h2",
        text: "Технические ловушки"
      },
      {
        type: "p",
        text: "Случайный noindex на продакшене, цепочки редиректов, дубли www/https и параметры в URL — классика просадки. Часто проблема появляется после обновления CMS или плагина."
      },
      {
        type: "p",
        text: "Медленный сайт на мобильных особенно болезненен для локального трафика в Эстонии, где доля смартфонов высока."
      },
      {
        type: "ul",
        items: [
          "Блокировка в robots.txt",
          "Дубли категорий e-commerce",
          "Отсутствие canonical",
          "404 на важных URL"
        ]
      },
      {
        type: "h2",
        text: "Контентные ошибки"
      },
      {
        type: "p",
        text: "Копирование текстов поставщика, тонкие страницы «услуга + город» без уникальности, keyword stuffing — всё это сигналы низкого качества."
      },
      {
        type: "ol",
        items: [
          "Один URL — одна тема",
          "Глубина вместо ширины на старте",
          "Обновление дат и фактов",
          "Удаление или слияние слабых страниц"
        ]
      },
      {
        type: "h2",
        text: "Стратегические промахи"
      },
      {
        type: "p",
        text: "Ожидание результата за 2 недели, фокус только на бренде, игнор локального SEO и отсутствие целей в аналитике — стратегические ошибки дороже технических."
      },
      {
        type: "p",
        text: "Покупка ссылок с бирж без контекста часто заканчивается санкциями или нулевым эффектом."
      },
      {
        type: "h2",
        text: "Как исправлять системно"
      },
      {
        type: "p",
        text: "Начните с аудита приоритетов: что блокирует индексацию, что уже приносит трафик, что можно улучшить быстро. План на 90 дней с метриками лучше хаотичных правок."
      },
      {
        type: "ul",
        items: [
          "Search Console как источник правды",
          "Квартальный техосмотр",
          "Редакционный календарь",
          "Связка SEO с продажами"
        ]
      },
      {
        type: "links",
        title: "Полезные материалы",
        items: [
          {
            label: "SEO-услуги",
            href: "/ru/services"
          },
          {
            label: "Тарифы",
            href: "/ru/pricing"
          },
          {
            label: "Контакты",
            href: "/ru/contact"
          }
        ]
      },
      {
        type: "cta",
        title: "Нужна помощь с SEO?",
        description: "Закажите бесплатный SEO-аудит — мы покажем точки роста вашего сайта в Google.",
        buttonLabel: "Получить SEO-аудит",
        href: "/ru/contact"
      }
    ],
    faq: [
      {
        question: "Может ли один noindex убить весь сайт?",
        answer: "Глобальный noindex в шаблоне или robots — да. Точечный на тестовых страницах — нет, но проверьте, не попали ли важные URL в исключения."
      },
      {
        question: "Стоит ли удалять старые статьи?",
        answer: "Если нет трафика и тема устарела — объедините с актуальной страницей через 301 или обновите. Массовое удаление без редиректов создаёт 404."
      },
      {
        question: "Почему SEO «не работает» после 3 месяцев?",
        answer: "Часто не закрыта техническая база, нет страниц под коммерческие запросы или ожидали мгновенный эффект в высококонкурентной нише."
      }
    ]
  },
  {
    locale: "et",
    translationKey: "seo-mistakes",
    slug: "seo-vead-kodulehel",
    title: "Peamised SEO vead, mis takistavad veebilehe kasvu",
    metaTitle: "SEO vead: mis takistab Google'i kasvu",
    metaDescription: "Sagedaste SEO vigade ülevaade: tehnika, sisu, lingid ja strateegia — ning kuidas neid mõistlikult parandada.",
    date: "2025-05-18",
    author: "RankBoost Team",
    category: "General SEO",
    excerpt: "Levinud SEO vead, mis pidurdavad kasvu: duplikaadid, õhuke sisu, mobiili ignoreerimine ja valed ootused ajakava osas.",
    tags: [
      "SEO vead",
      "audit",
      "Google"
    ],
    content: [
      {
        type: "h2",
        text: "Tehnilised lõksud"
      },
      {
        type: "p",
        text: "Juhuslik noindex, redirect'ahelad, www/https duplikaadid ja URL parameetrid on klassikalised põhjused. Probleem tekib sageli pärast CMS uuendust."
      },
      {
        type: "p",
        text: "Aeglane mobiilisait kahjustab Eestis kohalikku liiklust, kus nutitelefonide osakaal on suur."
      },
      {
        type: "ul",
        items: [
          "Robots.txt blokeering",
          "E-poe kategooria duplikaadid",
          "Puuduv canonical",
          "404 olulistel URL-idel"
        ]
      },
      {
        type: "h2",
        text: "Sisulised vead"
      },
      {
        type: "p",
        text: "Tarnija tekstide kopeerimine, õhukesed 'teenus + linn' lehed ja märksõnade üleküllus on madala kvaliteedi signaalid."
      },
      {
        type: "ol",
        items: [
          "Üks URL — üks teema",
          "Sügavus enne laiust",
          "Kuupäevade uuendamine",
          "Nõrkade lehtede ühendamine"
        ]
      },
      {
        type: "h2",
        text: "Strateegilised eksimused"
      },
      {
        type: "p",
        text: "Ootus tulemuseks 2 nädalaga, ainult brändile keskendumine ja analüütika eesmärkide puudumine on kallimad kui tehnilised vead."
      },
      {
        type: "p",
        text: "Kontekstita linkide ostmine lõpeb sageli sanktsiooni või nulliefektiga."
      },
      {
        type: "h2",
        text: "Kuidas süsteemselt parandada"
      },
      {
        type: "p",
        text: "Alusta prioriteetide auditist: mis blokeerib indekseerimist, mis juba toob liiklust. 90 päeva plaan mõõdikutega on parem kui juhuslikud parandused."
      },
      {
        type: "ul",
        items: [
          "Search Console tõe allikana",
          "Kvartaalne tehniline ülevaatus",
          "Toimetuskalender",
          "SEO ja müügi seos"
        ]
      },
      {
        type: "links",
        title: "Kasulikud lingid",
        items: [
          {
            label: "SEO teenused",
            href: "/et/services"
          },
          {
            label: "Hinnakiri",
            href: "/et/pricing"
          },
          {
            label: "Kontakt",
            href: "/et/contact"
          }
        ]
      },
      {
        type: "cta",
        title: "Vajate abi SEO-ga?",
        description: "Tellige tasuta SEO audit — näitame teie veebilehe kasvupunkte Google'is.",
        buttonLabel: "Küsi SEO-auditit",
        href: "/et/contact"
      }
    ],
    faq: [
      {
        question: "Kas üks noindex võib kogu saidi mõjutada?",
        answer: "Globaalne noindex või robots reegel — jah. Punktne testileht — ei, kuid kontrolli olulisi URL-e."
      },
      {
        question: "Kas vanad artiklid kustutada?",
        answer: "Kui liiklust pole ja teema aegunud — ühenda 301-ga või uuenda. Masskustutamine ilma suunamiseta tekitab 404."
      },
      {
        question: "Miks SEO 'ei tööta' 3 kuu järel?",
        answer: "Sageli on tehniline baas puudulik, kommertspäringute lehti pole või oodati kohest tulemust tihedas nišis."
      }
    ]
  },
  {
    locale: "en",
    translationKey: "seo-mistakes",
    slug: "common-seo-mistakes",
    title: "Common SEO Mistakes That Stop a Website from Growing",
    metaTitle: "SEO Mistakes That Block Google Growth",
    metaDescription: "Frequent SEO mistakes in business sites: technical issues, content, links, and strategy — and practical fixes without wasted spend.",
    date: "2025-05-22",
    author: "RankBoost Team",
    category: "General SEO",
    excerpt: "Common SEO mistakes that stall growth: duplicates, thin content, neglected mobile UX, and unrealistic timelines — plus how to fix them.",
    tags: [
      "SEO mistakes",
      "site audit",
      "Google"
    ],
    content: [
      {
        type: "h2",
        text: "Technical traps"
      },
      {
        type: "p",
        text: "Accidental noindex on production, redirect chains, www/https duplicates, and messy URL parameters are classic setbacks — often after a CMS or plugin update."
      },
      {
        type: "p",
        text: "Slow mobile pages hurt especially in Estonia where smartphone traffic dominates local search."
      },
      {
        type: "ul",
        items: [
          "Robots.txt blocks",
          "E-commerce category duplicates",
          "Missing canonicals",
          "404s on key URLs"
        ]
      },
      {
        type: "h2",
        text: "Content mistakes"
      },
      {
        type: "p",
        text: "Supplier copy, thin city pages without unique value, and keyword stuffing signal low quality to Google."
      },
      {
        type: "ol",
        items: [
          "One URL, one topic",
          "Depth before breadth at launch",
          "Refresh dates and facts",
          "Merge or prune weak pages"
        ]
      },
      {
        type: "h2",
        text: "Strategic missteps"
      },
      {
        type: "p",
        text: "Expecting results in two weeks, focusing only on brand terms, ignoring local SEO, and skipping conversion goals cost more than technical bugs."
      },
      {
        type: "p",
        text: "Buying irrelevant link packages often ends in penalties or zero gain."
      },
      {
        type: "h2",
        text: "Fixing issues systematically"
      },
      {
        type: "p",
        text: "Start with a priority audit: what blocks indexing, what already drives traffic, what is a quick win. A 90-day plan with metrics beats random tweaks."
      },
      {
        type: "ul",
        items: [
          "Search Console as source of truth",
          "Quarterly technical review",
          "Editorial calendar",
          "Tie SEO to sales KPIs"
        ]
      },
      {
        type: "links",
        title: "Helpful links",
        items: [
          {
            label: "SEO Services",
            href: "/en/services"
          },
          {
            label: "Pricing",
            href: "/en/pricing"
          },
          {
            label: "Contact",
            href: "/en/contact"
          }
        ]
      },
      {
        type: "cta",
        title: "Need SEO help?",
        description: "Order a free SEO audit — we'll show your website's growth opportunities on Google.",
        buttonLabel: "Get an SEO Audit",
        href: "/en/contact"
      }
    ],
    faq: [
      {
        question: "Can one noindex break the whole site?",
        answer: "A global noindex in template or robots — yes. A test page noindex — no, but verify important URLs are not excluded."
      },
      {
        question: "Should I delete old blog posts?",
        answer: "If they have no traffic and the topic is obsolete, merge via 301 or refresh. Mass deletion without redirects creates 404 debt."
      },
      {
        question: "Why does SEO 'not work' after 3 months?",
        answer: "Often the technical base is unfinished, commercial queries lack landing pages, or expectations were instant in a competitive niche."
      }
    ]
  },
  {
    locale: "ru",
    translationKey: "multilingual-seo",
    slug: "multiyazychnoe-seo",
    title: "Мультиязычное SEO: как продвигать сайт на нескольких языках",
    metaTitle: "Мультиязычное SEO: et, ru, en на одном сайте",
    metaDescription: "Гайд по multilingual SEO: hreflang, структура домена, локализация контента и техническая настройка для Эстонии и Европы.",
    date: "2025-05-27",
    author: "RankBoost Team",
    category: "SEO Strategy",
    excerpt: "Мультиязычное SEO для сайтов в Эстонии: hreflang, структура URL, перевод vs локализация и как не создать дубли между et, ru и en.",
    tags: [
      "мультиязычное SEO",
      "hreflang",
      "локализация"
    ],
    content: [
      {
        type: "h2",
        text: "Зачем отдельная стратегия на каждый язык"
      },
      {
        type: "p",
        text: "Эстонский, русский и английский запросы не совпадают один в один. Машинный перевод без адаптации семантики даёт страницы, которые не ранжируются и не конвертируют."
      },
      {
        type: "p",
        text: "Правильный подход — исследование ключевых слов отдельно по каждой локали, затем локализация структуры и офферов."
      },
      {
        type: "ul",
        items: [
          "Разная частотность запросов",
          "Культурные формулировки CTA",
          "Локальные конкуренты в SERP"
        ]
      },
      {
        type: "h2",
        text: "Структура URL и hreflang"
      },
      {
        type: "p",
        text: "Поддомены, подпапки (/et/, /ru/) или ccTLD — выбор зависит от бренда и ресурсов. Для большинства эстонских компаний подпапки на .ee удобны и понятны."
      },
      {
        type: "ol",
        items: [
          "Парные hreflang на всех версиях",
          "x-default для международной аудитории",
          "Каноникал внутри языка",
          "Единый sitemap или по языкам"
        ]
      },
      {
        type: "h2",
        text: "Локализация контента"
      },
      {
        type: "p",
        text: "Переводите не слова, а смысл: цены в евро, примеры из Таллина, отзывы на языке аудитории. Мета-теги и alt изображений тоже локализируйте."
      },
      {
        type: "p",
        text: "Избегайте автоперевода всего каталога — начните с топ-страниц по доходу и расширяйте."
      },
      {
        type: "h2",
        text: "Типичные ошибки multilingual SEO"
      },
      {
        type: "p",
        text: "Смешение языков на одной странице, hreflang на несуществующие URL, дубли title между версиями — частые причины потери видимости в Google."
      },
      {
        type: "ul",
        items: [
          "Проверка в Search Console International",
          "Языковой переключатель с правильными URL",
          "Отдельная аналитика по локали",
          "Локальные обратные ссылки"
        ]
      },
      {
        type: "links",
        title: "Полезные материалы",
        items: [
          {
            label: "SEO-услуги",
            href: "/ru/services"
          },
          {
            label: "Тарифы",
            href: "/ru/pricing"
          },
          {
            label: "Контакты",
            href: "/ru/contact"
          }
        ]
      },
      {
        type: "cta",
        title: "Нужна помощь с SEO?",
        description: "Закажите бесплатный SEO-аудит — мы покажем точки роста вашего сайта в Google.",
        buttonLabel: "Получить SEO-аудит",
        href: "/ru/contact"
      }
    ],
    faq: [
      {
        question: "Нужен ли отдельный домен .ee и .com?",
        answer: "Не обязательно. Подпапки на одном домене работают при корректном hreflang. Отдельные домены оправданы при сильном бренде в разных странах."
      },
      {
        question: "Можно ли дублировать английский контент для Эстонии?",
        answer: "Если аудитория ищет по-английски в .ee — да, но контент должен быть уникален относительно глобального .com, иначе каннибализация."
      },
      {
        question: "Как проверить hreflang?",
        answer: "Используйте Search Console, краулер и валидаторы. Каждая языковая пара должна ссылаться друг на друга реципрокно."
      }
    ]
  },
  {
    locale: "et",
    translationKey: "multilingual-seo",
    slug: "mitmekeelne-seo",
    title: "Mitmekeelne SEO: kuidas optimeerida veebilehte mitmes keeles",
    metaTitle: "Mitmekeelne SEO: et, ru, en ühel saidil",
    metaDescription: "Juhend mitmekeelsele SEO-le: hreflang, domeeni struktuur, sisu lokaliseerimine ja tehniline seadistus Eestis.",
    date: "2025-05-31",
    author: "RankBoost Team",
    category: "SEO Strategy",
    excerpt: "Mitmekeelne SEO Eesti veebilehtedele: hreflang, URL struktuur, tõlge vs lokaliseerimine ja kuidas vältida duplikaate et, ru ja en vahel.",
    tags: [
      "mitmekeelne SEO",
      "hreflang",
      "lokaliseerimine"
    ],
    content: [
      {
        type: "h2",
        text: "Miks iga keel vajab oma strateegiat"
      },
      {
        type: "p",
        text: "Eesti, vene ja inglise päringud ei kattu. Masintõlge ilma semantikata ei too positsioone ega konversioone."
      },
      {
        type: "p",
        text: "Õige lähenemine: märksõnauuring iga keele jaoks, seejärel struktuuri ja pakkumiste lokaliseerimine."
      },
      {
        type: "ul",
        items: [
          "Erinev päringusagedus",
          "Kultuurilised CTA formulatsioonid",
          "Kohalikud konkurendid SERP-is"
        ]
      },
      {
        type: "h2",
        text: "URL struktuur ja hreflang"
      },
      {
        type: "p",
        text: "Alamdomeenid, alamkaustad (/et/, /ru/) või ccTLD — valik sõltub brändist. Enamikule Eesti ettevõtetele sobivad alamkaustad .ee domeenil."
      },
      {
        type: "ol",
        items: [
          "Paariline hreflang kõigil versioonidel",
          "x-default rahvusvahelisele auditooriumile",
          "Canonical keele sees",
          "Ühtne või keelepõhine sitemap"
        ]
      },
      {
        type: "h2",
        text: "Sisu lokaliseerimine"
      },
      {
        type: "p",
        text: "Tõlgi tähendust, mitte sõnu: hinnad eurodes, Tallinnast näited, arvustused õiges keeles. Meta ja piltide alt samuti."
      },
      {
        type: "p",
        text: "Väldi kogu kataloogi automaattõlget — alusta TOP tulu lehtedest."
      },
      {
        type: "h2",
        text: "Levinud multilingual vead"
      },
      {
        type: "p",
        text: "Keelte segamine ühel lehel, hreflang olematutele URL-idele ja identsed title'id — sagedased nähtavuse kaotuse põhjused."
      },
      {
        type: "ul",
        items: [
          "Search Console International",
          "Keelelüliti õigete URL-idega",
          "Analüütika keele kaupa",
          "Kohalikud tagasilingid"
        ]
      },
      {
        type: "links",
        title: "Kasulikud lingid",
        items: [
          {
            label: "SEO teenused",
            href: "/et/services"
          },
          {
            label: "Hinnakiri",
            href: "/et/pricing"
          },
          {
            label: "Kontakt",
            href: "/et/contact"
          }
        ]
      },
      {
        type: "cta",
        title: "Vajate abi SEO-ga?",
        description: "Tellige tasuta SEO audit — näitame teie veebilehe kasvupunkte Google'is.",
        buttonLabel: "Küsi SEO-auditit",
        href: "/et/contact"
      }
    ],
    faq: [
      {
        question: "Kas vajan eraldi .ee ja .com domeeni?",
        answer: "Ei pea. Alamkaustad töötavad korrektse hreflangiga. Eraldi domeenid on mõistlikud tugeva riigipõhise brändi puhul."
      },
      {
        question: "Kas inglise sisu võib Eestis dubleerida?",
        answer: "Kui auditoorium otsib inglise keeles .ee-s — jah, kuid sisu peab erinema globaalsest .com versioonist."
      },
      {
        question: "Kuidas hreflang'i kontrollida?",
        answer: "Kasuta Search Console'i, crawler'it ja valideerijaid. Iga keelepaar peab teineteist vastastikku viitama."
      }
    ]
  },
  {
    locale: "en",
    translationKey: "multilingual-seo",
    slug: "multilingual-seo",
    title: "Multilingual SEO: How to Grow a Website in Multiple Languages",
    metaTitle: "Multilingual SEO: et, ru, en on One Site",
    metaDescription: "Multilingual SEO guide: hreflang, domain structure, content localization, and technical setup for Estonia and European markets.",
    date: "2025-06-04",
    author: "RankBoost Team",
    category: "SEO Strategy",
    excerpt: "Multilingual SEO for Estonian websites: hreflang, URL structure, translation vs localization, and avoiding duplicates across et, ru, and en.",
    tags: [
      "multilingual SEO",
      "hreflang",
      "localization"
    ],
    content: [
      {
        type: "h2",
        text: "Why each language needs its own strategy"
      },
      {
        type: "p",
        text: "Estonian, Russian, and English queries do not mirror each other. Machine translation without keyword adaptation produces pages that neither rank nor convert."
      },
      {
        type: "p",
        text: "Research keywords per locale first, then localize structure, offers, and proof points."
      },
      {
        type: "ul",
        items: [
          "Different query volumes",
          "Cultural CTA phrasing",
          "Local competitors in SERPs"
        ]
      },
      {
        type: "h2",
        text: "URL structure and hreflang"
      },
      {
        type: "p",
        text: "Subdomains, subfolders (/et/, /ru/), or ccTLDs — choice depends on brand and ops. Subfolders on .ee fit most Estonian companies."
      },
      {
        type: "ol",
        items: [
          "Reciprocal hreflang on all versions",
          "x-default for international users",
          "Canonicals within each language",
          "Unified or per-language sitemaps"
        ]
      },
      {
        type: "h2",
        text: "Content localization"
      },
      {
        type: "p",
        text: "Localize meaning: euro pricing, Tallinn examples, reviews in the target language. Meta tags and image alt text too."
      },
      {
        type: "p",
        text: "Avoid auto-translating entire catalogs — start with top revenue pages and expand."
      },
      {
        type: "h2",
        text: "Common multilingual SEO mistakes"
      },
      {
        type: "p",
        text: "Mixed languages on one page, hreflang to missing URLs, duplicate titles across versions — frequent visibility killers in Google."
      },
      {
        type: "ul",
        items: [
          "Search Console International report",
          "Language switcher with correct URLs",
          "Analytics segmented by locale",
          "Locale-relevant backlinks"
        ]
      },
      {
        type: "links",
        title: "Helpful links",
        items: [
          {
            label: "SEO Services",
            href: "/en/services"
          },
          {
            label: "Pricing",
            href: "/en/pricing"
          },
          {
            label: "Contact",
            href: "/en/contact"
          }
        ]
      },
      {
        type: "cta",
        title: "Need SEO help?",
        description: "Order a free SEO audit — we'll show your website's growth opportunities on Google.",
        buttonLabel: "Get an SEO Audit",
        href: "/en/contact"
      }
    ],
    faq: [
      {
        question: "Do I need separate .ee and .com domains?",
        answer: "Not necessarily. Subfolders work with proper hreflang. Separate domains suit strong country-specific brands."
      },
      {
        question: "Can I duplicate English content for Estonia?",
        answer: "If users search in English on .ee, yes — but it must differ from global .com to avoid cannibalization."
      },
      {
        question: "How do I validate hreflang?",
        answer: "Use Search Console, crawlers, and validators. Each language pair must reference the other reciprocally."
      }
    ]
  },
  {
    locale: "ru",
    translationKey: "seo-new-website",
    slug: "seo-dlya-novogo-sayta",
    title: "SEO для нового сайта: что сделать сразу после запуска",
    metaTitle: "SEO для нового сайта: чек-лист запуска",
    metaDescription: "Как продвигать новый сайт с нуля: архитектура, технический фундамент, контент на старте и первые шаги в Google Search Console.",
    date: "2025-06-09",
    author: "RankBoost Team",
    category: "General SEO",
    excerpt: "SEO при запуске нового сайта: что заложить до публикации, чтобы не переделывать структуру, URL и индексацию через полгода.",
    tags: [
      "новый сайт",
      "запуск SEO",
      "индексация"
    ],
    content: [
      {
        type: "h2",
        text: "Планирование до дизайна"
      },
      {
        type: "p",
        text: "Семантика и структура URL должны появиться до вёрстки. Смена ЧПУ после индексации — дорогие редиректы и потеря накопленных сигналов."
      },
      {
        type: "p",
        text: "Определите 5–15 приоритетных посадочных под коммерческие запросы и информационный кластер для блога."
      },
      {
        type: "ul",
        items: [
          "Карта страниц и меню",
          "ЧПУ на латинице или UTF-8",
          "Выбор CMS с SEO-гибкостью"
        ]
      },
      {
        type: "h2",
        text: "Технический минимум на запуске"
      },
      {
        type: "p",
        text: "HTTPS, robots.txt, XML-sitemap, canonical, мобильная адаптивность и быстрая загрузка — обязательный baseline. Подключите Search Console и аналитику до открытия трафика."
      },
      {
        type: "ol",
        items: [
          "Проверка индексации тестового домена",
          "Закрытие staging от роботов",
          "Schema Organization и WebSite",
          "Favicon и базовые meta"
        ]
      },
      {
        type: "h2",
        text: "Контент на старте"
      },
      {
        type: "p",
        text: "Лучше 10 сильных страниц, чем 50 пустых. Главная, услуги, о компании, контакты, политика конфиденциальности и 2–3 экспертные статьи создают доверие."
      },
      {
        type: "p",
        text: "Для эстонского рынка сразу заложите языковые версии, если аудитория многоязычная."
      },
      {
        type: "h2",
        text: "Первые 90 дней после запуска"
      },
      {
        type: "p",
        text: "Отправьте sitemap, исправьте ошибки покрытия, запросите индексацию ключевых URL. Начните локальное SEO и сбор первых ссылок через партнёров и каталоги."
      },
      {
        type: "ul",
        items: [
          "Мониторинг позиций по ядру",
          "Внутренняя перелинковка новых статей",
          "Google Business Profile в день открытия",
          "Избегание массового копипаста"
        ]
      },
      {
        type: "links",
        title: "Полезные материалы",
        items: [
          {
            label: "SEO-услуги",
            href: "/ru/services"
          },
          {
            label: "Тарифы",
            href: "/ru/pricing"
          },
          {
            label: "Контакты",
            href: "/ru/contact"
          }
        ]
      },
      {
        type: "cta",
        title: "Нужна помощь с SEO?",
        description: "Закажите бесплатный SEO-аудит — мы покажем точки роста вашего сайта в Google.",
        buttonLabel: "Получить SEO-аудит",
        href: "/ru/contact"
      }
    ],
    faq: [
      {
        question: "Когда ждать первый трафик с нового домена?",
        answer: "Индексация может занять дни–недели. Заметный органический трафик по неконкурентным запросам — обычно 1–3 месяца при качественном контенте."
      },
      {
        question: "Нужен ли noindex на staging?",
        answer: "Да, тестовая среда должна быть закрыта от индексации паролем или noindex, иначе дубли попадут в Google."
      },
      {
        question: "С чего начать продвижение в Эстонии?",
        answer: "Локальные запросы, GBP, эстоноязычные title и страницы услуг — быстрый путь к первым лидам на новом домене."
      }
    ]
  },
  {
    locale: "et",
    translationKey: "seo-new-website",
    slug: "seo-uuele-veebilehele",
    title: "SEO uuele veebilehele: mida teha kohe pärast avaldamist",
    metaTitle: "SEO uuele veebilehele: käivituse nimekiri",
    metaDescription: "Kuidas uut saiti nullist edendada: arhitektuur, tehniline baas, algne sisu ja esimesed sammud Search Console'is.",
    date: "2025-06-13",
    author: "RankBoost Team",
    category: "General SEO",
    excerpt: "SEO uue veebilehe käivitamisel: mida planeerida enne avaldamist, et mitte ümber teha struktuuri ja URL-e kuue kuu pärast.",
    tags: [
      "uus veebileht",
      "SEO käivitus",
      "indekseerimine"
    ],
    content: [
      {
        type: "h2",
        text: "Planeerimine enne disaini"
      },
      {
        type: "p",
        text: "Semantika ja URL struktuur peavad olema enne kujundust. Pärast indekseerimist URL-i muutmine on kallis."
      },
      {
        type: "p",
        text: "Määra 5–15 prioriteetset maandumislehte kommerts- ja infopäringute jaoks."
      },
      {
        type: "ul",
        items: [
          "Lehtede kaart ja menüü",
          "Puhtad URL-id",
          "SEO-sõbralik CMS"
        ]
      },
      {
        type: "h2",
        text: "Tehniline miinimum käivitamisel"
      },
      {
        type: "p",
        text: "HTTPS, robots.txt, sitemap, canonical, mobiil ja kiirus on kohustuslikud. Ühenda Search Console ja analüütika enne liikluse avamist."
      },
      {
        type: "ol",
        items: [
          "Testdomeeni indekseerimise kontroll",
          "Stagingu blokeerimine",
          "Organization schema",
          "Favicon ja põhi-meta"
        ]
      },
      {
        type: "h2",
        text: "Algne sisu"
      },
      {
        type: "p",
        text: "10 tugevat lehte on parem kui 50 tühja. Avaleht, teenused, kontakt, privaatsus ja 2–3 ekspertartiklit loovad usaldust."
      },
      {
        type: "p",
        text: "Mitmekeelsele auditooriumile planeeri keeleversioonid kohe."
      },
      {
        type: "h2",
        text: "Esimesed 90 päeva"
      },
      {
        type: "p",
        text: "Esita sitemap, paranda katvuse vead, taotle võtme-URL indekseerimist. Alusta kohalikku SEO-d ja esimesi partnerviiteid."
      },
      {
        type: "ul",
        items: [
          "Positsioonide jälgimine",
          "Siselingid uutele artiklile",
          "GBP avamise päeval",
          "Väldi masskopeerimist"
        ]
      },
      {
        type: "links",
        title: "Kasulikud lingid",
        items: [
          {
            label: "SEO teenused",
            href: "/et/services"
          },
          {
            label: "Hinnakiri",
            href: "/et/pricing"
          },
          {
            label: "Kontakt",
            href: "/et/contact"
          }
        ]
      },
      {
        type: "cta",
        title: "Vajate abi SEO-ga?",
        description: "Tellige tasuta SEO audit — näitame teie veebilehe kasvupunkte Google'is.",
        buttonLabel: "Küsi SEO-auditit",
        href: "/et/contact"
      }
    ],
    faq: [
      {
        question: "Millal tuleb esimene orgaaniline liiklus?",
        answer: "Indekseerimine võtab päevi-kuid. Märkimisväärne liiklus madala konkurentsiga päringutel — tavaliselt 1–3 kuud."
      },
      {
        question: "Kas staging vajab noindex'i?",
        answer: "Jah, testkeskkond peab olema indekseerimise eest kaitstud."
      },
      {
        question: "Kust Eestis alustada?",
        answer: "Kohalikud päringud, GBP ja eestikeelsed teenuselehed toovad kiireimad esimesed päringud."
      }
    ]
  },
  {
    locale: "en",
    translationKey: "seo-new-website",
    slug: "seo-for-new-website",
    title: "SEO for a New Website: What to Do Right After Launch",
    metaTitle: "SEO for a New Website: Launch Checklist",
    metaDescription: "How to promote a new site from scratch: architecture, technical foundation, launch content, and first steps in Google Search Console.",
    date: "2025-06-18",
    author: "RankBoost Team",
    category: "General SEO",
    excerpt: "SEO for a new website launch: what to build before go-live so you do not rebuild structure, URLs, and indexing six months later.",
    tags: [
      "new website SEO",
      "site launch",
      "indexing"
    ],
    content: [
      {
        type: "h2",
        text: "Plan before design"
      },
      {
        type: "p",
        text: "Keyword mapping and URL structure belong before build. Changing slugs after indexing means costly redirects and lost signals."
      },
      {
        type: "p",
        text: "Define 5–15 priority landing pages for commercial queries plus an informational cluster for the blog."
      },
      {
        type: "ul",
        items: [
          "Page map and navigation",
          "Clean URL slugs",
          "CMS with SEO flexibility"
        ]
      },
      {
        type: "h2",
        text: "Technical minimum at launch"
      },
      {
        type: "p",
        text: "HTTPS, robots.txt, XML sitemap, canonicals, mobile UX, and speed are baseline. Connect Search Console and analytics before marketing spend."
      },
      {
        type: "ol",
        items: [
          "Block staging from index",
          "Verify test domain status",
          "Organization and WebSite schema",
          "Favicon and core meta tags"
        ]
      },
      {
        type: "h2",
        text: "Launch content"
      },
      {
        type: "p",
        text: "Ten strong pages beat fifty thin ones. Home, services, about, contact, privacy, and 2–3 expert articles establish trust."
      },
      {
        type: "p",
        text: "For Estonia's multilingual audience, plan language versions from day one."
      },
      {
        type: "h2",
        text: "First 90 days after launch"
      },
      {
        type: "p",
        text: "Submit sitemap, fix coverage errors, request indexing for key URLs. Start local SEO and earn first links via partners and directories."
      },
      {
        type: "ul",
        items: [
          "Track core keyword positions",
          "Internal links to new posts",
          "GBP live on opening day",
          "Avoid mass duplicate content"
        ]
      },
      {
        type: "links",
        title: "Helpful links",
        items: [
          {
            label: "SEO Services",
            href: "/en/services"
          },
          {
            label: "Pricing",
            href: "/en/pricing"
          },
          {
            label: "Contact",
            href: "/en/contact"
          }
        ]
      },
      {
        type: "cta",
        title: "Need SEO help?",
        description: "Order a free SEO audit — we'll show your website's growth opportunities on Google.",
        buttonLabel: "Get an SEO Audit",
        href: "/en/contact"
      }
    ],
    faq: [
      {
        question: "When will a new domain get traffic?",
        answer: "Indexing may take days to weeks. Meaningful organic traffic on low-competition terms often appears in 1–3 months with solid content."
      },
      {
        question: "Should staging use noindex?",
        answer: "Yes. Staging must be blocked from indexing or you risk duplicate URLs in Google."
      },
      {
        question: "Where to start promotion in Estonia?",
        answer: "Local queries, GBP, and Estonian service pages are the fastest path to first leads on a new domain."
      }
    ]
  },
  {
    locale: "ru",
    translationKey: "choose-seo-agency",
    slug: "kak-vybrat-seo-agentstvo",
    title: "Как выбрать SEO-агентство и не потерять бюджет",
    metaTitle: "Как выбрать SEO-агентство: гайд для бизнеса",
    metaDescription: "Критерии выбора SEO-подрядчика: опыт в нише, прозрачность отчётов, этика ссылок и реалистичные ожидания по срокам.",
    date: "2025-06-22",
    author: "RankBoost Team",
    category: "SEO Strategy",
    excerpt: "Как выбрать SEO-агентство в Эстонии и Европе: вопросы на брифинге, красные флаги, KPI и что должно быть в договоре.",
    tags: [
      "SEO агентство",
      "выбор подрядчика",
      "аутсорс"
    ],
    content: [
      {
        type: "h2",
        text: "Что определить до поиска агентства"
      },
      {
        type: "p",
        text: "Цели: лиды, продажи, узнаваемость. Бюджет и горизонт 6–12 месяцев. Языки и регионы. Без этого сравнение предложений превращается в угадывание цены."
      },
      {
        type: "p",
        text: "Подготовьте доступ к Search Console и аналитике — серьёзный подрядчик начнёт с аудита, а не с шаблонного КП."
      },
      {
        type: "ul",
        items: [
          "KPI: трафик, лиды, видимость",
          "Внутренние ресурсы для контента",
          "Ограничения CMS и разработки"
        ]
      },
      {
        type: "h2",
        text: "Вопросы на первой встрече"
      },
      {
        type: "p",
        text: "Спросите про кейсы в вашей нише, состав команды, кто пишет тексты и кто вносит техправки. Уточните инструменты и частоту отчётов."
      },
      {
        type: "ol",
        items: [
          "Пример дорожной карты на 90 дней",
          "Подход к ссылкам и контенту",
          "Как измеряют конверсии",
          "Что входит и не входит в абонент"
        ]
      },
      {
        type: "h2",
        text: "Красные флаги"
      },
      {
        type: "p",
        text: "Гарантия топ-1, секретные методы, отсутствие отчётов, резкое падение после отмены — признаки низкого качества или серых схем."
      },
      {
        type: "p",
        text: "Остерегайтесь агентств без локального опыта, если вам критичен рынок Эстонии — понимание et/ru поиска имеет значение."
      },
      {
        type: "h2",
        text: "Договор и сотрудничество"
      },
      {
        type: "p",
        text: "Фиксируйте объём работ, сроки, права на контент, условия расторжения. Ежемесячный созвон с разбором цифр держит проект в фокусе."
      },
      {
        type: "ul",
        items: [
          "Владение аккаунтами у клиента",
          "SLA на ответы и правки",
          "План при смене подрядчика",
          "Согласование бренд-тона"
        ]
      },
      {
        type: "links",
        title: "Полезные материалы",
        items: [
          {
            label: "SEO-услуги",
            href: "/ru/services"
          },
          {
            label: "Тарифы",
            href: "/ru/pricing"
          },
          {
            label: "Контакты",
            href: "/ru/contact"
          }
        ]
      },
      {
        type: "cta",
        title: "Нужна помощь с SEO?",
        description: "Закажите бесплатный SEO-аудит — мы покажем точки роста вашего сайта в Google.",
        buttonLabel: "Получить SEO-аудит",
        href: "/ru/contact"
      }
    ],
    faq: [
      {
        question: "Агентство или in-house SEO?",
        answer: "In-house даёт глубину в продукте, агентство — опыт и инструменты. Гибрид часто оптимален: стратегия снаружи, контент внутри."
      },
      {
        question: "Сколько предложений сравнивать?",
        answer: "2–4 детальных предложения достаточно. Сравнивайте scope, а не только месячную цену."
      },
      {
        question: "Когда менять SEO-подрядчика?",
        answer: "Если нет прозрачности, нет прогресса по согласованным KPI 4–6 месяцев и нет внятного плана исправлений."
      }
    ]
  },
  {
    locale: "et",
    translationKey: "choose-seo-agency",
    slug: "kuidas-valida-seo-agentuuri",
    title: "Kuidas valida SEO agentuuri ja mitte kaotada eelarvet",
    metaTitle: "Kuidas valida SEO agentuur: ettevõtte juhend",
    metaDescription: "SEO partneri valiku kriteeriumid: nišikogemus, läbipaistvad raportid, linkide eetika ja realistlikud ajakavad.",
    date: "2025-06-26",
    author: "RankBoost Team",
    category: "SEO Strategy",
    excerpt: "Kuidas valida SEO agentuuri Eestis ja Euroopas: küsimused brífingul, hoiatusmärgid, KPI-d ja mis peab lepingus olema.",
    tags: [
      "SEO agentuur",
      "partneri valik",
      "outsource"
    ],
    content: [
      {
        type: "h2",
        text: "Mida enne otsingut määrata"
      },
      {
        type: "p",
        text: "Eesmärgid: päringud, müük, nähtavus. Eelarve ja 6–12 kuu horisont. Keeled ja piirkonnad."
      },
      {
        type: "p",
        text: "Valmista Search Console ja analüütika ligipääs — tõsisel partneril algab audit, mitte šabloonpakkumine."
      },
      {
        type: "ul",
        items: [
          "KPI: liiklus, päringud",
          "Sisutootmise ressursid",
          "CMS piirangud"
        ]
      },
      {
        type: "h2",
        text: "Küsimused esimesel kohtumisel"
      },
      {
        type: "p",
        text: "Küsi niši case'e, meeskonda, kes kirjutab ja kes teeb tehnilisi parandusi. Tööriistad ja raporti sagedus."
      },
      {
        type: "ol",
        items: [
          "90 päeva tegevuskava näidis",
          "Linkide ja sisu lähenemine",
          "Konversioonide mõõtmine",
          "Kuutasu sisse- ja väljajäägid"
        ]
      },
      {
        type: "h2",
        text: "Hoiatusmärgid"
      },
      {
        type: "p",
        text: "TOP-1 garantii, salajased meetodid, raportite puudumine — madala kvaliteedi või hallide skeemide tunnused."
      },
      {
        type: "p",
        text: "Eesti turul on kohalik et/ru kogemus oluline."
      },
      {
        type: "h2",
        text: "Leping ja koostöö"
      },
      {
        type: "p",
        text: "Fikseeri töö maht, tähtajad, sisuõigused, lõpetamise tingimused. Igakuine koosolek numbritega hoiab fookust."
      },
      {
        type: "ul",
        items: [
          "Kontod kliendi nimel",
          "SLA vastustele",
          "Plaan partneri vahetusel",
          "Bränditooni kokkulepe"
        ]
      },
      {
        type: "links",
        title: "Kasulikud lingid",
        items: [
          {
            label: "SEO teenused",
            href: "/et/services"
          },
          {
            label: "Hinnakiri",
            href: "/et/pricing"
          },
          {
            label: "Kontakt",
            href: "/et/contact"
          }
        ]
      },
      {
        type: "cta",
        title: "Vajate abi SEO-ga?",
        description: "Tellige tasuta SEO audit — näitame teie veebilehe kasvupunkte Google'is.",
        buttonLabel: "Küsi SEO-auditit",
        href: "/et/contact"
      }
    ],
    faq: [
      {
        question: "Agentuur või in-house SEO?",
        answer: "In-house annab sügavuse, agentuur kogemuse. Hübriid on sageli parim."
      },
      {
        question: "Mitu pakkumist võrrelda?",
        answer: "2–4 detailset. Võrdle ulatust, mitte ainult hinda."
      },
      {
        question: "Millal partnerit vahetada?",
        answer: "Kui puudub läbipaistvus ja progress KPI-de osas 4–6 kuu jooksul."
      }
    ]
  },
  {
    locale: "en",
    translationKey: "choose-seo-agency",
    slug: "how-to-choose-seo-agency",
    title: "How to Choose an SEO Agency and Avoid Wasting Budget",
    metaTitle: "How to Choose an SEO Agency: Business Guide",
    metaDescription: "Criteria for selecting an SEO partner: niche experience, transparent reporting, ethical link building, and realistic timelines.",
    date: "2025-07-01",
    author: "RankBoost Team",
    category: "SEO Strategy",
    excerpt: "How to choose an SEO agency in Estonia and Europe: briefing questions, red flags, KPIs, and what belongs in the contract.",
    tags: [
      "SEO agency",
      "vendor selection",
      "outsourcing"
    ],
    content: [
      {
        type: "h2",
        text: "Define goals before you shop"
      },
      {
        type: "p",
        text: "Clarify goals: leads, revenue, awareness. Set budget and a 6–12 month horizon. List languages and regions — otherwise quotes are incomparable."
      },
      {
        type: "p",
        text: "Prepare Search Console and analytics access. Serious agencies start with an audit, not a template proposal."
      },
      {
        type: "ul",
        items: [
          "KPIs: traffic, leads, visibility",
          "In-house content capacity",
          "CMS and dev constraints"
        ]
      },
      {
        type: "h2",
        text: "Questions for the first call"
      },
      {
        type: "p",
        text: "Ask for niche case studies, team roles, who writes content, who ships technical fixes. Confirm tools and reporting cadence."
      },
      {
        type: "ol",
        items: [
          "Sample 90-day roadmap",
          "Link and content approach",
          "How conversions are tracked",
          "What is in and out of scope"
        ]
      },
      {
        type: "h2",
        text: "Red flags"
      },
      {
        type: "p",
        text: "Guaranteed #1 rankings, secret tactics, no reporting, cliff-drop after cancel — signs of low quality or risky schemes."
      },
      {
        type: "p",
        text: "For Estonia, local et/ru search experience matters if that is your market."
      },
      {
        type: "h2",
        text: "Contract and collaboration"
      },
      {
        type: "p",
        text: "Document scope, timelines, content ownership, and exit terms. Monthly reviews with numbers keep the project aligned."
      },
      {
        type: "ul",
        items: [
          "Client owns accounts",
          "SLA for responses",
          "Handover plan",
          "Brand tone alignment"
        ]
      },
      {
        type: "links",
        title: "Helpful links",
        items: [
          {
            label: "SEO Services",
            href: "/en/services"
          },
          {
            label: "Pricing",
            href: "/en/pricing"
          },
          {
            label: "Contact",
            href: "/en/contact"
          }
        ]
      },
      {
        type: "cta",
        title: "Need SEO help?",
        description: "Order a free SEO audit — we'll show your website's growth opportunities on Google.",
        buttonLabel: "Get an SEO Audit",
        href: "/en/contact"
      }
    ],
    faq: [
      {
        question: "Agency or in-house SEO?",
        answer: "In-house knows the product; agencies bring breadth and tools. A hybrid model often works best."
      },
      {
        question: "How many proposals to compare?",
        answer: "Two to four detailed proposals. Compare scope, not monthly price alone."
      },
      {
        question: "When to switch SEO vendors?",
        answer: "When transparency is missing and agreed KPIs show no progress for 4–6 months without a credible fix plan."
      }
    ]
  },
  {
    locale: "ru",
    translationKey: "seo-vs-ads",
    slug: "seo-vs-reklama-google-ads",
    title: "SEO или Google Ads: что лучше для бизнеса",
    metaTitle: "SEO vs реклама: что выбрать бизнесу",
    metaDescription: "Сравнение SEO и контекстной рекламы: скорость, бюджет, долгосрочный эффект и стратегия для малого и среднего бизнеса.",
    date: "2025-07-05",
    author: "RankBoost Team",
    category: "SEO Strategy",
    excerpt: "SEO или Google Ads: сравнение по срокам, стоимости лида и рискам для бизнеса в Эстонии. Когда нужен микс обоих каналов.",
    tags: [
      "SEO vs Ads",
      "Google Ads",
      "маркетинг"
    ],
    content: [
      {
        type: "h2",
        text: "Скорость и предсказуемость"
      },
      {
        type: "p",
        text: "Реклама даёт трафик в день запуска кампании. SEO требует месяцев, но накапливает актив: страницы продолжают приносить визиты без оплаты за клик."
      },
      {
        type: "p",
        text: "Для нового продукта или сезонной акции Ads часто стартуют первыми, пока SEO закрывает базовую семантику."
      },
      {
        type: "ul",
        items: [
          "Ads: мгновенный охват",
          "SEO: отложенный, но накопительный эффект",
          "Сезонность и промо"
        ]
      },
      {
        type: "h2",
        text: "Стоимость и юнит-экономика"
      },
      {
        type: "p",
        text: "CPC в конкурентных нишах Эстонии растёт. SEO имеет высокий фиксированный вход, но снижает marginal cost лида со временем при стабильных позициях."
      },
      {
        type: "ol",
        items: [
          "Считать CPL по каждому каналу",
          "Учитывать LTV клиента",
          "Моделировать бюджет на 12 месяцев",
          "Сравнить brand vs non-brand"
        ]
      },
      {
        type: "h2",
        text: "Доверие и видимость в выдаче"
      },
      {
        type: "p",
        text: "Органические результаты воспринимаются как более надёжные, особенно в B2B. Реклама занимает верх, но часть пользователей прокручивает к органике."
      },
      {
        type: "p",
        text: "Доминирование и в Ads, и в SEO по брендовым запросам защищает от конкурентов."
      },
      {
        type: "h2",
        text: "Когда комбинировать"
      },
      {
        type: "p",
        text: "Идеальная модель для роста в Европе: Ads тестирует офферы и ключи, SEO масштабирует то, что подтвердило конверсию. Данные Search Terms из Ads кормят контент-план."
      },
      {
        type: "ul",
        items: [
          "Запуск нового сайта: Ads + SEO база",
          "Ретаргет на органический трафик",
          "A/B заголовков в Ads → title на сайте",
          "Ограниченный бюджет: локальный SEO первым"
        ]
      },
      {
        type: "links",
        title: "Полезные материалы",
        items: [
          {
            label: "SEO-услуги",
            href: "/ru/services"
          },
          {
            label: "Тарифы",
            href: "/ru/pricing"
          },
          {
            label: "Контакты",
            href: "/ru/contact"
          }
        ]
      },
      {
        type: "cta",
        title: "Нужна помощь с SEO?",
        description: "Закажите бесплатный SEO-аудит — мы покажем точки роста вашего сайта в Google.",
        buttonLabel: "Получить SEO-аудит",
        href: "/ru/contact"
      }
    ],
    faq: [
      {
        question: "Можно ли заменить SEO рекламой?",
        answer: "Краткосрочно — да. Долгосрочно зависимость от Ads дороже. SEO снижает риск при скачках CPC."
      },
      {
        question: "Что дешевле для стоматологии в Таллине?",
        answer: "Локальный SEO и GBP часто дают ниже CPL, чем широкие Ads по «стоматолог», но Ads полезны для срочных слотов."
      },
      {
        question: "Влияет ли реклама на органические позиции?",
        answer: "Прямого ranking-буста нет. Косвенно — рост узнаваемости бренда и поведенческих сигналов."
      }
    ]
  },
  {
    locale: "et",
    translationKey: "seo-vs-ads",
    slug: "seo-voi-google-ads",
    title: "SEO või Google Ads: kumb on ettevõttele parem",
    metaTitle: "SEO vs reklaam: mida valida",
    metaDescription: "SEO ja tasulise reklaami võrdlus: kiirus, eelarve, pikaajaline mõju ja strateegia väikeettevõttele.",
    date: "2025-07-10",
    author: "RankBoost Team",
    category: "SEO Strategy",
    excerpt: "SEO või Google Ads: võrdlus ajakava, päringu maksumuse ja riskide osas Eesti ettevõttele. Millal on vaja mõlemat kanalit.",
    tags: [
      "SEO vs Ads",
      "Google Ads",
      "turundus"
    ],
    content: [
      {
        type: "h2",
        text: "Kiirus ja ettearvatavus"
      },
      {
        type: "p",
        text: "Reklaam toob liiklust kohe. SEO võtab kuid, kuid kogub väärtust: lehed toovad külastusi ilma klikitasuta."
      },
      {
        type: "p",
        text: "Uue toote või hooajakampaania puhul alustatakse sageli Ads-iga, samal ajal SEO baasiga."
      },
      {
        type: "ul",
        items: [
          "Ads: kohene haare",
          "SEO: kumulatiivne efekt",
          "Hooajalisus"
        ]
      },
      {
        type: "h2",
        text: "Kulu ja ühikökonoomika"
      },
      {
        type: "p",
        text: "CPC tihedates nišides tõuseb. SEO nõuab alginvesteeringut, kuid vähendab pika plaanis päringu hinda."
      },
      {
        type: "ol",
        items: [
          "CPL kanalite kaupa",
          "Kliendi LTV",
          "12 kuu eelarve mudel",
          "Bränd vs mitte-bränd"
        ]
      },
      {
        type: "h2",
        text: "Usaldus ja nähtavus"
      },
      {
        type: "p",
        text: "Orgaanilised tulemused tunduvad usaldusväärsemad, eriti B2B-s. Reklaam on üleval, kuid osa kasutajatest kerib orgaanikani."
      },
      {
        type: "p",
        text: "Mõlemas kanalis brändipäringute domineerimine kaitseb konkurentide eest."
      },
      {
        type: "h2",
        text: "Millal kombineerida"
      },
      {
        type: "p",
        text: "Ads testib pakkumisi ja märksõnu, SEO skaleerib töötavat. Search Terms andmed toidavad sisuplaani."
      },
      {
        type: "ul",
        items: [
          "Uus sait: Ads + SEO",
          "Retarget orgaanilist liiklust",
          "Ads pealkirjad → saidi title",
          "Väike eelarve: kohalik SEO esmalt"
        ]
      },
      {
        type: "links",
        title: "Kasulikud lingid",
        items: [
          {
            label: "SEO teenused",
            href: "/et/services"
          },
          {
            label: "Hinnakiri",
            href: "/et/pricing"
          },
          {
            label: "Kontakt",
            href: "/et/contact"
          }
        ]
      },
      {
        type: "cta",
        title: "Vajate abi SEO-ga?",
        description: "Tellige tasuta SEO audit — näitame teie veebilehe kasvupunkte Google'is.",
        buttonLabel: "Küsi SEO-auditit",
        href: "/et/contact"
      }
    ],
    faq: [
      {
        question: "Kas SEO asemel piisab reklaamist?",
        answer: "Lühidalt jah, pikas plaanis Ads-sõltuvus on kallim."
      },
      {
        question: "Mis on odavam hambaravikliinikule?",
        answer: "Kohalik SEO ja GBP annavad sageli madalama CPL-i kui laiad Ads-kampaaniad."
      },
      {
        question: "Kas reklaam mõjutab orgaanilisi positsioone?",
        answer: "Otseselt ei. Kaudselt võib brändituntus aidata."
      }
    ]
  },
  {
    locale: "en",
    translationKey: "seo-vs-ads",
    slug: "seo-vs-google-ads",
    title: "SEO vs Google Ads: Which Is Better for Business",
    metaTitle: "SEO vs Ads: What Should You Choose",
    metaDescription: "Compare SEO and paid search: speed, budget, long-term impact, and practical strategy for small and mid-size businesses.",
    date: "2025-07-14",
    author: "RankBoost Team",
    category: "SEO Strategy",
    excerpt: "SEO vs Google Ads for Estonian businesses: timelines, cost per lead, risks, and when a blended channel strategy wins.",
    tags: [
      "SEO vs Ads",
      "Google Ads",
      "marketing mix"
    ],
    content: [
      {
        type: "h2",
        text: "Speed and predictability"
      },
      {
        type: "p",
        text: "Ads deliver traffic the day campaigns go live. SEO needs months but builds assets — pages keep earning visits without per-click fees."
      },
      {
        type: "p",
        text: "New products and seasonal promos often lean on Ads first while SEO builds core visibility."
      },
      {
        type: "ul",
        items: [
          "Ads: immediate reach",
          "SEO: compounding returns",
          "Seasonality and promos"
        ]
      },
      {
        type: "h2",
        text: "Cost and unit economics"
      },
      {
        type: "p",
        text: "CPC rises in competitive Estonian niches. SEO has higher fixed entry cost but lowers marginal lead cost over time with stable rankings."
      },
      {
        type: "ol",
        items: [
          "CPL by channel",
          "Customer LTV",
          "12-month budget model",
          "Brand vs non-brand split"
        ]
      },
      {
        type: "h2",
        text: "Trust and SERP presence"
      },
      {
        type: "p",
        text: "Organic results earn more trust, especially in B2B. Ads own the top, but many users scroll to organic listings."
      },
      {
        type: "p",
        text: "Owning both channels on branded queries defends against competitors."
      },
      {
        type: "h2",
        text: "When to combine both"
      },
      {
        type: "p",
        text: "Ads test offers and keywords; SEO scales what converts. Search Terms data from Ads feeds your content plan."
      },
      {
        type: "ul",
        items: [
          "New site: Ads plus SEO foundation",
          "Retarget organic visitors",
          "Ad headline tests inform page titles",
          "Tight budget: local SEO first"
        ]
      },
      {
        type: "links",
        title: "Helpful links",
        items: [
          {
            label: "SEO Services",
            href: "/en/services"
          },
          {
            label: "Pricing",
            href: "/en/pricing"
          },
          {
            label: "Contact",
            href: "/en/contact"
          }
        ]
      },
      {
        type: "cta",
        title: "Need SEO help?",
        description: "Order a free SEO audit — we'll show your website's growth opportunities on Google.",
        buttonLabel: "Get an SEO Audit",
        href: "/en/contact"
      }
    ],
    faq: [
      {
        question: "Can Ads replace SEO?",
        answer: "Short term, partially. Long term, Ads dependency is costly. SEO hedges CPC inflation."
      },
      {
        question: "What is cheaper for a Tallinn dental clinic?",
        answer: "Local SEO and GBP often beat broad Ads on CPL, but Ads help fill urgent appointment slots."
      },
      {
        question: "Does paid search boost organic rankings?",
        answer: "Not directly. Indirect brand lift may help over time."
      }
    ]
  },
  {
    locale: "ru",
    translationKey: "keyword-research",
    slug: "semanticheskoe-yadro",
    title: "Семантическое ядро: зачем бизнесу правильные ключевые слова",
    metaTitle: "Сбор семантики: keyword research для SEO",
    metaDescription: "Как проводить keyword research: источники данных, группировка запросов, intent и карта посадочных для роста органического трафика.",
    date: "2025-07-18",
    author: "RankBoost Team",
    category: "Content SEO",
    excerpt: "Сбор семантического ядра для SEO: инструменты, кластеризация, приоритизация по коммерческому потенциалу и примеры для рынка Эстонии.",
    tags: [
      "семантика",
      "keyword research",
      "маркетинг"
    ],
    content: [
      {
        type: "h2",
        text: "Откуда брать ключевые слова"
      },
      {
        type: "p",
        text: "Google Search Console, подсказки, People Also Ask, конкуренты и интервью с продажами — базовый набор. Для et/ru/en собирайте отдельные списки: перевод запроса ≠ тот же спрос."
      },
      {
        type: "p",
        text: "Платные инструменты (Ahrefs, Semrush) ускоряют анализ, но старт возможен и на бесплатных данных при узкой нише."
      },
      {
        type: "ul",
        items: [
          "Search Console queries",
          "Конкурентные URL в SERP",
          "Внутренний поиск на сайте",
          "Отзывы и тикеты поддержки"
        ]
      },
      {
        type: "h2",
        text: "Интент и кластеризация"
      },
      {
        type: "p",
        text: "Группируйте запросы по намерению: информационный, коммерческий, транзакционный, навигационный. Один кластер — одна посадочная, если интент совпадает."
      },
      {
        type: "ol",
        items: [
          "Выделить head и long-tail",
          "Убрать нерелевантное",
          "Сопоставить с существующими страницами",
          "Найти пробелы для новых URL"
        ]
      },
      {
        type: "h2",
        text: "Приоритизация"
      },
      {
        type: "p",
        text: "Оценивайте объём, сложность, близость к продаже и текущие позиции. Quick wins — запросы на позициях 5–15 с достаточным спросом."
      },
      {
        type: "p",
        text: "Для локального бизнеса в Эстонии приоритет часто у «услуга + город» и мобильных формулировок."
      },
      {
        type: "h2",
        text: "Карта ключей и контента"
      },
      {
        type: "p",
        text: "Зафиксируйте в таблице: кластер, целевой URL, title, статус. Обновляйте раз в квартал по данным Search Console — реальный спрос часто отличается от прогноза."
      },
      {
        type: "ul",
        items: [
          "Primary и secondary keywords",
          "Сезонные пики",
          "Связь с контент-планом",
          "Отслеживание в rank tracker"
        ]
      },
      {
        type: "links",
        title: "Полезные материалы",
        items: [
          {
            label: "SEO-услуги",
            href: "/ru/services"
          },
          {
            label: "Тарифы",
            href: "/ru/pricing"
          },
          {
            label: "Контакты",
            href: "/ru/contact"
          }
        ]
      },
      {
        type: "cta",
        title: "Нужна помощь с SEO?",
        description: "Закажите бесплатный SEO-аудит — мы покажем точки роста вашего сайта в Google.",
        buttonLabel: "Получить SEO-аудит",
        href: "/ru/contact"
      }
    ],
    faq: [
      {
        question: "Сколько ключей нужно малому бизнесу?",
        answer: "50–150 релевантных кластеров обычно достаточно на старте. Важнее покрытие интента, чем размер списка."
      },
      {
        question: "Учитывать ли нулевой объём в инструментах?",
        answer: "Да, если запрос приходит из реальных продаж или Search Console. Инструменты недооценивают локальные long-tail."
      },
      {
        question: "Как исследовать эстонские запросы?",
        answer: "Используйте et локаль в инструментах, эстонские SERP и подсказки Google.ee. Не полагайтесь только на перевод с русского."
      }
    ]
  },
  {
    locale: "et",
    translationKey: "keyword-research",
    slug: "marksonade-analuus-seo",
    title: "Märksõnade analüüs: miks ettevõte vajab õigeid otsingusõnu",
    metaTitle: "Märksõnauuring: keyword research SEO-s",
    metaDescription: "Kuidas teha märksõnauuringut: andmeallikad, päringute grupeerimine, otsingukavatsus ja maandumislehtede kaart.",
    date: "2025-07-23",
    author: "RankBoost Team",
    category: "Content SEO",
    excerpt: "Märksõnauuring SEO jaoks: tööriistad, klastreerimine, prioriseerimine müügipotentsiaali järgi ja näited Eesti turul.",
    tags: [
      "märksõnad",
      "keyword research",
      "SEO"
    ],
    content: [
      {
        type: "h2",
        text: "Kust märksõnu leida"
      },
      {
        type: "p",
        text: "Search Console, soovitused, People Also Ask, konkurendid ja müügiintervjuud. Et/ru/en nimekirjad eraldi — tõlge ei tähenda sama nõudlust."
      },
      {
        type: "p",
        text: "Tasulised tööriistad kiirendavad, kuid kitsas nišis piisab ka tasuta andmetest."
      },
      {
        type: "ul",
        items: [
          "Search Console päringud",
          "Konkurentide URL-id",
          "Sisemine otsing",
          "Klienditagasiside"
        ]
      },
      {
        type: "h2",
        text: "Kavatsus ja klastrid"
      },
      {
        type: "p",
        text: "Grupeeri infot, kommerts-, tehingu- ja brändipäringud. Üks klaster — üks leht, kui kavatsus kattub."
      },
      {
        type: "ol",
        items: [
          "Head ja long-tail eraldi",
          "Eemalda ebaoluline",
          "Võrdle olemasolevate lehtedega",
          "Tuvasta lüngad"
        ]
      },
      {
        type: "h2",
        text: "Prioriseerimine"
      },
      {
        type: "p",
        text: "Hinda mahtu, raskust, müügiproximity't ja praeguseid positsioone. Kiired võidud: positsioonid 5–15 piisava nõudlusega."
      },
      {
        type: "p",
        text: "Kohalikule ettevõttele on prioriteet 'teenus + linn' ja mobiilsed formulatsioonid."
      },
      {
        type: "h2",
        text: "Märksõnade kaart"
      },
      {
        type: "p",
        text: "Tabel: klaster, URL, title, staatus. Uuenda kvartalis Search Console andmete põhjal."
      },
      {
        type: "ul",
        items: [
          "Primary ja secondary",
          "Hooajalisus",
          "Seos sisuplaaniga",
          "Positsioonide jälgimine"
        ]
      },
      {
        type: "links",
        title: "Kasulikud lingid",
        items: [
          {
            label: "SEO teenused",
            href: "/et/services"
          },
          {
            label: "Hinnakiri",
            href: "/et/pricing"
          },
          {
            label: "Kontakt",
            href: "/et/contact"
          }
        ]
      },
      {
        type: "cta",
        title: "Vajate abi SEO-ga?",
        description: "Tellige tasuta SEO audit — näitame teie veebilehe kasvupunkte Google'is.",
        buttonLabel: "Küsi SEO-auditit",
        href: "/et/contact"
      }
    ],
    faq: [
      {
        question: "Mitu märksõna väikeettevõttele?",
        answer: "50–150 asjakohast klastrit on tavaliselt piisav. Oluline on kavatsuse katmine."
      },
      {
        question: "Kas nullmahuga päringuid arvestada?",
        answer: "Jah, kui need tulevad müügist või Search Console'ist."
      },
      {
        question: "Kuidas uurida eesti päringuid?",
        answer: "Kasuta et lokaati tööriistades ja Google.ee SERP-i. Ära tugine ainult vene keele tõlkele."
      }
    ]
  },
  {
    locale: "en",
    translationKey: "keyword-research",
    slug: "keyword-research-for-seo",
    title: "Keyword Research: Why Businesses Need the Right Search Terms",
    metaTitle: "Keyword Research: Build Your SEO Map",
    metaDescription: "How to run keyword research: data sources, query clustering, search intent, and landing page mapping for organic growth.",
    date: "2025-07-27",
    author: "RankBoost Team",
    category: "Content SEO",
    excerpt: "Keyword research for SEO: tools, clustering, commercial prioritization, and practical examples for the Estonian market.",
    tags: [
      "keyword research",
      "semantics",
      "SEO strategy"
    ],
    content: [
      {
        type: "h2",
        text: "Where keywords come from"
      },
      {
        type: "p",
        text: "Search Console, autosuggest, People Also Ask, competitors, and sales interviews are core sources. Build separate et/ru/en lists — translated queries are not the same demand."
      },
      {
        type: "p",
        text: "Paid tools speed analysis, but narrow niches can start on free data."
      },
      {
        type: "ul",
        items: [
          "Search Console queries",
          "Competitor ranking URLs",
          "On-site search logs",
          "Support tickets and reviews"
        ]
      },
      {
        type: "h2",
        text: "Intent and clustering"
      },
      {
        type: "p",
        text: "Group by intent: informational, commercial, transactional, navigational. One cluster maps to one landing page when intent aligns."
      },
      {
        type: "ol",
        items: [
          "Separate head and long-tail",
          "Remove irrelevant terms",
          "Map to existing pages",
          "Find gaps for new URLs"
        ]
      },
      {
        type: "h2",
        text: "Prioritization"
      },
      {
        type: "p",
        text: "Score volume, difficulty, revenue proximity, and current positions. Quick wins: rankings 5–15 with real demand."
      },
      {
        type: "p",
        text: "Local Estonian businesses often prioritize service-plus-city and mobile phrasing."
      },
      {
        type: "h2",
        text: "Keyword-to-content map"
      },
      {
        type: "p",
        text: "Document cluster, target URL, title, and status. Refresh quarterly from Search Console — actual demand often differs from tool estimates."
      },
      {
        type: "ul",
        items: [
          "Primary and secondary terms",
          "Seasonal peaks",
          "Link to content calendar",
          "Track in a rank monitor"
        ]
      },
      {
        type: "links",
        title: "Helpful links",
        items: [
          {
            label: "SEO Services",
            href: "/en/services"
          },
          {
            label: "Pricing",
            href: "/en/pricing"
          },
          {
            label: "Contact",
            href: "/en/contact"
          }
        ]
      },
      {
        type: "cta",
        title: "Need SEO help?",
        description: "Order a free SEO audit — we'll show your website's growth opportunities on Google.",
        buttonLabel: "Get an SEO Audit",
        href: "/en/contact"
      }
    ],
    faq: [
      {
        question: "How many keywords does a small business need?",
        answer: "Fifty to 150 relevant clusters is a solid start. Intent coverage beats list size."
      },
      {
        question: "Include zero-volume keywords?",
        answer: "Yes when they come from sales or Search Console. Tools undercount local long-tail."
      },
      {
        question: "How to research Estonian queries?",
        answer: "Use et locale in tools and Google.ee SERPs. Do not rely on Russian translation alone."
      }
    ]
  },
  {
    locale: "ru",
    translationKey: "website-structure",
    slug: "struktura-sayta-dlya-seo",
    title: "Правильная структура сайта для SEO-продвижения",
    metaTitle: "Структура сайта для SEO: архитектура",
    metaDescription: "Как выстроить структуру сайта для поиска: иерархия разделов, внутренние ссылки, хлебные крошки и типовые ошибки.",
    date: "2025-08-01",
    author: "RankBoost Team",
    category: "Technical SEO",
    excerpt: "Архитектура сайта для SEO: глубина вложенности, silo, навигация и URL, которые помогают Google понять ваши услуги и приоритеты.",
    tags: [
      "структура сайта",
      "архитектура",
      "технический SEO"
    ],
    content: [
      {
        type: "h2",
        text: "Принципы SEO-архитектуры"
      },
      {
        type: "p",
        text: "Плоская иерархия: важные страницы — в 3 клика от главной. Логические silo по услугам или категориям помогают передать релевантность и избежать каннибализации."
      },
      {
        type: "p",
        text: "Каждая значимая тема должна иметь хаб-страницу и дочерние материалы, связанные внутренними ссылками."
      },
      {
        type: "ul",
        items: [
          "Чёткое меню без дублей",
          "Один главный путь к услуге",
          "Отдельные ветки блога и каталога"
        ]
      },
      {
        type: "h2",
        text: "URL и навигация"
      },
      {
        type: "p",
        text: "ЧПУ отражают структуру: /uslugi/seo-audit/ лучше, чем /page?id=42. Хлебные крошки и HTML-карта сайта улучшают краулинг и UX."
      },
      {
        type: "ol",
        items: [
          "Короткие осмысленные slug",
          "Избегать даты в URL блога",
          "Пагинация с rel next/prev или view-all",
          "Фильтры без индексации мусора"
        ]
      },
      {
        type: "h2",
        text: "Внутренняя перелинковка"
      },
      {
        type: "p",
        text: "С главной и хабов ссылайтесь на деньги-страницы. В статьях — контекстные анкоры на услуги. Footer не должен быть единственным источником ссылок на важные URL."
      },
      {
        type: "p",
        text: "Для многоязычных сайтов структура должна зеркалироваться между et, ru, en с hreflang."
      },
      {
        type: "h2",
        text: "Типовые ошибки структуры"
      },
      {
        type: "p",
        text: "Сотни тегов в блоге, дублирующие категории, сиротские страницы без входящих ссылок — типичные проблемы после лет контента без аудита."
      },
      {
        type: "ul",
        items: [
          "Каннибализация похожих URL",
          "Слишком глубокая вложенность",
          "Параметрические дубли",
          "Размытое меню услуг"
        ]
      },
      {
        type: "links",
        title: "Полезные материалы",
        items: [
          {
            label: "SEO-услуги",
            href: "/ru/services"
          },
          {
            label: "Тарифы",
            href: "/ru/pricing"
          },
          {
            label: "Контакты",
            href: "/ru/contact"
          }
        ]
      },
      {
        type: "cta",
        title: "Нужна помощь с SEO?",
        description: "Закажите бесплатный SEO-аудит — мы покажем точки роста вашего сайта в Google.",
        buttonLabel: "Получить SEO-аудит",
        href: "/ru/contact"
      }
    ],
    faq: [
      {
        question: "Сколько уровней вложенности допустимо?",
        answer: "Стремитесь к 3–4 кликам до коммерческих страниц. Глубже — только для архивного или вспомогательного контента."
      },
      {
        question: "Нужна ли HTML-карта сайта?",
        answer: "Для средних сайтов полезна пользователям и краулерам. Для очень больших — XML sitemap обязателен, HTML — опционально."
      },
      {
        question: "Как структурировать мультиязычный сайт?",
        answer: "Одинаковая иерархия путей с языковым префиксом (/et/services/, /ru/services/) упрощает hreflang и поддержку."
      }
    ]
  },
  {
    locale: "et",
    translationKey: "website-structure",
    slug: "kodulehe-struktuur-seo-jaoks",
    title: "Õige veebilehe struktuur SEO jaoks",
    metaTitle: "Veebilehe struktuur SEO jaoks",
    metaDescription: "Kuidas ehitada saidi struktuur otsingumootoritele: hierarhia, siselingid, breadcrumb ja levinud vead.",
    date: "2025-08-05",
    author: "RankBoost Team",
    category: "Technical SEO",
    excerpt: "Veebilehe struktuur SEO jaoks: sügavus, silod, navigatsioon ja URL-id, mis aitavad Google'il teenuseid mõista.",
    tags: [
      "saidi struktuur",
      "arhitektuur",
      "tehniline SEO"
    ],
    content: [
      {
        type: "h2",
        text: "SEO arhitektuuri põhimõtted"
      },
      {
        type: "p",
        text: "Madal hierarhia: olulised lehed 3 kliki kaugusel. Silod teenuste või kategooriate järgi vähendavad kanibaliseerimist."
      },
      {
        type: "p",
        text: "Igal teemal peaks olema hub-leht ja lingitud alamlehed."
      },
      {
        type: "ul",
        items: [
          "Selge menüü",
          "Üks peamine tee teenuseni",
          "Blogi ja kataloog eraldi"
        ]
      },
      {
        type: "h2",
        text: "URL ja navigatsioon"
      },
      {
        type: "p",
        text: "Puhtad slug'id peegeldavad struktuuri. Breadcrumb ja HTML saidikaart aitavad nii kasutajat kui crawler'it."
      },
      {
        type: "ol",
        items: [
          "Lühikesed slug'id",
          "Kuupäev URL-is vältida",
          "Paginatsiooni haldus",
          "Filtrite noindex"
        ]
      },
      {
        type: "h2",
        text: "Siselingid"
      },
      {
        type: "p",
        text: "Avaleht ja hub'id lingivad müügilehtedele. Artiklites kontekstilised ankrud. Footer ei tohiks olla ainus allikas."
      },
      {
        type: "p",
        text: "Mitmekeelsel saidil peegelda struktuur hreflangiga."
      },
      {
        type: "h2",
        text: "Levinud struktuurivead"
      },
      {
        type: "p",
        text: "Sajad blogisildid, duplikaatkategooriad ja orvlehed ilma siselingita — tüüpilised probleemid aastate jooksul."
      },
      {
        type: "ul",
        items: [
          "Sarnaste URL-ide kanibaliseerimine",
          "Liiga sügav hierarhia",
          "Parameetrilised duplikaadid",
          "Ebaselge teenuste menüü"
        ]
      },
      {
        type: "links",
        title: "Kasulikud lingid",
        items: [
          {
            label: "SEO teenused",
            href: "/et/services"
          },
          {
            label: "Hinnakiri",
            href: "/et/pricing"
          },
          {
            label: "Kontakt",
            href: "/et/contact"
          }
        ]
      },
      {
        type: "cta",
        title: "Vajate abi SEO-ga?",
        description: "Tellige tasuta SEO audit — näitame teie veebilehe kasvupunkte Google'is.",
        buttonLabel: "Küsi SEO-auditit",
        href: "/et/contact"
      }
    ],
    faq: [
      {
        question: "Mitu taset on lubatud?",
        answer: "Sihtida 3–4 klikki kommertslehtedeni."
      },
      {
        question: "Kas HTML saidikaart on vajalik?",
        answer: "Keskmise suurusega saitidel kasulik. Suurte puhul on XML sitemap kohustuslik."
      },
      {
        question: "Mitmekeelne struktuur?",
        answer: "Ühtne hierarhia keeleprefiksiga (/et/teenused/) lihtsustab hreflang'i."
      }
    ]
  },
  {
    locale: "en",
    translationKey: "website-structure",
    slug: "website-structure-for-seo",
    title: "The Right Website Structure for SEO Growth",
    metaTitle: "Website Structure for SEO: Architecture",
    metaDescription: "How to build site architecture for search: section hierarchy, internal links, breadcrumbs, and common structural mistakes.",
    date: "2025-08-09",
    author: "RankBoost Team",
    category: "Technical SEO",
    excerpt: "Website structure for SEO: depth, silos, navigation, and URLs that help Google understand your services and priorities.",
    tags: [
      "site structure",
      "information architecture",
      "technical SEO"
    ],
    content: [
      {
        type: "h2",
        text: "SEO architecture principles"
      },
      {
        type: "p",
        text: "Keep important pages within three clicks. Logical silos by service or category pass relevance and reduce keyword cannibalization."
      },
      {
        type: "p",
        text: "Each major topic needs a hub page and linked child pages."
      },
      {
        type: "ul",
        items: [
          "Clear menu without duplicates",
          "One primary path to each service",
          "Separate blog and catalog branches"
        ]
      },
      {
        type: "h2",
        text: "URLs and navigation"
      },
      {
        type: "p",
        text: "Readable slugs mirror structure: /services/seo-audit/ beats /page?id=42. Breadcrumbs and an HTML sitemap help crawlers and users."
      },
      {
        type: "ol",
        items: [
          "Short meaningful slugs",
          "Avoid dates in blog URLs",
          "Sensible pagination handling",
          "Noindex low-value filters"
        ]
      },
      {
        type: "h2",
        text: "Internal linking"
      },
      {
        type: "p",
        text: "Link money pages from home and hubs. Use contextual anchors in articles. Do not rely on footer links alone for key URLs."
      },
      {
        type: "p",
        text: "Multilingual sites should mirror structure across et, ru, en with hreflang."
      },
      {
        type: "h2",
        text: "Common structure mistakes"
      },
      {
        type: "p",
        text: "Hundreds of blog tags, duplicate categories, and orphan pages without inlinks are typical after years without an architecture audit."
      },
      {
        type: "ul",
        items: [
          "Cannibalizing similar URLs",
          "Excessive depth",
          "Parameter duplicates",
          "Vague service menu"
        ]
      },
      {
        type: "links",
        title: "Helpful links",
        items: [
          {
            label: "SEO Services",
            href: "/en/services"
          },
          {
            label: "Pricing",
            href: "/en/pricing"
          },
          {
            label: "Contact",
            href: "/en/contact"
          }
        ]
      },
      {
        type: "cta",
        title: "Need SEO help?",
        description: "Order a free SEO audit — we'll show your website's growth opportunities on Google.",
        buttonLabel: "Get an SEO Audit",
        href: "/en/contact"
      }
    ],
    faq: [
      {
        question: "How deep should site hierarchy go?",
        answer: "Aim for three to four clicks to commercial pages. Deeper levels suit archive content only."
      },
      {
        question: "Do I need an HTML sitemap?",
        answer: "Useful on mid-size sites. Large sites require XML sitemaps; HTML maps are optional extras."
      },
      {
        question: "How to structure multilingual sites?",
        answer: "Mirror paths with language prefixes (/et/services/, /ru/services/) to simplify hreflang and maintenance."
      }
    ]
  },
  {
    locale: "ru",
    translationKey: "landing-page-seo",
    slug: "landing-page-seo",
    title: "SEO для посадочных страниц: как продвигать услуги в Google",
    metaTitle: "SEO посадочной страницы: оптимизация",
    metaDescription: "Гайд по SEO landing pages: структура, оффер, доказательства, schema и тесты для роста позиций и заявок.",
    date: "2025-08-14",
    author: "RankBoost Team",
    category: "Content SEO",
    excerpt: "SEO посадочных страниц: как оптимизировать коммерческие URL под конверсию и ранжирование одновременно — без конфликта UX и ключевых слов.",
    tags: [
      "посадочная страница",
      "конверсия",
      "on-page SEO"
    ],
    content: [
      {
        type: "h2",
        text: "Один запрос — одна страница"
      },
      {
        type: "p",
        text: "Посадочная должна закрывать конкретный кластер: «SEO аудит Таллин», а не «все услуги сразу». Title, H1 и первый экран отвечают на интент за 5 секунд."
      },
      {
        type: "p",
        text: "Для эстонского рынка адаптируйте язык и социальное доказательство под локальную аудиторию."
      },
      {
        type: "ul",
        items: [
          "Совпадение с SERP-форматом",
          "Уникальный value proposition",
          "Один главный CTA"
        ]
      },
      {
        type: "h2",
        text: "Структура блоков"
      },
      {
        type: "p",
        text: "Классическая схема: оффер → выгоды → как работает → кейсы → FAQ → CTA. Блок FAQ одновременно закрывает long-tail и даёт schema."
      },
      {
        type: "ol",
        items: [
          "Hero с ключом в H1",
          "Социальное доказательство",
          "Детали услуги и цены",
          "Форма или кликабельный телефон"
        ]
      },
      {
        type: "h2",
        text: "Доверие и E-E-A-T на лендинге"
      },
      {
        type: "p",
        text: "Логотипы клиентов, сертификаты, реальные отзывы, фото команды. Для YMYL — юридическая информация и прозрачные условия."
      },
      {
        type: "p",
        text: "Скорость загрузки критична: тяжёлые слайдеры режут и SEO, и конверсию на мобильных."
      },
      {
        type: "h2",
        text: "Тесты и итерации"
      },
      {
        type: "p",
        text: "Меняйте заголовки, CTA и порядок блоков по данным heatmap и A/B. Улучшение CTR в Search Console иногда важнее добавления ключей."
      },
      {
        type: "ul",
        items: [
          "Отслеживание микроконверсий",
          "Сравнение с конкурентами в SERP",
          "Обновление кейсов",
          "Локальные landing под города"
        ]
      },
      {
        type: "links",
        title: "Полезные материалы",
        items: [
          {
            label: "SEO-услуги",
            href: "/ru/services"
          },
          {
            label: "Тарифы",
            href: "/ru/pricing"
          },
          {
            label: "Контакты",
            href: "/ru/contact"
          }
        ]
      },
      {
        type: "cta",
        title: "Нужна помощь с SEO?",
        description: "Закажите бесплатный SEO-аудит — мы покажем точки роста вашего сайта в Google.",
        buttonLabel: "Получить SEO-аудит",
        href: "/ru/contact"
      }
    ],
    faq: [
      {
        question: "Нужен ли длинный текст на коммерческой странице?",
        answer: "Достаточно глубины для интента: обычно 600–1500 слов с FAQ и кейсами. Главное — не дублировать другие услуги."
      },
      {
        question: "Можно ли использовать один шаблон на все города?",
        answer: "Только с уникальными блоками: кейсы, отзывы, FAQ по району. Иначе — тонкий контент и фильтр Google."
      },
      {
        question: "Как совместить SEO и минималистичный дизайн?",
        answer: "Ключи в видимых заголовках и FAQ, остальное — в раскрывающихся блоках. Не прячьте весь текст в изображения."
      }
    ]
  },
  {
    locale: "et",
    translationKey: "landing-page-seo",
    slug: "maandumislehe-seo",
    title: "Maandumislehe SEO: kuidas teenuseid Google'is nähtavaks teha",
    metaTitle: "Maandumislehe SEO: optimeerimine",
    metaDescription: "Juhend landing page SEO-le: struktuur, pakkumine, tõestus, schema ja testid positsioonide ja päringute kasvuks.",
    date: "2025-08-18",
    author: "RankBoost Team",
    category: "Content SEO",
    excerpt: "SEO maandumislehed: kuidas optimeerida kommerts-URL-e nii positsioonide kui konversioonide jaoks ilma UX-i ohverdamata.",
    tags: [
      "maandumisleht",
      "konversioon",
      "on-page SEO"
    ],
    content: [
      {
        type: "h2",
        text: "Üks päring — üks leht"
      },
      {
        type: "p",
        text: "Leht peab katma konkreetse klastri, mitte kõiki teenuseid korraga. Title, H1 ja esimene ekraan vastavad 5 sekundiga."
      },
      {
        type: "p",
        text: "Eesti turul kohanda keel ja sotsiaalset tõestust."
      },
      {
        type: "ul",
        items: [
          "SERP formaadi vastavus",
          "Unikaalne väärtuspakkumine",
          "Üks peamine CTA"
        ]
      },
      {
        type: "h2",
        text: "Ploki struktuur"
      },
      {
        type: "p",
        text: "Pakkumine → eelised → protsess → juhtumid → KKK → CTA. KKK annab long-tail'i ja schema võimaluse."
      },
      {
        type: "ol",
        items: [
          "Hero H1-ga",
          "Sotsiaalne tõestus",
          "Teenuse detailid ja hinnad",
          "Vorm või telefon"
        ]
      },
      {
        type: "h2",
        text: "Usaldus ja E-E-A-T"
      },
      {
        type: "p",
        text: "Kliendilogod, sertifikaadid, päris arvustused, meeskonna fotod. YMYL puhul õiguslik info."
      },
      {
        type: "p",
        text: "Kiirus on kriitiline mobiilis."
      },
      {
        type: "h2",
        text: "Testimine ja iteratsioon"
      },
      {
        type: "p",
        text: "Muuda pealkirju ja CTA-d andmete põhjal. CTR parandus Search Console'is võib olla olulisem kui rohkem märksõnu."
      },
      {
        type: "ul",
        items: [
          "Mikrokonversioonid",
          "Konkurentide SERP võrdlus",
          "Juhtumite uuendus",
          "Linnaspetsiifilised lehed"
        ]
      },
      {
        type: "links",
        title: "Kasulikud lingid",
        items: [
          {
            label: "SEO teenused",
            href: "/et/services"
          },
          {
            label: "Hinnakiri",
            href: "/et/pricing"
          },
          {
            label: "Kontakt",
            href: "/et/contact"
          }
        ]
      },
      {
        type: "cta",
        title: "Vajate abi SEO-ga?",
        description: "Tellige tasuta SEO audit — näitame teie veebilehe kasvupunkte Google'is.",
        buttonLabel: "Küsi SEO-auditit",
        href: "/et/contact"
      }
    ],
    faq: [
      {
        question: "Kas kommertslehel peab olema pikk tekst?",
        answer: "600–1500 sõna KKK ja juhtumitega on sageli piisav, kui intent on kaetud."
      },
      {
        question: "Kas üks šabloon kõigile linnadele?",
        answer: "Ainult unikaalsete plokkidega, muidu õhuke sisu."
      },
      {
        question: "SEO ja minimalistlik disain?",
        answer: "Märksõnad pealkirjades ja KKK-s, ülejäänu lükatesse. Ära peida teksti piltidesse."
      }
    ]
  },
  {
    locale: "en",
    translationKey: "landing-page-seo",
    slug: "landing-page-seo",
    title: "Landing Page SEO: How to Promote Services in Google",
    metaTitle: "Landing Page SEO: Optimize for Leads",
    metaDescription: "Landing page SEO guide: structure, offer, proof, schema, and testing to grow rankings and form fills.",
    date: "2025-08-22",
    author: "RankBoost Team",
    category: "Content SEO",
    excerpt: "Landing page SEO: optimize commercial URLs for rankings and conversions together — without sacrificing UX for keyword density.",
    tags: [
      "landing page SEO",
      "conversion",
      "on-page SEO"
    ],
    content: [
      {
        type: "h2",
        text: "One query, one page"
      },
      {
        type: "p",
        text: "Each landing page should match one cluster — 'SEO audit Tallinn', not every service at once. Title, H1, and hero answer intent in five seconds."
      },
      {
        type: "p",
        text: "For Estonia, adapt language and social proof to the local audience."
      },
      {
        type: "ul",
        items: [
          "Match dominant SERP format",
          "Clear unique value proposition",
          "Single primary CTA"
        ]
      },
      {
        type: "h2",
        text: "Block structure that converts"
      },
      {
        type: "p",
        text: "Classic flow: offer, benefits, process, case studies, FAQ, CTA. FAQ captures long-tail queries and enables schema markup."
      },
      {
        type: "ol",
        items: [
          "Hero with keyword in H1",
          "Social proof",
          "Service detail and pricing signals",
          "Form or tap-to-call"
        ]
      },
      {
        type: "h2",
        text: "Trust and E-E-A-T"
      },
      {
        type: "p",
        text: "Client logos, certifications, real reviews, team photos. YMYL pages need legal transparency."
      },
      {
        type: "p",
        text: "Speed matters: heavy sliders hurt SEO and mobile conversion."
      },
      {
        type: "h2",
        text: "Testing and iteration"
      },
      {
        type: "p",
        text: "Iterate headlines, CTAs, and block order via heatmaps and A/B tests. CTR gains in Search Console sometimes beat more keywords."
      },
      {
        type: "ul",
        items: [
          "Micro-conversion tracking",
          "SERP competitor benchmarks",
          "Refresh case studies",
          "City-specific landings"
        ]
      },
      {
        type: "links",
        title: "Helpful links",
        items: [
          {
            label: "SEO Services",
            href: "/en/services"
          },
          {
            label: "Pricing",
            href: "/en/pricing"
          },
          {
            label: "Contact",
            href: "/en/contact"
          }
        ]
      },
      {
        type: "cta",
        title: "Need SEO help?",
        description: "Order a free SEO audit — we'll show your website's growth opportunities on Google.",
        buttonLabel: "Get an SEO Audit",
        href: "/en/contact"
      }
    ],
    faq: [
      {
        question: "How much copy does a commercial page need?",
        answer: "Usually 600–1500 words with FAQ and proof if intent is fully covered. Avoid overlapping other services."
      },
      {
        question: "Can I reuse one template for every city?",
        answer: "Only with unique local blocks — cases, reviews, district FAQ. Otherwise you risk thin content."
      },
      {
        question: "How to balance SEO and minimal design?",
        answer: "Place keywords in visible headings and FAQ; use accordions for depth. Never hide core copy in images."
      }
    ]
  },
  {
    locale: "ru",
    translationKey: "seo-services-estonia",
    slug: "seo-dlya-uslug-v-estonii",
    title: "SEO для услуг в Эстонии: как получать заявки с сайта",
    metaTitle: "SEO-услуги в Эстонии: что заказать",
    metaDescription: "Какие SEO-услуги нужны бизнесу в Эстонии: технический аудит, контент, local SEO, мультиязычность и типовые пакеты агентств.",
    date: "2025-08-27",
    author: "RankBoost Team",
    category: "Local SEO",
    excerpt: "Обзор SEO-услуг на рынке Эстонии: что входит в аудит, сопровождение и локальное продвижение, и как выбрать формат под ваш бизнес.",
    tags: [
      "SEO услуги",
      "Эстония",
      "продвижение"
    ],
    content: [
      {
        type: "h2",
        text: "Какие SEO-услуги востребованы в Эстонии"
      },
      {
        type: "p",
        text: "Локальный бизнес чаще заказывает Google Business Profile, локальные страницы и отзывы. B2B и e-commerce — технический аудит, семантику и контент на нескольких языках."
      },
      {
        type: "p",
        text: "Рынок компактный: агентства в Таллине работают с et, ru, en; важно понимание европейского GDPR и локальных каталогов."
      },
      {
        type: "ul",
        items: [
          "Local SEO и Maps",
          "Технический аудит",
          "Контент и копирайтинг",
          "Мультиязычная настройка"
        ]
      },
      {
        type: "h2",
        text: "Форматы сотрудничества"
      },
      {
        type: "p",
        text: "Разовый аудит с дорожной картой, ежемесячное сопровождение, проект на запуск сайта — три базовых формата. Выбор зависит от стадии бизнеса и внутренних ресурсов."
      },
      {
        type: "ol",
        items: [
          "Аудит + приоритетный backlog",
          "Retainer с отчётом",
          "Контент-пакеты",
          "Консультации для in-house"
        ]
      },
      {
        type: "h2",
        text: "Что должно быть в deliverables"
      },
      {
        type: "p",
        text: "Прозрачный список задач, доступ к отчётам, рекомендации с приоритетом, а не PDF на 100 страниц без действий. Для локального SEO — отчёт по GBP и позициям в Maps."
      },
      {
        type: "p",
        text: "Контентные услуги должны включать редактуру и размещение на сайте, иначе тексты остаются в папке."
      },
      {
        type: "h2",
        text: "Ожидания и сроки"
      },
      {
        type: "p",
        text: "Первые улучшения по технике и GBP — недели. Органический рост по коммерческим запросам — месяцы. Агентство должно объяснить это до подписания договора."
      },
      {
        type: "ul",
        items: [
          "KPI в договоре",
          "Ежемесячный созвон",
          "Доступ к аккаунтам клиента",
          "План на квартал"
        ]
      },
      {
        type: "links",
        title: "Полезные материалы",
        items: [
          {
            label: "SEO-услуги",
            href: "/ru/services"
          },
          {
            label: "Тарифы",
            href: "/ru/pricing"
          },
          {
            label: "Контакты",
            href: "/ru/contact"
          }
        ]
      },
      {
        type: "cta",
        title: "Нужна помощь с SEO?",
        description: "Закажите бесплатный SEO-аудит — мы покажем точки роста вашего сайта в Google.",
        buttonLabel: "Получить SEO-аудит",
        href: "/ru/contact"
      }
    ],
    faq: [
      {
        question: "Нужен ли SEO-специалист в штате в Эстонии?",
        answer: "Для крупного e-commerce — часто да. Для локального сервиса достаточно агентства 5–15 часов в месяц плюс ваши отзывы и контент."
      },
      {
        question: "Чем отличается SEO в Эстонии от Германии?",
        answer: "Меньший объём запросов, три языка, сильнее роль Maps. Стратегия компактнее, но мультиязычность обязательна."
      },
      {
        question: "Включают ли услуги ссылки?",
        answer: "Этичные агентства делают outreach и PR, а не покупку пакетов. Уточняйте метод и риски в договоре."
      }
    ]
  },
  {
    locale: "et",
    translationKey: "seo-services-estonia",
    slug: "teenuste-seo-eestis",
    title: "Teenuste SEO Eestis: kuidas saada veebilehelt rohkem päringuid",
    metaTitle: "SEO teenused Eestis: mida tellida",
    metaDescription: "Milliseid SEO teenuseid Eesti ettevõte vajab: tehniline audit, sisu, kohalik SEO, mitmekeelsus ja tüüpilised paketid.",
    date: "2025-08-31",
    author: "RankBoost Team",
    category: "Local SEO",
    excerpt: "SEO teenuste ülevaade Eesti turul: mis kuulub auditisse, jätkavasse töösse ja kohalikku edendamisse ning kuidas valida vorming.",
    tags: [
      "SEO teenused",
      "Eesti",
      "turundus"
    ],
    content: [
      {
        type: "h2",
        text: "Millised SEO teenused on Eestis nõutud"
      },
      {
        type: "p",
        text: "Kohalik ettevõte tellib sageli GBP, linnapõhised lehed ja arvustused. B2B ja e-pood vajavad auditit, semantikat ja mitmekeelset sisu."
      },
      {
        type: "p",
        text: "Turg on kompaktne: agentuurid töötavad et, ru, en keeles ja tunnevad GDPR ning kohalikke katalooge."
      },
      {
        type: "ul",
        items: [
          "Kohalik SEO",
          "Tehniline audit",
          "Sisutootmine",
          "Mitmekeelne seadistus"
        ]
      },
      {
        type: "h2",
        text: "Koostöö vormid"
      },
      {
        type: "p",
        text: "Ühekordne audit, igakuine retainer või projekt uue saidi käivitamisel — valik sõltub etapist ja ressurssidest."
      },
      {
        type: "ol",
        items: [
          "Audit + prioriteedid",
          "Retainer raportiga",
          "Sisupaketid",
          "Konsultatsioon in-house'ile"
        ]
      },
      {
        type: "h2",
        text: "Mida deliverable'id peaksid sisaldama"
      },
      {
        type: "p",
        text: "Läbipaistev ülesannete nimekiri, juurdepääs raportitele ja prioriteetsed soovitused. Kohalik SEO — GBP ja Maps aruanne."
      },
      {
        type: "p",
        text: "Sisuteenus peaks sisaldama avaldamist saidil."
      },
      {
        type: "h2",
        text: "Ootused ja ajakava"
      },
      {
        type: "p",
        text: "Tehnika ja GBP parandused — nädalad. Kommerts-päringute orgaaniline kasv — kuud. Hea partner selgitab seda ette."
      },
      {
        type: "ul",
        items: [
          "KPI lepingus",
          "Igakuine koosolek",
          "Kliendi kontod",
          "Kvartaliplaan"
        ]
      },
      {
        type: "links",
        title: "Kasulikud lingid",
        items: [
          {
            label: "SEO teenused",
            href: "/et/services"
          },
          {
            label: "Hinnakiri",
            href: "/et/pricing"
          },
          {
            label: "Kontakt",
            href: "/et/contact"
          }
        ]
      },
      {
        type: "cta",
        title: "Vajate abi SEO-ga?",
        description: "Tellige tasuta SEO audit — näitame teie veebilehe kasvupunkte Google'is.",
        buttonLabel: "Küsi SEO-auditit",
        href: "/et/contact"
      }
    ],
    faq: [
      {
        question: "Kas vajan SEO spetsialisti palgale?",
        answer: "Suurel e-poel sageli jah. Kohalikul teenusel piisab agentuurist 5–15 tundi kuus pluss teie arvustused."
      },
      {
        question: "Mis eristab Eesti SEO-d Saksamaast?",
        answer: "Väiksem maht, kolm keelt, tugevam Maps. Strateegia on kompaktsem, kuid mitmekeelsus kohustuslik."
      },
      {
        question: "Kas teenused sisaldavad linke?",
        answer: "Eetilised agentuurid teevad outreach'i, mitte pakkide ostmist. Küsi meetodit lepingus."
      }
    ]
  },
  {
    locale: "en",
    translationKey: "seo-services-estonia",
    slug: "seo-for-services-in-estonia",
    title: "SEO for Services in Estonia: How to Get More Leads from a Website",
    metaTitle: "SEO Services in Estonia: What to Order",
    metaDescription: "SEO services Estonian businesses need: technical audit, content, local SEO, multilingual setup, and typical agency packages explained.",
    date: "2025-09-05",
    author: "RankBoost Team",
    category: "Local SEO",
    excerpt: "Overview of SEO services in Estonia: audits, retainers, local SEO, and how to pick the right engagement model for your business.",
    tags: [
      "SEO services",
      "Estonia",
      "digital marketing"
    ],
    content: [
      {
        type: "h2",
        text: "In-demand SEO services in Estonia"
      },
      {
        type: "p",
        text: "Local businesses need GBP, city pages, and reviews. B2B and ecommerce need technical audits, keyword strategy, and multilingual content."
      },
      {
        type: "p",
        text: "The market is compact: Tallinn agencies serve et, ru, en and understand GDPR plus local directories."
      },
      {
        type: "ul",
        items: [
          "Local SEO and Maps",
          "Technical audits",
          "Content production",
          "Multilingual SEO setup"
        ]
      },
      {
        type: "h2",
        text: "Engagement models"
      },
      {
        type: "p",
        text: "One-off audit, monthly retainer, or launch project — pick based on business stage and in-house capacity."
      },
      {
        type: "ol",
        items: [
          "Audit plus prioritized backlog",
          "Retainer with reporting",
          "Content packages",
          "Consulting for in-house teams"
        ]
      },
      {
        type: "h2",
        text: "What deliverables should include"
      },
      {
        type: "p",
        text: "Transparent task lists, report access, and prioritized actions — not a 100-page PDF with no implementation. Local SEO needs GBP and Maps reporting."
      },
      {
        type: "p",
        text: "Content services should include publishing on your site, not just documents in a folder."
      },
      {
        type: "h2",
        text: "Expectations and timelines"
      },
      {
        type: "p",
        text: "Technical and GBP fixes show in weeks. Commercial organic growth takes months. Good partners explain that before you sign."
      },
      {
        type: "ul",
        items: [
          "Contract KPIs",
          "Monthly review calls",
          "Client-owned accounts",
          "Quarterly roadmap"
        ]
      },
      {
        type: "links",
        title: "Helpful links",
        items: [
          {
            label: "SEO Services",
            href: "/en/services"
          },
          {
            label: "Pricing",
            href: "/en/pricing"
          },
          {
            label: "Contact",
            href: "/en/contact"
          }
        ]
      },
      {
        type: "cta",
        title: "Need SEO help?",
        description: "Order a free SEO audit — we'll show your website's growth opportunities on Google.",
        buttonLabel: "Get an SEO Audit",
        href: "/en/contact"
      }
    ],
    faq: [
      {
        question: "Do I need an in-house SEO hire in Estonia?",
        answer: "Large ecommerce often yes. Local services can run on 5–15 agency hours monthly plus your reviews and input."
      },
      {
        question: "How is Estonian SEO different from Germany?",
        answer: "Smaller query volume, three languages, stronger Maps role. Strategy is tighter but multilingual work is mandatory."
      },
      {
        question: "Do services include link building?",
        answer: "Ethical agencies do outreach and PR, not bulk packages. Clarify methods and risks in the contract."
      }
    ]
  },
  {
    locale: "ru",
    translationKey: "content-plan",
    slug: "kontent-plan-dlya-seo",
    title: "Контент-план для SEO: как системно растить трафик",
    metaTitle: "SEO контент-план: системный рост трафика",
    metaDescription: "Пошаговое создание контент-плана для SEO: приоритеты тем, календарь, форматы и измерение результата по лидам и позициям.",
    date: "2025-09-09",
    author: "RankBoost Team",
    category: "Content SEO",
    excerpt: "Как составить SEO контент-план: темы по кластерам, частота публикаций, ответственные и связь статей с коммерческими страницами.",
    tags: [
      "контент-план",
      "контент-стратегия",
      "блог"
    ],
    content: [
      {
        type: "h2",
        text: "От семантики к темам"
      },
      {
        type: "p",
        text: "Контент-план строится на keyword map: каждая строка — тема, интент, целевой URL, формат (гайд, сравнение, чек-лист) и приоритет."
      },
      {
        type: "p",
        text: "Сначала закройте пробелы на деньгах-страницах, затем расширяйте информационный кластер, который кормит их ссылками."
      },
      {
        type: "ul",
        items: [
          "Кластеры из keyword research",
          "Сезонные темы",
          "Обновления старых статей",
          "Конкурентный gap-анализ"
        ]
      },
      {
        type: "h2",
        text: "Календарь и ресурсы"
      },
      {
        type: "p",
        text: "Реалистичный ритм для SMB — 2–4 материала в месяц. Назначьте автора, редактора, SEO-ревью и дату публикации. Буфер 2 недели на задержки."
      },
      {
        type: "ol",
        items: [
          "Шаблон брифа на статью",
          "Чек-лист on-page перед публикацией",
          "План продвижения в соцсетях",
          "Внутренние ссылки при публикации"
        ]
      },
      {
        type: "h2",
        text: "Форматы, которые работают в SEO"
      },
      {
        type: "p",
        text: "Гайды, сравнения, калькуляторы, кейсы, FAQ-хабы. Для Эстонии добавляйте локальные примеры — это отличает вас от переведённого глобального контента."
      },
      {
        type: "p",
        text: "Переиспользуйте контент: статья → короткий пост → рассылка, но канонический URL один."
      },
      {
        type: "h2",
        text: "Измерение эффективности"
      },
      {
        type: "p",
        text: "Через 3–6 месяцев оценивайте трафик, позиции, внутренние переходы на услуги и лиды. Отключайте темы без спроса, удваивайте ставку на работающие кластеры."
      },
      {
        type: "ul",
        items: [
          "Отчёт по URL в Search Console",
          "Конверсии из блога",
          "Time on page и scroll",
          "Обновление контент-плана ежеквартально"
        ]
      },
      {
        type: "links",
        title: "Полезные материалы",
        items: [
          {
            label: "SEO-услуги",
            href: "/ru/services"
          },
          {
            label: "Тарифы",
            href: "/ru/pricing"
          },
          {
            label: "Контакты",
            href: "/ru/contact"
          }
        ]
      },
      {
        type: "cta",
        title: "Нужна помощь с SEO?",
        description: "Закажите бесплатный SEO-аудит — мы покажем точки роста вашего сайта в Google.",
        buttonLabel: "Получить SEO-аудит",
        href: "/ru/contact"
      }
    ],
    faq: [
      {
        question: "С чего начать контент-план с нуля?",
        answer: "С 10–20 тем из топ-кластеров семантики и 3 коммерческих страниц, которые они должны поддерживать."
      },
      {
        question: "Как часто обновлять старые статьи?",
        answer: "Раз в 6–12 месяцев для evergreen, чаще для быстро меняющихся тем (цены, законы, инструменты)."
      },
      {
        question: "Нужен ли отдельный план на каждый язык?",
        answer: "Да. Темы могут пересекаться, но формулировки, примеры и спрос различаются между et, ru и en."
      }
    ]
  },
  {
    locale: "et",
    translationKey: "content-plan",
    slug: "seo-sisuplaan",
    title: "SEO sisuplaan: kuidas süsteemselt liiklust kasvatada",
    metaTitle: "SEO sisuplaan: süsteemne liikluse kasv",
    metaDescription: "Samm-sammuline SEO sisuplaani loomine: teemade prioriteedid, kalender, formaadid ja tulemuste mõõtmine.",
    date: "2025-09-13",
    author: "RankBoost Team",
    category: "Content SEO",
    excerpt: "Kuidas koostada SEO sisuplaan: teemad klastrite järgi, avaldamise sagedus, vastutajad ja seos müügilehtedega.",
    tags: [
      "sisuplaan",
      "sisustrateegia",
      "blogi"
    ],
    content: [
      {
        type: "h2",
        text: "Semantikast teemadeni"
      },
      {
        type: "p",
        text: "Sisuplaan põhineb märksõnade kaardil: teema, kavatsus, URL, formaat ja prioriteet."
      },
      {
        type: "p",
        text: "Esmalt täida müügilehtede lüngad, seejärel laienda infoklastrit siselingiga."
      },
      {
        type: "ul",
        items: [
          "Klastrid uuringust",
          "Hooajalised teemad",
          "Vanade artiklite uuendus",
          "Konkurentsianalüüs"
        ]
      },
      {
        type: "h2",
        text: "Kalender ja ressursid"
      },
      {
        type: "p",
        text: "SMB jaoks 2–4 materjali kuus on realistlik. Määra autor, toimetaja, SEO ülevaatus ja avaldamise kuupäev."
      },
      {
        type: "ol",
        items: [
          "Artikli briifi šabloon",
          "On-page kontrollnimekiri",
          "Sotsiaalne levitamine",
          "Siselingid avaldamisel"
        ]
      },
      {
        type: "h2",
        text: "Töökindlad formaadid"
      },
      {
        type: "p",
        text: "Juhendid, võrdlused, kalkulaatorid, juhtumid, KKK hub'id. Eesti näited eristavad globaalsest tõlkesisust."
      },
      {
        type: "p",
        text: "Taaskasuta sisu kanalites, kuid üks kanooniline URL."
      },
      {
        type: "h2",
        text: "Tulemuste mõõtmine"
      },
      {
        type: "p",
        text: "3–6 kuu pärast hinda liiklust, positsioone ja päringuid. Lõpeta teemad ilma nõudlata, investeeri töötavatesse klastritesse."
      },
      {
        type: "ul",
        items: [
          "Search Console URL raport",
          "Blogi konversioonid",
          "Kasutajakäitumine",
          "Kvartaalne plaani uuendus"
        ]
      },
      {
        type: "links",
        title: "Kasulikud lingid",
        items: [
          {
            label: "SEO teenused",
            href: "/et/services"
          },
          {
            label: "Hinnakiri",
            href: "/et/pricing"
          },
          {
            label: "Kontakt",
            href: "/et/contact"
          }
        ]
      },
      {
        type: "cta",
        title: "Vajate abi SEO-ga?",
        description: "Tellige tasuta SEO audit — näitame teie veebilehe kasvupunkte Google'is.",
        buttonLabel: "Küsi SEO-auditit",
        href: "/et/contact"
      }
    ],
    faq: [
      {
        question: "Kust sisuplaan nullist alustada?",
        answer: "10–20 teemast TOP klastritest ja 3 müügilehest, mida need toetavad."
      },
      {
        question: "Kui tihti vanu artikleid uuendada?",
        answer: "Evergreen 6–12 kuu tagant, kiiresti muutuvad teemad sagedamini."
      },
      {
        question: "Kas iga keel vajab oma plaani?",
        answer: "Jah. Teemad võivad kattuda, kuid nõudlus ja näited erinevad."
      }
    ]
  },
  {
    locale: "en",
    translationKey: "content-plan",
    slug: "seo-content-plan",
    title: "SEO Content Plan: How to Grow Traffic Systematically",
    metaTitle: "SEO Content Plan: Grow Traffic Systematically",
    metaDescription: "Step-by-step SEO content planning: topic priorities, editorial calendar, formats, and measuring leads and rankings.",
    date: "2025-09-18",
    author: "RankBoost Team",
    category: "Content SEO",
    excerpt: "How to build an SEO content plan: cluster-based topics, publishing cadence, owners, and links from articles to commercial pages.",
    tags: [
      "content plan",
      "content strategy",
      "SEO blog"
    ],
    content: [
      {
        type: "h2",
        text: "From keywords to topics"
      },
      {
        type: "p",
        text: "Your content plan flows from the keyword map: topic, intent, target URL, format (guide, comparison, checklist), and priority."
      },
      {
        type: "p",
        text: "Fill gaps on money pages first, then grow informational clusters that link to them."
      },
      {
        type: "ul",
        items: [
          "Clusters from keyword research",
          "Seasonal themes",
          "Legacy article refreshes",
          "Competitor gap analysis"
        ]
      },
      {
        type: "h2",
        text: "Calendar and resourcing"
      },
      {
        type: "p",
        text: "A realistic SMB cadence is 2–4 pieces monthly. Assign writer, editor, SEO review, and publish date. Keep a two-week buffer."
      },
      {
        type: "ol",
        items: [
          "Article brief template",
          "Pre-publish on-page checklist",
          "Distribution plan",
          "Internal links on go-live"
        ]
      },
      {
        type: "h2",
        text: "Formats that perform in SEO"
      },
      {
        type: "p",
        text: "Guides, comparisons, calculators, case studies, FAQ hubs. In Estonia, local examples beat translated global content."
      },
      {
        type: "p",
        text: "Repurpose across channels, but one canonical URL."
      },
      {
        type: "h2",
        text: "Measuring content ROI"
      },
      {
        type: "p",
        text: "After 3–6 months, review traffic, rankings, clicks to services, and leads. Cut topics with no demand; double down on winning clusters."
      },
      {
        type: "ul",
        items: [
          "Search Console URL report",
          "Blog-assisted conversions",
          "Engagement metrics",
          "Quarterly plan refresh"
        ]
      },
      {
        type: "links",
        title: "Helpful links",
        items: [
          {
            label: "SEO Services",
            href: "/en/services"
          },
          {
            label: "Pricing",
            href: "/en/pricing"
          },
          {
            label: "Contact",
            href: "/en/contact"
          }
        ]
      },
      {
        type: "cta",
        title: "Need SEO help?",
        description: "Order a free SEO audit — we'll show your website's growth opportunities on Google.",
        buttonLabel: "Get an SEO Audit",
        href: "/en/contact"
      }
    ],
    faq: [
      {
        question: "Where do I start a content plan from scratch?",
        answer: "Ten to twenty topics from top keyword clusters plus three commercial pages they should support."
      },
      {
        question: "How often to refresh old posts?",
        answer: "Every 6–12 months for evergreen; more often for fast-moving topics like pricing or regulations."
      },
      {
        question: "Separate plan per language?",
        answer: "Yes. Topics may overlap, but queries, examples, and demand differ across et, ru, and en."
      }
    ]
  },
  {
    locale: "ru",
    translationKey: "seo-report",
    slug: "seo-otchet",
    title: "SEO-отчет: какие показатели действительно важны",
    metaTitle: "SEO-отчёт: важные показатели",
    metaDescription: "Структура SEO-отчёта для бизнеса: KPI, источники данных, частота и как связать SEO с выручкой и заявками.",
    date: "2025-09-22",
    author: "RankBoost Team",
    category: "SEO Strategy",
    excerpt: "Какие метрики включать в SEO-отчёт для руководства: трафик, видимость, лиды и техническое здоровье — без воды и vanity metrics.",
    tags: [
      "SEO отчёт",
      "аналитика",
      "KPI"
    ],
    content: [
      {
        type: "h2",
        text: "Зачем нужен SEO-отчёт"
      },
      {
        type: "p",
        text: "Отчёт связывает работу подрядчика или in-house команды с бизнес-целями. Без метрик SEO превращается в «чёрный ящик», а бюджет сложно защитить."
      },
      {
        type: "p",
        text: "Хороший отчёт отвечает: что сделали, что изменилось, что дальше и где нужна помощь клиента."
      },
      {
        type: "ul",
        items: [
          "Прозрачность для стейкхолдеров",
          "Основа для решений по бюджету",
          "Фиксация договорённостей"
        ]
      },
      {
        type: "h2",
        text: "Ключевые метрики"
      },
      {
        type: "p",
        text: "Органический трафик по landing pages, конверсии из поиска, видимость по целевым кластерам, позиции (с оговоркой о волатильности), индексация и Core Web Vitals."
      },
      {
        type: "ol",
        items: [
          "Сессии и пользователи organic",
          "Цели: формы, звонки, покупки",
          "Search Console: клики, CTR, показы",
          "GBP: звонки и маршруты для local"
        ]
      },
      {
        type: "h2",
        text: "Чего избегать в отчётах"
      },
      {
        type: "p",
        text: "Сотни ключей «в топ-100» без трафика, PageRank и прочие устаревшие метрики, скриншоты без контекста — не помогают принимать решения."
      },
      {
        type: "p",
        text: "Не смешивайте брендовый рост от офлайн-рекламы с эффектом SEO без сегментации."
      },
      {
        type: "h2",
        text: "Частота и формат"
      },
      {
        type: "p",
        text: "Ежемесячно — операционный отчёт; ежеквартально — стратегический обзор с пересмотром приоритетов. Дашборд в Looker Studio плюс короткий комментарий эксперта."
      },
      {
        type: "ul",
        items: [
          "Сравнение с прошлым периодом",
          "План задач на следующий месяц",
          "Блок рисков и блокеров",
          "Связь с выручкой где возможно"
        ]
      },
      {
        type: "links",
        title: "Полезные материалы",
        items: [
          {
            label: "SEO-услуги",
            href: "/ru/services"
          },
          {
            label: "Тарифы",
            href: "/ru/pricing"
          },
          {
            label: "Контакты",
            href: "/ru/contact"
          }
        ]
      },
      {
        type: "cta",
        title: "Нужна помощь с SEO?",
        description: "Закажите бесплатный SEO-аудит — мы покажем точки роста вашего сайта в Google.",
        buttonLabel: "Получить SEO-аудит",
        href: "/ru/contact"
      }
    ],
    faq: [
      {
        question: "Сколько страниц должен занимать отчёт?",
        answer: "1–3 страницы текста плюс дашборд достаточно для SMB. Главное — выводы и действия, не объём."
      },
      {
        question: "Нужен ли rank tracking?",
        answer: "Да, по ограниченному списку целевых запросов. Не отслеживайте тысячи ключей — фокус на коммерческих кластерах."
      },
      {
        question: "Как показать ROI SEO?",
        answer: "Сопоставьте органические лиды с средним чеком и сравните стоимость привлечения с Ads за тот же период."
      }
    ]
  },
  {
    locale: "et",
    translationKey: "seo-report",
    slug: "seo-raport",
    title: "SEO raport: millised mõõdikud on tegelikult olulised",
    metaTitle: "SEO raport: olulised mõõdikud",
    metaDescription: "SEO raporti struktuur ettevõttele: KPI-d, andmeallikad, sagedus ja seos müügi ja päringutega.",
    date: "2025-09-27",
    author: "RankBoost Team",
    category: "SEO Strategy",
    excerpt: "Millised mõõdikud kuuluvad SEO raportisse: liiklus, nähtavus, päringud ja tehniline tervis — ilma mõttetu statistikata.",
    tags: [
      "SEO raport",
      "analüütika",
      "KPI"
    ],
    content: [
      {
        type: "h2",
        text: "Miks SEO raport on vajalik"
      },
      {
        type: "p",
        text: "Raport seob SEO töö ärieesmärkidega. Ilma mõõdikuteta on eelarve raske põhjendada."
      },
      {
        type: "p",
        text: "Hea raport vastab: mida tehti, mis muutus, mis järgmisena."
      },
      {
        type: "ul",
        items: [
          "Läbipaistvus",
          "Eelarveotsuste alus",
          "Kokkulepete fikseerimine"
        ]
      },
      {
        type: "h2",
        text: "Põhimõõdikud"
      },
      {
        type: "p",
        text: "Orgaaniline liiklus, konversioonid, nähtavus sihtklastrites, positsioonid, indekseerimine ja Core Web Vitals."
      },
      {
        type: "ol",
        items: [
          "Organic sessioonid",
          "Vormid, kõned, ostud",
          "Search Console klikid ja CTR",
          "GBP kõned kohalikule"
        ]
      },
      {
        type: "h2",
        text: "Mida raportis vältida"
      },
      {
        type: "p",
        text: "Sajad märksõnad ilma liikluseeta, aegunud mõõdikud ja kontekstita ekraanipildid ei aita."
      },
      {
        type: "p",
        text: "Ära sega brändikampaania tõusu SEO tulemusega."
      },
      {
        type: "h2",
        text: "Sagedus ja formaat"
      },
      {
        type: "p",
        text: "Igakuine operatiivraport, kvartaalne strateegiline ülevaade. Looker Studio pluss eksperdi kommentaar."
      },
      {
        type: "ul",
        items: [
          "Võrdlus eelmise perioodiga",
          "Järgmise kuu ülesanded",
          "Riskid ja takistused",
          "Seos tuluga kui võimalik"
        ]
      },
      {
        type: "links",
        title: "Kasulikud lingid",
        items: [
          {
            label: "SEO teenused",
            href: "/et/services"
          },
          {
            label: "Hinnakiri",
            href: "/et/pricing"
          },
          {
            label: "Kontakt",
            href: "/et/contact"
          }
        ]
      },
      {
        type: "cta",
        title: "Vajate abi SEO-ga?",
        description: "Tellige tasuta SEO audit — näitame teie veebilehe kasvupunkte Google'is.",
        buttonLabel: "Küsi SEO-auditit",
        href: "/et/contact"
      }
    ],
    faq: [
      {
        question: "Kui pikk peaks raport olema?",
        answer: "1–3 lehekülge teksti ja dashboard on SMB jaoks piisav."
      },
      {
        question: "Kas vaja positsioonide jälgimist?",
        answer: "Jah, piiratud sihtnimekirjaga, mitte tuhandete märksõnadega."
      },
      {
        question: "Kuidas näidata SEO ROI-d?",
        answer: "Võrdle orgaaniliste päringute väärtust keskmise tehinguga ja Ads CPL-iga."
      }
    ]
  },
  {
    locale: "en",
    translationKey: "seo-report",
    slug: "seo-report",
    title: "SEO Report: Which Metrics Really Matter",
    metaTitle: "SEO Report: Metrics That Matter",
    metaDescription: "SEO reporting structure for business: KPIs, data sources, cadence, and tying organic search to revenue and leads.",
    date: "2025-10-01",
    author: "RankBoost Team",
    category: "SEO Strategy",
    excerpt: "Which metrics belong in an SEO report for leadership: traffic, visibility, leads, and technical health — without vanity numbers.",
    tags: [
      "SEO report",
      "analytics",
      "KPIs"
    ],
    content: [
      {
        type: "h2",
        text: "Why SEO reporting matters"
      },
      {
        type: "p",
        text: "Reports connect agency or in-house work to business goals. Without metrics, SEO becomes a black box and budgets are hard to defend."
      },
      {
        type: "p",
        text: "A strong report answers: what we did, what changed, what's next, and where we need client input."
      },
      {
        type: "ul",
        items: [
          "Stakeholder transparency",
          "Budget decision support",
          "Accountability on agreements"
        ]
      },
      {
        type: "h2",
        text: "Core metrics to include"
      },
      {
        type: "p",
        text: "Organic traffic by landing page, search conversions, visibility on target clusters, rankings (with volatility caveats), indexing health, and Core Web Vitals."
      },
      {
        type: "ol",
        items: [
          "Organic sessions and users",
          "Goals: forms, calls, purchases",
          "Search Console clicks, CTR, impressions",
          "GBP calls and directions for local"
        ]
      },
      {
        type: "h2",
        text: "What to leave out"
      },
      {
        type: "p",
        text: "Hundreds of keywords 'in top 100' with no traffic, outdated metrics, and context-free screenshots do not drive decisions."
      },
      {
        type: "p",
        text: "Do not attribute offline brand campaigns to SEO without segmentation."
      },
      {
        type: "h2",
        text: "Cadence and format"
      },
      {
        type: "p",
        text: "Monthly operational reports; quarterly strategic reviews with reprioritization. A Looker Studio dashboard plus a short expert narrative works well."
      },
      {
        type: "ul",
        items: [
          "Period-over-period comparison",
          "Next-month task plan",
          "Risks and blockers",
          "Revenue tie-in where possible"
        ]
      },
      {
        type: "links",
        title: "Helpful links",
        items: [
          {
            label: "SEO Services",
            href: "/en/services"
          },
          {
            label: "Pricing",
            href: "/en/pricing"
          },
          {
            label: "Contact",
            href: "/en/contact"
          }
        ]
      },
      {
        type: "cta",
        title: "Need SEO help?",
        description: "Order a free SEO audit — we'll show your website's growth opportunities on Google.",
        buttonLabel: "Get an SEO Audit",
        href: "/en/contact"
      }
    ],
    faq: [
      {
        question: "How long should an SEO report be?",
        answer: "One to three pages plus a dashboard is enough for SMB. Insights and actions beat length."
      },
      {
        question: "Do I need rank tracking?",
        answer: "Yes, on a focused target list. Do not track thousands of terms — prioritize commercial clusters."
      },
      {
        question: "How do I show SEO ROI?",
        answer: "Map organic leads to average deal value and compare acquisition cost with Ads for the same period."
      }
    ]
  },
  ...expertPosts2026,
];

export const allPosts = articles.map(buildPost);
