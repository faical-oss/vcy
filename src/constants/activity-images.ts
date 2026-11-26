/*
 * Photos for the activity tiles of the preferences wizard, keyed by option id (`PreferenceOption.id`). A tile with no entry shows
 * the neutral gradient (the fallback). To add a photo: put the file in `public/images/activities/` and add `"<id>": "/images/activities/<id>.webp"`.
 * Nothing is hotlinked. TODO: these 20 files are RANDOM PLACEHOLDERS (stable picsum.photos seeds, downloaded once by
 * `scripts/fetch-placeholder-activity-photos.mjs`) that do not match their labels: layout testing only. Replace them with the designer's
 * photos before launch (see docs/activity-photo-credits.md).
 */
export const ACTIVITY_IMAGES: Readonly<Record<string, string | undefined>> = {
  "bike": "/images/activities/bike.webp",
  "detox": "/images/activities/detox.webp",
  "dive": "/images/activities/dive.webp",
  "get-fit": "/images/activities/get-fit.webp",
  "golf": "/images/activities/golf.webp",
  "get-healthy": "/images/activities/get-healthy.webp",
  "hike": "/images/activities/hike.webp",
  "meditate": "/images/activities/meditate.webp",
  "ski": "/images/activities/ski.webp",
  "be-enlightened": "/images/activities/be-enlightened.webp",
  "lose-weight": "/images/activities/lose-weight.webp",
  "practice-yoga": "/images/activities/practice-yoga.webp",
  "get-pampered": "/images/activities/get-pampered.webp",
  "run": "/images/activities/run.webp",
  "have-an-adventure": "/images/activities/have-an-adventure.webp",
  "heal": "/images/activities/heal.webp",
  "work-and-play": "/images/activities/work-and-play.webp",
  "camp": "/images/activities/camp.webp",
  "surf": "/images/activities/surf.webp",
  "raft": "/images/activities/raft.webp",
};
