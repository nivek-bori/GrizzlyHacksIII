import prisma from "@/lib/prisma/prisma";
import { DefaultAPIResponse, verifyBody } from "@/lib/util/api";
import { getUserServer, parseError } from "@/lib/util/server_util";
import { RelationalResourceType } from "@/types/types";
import { NextResponse } from "next/server";

export type ResourceTypeGetRequest = {
}

export type ResourceTypeGetResponse = DefaultAPIResponse & {
  resourceTypes?: RelationalResourceType[];
}

type ResourceTypeGetFullRequest = {
  userId: string;
}

export async function GET(request: Request) {
  try {
    // User
    const { user, response } = await getUserServer(request);
    if (response) return response;

    // Data

    const props: ResourceTypeGetFullRequest = { userId: user.id };
    const props_error = verifyBody<ResourceTypeGetFullRequest>(props, 'api/resource_types get');
    if (props_error) return props_error;

    const { userId } = props;

    // Logic

    const profile = await prisma.profile.findUnique({
      where: {
        id: userId,
      },
      select: {
        resourceTypes: {
          select: {
            id: true,
            name: true,
            profileId: true,
            resources: {
              select: {
                id: true,
                resourceTypeId: true,
                name: true,
                location: true,
                time: true,
                budget: true,
                url: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!profile) {
      return NextResponse.json<ResourceTypeGetResponse>(
        { status: 'error', message: 'Profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json<ResourceTypeGetResponse>({ status: 'success', message: '', resourceTypes: profile.resourceTypes });
  } catch (e: any) {
    console.log('api/resource_types get error')
    await parseError(e.message, e.code);
    return NextResponse.json<ResourceTypeGetResponse>({ status: 'error', message: 'There was an issue loading resource types' }, { status: 500 });
  }
}