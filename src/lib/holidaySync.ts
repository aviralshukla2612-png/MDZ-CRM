import { prisma } from "./prisma";

// Indian Public and Gazetted Holiday Calendar ID
export const GOOGLE_INDIAN_HOLIDAY_CALENDAR_ID = "en.indian#holiday@group.v.calendar.google.com";
export const GOOGLE_ICAL_FEED_URL = `https://calendar.google.com/calendar/ical/${encodeURIComponent(
  GOOGLE_INDIAN_HOLIDAY_CALENDAR_ID
)}/public/basic.ics`;

export interface HolidaySyncResult {
  success: boolean;
  year: number;
  fetched: number;
  created: number;
  updated: number;
  skipped: number;
  total: number;
  source: "GOOGLE" | "SYSTEM";
  message?: string;
}

export interface ParsedHolidayItem {
  title: string;
  date: Date;
  endDate?: Date | null;
  type: "PUBLIC" | "OPTIONAL" | "STATE";
  country: string;
  state?: string | null;
  source: "GOOGLE" | "SYSTEM";
  sourceId?: string | null;
  description?: string | null;
  isOptional: boolean;
}

/**
 * Built-in versioned multi-year Indian Holiday dataset (2025 - 2028)
 * Ensures 100% offline resilience when Google external feed is unreachable.
 * Marked with source = "SYSTEM".
 */
export const STATIC_INDIAN_HOLIDAYS_DATASET: Record<
  number,
  Array<{
    title: string;
    date: string; // YYYY-MM-DD
    type?: "PUBLIC" | "OPTIONAL" | "STATE";
    state?: string | null;
    isOptional?: boolean;
    description?: string;
  }>
