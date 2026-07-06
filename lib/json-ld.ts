import { siteUrl, type Locale } from "@/i18n/config";
import { getLocalizedPath } from "@/lib/i18n";
import { PUBLIC_EMAIL } from "@/lib/site";

type OrganizationSchemaProps = {
  locale: Locale;
  description: string;
};

export function getOrganizationJsonLd({ locale, description }: OrganizationSchemaProps) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: "RankBoost.eu",
        url: siteUrl,
        logo: `${siteUrl}/opengraph-image`,
        description,
        email: PUBLIC_EMAIL,
        areaServed: ["EE", "EU"],
        knowsLanguage: ["ru", "et", "en"],
        sameAs: [],
      },
      {
        "@type": "LocalBusiness",
        "@id": `${siteUrl}/#localbusiness`,
        name: "RankBoost.eu",
        url: `${siteUrl}${getLocalizedPath(locale, "/")}`,
        description,
        email: PUBLIC_EMAIL,
        address: {
          "@type": "PostalAddress",
          addressCountry: "EE",
          addressLocality: "Tallinn",
        },
        areaServed: [
          { "@type": "Country", name: "Estonia" },
          { "@type": "Place", name: "Europe" },
        ],
        priceRange: "€€",
        knowsLanguage: ["Russian", "Estonian", "English"],
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${siteUrl}/#software`,
        name: "RankBoost",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        description,
        provider: { "@id": `${siteUrl}/#organization` },
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "EUR",
          description: "Free plan available",
        },
        url: `${siteUrl}${getLocalizedPath(locale, "/")}`,
      },
    ],
  };
}

export function getServicesJsonLd(
  locale: Locale,
  services: { name: string; description: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: services.map((service, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Service",
        name: service.name,
        description: service.description,
        provider: {
          "@type": "Organization",
          name: "RankBoost.eu",
          url: siteUrl,
        },
        areaServed: ["EE", "EU"],
        url: `${siteUrl}${getLocalizedPath(locale, "/services")}`,
      },
    })),
  };
}

export function getFAQJsonLd(items: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}
