"use client";

import { Minus, Plus } from "lucide-react";
import { useEffect } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/helpers/cn";
import { selectedCount } from "@/helpers/room-selection";
import { useStay } from "@/hooks/use-stay";
import { stayStore } from "@/store/stay-store";

const ROUND = "flex size-9 items-center justify-center rounded-full border border-border bg-card text-primary transition-colors hover:bg-surface disabled:pointer-events-none disabled:opacity-40";

/**
 * SELECT ROOM, then a stepper once the room is chosen. The quantities of all room cards add up to the rooms searched:
 * "+" (and "Select room") is disabled on every card when that sum is reached; with one room searched, choosing another room
 * swaps the choice. `unavailable` (no rooms for the dates) shows a disabled "Unavailable" button. Reads the URL for the guests, so render it inside <Suspense>.
 */
export function RoomPicker({ roomId, roomName, unavailable = false }: { roomId: string; roomName: string; unavailable?: boolean }) {
  const { rooms, selection } = useStay();
  const quantity = selection[roomId] ?? 0;
  const full = selectedCount(selection) >= rooms;
  const canAdd = !full || (rooms === 1 && quantity === 0);

  // A room that is sold out for the dates cannot stay selected.
  useEffect(() => {
    if (unavailable) stayStore.removeRoom(roomId);
  }, [unavailable, roomId]);

  if (unavailable) {
    return (
      <button type="button" disabled className={buttonVariants({ variant: "outline", size: "md" })}>
        Unavailable
        <span className="sr-only"> {roomName}: not available for these dates</span>
      </button>
    );
  }

  if (quantity === 0) {
    return (
      <button type="button" disabled={!canAdd} onClick={() => stayStore.adjustRoom(roomId, 1)} className={buttonVariants({ variant: "primary", size: "md" })}>
        Select room
        <span className="sr-only"> {roomName}</span>
      </button>
    );
  }

  return (
    <div role="group" aria-label={`${roomName}: rooms selected`} className="flex h-9 items-center gap-4">
      <button type="button" aria-label={`Remove one ${roomName}`} onClick={() => stayStore.adjustRoom(roomId, -1)} className={ROUND}>
        <Minus className="size-3.5" aria-hidden />
      </button>
      <span className={cn("w-5 text-center text-sm font-semibold text-primary")} aria-live="polite">
        {quantity}
      </span>
      <button type="button" aria-label={`Add one ${roomName}`} disabled={full} onClick={() => stayStore.adjustRoom(roomId, 1)} className={ROUND}>
        <Plus className="size-3.5" aria-hidden />
      </button>
    </div>
  );
}

/** What the room card shows until the stay (read from the URL) is known: the same size as the button, not clickable. */
export function RoomPickerFallback({ roomName }: { roomName: string }) {
  return (
    <button type="button" disabled className={buttonVariants({ variant: "primary", size: "md" })}>
      Select room
      <span className="sr-only"> {roomName}</span>
    </button>
  );
}
