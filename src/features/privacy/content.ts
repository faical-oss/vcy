import type { LegalDocument, LegalParagraph } from "@/interfaces";

const text = (value: string): LegalParagraph => [{ text: value }];
const lead = (label: string, value: string): LegalParagraph => [{ text: label, emphasis: true }, { text: ` ${value}` }];

/** Policy text copied verbatim from the original Vacayou site (Privacy Policy page). Do not reword. */
export const PRIVACY_POLICY: LegalDocument = {
  title: "Privacy Policy",
  updated: "Last updated: 1 January 2026",
  sections: [
    {
      id: "introduction",
      heading: "1. Introduction",
      paragraphs: [
        text(
          'The Company ("we", "us", or "our") is committed to protecting your personal information. This Privacy Policy explains how we collect, use, share, and safeguard your data when you use our Platform. Please read this policy carefully alongside our Terms of Use.',
        ),
      ],
    },
    {
      id: "information-we-collect",
      heading: "2. Information We Collect",
      paragraphs: [
        lead(
          "Information you provide:",
          "When you register, make a booking, or contact us, we collect information such as your name, email address, phone number, payment details, and travel preferences.",
        ),
        lead(
          "Information collected automatically:",
          "We collect data about how you interact with the Platform, including your IP address, browser type, pages visited, search queries, and time spent on pages. This is collected via cookies and similar technologies.",
        ),
        lead(
          "Information from third parties:",
          "We may receive information about you from third-party partners, such as social media platforms if you choose to log in via those services.",
        ),
      ],
    },
    {
      id: "how-we-use-your-information",
      heading: "3. How We Use Your Information",
      paragraphs: [
        text(
          "We use your personal data to process and manage bookings, personalise your experience on the Platform, send relevant communications including offers and updates (where you have opted in), improve our services through analytics, and comply with legal obligations.",
        ),
        text(
          'We use the information you provide to tailor curated recommendations — such as "Hand-picked for You" sections — to your interests and previous travel history.',
        ),
      ],
    },
    {
      id: "sharing-your-information",
      heading: "4. Sharing Your Information",
      paragraphs: [
        text(
          "We share your information only as necessary to deliver our services. This includes sharing relevant booking details with experience and accommodation providers, payment processors to handle transactions securely, and analytics partners who help us improve the Platform.",
        ),
        text(
          "We do not sell your personal data to third parties for marketing purposes. We may disclose your information if required by law or to protect the rights and safety of the Company and its users.",
        ),
      ],
    },
    {
      id: "cookies",
      heading: "5. Cookies",
      paragraphs: [
        text(
          "We use cookies and similar tracking technologies to enhance your experience, remember your preferences, and understand how the Platform is used. You can control cookie settings through your browser, though disabling certain cookies may affect Platform functionality.",
        ),
        text("By continuing to use the Platform, you consent to our use of cookies in accordance with this policy."),
      ],
    },
    {
      id: "data-retention",
      heading: "6. Data Retention",
      paragraphs: [
        text(
          "We retain your personal data for as long as necessary to fulfil the purposes described in this policy, comply with legal obligations, and resolve disputes. Booking records are typically retained for seven years in accordance with financial regulations.",
        ),
      ],
    },
    {
      id: "your-rights",
      heading: "7. Your Rights",
      paragraphs: [
        text(
          "Under applicable data protection law, you have the right to access, correct, or delete your personal data; object to or restrict certain processing; request portability of your data; and withdraw consent at any time where processing is based on consent.",
        ),
        [
          { text: "To exercise any of these rights, please contact us at " },
          { text: "privacy@example.com", emphasis: true },
          { text: ". We will respond within 30 days." },
        ],
      ],
    },
    {
      id: "security",
      heading: "8. Security",
      paragraphs: [
        text(
          "We implement appropriate technical and organisational measures to protect your personal data against unauthorised access, loss, or misuse. Payment data is processed via PCI-DSS compliant providers and is never stored on our servers.",
        ),
      ],
    },
    {
      id: "changes-to-this-policy",
      heading: "9. Changes to This Policy",
      paragraphs: [
        text(
          "We may update this Privacy Policy from time to time. We will notify you of significant changes by email or via a prominent notice on the Platform. Your continued use of the Platform after changes take effect constitutes acceptance of the updated policy.",
        ),
      ],
    },
    {
      id: "contact-us",
      heading: "10. Contact Us",
      paragraphs: [
        [
          {
            text: "If you have questions, concerns, or complaints about this Privacy Policy or our data practices, please contact our Data Protection Officer at ",
          },
          { text: "privacy@example.com", emphasis: true },
          { text: " or write to us at Travel Co Ltd, 1 Example Street, London, EC1A 1BB, United Kingdom." },
        ],
      ],
    },
  ],
};
