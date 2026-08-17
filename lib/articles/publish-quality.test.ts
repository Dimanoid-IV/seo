import assert from "node:assert/strict";

import { evaluateCurrentArticlePublishQuality } from "./publish-quality";

const paragraphs = Array.from(
  { length: 24 },
  (_, index) =>
    `<h2>Раздел ${index + 1}</h2><p>${index === 0 ? "Поп-арт портрет по фотографии" : "Персональный портрет"} помогает превратить личный снимок в выразительный подарок. В разделе ${index + 1} объясняются выбор формата, подготовка фотографии, согласование деталей, материалы, сроки и оформление заказа для конкретного получателя без необоснованных обещаний результата.</p>`
).join("");

const safe = evaluateCurrentArticlePublishQuality({
  title: "Как заказать поп-арт портрет по фотографии",
  metaTitle: "Поп-арт портрет по фотографии: выбор и заказ",
  metaDescription:
    "Разбираем, как выбрать фотографию, формат и оформление поп-арт портрета, согласовать детали заказа и подготовить персональный подарок.",
  contentHtml: `${paragraphs}<p><a href="https://popart.ee/">Оставить заявку на портрет</a> и обсудить детали заказа с художником.</p>`,
  targetKeyword: "поп-арт портрет по фотографии",
  language: "RU",
});
assert.equal(safe.passed, true);
assert.deepEqual(safe.criticalFlags, []);

const duplicate = evaluateCurrentArticlePublishQuality({
  title: "Как заказать поп-арт портрет по фотографии",
  metaTitle: "Поп-арт портрет по фотографии: выбор и заказ",
  metaDescription:
    "Разбираем, как выбрать фотографию, формат и оформление поп-арт портрета, согласовать детали заказа и подготовить персональный подарок.",
  contentHtml: `${paragraphs}<p>${"Одинаковый длинный абзац для проверки повторов ".repeat(8)}</p><p>${"Одинаковый длинный абзац для проверки повторов ".repeat(8)}</p>`,
  targetKeyword: "поп-арт портрет по фотографии",
});
assert.equal(duplicate.passed, false);
assert.ok(duplicate.criticalFlags.includes("repeated_paragraphs"));

const leaked = evaluateCurrentArticlePublishQuality({
  title: "Artistic Perfection in 3 Steps",
  metaTitle: "Artistic Perfection in 3 Steps guide",
  metaDescription: "A sufficiently descriptive metadata value for a legacy article that should not be publishable.",
  contentHtml: `${paragraphs}<p>Research brief проверит конкурентов и структуру перед генерацией.</p>`,
  targetKeyword: "Artistic Perfection in 3 Steps",
});
assert.equal(leaked.passed, false);
assert.ok(leaked.criticalFlags.includes("unsafe_topic"));
assert.ok(leaked.criticalFlags.includes("prompt_leakage"));

console.log("publish-quality.test.ts: ok");
