/** Public marketing routes that use the light premium style (homepage-aligned). */
export function isLightMarketingPath(pathname: string): boolean {
  return /^\/(ru|et|en)(\/(pricing|contact|services))?\/?$/.test(pathname);
}
