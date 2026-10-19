import fs from "fs";
import path from "path";

export interface ClientDeliveryStatus {
  id: string;
  clientCode: string;
  clientName: string;
  target: number;
  done: number;
  pending: number;
  inProgress: number;
  onHold: number;
  overdue: number;
  completionPct: number;
  missingLinks: number;
  unassigned: number;
}

export interface DeliveryMasterData {
  monthYear: string;
  subtitle: string;
  driveUrl?: string;
  clientStatusList: ClientDeliveryStatus[];
  updatedAt?: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const FILE_PATH = path.join(DATA_DIR, "delivery-master.json");

export const DEFAULT_GOOGLE_SHEET_URL =
  "https://docs.google.com/spreadsheets/d/1j3wK1YdRaqG9Xi3P4ynXdrV1RrlTw86C/edit?gid=1693502346#gid=1693502346";

export const DEFAULT_16_CLIENTS: ClientDeliveryStatus[] = [
  { id: "cl-isc", clientCode: "ISC", clientName: "ISC", target: 23, done: 0, pending: 23, inProgress: 0, onHold: 0, overdue: 0, completionPct: 0, missingLinks: 0, unassigned: 23 },
  { id: "cl-flx", clientCode: "FLX", clientName: "FLX", target: 30, done: 0, pending: 30, inProgress: 0, onHold: 0, overdue: 0, completionPct: 0, missingLinks: 0, unassigned: 30 },
  { id: "cl-ajc", clientCode: "AJC", clientName: "AJC", target: 10, done: 0, pending: 10, inProgress: 0, onHold: 0, overdue: 0, completionPct: 0, missingLinks: 0, unassigned: 10 },
  { id: "cl-icb", clientCode: "ICB", clientName: "ICB", target: 29, done: 0, pending: 29, inProgress: 0, onHold: 0, overdue: 0, completionPct: 0, missingLinks: 0, unassigned: 29 },
  { id: "cl-am", clientCode: "AM", clientName: "AM Lifestyle", target: 15, done: 0, pending: 15, inProgress: 0, onHold: 0, overdue: 0, completionPct: 0, missingLinks: 0, unassigned: 15 },
  { id: "cl-mdz", clientCode: "MDZ", clientName: "Millionaire Dizital", target: 45, done: 0, pending: 45, inProgress: 0, onHold: 0, overdue: 0, completionPct: 0, missingLinks: 0, unassigned: 45 },
  { id: "cl-xs", clientCode: "XS", clientName: "XS Brands", target: 15, done: 0, pending: 15, inProgress: 0, onHold: 0, overdue: 0, completionPct: 0, missingLinks: 0, unassigned: 15 },
  { id: "cl-kmua", clientCode: "KMUA", clientName: "KMUA Academy", target: 0, done: 0, pending: 0, inProgress: 0, onHold: 0, overdue: 0, completionPct: 0, missingLinks: 0, unassigned: 0 },
  { id: "cl-se", clientCode: "SE", clientName: "Signature Events", target: 20, done: 0, pending: 20, inProgress: 0, onHold: 0, overdue: 0, completionPct: 0, missingLinks: 0, unassigned: 20 },
  { id: "cl-jp", clientCode: "JP", clientName: "JP Enterprises", target: 10, done: 0, pending: 10, inProgress: 0, onHold: 0, overdue: 0, completionPct: 0, missingLinks: 0, unassigned: 10 },
  { id: "cl-ml", clientCode: "ML", clientName: "Modern Living", target: 7, done: 0, pending: 7, inProgress: 0, onHold: 0, overdue: 0, completionPct: 0, missingLinks: 0, unassigned: 7 },
  { id: "cl-ae", clientCode: "AE", clientName: "Aesthetic Era", target: 0, done: 0, pending: 0, inProgress: 0, onHold: 0, overdue: 0, completionPct: 0, missingLinks: 0, unassigned: 0 },
  { id: "cl-ala", clientCode: "ALA", clientName: "ALA Studios", target: 7, done: 0, pending: 7, inProgress: 0, onHold: 0, overdue: 0, completionPct: 0, missingLinks: 0, unassigned: 7 },
  { id: "cl-vl", clientCode: "VL", clientName: "Vikram Lathiya Brand", target: 60, done: 0, pending: 60, inProgress: 0, onHold: 0, overdue: 0, completionPct: 0, missingLinks: 0, unassigned: 60 },
  { id: "cl-rg", clientCode: "RG", clientName: "RG Growth Capital", target: 0, done: 0, pending: 0, inProgress: 0, onHold: 0, overdue: 0, completionPct: 0, missingLinks: 0, unassigned: 0 },
  { id: "cl-rs", clientCode: "RS", clientName: "RS", target: 21, done: 0, pending: 21, inProgress: 0, onHold: 0, overdue: 0, completionPct: 0, missingLinks: 0, unassigned: 21 },
];

function ensureDirectoryExists() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function getDeliveryMasterData(): DeliveryMasterData {
  try {
    ensureDirectoryExists();
    if (fs.existsSync(FILE_PATH)) {
      const fileContent = fs.readFileSync(FILE_PATH, "utf-8");
      const parsed = JSON.parse(fileContent);
      if (parsed && Array.isArray(parsed.clientStatusList) && parsed.clientStatusList.length > 0) {
        let changed = false;
        // If driveUrl is missing or default generic drive, set to live Google Sheet
        if (!parsed.driveUrl || parsed.driveUrl === "https://drive.google.com") {
          parsed.driveUrl = DEFAULT_GOOGLE_SHEET_URL;
          changed = true;
        }
        // If clientStatusList contains old placeholder codes or was inflated by older auto-injection (e.g. 832 total planned), reset to official 16 clients (292)
        const hasLegacyCodes = parsed.clientStatusList.some((r: any) =>
          ["RK", "DM", "VK", "AK", "SM"].includes(r.clientCode)
        );
        const totalPlanned = parsed.clientStatusList.reduce(
          (acc: number, r: any) => acc + (Number(r.target) || 0),
          0
        );
        if (hasLegacyCodes || totalPlanned > 350) {
          parsed.clientStatusList = DEFAULT_16_CLIENTS;
          changed = true;
        }
        if (changed) {
          saveDeliveryMasterData(parsed);
        }
        return parsed;
      }
    }
  } catch (err) {
    console.error("Error reading delivery-master.json:", err);
  }

  // Return default seeded data matching live Google Sheet
  const defaultData: DeliveryMasterData = {
    monthYear: "October 2026",
    subtitle: "October 2026 working plan • counts update from Production Log • all task completion times and Google Drive links are manually entered",
    driveUrl: DEFAULT_GOOGLE_SHEET_URL,
    clientStatusList: DEFAULT_16_CLIENTS,
    updatedAt: new Date().toISOString(),
  };

  saveDeliveryMasterData(defaultData);
  return defaultData;
}

export function saveDeliveryMasterData(data: Partial<DeliveryMasterData>): DeliveryMasterData {
  try {
    ensureDirectoryExists();
    const existing = fs.existsSync(FILE_PATH)
      ? JSON.parse(fs.readFileSync(FILE_PATH, "utf-8"))
      : {
          monthYear: "October 2026",
          subtitle: "October 2026 working plan • counts update from Production Log • all task completion times and Google Drive links are manually entered",
          clientStatusList: DEFAULT_16_CLIENTS,
        };

    const merged: DeliveryMasterData = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString(),
    };

    fs.writeFileSync(FILE_PATH, JSON.stringify(merged, null, 2), "utf-8");
    return merged;
  } catch (err) {
    console.error("Error writing delivery-master.json:", err);
    return {
      monthYear: "October 2026",
      subtitle: "October 2026 working plan",
      clientStatusList: DEFAULT_16_CLIENTS,
    };
  }
}
