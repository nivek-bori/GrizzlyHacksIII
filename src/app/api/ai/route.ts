import OpenAI from "openai";
import { NextResponse } from "next/server";

import { getUserServer, parseError } from "@/lib/util/server_util";
import { DefaultAPIResponse, verifyBody } from "../../../lib/util/api";
import prisma from "@/lib/prisma/prisma";

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
  find_resources?: DefaultAPIResponse;
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
      res_data.suggest_resource_types = await suggestResourceTypes(suggest_resource_types.eventDescription);
    }

    if (find_resources) {
      res_data.find_resources = await findResources(find_resources.resourceTypes);
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


async function suggestResourceTypes(event: string): Promise<AIPostResponse["suggest_resource_types"]> {
  // TODO
  // Input: event description, previous suggested resource types 
  // Output: suggested resource types
  // notice how the event description doesn't have to have a rigid structure? the Ai can work with a block of text too

  // throw new Error("Function not implemented.");

  const existingResourceTypes = await prisma.resource.findMany({
    select: {
      type: true,
    }
  });
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

async function findResources(resourceTypes: string[]): Promise<AIPostResponse["find_resources"]> {
  // TODO
  // Input: resource types
  // Output: list of relevant resources

  // just have ai search for resources

  throw new Error("Function not implemented.");
}

// TODO: Look at https://github.com/nivek-bori/neurohacks_spring2026/blob/main/src/lib/ai.ts
// TODO: Look at https://github.com/nivek-bori/neurohacks_spring2026/blob/main/src/lib/ai.ts
// TODO: Look at https://github.com/nivek-bori/neurohacks_spring2026/blob/main/src/lib/ai.ts

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function get_openai() { }
function parse_json() { }
// some other functions

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