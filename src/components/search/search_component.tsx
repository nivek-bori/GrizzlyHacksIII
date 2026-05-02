"use client"

import { useRef, useState } from 'react';
import { useData } from '../DataProviderComponent';
import LoadingComponent from '../ui/LoadingComponent';
import SearchResourceTypeComponent from './search_resource_type_component';
import { AIPostResponse } from '@/app/api/ai/route';
import { request } from '@/lib/util/api';
import { useNotification } from '../notification/NotificationProvider';
import { Send } from 'lucide-react';

export default function SearchComponent() {
  const { resourceTypes } = useData();
  const { addNotification } = useNotification();

  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [disabled, setDisabled] = useState(false);

  const handleSearch = async () => {
    if (disabled || query.trim().length === 0) return;

    setDisabled(true);

    const body = {
      find_resources_data: {
        information: query.trim(),
      },
    };
    try {
      const res = await request<AIPostResponse>({
        type: "POST",
        route: "/api/ai",
        body: body,
      });

      if (res.find_resources_data?.status === "error") {
        addNotification({ message: res.find_resources_data.message, type: "error" });
      } else {
        setQuery("");
        inputRef.current?.focus();
      }
    } catch {
      addNotification({ message: "Search request failed.", type: "error" });
    } finally {
      setDisabled(false);
    }
  };

  if (!resourceTypes) {
    return (
      <div className="max-h-full w-full overflow-y-auto py-12 px-8">
        <h1 className="mb-7 text-4xl font-extrabold">Search for Resources</h1>
        <LoadingComponent />
      </div>
    );
  }

  return (
    <div className="max-h-full w-full overflow-y-auto py-12 px-8">
      <h1 className="mb-7 text-4xl font-extrabold">Search for Resources</h1>
      <div className="mb-4 text-[1.55rem] font-bold">Find a specific resource:</div>
      <div className="flex flex-row items-center gap-x-4">
        <label htmlFor="resource-search-query" className="sr-only">
          Search for a resource by name, location, type, etc.
        </label>
        <input
          ref={inputRef}
          disabled={disabled}
          id="resource-search-query"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleSearch();
            }
            if (e.key === "Escape") {
              setQuery("");
            }
          }}
          placeholder="Search for resources"
          className="min-w-0 flex-1 rounded-xl border-[0.12rem] border-gray-600 bg-white px-4 py-3 text-[1.05rem] outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
        />
        <button
          type="button"
          disabled={disabled}
          onClick={() => void handleSearch()}
          className="flex aspect-square cursor-pointer items-center justify-center rounded-full bg-black px-[0.7rem] pb-[0.2rem] pl-[0.6rem] pt-[0.3rem] text-[1.05rem] outline-none disabled:opacity-50"
        >
          <Send color="white" className="aspect-square h-[85%]" />
        </button>
      </div>
      <div className="mb-[1.4rem] mt-[1.7rem] h-0 w-full border-t-2 border-gray-400"></div>

      <div>
        {resourceTypes.map((resourceType, idx) => (
          <div key={resourceType.id ?? idx}>
            {idx > 0 && <div className="mb-[0.8rem] mt-[1.7rem] h-0 w-full"></div>}
            <SearchResourceTypeComponent resourceType={resourceType} />
          </div>
        ))}
      </div>
    </div>
  );
}