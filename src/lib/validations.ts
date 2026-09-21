import { z } from "zod";

export const leadSchema = z.object({
  contactPerson: z.string().min(2, "Contact person is required"),
  clientName: z.string().min(2, "Company name is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  email: z.string().email("Valid email is required"),
  projectScope: z.string().min(5, "Project scope is required"),
  leadValue: z.number().nonnegative().optional().default(0),
  expectedRevenue: z.number().nonnegative().optional().default(0),
  leadPriority: z.enum(["HOT", "HIGH", "MEDIUM", "LOW"]).default("MEDIUM"),
  stage: z.enum(["NEW", "CONTACTED", "REQUIREMENTS", "PROPOSAL", "NEGOTIATION", "WON", "LOST"]).default("NEW"),
  gstNo: z.string().optional(),
});

export const clientSchema = z.object({
  companyName: z.string().min(2, "Company name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  contactPerson: z.string().min(2, "Contact person is required"),
  industry: z.string().optional(),
  totalBilling: z.number().nonnegative().default(0),
});

export const publicInquirySchema = z.object({
  // Step 1: Company Details
  companyName: z.string().trim().min(2, "Company / Brand name is required"),
  contactName: z.string().trim().min(2, "Your name is required"),
  phone: z.string().trim().min(7, "Valid phone or WhatsApp number is required").max(20, "Phone number is too long"),
  email: z.string().trim().email("Valid email address is required"),

  // Step 2: Industry & Business Profile
  industry: z.string().trim().min(2, "Industry selection is required"),
  subCategory: z.string().trim().min(1, "Sub-category is required"),
  businessType: z.string().trim().min(1, "Business type is required"),
  location: z.string().trim().min(2, "Location is required"),

  // Step 3: Goals
  goals: z.array(z.string()).min(1, "Please select at least one primary goal"),

  // Step 4: Services
  services: z.array(z.string()).min(1, "Please select at least one required service"),

  // Step 5: Project Duration
  durationType: z.string().default("QUARTER"),
  durationMonths: z.number().int().positive().default(3),

  // Step 6: Additional Details
  targetAudience: z.string().trim().max(1000).optional().default(""),
  competitors: z.string().trim().max(1000).optional().default(""),
  additionalDetails: z.string().trim().max(3000).optional().default(""),

  // Step 7: Confirmation & Anti-Spam
  confirmed: z.boolean().refine((val) => val === true, {
    message: "You must confirm that the information provided is correct and agree to be contacted.",
  }),
  website_hp: z.string().optional(), // Honeypot trap for bots
});

