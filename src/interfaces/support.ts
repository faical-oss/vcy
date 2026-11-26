export type SupportIcon = "compass" | "calendar" | "message" | "clock" | "heart" | "mail";

export interface SupportTopic {
  id: string;
  title: string;
  description: string;
  icon: SupportIcon;
}

export interface SupportContent {
  eyebrow: string;
  title: string;
  intro: string;
  topicsEyebrow: string;
  topicsTitle: string;
  topics: readonly SupportTopic[];
  form: {
    eyebrow: string;
    title: string;
    description: string;
    firstName: string;
    lastName: string;
    email: string;
    firstNamePlaceholder: string;
    lastNamePlaceholder: string;
    emailPlaceholder: string;
    bookingReference: string;
    optional: string;
    bookingReferencePlaceholder: string;
    message: string;
    messagePlaceholder: string;
    privacyNote: string;
    submit: string;
  };
  next: { title: string; paragraphs: readonly string[] };
  inspiration: { title: string; body: string; cta: string; href: string };
  tips: { title: string; items: readonly string[] };
}
