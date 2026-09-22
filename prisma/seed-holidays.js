const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addCol(table, colDef) {
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "${table}" ADD COLUMN ${colDef};`);
    console.log(`+ Column ensured: ${colDef.split(' ')[0]}`);
  } catch (e) {
    // Column already exists, safe to ignore
  }
}

const DATASET = {
  2025: [
    { title: "New Year's Day", date: "2025-01-01", type: "OPTIONAL", isOptional: true, description: "First day of the year" },
    { title: "Makar Sankranti / Pongal", date: "2025-01-14", type: "PUBLIC", isOptional: false, description: "Harvest festival" },
    { title: "Republic Day", date: "2025-01-26", type: "PUBLIC", isOptional: false, description: "National holiday commemorating Constitution of India" },
    { title: "Maha Shivaratri", date: "2025-02-26", type: "PUBLIC", isOptional: false, description: "Celebration of Lord Shiva" },
    { title: "Holi", date: "2025-03-14", type: "PUBLIC", isOptional: false, description: "Festival of Colors" },
    { title: "Id-ul-Fitr (Ramzan Eid)", date: "2025-03-31", type: "PUBLIC", isOptional: false, description: "Islamic festival" },
    { title: "Mahavir Jayanti", date: "2025-04-10", type: "PUBLIC", isOptional: false, description: "Birth of Lord Mahavira" },
    { title: "Good Friday", date: "2025-04-18", type: "PUBLIC", isOptional: false, description: "Christian holy day" },
    { title: "Buddha Purnima", date: "2025-05-12", type: "PUBLIC", isOptional: false, description: "Birth of Gautama Buddha" },
    { title: "Bakrid / Eid al-Adha", date: "2025-06-07", type: "PUBLIC", isOptional: false, description: "Feast of Sacrifice" },
    { title: "Muharram", date: "2025-07-06", type: "PUBLIC", isOptional: false, description: "Islamic New Year observance" },
    { title: "Independence Day", date: "2025-08-15", type: "PUBLIC", isOptional: false, description: "Indian Independence Day" },
    { title: "Raksha Bandhan", date: "2025-08-09", type: "OPTIONAL", isOptional: true, description: "Sibling festival" },
    { title: "Janmashtami", date: "2025-08-16", type: "PUBLIC", isOptional: false, description: "Birth of Lord Krishna" },
    { title: "Ganesh Chaturthi", date: "2025-08-27", type: "PUBLIC", isOptional: false, description: "Ganesh festival" },
    { title: "Milad un-Nabi (Id-e-Milad)", date: "2025-09-05", type: "PUBLIC", isOptional: false, description: "Prophet Muhammad Birthday" },
    { title: "Mahatma Gandhi Jayanti", date: "2025-10-02", type: "PUBLIC", isOptional: false, description: "Gandhi Jayanti" },
    { title: "Maha Navami / Dussehra", date: "2025-10-02", type: "PUBLIC", isOptional: false, description: "Dussehra festival" },
    { title: "Diwali (Deepavali)", date: "2025-10-20", type: "PUBLIC", isOptional: false, description: "Festival of Lights" },
    { title: "Govardhan Puja / Nutan Varsh", date: "2025-10-22", type: "PUBLIC", isOptional: false, description: "Gujarati New Year" },
    { title: "Bhai Dooj", date: "2025-10-23", type: "OPTIONAL", isOptional: true, description: "Celebration of sibling bonds" },
    { title: "Guru Nanak Jayanti", date: "2025-11-05", type: "PUBLIC", isOptional: false, description: "Birth of Guru Nanak" },
    { title: "Christmas Day", date: "2025-12-25", type: "PUBLIC", isOptional: false, description: "Christmas celebration" }
  ],
  2026: [
    { title: "New Year's Day", date: "2026-01-01", type: "OPTIONAL", isOptional: true, description: "First day of the year" },
    { title: "Makar Sankranti / Pongal", date: "2026-01-14", type: "PUBLIC", isOptional: false, description: "Harvest festival" },
    { title: "Republic Day", date: "2026-01-26", type: "PUBLIC", isOptional: false, description: "Constitution celebration" },
    { title: "Maha Shivaratri", date: "2026-02-15", type: "PUBLIC", isOptional: false, description: "Lord Shiva celebration" },
    { title: "Holi", date: "2026-03-04", type: "PUBLIC", isOptional: false, description: "Festival of Colors" },
    { title: "Id-ul-Fitr (Ramzan Eid)", date: "2026-03-20", type: "PUBLIC", isOptional: false, description: "Ramzan Eid" },
    { title: "Mahavir Jayanti", date: "2026-03-31", type: "PUBLIC", isOptional: false, description: "Lord Mahavira celebration" },
    { title: "Good Friday", date: "2026-04-03", type: "PUBLIC", isOptional: false, description: "Good Friday" },
    { title: "Buddha Purnima", date: "2026-05-01", type: "PUBLIC", isOptional: false, description: "Gautama Buddha birthday" },
    { title: "Bakrid / Eid al-Adha", date: "2026-05-27", type: "PUBLIC", isOptional: false, description: "Feast of Sacrifice" },
    { title: "Muharram", date: "2026-06-25", type: "PUBLIC", isOptional: false, description: "Islamic New Year" },
    { title: "Independence Day", date: "2026-08-15", type: "PUBLIC", isOptional: false, description: "Indian Independence Day" },
    { title: "Milad un-Nabi (Id-e-Milad)", date: "2026-08-26", type: "PUBLIC", isOptional: false, description: "Prophet Muhammad Birthday" },
    { title: "Raksha Bandhan", date: "2026-08-28", type: "OPTIONAL", isOptional: true, description: "Sibling festival" },
    { title: "Janmashtami", date: "2026-09-04", type: "PUBLIC", isOptional: false, description: "Birth of Lord Krishna" },
    { title: "Ganesh Chaturthi", date: "2026-09-14", type: "PUBLIC", isOptional: false, description: "Ganesh festival" },
    { title: "Mahatma Gandhi Jayanti", date: "2026-10-02", type: "PUBLIC", isOptional: false, description: "Gandhi Jayanti" },
    { title: "Maha Navami / Dussehra", date: "2026-10-20", type: "PUBLIC", isOptional: false, description: "Vijayadashami festival" },
    { title: "Diwali (Deepavali)", date: "2026-11-08", type: "PUBLIC", isOptional: false, description: "Festival of Lights" },
    { title: "Govardhan Puja / Nutan Varsh", date: "2026-11-10", type: "PUBLIC", isOptional: false, description: "Gujarati New Year" },
    { title: "Bhai Dooj", date: "2026-11-11", type: "OPTIONAL", isOptional: true, description: "Celebration of sibling bonds" },
    { title: "Guru Nanak Jayanti", date: "2026-11-24", type: "PUBLIC", isOptional: false, description: "Birth of Guru Nanak" },
    { title: "Christmas Day", date: "2026-12-25", type: "PUBLIC", isOptional: false, description: "Christmas celebration" }
  ],
  2027: [
    { title: "New Year's Day", date: "2027-01-01", type: "OPTIONAL", isOptional: true, description: "First day of the year" },
    { title: "Makar Sankranti / Pongal", date: "2027-01-14", type: "PUBLIC", isOptional: false, description: "Harvest festival" },
    { title: "Republic Day", date: "2027-01-26", type: "PUBLIC", isOptional: false, description: "Constitution celebration" },
    { title: "Maha Shivaratri", date: "2027-03-06", type: "PUBLIC", isOptional: false, description: "Lord Shiva celebration" },
    { title: "Holi", date: "2027-03-23", type: "PUBLIC", isOptional: false, description: "Festival of Colors" },
    { title: "Independence Day", date: "2027-08-15", type: "PUBLIC", isOptional: false, description: "Independence Day" },
    { title: "Janmashtami", date: "2027-08-25", type: "PUBLIC", isOptional: false, description: "Birth of Lord Krishna" },
    { title: "Gandhi Jayanti", date: "2027-10-02", type: "PUBLIC", isOptional: false, description: "Gandhi Jayanti" },
    { title: "Dussehra", date: "2027-10-10", type: "PUBLIC", isOptional: false, description: "Dussehra" },
    { title: "Diwali", date: "2027-10-29", type: "PUBLIC", isOptional: false, description: "Festival of Lights" },
    { title: "Christmas Day", date: "2027-12-25", type: "PUBLIC", isOptional: false, description: "Christmas Day" }
  ]
};

async function main() {
  console.log('--- Ensuring Holiday Schema Columns ---');
  await addCol('Holiday', 'endDate DATETIME');
  await addCol('Holiday', 'country TEXT DEFAULT "IN"');
  await addCol('Holiday', 'state TEXT');
  await addCol('Holiday', 'source TEXT DEFAULT "SYSTEM"');
  await addCol('Holiday', 'sourceId TEXT');
  await addCol('Holiday', 'description TEXT');
  await addCol('Holiday', 'isActive BOOLEAN DEFAULT 1');
  await addCol('Holiday', 'isOptional BOOLEAN DEFAULT 0');
  await addCol('Holiday', 'createdById TEXT');
  await addCol('Holiday', 'createdAt DATETIME DEFAULT CURRENT_TIMESTAMP');
  await addCol('Holiday', 'updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP');

  console.log('--- Seeding Festivals & Holidays ---');
  let count = 0;
  for (const year of Object.keys(DATASET)) {
    for (const item of DATASET[year]) {
      const [y, m, d] = item.date.split('-').map(Number);
      const hDate = new Date(y, m - 1, d, 0, 0, 0);
      
      const existing = await prisma.holiday.findFirst({
        where: { title: item.title, date: hDate }
      });
      
      if (!existing) {
        await prisma.holiday.create({
          data: {
            title: item.title,
            date: hDate,
            type: item.type,
            country: 'IN',
            source: 'SYSTEM',
            sourceId: `sys-${year}-${item.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
            description: item.description,
            isActive: true,
            isOptional: Boolean(item.isOptional)
          }
        });
        count++;
      }
    }
  }
  const total = await prisma.holiday.count();
  console.log(`✅ Successfully seeded ${count} holidays! Total in Database: ${total}`);
}

main().then(() => prisma.$disconnect()).catch((e) => { console.error(e); prisma.$disconnect(); });
