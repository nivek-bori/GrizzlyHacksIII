import { RelationalResourceType } from "@/types/types";
import SearchResourceComponent from "./search_resource_component";
import { ResourceStatus } from "@/lib/prisma/generated/prisma/browser";

export default function SearchResourceTypeComponent({ resourceType }: { resourceType: RelationalResourceType }) {
  const validResource = resourceType.resources ? resourceType.resources.filter(resource => resource.status === ResourceStatus.SUGGESTED) : null;
  
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
      {(!validResource || validResource.length === 0) && <div>No resources found</div>}
      {/* TODO: add button to search for more */}
    </div>
  </div>;
}