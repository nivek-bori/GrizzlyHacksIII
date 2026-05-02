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

  const prompt = getFindResourcesPrompt(
    information,
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
    "You are a meticulous accessibility-aware procurement researcher for event planning workflows.",
    "",
    "## Allowed resource types only (critical)",
    "The planner has ALREADY defined resource-type buckets on their profile. You may ONLY output parent groups whose `name` is copied EXACTLY (same spelling and casing) from ALLOWED_RESOURCE_TYPE_NAMES.",
    "Do NOT invent new category labels. Do NOT rename, merge, split, or synonym-substitute allowed types. Do NOT output groups for event needs that fall outside that list—omit them.",
    "",
    "## Tools",
    "When WEB SEARCH runs, prioritize primary vendor or provider pages, authoritative municipal / campus accessibility pages, and reputable nonprofits. Prefer URLs you can verify resolve (no fabricated domains—if uncertain, omit the url field entirely). Avoid obvious aggregators riddled with dead links.",
    "",
    "## No hallucination — unknowns stay blank",
    "Never invent vendors, people, addresses, phone numbers, dates, prices, capacities, or URLs. Every `name` must correspond to a real, verifiable entity from search or clear public knowledge tied to the event context.",
    "If you do not know a value, leave it absent of fabrication: use `null` for `location`, `time`, and `url` when not confidently known or verifiable. Do not fill gaps with plausible-sounding placeholders.",
    "For `budget`: only use a positive number when you have a defensible estimate from a cited or clearly matching source; otherwise use `0` (do not guess a quote to look complete).",
    "If you cannot honestly list resources for a category after search, use an empty `resources` array for that group or omit marginal entries—sparse output is correct.",
    "",
    "## Output shape",
    "Return JSON exactly matching schema: grouped `resourceTypes` array. Each leaf resource needs at minimum `name` plus truthful optional `location`, ISO-8601 `time` STRING or null when a single concrete occurrence is identifiable, plausible non-negative numeric `budget` (rough quote or starter estimate in USD unless location clearly implies another currency—in that case annotate currency in prose inside `location`/`name` sparingly AND keep numeric budget proportional), optional `url` when verified credible.",
    "",
    "## Constraints",
    "Parent group `name` fields MUST be verbatim copies from ALLOWED_RESOURCE_TYPE_NAMES. OPTIONAL_INFORMATION only narrows what to search for inside those existing buckets—it must NOT introduce new parent categories.",
    "Ground recommendations in EVENT_JSON (budget/time/notes). Do not hallucinate astronomical capacity or timelines contradicting planner detail.",
    "DE-DUPLICATE against PREVIOUS_RESOURCES: never reinvent the same operational option (consider name + canonical url). Aim for substantive variety—up to 3–5 distinct resources per allowed category you were able to verify (fewer is fine).",
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
  const focusList =
    information.trim().length > 0
      ? information.trim()
      : "(none—search across every allowed type as relevant to EVENT_JSON; still only use parent names from ALLOWED_RESOURCE_TYPE_NAMES)";

  const input = [
    "## ALLOWED_RESOURCE_TYPE_NAMES",
    "Use these strings EXACTLY as each group `name` (no extras):",
    allowedBlock,
    "",
    "## OPTIONAL_INFORMATION",
    focusList,
    "",
    "## EVENT_JSON",
    eventDescriptionJson,
    "",
    "## PREVIOUS_RESOURCES_ALREADY_SHOWN_OR_SAVED",
    dedupeHints,
    "",
    "## Produce",
    "Return `resourceTypes`: one `{ name, resources }` per allowed type you investigated (omit allowed types with zero verifiable results). Every `name` must appear in ALLOWED_RESOURCE_TYPE_NAMES. Empty `resources` arrays and null optional fields are expected; never pad with invented data.",
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
