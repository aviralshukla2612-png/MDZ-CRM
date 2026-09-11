import { prisma } from "@/lib/prisma";
import { CurrentUserSession } from "@/lib/auth";
import { getClientAccountForUser } from "@/lib/client-auth";

export const DEFAULT_EMPLOYEE_TERMS_VERSION = "v1.0";
export const DEFAULT_CLIENT_TERMS_VERSION = "v1.0";

export const DEFAULT_EMPLOYEE_TERMS_CONTENT = `
1. ACCEPTANCE OF TERMS
By accessing and using MDZ OS as an employee of Millionaire Digital, you agree to comply with all company operational policies, data security guidelines, and internal governance rules set forth in this agreement.

2. CONFIDENTIALITY AND DATA PROTECTION
Employees must maintain strict confidentiality regarding all client details, financial figures, lead sources, and intellectual property stored within MDZ OS. Unauthorized export or disclosure of system data is strictly prohibited.

3. WORK LOGGING AND ATTENDANCE ACCURACY
All work sessions, attendance punches, and daily task updates submitted on MDZ OS must accurately represent real operational activity. Falsification of work logs or task progress is a violation of company policy.

4. SYSTEM ACCESS AND SECURITY
Employees are responsible for maintaining the confidentiality of their login credentials. Any suspicious activity or security incident must be reported immediately to the System Owner.
`.trim();

export const DEFAULT_CLIENT_TERMS_CONTENT = `
1. ACCEPTANCE OF SERVICE TERMS
By accessing the Millionaire Digital CRM Client Portal, you confirm authorization to act on behalf of your organization and agree to these terms governing project tracking, milestone reviews, and digital deliverables.

2. INTELLECTUAL PROPERTY & DELIVERABLES
All software source code, designs, and technical documentation generated during project execution remain the property of Millionaire Digital until applicable contract milestones and payment terms are fully satisfied.

3. COMMUNICATION & REVISION SCOPE
Project requests, change requests, and discussion feedback submitted through MDZ OS will serve as official project records. Change requests outside original contract scope may incur timeline and budget adjustments.

4. TERMINATION AND PORTAL ACCESS
Millionaire Digital reserves the right to suspend or terminate portal access in the event of contractual breach or unpaid invoices.
`.trim();

/**
 * Retrieves the currently published Terms record for the given target audience.
 * Creates a default published Terms v1.0 in DB if none exists.
 */
export async function getPublishedTerms(targetAudience: "EMPLOYEE" | "CLIENT") {
  let terms = await prisma.terms.findFirst({
    where: { targetAudience, isCurrent: true, isDraft: false },
    orderBy: { createdAt: "desc" },
  });

  if (!terms) {
    const defaultVersion =
      targetAudience === "EMPLOYEE" ? DEFAULT_EMPLOYEE_TERMS_VERSION : DEFAULT_CLIENT_TERMS_VERSION;
    const defaultContent =
      targetAudience === "EMPLOYEE" ? DEFAULT_EMPLOYEE_TERMS_CONTENT : DEFAULT_CLIENT_TERMS_CONTENT;

    terms = await prisma.terms.create({
      data: {
        targetAudience,
        version: defaultVersion,
        title: `${targetAudience === "EMPLOYEE" ? "Employee" : "Client"} Terms and Conditions of Service`,
        content: defaultContent,
        isCurrent: true,
        isDraft: false,
        publishedAt: new Date(),
      },
    });
  }

  return terms;
}

/**
 * Server-authoritative terms version check for an authenticated User session.
 */
export async function checkUserTermsStatus(user: CurrentUserSession) {
  if (user.activeRole === "OWNER") {
    return { needsAcceptance: false, currentVersion: "v1.0", acceptedVersion: "v1.0" };
  }

  if (user.activeRole === "EMPLOYEE") {
    const currentTerms = await getPublishedTerms("EMPLOYEE");
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { termsAcceptedVersion: true, termsAcceptedAt: true },
    });

    const acceptedVersion = dbUser?.termsAcceptedVersion || null;
    const needsAcceptance = Boolean(!acceptedVersion || acceptedVersion !== currentTerms.version);

    return {
      needsAcceptance,
      currentVersion: currentTerms.version,
      acceptedVersion,
      terms: currentTerms,
    };
  }

  return { needsAcceptance: false, currentVersion: "v1.0", acceptedVersion: "v1.0" };
}

/**
 * Server-authoritative terms version check for an authenticated Client account.
 */
export async function checkClientTermsStatus(userEmail: string) {
  const currentTerms = await getPublishedTerms("CLIENT");
  const clientCtx = await getClientAccountForUser(userEmail);

  if (!clientCtx || !clientCtx.contact) {
    return { needsAcceptance: false, currentVersion: currentTerms.version, acceptedVersion: null };
  }

  const contact = clientCtx.contact;
  const acceptedVersion = contact.termsVersion || null;
  const needsAcceptance = Boolean(
    !contact.termsAccepted || !acceptedVersion || acceptedVersion !== currentTerms.version
  );

  return {
    needsAcceptance,
    currentVersion: currentTerms.version,
    acceptedVersion,
    terms: currentTerms,
    contactId: contact.id,
  };
}
