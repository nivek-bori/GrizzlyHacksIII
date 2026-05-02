import { DefaultAPIResponse, verifyBody } from "@/lib/util/api";
import { getUserServer, parseError } from "@/lib/util/server_util";
import prisma from "@/lib/prisma/prisma";
import { Changes } from "@/types/types";
import { NextResponse } from "next/server";

export type ChangesPostRequest = {
  changes: Changes;
}

export type ChangesPostResponse = DefaultAPIResponse & {
  
}

type ChangesPostFullRequest = ChangesPostRequest & {
}

function rowAction(data: Record<string, unknown>): "add" | "change" | "delete" {
  const a = data._action;
  if (a === "add" || a === "change" || a === "delete") return a;
  return "change";
}

function omitAction(data: Record<string, unknown>) {
  const { _action: _a, ...rest } = data;
  return rest;
}

// table to db action handlers
const tableHandlers: Record<string, (id: string, data: Record<string, unknown>) => Promise<void>> = {
  resource_types: async (id, data) => {
    switch (rowAction(data)) {
      case "delete":
        await prisma.resourceType.delete({ where: { id } });
        return;
      case "add":
        await prisma.resourceType.create({ data: { ...omitAction(data), id } as any });
        return;
      default: {
        await prisma.resourceType.update({
          where: { id },
          data: omitAction(data) as any,
        });
      }
    }
  },
  resources: async (id, data) => {
    switch (rowAction(data)) {
      case "delete":
        await prisma.resource.delete({ where: { id } });
        return;
      case "add":
        await prisma.resource.create({ data: { ...omitAction(data), id } as any });
        return;
      default: {
        await prisma.resource.update({
          where: { id },
          data: omitAction(data) as any,
        });
      }
    }
  },
  event_descriptions: async (id, data) => {
    switch (rowAction(data)) {
      case "delete":
        await prisma.eventDescription.delete({ where: { id } });
        return;
      case "add":
        await prisma.eventDescription.create({ data: { ...omitAction(data), id } as any });
        return;
      default: {
        await prisma.eventDescription.update({
          where: { id },
          data: omitAction(data) as any,
        });
      }
    }
  },
};

export async function POST(request: Request) {
  try {
    // User
    const { user, response } = await getUserServer(request);
    if (response) return response;

    // Data
    const body = (await request.json()) as ChangesPostRequest;
    const props: ChangesPostFullRequest = { changes: body.changes };
    const props_error = verifyBody<ChangesPostFullRequest>(props, 'api/changes post');
    if (props_error) return props_error;

    const { changes } = props;

    // Logic
    for (const table of Object.keys(changes)) {
      const handler = tableHandlers[table];
      if (!handler) continue;

      const tableChanges = changes[table];
      for (const rowId of Object.keys(tableChanges)) {
        await handler(rowId, tableChanges[rowId]);
      }
    }

    return NextResponse.json<ChangesPostResponse>({ status: 'success', message: '' });
  } catch (e: any) {
    console.log('api/change post error')
    await parseError(e.message, e.code);
    return NextResponse.json<ChangesPostResponse>({ status: 'error', message: 'Failed to save changes' }, { status: 500 });
  }
}