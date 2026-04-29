"use client";

import HorizontalSplit from "@/components/ui/HorizontalSplit";
import TodolistComponent from "@/components/todolist/todolist_component";
import { useData } from "@/components/DataProviderComponent";
import SearchComponent from "@/components/search/search_component";

export default function DeveloperKevinPage() {
  const { resourceTypes } = useData();
  
  console.log(`resourceTypes`, resourceTypes);  
  
  return (
    <div className='w-full h-full flex flex-col items-center justify-center'>
      <HorizontalSplit
        left={
          <>
            {!resourceTypes && <div>loading sources...</div>}
            {resourceTypes && <TodolistComponent resourceTypes={resourceTypes} />}
          </>
        }
        right={
          <>
            {!resourceTypes && <div>loading resources...</div>}
            {resourceTypes && <SearchComponent resourceTypes={resourceTypes} />}
          </>
        }
      />
    </div>
  );
}