> = {
  2025: [
    { title: "New Year's Day", date: "2025-01-01", type: "OPTIONAL", isOptional: true, description: "First day of the year" },
    { title: "Makar Sankranti / Pongal", date: "2025-01-14", type: "PUBLIC", isOptional: false, description: "Harvest festival" },
    { title: "Republic Day", date: "2025-01-26", type: "PUBLIC", isOptional: false, description: "National holiday commemorating the Constitution of India" },
    { title: "Maha Shivaratri", date: "2025-02-26", type: "PUBLIC", isOptional: false, description: "Celebration of Lord Shiva" },
    { title: "Holi", date: "2025-03-14", type: "PUBLIC", isOptional: false, description: "Festival of Colors" },
    { title: "Id-ul-Fitr (Ramzan Eid)", date: "2025-03-31", type: "PUBLIC", isOptional: false, description: "Islamic festival marking the end of Ramadan" },
    { title: "Mahavir Jayanti", date: "2025-04-10", type: "PUBLIC", isOptional: false, description: "Birth anniversary of Lord Mahavira" },
    { title: "Good Friday", date: "2025-04-18", type: "PUBLIC", isOptional: false, description: "Christian holy day" },
    { title: "Buddha Purnima", date: "2025-05-12", type: "PUBLIC", isOptional: false, description: "Birth of Gautama Buddha" },
    { title: "Bakrid / Eid al-Adha", date: "2025-06-07", type: "PUBLIC", isOptional: false, description: "Feast of Sacrifice" },
    { title: "Muharram", date: "2025-07-06", type: "PUBLIC", isOptional: false, description: "Islamic New Year observance" },
    { title: "Independence Day", date: "2025-08-15", type: "PUBLIC", isOptional: false, description: "National celebration of Indian Independence" },
    { title: "Raksha Bandhan", date: "2025-08-09", type: "OPTIONAL", isOptional: true, description: "Sibling festival" },
    { title: "Janmashtami", date: "2025-08-16", type: "PUBLIC", isOptional: false, description: "Birth of Lord Krishna" },
    { title: "Ganesh Chaturthi", date: "2025-08-27", type: "PUBLIC", state: "Maharashtra", isOptional: false, description: "Ganesh festival" },
    { title: "Milad un-Nabi (Id-e-Milad)", date: "2025-09-05", type: "PUBLIC", isOptional: false, description: "Prophet Muhammad's Birthday" },
    { title: "Mahatma Gandhi Jayanti", date: "2025-10-02", type: "PUBLIC", isOptional: false, description: "Birth anniversary of Mahatma Gandhi" },
    { title: "Maha Navami / Dussehra", date: "2025-10-02", type: "PUBLIC", isOptional: false, description: "Victory of good over evil" },
    { title: "Diwali (Deepavali)", date: "2025-10-20", type: "PUBLIC", isOptional: false, description: "Festival of Lights" },
    { title: "Govardhan Puja / Nutan Varsh", date: "2025-10-22", type: "PUBLIC", state: "Gujarat", isOptional: false, description: "Gujarati New Year" },
    { title: "Bhai Dooj", date: "2025-10-23", type: "OPTIONAL", isOptional: true, description: "Celebration of sibling bonds" },
    { title: "Guru Nanak Jayanti", date: "2025-11-05", type: "PUBLIC", isOptional: false, description: "Birth of Guru Nanak Dev Ji" },
    { title: "Christmas Day", date: "2025-12-25", type: "PUBLIC", isOptional: false, description: "Celebration of the birth of Jesus Christ" },
  ],
  2026: [
    { title: "New Year's Day", date: "2026-01-01", type: "OPTIONAL", isOptional: true, description: "First day of the year" },
    { title: "Makar Sankranti / Pongal", date: "2026-01-14", type: "PUBLIC", isOptional: false, description: "Harvest festival" },
    { title: "Republic Day", date: "2026-01-26", type: "PUBLIC", isOptional: false, description: "National holiday commemorating the Constitution of India" },
    { title: "Maha Shivaratri", date: "2026-02-15", type: "PUBLIC", isOptional: false, description: "Celebration of Lord Shiva" },
    { title: "Holi", date: "2026-03-04", type: "PUBLIC", isOptional: false, description: "Festival of Colors" },
    { title: "Id-ul-Fitr (Ramzan Eid)", date: "2026-03-20", type: "PUBLIC", isOptional: false, description: "Islamic festival marking the end of Ramadan" },
    { title: "Mahavir Jayanti", date: "2026-03-31", type: "PUBLIC", isOptional: false, description: "Birth anniversary of Lord Mahavira" },
    { title: "Good Friday", date: "2026-04-03", type: "PUBLIC", isOptional: false, description: "Christian holy day" },
    { title: "Buddha Purnima", date: "2026-05-01", type: "PUBLIC", isOptional: false, description: "Birth of Gautama Buddha" },
    { title: "Bakrid / Eid al-Adha", date: "2026-05-27", type: "PUBLIC", isOptional: false, description: "Feast of Sacrifice" },
    { title: "Muharram", date: "2026-06-25", type: "PUBLIC", isOptional: false, description: "Islamic New Year observance" },
    { title: "Independence Day", date: "2026-08-15", type: "PUBLIC", isOptional: false, description: "National celebration of Indian Independence" },
    { title: "Raksha Bandhan", date: "2026-08-28", type: "OPTIONAL", isOptional: true, description: "Sibling festival" },
    { title: "Janmashtami", date: "2026-09-04", type: "PUBLIC", isOptional: false, description: "Birth of Lord Krishna" },
    { title: "Ganesh Chaturthi", date: "2026-09-14", type: "PUBLIC", state: "Maharashtra", isOptional: false, description: "Ganesh festival" },
    { title: "Milad un-Nabi (Id-e-Milad)", date: "2026-08-26", type: "PUBLIC", isOptional: false, description: "Prophet Muhammad's Birthday" },
    { title: "Mahatma Gandhi Jayanti", date: "2026-10-02", type: "PUBLIC", isOptional: false, description: "Birth anniversary of Mahatma Gandhi" },
    { title: "Maha Navami / Dussehra", date: "2026-10-20", type: "PUBLIC", isOptional: false, description: "Vijayadashami festival" },
    { title: "Diwali (Deepavali)", date: "2026-11-08", type: "PUBLIC", isOptional: false, description: "Festival of Lights" },
    { title: "Govardhan Puja / Nutan Varsh", date: "2026-11-10", type: "PUBLIC", state: "Gujarat", isOptional: false, description: "Gujarati New Year" },
    { title: "Bhai Dooj", date: "2026-11-11", type: "OPTIONAL", isOptional: true, description: "Celebration of sibling bonds" },
    { title: "Guru Nanak Jayanti", date: "2026-11-24", type: "PUBLIC", isOptional: false, description: "Birth of Guru Nanak Dev Ji" },
    { title: "Christmas Day", date: "2026-12-25", type: "PUBLIC", isOptional: false, description: "Celebration of the birth of Jesus Christ" },
  ],
  2027: [
    { title: "New Year's Day", date: "2027-01-01", type: "OPTIONAL", isOptional: true, description: "First day of the year" },
    { title: "Makar Sankranti / Pongal", date: "2027-01-14", type: "PUBLIC", isOptional: false, description: "Harvest festival" },
    { title: "Republic Day", date: "2027-01-26", type: "PUBLIC", isOptional: false, description: "Constitution of India celebration" },
    { title: "Maha Shivaratri", date: "2027-03-06", type: "PUBLIC", isOptional: false, description: "Celebration of Lord Shiva" },
    { title: "Holi", date: "2027-03-23", type: "PUBLIC", isOptional: false, description: "Festival of Colors" },
    { title: "Good Friday", date: "2027-03-26", type: "PUBLIC", isOptional: false, description: "Christian holy day" },
    { title: "Id-ul-Fitr (Ramzan Eid)", date: "2027-03-10", type: "PUBLIC", isOptional: false, description: "Islamic festival" },
    { title: "Mahavir Jayanti", date: "2027-04-19", type: "PUBLIC", isOptional: false, description: "Birth of Lord Mahavira" },
    { title: "Buddha Purnima", date: "2027-05-20", type: "PUBLIC", isOptional: false, description: "Birth of Gautama Buddha" },
    { title: "Independence Day", date: "2027-08-15", type: "PUBLIC", isOptional: false, description: "Indian Independence Day" },
    { title: "Janmashtami", date: "2027-08-25", type: "PUBLIC", isOptional: false, description: "Birth of Lord Krishna" },
    { title: "Mahatma Gandhi Jayanti", date: "2027-10-02", type: "PUBLIC", isOptional: false, description: "Gandhi Jayanti" },
    { title: "Dussehra", date: "2027-10-10", type: "PUBLIC", isOptional: false, description: "Vijayadashami festival" },
    { title: "Diwali", date: "2027-10-29", type: "PUBLIC", isOptional: false, description: "Festival of Lights" },
    { title: "Guru Nanak Jayanti", date: "2027-11-14", type: "PUBLIC", isOptional: false, description: "Birth of Guru Nanak" },
    { title: "Christmas Day", date: "2027-12-25", type: "PUBLIC", isOptional: false, description: "Christmas Day" },
  ],
  2028: [
    { title: "New Year's Day", date: "2028-01-01", type: "OPTIONAL", isOptional: true, description: "First day of the year" },
    { title: "Makar Sankranti / Pongal", date: "2028-01-14", type: "PUBLIC", isOptional: false, description: "Harvest festival" },
    { title: "Republic Day", date: "2028-01-26", type: "PUBLIC", isOptional: false, description: "Republic Day" },
    { title: "Maha Shivaratri", date: "2028-02-23", type: "PUBLIC", isOptional: false, description: "Maha Shivaratri" },
    { title: "Holi", date: "2028-03-11", type: "PUBLIC", isOptional: false, description: "Festival of Colors" },
    { title: "Good Friday", date: "2028-04-14", type: "PUBLIC", isOptional: false, description: "Good Friday" },
    { title: "Independence Day", date: "2028-08-15", type: "PUBLIC", isOptional: false, description: "Independence Day" },
    { title: "Mahatma Gandhi Jayanti", date: "2028-10-02", type: "PUBLIC", isOptional: false, description: "Gandhi Jayanti" },
    { title: "Dussehra", date: "2028-09-29", type: "PUBLIC", isOptional: false, description: "Vijayadashami" },
    { title: "Diwali", date: "2028-10-17", type: "PUBLIC", isOptional: false, description: "Festival of Lights" },
    { title: "Guru Nanak Jayanti", date: "2028-11-02", type: "PUBLIC", isOptional: false, description: "Guru Nanak Jayanti" },
    { title: "Christmas Day", date: "2028-12-25", type: "PUBLIC", isOptional: false, description: "Christmas Day" },
  ],
};

