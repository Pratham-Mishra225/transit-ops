import { prisma } from "@/lib/prisma";
import { Settings } from "@prisma/client";

type SettingsUpdateInput = {
  depotName: string;
  currency: string;
  distanceUnit: string;
};

export async function getSettings(): Promise<Settings> {
  let settings = await prisma.settings.findFirst();
  
  if (!settings) {
    settings = await prisma.settings.create({
      data: {
        depotName: "TransitOps Main Depot",
        currency: "USD",
        distanceUnit: "km",
      }
    });
  }
  
  return settings;
}

export async function updateSettings(data: SettingsUpdateInput): Promise<Settings> {
  const existing = await prisma.settings.findFirst();

  if (existing) {
    return prisma.settings.update({
      where: { id: existing.id },
      data
    });
  } else {
    return prisma.settings.create({
      data
    });
  }
}
