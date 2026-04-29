'use client';

import { Resource, ResourceStatus } from "@/lib/prisma/generated/prisma/browser";
import HorizontalSplit from "../ui/HorizontalSplit";
import { useEffect, useState } from "react";
import { BookmarkIcon } from "lucide-react";
import { useData } from "../DataProviderComponent";

export default function SearchResourceComponent({ resource }: { resource: Resource }) {
  const { handleChange } = useData();
  const [draft, setDraft] = useState({
    name: resource.name,
    budget: String(resource.budget),
    time: toDateTimeLocalValue(resource.time),
    location: resource.location ?? "",
    url: resource.url ?? "",
  });

  useEffect(() => {
    setDraft({
      name: resource.name,
      budget: String(resource.budget),
      time: toDateTimeLocalValue(resource.time),
      location: resource.location ?? "",
      url: resource.url ?? "",
    });
  }, [resource]);

  const editableFields: Array<{ key: "budget" | "time" | "location" | "url"; label: string }> = [
    { key: "budget", label: "Budget:" },
    { key: "time", label: "Time:" },
    { key: "location", label: "Location:" },
    { key: "url", label: "URL:" },
  ];

  const updateField = (
    key: "name" | "budget" | "time" | "location" | "url",
    value: string
  ) => {
    setDraft((prev) => ({ ...prev, [key]: value }));

    if (key === "name") {
      handleChange("resources", resource.id, { name: value });
      return;
    }
    if (key === "budget") {
      const parsed = Number(value);
      handleChange("resources", resource.id, { budget: Number.isFinite(parsed) ? parsed : 0 });
      return;
    }
    if (key === "time") {
      handleChange("resources", resource.id, { time: value ? new Date(value) : null });
      return;
    }
    if (key === "location") {
      handleChange("resources", resource.id, { location: value || null });
      return;
    }
    handleChange("resources", resource.id, { url: value || null });
  };

  const leftFields = editableFields.filter((_, idx) => idx % 2 === 0);
  const rightFields = editableFields.filter((_, idx) => idx % 2 === 1);

  return (
    <div className='w-full'>
      {/* header */}
      <div className='w-full flex flex-row items-center mb-2'>
        <BookmarkComponent resource={resource} />
        <input
          className='font-bold text-[1.2rem] bg-transparent border-b border-transparent focus:border-gray-400 outline-none w-full mr-2'
          value={draft.name}
          onChange={(e) => updateField("name", e.target.value)}
        />
      </div>

      {/* body */}
      <div className='w-full'>
        <HorizontalSplit
          mode="content"
          left={<DescriptionComponent className='mr-2' fields={leftFields} values={draft} onChange={updateField} />}
          right={<DescriptionComponent className='ml-2' fields={rightFields} values={draft} onChange={updateField} />}
        />
      </div>
    </div>
  );
}

function DescriptionComponent({
  fields,
  values,
  onChange,
  className = '',
}: {
  fields: Array<{ key: "budget" | "time" | "location" | "url"; label: string }>;
  values: { budget: string; time: string; location: string; url: string };
  onChange: (key: "budget" | "time" | "location" | "url", value: string) => void;
  className?: string;
}) {
  return (
    <div className={className}>
      {fields.map((field) => (
        <div key={field.key} className="mb-1">
          <span className="font-semibold">{field.label} </span>
          <input
            type={field.key === "time" ? "datetime-local" : field.key === "budget" ? "number" : "text"}
            className="wrap-break-words bg-transparent border-b border-transparent focus:border-gray-400 outline-none w-full"
            value={values[field.key]}
            onChange={(e) => onChange(field.key, e.target.value)}
          />
        </div>
      ))
      }
    </div>
  );
}

function BookmarkComponent({ resource }: { resource: Resource }) {
  const { handleChange } = useData();
  const handleBookmark = () => {
    resource.status = ResourceStatus.POTENTIAL;
    handleChange("resources", resource.id, { status: ResourceStatus.POTENTIAL });
  };
  
  return (
    <div className='w-full flex flex-row items-center justify-between'>
      <button onClick={handleBookmark} className='w-[1.5rem] h-[1.5rem] bg-gray-200 rounded-full flex items-center justify-center'>
        <BookmarkIcon className='w-[1.3rem] h-[1.3rem]' />
      </button>
    </div>
  );
}

function toDateTimeLocalValue(value: Date | string | null): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const h = pad(date.getHours());
  const min = pad(date.getMinutes());
  return `${y}-${m}-${d}T${h}:${min}`;
}

function handleChange(arg0: string, id: string, arg2: { status: "POTENTIAL"; }) {
  throw new Error("Function not implemented.");
}
