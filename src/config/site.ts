/**
 * Site configuration and metadata constants.
 * Single source of truth for site URLs, legal entities, and contact information.
 */

const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || "";

export const siteConfig = {
  siteName: "ShikshaGap",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://shikshagap.vercel.app",
  contactEmail: contactEmail || "contact@shikshagap.in",
  legalEntityName: process.env.NEXT_PUBLIC_LEGAL_ENTITY_NAME || "ShikshaGap Educational Initiative",
  grievanceOfficerName: process.env.NEXT_PUBLIC_GRIEVANCE_OFFICER_NAME || "Data Protection & Grievance Officer, ShikshaGap Privacy Cell",
  city: "Hyderabad, Telangana, India",
} as const;

export default siteConfig;
