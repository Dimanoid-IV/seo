/**
 * Run with: npx tsx lib/brand-kit/extract-brand-kit.test.ts
 */
import assert from "node:assert/strict";

import {
  readBrandKitFromBusinessGoals,
  writeBrandKitIntoBusinessGoals,
} from "./business-goals";
import { extractBrandKitFromHtml } from "./extract-brand-kit";

const html = `
<!doctype html>
<html>
  <head>
    <meta name="theme-color" content="#ff3366" />
    <style>
      :root { --brand: #ff3366; --accent: #1455ff; --muted: #f8fafc; }
      .cta { background: rgb(20, 85, 255); color: #ffffff; }
    </style>
  </head>
  <body>
    <a style="background-color:#18a058;color:#fff">Order now</a>
  </body>
</html>`;

const kit = extractBrandKitFromHtml({
  websiteUrl: "https://popart.ee",
  html,
});

assert.equal(kit.primaryColor, "#ff3366");
assert.ok(kit.palette.includes("#1455ff"));
assert.ok(kit.palette.includes("#18a058"));
assert.equal(kit.confidence, "high");
assert.deepEqual(kit.sourceUrls, ["https://popart.ee"]);

const bag = writeBrandKitIntoBusinessGoals({ competitors: ["example.com"] }, kit);
const roundTrip = readBrandKitFromBusinessGoals(bag);
assert.ok(roundTrip);
assert.equal(roundTrip?.primaryColor, "#ff3366");
assert.deepEqual((bag as { competitors: string[] }).competitors, ["example.com"]);

console.log("extract-brand-kit.test.ts: ok");

