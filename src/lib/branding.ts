export interface BrandingConfig {
  companyName: string;
  brandTagline: string;
  companyFullTitle: string;
  companySubtext: string;
  logoUrl: string;
  faviconUrl?: string;
  themeColor: "emerald" | "amber" | "indigo" | "blue" | "rose" | "violet" | "slate";
  copyrightText: string;
  supportEmail: string;
  supportPhone?: string;
  websiteUrl: string;
}

export const DEFAULT_BRANDING: BrandingConfig = {
  companyName: "Millionaire",
  brandTagline: "OS",
  companyFullTitle: "Millionaire Dizital CRM",
  companySubtext: "Enterprise CRM & Business Operating System.",
  logoUrl: "/mdz-crm/mdz-logo.jpg",
  faviconUrl: "/mdz-crm/mdz-logo.jpg",
  themeColor: "emerald",
  copyrightText: "© 2026 Millionaire Dizital LLP. All rights reserved.",
  supportEmail: "support@millionairedizital.com",
  supportPhone: "+91 98765 43210",
  websiteUrl: "https://www.millionairedizital.com",
};
