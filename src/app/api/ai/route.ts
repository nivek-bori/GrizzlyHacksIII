import OpenAI from "openai";
import { NextResponse } from "next/server";

import { getUserServer, parseError } from "@/lib/util/server_util";
import { DefaultAPIResponse, verifyBody } from "../../../lib/util/api";
import { saveResourceTypes, suggestResourceTypes } from "./suggest_resource_type";
import { findResources, saveResources } from "./find_resource";
import prisma from "@/lib/prisma/prisma";
import type { Prisma } from "@/lib/prisma/generated/prisma/client";

export type AIPostRequest = {
  suggest_resource_types_data?: boolean;
  find_resources_data?: {
    information: string;
  };
};

type AIPostFullRequest = AIPostRequest & {
  userId: string;
};

export type AIPostResponse = {
  suggest_resource_types_data?: DefaultAPIResponse & {};
  find_resources_data?: DefaultAPIResponse & {};
};

export async function POST(request: Request) {
  try {
    const { user, response } = await getUserServer(request);
    if (response) return response;

    const body = (await request.json()) as AIPostRequest;
    const props: AIPostFullRequest = { userId: user.id, ...body };

    const props_error = verifyBody<AIPostFullRequest>(props, "api/ai post");
    if (props_error) return props_error;

    const { suggest_resource_types_data, find_resources_data } = props;

    const profile = await getProfileForAI(props.userId);
    if (!profile) return NextResponse.json<AIPostResponse>(
      {
        suggest_resource_types_data: body.suggest_resource_types_data ? { status: "error", message: "Profile not found." } : undefined,
        find_resources_data: body.find_resources_data ? { status: "error", message: "Profile not found." } : undefined,
      }, { status: 404 }
    );

    const res_data: AIPostResponse = {};

    // Suggest resource type
    if (suggest_resource_types_data) {
      // Get suggestion
      const suggest_resource_types_res_data = await suggestResourceTypes(profile);

      // Save data
      if (!suggest_resource_types_res_data?.resourceTypes || suggest_resource_types_res_data?.resourceTypes.length === 0) {
        res_data.suggest_resource_types_data = { status: "error", message: "No resource types found" };
      } else {
        res_data.suggest_resource_types_data = await saveResourceTypes(props.userId, suggest_resource_types_res_data?.resourceTypes);
      }
    }

    // Find resource
    if (find_resources_data) {
      const find_resources_res_data = await findResources(
        find_resources_data.information,
        profile.eventDescription,
        profile.resources,
        profile.resourceTypes
      );
      const resourceCount = find_resources_res_data?.resourceTypes.reduce((n, g) => n + (g.resources?.length ?? 0), 0) ?? 0;

      if (!find_resources_res_data || resourceCount === 0) {
        res_data.find_resources_data = { status: "error", message: "No resources found" };
      } else {
        res_data.find_resources_data = await saveResources(props.userId, find_resources_res_data);
      }
    }

    return NextResponse.json<AIPostResponse>(res_data);
  } catch (e: any) {
    console.log("api/ai post error");
    await parseError(e.message, e.code);

    return NextResponse.json<AIPostResponse>(
      {
        suggest_resource_types_data: { status: "error", message: "There was an issue generating resource type suggestions." },
        find_resources_data: { status: "error", message: "There was an issue finding resources." }
      }, { status: 500 }
    );
  }
}


const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export type OpenAIPromptArgs = {
  instructions: string;
  input: string;
  schemaName: string;
  schema: Record<string, unknown>;
  useWebSearch?: boolean;
};
export async function get_openai<T = unknown>(
  props: OpenAIPromptArgs
): Promise<T | null> {
  const { instructions, input, schemaName, schema, useWebSearch = false } = props;
  try {
    const response = await openai.responses.create({
      model: process.env.OPENAI_MODEL ?? "gpt-5-mini",
      instructions,
      input,
      tools: useWebSearch
        ? [{ type: "web_search", user_location: { type: "approximate", country: "US", timezone: "America/Los_Angeles" } }]
        : undefined,
      text: {
        format: { type: "json_schema", name: schemaName, strict: true, schema },
      },
    });

    const parsed: unknown = JSON.parse(response.output_text);
    if (parsed === null || typeof parsed !== "object") return null;

    return parsed as T;
  } catch (e: any) {
    parseError(e.message, e.code);
    return null;
  }
}

export type ProfileForAI = Prisma.ProfileGetPayload<{
  select: {
    eventDescription: true;
    resourceTypes: true;
    resources: true;
  };
}>;

function getProfileForAI(userId: string): Promise<ProfileForAI | null> {
  return prisma.profile.findUnique({
    where: { id: userId },
    select: {
      eventDescription: true,
      resourceTypes: true,
      resources: true,
    },
  });
}

export function stringifyEventDescriptor(eventDescription: { location: string | null; time: Date | null; budget: number | null; extraNotes: string } | null): string {
  const payload =
    eventDescription === null || eventDescription === undefined
      ? { note: "No saved event details provided." }
      : {
          location: eventDescription.location ?? null,
          time: eventDescription.time?.toISOString() ?? null,
          budget: eventDescription.budget ?? null,
          extraNotes: eventDescription.extraNotes || null,
        };
  return JSON.stringify(payload);
}