import { google } from "googleapis";

let sheetsClientInstance: ReturnType<typeof google.sheets> | null = null;

function getSheetsClient() {
  if (sheetsClientInstance) return sheetsClientInstance;

  // 1. OAuth 2.0 Credentials
  const oauthClientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
  const oauthClientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
  const oauthRefreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;

  if (oauthClientId && oauthClientSecret && oauthRefreshToken) {
    const oauth2Client = new google.auth.OAuth2(
      oauthClientId,
      oauthClientSecret,
      process.env.GOOGLE_DRIVE_REDIRECT_URI || "https://developers.google.com/oauthplayground"
    );
    oauth2Client.setCredentials({ refresh_token: oauthRefreshToken });
    sheetsClientInstance = google.sheets({ version: "v4", auth: oauth2Client });
    return sheetsClientInstance;
  }

  // 2. Service Account
  const clientEmail = process.env.GOOGLE_DRIVE_CLIENT_EMAIL;
  let privateKey = process.env.GOOGLE_DRIVE_PRIVATE_KEY;

  if (clientEmail && privateKey) {
    privateKey = privateKey.replace(/\\n/g, "\n");
    const auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    sheetsClientInstance = google.sheets({ version: "v4", auth });
    return sheetsClientInstance;
  }

  return null;
}

export interface SheetInquiryRow {
  leadNumber: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  industry: string;
  subCategory: string;
  businessType: string;
  location: string;
  goals: string[];
  services: string[];
  duration: string;
  targetAudience: string;
  competitors: string;
  additionalDetails: string;
  submittedAt: string;
}

/**
 * Asynchronously and safely appends a new inquiry lead to a configured Google Sheet.
 * Google Sheets is a reporting mirror and failures will never block or roll back database transactions.
 */
export async function syncInquiryToGoogleSheets(row: SheetInquiryRow): Promise<boolean> {
  const spreadsheetId = process.env.GOOGLE_SHEETS_INQUIRIES_SPREADSHEET_ID || process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  if (!spreadsheetId) {
    return false; // Google Sheets sync not enabled / optional
  }

  try {
    const sheets = getSheetsClient();
    if (!sheets) {
      console.warn("[GoogleSheets] No credentials found for Google Sheets sync.");
      return false;
    }

    const values = [
      [
        row.leadNumber,
        row.submittedAt,
        row.companyName,
        row.contactPerson,
        row.phone,
        row.email,
        row.industry,
        row.subCategory,
        row.businessType,
        row.location,
        row.goals.join(", "),
        row.services.join(", "),
        row.duration,
        row.targetAudience,
        row.competitors,
        row.additionalDetails,
      ],
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Inquiries!A:P",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values,
      },
    });

    return true;
  } catch (err: any) {
    console.warn("[GoogleSheets] Notice: Background sheet append:", err?.message || err);
    return false;
  }
}
