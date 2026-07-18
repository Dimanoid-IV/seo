import assert from "node:assert";

import { saasDictionary as ru } from "./dictionaries/ru";
import { localizePlanItemTitle } from "./plan-display";

// Legacy raw English action titles map to existing localized action copy.
assert.equal(
  localizePlanItemTitle({ type: "SEO_FIX", title: "Connect Google Search Console" }, ru),
  ru.autopilot.planContent.actions.connect_gsc.title
);
assert.equal(
  localizePlanItemTitle({ type: "TASK_FIX", title: "View monthly report" }, ru),
  ru.autopilot.planContent.actions.view_monthly_report.title
);

// The generic "publish first article" placeholder is labeled as a preparation
// step in the active locale, not presented as a researched topic.
assert.equal(
  localizePlanItemTitle({ type: "ARTICLE", title: "Опубликовать первую статью" }, ru),
  ru.autopilot.planContent.itemTitles.prepareFirstArticle
);
assert.equal(
  localizePlanItemTitle({ type: "ARTICLE", title: "Publish first article" }, ru),
  ru.autopilot.planContent.itemTitles.prepareFirstArticle
);

// Real researched RU titles pass through unchanged.
const realTopic = "Портрет по фото на холсте как подарок";
assert.equal(
  localizePlanItemTitle({ type: "ARTICLE", title: realTopic }, ru),
  realTopic
);

console.log("plan item title localization checks passed");
