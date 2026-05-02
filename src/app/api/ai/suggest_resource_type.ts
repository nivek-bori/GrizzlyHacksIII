import prisma from "@/lib/prisma/prisma";
import { AIPostResponse, get_openai, ProfileForAI, stringifyEventDescriptor } from "./route";
import type { EventDescription } from "@/lib/prisma/generated/prisma/client";
import { SuggestResourceTypesAiResponse } from "@/types/types";

export async function suggestResourceTypes(
  profile: ProfileForAI
): Promise<SuggestResourceTypesAiResponse | null> {
  const existingResourceTypes = profile.resourceTypes.map(({ name }) => name);

  const prompt = getSuggestResourceTypesPrompt(profile.eventDescription, existingResourceTypes);

  const data = await get_openai<SuggestResourceTypesAiResponse>(prompt);

  return data;
}

function getSuggestResourceTypesPrompt(eventDescription: EventDescription | null, previousResourceTypes: string[]) {
  const instructions = [
    "You are an expert, accessibility-conscious event taxonomy assistant.",
    "",
    "You output RESOURCE TYPES — short categorical labels planners use to organize work (examples: Venue access review, Accessible transportation coordination, Catering with dietary-inclusive menus, Captioning / CART services, Quiet / low-stimulus space). These are buckets, NOT specific vendors or URLs.",
    "",
    "## Ground truth",
    "Base every suggestion ONLY on facts present in EVENT_DESCRIPTION_JSON (location, timeline, budget, notes). Prefer fewer, sharper categories than a long fuzzy list.",
    "",
    "## No hallucination — sparse output is correct",
    "Do not invent event facts, venues, constraints, or needs that are not supported by EVENT_DESCRIPTION_JSON. Do not fabricate specificity to sound helpful.",
    "If the JSON is thin or ambiguous, return fewer categories or an empty `resourceTypes` array. It is always better to output nothing uncertain than to guess.",
    "",
    "## De-duplication (critical)",
    "ALREADY_EXISTS lists resource types already in the user's account. Normalize mentally (trim whitespace, fold case): do NOT output anything that repeats, trivially overlaps, or is merely a synonym of an existing label (for example Venue vs Venue Rental when one already applies). Likewise do not duplicate items within YOUR output array.",
    "",
    "## Naming style",
    "Each suggestion: concise Title Case, 2–6 words. No trailing punctuation slogans.",
    "",
    "## Accessibility posture",
    "When EVENT_DESCRIPTION_JSON reasonably implies scale or public attendance with broader inclusion risk, add categories addressing mobility, sensory, communication access, or contingency logistics—only when those needs are supported by described facts, not generic padding.",
    "",
    "Return VALID JSON conforming STRICTLY to the provided schema.",
  ].join("\n");

  const eventJson = stringifyEventDescriptor(eventDescription);
  const existingBlock =
    previousResourceTypes.length > 0
      ? previousResourceTypes.map((name, i) => `${i + 1}. ${name}`).join("\n")
      : "(none—user has no resource types saved yet.)";

  const input = [
    "## EVENT_DESCRIPTION_JSON",
    eventJson,
    "",
    "## ALREADY_EXISTS_RESOURCE_TYPES",
    existingBlock,
    "",
    "## Output contract",
    "Return object { resourceTypes: string[] }. Every string must be a NEW category absent from ALREADY_EXISTS_RESOURCE_TYPES. An empty array is valid when the event description does not support further distinct categories.",
  ].join("\n");

  return {
    instructions,
    input,
    schemaName: "resource_type_suggestions",
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["resourceTypes"],
      properties: {
        resourceTypes: {
          type: "array",
          items: {
            type: "string",
          },
        }
      }
    }
  };
}

export async function saveResourceTypes(userId: string, resourceTypes: string[]): Promise<AIPostResponse['suggest_resource_types_data']> {
  try {
    const createdResourceTypes = await prisma.resourceType.createMany({
      data: resourceTypes.map((resourceType) => ({
        name: resourceType,
        profileId: userId,
      })),
    });

    return { status: "success", message: "Resource types saved successfully" };
  } catch (error) {
    return { status: "error", message: "Failed to save resource types" };
  }
}