import type { SaasLocale } from "@/lib/i18n/saas/locales";

const copy = {
  ru: {
    steps: ["Ваш сайт", "Доступ WordPress", "Подключение"],
    next: "Продолжить", back: "Назад", connect: "Проверить и подключить",
    siteHelp: "Укажите адрес WordPress. Для подключения понадобится доступ к профилю пользователя, который может создавать записи.",
    openProfile: "Открыть профиль WordPress", passwordReady: "Пароль создан — продолжить",
    passwordHelp: "Не видите блок паролей приложений? Проверьте HTTPS и ограничения защитных плагинов. Можно использовать плагин RankBoost ниже или обратиться за помощью.",
    checkHelp: "Вставьте имя пользователя и созданный пароль. Мы проверим доступ и сохраним подключение. Статьи при этом не публикуются.",
    download: "Скачать плагин WordPress (.zip)", plugin: "Подключить через плагин",
    pluginHelp: "В WordPress откройте Плагины → Добавить новый → Загрузить плагин. Выберите ZIP, установите и активируйте. Затем откройте Настройки → RankBoost и вставьте ключи ниже. Адрес сервиса: https://www.rankboost.eu.",
    refresh: "Я подключил плагин — проверить статус", pending: "Соединение ещё не подтверждено. Нажмите «Проверить соединение» в настройках плагина WordPress, затем повторите проверку здесь.",
    regenerate: "Создать новые ключи", lostKeys: "Если ключи потерялись, создайте новые и замените их в настройках плагина.",
    help: "Нужна помощь с подключением?", helpIntro: "Оставьте заявку. Специалист свяжется с вами по email, уточнит доступы и условия настройки. Пароли в заявку добавлять не нужно.",
    request: "Запросить помощь", name: "Ваше имя", email: "Email для связи", comment: "На каком шаге нужна помощь?", consent: "Можно связаться со мной по поводу подключения.",
    sent: "Заявка сохранена. Поддержка свяжется с вами по указанному email. Подключение ещё не выполнено.", failure: "Не удалось отправить заявку. Попробуйте ещё раз.",
    specialist: "Подключение со специалистом", technical: "Настроить самостоятельно (для специалиста)",
    assistedIntro: "Для этой платформы нужна настройка доступа и места публикации. Специалист поможет выполнить её один раз; затем вы сможете отправлять статьи из RankBoost.",
    manualIntro: "Для Squarespace готовим материалы для ручной вставки в редактор. Специалист поможет настроить этот процесс.",
    plan: "Перейти к контент-плану", invalidUrl: "Введите корректный HTTPS-адрес сайта.", details: "Возможности подключения",
  },
  en: {
    steps: ["Your website", "WordPress access", "Connect"],
    next: "Continue", back: "Back", connect: "Verify and connect",
    siteHelp: "Enter your WordPress address. You will need access to a user profile that can create posts.",
    openProfile: "Open WordPress profile", passwordReady: "Password created — continue",
    passwordHelp: "Cannot find Application Passwords? Check HTTPS and security plugin restrictions. You can also use the RankBoost plugin below or request help.",
    checkHelp: "Paste your username and the password you created. We will verify access and save the connection. This does not publish articles.",
    download: "Download WordPress plugin (.zip)", plugin: "Connect using the plugin",
    pluginHelp: "In WordPress, open Plugins → Add New → Upload Plugin. Choose the ZIP, install and activate it. Then open Settings → RankBoost and paste the keys below. Service address: https://www.rankboost.eu.",
    refresh: "Plugin connected — check status", pending: "Connection is not confirmed yet. Click Check connection in the WordPress plugin settings, then check again here.",
    regenerate: "Create new keys", lostKeys: "If you lost your keys, create new ones and replace them in the plugin settings.",
    help: "Need help connecting?", helpIntro: "Send a request. A specialist will contact you by email to discuss access and setup terms. Do not include passwords.",
    request: "Request help", name: "Your name", email: "Contact email", comment: "Where do you need help?", consent: "You may contact me about this connection.",
    sent: "Request saved. Support will contact you at this email. The integration is not connected yet.", failure: "Could not send your request. Please try again.",
    specialist: "Connect with a specialist", technical: "Set up manually (for specialists)",
    assistedIntro: "This platform needs access and a publishing destination configured. A specialist can help set it up once so you can then send articles from RankBoost.",
    manualIntro: "For Squarespace, we prepare content to paste into the editor. A specialist can help set up this process.",
    plan: "Open content plan", invalidUrl: "Enter a valid HTTPS website address.", details: "Connection capabilities",
  },
  et: {
    steps: ["Teie veebisait", "WordPressi ligipääs", "Ühendamine"],
    next: "Jätka", back: "Tagasi", connect: "Kontrolli ja ühenda",
    siteHelp: "Sisestage WordPressi aadress. Vajate ligipääsu kasutajaprofiilile, millel on postituste loomise õigus.",
    openProfile: "Ava WordPressi profiil", passwordReady: "Parool loodud — jätka",
    passwordHelp: "Rakenduste paroole ei kuvata? Kontrollige HTTPS-i ja turvapluginate piiranguid. Võite kasutada allolevat RankBoosti pluginat või küsida abi.",
    checkHelp: "Sisestage kasutajanimi ja loodud parool. Kontrollime ligipääsu ja salvestame ühenduse. Artikleid ei avaldata.",
    download: "Laadi alla WordPressi plugin (.zip)", plugin: "Ühenda plugina abil",
    pluginHelp: "Avage WordPressis Pluginad → Lisa uus → Laadi plugin üles. Valige ZIP, paigaldage ja aktiveerige. Seejärel avage Seaded → RankBoost ja sisestage allolevad võtmed. Teenuse aadress: https://www.rankboost.eu.",
    refresh: "Plugin ühendatud — kontrolli olekut", pending: "Ühendus pole veel kinnitatud. Vajutage WordPressi plugina seadetes ühenduse kontrollimise nuppu ja proovige siin uuesti.",
    regenerate: "Loo uued võtmed", lostKeys: "Kui võtmed kadusid, looge uued ja asendage need plugina seadetes.",
    help: "Vajate ühendamisel abi?", helpIntro: "Saatke päring. Spetsialist võtab teiega e-posti teel ühendust, et täpsustada ligipääsu ja seadistamise tingimusi. Ärge lisage paroole.",
    request: "Küsi abi", name: "Teie nimi", email: "E-posti aadress", comment: "Millises etapis vajate abi?", consent: "Minuga võib ühendamise asjus ühendust võtta.",
    sent: "Päring salvestatud. Tugi võtab teiega e-posti teel ühendust. Integratsioon pole veel ühendatud.", failure: "Päringu saatmine ebaõnnestus. Proovige uuesti.",
    specialist: "Ühenda spetsialisti abiga", technical: "Seadista käsitsi (spetsialistile)",
    assistedIntro: "Selle platvormi jaoks tuleb seadistada ligipääs ja avaldamise sihtkoht. Spetsialist aitab seda teha, et saaksite seejärel RankBoostist artikleid saata.",
    manualIntro: "Squarespace'i jaoks valmistame sisu ette redaktorisse kleepimiseks. Spetsialist aitab protsessi seadistada.",
    plan: "Ava sisuplaan", invalidUrl: "Sisestage korrektne HTTPS-veebiaadress.", details: "Ühenduse võimalused",
  },
};

export function setupCopy(locale: SaasLocale) { return copy[locale]; }

export function wordpressProfileUrl(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) return null;
    url.search = "";
    url.hash = "";
    url.pathname = `${url.pathname.replace(/\/$/, "")}/wp-admin/profile.php`;
    return url.toString();
  } catch { return null; }
}
