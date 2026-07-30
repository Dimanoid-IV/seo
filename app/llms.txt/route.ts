import { siteUrl } from "@/i18n/config";

export const dynamic = "force-static";

const body = `# RankBoost.eu

> RankBoost is a multilingual web platform for small businesses and lean teams. It combines website auditing, prioritized monthly SEO planning, business-context article preparation, human review, and approved publishing workflows.

RankBoost does not guarantee search rankings or placement in generative AI answers. Public product information is available in Russian, Estonian, and English.

## Canonical product pages

- Home (English): ${siteUrl}/en
- Services: ${siteUrl}/en/services
- Pricing: ${siteUrl}/en/pricing
- Free website audit: ${siteUrl}/audit
- Contact: ${siteUrl}/en/contact
- Blog: ${siteUrl}/en/blog

## Product capabilities

- Website audit and prioritized SEO tasks
- Monthly content and improvement plans
- Article preparation using website and business context
- Human review before publication
- WordPress publishing and protected custom-site publishing endpoints
- Google Search Console connection
- Russian, Estonian, and English interfaces and content

## Expert resources

- AI search visibility and GEO: ${siteUrl}/en/blog/how-to-appear-in-ai-search-answers
- Choosing an SEO automation platform: ${siteUrl}/en/blog/how-to-choose-seo-automation-platform
- SEO autopilot for small business: ${siteUrl}/en/blog/seo-autopilot-for-small-business
- Automatic SEO article publishing: ${siteUrl}/en/blog/automatic-seo-article-publishing
- E-E-A-T, trust and expertise: ${siteUrl}/en/blog/eeat-seo-trust-and-expertise
- Structured data for SEO: ${siteUrl}/en/blog/schema-markup-structured-data-seo

## Discovery

- Sitemap: ${siteUrl}/sitemap.xml
- Robots: ${siteUrl}/robots.txt

## Contact

- Email: info@rankboost.eu
`;

export function GET() {
  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
