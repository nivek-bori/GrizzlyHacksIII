import { ResourceType } from "@/lib/prisma/generated/prisma/client";
import LoadingComponent from "../ui/LoadingComponent";
import TodoResourceTypeComponent from "./todo_resouce_type_compoonent";

export default function TodolistComponent({ resourceTypes }: {resourceTypes: ResourceType[]}) {
  return (
    <div className='w-full h-full py-12 px-8'>
      <h1 className='mb-7 text-4xl font-extrabold'>Todo List</h1>
      <button className='mb-7 w-full py-4 px-5 rounded-[1.5rem] bg-gray-300 border-[0.13rem] border-gray-600 text-[1.1rem] text-black'>(+) add another resource type</button>
      <div>
        {!resourceTypes && <LoadingComponent />}
        {resourceTypes && resourceTypes.map((resourceType, idx) => (
          <div key={idx}>
            {idx > 0 && <div className='my-[1.1rem] w-full h-0'></div>}
            <TodoResourceTypeComponent resourceType={resourceType} />
          </div>
        ))}
      </div>
    </div>
  );
}