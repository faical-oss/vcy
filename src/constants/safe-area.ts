/*
 * Padding that keeps content of full-screen overlays and fixed bars out of the notch, the rounded corners and the home bar
 * (the root layout sets viewport-fit=cover, so the page draws under them). Zero on screens without a cutout. Tailwind finds the
 * full class names in this file.
 */
export const SAFE_AREA_PADDING = "pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)]";
