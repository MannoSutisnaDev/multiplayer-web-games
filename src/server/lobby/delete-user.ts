import prisma from "@/server/db";
import { leaveLobby } from "@/server/lobby/utility";

const usersToDelete = new Map<string, NodeJS.Timeout>();

export function scheduleDelete(userId: string) {
  if (usersToDelete.get(userId)) {
    return;
  }
  const seconds = 1000 * 300;
  const timeout = setTimeout(async () => {
    await leaveLobby(userId);
    await prisma.user.delete({
      where: { id: userId },
    });
    usersToDelete.delete(userId);
  }, seconds);
  usersToDelete.set(userId, timeout);
}

export function removeScheduledDelete(userId: string) {
  const timeout = usersToDelete.get(userId);
  if (!timeout) {
    return;
  }
  clearTimeout(timeout);
  usersToDelete.delete(userId);
}