/**
 * Parses raw iCalendar (ICS) text feed from Google Calendar.
 */
function parseIcsCalendarData(icsText: string, targetYear: number): ParsedHolidayItem[] {
  const events: ParsedHolidayItem[] = [];
  const lines = icsText.split(/\r\n|\n|\r/);

  let inEvent = false;
  let summary = "";
  let dtstart = "";
  let dtend = "";
  let uid = "";
  let description = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line === "BEGIN:VEVENT") {
      inEvent = true;
      summary = "";
      dtstart = "";
      dtend = "";
      uid = "";
      description = "";
    } else if (line === "END:VEVENT") {
      inEvent = false;

      if (summary && dtstart) {
        // Date format in ICS is usually YYYYMMDD or YYYYMMDDTHHMMSSZ
        const cleanDateStr = dtstart.replace(/^VALUE=DATE:/, "").replace(/^.*:/, "").trim();
        if (cleanDateStr.length >= 8) {
          const y = parseInt(cleanDateStr.substring(0, 4), 10);
          const m = parseInt(cleanDateStr.substring(4, 6), 10) - 1;
          const d = parseInt(cleanDateStr.substring(6, 8), 10);

          if (y === targetYear) {
            // Normalize to Asia/Kolkata midnight (UTC date representation)
            const eventDate = new Date(y, m, d, 0, 0, 0);

            let endDate: Date | null = null;
            if (dtend) {
              const cleanEnd = dtend.replace(/^VALUE=DATE:/, "").replace(/^.*:/, "").trim();
              if (cleanEnd.length >= 8) {
                const ey = parseInt(cleanEnd.substring(0, 4), 10);
                const em = parseInt(cleanEnd.substring(4, 6), 10) - 1;
                const ed = parseInt(cleanEnd.substring(6, 8), 10);
                endDate = new Date(ey, em, ed, 0, 0, 0);
              }
            }

            const isOpt =
              summary.toLowerCase().includes("observance") ||
              summary.toLowerCase().includes("restricted") ||
              summary.toLowerCase().includes("optional");

            events.push({
              title: summary.replace(/\\,/g, ",").replace(/\\;/g, ";").trim(),
              date: eventDate,
              endDate,
              type: isOpt ? "OPTIONAL" : "PUBLIC",
              country: "IN",
              source: "GOOGLE",
              sourceId: uid || null,
              description: description ? description.replace(/\\n/g, "\n").trim() : null,
              isOptional: isOpt,
            });
          }
        }
      }
    } else if (inEvent) {
      if (line.startsWith("SUMMARY:")) {
        summary = line.substring(8);
      } else if (line.startsWith("DTSTART")) {
        dtstart = line;
      } else if (line.startsWith("DTEND")) {
        dtend = line;
      } else if (line.startsWith("UID:")) {
        uid = line.substring(4);
      } else if (line.startsWith("DESCRIPTION:")) {
        description = line.substring(12);
      }
    }
  }

  return events;
}

