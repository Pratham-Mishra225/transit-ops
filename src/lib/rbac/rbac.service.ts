import { prisma } from "@/lib/prisma";
import { ApplicationRole, UserProfile } from "@prisma/client";

export async function updateUserRole(userId: string, newRole: ApplicationRole): Promise<UserProfile> {
  const user = await prisma.userProfile.findFirst({
    where: {
      OR: [{ id: userId }, { authUserId: userId }]
    }
  });

  if (!user) {
    throw new Error("User not found");
  }

  return prisma.userProfile.update({
    where: { id: user.id },
    data: { role: newRole }
  });
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  return prisma.userProfile.findFirst({
    where: {
      OR: [{ id: userId }, { authUserId: userId }]
    }
  });
}
