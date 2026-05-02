"use client";

import HorizontalSplit from "@/components/ui/HorizontalSplit";
import TodolistComponent from "@/components/todolist/todolist_component";
import { useData } from "@/components/DataProviderComponent";
import SearchComponent from "@/components/search/search_component";

export default function DeveloperKevinPage() {
  const { resourceTypes } = useData();

  return (
    <div className='w-full h-full flex items-center justify-center'>
      <div className='grow-0 max-w-[80rem] w-full h-full flex flex-col items-center justify-center'>
        <HorizontalSplit
          left={
            <>
              {!resourceTypes && <div>loading sources...</div>}
              {resourceTypes && <TodolistComponent />}
            </>
          }
          right={
            <>
              {!resourceTypes && <div>loading resources...</div>}
              {resourceTypes && <SearchComponent />}
            </>
          }
        />
      </div>
    </div>
  );
}