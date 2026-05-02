"use client"

import { useData } from '../DataProviderComponent';
import LoadingComponent from '../ui/LoadingComponent';
import SearchResourceTypeComponent from './search_resource_type_component';

export default function SearchComponent() {
  const { resourceTypes } = useData();

  if (!resourceTypes) {
    return (
      <div className='w-full h-full py-12 px-8 overflow-y-auto max-h-full'>
        <h1 className='mb-7 text-4xl font-extrabold'>Search for Resources</h1>
        <LoadingComponent />
      </div>
    );
  }

  return (
    <div className='w-full h-full py-12 px-8 overflow-y-auto max-h-full'>
      <h1 className='mb-7 text-4xl font-extrabold'>Search for Resources</h1>
      <div className='mb-7'>
        <input type="text" />
        <p>TODO search by name...</p>
      </div>

      <div>
        {resourceTypes.map((resourceType, idx) => (
          <div key={resourceType.id ?? idx}>
            {idx > 0 && <div className='mt-[1.7rem] mb-[0.8rem] w-full h-0'></div>}
            <SearchResourceTypeComponent resourceType={resourceType} />
          </div>
        ))}
      </div>
    </div>
  );
}