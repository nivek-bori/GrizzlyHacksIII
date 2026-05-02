import OpenAI from "openai";
import { NextResponse } from "next/server";

import { getUserServer, parseError } from "@/lib/util/server_util";
import { DefaultAPIResponse, verifyBody } from "../../../lib/util/api";
import prisma from "@/lib/prisma/prisma";
import { ResourceStatus } from "@/lib/prisma/generated/prisma/client";
import type { Resource, ResourceType } from "@/lib/prisma/generated/prisma/client";
import type { RelationalResourceType } from "@/types/types";

export type AIPostRequest = {
  suggest_resource_types?: SuggestResourceTypesRequest;
  find_resources?: FindResourcesRequest;
};

type SuggestResourceTypesRequest = {
  eventDescription: string;
};

type FindResourcesRequest = {
  resourceTypes: string[];
};

type AIPostFullRequest = AIPostRequest & {
  userId: string;
};

export type AIPostResponse = {
  suggest_resource_types?: DefaultAPIResponse & {
    resourceTypes?: string[];
  };
  find_resources?: DefaultAPIResponse & {
    resourceTypes?: RelationalResourceType[];
  };
};

export async function POST(request: Request) {
  try {
    const { user, response } = await getUserServer(request);
    if (response) return response;

    const body = (await request.json()) as AIPostRequest;
    const props: AIPostFullRequest = { userId: user.id, ...body };

    const props_error = verifyBody<AIPostFullRequest>(props, "api/ai post");
    if (props_error) return props_error;

    const { suggest_resource_types, find_resources } = props;

    const res_data: AIPostResponse = {};

    if (suggest_resource_types) {
      res_data.suggest_resource_types = await suggestResourceTypes(
        suggest_resource_types.eventDescription,
        props.userId
      );
    }

    if (find_resources) {
      res_data.find_resources = await findResources(find_resources.resourceTypes, props.userId);
    }

    return NextResponse.json<AIPostResponse>(res_data,);
  } catch (e: any) {
    console.log("api/ai post error");
    await parseError(e.message, e.code);

    return NextResponse.json<AIPostResponse>(
      {
        suggest_resource_types: {
          status: "error",
          message: "There was an issue generating resource type suggestions.",
        },
        find_resources: {
          status: "error",
          message: "There was an issue finding resources.",
        },
      },
      { status: 500 }
    );
  }
}


type SuggestedResourceTypesAIResponse = {
  resourceTypes: string[];
};

type FoundResourcesAIResponse = {
  resourceTypes: Array<{
    name: string;
    resources: Array<{
      name: string;
      location: string | null;
      time: string | null;
      budget: number;
      url: string | null;
    }>;
  }>;
};

async function suggestResourceTypes(
  event: string,
  userId: string
): Promise<AIPostResponse["suggest_resource_types"]> {
  const existingResourceTypes = await prisma.resourceType.findMany({
    where: {
      profileId: userId,
    },
    select: {
      name: true,
    },
  });

  const previousResourceTypes = existingResourceTypes.map(({ name }) => name);
  const data = await get_openai<SuggestedResourceTypesAIResponse>({
    instructions:
      "You are an accessibility-first event planning assistant. Suggest practical resource types needed for an event. Prioritize accessibility, safety, budget, location, and usefulness. Resource type is a short free-form string. When previous resource types are provided, reuse one of those exact strings when it fits before inventing a new type. Return only valid JSON matching the schema.",
    input: `Suggest resource types for this event description:

${event}

Previous resource types:
${previousResourceTypes.length > 0 ? previousResourceTypes.join(", ") : "None provided"}`,
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
        },
      },
    },
  });

  return {
    status: "success",
    message: "Generated resource type suggestions.",
    resourceTypes: cleanStringList(data.resourceTypes),
  };
}
// OLD CODE:
// const profile = user.email
//   ? await prisma.profile.findUnique({
//       where: {
//         id: user.id,
//       },
//       include: {
//         potentialResources: true,
//       },
//     })
//   : null;
// const previousResourceTypes = get_previous_resource_types(profile);
// const data = await get_openai(event, previousResourceTypes);

// return NextResponse.json<AIPostResponse>({
//   status: "success",
//   message: "Generated resource suggestions.",
//   data,
// });

