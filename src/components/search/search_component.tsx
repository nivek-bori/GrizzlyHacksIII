"use client"

import { ResourceType } from '@/lib/prisma/generated/prisma/client';
import React, { useState } from 'react';
import SearchResourceTypeComponent from './search_resource_type_component';

export default function SearchComponent({ resourceTypes }: { resourceTypes: ResourceType[] }) {
  return (
    <div className='w-full h-full py-12 px-8 overflow-y-auto max-h-full'>
      <h1 className='mb-7 text-4xl font-extrabold'>Search for Resources</h1>
      <div className='mb-7'>
        <input type="text" />
        <p>TODO search by name...</p>
      </div>

      <div>
        {resourceTypes.map((resourceType, idx) => (
          <div key={idx}>
            {idx > 0 && <div className='mt-[1.7rem] mb-[0.8rem] w-full h-0'></div>}
            <SearchResourceTypeComponent resourceType={resourceType} />
          </div>
        ))}
      </div>
    </div>
  );
}

// {
//   resourceType.resources && resourceType.resources.filter(resource => resource.status !== ResourceStatus.POTENTIAL).map((resource, idx) => (
//     <div key={idx}>
//       {idx > 0 && (
//         <div className='my-[1.2rem] w-[90%] h-0 border-t-[2px] border-gray-400'></div>
//       )}
//       <PotentialTodoComponent resource={resource} />
//     </div>
//   ))
// }