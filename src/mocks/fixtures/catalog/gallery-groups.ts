import type { DetailImage, GalleryGroup, GalleryVideo } from "@/interfaces";

/** A free video for the mock galleries. TODO(api): the real video URLs. */
export const MOCK_VIDEO_URL = "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";

/** A video tile for a group: the poster is one of its photos. */
export function galleryVideo(title: string, poster: DetailImage): GalleryVideo {
  return { url: MOCK_VIDEO_URL, title, poster };
}

/** ASSUMED mock content: builds a gallery group from images. The first image is the thumbnail. */
export function galleryGroup(id: string, title: string, images: DetailImage[], videos?: GalleryVideo[]): GalleryGroup {
  return { id, title, thumbnail: images[0], images, ...(videos ? { videos } : {}) };
}

/** Images from `sources` (existing pool photos) with alt text "<subject>: <label> photo N of M". */
export function labelled(sources: readonly string[], subject: string, label: string): DetailImage[] {
  return sources.map((src, index) => ({ src, alt: `${subject}: ${label} photo ${index + 1} of ${sources.length}` }));
}

/** A DOM-safe id from a title ("Ocean View Suite" -> "ocean-view-suite"). */
export const groupId = (prefix: string, title: string): string => `${prefix}-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
