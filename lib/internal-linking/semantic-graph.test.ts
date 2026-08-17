import assert from "node:assert/strict";
import { findInternalLinkOpportunities, type SemanticPage } from "./semantic-graph";

const pages: SemanticPage[] = [
  { url: "https://x.test/blog/portrait-guide", locale: "en", pageType: "BLOG", title: "Portrait gift guide", headings: ["Choose a portrait"], bodyText: "portrait canvas gift family photo custom portrait", links: [], indexable: true },
  { url: "https://x.test/services/custom-portrait", locale: "en", pageType: "SERVICE", title: "Custom portrait from photo", headings: ["Order a custom portrait"], bodyText: "custom portrait canvas", links: [], indexable: true },
  { url: "https://x.test/et/portree", locale: "et", pageType: "SERVICE", title: "Portree fotost", headings: [], bodyText: "portree", links: [], indexable: true },
];
const links = findInternalLinkOpportunities(pages);
assert.ok(links.some((link) => link.sourceUrl.includes("portrait-guide") && link.targetUrl.includes("custom-portrait")));
assert.equal(links.some((link) => link.targetUrl.includes("/et/")), false);
console.log("semantic internal-link graph checks passed");
