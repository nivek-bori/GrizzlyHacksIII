import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma/prisma';
import { DefaultAPIResponse, verifyBody } from '@/lib/util/api';
import { getUserServer, parseError } from "@/lib/util/server_util";
import { Profile } from '@/lib/prisma/generated/prisma/client';

type ProfileGetRequestFull = {
  userId: string;
}

export type ProfileGetResponse = DefaultAPIResponse & {
  profile?: Profile;
}

export async function GET(request: Request) {
  try {

    const { user, response } = await getUserServer(request);
    if (response) return response;
    
    const props: ProfileGetRequestFull = { userId: user.id };
    const props_error = verifyBody<ProfileGetRequestFull>(props, 'api/profile get');
    if (props_error) return props_error;

    const { userId } = props;

    const profile = await prisma.profile.findUnique({
      where: {
        id: userId
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        eventDescription: true,
      }
    });

    return NextResponse.json<ProfileGetResponse>({ status: 'success', message: '', profile: profile ?? undefined });
  } catch (e: any) {
    console.log('api/profile get error')
    await parseError(e.message, e.code);
    return NextResponse.json<ProfileGetResponse>({ status: 'error', message: 'There was an issue loading the profile' });
  }
}


export type ProfilePostRequest = {
  userId?: string,
  email: string,
  name: string,
}

type ProfilePostRequestFull = {
  userId?: string,
  email: string,
  name: string,
}

export type ProfilePostResponse = DefaultAPIResponse & {
  profile?: Profile,
}

// create db user after google sign up
export async function POST(request: Request) {
  const body = await request.json() as ProfilePostRequest;
  
  const props: ProfilePostRequestFull = {
    email: body.email,
    name: body.name,
  }
  if (body.userId) props.userId = body.userId;
  const propsError = verifyBody<ProfilePostRequestFull>(body, '/api/profile post');
  if (propsError) return propsError;

  const { userId, email, name } = props;

  try {
    const createQuery: any = {
        email: email,
        name: name,
        role: 'USER'
      };
    console.log(`createQuery1`, createQuery, userId);
    if (userId) createQuery.id = userId;
    console.log(`createQuery2`, createQuery);
    
    const updateQuery: any = {}
    if (!userId) updateQuery.name = name;

    const profile = await prisma.profile.upsert({
      where: {
        email: email,
      },
      create: createQuery,
      update: updateQuery,
    })

    return NextResponse.json<ProfilePostResponse>({ status: 'success', message: '', profile: profile }, { status: 200 });
  } catch (e: any) {
    console.log('api/auth post error');
    parseError(e.message, e.code);

    return NextResponse.json<ProfilePostResponse>({ status: 'error', message: 'Server error. Please refresh or try again later' }, { status: 500 });
  }
}