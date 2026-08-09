import type { MetadataRoute } from "next";

const SITE_URL = "https://vegansteps.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/profile",
        "/moderator",
        "/my-recipes",
        "/saved-recipes",
        "/recipes/write",
        "/api",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}