async function findResources(
  resourceTypes: string[],
  userId: string
): Promise<AIPostResponse["find_resources"]> {
  const requestedResourceTypes = cleanStringList(resourceTypes);

  if (requestedResourceTypes.length === 0) {
    return {
      status: "error",
      message: "Please provide at least one resource type.",
    };
  }

  const profile = await prisma.profile.findUnique({
    where: {
      id: userId,
    },
    select: {
      eventDescription: true,
      resourceTypes: {
        include: {
          resources: true,
        },
      },
    },
  });

  if (!profile) {
    return {
      status: "error",
      message: "Profile not found.",
    };
  }

  const data = await get_openai<FoundResourcesAIResponse>({
    instructions:
      "You are an accessibility-first event planning research assistant. Search the web for practical, real resources that could help someone plan the event. Prefer resources with usable URLs, clear names, and realistic costs. Return only valid JSON matching the schema.",
    input: `Find 3 to 5 relevant resources for each resource type.

Resource types:
${requestedResourceTypes.join(", ")}

Event context:
${formatEventDescription(profile.eventDescription)}`,
    schemaName: "found_event_resources",
    schema: {
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
    },
    useWebSearch: true,
  });

  const createdResourceTypes = await saveFoundResources(data, requestedResourceTypes, userId);

  return {
    status: "success",
    message: "Found resource suggestions.",
    resourceTypes: createdResourceTypes,
  };
}

// TODO: Look at https://github.com/nivek-bori/neurohacks_spring2026/blob/main/src/lib/ai.ts
// TODO: Look at https://github.com/nivek-bori/neurohacks_spring2026/blob/main/src/lib/ai.ts
// TODO: Look at https://github.com/nivek-bori/neurohacks_spring2026/blob/main/src/lib/ai.ts

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function get_openai<T>({
  instructions,
  input,
  schemaName,
  schema,
  useWebSearch = false,
}: {
  instructions: string;
  input: string;
  schemaName: string;
  schema: Record<string, unknown>;
  useWebSearch?: boolean;
}): Promise<T> {
  const response = await openai.responses.create({
    model: process.env.OPENAI_MODEL ?? "gpt-5-mini",
    instructions,
    input,
    tools: useWebSearch
      ? [
          {
            type: "web_search",
            user_location: {
              type: "approximate",
              country: "US",
              timezone: "America/Los_Angeles",
            },
          },
        ]
      : undefined,
    text: {
      format: {
        type: "json_schema",
        name: schemaName,
        strict: true,
        schema,
      },
    },
  });

  return parse_json<T>(response.output_text);
}

function parse_json<T>(json: string): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    throw new Error("OpenAI returned invalid JSON.");
  }
}

