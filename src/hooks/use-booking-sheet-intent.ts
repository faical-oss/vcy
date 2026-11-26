"use client";

import { createContext, useContext } from "react";

/** Which panel of the booking form the mobile bar asks the sheet to open: the dates, the travellers, or none. Outside the sheet it is null. */
export type BookingSheetIntent = "dates" | "guests" | null;

export const BookingSheetIntentContext = createContext<BookingSheetIntent>(null);

export const useBookingSheetIntent = (): BookingSheetIntent => useContext(BookingSheetIntentContext);
