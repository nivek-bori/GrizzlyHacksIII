"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { useNotification } from "@/components/notification/NotificationProvider";
import { ChangesPostResponse } from "@/app/api/changes/route";
import { request } from "@/lib/util/api";
import { useCallback, useEffect, useState } from "react";

const inputClassName =
  "w-full rounded-xl border-[0.12rem] border-gray-600 bg-white px-4 py-3 text-[1.05rem] outline-none focus:ring-2 focus:ring-gray-400 disabled:opacity-50";

function toDatetimeLocalValue(iso: string | Date | null | undefined): string {
  if (!iso) return "";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDatetimeLocalValue(s: string): string | null {
  const t = s.trim();
  if (!t) return null;
  const d = new Date(t);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export default function EventDescriptionComponent() {
  const { profile, refreshProfile } = useAuth();
  const { addNotification } = useNotification();

  const [location, setLocation] = useState("");
  const [timeLocal, setTimeLocal] = useState("");
  const [budget, setBudget] = useState("");
  const [extraNotes, setExtraNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const syncFromProfile = useCallback(() => {
    const ed = profile.data?.eventDescription;
    setLocation(ed?.location ?? "");
    setTimeLocal(toDatetimeLocalValue(ed?.time ?? null));
    setBudget(ed?.budget != null && !Number.isNaN(ed.budget) ? String(ed.budget) : "");
    setExtraNotes(ed?.extraNotes ?? "");
  }, [profile.data?.eventDescription]);

  useEffect(() => {
    syncFromProfile();
  }, [syncFromProfile]);

  const disabled = profile.loading || !profile.data;
  const existing = profile.data?.eventDescription;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const p = profile.data;
    if (!p || profile.loading || saving) return;

    const budgetTrim = budget.trim();
    let budgetVal: number | null = null;
    if (budgetTrim.length > 0) {
      const n = Number(budgetTrim);
      if (!Number.isFinite(n)) {
        addNotification({ message: "Enter a valid budget number or leave it blank.", type: "error" });
        return;
      }
      budgetVal = n;
    }

    const timeIso = fromDatetimeLocalValue(timeLocal);
    const id = existing?.id ?? crypto.randomUUID();
    const isNew = !existing;

    setSaving(true);
    try {
      const res = await request<ChangesPostResponse>({
        type: "POST",
        route: "/api/changes",
        body: {
          changes: {
            event_descriptions: {
              [id]: {
                profileId: p.id,
                location: location.trim() || null,
                time: timeIso,
                budget: budgetVal,
                extraNotes: extraNotes.trim(),
                _action: isNew ? "add" : "change",
              },
            },
          },
        },
      });

      if (res.status === "error") {
        addNotification({ message: res.message || "Could not save event details.", type: "error" });
        return;
      }

      addNotification({ message: "Event details saved.", type: "success" });
      await refreshProfile();
    } catch {
      addNotification({ message: "Could not save event details.", type: "error" });
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    syncFromProfile();
  }

  return (
    <div className="w-full h-full py-12 px-8 flex flex-col items-center justify-center">
      <h1 className='mb-7 text-4xl font-extrabold'>Event Details</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
        <div>
          <label htmlFor="event-location" className="mb-1 block text-[0.95rem] font-medium text-gray-800">
            Location
          </label>
          <input
            id="event-location"
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="City, venue, or address"
            disabled={disabled || saving}
            autoComplete="street-address"
            className={inputClassName}
          />
        </div>

        <div>
          <label htmlFor="event-time" className="mb-1 block text-[0.95rem] font-medium text-gray-800">
            Date and time
          </label>
          <input
            id="event-time"
            type="datetime-local"
            value={timeLocal}
            onChange={(e) => setTimeLocal(e.target.value)}
            disabled={disabled || saving}
            className={inputClassName}
          />
        </div>

        <div>
          <label htmlFor="event-budget" className="mb-1 block text-[0.95rem] font-medium text-gray-800">
            Budget (optional)
          </label>
          <input
            id="event-budget"
            type="number"
            inputMode="decimal"
            min={0}
            step="any"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="e.g. 5000"
            disabled={disabled || saving}
            className={inputClassName}
          />
        </div>

        <div>
          <label htmlFor="event-extra-notes" className="mb-1 block text-[0.95rem] font-medium text-gray-800">
            Additional notes
          </label>
          <textarea
            id="event-extra-notes"
            value={extraNotes}
            onChange={(e) => setExtraNotes(e.target.value)}
            placeholder="Accessibility needs, headcount, special requests…"
            disabled={disabled || saving}
            rows={4}
            className={`${inputClassName} min-h-26 resize-y`}
          />
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="submit"
            disabled={disabled || saving}
            className="rounded-xl border-[0.12rem] border-gray-600 bg-gray-800 px-4 py-3 text-[1rem] text-white disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <button
            type="button"
            disabled={disabled || saving}
            onClick={handleReset}
            className="rounded-xl border-[0.12rem] border-gray-500 bg-gray-200 px-4 py-3 text-[1rem] disabled:opacity-50"
          >
            Reset
          </button>
        </div>
      </form>
    </div>
  );
}
