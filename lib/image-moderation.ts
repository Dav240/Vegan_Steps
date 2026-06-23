const SIGHTENGINE_ENDPOINT = "https://api.sightengine.com/1.0/check.json";
const SIGHTENGINE_MODELS = "nudity-2.1,face-age,gore-2.0,recreational_drug";

const MODERATION_THRESHOLDS = {
  likelyMinor: 0.7,
  sexualActivity: 0.2,
  sexualDisplay: 0.2,
  erotica: 0.4,
  verySuggestive: 0.7,
  suggestive: 0.9,
  gore: 0.5,
  recreationalDrug: 0.7,
} as const;

type SightengineResponse = {
  status?: string;
  error?: {
    message?: string;
    type?: string;
  };
  nudity?: {
    sexual_activity?: number;
    sexual_display?: number;
    erotica?: number;
    very_suggestive?: number;
    suggestive?: number;
  };
  gore?: {
    prob?: number;
  };
  faces?: Array<{
    attributes?: {
      age?: {
        minor?: number;
      };
    };
  }>;
  recreational_drug?: {
    prob?: number;
  };
};

export type ImageModerationResult = | { approved: true } | {
      approved: false;
      category: "child-safety" | "graphic" | "drugs";
};

export class ImageModerationServiceError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "ImageModerationServiceError";
  }
}

export function hasSightengineConfig() {
  return Boolean(
    process.env.SIGHTENGINE_API_USER && process.env.SIGHTENGINE_API_SECRET
  );
}

export async function moderateRecipeImage( file: File ): Promise<ImageModerationResult> {
  const apiUser = process.env.SIGHTENGINE_API_USER;
  const apiSecret = process.env.SIGHTENGINE_API_SECRET;

  if (!apiUser || !apiSecret) {
    throw new ImageModerationServiceError(
      "Sightengine is not configured on the server."
    );
  }

  const formData = new FormData();
  formData.set("media", file, file.name || "recipe-image");
  formData.set("models", SIGHTENGINE_MODELS);
  formData.set("api_user", apiUser);
  formData.set("api_secret", apiSecret);

  let response: Response;

  try {
    response = await fetch(SIGHTENGINE_ENDPOINT, {
      method: "POST",
      body: formData,
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });
  } catch (error) {
    throw new ImageModerationServiceError(
      "Sightengine could not be reached.",
      { cause: error }
    );
  }

  let result: SightengineResponse;

  try {
    result = (await response.json()) as SightengineResponse;
  } catch (error) {
    throw new ImageModerationServiceError(
      "Sightengine returned an unreadable response.",
      { cause: error }
    );
  }

  if (!response.ok || result.status !== "success") {
    const providerMessage = result.error?.message || result.error?.type;
    throw new ImageModerationServiceError( providerMessage ? `Sightengine rejected the moderation request: ${providerMessage}` 
      : "Sightengine could not moderate the image."
    );
  }

  const nudity = result.nudity;
  if ( !nudity ||
    !allNumbers([
      nudity.sexual_activity,
      nudity.sexual_display,
      nudity.erotica,
      nudity.very_suggestive,
      nudity.suggestive,
    ]) || typeof result.gore?.prob !== "number" || !Array.isArray(result.faces) || !result.faces.every(
      (face) => typeof face.attributes?.age?.minor === "number"
    ) || typeof result.recreational_drug?.prob !== "number"
  ) {
    throw new ImageModerationServiceError(
      "Sightengine returned an incomplete moderation response."
    );
  }

  const hasSexualContent =
    scoreAtLeast(nudity.sexual_activity, MODERATION_THRESHOLDS.sexualActivity) ||
    scoreAtLeast(nudity.sexual_display, MODERATION_THRESHOLDS.sexualDisplay) ||
    scoreAtLeast(nudity.erotica, MODERATION_THRESHOLDS.erotica) ||
    scoreAtLeast(nudity.very_suggestive, MODERATION_THRESHOLDS.verySuggestive) ||
    scoreAtLeast(nudity.suggestive, MODERATION_THRESHOLDS.suggestive);
  const hasLikelyMinor = result.faces.some((face) =>
    scoreAtLeast(
      face.attributes?.age?.minor,
      MODERATION_THRESHOLDS.likelyMinor
    )
  );

  if (hasSexualContent && hasLikelyMinor) {
    return { approved: false, category: "child-safety" };
  }

  if (result.gore.prob >= MODERATION_THRESHOLDS.gore) {
    return { approved: false, category: "graphic" };
  }

  if (
    result.recreational_drug.prob >= MODERATION_THRESHOLDS.recreationalDrug
  ) {
    return { approved: false, category: "drugs" };
  }

  return { approved: true };
}

function scoreAtLeast(score: number | undefined, threshold: number) {
  return typeof score === "number" && score >= threshold;
}

function allNumbers(scores: Array<number | undefined>) {
  return scores.every((score) => typeof score === "number");
}
