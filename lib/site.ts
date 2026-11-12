// The website (landing page and docs) is hosted apart from the dashboard that
// every install serves. Until it is live, its links go to the project on GitHub.
export const SITE_URL: string = "";
export const PROJECT_URL = "https://github.com/philtechphilips/VPS-PIlot-BE";

/** A page of the website, e.g. siteUrl("/docs"). */
export function siteUrl(path = "/"): string {
  return SITE_URL ? `${SITE_URL}${path}` : `${PROJECT_URL}#readme`;
}

/** A docs page, e.g. docsUrl("operations/monitoring#uptime"). Open it in a new tab. */
export function docsUrl(slug = ""): string {
  return siteUrl(slug ? `/docs/${slug}` : "/docs");
}
