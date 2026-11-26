import type { Moment } from "@/interfaces";
import { local, unsplash } from "./assets";

const sources = [local("moment-1.jpg"), local("moment-2.jpg"), local("moment-3.jpg"), local("moment-4.jpg"), unsplash("1637692513738-68ed61f6604a"), unsplash("1762222378422-f0e3a236bc4a"), unsplash("1648621288703-88e2273ea454"), unsplash("1783690898259-87b7d60eb6f4")];

export const moments: Moment[] = sources.map((imageSrc, i) => ({ id: `moment-${i + 1}`, imageSrc, alt: `Vacayou moment ${i + 1}` }));
