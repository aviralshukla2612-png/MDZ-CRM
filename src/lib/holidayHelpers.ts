export interface HolidayEntity {
  id: string;
  title: string;
  date: Date | string;
  endDate?: Date | string | null;
  type?: string; // PUBLIC, STATE, COMPANY, OPTIONAL, CUSTOM
  country?: string | null;
  state?: string | null;
  source?: string; // GOOGLE, SYSTEM, ADMIN, MANUAL
  description?: string | null;
  isActive?: boolean;
  isOptional?: boolean;
}

/**
 * Checks if a specific holiday is applicable to an employee based on company policy and state.
 */
export function isApplicableHoliday(
  holiday: HolidayEntity,
  employeeState?: string | null
): boolean {
  if (holiday.isActive === false) return false;

  const hType = (holiday.type || "PUBLIC").toUpperCase();

  // Company holidays and Nationwide Public holidays apply to everyone
  if (hType === "COMPANY" || hType === "CUSTOM") return true;

  // If no state is specified on the holiday, it is a nationwide holiday (applies to all)
  if (!holiday.state || holiday.state.trim() === "" || holiday.state.toUpperCase() === "ALL") {
    return true;
  }

  // If employee has no state configured, default to nationwide / general inclusion
  if (!employeeState || employeeState.trim() === "") {
    return true;
  }

  // Check state match (case-insensitive)
  return holiday.state.trim().toLowerCase() === employeeState.trim().toLowerCase();
}

/**
 * Normalizes a date into YYYY-MM-DD string in Asia/Kolkata (IST) timezone.
 */
export function formatToKolkataDateString(dInput: Date | string): string {
  const d = new Date(dInput);
  if (isNaN(d.getTime())) return "";

  // Offset to UTC+5:30
  const istOffsetMs = (5 * 60 + 30) * 60 * 1000;
  const istDate = new Date(d.getTime() + istOffsetMs);

  const y = istDate.getUTCFullYear();
  const m = String(istDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(istDate.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Calculates working days in a month taking into account Sundays and employee-applicable holidays.
 * Working Days = Calendar Days in Month - Sundays - Applicable Unique Holidays (excluding Sunday collisions)
 */
export function calculateWorkingDaysInMonth(
  year: number,
  monthIndex: number, // 0 = Jan, 11 = Dec
  holidays: HolidayEntity[],
  employeeState?: string | null
): {
  totalCalendarDays: number;
  sundaysCount: number;
  applicableHolidaysCount: number;
  workingDays: number;
  applicableHolidays: HolidayEntity[];
  offDaysSet: Set<number>;
} {
  const totalCalendarDays = new Date(year, monthIndex + 1, 0).getDate();

  // 1. Identify all Sundays in the month
  const sundayDaysSet = new Set<number>();
  for (let day = 1; day <= totalCalendarDays; day++) {
    const dayOfWeek = new Date(year, monthIndex, day).getDay();
    if (dayOfWeek === 0) {
      sundayDaysSet.add(day);
    }
  }

  // 2. Filter applicable holidays in this specific month
  const monthHolidays = holidays.filter((h) => {
    if (!h.date) return false;
    const d = new Date(h.date);
    return (
      d.getFullYear() === year &&
      d.getMonth() === monthIndex &&
      isApplicableHoliday(h, employeeState)
    );
  });

  // 3. Merge Sundays and unique holiday calendar days (prevent double deduction if a holiday falls on Sunday)
  const uniqueOffDaysSet = new Set<number>(sundayDaysSet);
  const applicableHolidays: HolidayEntity[] = [];

  monthHolidays.forEach((h) => {
    const d = new Date(h.date);
    const dayNum = d.getDate();
    applicableHolidays.push(h);
    uniqueOffDaysSet.add(dayNum);
  });

  const totalOffDays = uniqueOffDaysSet.size;
  const workingDays = Math.max(0, totalCalendarDays - totalOffDays);

  return {
    totalCalendarDays,
    sundaysCount: sundayDaysSet.size,
    applicableHolidaysCount: applicableHolidays.length,
    workingDays,
    applicableHolidays,
    offDaysSet: uniqueOffDaysSet,
  };
}

/**
 * Calculates accurate attendance percentage.
 */
export function calculateAttendancePercentage(
  daysPresent: number,
  workingDays: number
): number {
  if (workingDays <= 0) return 100;
  const rate = (daysPresent / workingDays) * 100;
  return Math.min(100, Math.round(rate * 10) / 10);
}

/**
 * Calculates effective leave days consumed by a leave request, excluding Sundays and applicable holidays.
 */
export function calculateEffectiveLeaveDays(
  startDateInput: Date | string,
  endDateInput: Date | string,
  holidays: HolidayEntity[],
  employeeState?: string | null
): {
  totalRequestedDays: number;
  effectiveLeaveDays: number;
  holidayDaysInSpan: number;
  sundaysInSpan: number;
} {
  const start = new Date(startDateInput);
  const end = new Date(endDateInput);

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
    return {
      totalRequestedDays: 0,
      effectiveLeaveDays: 0,
      holidayDaysInSpan: 0,
      sundaysInSpan: 0,
    };
  }

  let totalRequestedDays = 0;
  let effectiveLeaveDays = 0;
  let holidayDaysInSpan = 0;
  let sundaysInSpan = 0;

  const current = new Date(start);
  while (current <= end) {
    totalRequestedDays++;
    const dayOfWeek = current.getDay();
    const isSunday = dayOfWeek === 0;

    const isHoliday = holidays.some((h) => {
      const hd = new Date(h.date);
      return (
        hd.getFullYear() === current.getFullYear() &&
        hd.getMonth() === current.getMonth() &&
        hd.getDate() === current.getDate() &&
        isApplicableHoliday(h, employeeState)
      );
    });

    if (isSunday) {
      sundaysInSpan++;
    } else if (isHoliday) {
      holidayDaysInSpan++;
    } else {
      effectiveLeaveDays++;
    }

    current.setDate(current.getDate() + 1);
  }

  return {
    totalRequestedDays,
    effectiveLeaveDays,
    holidayDaysInSpan,
    sundaysInSpan,
  };
}
