import { ROUTES } from "@/constants/routes";
import type { SupportContent } from "@/interfaces";

/** Copy from Figma "Vacayou -Support" (node 2:20031). */
export const SUPPORT_CONTENT: SupportContent = {
  eyebrow: "Vacayou support",
  title: "How can we help?",
  intro:
    "Whether you are dreaming up your next escape or need help with an existing booking, our travel specialists are here to make the journey easier.",
  topicsEyebrow: "Start here",
  topicsTitle: "What do you need help with?",
  topics: [
    {
      id: "plan-a-trip",
      title: "Plan a trip",
      description: "Destination ideas, availability and choosing the right experience.",
      icon: "compass",
    },
    {
      id: "existing-booking",
      title: "Existing booking",
      description: "Changes, documents, payments or questions about an upcoming trip.",
      icon: "calendar",
    },
    {
      id: "something-else",
      title: "Something else",
      description: "General questions, feedback, press and partnership enquiries.",
      icon: "message",
    },
  ],
  form: {
    eyebrow: "Contact our team",
    title: "Send us a message",
    description: "Share the details below and we will make sure your request reaches the right person.",
    firstName: "First name",
    lastName: "Last name",
    firstNamePlaceholder: "Amelia",
    lastNamePlaceholder: "Hart",
    email: "Email address",
    emailPlaceholder: "you@example.com",
    bookingReference: "Booking reference",
    optional: "(optional)",
    bookingReferencePlaceholder: "For example, VC-123456",
    message: "How can we help?",
    messagePlaceholder: "Tell us about your plans or question, including any dates or destinations that may help.",
    privacyNote: "Your details are only used to respond to this request.",
    submit: "Send message",
  },
  next: {
    title: "What happens next?",
    paragraphs: [
      "We review your message and route it to the specialist best placed to help.",
      "Our team typically responds within one business day. Booking-related requests are prioritized by travel date.",
    ],
  },
  inspiration: {
    title: "Planning something special?",
    body: "Tell us your dates, budget, preferred destination and what you want to feel when you return. We can help narrow the search.",
    cta: "Browse inspiration",
    href: ROUTES.browseExperiences,
  },
  tips: {
    title: "Helpful details to include",
    items: [
      "Preferred travel dates and flexibility",
      "Destination or experience type",
      "Number of travelers",
      "Booking reference, if you have one",
    ],
  },
};
