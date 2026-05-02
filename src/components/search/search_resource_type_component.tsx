'use client';

import { RelationalResourceType } from "@/types/types";
import SearchResourceComponent from "./search_resource_component";
import { ResourceStatus } from "@/lib/prisma/generated/prisma/browser";
import { useState } from "react";
import { AIPostResponse } from "@/app/api/ai/route";
import { request } from "@/lib/util/api";
import { useNotification } from "../notification/NotificationProvider";

export default function SearchResourceTypeComponent({ resourceType }: { resourceType: RelationalResourceType }) {
  const { addNotification } = useNotification();
  
  const validResource = resourceType.resources ? resourceType.resources.filter(resource => resource.status === ResourceStatus.SUGGESTED) : null;

  const [disabled, setDisabled] = useState(false);

  const handleSearchMore = async () => {
    if (disabled) return;

    setDisabled(true);

    const body = {
      find_resources_data: {
        information: resourceType.name,
      },
    };
    const res = await request<AIPostResponse>({
      type: 'POST',
      route: '/api/ai',
      body: body,
    });

    if (res.find_resources_data?.status === 'error') {
      addNotification({ message: res.find_resources_data.message, type: 'error' });
    }

    setDisabled(false);
  }
  
  return <div>
    <h2 className='mb-[0.4rem] text-[1.7rem] font-bold'>{resourceType.name}:</h2>

    <div className='w-full px-[2rem]'>
      {validResource && validResource.map((resource, idx) => (
        <div key={idx}>
          {idx > 0 && (
            <div className='my-[1.1rem] w-full h-0 border-t-[2px] border-gray-400'></div>
          )}
          <SearchResourceComponent resource={resource} />
        </div>
      ))}
      {(!validResource || validResource.length === 0) && (
        <button
          onClick={handleSearchMore}
          disabled={disabled}
          className='underline text-gray-600 hover:text-gray-500 disabled:text-gray-400 disabled:cursor-not-allowed'
        >
          No more resources. Search for more?
        </button>
   
      )}
    </div>
  </div>;
}