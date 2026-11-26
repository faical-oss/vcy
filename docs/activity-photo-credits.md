# Activity photo credits

**These are random placeholders.** The 20 images in `public/images/activities/` (one per option of the preferences wizard's first step) were
downloaded once from picsum.photos with the option id as the seed (`https://picsum.photos/seed/<option-id>/800/500`), converted to WebP
(about 120 KB at most) by `scripts/fetch-placeholder-activity-photos.mjs`. **They do not match their labels** ("Golf" is not a golf photo).
They are for layout testing only.

- Source: [Picsum Photos](https://picsum.photos), photos from Unsplash (Unsplash licence).
- Never loaded from picsum.photos at runtime; the site only serves the local files, and `picsum.photos` is not in the image config.
- **Replace them with the designer's photos before launch**: same file names (`<option-id>.webp`) in `public/images/activities/`, or change the paths in
  `src/constants/activity-images.ts`. A tile without an entry shows the gradient.
