import { Request } from "express";

import prisma from "@/server/db";

export const routeGuard = async (req: Request) => {
  let match = ["/", "/lobbies"].includes(req.url);
  if (!match) {
    const patterns = [/^\/lobbies\/.*/];
    for (const pattern of patterns) {
      if (new RegExp(pattern).test(req.url)) {
        match = true;
        break;
      }
    }
  }
  if (!match) {
    return;
  }
  const sessionId = req?.cookies?.sessionId ?? "";
  const user = await prisma.user.findFirst({
    where: {
      id: sessionId,
    },
    include: {
      GamePlayer: true,
    },
  });
  if (user?.GamePlayer?.lobbyId) {
    req.url = `/lobbies/${user.GamePlayer.lobbyId}`;
  } else if (user) {
    req.url = "/lobbies";
  } else {
    req.url = "/";
  }
};
