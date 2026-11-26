import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Container } from "@/components/ui/container";
import { experienceDetail, hotelDetail, packageDetail } from "@/constants/routes";
import { getExperience, getHotel } from "@/features/catalog/get-catalog";
import { getPackage } from "@/features/packages/get-package";
import { readCheckoutTarget } from "@/helpers/checkout-params";
import { formatDate } from "@/helpers/format";
import { parseStayForDuration } from "@/helpers/stay-duration";
import { todayIso } from "@/helpers/stay-params";
import { isCheckoutStubEnabled } from "@/lib/flags";

// A stub: never indexed (the route is on the noindex allowlist in src/test-support/site-pages.ts).
export const metadata: Metadata = { title: "Checkout", description: "Checkout is not available yet.", robots: { index: false, follow: false } };

type SearchParams = PageProps<"/checkout">["searchParams"];

/**
 * What the visitor is about to book, read from the URL: the kind and id, the dates, the guests with child ages and, when they
 * came from a room card, the room they preselected. It prices nothing (`liveRecheck` is for the real checkout). The
 * parameters are listed in `src/helpers/checkout-params.ts`.
 */
async function StubSummary({ searchParams }: { searchParams: SearchParams }) {
  const raw = await searchParams;
  const { kind, id, roomId, selection } = readCheckoutTarget(raw);
  const hotel = kind === "hotel" && id ? await getHotel(id) : null;
  const experience = kind === "experience" && id ? await getExperience(id) : null;
  const pkg = kind === "package" && id ? await getPackage(id) : null;
  const product = experience ?? pkg;
  const stay = product ? parseStayForDuration(raw, todayIso(), product.duration, product.groupSize) : parseStayForDuration(raw, todayIso());
  const productRooms = hotel?.rooms ?? (pkg ? pkg.stays.flatMap((entry) => entry.rooms) : experience?.rooms);
  if ((!hotel && !product) || !productRooms || !stay.ok) {
    return <p className="mt-4 text-sm text-body">We could not read your stay. Please go back and choose your dates again.</p>;
  }
  const name = hotel ? hotel.name : (product?.title ?? "");
  const back = hotel ? hotelDetail(hotel.slug) : pkg ? packageDetail(pkg.slug) : experienceDetail(experience?.slug ?? "");
  const room = productRooms.find((entry) => entry.id === roomId);
  const chosen = productRooms.filter((entry) => selection[entry.id]).map((entry) => `${selection[entry.id]} × ${entry.name}`);
  const { checkIn, checkOut, nights, rooms, adults, children, childAges } = stay.stay;
  return (
    <>
      <dl className="mt-6 max-w-md border-y border-border">
        {[
          [hotel ? "Hotel" : pkg ? "Package" : "Experience", name],
          ["Dates", `${formatDate(checkIn)} – ${formatDate(checkOut)} (${nights} ${nights === 1 ? "night" : "nights"})`],
          ["Rooms and guests", `${rooms} ${rooms === 1 ? "room" : "rooms"}, ${adults} adults, ${children} children`],
          ...(childAges.length > 0 ? [["Child ages", childAges.join(", ")]] : []),
          ["Room", chosen.length > 0 ? chosen.join(", ") : room ? room.name : "Choose your rooms at checkout"],
        ].map(([label, value]) => (
          <div key={label} className="flex gap-6 border-b border-border py-3 text-sm last:border-b-0">
            <dt className="w-32 shrink-0 text-muted">{label}</dt>
            <dd className="text-primary">{value}</dd>
          </div>
        ))}
      </dl>
      <a href={back} className="mt-6 inline-block text-sm font-medium text-primary underline">
        Back to {name}
      </a>
    </>
  );
}

export default function CheckoutStubPage({ searchParams }: PageProps<"/checkout">) {
  if (!isCheckoutStubEnabled()) notFound();
  return (
    <Container className="py-16">
      <h1 className="font-display text-title font-medium text-primary">Checkout</h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-body">Online checkout is not available yet. This page only shows what you chose; nothing is booked and no payment is taken.</p>
      <Suspense fallback={<div className="mt-6 h-32" aria-hidden />}>
        <StubSummary searchParams={searchParams} />
      </Suspense>
    </Container>
  );
}
