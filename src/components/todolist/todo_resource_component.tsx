'use client';

import { Resource, ResourceStatus } from "@/lib/prisma/generated/prisma/browser";
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Trash } from "lucide-react";
import { bg_blue, bg_gray, bg_green, bg_red, bg_yellow } from "@/types/styles";
import { VisibleResourceStatus } from "@/types/types";
import { useData } from "../DataProviderComponent";
import ResourceComponent from "../resource/resource_component";
export default function TodoResourceComponent({ resource }: {resource: Resource}) {
  return (
    <ResourceComponent
      resource={resource}
      headerActionComponent={
        <div className='flex flex-row gap-2 items-center justify-center'>
          <StatusSelectorComponent resource={resource} />
          <DeleteButtonComponent resource={resource} />
        </div>
      }
    />
  );
}

function StatusSelectorComponent({ resource }: { resource: Resource }) {
  const { handleChange } = useData();
  const visibleStatuses = [ResourceStatus.POTENTIAL, ResourceStatus.CHOSEN, ResourceStatus.BOUGHT];

  // have a left right button and a center display
  const handleStatusChange = (direction: 'left' | 'right') => {
    let newStatus: ResourceStatus;

    if (resource.status === ResourceStatus.SUGGESTED) {
      newStatus = ResourceStatus.POTENTIAL;
      handleChange("resources", resource.id, { status: newStatus });
      return;
    };

    const currentIdx = visibleStatuses.indexOf(resource.status as VisibleResourceStatus);
    if (direction === 'left') {
      const newIndex = (currentIdx + visibleStatuses.length - 1) % visibleStatuses.length;
      newStatus = visibleStatuses[newIndex];
    } else {
      const newIndex = (currentIdx + 1) % visibleStatuses.length;
      newStatus = visibleStatuses[newIndex];
    }

    handleChange("resources", resource.id, { status: newStatus });
  }

  const get_status_color = (status: ResourceStatus): string => {
    switch (status) {
      case 'POTENTIAL': return bg_yellow;
      case 'CHOSEN': return bg_blue;
      case 'BOUGHT': return bg_green;
      default: return bg_gray;
    }
  }

  return (
    <div className='flex flex-row gap-2 items-center justify-center'>
      <button className='rounded-full bg-gray-400 aspect-square pr-[0.05rem]' onClick={() => handleStatusChange('left')}>
        <ChevronLeft className='aspect-square h-[80%]' />
      </button>

      <div className={`w-[6rem] py-2 rounded-[0.8rem] ${get_status_color(resource.status)} py-1 px-3 text-[0.8rem] font-bold text-center`} style={{ lineHeight: 1 }}>
        {resource.status.charAt(0).toUpperCase() + resource.status.slice(1).toLowerCase()}
      </div>
      
      <button className='rounded-full bg-gray-400 aspect-square pl-[0.05rem]' onClick={() => handleStatusChange('right')}>
        <ChevronRight className='aspect-square h-[80%]' />
      </button>
    </div>
  )
}

function DeleteButtonComponent({ resource }: { resource: Resource }) {
  const { handleChange } = useData();
  const onSuggested = () => {
    handleChange("resources", resource.id, { status: ResourceStatus.SUGGESTED });
  };
  return (
    <button className={`rounded-full ${bg_red} aspect-square flex items-center justify-center`} onClick={onSuggested}>
      <Trash className='aspect-square h-[65%] ml-[5%]' strokeWidth={2} />
    </button>
  )
}