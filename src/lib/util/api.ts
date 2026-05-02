import axios from 'axios';
import { NextResponse } from 'next/server';

export type DefaultAPIResponse = {
  status: 'success' | 'error';
  message: string;
};

type RequestProps = {
  type: 'GET' | 'POST' | 'DELETE';
  route: string;
  body: any;
};

export async function request<T>({ type, route, body }: RequestProps): Promise<T> {
  try {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 1000 * 120);

    switch (type) {
      case 'GET': {
        const { data: res }: { data: T } = await axios.get(route, {
          signal: controller.signal,
          withCredentials: true,
          validateStatus: () => true,
          params: body,
        });
        return res;
      }
      case 'POST': {
        const bodyData = body ? body : undefined;
        const { data: res }: { data: T } = await axios.post(route, bodyData, {
          signal: controller.signal,
          withCredentials: true,
          validateStatus: () => true,
        });
        return res;
      }
      case 'DELETE': {
        const bodyData = body ? body : undefined;
        const { data: res }: { data: T } = await axios.delete(route, {
          signal: controller.signal,
          withCredentials: true,
          validateStatus: () => true,
          data: bodyData,
        });
        return res;
      }
      default:
        break;
    }
    throw new Error(`lib/util/api error: select a valid request type`);
  } catch (e: any) {
    console.log(`lib/util/api error`);
    console.log('Error Start--------------------------------');
    console.log(e.message.slice(0, 400));
    console.log('Error End--------------------------------');
    throw new Error('lib/util/api error');
  }
}

export function verifyBody<T>(body: any, route: string): Response | null {
  try {
    const check: T = body;
    return null;
  } catch (e: unknown) {
    console.error(`${route} error: `, e);
    return NextResponse.json<DefaultAPIResponse>({ status: 'error', message: '' }, { status: 400 });
  }
}