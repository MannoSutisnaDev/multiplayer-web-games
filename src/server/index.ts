import next, { NextApiHandler } from "next";

import prisma from "@/server/db";
import { app, io, server } from "@/server/init";
import {
  sendUpdatedLobbies,
  sendUpdatedLobby,
  updateUserData,
} from "@/server/lobby/utility";
import { SocketServerSide } from "@/server/types";

const port: number = parseInt(process.env.PORT || "3000", 10);
const dev: boolean = process.env.NODE_ENV !== "production";
const nextApp = next({ dev });
const nextHandler: NextApiHandler = nextApp.getRequestHandler();

import { rebuildGames as rebuildCheckerGames } from "@/server/games/checkers/CheckersRepository";

nextApp.prepare().then(async () => {
  await rebuildCheckerGames();
  io.on("connection", (socket: SocketServerSide) => {
    socket.data.sessionId = socket.handshake.auth?.sessionId;
    const asyncExecution = async () => {
      const user = await updateUserData(socket);
      if (!user || !user.joinedLobbyId) {
        return;
      }
      await prisma.user.update({
        where: { id: user.id },
        data: { connected: true },
      });
      sendUpdatedLobby(user.joinedLobbyId);
      sendUpdatedLobbies();
    };
    asyncExecution();
  });

  app.all("*", (req: any, res: any) => nextHandler(req, res));

  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});
