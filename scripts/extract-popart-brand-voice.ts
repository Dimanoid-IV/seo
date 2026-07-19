/**
 * Live popart.ee brand-voice extraction (no Hermes generation).
 * Run: npx tsx scripts/extract-popart-brand-voice.ts
 */
import { extractBrandVoiceFromWebsite } from "../lib/brand-voice/extract-brand-voice";

async function main() {
  const voice = await extractBrandVoiceFromWebsite({
    websiteUrl: "https://popart.ee",
    language: "ru",
  });

  console.log(
    JSON.stringify(
      {
        language: voice.language,
        audience: voice.audience,
        tone: voice.tone,
        formality: voice.formality,
        sellingStyle: voice.sellingStyle,
        ctaStyle: voice.ctaStyle,
        confidence: voice.confidence,
        commonPhrases: voice.commonPhrases.slice(0, 8),
        examples: voice.examples.map((e) => e.slice(0, 140)),
        sourceUrls: voice.sourceUrls,
        updatedAt: voice.updatedAt,
      },
      null,
      2
    )
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
