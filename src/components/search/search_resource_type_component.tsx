import { ResourceType } from "@/lib/prisma/generated/prisma/client";
import PotentialTodoComponent from "../todolist/todo_resource_component";
import TodoResourceComponent from "../todolist/todo_resource_component";
import { RelationalResourceType } from "@/types/types";
import SearchResourceComponent from "./search_resource_component";

export default function SearchResourceTypeComponent({ resourceType }: { resourceType: RelationalResourceType }) {
  return <div>
    <h2 className='mb-[0.4rem] text-[1.7rem] font-bold'>{resourceType.name}:</h2>

    <div className='w-full px-[2rem]'>
      {resourceType.resources && resourceType.resources.map((resource, idx) => (
        <div key={idx}>
          {idx > 0 && (
            <div className='my-[1.1rem] w-[90%] h-0 border-t-[2px] border-gray-400'></div>
          )}
          <SearchResourceComponent resource={resource} />
        </div>
      ))}
    </div>
  </div>;
}