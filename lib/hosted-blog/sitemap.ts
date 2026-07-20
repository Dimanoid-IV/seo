export type HostedSitemapEntry = {
  url: string;
  lastModified: Date;
};

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function renderHostedSitemap(entries: HostedSitemapEntry[]): string {
  const urls = entries
    .map((entry) => {
      const lastmod = entry.lastModified.toISOString();
      return [
        "  <url>",
        `    <loc>${escapeXml(entry.url)}</loc>`,
        `    <lastmod>${lastmod}</lastmod>`,
        "    <changefreq>weekly</changefreq>",
        "    <priority>0.7</priority>",
        "  </url>",
      ].join("\n");
    })
    .join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urls,
    "</urlset>",
    "",
  ]
    .filter((line) => line !== "")
    .join("\n");
}
