"use client";

import LoadingComponent from "../ui/LoadingComponent";
import TodoResourceTypeComponent from "./todo_resouce_type_compoonent";
import { useData } from "../DataProviderComponent";
import { useAuth } from "../auth/AuthProvider";
import { useEffect, useRef, useState } from "react";

export default function TodolistComponent() {
  const { resourceTypes } = useData();

  return (
    <div className='w-full h-full py-12 px-8'>
      <h1 className='mb-7 text-4xl font-extrabold'>Todo List</h1>

      <AddResourceTypeSection />
      {resourceTypes && resourceTypes.length > 0 && <div className='my-[1.7rem] w-full h-0 border-t-[2px] border-gray-400'></div>}

      <div>
        {!resourceTypes && <LoadingComponent />}
        {resourceTypes && resourceTypes.map((resourceType, idx) => {
          return (
            <div key={resourceType.id ?? idx}>
              {idx > 0 && <div className='my-[1.1rem] w-full h-0'></div>}
              <TodoResourceTypeComponent resourceType={resourceType} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AddResourceTypeSection() {
  const { handleAdd } = useData();
  const { profile } = useAuth();

  const [newName, setNewName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const disabled = profile.loading || !profile.data;

  function handleCreate() {
    const name = newName.trim();
    const p = profile.data;
    if (!name || !p || profile.loading) return;

    const id = crypto.randomUUID();
    handleAdd("resource_types", id, {
      name,
      profileId: p.id,
    });
    setNewName("");
    inputRef.current?.focus();
  }

  return (
    <div>
      <div className='mb-4 text-[1.55rem] font-bold'>Add a new resource type:</div>
      <div className='flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center'>
        <label htmlFor="new-resource-type-name" className="sr-only">
          New resource type name
        </label>
        <input
          ref={inputRef}
          id="new-resource-type-name"
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleCreate();
            if (e.key === "Escape") {
              setNewName("");
            }
          }}
          placeholder="e.g. Catering, AV equipment…"
          disabled={disabled}
          className="min-w-0 flex-1 rounded-xl border-[0.12rem] border-gray-600 bg-white px-4 py-3 text-[1.05rem] outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50"
        />
        <div className="flex gap-2">
          <button
            type="button"
            disabled={disabled || !newName.trim()}
            onClick={handleCreate}
            className="rounded-xl border-[0.12rem] border-gray-600 bg-gray-800 px-4 py-3 text-[1rem] text-white disabled:opacity-50"
          >
            Save
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => {
              setNewName("");
            }}
            className="rounded-xl border-[0.12rem] border-gray-500 bg-gray-200 px-4 py-3 text-[1rem] disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}