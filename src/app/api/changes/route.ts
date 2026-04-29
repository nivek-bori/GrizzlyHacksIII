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

const tableHandlers: Record<string, (id: string, data: Record<string, unknown>) => Promise<void>> = {
  resource_types: async (id, data) => {
    await prisma.resourceType.update({
      where: { id },
      data,
    });
  },
  resources: async (id, data) => {
    await prisma.resource.update({
      where: { id },
      data,
    });
  },
  event_descriptions: async (id, data) => {
    await prisma.eventDescription.update({
      where: { id },
      data,
    });
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