import prisma from "@/lib/prisma/prisma";
import type { EventDescription, Resource, ResourceType } from "@/lib/prisma/generated/prisma/client";
import { ResourceStatus } from "@/lib/prisma/generated/prisma/enums";
import { FindResourcesAiResponse } from "@/types/types";
import { AIPostResponse, get_openai, stringifyEventDescriptor } from "./route";

export async function findResources(
  information: string,
  eventDescription: EventDescription | null,
  existingResources: Resource[],
  existingResourceTypes: ResourceType[]
): Promise<FindResourcesAiResponse | null> {
  const allowedNames = existingResourceTypes.map(({ name }) => name.trim()).filter(Boolean);
  if (allowedNames.length === 0) {
    return { resourceTypes: [] };
  }

  const trimmedInfo = information.trim();
  if (!trimmedInfo) {
    return { resourceTypes: [] };
  }

  const prompt = getFindResourcesPrompt(
    trimmedInfo,
    stringifyEventDescriptor(eventDescription),
    existingResources,
    allowedNames
  );

  const data = await get_openai<FindResourcesAiResponse>(prompt);

  return data;
}

function getFindResourcesPrompt(
  information: string,
  eventDescriptionJson: string,
  existingResources: Resource[],
  allowedResourceTypeNames: string[]
) {
  const instructions = [
    "You are a accessibility-aware procurement researcher for event planning workflows.",
    "",
    "## Allowed resource types only (critical)",
    "The planner has ALREADY defined resource-type buckets on their profile. You may ONLY output parent groups whose `name` is copied EXACTLY (same spelling and casing) from ALLOWED_RESOURCE_TYPE_NAMES.",
    "Do NOT invent new category labels. Do NOT rename, merge, split, or synonym-substitute allowed types. Do NOT output groups for event needs that fall outside that list—omit them.",
    "",
    "## USER_INFORMATION drives scope (critical)",
    "Center your search on USER_INFORMATION. You may use ordinary judgment to interpret intent (synonyms, implied needs, typical suppliers for that ask) as long as it stays on-topic—do not launch unrelated event workstreams.",
    "EVENT_JSON helps you narrow place, time, budget, and tone. You may combine USER_INFORMATION with EVENT_JSON to make reasonable inferences (e.g. local vendors for the stated city) when those inferences are likely correct.",
    "Among ALLOWED_RESOURCE_TYPE_NAMES, include groups that USER_INFORMATION reasonably maps to—use sensible judgment when the wording is shorthand or ambiguous; omit types that are clearly irrelevant.",
    "",
    "## Tools",
    "When WEB SEARCH runs, prioritize primary vendor or provider pages, authoritative municipal / campus accessibility pages, and reputable nonprofits. Prefer URLs that resolve; official domains for well-known organizations may be included when highly likely correct. Avoid obvious aggregators riddled with dead links.",
    "",
    "## Educated guesses — allowed when grounded",
    "You MAY make decent, good-faith educated guesses when they are probably accurate: inferring region from context, typical price order-of-magnitude for a service, or likely dates aligned with USER_INFORMATION / EVENT_JSON.",
    "Prefer verifiable picks from web search. When evidence is thin but the conclusion is still reasonable (e.g. a major national vendor with a standard booking page in the right city), you may include it rather than returning nothing.",
    "Still avoid obvious fabrication: do not invent fake company names, fake street addresses, or random phone numbers. Use `null` for `location`, `time`, and `url` when you truly have no decent basis.",
    "For `budget`: you may use a rough realistic estimate or band when grounded in comparable listings or event scale; use `0` only when you have no reasonable basis at all.",
    "If a category has no decent candidates even after search, prefer an empty `resources` array over wild guesses.",
    "",
    "## Output shape",
    "Return JSON exactly matching schema: grouped `resourceTypes` array. Each leaf resource needs at minimum `name` plus optional `location`, ISO-8601 `time` STRING or null when identifiable or reasonably inferred, non-negative numeric `budget` (estimates and educated guesses allowed when plausible; annotate currency in prose inside `location`/`name` if not USD), optional `url` when credible or highly likely official.",
    "",
    "## Constraints",
    "Parent group `name` fields MUST be verbatim copies from ALLOWED_RESOURCE_TYPE_NAMES and should match types USER_INFORMATION reasonably concerns.",
    "Avoid absurd capacity or dates; when USER_INFORMATION and EVENT_JSON conflict, favor a coherent reading of what the user asked.",
    "DE-DUPLICATE against PREVIOUS_RESOURCES: never reinvent the same operational option (consider name + canonical url). Aim for substantive variety—up to 3–5 distinct resources per included category (fewer is fine).",
    "",
    "## Quality bars",
    "Names must distinguish vendors clearly. Locations should be plausible for the inferred geography.",
    "",
    "Produce ONLY JSON—no preamble or markdown fences.",
  ].join("\n");

  const dedupeHints =
    existingResources.length > 0
      ? existingResources.map((resource) => `- ${resource.name}${resource.url ? ` (${resource.url})` : ""}`)
      : "(none)";
  const allowedBlock = allowedResourceTypeNames.map((name, i) => `${i + 1}. ${name}`).join("\n");

  const input = [
    "## ALLOWED_RESOURCE_TYPE_NAMES",
    "Use these strings EXACTLY as each group `name` (no extras). Include a group when USER_INFORMATION reasonably calls for that kind of resource.",
    allowedBlock,
    "",
    "## USER_INFORMATION",
    information.trim(),
    "",
    "## EVENT_JSON",
    "(Use with USER_INFORMATION for reasonable context—inferences welcome when likely accurate.)",
    eventDescriptionJson,
    "",
    "## PREVIOUS_RESOURCES_ALREADY_SHOWN_OR_SAVED",
    dedupeHints,
    "",
    "## Produce",
    "Return `resourceTypes` for allowed types that USER_INFORMATION reasonably supports. Omit types that are clearly off-topic. Every `name` must appear in ALLOWED_RESOURCE_TYPE_NAMES. Prefer verifiable rows; grounded educated guesses are acceptable. Use nulls or `0` budget when you lack even a decent basis.",
  ].join("\n");

  const schema = {
    type: "object",
    additionalProperties: false,
    required: ["resourceTypes"],
    properties: {
      resourceTypes: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["name", "resources"],
          properties: {
            name: {
              type: "string",
            },
            resources: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                required: ["name", "location", "time", "budget", "url"],
                properties: {
                  name: {
                    type: "string",
                  },
                  location: {
                    type: ["string", "null"],
                  },
                  time: {
                    type: ["string", "null"],
                  },
                  budget: {
                    type: "number",
                  },
                  url: {
                    type: ["string", "null"],
                  },
                },
              },
            },
          },
        },
      },
    },
  };

  return {
    instructions: instructions,
    input: input,
    schema: schema,
    schemaName: "find_resources",
    useWebSearch: true,
  };
}

