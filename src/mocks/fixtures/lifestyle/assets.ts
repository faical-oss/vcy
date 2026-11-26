/**
 * Image helpers of the Lifestyle fixtures.
 * TODO(cms): the photos are the stock images of the Figma prototype (its own assets and Unsplash). Replace them with
 * licensed images from the CMS / Asset Zen before launch; both hosts are allowed in `next.config.ts` only for the mocks.
 */
export const proto = (path: string) => `https://glad-red-27377678.figma.site/assets/${path}`;
export const photo = (id: string) => `https://images.unsplash.com/photo-${id}?w=1200&q=80&fit=crop`;
