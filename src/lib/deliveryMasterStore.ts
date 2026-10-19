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
  clientStatusList: ClientDeliveryStatus[];
  updatedAt?: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const FILE_PATH = path.join(DATA_DIR, "delivery-master.json");

export const DEFAULT_16_CLIENTS: ClientDeliveryStatus[] = [
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
  { id: "cl-rk", clientCode: "RK", clientName: "RK Ventures", target: 30, done: 0, pending: 30, inProgress: 0, onHold: 0, overdue: 0, completionPct: 0, missingLinks: 0, unassigned: 30 },
  { id: "cl-dm", clientCode: "DM", clientName: "DM Holdings", target: 25, done: 0, pending: 25, inProgress: 0, onHold: 0, overdue: 0, completionPct: 0, missingLinks: 0, unassigned: 25 },
  { id: "cl-vk", clientCode: "VK", clientName: "VK Media", target: 20, done: 0, pending: 20, inProgress: 0, onHold: 0, overdue: 0, completionPct: 0, missingLinks: 0, unassigned: 20 },
  { id: "cl-ak", clientCode: "AK", clientName: "AK Global", target: 20, done: 0, pending: 20, inProgress: 0, onHold: 0, overdue: 0, completionPct: 0, missingLinks: 0, unassigned: 20 },
  { id: "cl-sm", clientCode: "SM", clientName: "SM Creations", target: 18, done: 0, pending: 18, inProgress: 0, onHold: 0, overdue: 0, completionPct: 0, missingLinks: 0, unassigned: 18 },
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
        return parsed;
      }
    }
  } catch (err) {
    console.error("Error reading delivery-master.json:", err);
  }

  // Return default seeded data
  const defaultData: DeliveryMasterData = {
    monthYear: "October 2026",
    subtitle: "October 2026 working plan • counts update from Production Log • all task completion times and Google Drive links are manually entered",
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
