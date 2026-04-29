'use client';

import { RelationalResourceType } from "@/types/types";
import TodoResourceComponent from "./todo_resource_component";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { ResourceStatus } from "@/lib/prisma/generated/prisma/enums";

export default function TodoResourceTypeComponent({ resourceType }: { resourceType: RelationalResourceType }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`rounded-[1rem] bg-gray-300 py-5 px-5 ${isOpen ? 'pb-8' : ''} pr-6`}>
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className={`${isOpen ? 'mb-5' : ''} flex flex-row items-center w-full`} style={{ lineHeight: 1 }}
      >
        <span
          className={`mr-2 w-[1.85rem] h-[1.75rem] transition-transform duration-200 ease-in-out inline-flex items-center`}
          style={{ transform: `rotate(${isOpen ? 90 : 0}deg)` }}
        >
          <ChevronRight className="w-full h-full" />
        </span>
   
  
        <span className=' mr-2 font-bold text-[1.75rem]' style={{ lineHeight: 1 }}>{resourceType.name}</span>
      </button>
      
      {isOpen && resourceType.resources && resourceType.resources.filter(resource => resource.status !== ResourceStatus.POTENTIAL).map((resource, idx) => (
        <div key={idx}>
          {idx > 0 && (
            <div className='my-[1.2rem] w-[90%] h-0 border-t-[2px] border-gray-400'></div>
          )}
          <TodoResourceComponent resource={resource} />
        </div>
      ))}
    </div>
  );
}