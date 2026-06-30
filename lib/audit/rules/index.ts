import type { AuditRuleChecker } from "../rules-types";
import { checkImageAltCoverage } from "./content/images";
import { checkInternalLinksMinimum } from "./content/internal-links";
import { checkWordCountMinimum } from "./content/word-count";
import { checkResponseTime } from "./performance/response-time";
import { checkFAQSchema } from "./schema/faq";
import { checkOrganizationOrLocalBusinessSchema } from "./schema/organization";
import { checkSchemaExists } from "./schema/schema";
import { checkOpenGraphExists } from "./social/open-graph";
import { checkTwitterCardExists } from "./social/twitter";
import { checkCanonicalExists } from "./technical/canonical";
import { checkSingleH1 } from "./technical/headings";
import { checkHttps } from "./technical/https";
import { checkHtmlLangExists } from "./technical/lang";
import { checkMetaDescriptionExists } from "./technical/meta-description";
import { checkMetaDescriptionLength } from "./technical/meta-description-length";
import { checkRobotsNoindex } from "./technical/robots";
import { checkStatusCode } from "./technical/status-code";
import { checkTitleExists } from "./technical/title";
import { checkTitleLength } from "./technical/title-length";
import { checkViewportExists } from "./technical/viewport";

export { checkHttps } from "./technical/https";
export { checkStatusCode } from "./technical/status-code";
export { checkTitleExists } from "./technical/title";
export { checkTitleLength } from "./technical/title-length";
export { checkMetaDescriptionExists } from "./technical/meta-description";
export { checkMetaDescriptionLength } from "./technical/meta-description-length";
export { checkSingleH1 } from "./technical/headings";
export { checkCanonicalExists } from "./technical/canonical";
export { checkRobotsNoindex } from "./technical/robots";
export { checkViewportExists } from "./technical/viewport";
export { checkHtmlLangExists } from "./technical/lang";
export { checkOpenGraphExists } from "./social/open-graph";
export { checkTwitterCardExists } from "./social/twitter";
export { checkImageAltCoverage } from "./content/images";
export { checkInternalLinksMinimum } from "./content/internal-links";
export { checkSchemaExists } from "./schema/schema";
export { checkFAQSchema } from "./schema/faq";
export { checkOrganizationOrLocalBusinessSchema } from "./schema/organization";
export { checkWordCountMinimum } from "./content/word-count";
export { checkResponseTime } from "./performance/response-time";

/** All registered audit rule checkers in default execution order. */
export const AUDIT_RULES: readonly AuditRuleChecker[] = [
  checkHttps,
  checkStatusCode,
  checkTitleExists,
  checkTitleLength,
  checkMetaDescriptionExists,
  checkMetaDescriptionLength,
  checkSingleH1,
  checkCanonicalExists,
  checkRobotsNoindex,
  checkViewportExists,
  checkHtmlLangExists,
  checkOpenGraphExists,
  checkTwitterCardExists,
  checkImageAltCoverage,
  checkInternalLinksMinimum,
  checkSchemaExists,
  checkFAQSchema,
  checkOrganizationOrLocalBusinessSchema,
  checkWordCountMinimum,
  checkResponseTime,
];