/**
 * Synchronizes Indian Holidays for a given year into Prisma Holiday table.
 * Preserves all company holidays and manual admin edits.
 */
export async function syncIndianHolidays(
  year: number,
  actorUserId?: string
): Promise<HolidaySyncResult> {
  let fetchedItems: ParsedHolidayItem[] = [];
  let syncSource: "GOOGLE" | "SYSTEM" = "GOOGLE";

  // 1. Attempt to fetch live from Google Public Calendar iCal feed
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(GOOGLE_ICAL_FEED_URL, {
      signal: controller.signal,
      headers: { "User-Agent": "MDZ-CRM-HolidaySync/1.0" },
      cache: "no-store",
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const icsText = await res.text();
      const parsed = parseIcsCalendarData(icsText, year);
      if (parsed.length > 0) {
        fetchedItems = parsed;
        syncSource = "GOOGLE";
      }
    }
  } catch (netErr) {
    console.warn(
      `[HolidaySync] External Google Calendar feed unreachable for year ${year}. Using built-in SYSTEM fallback dataset.`,
      netErr
    );
  }

  // 2. Fallback to built-in SYSTEM dataset if Google feed was unavailable or returned empty
  if (fetchedItems.length === 0) {
    syncSource = "SYSTEM";
    const staticList = STATIC_INDIAN_HOLIDAYS_DATASET[year] || [];
    fetchedItems = staticList.map((item) => {
      const [y, m, d] = item.date.split("-").map(Number);
      const holidayDate = new Date(y, m - 1, d, 0, 0, 0);

      return {
        title: item.title,
        date: holidayDate,
        endDate: null,
        type: item.type || "PUBLIC",
        country: "IN",
        state: item.state || null,
        source: "SYSTEM",
        sourceId: `sys-${year}-${item.title.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
        description: item.description || null,
        isOptional: Boolean(item.isOptional),
      };
    });
  }

  // 3. Fetch existing holidays in Prisma DB for this year
  const yearStart = new Date(year, 0, 1, 0, 0, 0);
  const yearEnd = new Date(year, 11, 31, 23, 59, 59);

  const existingHolidays = await prisma.holiday.findMany({
    where: {
      date: { gte: yearStart, lte: yearEnd },
    },
  });

  let createdCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;

  // 4. Upsert holidays while strictly protecting COMPANY and ADMIN created records
  for (const item of fetchedItems) {
    const itemDay = item.date.getDate();
    const itemMonth = item.date.getMonth();
    const itemYear = item.date.getFullYear();

    // Check matching existing record by title and date
    const existing = existingHolidays.find((ex) => {
      const exD = new Date(ex.date);
      const sameDay =
        exD.getFullYear() === itemYear &&
        exD.getMonth() === itemMonth &&
        exD.getDate() === itemDay;
      const sameTitle = ex.title.trim().toLowerCase() === item.title.trim().toLowerCase();
      return sameDay && sameTitle;
    });

    if (existing) {
      // PRESERVATION RULE: Never overwrite manual COMPANY or ADMIN created holidays
      if (
        existing.type === "COMPANY" ||
        existing.type === "CUSTOM" ||
        existing.source === "ADMIN" ||
        existing.source === "MANUAL"
      ) {
        skippedCount++;
        continue;
      }

      // Update system/google metadata while preserving active state
      await prisma.holiday.update({
        where: { id: existing.id },
        data: {
          description: item.description || existing.description,
          source: syncSource,
          sourceId: item.sourceId || existing.sourceId,
          endDate: item.endDate || existing.endDate,
          isOptional: item.isOptional,
          type: item.type,
          updatedAt: new Date(),
        },
      });
      updatedCount++;
    } else {
      // Create new imported holiday
      await prisma.holiday.create({
        data: {
          title: item.title,
          date: item.date,
          endDate: item.endDate || null,
          type: item.type,
          country: "IN",
          state: item.state || null,
          source: syncSource,
          sourceId: item.sourceId || null,
          description: item.description || null,
          isActive: true,
          isOptional: item.isOptional,
          createdById: actorUserId || null,
        },
      });
      createdCount++;
    }
  }

  const totalInDb = await prisma.holiday.count({
    where: { date: { gte: yearStart, lte: yearEnd } },
  });

  // 5. Create ActivityEvent audit log
  try {
    if (actorUserId) {
      await prisma.activityEvent.create({
        data: {
          eventType: "HOLIDAY_SYNC_COMPLETED",
          actorId: actorUserId,
          entityType: "HOLIDAY",
          entityId: `sync-${year}`,
          metadataJson: JSON.stringify({
            year,
            source: syncSource,
            fetched: fetchedItems.length,
            created: createdCount,
            updated: updatedCount,
            skipped: skippedCount,
            totalInDb,
          }),
        },
      });
    }
  } catch (auditErr) {
    console.warn("[HolidaySync] Failed to log activity event:", auditErr);
  }

  return {
    success: true,
    year,
    fetched: fetchedItems.length,
    created: createdCount,
    updated: updatedCount,
    skipped: skippedCount,
    total: totalInDb,
    source: syncSource,
    message: `Synchronized ${fetchedItems.length} holidays for ${year} from ${syncSource} source (${createdCount} created, ${updatedCount} updated, ${skippedCount} preserved).`,
  };
}
