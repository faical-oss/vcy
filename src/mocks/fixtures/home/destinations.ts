import type { DestinationSummary } from "@/interfaces";
import { local, unsplash } from "./assets";
import { destination } from "@/constants/routes";

export const destinations: DestinationSummary[] = [
    { id: "bali", name: "Bali", region: "Indonesia", experienceCount: 240, href: destination("bali-indonesia"), imageSrc: local("dest-bali.png") },
    { id: "thailand", name: "Thailand", region: "Southeast Asia", experienceCount: 310, href: destination("thailand"), imageSrc: local("dest-thailand.png") },
    { id: "maldives", name: "Maldives", region: "Indian Ocean", experienceCount: 85, href: destination("maldives"), imageSrc: unsplash("1512343879784-a960bf40e7f2") },
    { id: "italy", name: "Italy", region: "Europe", experienceCount: 190, href: destination("italy"), imageSrc: unsplash("1523531294919-4bcd7c65e216") },
    { id: "india", name: "India", region: "South Asia", experienceCount: 275, href: destination("india"), imageSrc: unsplash("1524492412937-b28074a5d7da") },
    { id: "costa-rica", name: "Costa Rica", region: "Central America", experienceCount: 120, href: destination("costa-rica"), imageSrc: unsplash("1580259679654-9276b39fd2d5") },
    { id: "greece", name: "Greece", region: "Europe", experienceCount: 155, href: destination("greece"), imageSrc: unsplash("1570077188670-e3a8d69ac5ff") },
    { id: "nepal", name: "Nepal", region: "South Asia", experienceCount: 90, href: destination("nepal"), imageSrc: unsplash("1533130061792-64b345e4a833") },
];
