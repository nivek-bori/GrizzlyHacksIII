'use client';

import { Resource, ResourceStatus } from "@/lib/prisma/generated/prisma/browser";
import HorizontalSplit from "../ui/HorizontalSplit";
import { useEffect, useState } from "react";
import { BookmarkIcon } from "lucide-react";
import { useData } from "../DataProviderComponent";
import ResourceComponent from "../resource/resource_component";

export default function SearchResourceComponent({ resource }: { resource: Resource }) {
  return (
    <ResourceComponent resource={resource} headerActionComponent={<BookmarkComponent resource={resource} />} />
  );
}

function BookmarkComponent({ resource }: { resource: Resource }) {
  const { handleChange } = useData();
  const handleBookmark = () => {
    resource.status = ResourceStatus.POTENTIAL;
    handleChange("resources", resource.id, { status: ResourceStatus.POTENTIAL });
  };

  return (
    <button onClick={handleBookmark} className='p-2 h-full bg-gray-200 rounded-full flex flex-row items-center justify-center gap-x-2'>
      <BookmarkIcon className='w-[1.2rem] h-[1.2rem]' />
      <p className='text-[0.9rem]' style={{ lineHeight: '1rem' }}>Bookmark</p>
    </button>
  );
}