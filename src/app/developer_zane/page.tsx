"use client";

import HorizontalSplit from "@/components/ui/HorizontalSplit";
import TodolistComponent from "@/components/todolist/todolist_component";
import { useData } from "@/components/DataProviderComponent";
import SearchComponent from "@/components/search/search_component";
import EventDescriptionComponent from "@/components/event_description/event_description_component";
import CTAComponent from "@/components/cta/CTA_component";

export default function DeveloperZanePage() {

  return (
    <div className='w-full h-full flex items-center justify-center'>
      <div className='grow-0 max-w-[80rem] w-full h-full flex flex-col items-center justify-center'>
        <HorizontalSplit
          left={
            <>
              <CTAComponent />
            </>
          }
          right={
            <>
              <EventDescriptionComponent />
            </>
          }
        />
      </div>
    </div>
  );
}