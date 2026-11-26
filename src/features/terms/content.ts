import type { LegalDocument, LegalParagraph } from "@/interfaces";

const text = (value: string): LegalParagraph => [{ text: value }];

/** Terms text copied verbatim from the original Vacayou site (Terms of Use page). Do not reword. */
export const TERMS_OF_USE: LegalDocument = {
  title: "Terms of Use",
  updated: "Last updated: 1 January 2026",
  sections: [
    {
      id: "acceptance-of-terms",
      heading: "1. Acceptance of Terms",
      paragraphs: [
        text(
          'By accessing or using the Company website and services ("Platform"), you agree to be bound by these Terms of Use. If you do not agree with any part of these terms, you may not access the Platform. These terms apply to all visitors, users, and others who access or use the Platform.',
        ),
        text(
          "The Company reserves the right to update or modify these Terms at any time without prior notice. Your continued use of the Platform following any changes constitutes acceptance of the revised Terms.",
        ),
      ],
    },
    {
      id: "use-of-the-platform",
      heading: "2. Use of the Platform",
      paragraphs: [
        text(
          "You agree to use the Platform only for lawful purposes and in a manner consistent with all applicable local, national, and international laws and regulations. You must not use the Platform in any way that is fraudulent, harmful, or otherwise objectionable.",
        ),
        text(
          "You are responsible for ensuring that all persons who access the Platform through your internet connection are aware of these Terms and comply with them.",
        ),
      ],
    },
    {
      id: "bookings-and-reservations",
      heading: "3. Bookings and Reservations",
      paragraphs: [
        text(
          "All bookings made through the Platform are subject to availability and confirmation. The Company acts as an intermediary between you and the experience or accommodation provider. A booking is confirmed only upon receipt of written confirmation and full or partial payment as required.",
        ),
        text("Prices displayed on the Platform are indicative and may be subject to change until a booking is confirmed."),
      ],
    },
    {
      id: "cancellation-and-refund-policy",
      heading: "4. Cancellation and Refund Policy",
      paragraphs: [
        text(
          "Cancellation policies vary by experience and provider. The applicable policy will be clearly stated at the time of booking. The Company strongly recommends that all guests purchase comprehensive travel insurance to cover unforeseen cancellations.",
        ),
        text(
          "Refunds, where applicable, will be processed within 14 working days of approval. The Company's service fees are non-refundable unless the cancellation is due to a fault on the part of the Company.",
        ),
      ],
    },
    {
      id: "intellectual-property",
      heading: "5. Intellectual Property",
      paragraphs: [
        text(
          "All content on the Platform, including but not limited to text, images, graphics, logos, and software, is the property of the Company or its content suppliers and is protected by applicable intellectual property laws. You may not reproduce, distribute, or create derivative works without the express written permission of the Company.",
        ),
      ],
    },
    {
      id: "limitation-of-liability",
      heading: "6. Limitation of Liability",
      paragraphs: [
        text(
          "To the fullest extent permitted by law, the Company shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of, or inability to use, the Platform or any experiences booked through it.",
        ),
        text(
          "The Company does not warrant that the Platform will be uninterrupted, error-free, or free of viruses or other harmful components.",
        ),
      ],
    },
    {
      id: "governing-law",
      heading: "7. Governing Law",
      paragraphs: [
        text(
          "These Terms shall be governed by and construed in accordance with the laws of England and Wales. Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of the courts of England and Wales.",
        ),
      ],
    },
    {
      id: "contact",
      heading: "8. Contact",
      paragraphs: [
        [
          { text: "If you have any questions about these Terms, please contact us at " },
          { text: "legal@example.com", emphasis: true },
          { text: "." },
        ],
      ],
    },
  ],
};
