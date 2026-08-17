export type KeywordOpportunityFactors = {
  relevance: number;
  intentValue: number;
  achievableProbability: number;
  trafficPotential: number;
  businessValue: number;
  freshnessOpportunity: number;
  cannibalizationRisk?: number;
  evidenceConfidence?: number;
};

function unit(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(Math.max(value, 0), 1);
}

/** Geometric scoring prevents one weak factor from being hidden by strong volume. */
export function scoreKeywordOpportunity(input: KeywordOpportunityFactors): number {
  const factors = [
    input.relevance,
    input.intentValue,
    input.achievableProbability,
    input.trafficPotential,
    input.businessValue,
    input.freshnessOpportunity,
  ].map(unit);
  const geometricMean = Math.pow(
    factors.reduce((product, factor) => product * factor, 1),
    1 / factors.length
  );
  const cannibalizationPenalty = 1 - unit(input.cannibalizationRisk ?? 0) * 0.65;
  const confidence = 0.5 + unit(input.evidenceConfidence ?? 0.5) * 0.5;
  return Math.round(geometricMean * cannibalizationPenalty * confidence * 100);
}
