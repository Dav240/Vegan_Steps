export const LEGAL_VERSION = "2026-07-08";

export type PrivacyPreferences = {
  personalisedRecommendations: boolean;
  analytics: boolean;
  productEmails: boolean;
};

export const defaultPrivacyPreferences: PrivacyPreferences = {
  personalisedRecommendations: false,
  analytics: false,
  productEmails: false,
};

export type LegalPolicy = {
  slug: string;
  title: string;
  summary: string;
  sections: Array<{
    heading: string;
    body: string;
  }>;
};

export const legalPolicies: LegalPolicy[] = [
  {
    slug: "terms",
    title: "Terms of Service",
    summary: "The baseline rules for using VegR and keeping the community usable.",
    sections: [
      {
        heading: "Your account",
        body: "You are responsible for the recipes, images, ratings, reports, and profile information you submit. Keep your login details private and only use accounts you are allowed to access.",
      },
      {
        heading: "Your content",
        body: "Only upload recipes, text, and images that you created or have permission to use. VegR may remove content that appears illegal, unsafe, infringing, misleading, or against the community guidelines.",
      },
      {
        heading: "Service changes",
        body: "VegR is still evolving, so features may change, break, or be removed. Important legal or privacy changes should be shown clearly before they apply.",
      },
    ],
  },
  {
    slug: "privacy",
    title: "Privacy Policy",
    summary: "What personal data VegR needs, what is optional, and how long it should be kept.",
    sections: [
      {
        heading: "Core data",
        body: "VegR needs your email, username, password hash, session data, recipes, saved recipes, ratings, reports, and moderation records to run the service.",
      },
      {
        heading: "Optional data",
        body: "Personalised recommendations, analytics, and product emails are optional. You can turn these off and still use the core recipe features.",
      },
      {
        heading: "Retention",
        body: "Verification and reset codes expire after 30 minutes. Recipe views should be deleted after 90 days unless already deleted by the user. Soft-deleted accounts should be permanently deleted after 30 days where legally appropriate, while moderation records may need to stay longer for safety and accountability.",
      },
      {
        heading: "Deletion choices",
        body: "Users can delete optional data such as recipe view history and optional preference choices without deleting their account. Account deletion soft-deletes the account first so safety and moderation checks can complete before permanent deletion.",
      },
    ],
  },
  {
    slug: "cookies",
    title: "Cookie Policy",
    summary: "Which browser storage is necessary and which parts need a real opt-in.",
    sections: [
      {
        heading: "Necessary cookies",
        body: "VegR uses necessary cookies for login sessions, security, and remembering your cookie preference. These are needed for the service to work.",
      },
      {
        heading: "Optional cookies",
        body: "Analytics, visitor recommendations, experiments, and third-party tracking should stay off unless you choose to allow them.",
      },
    ],
  },
  {
    slug: "community",
    title: "Community Guidelines",
    summary: "The human rules: no abuse, no illegal uploads, no dangerous misinformation.",
    sections: [
      {
        heading: "Be honest",
        body: "Do not knowingly post false allergen, vegan, ingredient, or safety information. Recipe tags are helpful signals, not guarantees.",
      },
      {
        heading: "Be lawful",
        body: "Do not upload illegal, abusive, hateful, explicit, violent, or copyrighted content you do not have permission to use.",
      },
      {
        heading: "Be useful",
        body: "Reports should be made in good faith. Spam, harassment, and repeated false reports may lead to account restrictions.",
      },
    ],
  },
  {
    slug: "reporting",
    title: "Reporting / Takedown Policy",
    summary: "How users can flag illegal, unsafe, infringing, or guideline-breaking content.",
    sections: [
      {
        heading: "Reports",
        body: "Every public recipe should be reportable. Reports should include a reason and enough detail for a moderator to review the recipe fairly.",
      },
      {
        heading: "Takedowns",
        body: "VegR may remove recipes, images, comments, or accounts when content appears illegal, unsafe, infringing, or against the rules.",
      },
      {
        heading: "Appeals",
        body: "Users should be able to ask for a moderation decision to be reviewed, especially when a recipe is rejected or removed.",
      },
    ],
  },
  {
    slug: "moderation",
    title: "Moderator Policy",
    summary: "How moderators should treat reports and submitted recipes consistently.",
    sections: [
      {
        heading: "Review standards",
        body: "Moderators should review reported and submitted recipes using the same rules, record reasons for decisions, and avoid approving unsafe or infringing content.",
      },
      {
        heading: "Actions",
        body: "Moderators may approve, reject, ignore, remove, or escalate content. Severe or repeated violations may lead to account restrictions.",
      },
    ],
  },
  {
    slug: "allergen-safety",
    title: "Allergen and Food Safety Disclaimer",
    summary: "A clear warning that user-submitted recipes are not allergy or medical advice.",
    sections: [
      {
        heading: "User-submitted information",
        body: "VegR recipes, tags, ingredients, and instructions are submitted by users and are not professionally verified unless explicitly stated.",
      },
      {
        heading: "Allergens",
        body: "Vegan, gluten-free, nut-free, and similar tags are not guarantees. Always check ingredient labels, cross-contamination risks, and professional advice when needed.",
      },
      {
        heading: "Food safety",
        body: "Users are responsible for safe preparation, storage, cooking temperatures, and checking whether ingredients are suitable for their own circumstances.",
      },
    ],
  },
];

export function getPolicyHref(slug: string) {
  return `/legal#${slug}`;
}
