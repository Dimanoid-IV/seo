import assert from "node:assert/strict";
import { unzipSync, strFromU8 } from "fflate";
import { GET } from "../../app/api/integrations/wordpress/plugin/route";
import { setupCopy, wordpressProfileUrl } from "./setup-copy";
import { assistedSetupFormSchema } from "../validators";

async function main() {
  const response = await GET();
  assert.equal(response.headers.get("Content-Type"), "application/zip");
  const entries = unzipSync(new Uint8Array(await response.arrayBuffer()));
  assert.deepEqual(Object.keys(entries).sort(), ["rankboost-connector/README.md", "rankboost-connector/rankboost-connector.php"]);
  const php = strFromU8(entries["rankboost-connector/rankboost-connector.php"]);
  assert.match(php, /Plugin Name: RankBoost Connector/);
  assert.match(php, /https:\/\/www\.rankboost\.eu/);
  assert.equal(wordpressProfileUrl("javascript:alert(1)"), null);
  assert.equal(wordpressProfileUrl("https://user:pass@example.com"), null);
  assert.equal(wordpressProfileUrl("https://example.com/"), "https://example.com/wp-admin/profile.php");
  for (const locale of ["ru", "en", "et"] as const) {
    assert.equal(setupCopy(locale).steps.length, 3);
    for (const integrationType of ["WORDPRESS", "WEBFLOW", "SHOPIFY", "WIX", "GHOST", "GITHUB", "ZAPIER", "MAKE", "CUSTOM_WEBHOOK", "SQUARESPACE"]) {
      assert.equal(assistedSetupFormSchema.safeParse({ name: "Test User", email: "test@example.invalid", websiteUrl: "https://example.com", integrationType, issueType: "NOT_SURE", consentGiven: true, locale }).success, true);
    }
  }
  console.log("Integration setup: installable ZIP, safe links, localized steps and help providers passed");
}
void main();