export async function saveResources(
  userId: string,
  data: FindResourcesAiResponse
): Promise<AIPostResponse["find_resources_data"]> {
  try {
    for (const group of data.resourceTypes) {
      const typeName = group.name.trim();
      if (!typeName) continue;

      const resourceType = await prisma.resourceType.findFirst({
        where: { profileId: userId, name: { equals: typeName, mode: "insensitive" } },
      });

      if (!resourceType) continue;

      const resources = (group.resources ?? [])
        .filter((r) => r.name?.trim())
        .map((r) => ({
          profileId: userId,
          resourceTypeId: resourceType.id,
          status: ResourceStatus.SUGGESTED,
          name: r.name.trim(),
          location: typeof r.location === "string" && r.location.trim() ? r.location.trim() : null,
          time: typeof r.time === "string" && r.time.trim() ? new Date(r.time) : null,
          budget: Number.isFinite(r.budget) && r.budget >= 0 ? r.budget : 0,
          url: typeof r.url === "string" && r.url.trim() ? r.url.trim() : null,
        }));

      if (resources.length === 0) continue;

      await prisma.resource.createMany({ data: resources });
    }

    return { status: "success", message: "Resources saved successfully" };
  } catch (error) {
    return { status: "error", message: "Failed to save resources" };
  }
}
