/*
 * Photos for the activity tiles of the preferences wizard, keyed by option id (`PreferenceOption.id`). A tile with no entry shows
 * the neutral gradient. To add a photo: put the file in `public/images/activities/` and add `"<id>": "/images/activities/<id>.jpg"`.
 * Nothing is hotlinked. None are supplied yet: the design shows photos, but no activity photo exists in the repo or the design
 * folders (the look-alike files in `public/images/home` hold other subjects), so all 20 use the gradient for now.
 */
export const ACTIVITY_IMAGES: Readonly<Record<string, string | undefined>> = {};
