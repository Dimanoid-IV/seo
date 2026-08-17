import assert from "node:assert/strict";

import { assessArticleQualityDimensions } from "./quality-dimensions";

const safe = assessArticleQualityDimensions({
  title: "Portrait from photo",
  metaTitle: "Portrait from photo in Estonia",
  metaDescription: "A practical guide to ordering a portrait.",
  primaryKeyword: "portrait from photo",
  evidenceCount: 4,
  brandProfileAvailable: true,
  contentHtml: `<h2>Choose a photo</h2>${"<p>Choose a clear photo with natural light and visible details. Compare the format, approve the preview, and contact the studio to order a portrait from photo.</p>".repeat(8).replace(/photo\.<\/p>/g, "photo with care.</p>")}`,
});
assert.ok(safe.factualConfidence >= 80);
assert.equal(safe.criticalFlags.includes("unsafe_html"), false);

const risky = assessArticleQualityDimensions({
  title: "Guaranteed result",
  metaTitle: "",
  metaDescription: "",
  primaryKeyword: "portrait",
  evidenceCount: 0,
  brandProfileAvailable: false,
  contentHtml: '<script>alert(1)</script><p>Research shows 99% success. portrait portrait portrait portrait portrait portrait</p><a href="javascript:x">x</a>',
});
assert.ok(risky.factualConfidence < 80);
assert.ok(risky.criticalFlags.includes("unsafe_html"));

console.log("quality dimension checks passed");