function cleanStringList(values: string[]): string[] {
  const seen = new Set<string>();

  return values
    .map((value) => value.trim())
    .filter((value) => {
      const key = value.toLowerCase();
      if (!value || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function formatEventDescription(
  eventDescription: {
    location: string | null;
    time: Date | null;
    budget: number | null;
    extraNotes: string;
  } | null
): string {
  if (!eventDescription) return "No saved event details provided.";

  return [
    `Location: ${eventDescription.location ?? "Not provided"}`,
    `Time: ${eventDescription.time?.toISOString() ?? "Not provided"}`,
    `Budget: ${eventDescription.budget ?? "Not provided"}`,
    `Extra notes: ${eventDescription.extraNotes || "Not provided"}`,
  ].join("\n");
}

async function saveFoundResources(
  data: FoundResourcesAIResponse,
  requestedResourceTypes: string[],
  userId: string
): Promise<RelationalResourceType[]> {
  const requestedNamesByKey = new Map(
    requestedResourceTypes.map((name) => [normalizeName(name), name])
  );
  const savedResourceTypes: RelationalResourceType[] = [];

  for (const aiResourceType of data.resourceTypes) {
    const resourceTypeName =
      requestedNamesByKey.get(normalizeName(aiResourceType.name)) ?? aiResourceType.name.trim();

    if (!resourceTypeName) continue;

    const resourceType = await findOrCreateResourceType(resourceTypeName, userId);
    const resources = sanitizeResources(aiResourceType.resources);

    if (resources.length > 0) {
      await prisma.resource.createMany({
        data: resources.map((resource) => ({
          ...resource,
          status: ResourceStatus.SUGGESTED,
          resourceTypeId: resourceType.id,
        })),
      });
    }

    const savedResourceType = await prisma.resourceType.findUnique({
      where: {
        id: resourceType.id,
      },
      include: {
        resources: true,
      },
    });

    if (savedResourceType) savedResourceTypes.push(savedResourceType);
  }

  return savedResourceTypes;
}

async function findOrCreateResourceType(name: string, userId: string): Promise<ResourceType> {
  const existingResourceTypes = await prisma.resourceType.findMany({
    where: {
      profileId: userId,
    },
  });

  const existingResourceType = existingResourceTypes.find(
    (resourceType) => normalizeName(resourceType.name) === normalizeName(name)
  );

  if (existingResourceType) return existingResourceType;

  return prisma.resourceType.create({
    data: {
      name,
      profileId: userId,
    },
  });
}

function sanitizeResources(resources: FoundResourcesAIResponse["resourceTypes"][number]["resources"]) {
  const seen = new Set<string>();

  return resources
    .map((resource) => {
      const name = resource.name.trim();
      const url = resource.url?.trim() || null;
      const key = normalizeName(`${name}:${url ?? ""}`);

      if (!name || seen.has(key)) return null;
      seen.add(key);

      return {
        name,
        location: resource.location?.trim() || null,
        time: parseOptionalDate(resource.time),
        budget: Math.max(0, Number.isFinite(resource.budget) ? resource.budget : 0),
        url,
      };
    })
    .filter((resource): resource is Omit<Resource, "id" | "status" | "resourceTypeId"> => {
      return resource !== null;
    });
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

function parseOptionalDate(value: string | null): Date | null {
  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

// OLD CODE:
// async function get_openai(
//   event: EventDetails,
//   previousResourceTypes: string[]
// ): Promise<AIResourceTypeResponse> {
//   const response = await openai.responses.create({
//     model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
//     input: [
//       {
//         role: "system",
//         content:
//           "You are an accessibility-first event planning assistant. Suggest practical resource types needed for an event. Prioritize accessibility, safety, budget, location, and usefulness. Resource type is a free-form string because users can add their own categories. When previous resource types are provided, reuse one of those exact strings when it fits before inventing a new type. Return only valid JSON matching the provided schema.",
//       },
//       {
//         role: "user",
//         content: `Suggest the resource types needed for this event:

// Event type: ${event.eventType}
// Location: ${event.location}
// Date/time: ${event.dateTime ?? "Not provided"}
// Budget: ${event.budget ?? "Not provided"}
// Guest count: ${event.guestCount ?? "Not provided"}
// Accessibility needs: ${event.accessibilityNeeds ?? "Not provided"}
// Extra notes: ${event.notes ?? "Not provided"}
// Previous resource types: ${
//           previousResourceTypes.length > 0
//             ? previousResourceTypes.join(", ")
//             : "None provided"
//         }`,
//       },
//     ],
//     text: {
//       format: {
//         type: "json_schema",
//         name: "resource_type_suggestions",
//         strict: true,
//         schema: {
//           type: "object",
//           additionalProperties: false,
//           required: ["resourceTypes"],
//           properties: {
//             resourceTypes: {
//               type: "array",
//               items: {
//                 type: "object",
//                 additionalProperties: false,
//                 required: [
//                   "type",
//                   "reason",
//                   "priority",
//                   "estimatedBudgetImpact",
//                   "accessibilityNotes",
//                   "searchKeywords",
//                 ],
//                 properties: {
//                   type: {
//                     type: "string",
//                   },
//                   reason: {
//                     type: "string",
//                   },
//                   priority: {
//                     type: "string",
//                     enum: ["low", "medium", "high"],
//                   },
//                   estimatedBudgetImpact: {
//                     type: ["string", "null"],
//                   },
//                   accessibilityNotes: {
//                     type: "string",
//                   },
//                   searchKeywords: {
//                     type: "array",
//                     items: {
//                       type: "string",
//                     },
//                   },
//                 },
//               },
//             },
//           },
//         },
//       },
//     },
//   });

//   return JSON.parse(response.output_text) as AIResourceTypeResponse;
// }
