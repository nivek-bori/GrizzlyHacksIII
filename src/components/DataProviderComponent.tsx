'use client';

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { ResourceType } from "@/lib/prisma/generated/prisma/client";
import { useAuth } from "./auth/AuthProvider";
import { supabase } from "@/lib/supabase/client";
import { useNotification } from "./notification/NotificationProvider";
import { ResourceTypeGetResponse } from "@/app/api/resource_types/route";
import { request } from "@/lib/util/api";
import { Changes, type RelationalResourceType } from "@/types/types";
import { ChangesPostResponse } from "@/app/api/changes/route";

export type ChangesRowAction = "add" | "change" | "delete";

type DataContextType = {
  resourceTypes: ResourceType[] | null;
  changes: Changes;
  handleChange: (table: string, id: string, data: any) => void;
  handleAdd: (table: string, id: string, data: any) => void;
  handleDelete: (table: string, id: string) => void;
  updateDatabase: () => Promise<void>;
};

const DataContext = createContext<DataContextType | undefined>(undefined);

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useData must be used within a DataProviderComponent");
  }
  return context;
}

export default function DataProviderComponent({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  const [currentProfileId, setCurrentProfileId] = useState<string | null>(null);
  
  const { addNotification } = useNotification();

  // RESOURCE TYPES

  const [resourceTypes, setResourceTypes] = useState<RelationalResourceType[] | null>(null);
  useEffect(() => {
    if (profile.loading || !profile.data) return;

    if (currentProfileId !== profile.data.id) {
      setCurrentProfileId(profile.data.id);

      loadResourceTypes();
      const channel = setUpResourceTypesChannel(profile.data.id);

      return () => {
        if (channel) supabase.removeChannel(channel);
      };
    }
  }, [profile.data?.id, profile.loading]);

  async function loadResourceTypes() {
    const res = await request<ResourceTypeGetResponse>({
      type: 'GET',
      route: '/api/resource_types',
      body: {},
    });

    if (res.status === 'error') {
      console.log(`error loading resource types`, res.message);
      addNotification({ message: res.message, type: 'error' });
    }

    if (res.resourceTypes) {
      setResourceTypes(res.resourceTypes);
    }
  }

  function setUpResourceTypesChannel(id: string) {
    if (profile.loading || !profile.data) return;

    const channelName = `resource-types-${id}`;

    const channels = supabase.getChannels();
    let channel = channels.find((channel) => {
      return (channel.topic === channelName || channel.topic === `realtime:${channelName}`)
    });

    if (channel === undefined) {
      channel = supabase
        .channel(channelName)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "ResourceType" },
          (payload) => {
            loadResourceTypes();
          }
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "Resource" },
          (payload) => {
            loadResourceTypes();
          }
        )
        .subscribe();

    }

    return channel;
  }

  // CHANGE
  const [changes, setChanges] = useState<Changes>({});

  function handleChange(table: string, id: string, data: any) {
    setChanges(prev => {
      const prevRow = prev[table]?.[id];
      const action: ChangesRowAction = prevRow?._action === "add" ? "add" : (prevRow?._action ?? "change");
      return {
        ...prev,
        [table]: {
          ...prev[table],
          [id]: {
            ...prevRow,
            ...data,
            _action: action,
          },
        },
      };
    });

    if (data == null || typeof data !== "object") return;

    if (table === "resource_types") {
      setResourceTypes(prev =>
        prev?.map(rt => (rt.id === id ? { ...rt, ...data } : rt)) ?? prev
      );
      return;
    }

    if (table === "resources") {
      setResourceTypes(prev =>
        prev
          ? prev.map(rt => ({
              ...rt,
              resources: (rt.resources ?? []).map(r =>
                r.id === id ? { ...r, ...data } : r
              ),
            }))
          : prev
      );
    }
  }

  function handleAdd(table: string, id: string, data: any) {
    setChanges(prev => ({
      ...prev,
      [table]: {
        ...prev[table],
        [id]: {
          ...data,
          _action: "add",
        },
      },
    }));

    if (table !== "resource_types") return;

    setResourceTypes(prev => {
      const row: RelationalResourceType = {
        id,
        name: typeof data?.name === "string" ? data.name : "",
        profileId: typeof data?.profileId === "string" ? data.profileId : "",
        resources: [],
      };
      if (!prev) return [row];
      if (prev.some(r => r.id === id)) return prev;
      return [...prev, row];
    });
  }

  function handleDelete(table: string, id: string) {
    setChanges(prev => ({
      ...prev,
      [table]: {
        ...prev[table],
        [id]: { _action: "delete" },
      },
    }));

    if (table === "resource_types") {
      setResourceTypes(prev => (prev ? prev.filter(r => r.id !== id) : prev));
      return;
    }

    if (table === "resources") {
      setResourceTypes(prev =>
        prev
          ? prev.map(resourceType => ({
            ...resourceType,
            resources: (resourceType.resources ?? []).filter(resource => resource.id !== id),
          }))
          : prev
      );
    }
  }

  async function updateDatabase() {
    const hasChanges = Object.keys(changes).length > 0;
    if (!hasChanges) return;

    const toSaveChanges = { ...changes };
    setChanges({});
    setUpdateStatus("loading");

    const res = await request<ChangesPostResponse>({
      type: "POST",
      route: "/api/changes",
      body: { changes: toSaveChanges },
    });

    if (res.status === "error") {
      setUpdateStatus("error");
      setChanges(prev => {
        return {
          ...toSaveChanges,
          ...prev,
        }
      })
      loadResourceTypes();
    } else {
      setUpdateStatus("saved");
      setTimeout(() => {
        setUpdateStatus(prev => (prev === "saved") ? "idle" : prev);
      }, 3000);
    }

  }

  const updateDatabaseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [updateStatus, setUpdateStatus] = useState<"idle" | "loading" | "saved" | "error">("idle");
  useEffect(() => {
    if (updateDatabaseTimeoutRef.current) {
      clearTimeout(updateDatabaseTimeoutRef.current);
      updateDatabaseTimeoutRef.current = null;
    }

    if (updateStatus !== "loading" && Object.keys(changes).length > 0) {
      updateDatabaseTimeoutRef.current = setTimeout(() => {
        updateDatabase();
      }, 1000); // TODO set to 5000
    }

    return () => {
      if (updateDatabaseTimeoutRef.current) {
        clearTimeout(updateDatabaseTimeoutRef.current);
        updateDatabaseTimeoutRef.current = null;
      }
    };
  }, [changes]);

  const value = useMemo(
    () => ({
      resourceTypes,
      changes,
      handleChange,
      handleAdd,
      handleDelete,
      updateDatabase,
    }),
    [resourceTypes, changes]
  );

  const popupStyles: Record<"loading" | "saved" | "error", string> = {
    loading: "bg-gray-500 text-white",
    saved: "bg-green-600 text-white",
    error: "bg-red-600 text-white",
  };

  return <DataContext.Provider value={value}>
    {children}
    {updateStatus !== "idle" && (
      <div className="fixed bottom-5 left-1/2 z-40 -translate-x-1/2 pointer-events-none">
        <div className={`rounded-full px-[1.2rem] py-1 text font-medium shadow-sm ${popupStyles[updateStatus]}`}>
          {updateStatus}
        </div>
      </div>
    )}
    {updateStatus === "idle" && Object.keys(changes).length > 0 && (
      <div className="fixed bottom-5 left-1/2 z-40 -translate-x-1/2 pointer-events-none">
        <div className={`rounded-full px-[1.2rem] py-1 text font-medium shadow-sm bg-red-400`}>
          unsaved
        </div>
      </div>
    )}
  </DataContext.Provider>;
}