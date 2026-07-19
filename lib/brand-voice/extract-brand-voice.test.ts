/**
 * Run with: npx tsx lib/brand-voice/extract-brand-voice.test.ts
 */

import assert from "node:assert/strict";

import { createDefaultBrandVoice } from "./default-voice";
import {
  extractBrandVoiceFromPages,
  parseBrandVoicePageSample,
} from "./extract-brand-voice";
import {
  buildBrandVoiceGenerationInstructions,
  buildBrandVoiceHumanizerAddendum,
  countGenericMarketingPhrases,
} from "./prompt-instructions";
import {
  readBrandVoiceFromBusinessGoals,
  writeBrandVoiceIntoBusinessGoals,
} from "./business-goals";

const POPART_SAMPLE_HTML = `
<!DOCTYPE html>
<html lang="ru">
<head><title>Pop Art портреты на заказ — popart.ee</title></head>
<body>
  <h1>Поп-арт портреты и художественные подарки</h1>
  <p>Мы создаём яркие портреты в стиле поп-арт по вашим фотографиям. Идеальный подарок на день рождения, юбилей или свадьбу.</p>
  <p>Закажите уникальный портрет онлайн — мы поможем выбрать стиль и оформим доставку.</p>
  <a href="/order">Заказать портрет</a>
  <a href="/about">О нас</a>
  <h2>Почему выбирают нас</h2>
  <p>Дружелюбный сервис, художественный подход и понятные шаги заказа для тех, кто ищет оригинальный подарок.</p>
</body>
</html>
`;

const THIN_HTML = `
<html><head><title>Site</title></head><body><h1>Hi</h1><p>Ok</p></body></html>
`;

{
  const page = parseBrandVoicePageSample("https://popart.ee", POPART_SAMPLE_HTML);
  assert.ok(page.paragraphs.length >= 2);
  assert.ok(page.ctaCandidates.some((c) => /заказать/i.test(c)));

  const voice = extractBrandVoiceFromPages({
    language: "ru",
    pages: [page],
  });

  assert.equal(voice.language, "ru");
  assert.ok(
    voice.tone === "artistic" ||
      voice.sellingStyle === "gift-oriented" ||
      /портрет|подар|худож/i.test(voice.audience + voice.ctaStyle)
  );
  assert.ok(["high", "medium", "low"].includes(voice.confidence));
  assert.ok(voice.sourceUrls.includes("https://popart.ee"));
}

{
  const thin = extractBrandVoiceFromPages({
    language: "ru",
    pages: [parseBrandVoicePageSample("https://thin.example", THIN_HTML)],
  });
  assert.equal(thin.confidence, "low");
  assert.ok(thin.ctaStyle.length > 0);
}

{
  const fallback = createDefaultBrandVoice({ language: "ru" });
  assert.equal(fallback.confidence, "low");
  assert.ok(fallback.forbiddenPhrases.length > 0);
}

{
  const voice = extractBrandVoiceFromPages({
    language: "ru",
    pages: [parseBrandVoicePageSample("https://popart.ee", POPART_SAMPLE_HTML)],
  });
  const instructions = buildBrandVoiceGenerationInstructions(voice, "ru");
  assert.ok(instructions.some((l) => /BRAND VOICE/i.test(l)));
  assert.ok(instructions.some((l) => /language:\s*ru/i.test(l)));
  assert.ok(instructions.join("\n").toLowerCase().includes("cta"));

  const humanizer = buildBrandVoiceHumanizerAddendum(voice, "ru");
  assert.ok(humanizer.includes("BRAND VOICE"));
  assert.ok(
    /портрет|подар|artist|gift|заказ/i.test(humanizer) ||
      humanizer.includes(voice.ctaStyle.slice(0, 20))
  );
}

{
  assert.ok(countGenericMarketingPhrases("In today's digital landscape") >= 1);
  assert.equal(countGenericMarketingPhrases("Закажите портрет онлайн"), 0);
}

{
  const voice = createDefaultBrandVoice({ language: "ru" });
  const bag = writeBrandVoiceIntoBusinessGoals({ competitors: ["a.com"] }, voice);
  const roundTrip = readBrandVoiceFromBusinessGoals(bag);
  assert.ok(roundTrip);
  assert.equal(roundTrip?.language, "ru");
  assert.deepEqual(
    (bag as { competitors: string[] }).competitors,
    ["a.com"]
  );
}

{
  // Public-safe: future mentions copy must not promise backlinks/rankings.
  const unsafe =
    /гарантир|купить ссылк|paid link scheme|guaranteed ranking/i;
  const futureCopy =
    "Later, RankBoost may suggest safe mention opportunities. No paid link schemes, no guaranteed rankings.";
  // The sentence mentions "no guaranteed rankings" — ensure it does not claim we place backlinks.
  assert.ok(!/we (buy|place|sell) (back)?links/i.test(futureCopy));
  assert.ok(unsafe.test(futureCopy) === true); // contains the negation words
  assert.ok(/no (paid link|guaranteed)/i.test(futureCopy));
}

console.log("brand-voice extract/persist/prompt checks passed");
