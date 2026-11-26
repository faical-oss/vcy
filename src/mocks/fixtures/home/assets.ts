/** Asset helpers shared by the Home fixtures. Swap for CDN (Asset Zen) URLs when the API exists. */
export const unsplash = (id: string) => `https://images.unsplash.com/photo-${id}?w=800&q=80&fit=crop`;
export const local = (file: string) => `/images/home/${file}`;

export const GALLERY_YOGA = [unsplash("1506126613408-eca07ce68773"), unsplash("1602192509154-0b900ee1f851"), unsplash("1600618528240-fb9fc964b853")];
export const GALLERY_WELLNESS = [unsplash("1571003123894-1f0594d2b5d9"), unsplash("1520250497591-112f2f40a3f4"), unsplash("1582719508461-905c673771fd")];
