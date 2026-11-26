import { Star } from "lucide-react";

/** Five gold stars, `count` filled. Decorative: the parent carries the "n out of 5" label. */
export const reviewStars = (count: number, size: string) => Array.from({ length: 5 }, (_, index) => <Star key={index} aria-hidden className={index < count ? `${size} fill-star text-star` : `${size} text-border`} />);
