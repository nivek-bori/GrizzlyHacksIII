import { request } from "@/lib/util/api";
import { AIPostResponse } from "../api/ai/route";
import { useState } from "react";

export default function DeveloperAndy() {
  const [response, setResponse] = useState<any>(null);
  
  const onGetResponse = async (response: string) => {
    const body = {
      // TODO; Fill in here
    };
    const res = await request<AIPostResponse>({
      type: 'POST',
      route: '/api/ai',
      body: body,
    })

    setResponse(res);
    console.log(`res`, res);
  }
  
  return (
    <div className='w-full h-full flex flex-col items-center justify-center'>
      <p>make sure to fill in the body in in src/app/developer_andy/page.tsx</p>
      <p>Response: {response}</p>
      <button onClick={() => onGetResponse}>Get Response</button>
    </div>
  );
}