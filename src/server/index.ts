import { Lobby } from "@prisma/client";
import next, { NextApiHandler } from "next";

import prisma from "@/server/db";
import { app, io, server } from "@/server/init";
import { setPhase } from "@/server/lobby/phases/adjust-phase";
import { PhaseEnterUsername } from "@/server/lobby/phases/enter-username";
import { PhaseLobbies } from "@/server/lobby/phases/lobbies";
import { SocketServerSide } from "@/server/types";

const port: number = parseInt(process.env.PORT || "3000", 10);
const dev: boolean = process.env.NODE_ENV !== "production";
const nextApp = next({ dev });
const nextHandler: NextApiHandler = nextApp.getRequestHandler();

nextApp.prepare().then(async () => {
  io.on("connection", (socket: SocketServerSide) => {
    const asyncExecution = async () => {
      const sessionId = socket.handshake.auth?.sessionId;
      const user = await prisma.user.findFirst({
        where: {
          id: { equals: sessionId },
        },
      });
      if (!sessionId || !user) {
        setPhase(socket, PhaseEnterUsername);
        return;
      }
      let lobby: Lobby | null = null;
      if (user.joinedLobbyId) {
        lobby = await prisma.lobby.findFirst({
          where: { id: user.joinedLobbyId },
        });
      }
      socket.data.sessionId = sessionId;
      if (!lobby) {
        setPhase(socket, PhaseLobbies);
      } else {
        //Todo
      }
      socket.emit("UpdateUserData", {
        sessionId,
        lobbyId: lobby?.id,
      });
    };
    asyncExecution();

    socket.on("disconnect", () => {
      console.log(`Disconected: ${socket.data?.sessionId}`);
    });
  });

  app.all("*", (req: any, res: any) => nextHandler(req, res));

  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});
