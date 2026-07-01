export type GrowthOpportunityType =
  | "CONTENT"
  | "SEO"
  | "TECHNICAL"
  | "GSC"
  | "MAINTENANCE";

export type GrowthOpportunityImpact = "HIGH" | "MEDIUM" | "LOW";

export type GrowthOpportunityEffort = "SMALL" | "MEDIUM" | "LARGE";

export type GrowthOpportunityPriority = "HIGH" | "MEDIUM" | "LOW";

export type GrowthOpportunity = {
  id: string;
  type: GrowthOpportunityType;
  title: string;
  description: string;
  priority: GrowthOpportunityPriority;
  estimatedImpact: GrowthOpportunityImpact;
  estimatedEffort: GrowthOpportunityEffort;
  createdFrom: string;
};

export type GrowthOpportunitiesResponse = {
  data: {
    websiteId: string;
    opportunities: GrowthOpportunity[];
    total: number;
  };
};
