import assert from "node:assert/strict";

import { scoreKeywordOpportunity } from "./opportunity-score";

const strongCommercial = scoreKeywordOpportunity({
  relevance: 0.95,
  intentValue: 0.9,
  achievableProbability: 0.7,
  trafficPotential: 0.65,
  businessValue: 0.95,
  freshnessOpportunity: 0.8,
  cannibalizationRisk: 0.05,
  evidenceConfidence: 0.9,
});
const highVolumeButIrrelevant = scoreKeywordOpportunity({
  relevance: 0.05,
  intentValue: 0.2,
  achievableProbability: 0.4,
  trafficPotential: 1,
  businessValue: 0.1,
  freshnessOpportunity: 0.5,
  evidenceConfidence: 0.9,
});
const cannibalized = scoreKeywordOpportunity({
  relevance: 0.95,
  intentValue: 0.9,
  achievableProbability: 0.7,
  trafficPotential: 0.65,
  businessValue: 0.95,
  freshnessOpportunity: 0.8,
  cannibalizationRisk: 1,
  evidenceConfidence: 0.9,
});

assert.ok(strongCommercial > highVolumeButIrrelevant);
assert.ok(cannibalized < strongCommercial);
assert.equal(scoreKeywordOpportunity({ relevance: -1, intentValue: 1, achievableProbability: 1, trafficPotential: 1, businessValue: 1, freshnessOpportunity: 1 }), 0);

console.log("keyword opportunity scoring checks passed");
