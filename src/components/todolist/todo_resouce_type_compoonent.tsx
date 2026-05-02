'use client';

import { RelationalResourceType } from "@/types/types";
import TodoResourceComponent from "./todo_resource_component";
import { ChevronRight, Trash } from "lucide-react";
import { useState } from "react";
import { ResourceStatus } from "@/lib/prisma/generated/prisma/enums";
import { ResourceType } from "@/lib/prisma/generated/prisma/client";
import { useData } from "../DataProviderComponent";
import { bg_red } from "@/types/styles";

export default function TodoResourceTypeComponent({ resourceType }: { resourceType: RelationalResourceType }) {
  const [isOpen, setIsOpen] = useState(false);

  const validResources = resourceType.resources ? resourceType.resources.filter(resource => resource.status !== ResourceStatus.SUGGESTED) : null;

  return (
    <div className={`rounded-[1rem] bg-gray-300 py-5 px-5 ${isOpen ? 'pb-8' : ''} pr-6`}>
      <div className={`flex flex-row justify-between items-start`}>
        <button
          onClick={() => setIsOpen(prev => !prev)}
          className={`${isOpen ? ' mb-[1.4rem]' : ''} flex flex-row items-center w-full`} style={{ lineHeight: 1 }}
        >
          <span
            className={`mr-2 w-[1.85rem] h-[1.75rem] transition-transform duration-200 ease-in-out inline-flex items-center`}
            style={{ transform: `rotate(${isOpen ? 90 : 0}deg)` }}
          >
            <ChevronRight className="w-full h-full" />
          </span>


          <span className=' mr-2 font-bold text-[1.75rem]' style={{ lineHeight: 1 }}>{resourceType.name}</span>
        </button>

        {isOpen && <DeleteButtonComponent resourceType={resourceType} />}
      </div>


      {isOpen && validResources && validResources.map((resource, idx) => (
        <div key={idx}>
          {idx > 0 && (
            <div className='my-[1.2rem] w-[90%] h-0 border-t-[2px] border-gray-400'></div>
          )}
          <TodoResourceComponent resource={resource} />
        </div>
      ))}
      {isOpen && (!validResources || validResources.length === 0) && <div>No resources boomarked yet</div>}
    </div>
  );
}

function DeleteButtonComponent({ resourceType }: { resourceType: ResourceType }) {
  const { handleDelete } = useData();
  const onDelete = () => {
    handleDelete("resource_types", resourceType.id);
  };
  return (
    <button className={`rounded-full ${bg_red} aspect-square flex items-center justify-center w-[2.06rem]`} onClick={onDelete}>
      <Trash className='aspect-square h-[65%] ml-[5%]' strokeWidth={2} />
    </button>
  )
}