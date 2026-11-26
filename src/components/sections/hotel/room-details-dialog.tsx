"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { BedDouble, Check, ChevronLeft, ChevronRight, Maximize2, Users, Utensils, X, type LucideIcon } from "lucide-react";
import Image from "next/image";
import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/helpers/cn";
import { formatMoney } from "@/helpers/format";
import type { HotelRoom, Money } from "@/interfaces";
import { SAFE_AREA_PADDING } from "@/constants/safe-area";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "amenities", label: "Amenities" },
  { id: "good-to-know", label: "Good to know" },
] as const;
type TabId = (typeof TABS)[number]["id"];

function Fact({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) {
  return (
    <li className="flex items-center gap-2 border border-border px-3 py-1.5 text-xs text-primary">
      <Icon className="size-3.5 shrink-0 text-muted-blue" aria-hidden /> {children}
    </li>
  );
}

/** Large photo with previous and next buttons, a counter and a strip of thumbnails. Arrows and thumbnails are real buttons. */
function RoomGallery({ images, roomName }: { images: HotelRoom["images"]; roomName: string }) {
  const [index, setIndex] = useState(0);
  const go = (next: number) => setIndex((next + images.length) % images.length);
  const current = images[index];
  const arrow = "absolute top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card text-primary shadow-header transition-colors hover:bg-surface";

  return (
    <div>
      <div className="relative aspect-[4/3] overflow-hidden bg-surface">
        <Image key={current.src} src={current.src} alt={current.alt} fill sizes="(min-width: 768px) 480px, 100vw" className="object-cover" />
        {images.length > 1 ? (
          <>
            <button type="button" aria-label="Previous photo" onClick={() => go(index - 1)} className={cn(arrow, "left-3")}>
              <ChevronLeft className="size-4" aria-hidden />
            </button>
            <button type="button" aria-label="Next photo" onClick={() => go(index + 1)} className={cn(arrow, "right-3")}>
              <ChevronRight className="size-4" aria-hidden />
            </button>
            <p className="absolute bottom-3 right-3 z-10 bg-primary/80 px-2 py-1 text-micro tracking-widest text-primary-foreground" aria-live="polite">
              {index + 1} / {images.length}
            </p>
          </>
        ) : null}
      </div>
      {images.length > 1 ? (
        <ul className="mt-2 grid grid-cols-4 gap-2" aria-label={`Photos of ${roomName}`}>
          {images.map((image, position) => (
            <li key={image.src}>
              <button
                type="button"
                aria-label={`Show photo ${position + 1}`}
                aria-current={position === index}
                onClick={() => setIndex(position)}
                className={cn("relative block aspect-[4/3] w-full overflow-hidden border-2 transition-colors", position === index ? "border-primary" : "border-transparent opacity-70 hover:opacity-100")}
              >
                <Image src={image.src} alt="" fill sizes="120px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/** Tabs with arrow-key, Home and End navigation. Only the active panel is shown. */
function RoomTabs({ room, cancellationNote }: { room: HotelRoom; cancellationNote: string }) {
  const base = useId();
  const [active, setActive] = useState<TabId>("overview");
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!step && event.key !== "Home" && event.key !== "End") return;
    event.preventDefault();
    const target = event.key === "Home" ? 0 : event.key === "End" ? TABS.length - 1 : (index + step + TABS.length) % TABS.length;
    setActive(TABS[target].id);
    refs.current[TABS[target].id]?.focus();
  }

  return (
    <div>
      <div role="tablist" aria-label="Room information" className="flex border-b border-border">
        {TABS.map((tab, index) => (
          <button
            key={tab.id}
            ref={(node) => {
              refs.current[tab.id] = node;
            }}
            role="tab"
            type="button"
            id={`${base}-tab-${tab.id}`}
            aria-selected={active === tab.id}
            aria-controls={`${base}-panel-${tab.id}`}
            tabIndex={active === tab.id ? 0 : -1}
            onClick={() => setActive(tab.id)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={cn("-mb-px border-b-2 px-4 py-3 text-sm transition-colors", active === tab.id ? "border-primary font-medium text-primary" : "border-transparent text-body hover:text-primary")}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`${base}-panel-${active}`} aria-labelledby={`${base}-tab-${active}`} className="pt-5">
        {active === "overview" ? (
          <div className="space-y-5">
            <p className="text-sm leading-relaxed text-body">{room.description}</p>
            <div>
              <h3 className="text-micro uppercase tracking-widest text-muted-blue">Highlights</h3>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {room.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-primary">
                    <Check className="size-3.5 shrink-0 text-accent-hover" strokeWidth={3} aria-hidden /> {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : active === "amenities" ? (
          <div className="space-y-5">
            {room.amenityGroups.map((group) => (
              <section key={group.label} aria-label={group.label}>
                <h3 className="text-micro uppercase tracking-widest text-muted-blue">{group.label}</h3>
                <ul className="mt-2 grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
                  {group.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-body">
                      <Check className="size-3.5 shrink-0 text-primary" strokeWidth={3} aria-hidden /> {item}
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        ) : (
          <dl className="divide-y divide-border border-y border-border text-sm">
            {[
              ["Sleeps", `Up to ${room.maxOccupancy} guests (${room.maxAdults} adults at most)`],
              ["Room size", `${room.sizeSqm} m²`],
              ["Beds", room.bed],
              ["Meals", room.board],
              ["Cancellation", cancellationNote],
            ].map(([label, value]) => (
              <div key={label} className="grid grid-cols-[110px_1fr] gap-3 py-2.5">
                <dt className="text-muted-blue">{label}</dt>
                <dd className="text-primary">{value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </div>
  );
}

/** The footer's price block: a small caption, the price, and an optional unit. */
export function DialogPrice({ price, caption, suffix }: { price: Money; caption: string; suffix?: string }) {
  return (
    <p className="flex items-baseline gap-2">
      <span className="text-micro uppercase tracking-widest text-muted-blue">{caption}</span>
      <span className="font-display text-title-sm font-semibold text-primary">{formatMoney(price)}</span>
      {suffix ? <span className="text-xs text-body">{suffix}</span> : null}
    </p>
  );
}

/**
 * A room's name that opens its details in a dialog: photos with thumbnails, then tabs (Overview, Amenities, Good to know)
 * and a footer with the nightly "from" price and the same select control as the card (`action`, a server-rendered node, so
 * a sold-out room stays unselectable here too). Escape and the close button close it and give focus back to the name; on a
 * phone it fills the screen and the footer stays in view while the content scrolls.
 */
export function RoomDetailsDialog({ room, cancellationNote, action, price, priceCaption = "Per night from", priceSuffix }: { room: HotelRoom; cancellationNote: string; action?: ReactNode; /** The footer's price block. Without it, the room's own "from" price (when it has one). */ price?: ReactNode; priceCaption?: string; priceSuffix?: string }) {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button type="button" className="text-left underline decoration-border decoration-1 underline-offset-4 transition-colors hover:decoration-primary focus-visible:decoration-primary">
          {room.name}
          <span className="sr-only">: view room details</span>
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-overlay" />
        <Dialog.Content className={`fixed inset-0 z-50 flex flex-col bg-card ${SAFE_AREA_PADDING} md:inset-auto md:left-1/2 md:top-1/2 md:max-h-[90dvh] md:p-0 md:w-[min(960px,calc(100vw-48px))] md:-translate-x-1/2 md:-translate-y-1/2`}>
          <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-4 md:px-6">
            <div className="min-w-0">
              <p className="text-micro font-semibold uppercase tracking-widest text-body">Room details</p>
              <Dialog.Title className="mt-1 font-display text-title-sm font-medium text-primary">{room.name}</Dialog.Title>
              <Dialog.Description className="sr-only">Photos, amenities and good-to-know facts for {room.name}.</Dialog.Description>
              <ul className="mt-3 flex flex-wrap gap-2">
                <Fact icon={Maximize2}>{room.sizeSqm} m²</Fact>
                <Fact icon={BedDouble}>{room.bed}</Fact>
                <Fact icon={Utensils}>{room.board}</Fact>
                <Fact icon={Users}>Up to {room.maxOccupancy} guests</Fact>
              </ul>
            </div>
            <Dialog.Close aria-label="Close room details" className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border text-primary transition-colors hover:bg-surface">
              <X className="size-4" aria-hidden />
            </Dialog.Close>
          </header>

          <div className="grid flex-1 gap-6 overflow-y-auto px-5 py-5 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:px-6">
            <RoomGallery images={room.images} roomName={room.name} />
            <RoomTabs room={room} cancellationNote={cancellationNote} />
          </div>

          {/* The price at the start, the select control at the far end of the box (the content's side padding on both sides); below 400px they stack and the control is full width. */}
          <footer data-room-footer className="flex flex-col gap-3 border-t border-border bg-card px-5 py-4 min-[400px]:flex-row min-[400px]:items-center min-[400px]:justify-between md:px-6">
            {price ?? (room.priceFrom ? <DialogPrice price={room.priceFrom} caption={priceCaption} suffix={priceSuffix} /> : <span />)}
            {action ? <div className="flex min-[400px]:ml-auto [&>*]:flex-1 min-[400px]:[&>*]:flex-none">{action}</div> : null}
          </footer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
